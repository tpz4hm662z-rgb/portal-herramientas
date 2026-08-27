(function exposeFetalWeightScience(root) {
    "use strict";

    var config = root.ImoancyFetalWeightScienceConfig;

    if (!config) {
        throw new Error("ImoancyFetalWeightScienceConfig must be loaded before ImoancyFetalWeightScience.");
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

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim() !== "";
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

    function copyIssue(issue) {
        var result = {};

        Object.keys(issue).forEach(function copyProperty(key) {
            result[key] = issue[key];
        });

        return result;
    }

    function copyIssues(issues) {
        return issues.map(copyIssue);
    }

    function issue(code, field) {
        return {
            code: code,
            field: field
        };
    }

    function statusForIssues(errors) {
        var hasMissing = errors.some(function isMissing(item) {
            return item.code.indexOf("missing_") === 0;
        });
        var hasInvalid = errors.some(function isInvalid(item) {
            return item.code.indexOf("invalid_") === 0 ||
                item.code.indexOf("non_") === 0 ||
                item.code === "unsupported_population";
        });

        return hasInvalid ? "invalid" : (hasMissing ? "incomplete" : "invalid");
    }

    function readOwnFiniteNumber(source, field, errors) {
        if (!hasOwn(source, field) || typeof source[field] === "undefined") {
            errors.push(issue("missing_" + field, field));
            return null;
        }

        if (!isFiniteNumber(source[field])) {
            errors.push(issue("invalid_" + field, field));
            return null;
        }

        return source[field];
    }

    function readOwnPositiveNumber(source, field, errors) {
        var value = readOwnFiniteNumber(source, field, errors);

        if (value !== null && value <= 0) {
            errors.push(issue("non_positive_" + field, field));
            return null;
        }

        return value;
    }

    function gestationalAgeSemantics() {
        return {
            inputConvention: config.gestationalAge.inputConvention,
            source: config.gestationalAge.source,
            redatedFromBiometrics: false,
            redatedFromEstimatedFetalWeight: false
        };
    }

    function normalizeGestationalAge(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var weeks;
        var days;
        var totalDays;
        var continuousWeeks;

        if (!validRecord) {
            errors.push(issue("invalid_gestationalAge", "gestationalAge"));
        }

        weeks = readOwnFiniteNumber(source, "weeks", errors);
        days = readOwnFiniteNumber(source, "days", errors);

        if (weeks !== null && (!Number.isInteger(weeks) || weeks < 0)) {
            errors.push(issue("invalid_weeks", "weeks"));
        }

        if (days !== null && (!Number.isInteger(days) ||
            days < config.gestationalAge.additionalDaysMinimum ||
            days > config.gestationalAge.additionalDaysMaximum)) {
            errors.push(issue("invalid_days", "days"));
        }

        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: statusForIssues(errors),
                gestationalAge: null,
                errors: copyIssues(errors),
                semantics: gestationalAgeSemantics()
            });
        }

        totalDays = (weeks * 7) + days;
        continuousWeeks = totalDays / 7;

        if (!Number.isFinite(totalDays) || !Number.isFinite(continuousWeeks)) {
            errors.push(issue("non_finite_gestational_age", "gestationalAge"));
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: "invalid",
                gestationalAge: null,
                errors: copyIssues(errors),
                semantics: gestationalAgeSemantics()
            });
        }

        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: "valid",
            gestationalAge: {
                weeks: weeks,
                days: days,
                totalDays: totalDays,
                continuousWeeks: continuousWeeks,
                unit: "exact_weeks"
            },
            errors: [],
            semantics: gestationalAgeSemantics()
        });
    }

    function createBiometricResult(status, biometrics, errors) {
        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: status,
            biometrics: biometrics,
            errors: copyIssues(errors),
            units: {
                input: "mm",
                output: "cm"
            },
            semantics: {
                conversionOnly: true,
                changesGestationalAge: false
            }
        });
    }

    function convertBiometricsMmToCm(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var hcMm;
        var acMm;
        var flMm;
        var converted;

        if (!validRecord) {
            errors.push(issue("invalid_biometrics", "biometrics"));
        }

        hcMm = readOwnPositiveNumber(source, "hcMm", errors);
        acMm = readOwnPositiveNumber(source, "acMm", errors);
        flMm = readOwnPositiveNumber(source, "flMm", errors);

        if (errors.length > 0) {
            return createBiometricResult(statusForIssues(errors), null, errors);
        }

        converted = {
            hcCm: hcMm / 10,
            acCm: acMm / 10,
            flCm: flMm / 10
        };

        if (!isFiniteNumber(converted.hcCm) ||
            !isFiniteNumber(converted.acCm) ||
            !isFiniteNumber(converted.flCm)) {
            errors.push(issue("non_finite_biometric_conversion", "biometrics"));
            return createBiometricResult("invalid", null, errors);
        }

        return createBiometricResult("valid", converted, []);
    }

    function hadlockSemantics() {
        return {
            resultType: config.hadlock.outputType,
            isEstimatedFetalWeight: true,
            isActualFetalWeight: false,
            isDiagnosis: false,
            changesGestationalAge: false,
            averagesMultipleMethods: false
        };
    }

    function createHadlockResult(status, inputs, estimate, errors) {
        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: status,
            inputs: inputs,
            estimate: estimate,
            errors: copyIssues(errors),
            units: {
                hc: "cm",
                ac: "cm",
                fl: "cm",
                efw: "g"
            },
            semantics: hadlockSemantics(),
            source: config.sources[config.hadlock.sourceId]
        });
    }

    function calculateHadlockHcAcFl(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var hcCm;
        var acCm;
        var flCm;
        var normalizedInputs;
        var coefficients = config.hadlock.coefficients;
        var interaction;
        var log10Efw;
        var efwGrams;

        if (!validRecord) {
            errors.push(issue("invalid_biometrics", "biometrics"));
        }

        hcCm = readOwnPositiveNumber(source, "hcCm", errors);
        acCm = readOwnPositiveNumber(source, "acCm", errors);
        flCm = readOwnPositiveNumber(source, "flCm", errors);
        normalizedInputs = {
            hcCm: hcCm,
            acCm: acCm,
            flCm: flCm
        };

        if (errors.length > 0) {
            return createHadlockResult(statusForIssues(errors), normalizedInputs, null, errors);
        }

        interaction = acCm * flCm;
        log10Efw = coefficients.intercept +
            (coefficients.acTimesFl * interaction) +
            (coefficients.hc * hcCm) +
            (coefficients.ac * acCm) +
            (coefficients.fl * flCm);
        efwGrams = Math.pow(10, log10Efw);

        if (!isFiniteNumber(interaction) ||
            !isFiniteNumber(log10Efw) ||
            !isFiniteNumber(efwGrams) ||
            efwGrams <= 0) {
            errors.push(issue("non_finite_hadlock_result", "estimatedFetalWeight"));
            return createHadlockResult("invalid", normalizedInputs, null, errors);
        }

        return createHadlockResult("valid", normalizedInputs, {
            type: config.hadlock.outputType,
            efwGrams: efwGrams,
            log10Efw: log10Efw,
            source: config.efwSources.imoancyHadlock,
            method: config.efwMethods.hadlockHcAcFl,
            biometrics: {
                hcCm: hcCm,
                acCm: acCm,
                flCm: flCm
            }
        }, []);
    }

    function observationSemantics() {
        return {
            resultType: config.hadlock.outputType,
            isEstimate: true,
            isActualFetalWeight: false,
            methodIsInferred: false,
            changesGestationalAge: false
        };
    }

    function createObservationResult(status, mode, observation, errors) {
        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: status,
            mode: mode,
            observation: observation,
            errors: copyIssues(errors),
            units: {
                efw: "g",
                biometrics: "cm"
            },
            semantics: observationSemantics()
        });
    }

    function resolveEfwObservation(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var mode;
        var calculation;
        var efwGrams;
        var method;

        if (!validRecord) {
            errors.push(issue("invalid_input", "input"));
        }

        if (!hasOwn(source, "mode") || typeof source.mode === "undefined") {
            errors.push(issue("missing_mode", "mode"));
            return createObservationResult(statusForIssues(errors), null, null, errors);
        }

        mode = source.mode;

        if (mode !== "biometrics" && mode !== "report_entered") {
            errors.push(issue("invalid_mode", "mode"));
            return createObservationResult("invalid", mode, null, errors);
        }

        if (mode === "biometrics") {
            if (!hasOwn(source, "biometrics") || typeof source.biometrics === "undefined") {
                errors.push(issue("missing_biometrics", "biometrics"));
                return createObservationResult("incomplete", mode, null, errors);
            }

            calculation = calculateHadlockHcAcFl(source.biometrics);

            if (calculation.status !== "valid") {
                return createObservationResult(calculation.status, mode, null, calculation.errors);
            }

            return createObservationResult("valid", mode, calculation.estimate, []);
        }

        efwGrams = readOwnPositiveNumber(source, "efwGrams", errors);

        if (hasOwn(source, "reportedMethod") && typeof source.reportedMethod !== "undefined" &&
            source.reportedMethod !== null && !isNonEmptyString(source.reportedMethod)) {
            errors.push(issue("invalid_reportedMethod", "reportedMethod"));
        }

        if (errors.length > 0) {
            return createObservationResult(statusForIssues(errors), mode, null, errors);
        }

        method = hasOwn(source, "reportedMethod") && isNonEmptyString(source.reportedMethod)
            ? source.reportedMethod.trim()
            : config.efwMethods.unknown;

        return createObservationResult("valid", mode, {
            type: config.hadlock.outputType,
            efwGrams: efwGrams,
            log10Efw: null,
            source: config.efwSources.reportEntered,
            method: method,
            biometrics: null
        }, []);
    }

    function calculateLmsAtContinuousWeeks(continuousWeeks) {
        var scaledAge = continuousWeeks / 10;
        var inverseSquare = Math.pow(scaledAge, -2);
        var logScaledAge = Math.log(scaledAge);
        var lambdaConfig = config.reference.lms.lambda;
        var muConfig = config.reference.lms.mu;
        var sigmaConfig = config.reference.lms.sigma;

        return {
            lambda: lambdaConfig.constant +
                (lambdaConfig.inverseSquare * inverseSquare) +
                (lambdaConfig.logInverseSquare * logScaledAge * inverseSquare),
            mu: muConfig.constant +
                (muConfig.squareRoot * Math.sqrt(continuousWeeks)) +
                (muConfig.cubic * Math.pow(continuousWeeks, 3)),
            sigma: sigmaConfig.constant +
                (sigmaConfig.inverseSquare * inverseSquare) +
                (sigmaConfig.logInverseSquare * logScaledAge * inverseSquare)
        };
    }

    function validatePopulation(source, errors) {
        if (!hasOwn(source, "pregnancyPopulation") || typeof source.pregnancyPopulation === "undefined") {
            errors.push(issue("missing_pregnancyPopulation", "pregnancyPopulation"));
            return null;
        }

        if (source.pregnancyPopulation !== config.populationScope.supportedPopulation) {
            errors.push(issue(
                source.pregnancyPopulation === "multiple" ? "unsupported_population" : "invalid_pregnancyPopulation",
                "pregnancyPopulation"
            ));
            return source.pregnancyPopulation;
        }

        return source.pregnancyPopulation;
    }

    function normalizeAgeFromContainer(source, errors) {
        var ageResult;

        if (!hasOwn(source, "gestationalAge")) {
            errors.push(issue("missing_gestationalAge", "gestationalAge"));
            return null;
        }

        ageResult = normalizeGestationalAge(source.gestationalAge);

        if (ageResult.status !== "valid") {
            ageResult.errors.forEach(function addAgeIssue(ageIssue) {
                errors.push(ageIssue);
            });
            return null;
        }

        return ageResult.gestationalAge;
    }

    function isAgeWithinReference(age) {
        var domain = config.reference.gestationalAgeDomain;
        return age.totalDays >= domain.minimumTotalDays &&
            age.totalDays <= domain.maximumTotalDays;
    }

    function referenceDescriptor(method) {
        var compatibility;

        if (method === config.efwMethods.hadlockHcAcFl) {
            compatibility = "compatible_hadlock_hc_ac_fl";
        } else if (method === config.efwMethods.unknown) {
            compatibility = "unknown_report_method";
        } else {
            compatibility = "reported_method_not_confirmed_as_hadlock_hc_ac_fl";
        }

        return {
            id: config.reference.id,
            version: config.reference.version,
            doi: config.sources[config.reference.sourceId].doi,
            population: config.reference.population,
            compatibleEfwMethod: config.reference.compatibleEfwMethod,
            observedEfwMethodCompatibility: compatibility
        };
    }

    function referenceSemantics() {
        return {
            isReferencePosition: true,
            isDiagnosis: false,
            classifiesFetalGrowth: false,
            changesGestationalAge: false,
            predictsFutureWeight: false,
            extrapolatesOutsidePublishedDomain: false,
            percentileDependsOnReference: true,
            tailPresentation: {
                preservesComputedPercentile: true,
                appliesArtificialClamp: false,
                sourceDefinedPresentationCutoffs: false
            }
        };
    }

    function createReferencePosition(status, age, observation, reference, zScore, percentile, errors) {
        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: status,
            efwGrams: observation ? observation.efwGrams : null,
            efwSource: observation ? observation.source : null,
            efwMethod: observation ? observation.method : null,
            gestationalAge: age,
            referenceId: reference.id,
            referenceVersion: reference.version,
            reference: reference,
            zScore: zScore,
            percentile: percentile,
            errors: copyIssues(errors),
            units: {
                efw: "g",
                gestationalAge: "exact_weeks",
                percentile: "%"
            },
            semantics: referenceSemantics()
        });
    }

    // Numerical Recipes complementary-error-function approximation. It is used
    // only to express the LMS Z-score as a continuous reference percentile.
    function standardNormalCdf(z) {
        var x;
        var t;
        var tau;
        var erf;

        if (z === 0) {
            return 0.5;
        }

        x = Math.abs(z) / Math.sqrt(2);
        t = 1 / (1 + (0.5 * x));
        tau = t * Math.exp(
            (-x * x) - 1.26551223 +
            (t * (1.00002368 +
            (t * (0.37409196 +
            (t * (0.09678418 +
            (t * (-0.18628806 +
            (t * (0.27886807 +
            (t * (-1.13520398 +
            (t * (1.48851587 +
            (t * (-0.82215223 +
            (t * 0.17087277)))))))))))))))))
        );
        erf = z >= 0 ? 1 - tau : tau - 1;
        return 0.5 * (1 + erf);
    }

    function getIntergrowthHadlockLms(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var population;
        var age;
        var lms;

        if (!validRecord) {
            errors.push(issue("invalid_input", "input"));
        }

        population = validatePopulation(source, errors);

        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                gestationalAge: null,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                lms: null,
                errors: copyIssues(errors)
            });
        }

        age = normalizeAgeFromContainer(source, errors);

        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                gestationalAge: age,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                lms: null,
                errors: copyIssues(errors)
            });
        }

        if (!isAgeWithinReference(age)) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: "reference_out_of_range",
                gestationalAge: age,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                lms: null,
                errors: [issue("reference_out_of_range", "gestationalAge")]
            });
        }

        lms = calculateLmsAtContinuousWeeks(age.continuousWeeks);

        if (!isFiniteNumber(lms.lambda) || !isFiniteNumber(lms.mu) ||
            !isFiniteNumber(lms.sigma) || lms.mu <= 0 || lms.sigma <= 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: "invalid",
                gestationalAge: age,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                lms: null,
                errors: [issue("non_finite_lms_result", "lms")]
            });
        }

        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: "valid",
            gestationalAge: age,
            referenceId: config.reference.id,
            referenceVersion: config.reference.version,
            lms: lms,
            errors: []
        });
    }

    function hasReferenceMathematicalSupport(efwGrams, lms) {
        var y;

        if (!isFiniteNumber(efwGrams) || efwGrams <= 0 || !isRecord(lms)) {
            return false;
        }

        y = Math.log(efwGrams);

        // The published response is Y=ln(EFW). Y/mu must be positive for the
        // Box-Cox power; this is a mathematical support check, not a clinical limit.
        return isFiniteNumber(y) && y > 0 &&
            isFiniteNumber(lms.mu) && lms.mu > 0 &&
            isFiniteNumber(lms.sigma) && lms.sigma > 0 &&
            isFiniteNumber(lms.lambda);
    }

    function hasEfwReferenceMathematicalSupport(input) {
        var source = isRecord(input) ? input : null;
        var lmsResult;

        if (!source || !hasOwn(source, "efwGrams")) {
            return false;
        }

        lmsResult = getIntergrowthHadlockLms({
            pregnancyPopulation: source.pregnancyPopulation,
            gestationalAge: source.gestationalAge
        });

        return lmsResult.status === "valid" &&
            hasReferenceMathematicalSupport(source.efwGrams, lmsResult.lms);
    }

    function readObservation(source, errors) {
        var observation;
        var efwGrams;

        if (!hasOwn(source, "efwObservation") || !isRecord(source.efwObservation)) {
            errors.push(issue("missing_efwObservation", "efwObservation"));
            return null;
        }

        observation = source.efwObservation;
        efwGrams = readOwnPositiveNumber(observation, "efwGrams", errors);

        if (!hasOwn(observation, "source") || !isNonEmptyString(observation.source)) {
            errors.push(issue("invalid_efwSource", "efwObservation.source"));
        }

        if (!hasOwn(observation, "method") || !isNonEmptyString(observation.method)) {
            errors.push(issue("invalid_efwMethod", "efwObservation.method"));
        }

        if (errors.length > 0) {
            return null;
        }

        return {
            efwGrams: efwGrams,
            source: observation.source,
            method: observation.method
        };
    }

    function positionEfwInReference(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var errors = [];
        var population;
        var age;
        var observation;
        var reference;
        var lms;
        var y;
        var ratio;
        var zScore;
        var percentile;

        if (!validRecord) {
            errors.push(issue("invalid_input", "input"));
        }

        population = validatePopulation(source, errors);

        if (errors.length > 0) {
            reference = referenceDescriptor(config.efwMethods.unknown);
            return createReferencePosition(
                errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                null,
                null,
                reference,
                null,
                null,
                errors
            );
        }

        age = normalizeAgeFromContainer(source, errors);
        observation = readObservation(source, errors);
        reference = referenceDescriptor(observation ? observation.method : config.efwMethods.unknown);

        if (errors.length > 0) {
            return createReferencePosition(
                errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                age,
                observation,
                reference,
                null,
                null,
                errors
            );
        }

        if (reference.observedEfwMethodCompatibility ===
            "reported_method_not_confirmed_as_hadlock_hc_ac_fl") {
            return createReferencePosition(
                "incompatible_efw_method",
                age,
                observation,
                reference,
                null,
                null,
                [issue("efw_method_incompatible_with_reference", "efwObservation.method")]
            );
        }

        if (!isAgeWithinReference(age)) {
            return createReferencePosition(
                "reference_out_of_range",
                age,
                observation,
                reference,
                null,
                null,
                [issue("reference_out_of_range", "gestationalAge")]
            );
        }

        lms = calculateLmsAtContinuousWeeks(age.continuousWeeks);

        if (!hasReferenceMathematicalSupport(observation.efwGrams, lms)) {
            return createReferencePosition(
                "invalid",
                age,
                observation,
                reference,
                null,
                null,
                [issue("efw_outside_reference_mathematical_support", "efwGrams")]
            );
        }

        y = Math.log(observation.efwGrams);
        ratio = y / lms.mu;
        zScore = lms.lambda === 0
            ? Math.log(ratio) / lms.sigma
            : (Math.pow(ratio, lms.lambda) - 1) / (lms.sigma * lms.lambda);
        percentile = standardNormalCdf(zScore) * 100;

        if (!isFiniteNumber(zScore) || !isFiniteNumber(percentile)) {
            return createReferencePosition(
                "invalid",
                age,
                observation,
                reference,
                null,
                null,
                [issue("non_finite_reference_position", "referencePosition")]
            );
        }

        return createReferencePosition("valid", age, observation, reference, zScore, percentile, []);
    }

    function efwAtZScore(lms, zScore) {
        var logEfw;
        var base;

        if (lms.lambda === 0) {
            logEfw = lms.mu * Math.exp(lms.sigma * zScore);
        } else {
            base = 1 + (zScore * lms.sigma * lms.lambda);

            if (!isFiniteNumber(base) || base <= 0) {
                return null;
            }

            logEfw = lms.mu * Math.pow(base, 1 / lms.lambda);
        }

        if (!isFiniteNumber(logEfw)) {
            return null;
        }

        var efwGrams = Math.exp(logEfw);
        return isFiniteNumber(efwGrams) && efwGrams > 0 ? efwGrams : null;
    }

    function quantileForCentile(percentile) {
        return config.reference.standardNormalQuantiles["p" + String(percentile)];
    }

    function generateReferenceCentiles(input) {
        var lmsResult = getIntergrowthHadlockLms(input);
        var centiles;
        var errors = [];

        if (lmsResult.status !== "valid") {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: lmsResult.status,
                gestationalAge: lmsResult.gestationalAge,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                referenceCentiles: null,
                errors: copyIssues(lmsResult.errors),
                semantics: {
                    valuesAreReferenceCentiles: true,
                    valuesAreExpectedIndividualWeights: false,
                    derivedFromSameLmsEngine: true
                }
            });
        }

        centiles = config.reference.supportedReferenceCentiles.map(function makeCentile(percentile) {
            var zScore = quantileForCentile(percentile);
            var efwGrams = efwAtZScore(lmsResult.lms, zScore);

            if (efwGrams === null) {
                errors.push(issue("non_finite_reference_centile", "P" + String(percentile)));
            }

            return {
                percentile: percentile,
                zScore: zScore,
                efwGrams: efwGrams,
                unit: "g"
            };
        });

        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: "invalid",
                gestationalAge: lmsResult.gestationalAge,
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                referenceCentiles: null,
                errors: copyIssues(errors),
                semantics: {
                    valuesAreReferenceCentiles: true,
                    valuesAreExpectedIndividualWeights: false,
                    derivedFromSameLmsEngine: true
                }
            });
        }

        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: "valid",
            gestationalAge: lmsResult.gestationalAge,
            referenceId: config.reference.id,
            referenceVersion: config.reference.version,
            referenceCentiles: centiles,
            errors: [],
            semantics: {
                valuesAreReferenceCentiles: true,
                valuesAreExpectedIndividualWeights: false,
                derivedFromSameLmsEngine: true
            }
        });
    }

    function evaluationSemantics() {
        return {
            educationalEstimationOnly: true,
            replacesObstetricInterpretation: false,
            isDiagnosis: false,
            recommendsUrgentCareFromPercentileAlone: false,
            changesGestationalAge: false,
            predictsFutureWeight: false
        };
    }

    function evaluateFetalWeight(input) {
        var validRecord = isRecord(input);
        var source = validRecord ? input : {};
        var ageResult;
        var observationInput;
        var observationResult;
        var position;
        var errors = [];

        if (!validRecord) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: "invalid",
                pregnancyPopulation: null,
                inputMode: null,
                gestationalAge: null,
                efwObservation: null,
                referencePosition: null,
                errors: [issue("invalid_input", "input")],
                semantics: evaluationSemantics()
            });
        }

        if (!hasOwn(source, "pregnancyPopulation")) {
            errors.push(issue("missing_pregnancyPopulation", "pregnancyPopulation"));
        } else if (source.pregnancyPopulation !== config.populationScope.supportedPopulation) {
            errors.push(issue(
                source.pregnancyPopulation === "multiple" ? "unsupported_population" : "invalid_pregnancyPopulation",
                "pregnancyPopulation"
            ));
        }

        // Population is the first gate. A multiple pregnancy must not cause
        // the singleton estimation/reference path to execute, even internally.
        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                pregnancyPopulation: hasOwn(source, "pregnancyPopulation") ? source.pregnancyPopulation : null,
                inputMode: hasOwn(source, "inputMode") ? source.inputMode : null,
                gestationalAge: null,
                efwObservation: null,
                referencePosition: null,
                errors: copyIssues(errors),
                semantics: evaluationSemantics()
            });
        }

        if (!hasOwn(source, "gestationalAge")) {
            errors.push(issue("missing_gestationalAge", "gestationalAge"));
            ageResult = null;
        } else {
            ageResult = normalizeGestationalAge(source.gestationalAge);
            if (ageResult.status !== "valid") {
                ageResult.errors.forEach(function addError(item) {
                    errors.push(item);
                });
            }
        }

        if (!hasOwn(source, "inputMode")) {
            errors.push(issue("missing_inputMode", "inputMode"));
            observationResult = null;
        } else if (source.inputMode === "biometrics") {
            observationInput = {
                mode: "biometrics",
                biometrics: hasOwn(source, "biometrics") ? source.biometrics : undefined
            };
            observationResult = resolveEfwObservation(observationInput);
        } else if (source.inputMode === "report_entered") {
            observationInput = {
                mode: "report_entered",
                efwGrams: hasOwn(source, "efwGrams") ? source.efwGrams : undefined
            };
            if (hasOwn(source, "reportedMethod")) {
                observationInput.reportedMethod = source.reportedMethod;
            }
            observationResult = resolveEfwObservation(observationInput);
        } else {
            errors.push(issue("invalid_inputMode", "inputMode"));
            observationResult = null;
        }

        if (observationResult && observationResult.status !== "valid") {
            observationResult.errors.forEach(function addObservationError(item) {
                errors.push(item);
            });
        }

        if (errors.length > 0) {
            return deepFreeze({
                scienceVersion: config.scienceVersion,
                status: errors.some(function unsupported(item) {
                    return item.code === "unsupported_population";
                }) ? "unsupported_population" : statusForIssues(errors),
                pregnancyPopulation: hasOwn(source, "pregnancyPopulation") ? source.pregnancyPopulation : null,
                inputMode: hasOwn(source, "inputMode") ? source.inputMode : null,
                gestationalAge: ageResult && ageResult.status === "valid" ? ageResult.gestationalAge : null,
                efwObservation: null,
                referencePosition: null,
                errors: copyIssues(errors),
                semantics: evaluationSemantics()
            });
        }

        position = positionEfwInReference({
            pregnancyPopulation: source.pregnancyPopulation,
            gestationalAge: source.gestationalAge,
            efwObservation: observationResult.observation
        });

        return deepFreeze({
            scienceVersion: config.scienceVersion,
            status: position.status,
            pregnancyPopulation: source.pregnancyPopulation,
            inputMode: source.inputMode,
            gestationalAge: ageResult.gestationalAge,
            efwObservation: observationResult.observation,
            referencePosition: position,
            errors: copyIssues(position.errors),
            semantics: evaluationSemantics()
        });
    }

    root.ImoancyFetalWeightScience = deepFreeze({
        scienceVersion: config.scienceVersion,
        normalizeGestationalAge: normalizeGestationalAge,
        convertBiometricsMmToCm: convertBiometricsMmToCm,
        calculateHadlockHcAcFl: calculateHadlockHcAcFl,
        resolveEfwObservation: resolveEfwObservation,
        getIntergrowthHadlockLms: getIntergrowthHadlockLms,
        hasEfwReferenceMathematicalSupport: hasEfwReferenceMathematicalSupport,
        positionEfwInReference: positionEfwInReference,
        generateReferenceCentiles: generateReferenceCentiles,
        evaluateFetalWeight: evaluateFetalWeight
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
