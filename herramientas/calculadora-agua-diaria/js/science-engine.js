(function exposeWaterScience(root) {
    "use strict";

    var config = root.ImoancyWaterScienceConfig;

    if (!config) {
        throw new Error("ImoancyWaterScienceConfig must be loaded before ImoancyWaterScience.");
    }

    function hasOwn(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isFiniteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }

        Object.getOwnPropertyNames(value).forEach(function freezeProperty(name) {
            deepFreeze(value[name]);
        });

        return Object.freeze(value);
    }

    function normalizeOptionalText(value) {
        if (typeof value !== "string") {
            return null;
        }

        var normalized = value.trim();
        return normalized === "" ? null : normalized;
    }

    function normalizeOptionalNumber(value) {
        return isFiniteNumber(value) ? value : null;
    }

    function normalizeOptionalPositiveNumber(value) {
        return isFiniteNumber(value) && value > 0 ? value : null;
    }

    function normalizeOptionalPercentage(value) {
        return isFiniteNumber(value) && value >= 0 && value <= 100 ? value : null;
    }

    function copyIssue(issue) {
        var copy = {};

        Object.keys(issue).forEach(function copyIssueProperty(key) {
            copy[key] = issue[key];
        });

        return copy;
    }

    function copyIssues(issues) {
        return issues.map(copyIssue);
    }

    function getEfsaTotalWaterReference(group) {
        if (typeof group !== "string" || !hasOwn(config.efsa.references, group)) {
            return null;
        }

        var reference = config.efsa.references[group];

        return deepFreeze({
            scienceVersion: config.scienceVersion,
            group: reference.group,
            totalWaterLitersPerDay: reference.totalWaterLitersPerDay,
            unit: config.efsa.unit,
            referenceType: config.efsa.referenceType,
            quantity: config.efsa.quantity,
            includes: config.efsa.includes.slice(),
            applicability: {
                ambientTemperature: config.efsa.applicability.ambientTemperature,
                physicalActivity: config.efsa.applicability.physicalActivity,
                physicalActivityLevelPal: config.efsa.applicability.physicalActivityLevelPal,
                usesTemperatureCorrection: config.efsa.applicability.usesTemperatureCorrection,
                usesActivityCorrection: config.efsa.applicability.usesActivityCorrection,
                automaticallyIncludesAdditionalLosses: {
                    intenseExercise: config.efsa.applicability.automaticallyIncludesAdditionalLosses.intenseExercise,
                    highSweat: config.efsa.applicability.automaticallyIncludesAdditionalLosses.highSweat,
                    demandingEnvironmentalConditions: config.efsa.applicability.automaticallyIncludesAdditionalLosses.demandingEnvironmentalConditions
                }
            },
            semantics: {
                waterScope: config.efsa.semantics.waterScope,
                isPureWaterTarget: config.efsa.semantics.isPureWaterTarget,
                isExactIndividualNeed: config.efsa.semantics.isExactIndividualNeed,
                isPersonalizedRecommendation: config.efsa.semantics.isPersonalizedRecommendation,
                isAutomaticallyConvertedToGlasses: config.efsa.semantics.isAutomaticallyConvertedToGlasses,
                usesFixedFoodWaterPercentage: config.efsa.semantics.usesFixedFoodWaterPercentage,
                canBeAddedToObservedSweatAsDailyTarget: config.efsa.semantics.canBeAddedToObservedSweatAsDailyTarget
            },
            source: config.sources[reference.sourceId]
        });
    }

    function readRequiredNumber(source, field, errors) {
        if (!hasOwn(source, field) || typeof source[field] === "undefined") {
            errors.push({
                code: "missing_" + field,
                field: field
            });
            return null;
        }

        if (!isFiniteNumber(source[field])) {
            errors.push({
                code: "invalid_" + field,
                field: field
            });
            return null;
        }

        return source[field];
    }

    function addRangeError(errors, field, code, value) {
        errors.push({
            code: code,
            field: field,
            observedValue: value
        });
    }

    function createCalculationResult(status, inputs, computed, errors, warnings) {
        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: status,
            observationType: config.observedSweatSession.observationType,
            inputs: inputs,
            computed: computed,
            errors: copyIssues(errors),
            warnings: copyIssues(warnings),
            qualityFlags: errors.concat(warnings).map(function issueCode(issue) {
                return issue.code;
            }),
            units: {
                sweatLoss: config.observedSweatSession.sweatLossUnit,
                sweatRate: config.observedSweatSession.sweatRateUnit,
                bodyMassChange: config.observedSweatSession.bodyMassChangeUnit
            },
            semantics: {
                isSessionSpecificObservation: config.observedSweatSession.semantics.isSessionSpecificObservation,
                isDailyWaterNeed: config.observedSweatSession.semantics.isDailyWaterNeed,
                isFluidIntakePrescription: config.observedSweatSession.semantics.isFluidIntakePrescription,
                isSodiumOrElectrolytePrescription: config.observedSweatSession.semantics.isSodiumOrElectrolytePrescription,
                combinesWithEfsaReference: config.observedSweatSession.semantics.combinesWithEfsaReference
            },
            source: config.sources.nata_fluid_replacement_2017
        });
    }

    function calculateObservedSweatSession(input) {
        var source = isRecord(input) ? input : {};
        var errors = [];
        var warnings = [];
        var preWeightKg = readRequiredNumber(source, "preWeightKg", errors);
        var postWeightKg = readRequiredNumber(source, "postWeightKg", errors);
        var fluidIntakeLiters = readRequiredNumber(source, "fluidIntakeLiters", errors);
        var durationMinutes = readRequiredNumber(source, "durationMinutes", errors);
        var urineLiters = !hasOwn(source, "urineLiters") || typeof source.urineLiters === "undefined"
            ? 0
            : readRequiredNumber(source, "urineLiters", errors);
        var normalizedInputs = {
            preWeightKg: preWeightKg,
            postWeightKg: postWeightKg,
            fluidIntakeLiters: fluidIntakeLiters,
            durationMinutes: durationMinutes,
            urineLiters: urineLiters
        };
        var emptyComputed = {
            durationHours: null,
            sweatLossLiters: null,
            sweatRateLitersPerHour: null,
            bodyMassChangePercent: null
        };

        if (preWeightKg !== null && preWeightKg <= 0) {
            addRangeError(errors, "preWeightKg", "non_positive_preWeightKg", preWeightKg);
        }

        if (postWeightKg !== null && postWeightKg <= 0) {
            addRangeError(errors, "postWeightKg", "non_positive_postWeightKg", postWeightKg);
        }

        if (fluidIntakeLiters !== null && fluidIntakeLiters < 0) {
            addRangeError(errors, "fluidIntakeLiters", "negative_fluidIntakeLiters", fluidIntakeLiters);
        }

        if (durationMinutes !== null && durationMinutes <= 0) {
            addRangeError(errors, "durationMinutes", "non_positive_durationMinutes", durationMinutes);
        }

        if (urineLiters !== null && urineLiters < 0) {
            addRangeError(errors, "urineLiters", "negative_urineLiters", urineLiters);
        }

        if (errors.length > 0) {
            return createCalculationResult("error", normalizedInputs, emptyComputed, errors, warnings);
        }

        // No evidence-backed magnitude threshold was specified. Any observed
        // increase is therefore surfaced conservatively without diagnosing it.
        if (postWeightKg > preWeightKg) {
            warnings.push({
                code: "post_weight_above_pre_weight",
                field: "postWeightKg",
                observedDifferenceKg: postWeightKg - preWeightKg
            });
        }

        var durationHours = durationMinutes / 60;
        var sweatLossLiters = (preWeightKg - postWeightKg) + fluidIntakeLiters - urineLiters;
        var sweatRateLitersPerHour = sweatLossLiters / durationHours;
        var bodyMassChangePercent = ((postWeightKg - preWeightKg) / preWeightKg) * 100;

        if (!Number.isFinite(durationHours) ||
            !Number.isFinite(sweatLossLiters) ||
            !Number.isFinite(sweatRateLitersPerHour) ||
            !Number.isFinite(bodyMassChangePercent)) {
            errors.push({
                code: "non_finite_calculation",
                field: "computed"
            });
            return createCalculationResult("error", normalizedInputs, emptyComputed, errors, warnings);
        }

        if (sweatLossLiters < 0) {
            errors.push({
                code: "negative_observed_sweat_loss",
                field: "sweatLossLiters",
                observedValue: sweatLossLiters
            });
            return createCalculationResult("error", normalizedInputs, emptyComputed, errors, warnings);
        }

        return createCalculationResult(
            warnings.length > 0 ? "warning" : "valid",
            normalizedInputs,
            {
                durationHours: durationHours,
                sweatLossLiters: sweatLossLiters,
                sweatRateLitersPerHour: sweatRateLitersPerHour,
                bodyMassChangePercent: bodyMassChangePercent
            },
            errors,
            warnings
        );
    }

    function normalizeSessionContext(context) {
        var source = isRecord(context) ? context : {};

        function own(field) {
            return hasOwn(source, field) ? source[field] : undefined;
        }

        // Context is retained for interpretation only; it never changes the equations.
        return deepFreeze({
            activity: normalizeOptionalText(own("activity")),
            durationMinutes: normalizeOptionalPositiveNumber(own("durationMinutes")),
            temperatureC: normalizeOptionalNumber(own("temperatureC")),
            humidityPercent: normalizeOptionalPercentage(own("humidityPercent")),
            indoorOutdoor: normalizeOptionalText(own("indoorOutdoor")),
            perceivedIntensity: normalizeOptionalText(own("perceivedIntensity")),
            equipmentOrClothing: normalizeOptionalText(own("equipmentOrClothing")),
            notes: normalizeOptionalText(own("notes")),
            sessionDate: normalizeOptionalText(own("sessionDate"))
        });
    }

    function buildSweatPassportEntry(options) {
        var source = isRecord(options) ? options : {};
        var calculation = calculateObservedSweatSession(source.inputs);
        var contextSource = isRecord(source.context) ? source.context : {};
        var contextWithDuration = {};
        var passportWarnings = copyIssues(calculation.warnings);
        var passportQualityFlags = calculation.qualityFlags.slice();

        function addPassportWarning(code, field) {
            passportWarnings.push({ code: code, field: field });
            passportQualityFlags.push(code);
        }

        config.sessionContextFields.forEach(function copyContextField(field) {
            if (hasOwn(contextSource, field)) {
                contextWithDuration[field] = contextSource[field];
            }
        });

        if (hasOwn(contextSource, "durationMinutes")) {
            var contextDuration = normalizeOptionalPositiveNumber(contextSource.durationMinutes);

            if (contextDuration === null) {
                addPassportWarning("invalid_context_duration", "durationMinutes");
            } else if (contextDuration !== calculation.inputs.durationMinutes) {
                addPassportWarning("context_duration_mismatch", "durationMinutes");
            }
        }

        // The mathematical input is canonical, so a passport cannot retain two
        // contradictory durations for the same observation.
        contextWithDuration.durationMinutes = calculation.inputs.durationMinutes;

        var contextSessionDate = normalizeOptionalText(contextSource.sessionDate);
        var topLevelSessionDate = normalizeOptionalText(source.sessionDate);

        if (hasOwn(source, "sessionDate") && topLevelSessionDate === null) {
            addPassportWarning("invalid_session_date", "sessionDate");
        }

        if (topLevelSessionDate !== null && contextSessionDate !== null &&
            topLevelSessionDate !== contextSessionDate) {
            addPassportWarning("session_date_mismatch", "sessionDate");
        }

        contextWithDuration.sessionDate = topLevelSessionDate !== null
            ? topLevelSessionDate
            : contextSessionDate;

        var context = normalizeSessionContext(contextWithDuration);

        // IDs and timestamps are caller-owned so entry construction stays deterministic.
        return deepFreeze({
            schemaVersion: config.schemaVersions.sweatPassportEntry,
            scienceVersion: config.scienceVersion,
            id: normalizeOptionalText(source.id),
            createdAt: normalizeOptionalText(source.createdAt),
            sessionDate: context.sessionDate,
            inputs: {
                preWeightKg: calculation.inputs.preWeightKg,
                postWeightKg: calculation.inputs.postWeightKg,
                fluidIntakeLiters: calculation.inputs.fluidIntakeLiters,
                durationMinutes: calculation.inputs.durationMinutes,
                urineLiters: calculation.inputs.urineLiters
            },
            context: context,
            computed: {
                observationType: calculation.observationType,
                durationHours: calculation.computed.durationHours,
                sweatLossLiters: calculation.computed.sweatLossLiters,
                sweatRateLitersPerHour: calculation.computed.sweatRateLitersPerHour,
                bodyMassChangePercent: calculation.computed.bodyMassChangePercent
            },
            quality: {
                status: calculation.status === "valid" && passportWarnings.length > 0
                    ? "warning"
                    : calculation.status,
                errors: copyIssues(calculation.errors),
                warnings: passportWarnings
            },
            qualityFlags: passportQualityFlags,
            semantics: {
                isSessionSpecificObservation: calculation.semantics.isSessionSpecificObservation,
                isDailyWaterNeed: calculation.semantics.isDailyWaterNeed,
                isFluidIntakePrescription: calculation.semantics.isFluidIntakePrescription,
                combinesWithEfsaReference: calculation.semantics.combinesWithEfsaReference
            }
        });
    }

    function normalizeComparableText(value) {
        return typeof value === "string" ? value.toLowerCase() : value;
    }

    function compareDimension(leftValue, rightValue, numeric) {
        if (leftValue === null || rightValue === null) {
            return {
                status: "unknown",
                left: leftValue,
                right: rightValue,
                delta: null
            };
        }

        var valuesMatch = numeric
            ? leftValue === rightValue
            : normalizeComparableText(leftValue) === normalizeComparableText(rightValue);

        return deepFreeze({
            status: valuesMatch ? "match" : "different",
            left: leftValue,
            right: rightValue,
            delta: numeric && !valuesMatch ? rightValue - leftValue : null
        });
    }

    function compareSessionContexts(leftContext, rightContext) {
        var left = normalizeSessionContext(leftContext);
        var right = normalizeSessionContext(rightContext);
        var dimensions = {
            activity: compareDimension(left.activity, right.activity, false),
            durationMinutes: compareDimension(left.durationMinutes, right.durationMinutes, true),
            temperatureC: compareDimension(left.temperatureC, right.temperatureC, true),
            humidityPercent: compareDimension(left.humidityPercent, right.humidityPercent, true),
            indoorOutdoor: compareDimension(left.indoorOutdoor, right.indoorOutdoor, false),
            perceivedIntensity: compareDimension(left.perceivedIntensity, right.perceivedIntensity, false),
            equipmentOrClothing: compareDimension(left.equipmentOrClothing, right.equipmentOrClothing, false)
        };
        var matches = [];
        var differences = [];
        var unknown = [];

        Object.keys(dimensions).forEach(function classifyDimension(field) {
            if (dimensions[field].status === "match") {
                matches.push(field);
            } else if (dimensions[field].status === "different") {
                differences.push(field);
            } else {
                unknown.push(field);
            }
        });

        var status = "comparable";
        var comparable = true;

        if (differences.length > 0) {
            // Differences are observable, but no evidence-backed similarity
            // tolerances were approved. Do not turn them into a false verdict.
            status = "differences_observed";
            comparable = null;
        } else if (unknown.length > 0) {
            status = "uncertain";
            comparable = null;
        }

        // Exact matching avoids unsupported tolerance bands or equivalence coefficients.
        return deepFreeze({
            status: status,
            comparable: comparable,
            dimensions: dimensions,
            matches: matches,
            differences: differences,
            unknown: unknown,
            usesExactObservableMatches: true,
            usesNumericTolerance: false,
            canAverageAutomatically: false,
            transferability: status === "comparable"
                ? "limited_to_matching_observed_context"
                : "uncertain"
        });
    }

    root.ImoancyWaterScience = Object.freeze({
        scienceVersion: config.scienceVersion,
        getEfsaTotalWaterReference: getEfsaTotalWaterReference,
        calculateObservedSweatSession: calculateObservedSweatSession,
        normalizeSessionContext: normalizeSessionContext,
        buildSweatPassportEntry: buildSweatPassportEntry,
        compareSessionContexts: compareSessionContexts
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
