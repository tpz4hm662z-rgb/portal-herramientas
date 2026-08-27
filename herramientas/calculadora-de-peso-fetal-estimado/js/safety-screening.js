(function exposeFetalWeightSafety(root) {
    "use strict";

    var scienceConfig = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var PREGNANCY_TYPES = Object.freeze([
        "singleton_confirmed",
        "multiple",
        "unknown"
    ]);
    var INPUT_MODES = Object.freeze(["biometrics", "report_entered"]);

    if (!scienceConfig) {
        throw new Error(
            "ImoancyFetalWeightScienceConfig must be loaded before ImoancyFetalWeightSafety."
        );
    }

    if (!science) {
        throw new Error(
            "ImoancyFetalWeightScience must be loaded before ImoancyFetalWeightSafety."
        );
    }

    if (science.scienceVersion !== scienceConfig.scienceVersion) {
        throw new Error("Fetal-weight science dependency versions do not match.");
    }

    if (
        typeof science.normalizeGestationalAge !== "function" ||
        typeof science.resolveEfwObservation !== "function" ||
        typeof science.hasEfwReferenceMathematicalSupport !== "function" ||
        !scienceConfig.reference ||
        !scienceConfig.reference.gestationalAgeDomain ||
        typeof scienceConfig.reference.gestationalAgeDomain.minimumTotalDays !== "number" ||
        typeof scienceConfig.reference.gestationalAgeDomain.maximumTotalDays !== "number"
    ) {
        throw new Error("Fetal-weight safety dependencies expose an invalid contract.");
    }

    function hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isFiniteNumber(value) {
        return typeof value === "number" && isFinite(value);
    }

    function contains(values, value) {
        return values.indexOf(value) !== -1;
    }

    function unique(values) {
        return values.filter(function keepFirst(value, index) {
            return values.indexOf(value) === index;
        });
    }

    function deepFreeze(value) {
        if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }

        Object.getOwnPropertyNames(value).forEach(function freezeProperty(key) {
            deepFreeze(value[key]);
        });

        return Object.freeze(value);
    }

    function createDecision(options) {
        return deepFreeze({
            scienceVersion: scienceConfig.scienceVersion,
            status: options.status,
            scope: options.scope,
            inputMode: options.inputMode,
            pregnancyPopulation: options.pregnancyPopulation,
            canCalculateEfw: options.canCalculateEfw,
            canPositionInReference: options.canPositionInReference,
            requiresProfessionalInterpretation: options.requiresProfessionalInterpretation,
            reasonCodes: unique(options.reasonCodes || []),
            missingFields: unique(options.missingFields || []),
            invalidFields: unique(options.invalidFields || [])
        });
    }

    function integrationError(message) {
        throw new Error("Invalid fetal-weight science integration: " + message);
    }

    function collectEngineErrorFields(errors, fallbackField) {
        var fields = [];

        if (!Array.isArray(errors) || errors.length === 0) {
            return [fallbackField];
        }

        errors.forEach(function collect(error) {
            var field;

            if (typeof error === "string") {
                field = error;
            } else if (isRecord(error) && typeof error.field === "string") {
                field = error.field;
            }

            if (!field) {
                field = fallbackField;
            }

            if (field === "weeks" || field === "days") {
                field = "gestationalAge." + field;
            } else if (field === "hcCm" || field === "acCm" || field === "flCm") {
                field = "biometrics." + field;
            }

            fields.push(field);
        });

        return unique(fields);
    }

    function validateCommonShape(context) {
        var missingFields = [];
        var invalidFields = [];
        var requiredFields = [
            "pregnancyPopulation",
            "inputMode",
            "gestationalAge",
            "seeksDiagnosis",
            "seeksClinicalInterpretation"
        ];

        if (context === undefined) {
            return {
                missingFields: ["context"],
                invalidFields: []
            };
        }

        if (!isRecord(context)) {
            return {
                missingFields: [],
                invalidFields: ["context"]
            };
        }

        requiredFields.forEach(function validateRequiredField(field) {
            if (!hasOwn(context, field)) {
                missingFields.push(field);
            }
        });

        if (
            hasOwn(context, "pregnancyPopulation") &&
            !contains(PREGNANCY_TYPES, context.pregnancyPopulation)
        ) {
            invalidFields.push("pregnancyPopulation");
        }

        if (hasOwn(context, "inputMode") && !contains(INPUT_MODES, context.inputMode)) {
            invalidFields.push("inputMode");
        }

        ["seeksDiagnosis", "seeksClinicalInterpretation"].forEach(
            function validateIntent(field) {
                if (hasOwn(context, field) && typeof context[field] !== "boolean") {
                    invalidFields.push(field);
                }
            }
        );

        if (hasOwn(context, "gestationalAge")) {
            if (!isRecord(context.gestationalAge)) {
                invalidFields.push("gestationalAge");
            } else {
                if (!hasOwn(context.gestationalAge, "weeks")) {
                    missingFields.push("gestationalAge.weeks");
                }
                if (!hasOwn(context.gestationalAge, "days")) {
                    missingFields.push("gestationalAge.days");
                }
            }
        }

        if (context.inputMode === "biometrics") {
            if (!hasOwn(context, "biometrics")) {
                missingFields.push("biometrics");
            } else if (!isRecord(context.biometrics)) {
                invalidFields.push("biometrics");
            } else {
                ["hcCm", "acCm", "flCm"].forEach(function validateBiometric(field) {
                    if (!hasOwn(context.biometrics, field)) {
                        missingFields.push("biometrics." + field);
                    }
                });
            }
        }

        if (context.inputMode === "report_entered" && !hasOwn(context, "efwGrams")) {
            missingFields.push("efwGrams");
        }

        if (
            context.inputMode === "report_entered" &&
            hasOwn(context, "reportedMethod") &&
            (
                typeof context.reportedMethod !== "string" ||
                context.reportedMethod.trim() === ""
            )
        ) {
            invalidFields.push("reportedMethod");
        }

        return {
            missingFields: unique(missingFields),
            invalidFields: unique(invalidFields)
        };
    }

    function validateWithScience(context, validation) {
        var gestationalAgeResult;
        var observationInput;
        var observationResult;

        if (
            validation.missingFields.indexOf("gestationalAge") === -1 &&
            validation.missingFields.indexOf("gestationalAge.weeks") === -1 &&
            validation.missingFields.indexOf("gestationalAge.days") === -1 &&
            validation.invalidFields.indexOf("gestationalAge") === -1
        ) {
            gestationalAgeResult = science.normalizeGestationalAge({
                weeks: context.gestationalAge.weeks,
                days: context.gestationalAge.days
            });

            if (!isRecord(gestationalAgeResult) || typeof gestationalAgeResult.status !== "string") {
                integrationError("normalizeGestationalAge returned an invalid contract.");
            }

            if (gestationalAgeResult.status !== "valid") {
                if (gestationalAgeResult.status === "incomplete") {
                    validation.missingFields = validation.missingFields.concat(
                        collectEngineErrorFields(gestationalAgeResult.errors, "gestationalAge")
                    );
                } else {
                    validation.invalidFields = validation.invalidFields.concat(
                        collectEngineErrorFields(gestationalAgeResult.errors, "gestationalAge")
                    );
                }
            }
        }

        if (
            validation.missingFields.length === 0 &&
            validation.invalidFields.length === 0
        ) {
            if (context.inputMode === "biometrics") {
                observationInput = {
                    mode: "biometrics",
                    biometrics: {
                        hcCm: context.biometrics.hcCm,
                        acCm: context.biometrics.acCm,
                        flCm: context.biometrics.flCm
                    }
                };
            } else {
                observationInput = {
                    mode: "report_entered",
                    efwGrams: context.efwGrams
                };

                if (hasOwn(context, "reportedMethod")) {
                    observationInput.reportedMethod = context.reportedMethod;
                }
            }

            observationResult = science.resolveEfwObservation(observationInput);

            if (!isRecord(observationResult) || typeof observationResult.status !== "string") {
                integrationError("resolveEfwObservation returned an invalid contract.");
            }

            if (observationResult.status !== "valid") {
                if (observationResult.status === "incomplete") {
                    validation.missingFields = validation.missingFields.concat(
                        collectEngineErrorFields(
                            observationResult.errors,
                            context.inputMode === "biometrics" ? "biometrics" : "efwGrams"
                        )
                    );
                } else {
                    validation.invalidFields = validation.invalidFields.concat(
                        collectEngineErrorFields(
                            observationResult.errors,
                            context.inputMode === "biometrics" ? "biometrics" : "efwGrams"
                        )
                    );
                }
            }
        }

        validation.missingFields = unique(validation.missingFields);
        validation.invalidFields = unique(validation.invalidFields);

        return {
            validation: validation,
            gestationalAgeResult: gestationalAgeResult,
            observationResult: observationResult
        };
    }

    /**
     * Screens scope and input completeness without returning scientific quantities.
     * This function neither diagnoses nor interprets an obstetric indication.
     */
    function screenFetalWeightContext(context) {
        var validation = validateCommonShape(context);
        var scienceValidation;
        var normalizedGestationalAge;
        var normalizedObservation;
        var isOutsideReference;
        var canCalculateEfw;
        var hasMathematicalSupport;
        var intentReasonCodes;
        var inputMode = isRecord(context) && hasOwn(context, "inputMode") &&
            contains(INPUT_MODES, context.inputMode) ? context.inputMode : null;
        var pregnancyPopulation = isRecord(context) && hasOwn(context, "pregnancyPopulation") &&
            contains(PREGNANCY_TYPES, context.pregnancyPopulation) ?
            context.pregnancyPopulation : null;

        /*
         * Once a multiple pregnancy is explicitly identified, the population
         * gate is conclusive. Do not request or evaluate singleton-only inputs.
         */
        if (pregnancyPopulation === "multiple") {
            intentReasonCodes = [
                context.seeksDiagnosis === true ? "diagnosis_requested" : null,
                context.seeksClinicalInterpretation === true ?
                    "clinical_indication_interpretation_requested" : null
            ].filter(function removeNull(value) {
                return value !== null;
            });

            return createDecision({
                status: "unsupported_population",
                scope: "unsupported_population",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: intentReasonCodes.length > 0,
                reasonCodes: ["multiple_pregnancy_not_supported"].concat(intentReasonCodes),
                missingFields: validation.missingFields,
                invalidFields: validation.invalidFields
            });
        }

        if (validation.invalidFields.length > 0) {
            return createDecision({
                status: "invalid",
                scope: "blocked",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["invalid_input"],
                missingFields: validation.missingFields,
                invalidFields: validation.invalidFields
            });
        }

        if (validation.missingFields.length > 0) {
            return createDecision({
                status: "incomplete",
                scope: "blocked",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["incomplete_input"],
                missingFields: validation.missingFields
            });
        }

        intentReasonCodes = [
            context.seeksDiagnosis ? "diagnosis_requested" : null,
            context.seeksClinicalInterpretation ?
                "clinical_indication_interpretation_requested" : null
        ].filter(function removeNull(value) {
            return value !== null;
        });

        /*
         * Population and intent gates intentionally precede any EFW calculation.
         * Shape completeness is still required, but singleton mathematics is never
         * run for an unsupported or unconfirmed population.
         */
        if (context.pregnancyPopulation === "unknown") {
            return createDecision({
                status: "singleton_confirmation_required",
                scope: "blocked_pending_population_confirmation",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: intentReasonCodes.length > 0,
                reasonCodes: ["singleton_not_confirmed"].concat(intentReasonCodes)
            });
        }

        if (intentReasonCodes.length > 0) {
            return createDecision({
                status: "professional_interpretation_required",
                scope: "professional_interpretation_required",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: true,
                reasonCodes: intentReasonCodes
            });
        }

        scienceValidation = validateWithScience(context, validation);
        validation = scienceValidation.validation;
        normalizedGestationalAge = scienceValidation.gestationalAgeResult;
        normalizedObservation = scienceValidation.observationResult;

        if (validation.invalidFields.length > 0) {
            return createDecision({
                status: "invalid",
                scope: "blocked",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["invalid_input"],
                missingFields: validation.missingFields,
                invalidFields: validation.invalidFields
            });
        }

        if (validation.missingFields.length > 0) {
            return createDecision({
                status: "incomplete",
                scope: "blocked",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["incomplete_input"],
                missingFields: validation.missingFields
            });
        }

        if (
            !isRecord(normalizedGestationalAge) ||
            normalizedGestationalAge.status !== "valid" ||
            !isRecord(normalizedGestationalAge.gestationalAge) ||
            !isFiniteNumber(normalizedGestationalAge.gestationalAge.totalDays)
        ) {
            integrationError("normalizeGestationalAge did not expose totalDays for a valid age.");
        }

        if (!isRecord(normalizedObservation) || normalizedObservation.status !== "valid" ||
            !isRecord(normalizedObservation.observation)) {
            integrationError("resolveEfwObservation did not expose an observation for valid input.");
        }

        if (normalizedObservation.observation.method !== scienceConfig.efwMethods.hadlockHcAcFl &&
            normalizedObservation.observation.method !== scienceConfig.efwMethods.unknown) {
            return createDecision({
                status: "incompatible_efw_method",
                scope: "efw_observation_without_compatible_reference",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: false,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["efw_method_incompatible_with_reference"]
            });
        }

        isOutsideReference =
            normalizedGestationalAge.gestationalAge.totalDays <
                scienceConfig.reference.gestationalAgeDomain.minimumTotalDays ||
            normalizedGestationalAge.gestationalAge.totalDays >
                scienceConfig.reference.gestationalAgeDomain.maximumTotalDays;
        canCalculateEfw = context.inputMode === "biometrics";

        if (isOutsideReference) {
            return createDecision({
                status: "reference_out_of_range",
                scope: "efw_observation_without_reference_position",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: canCalculateEfw,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["gestational_age_outside_reference_domain"]
            });
        }

        hasMathematicalSupport = science.hasEfwReferenceMathematicalSupport({
            pregnancyPopulation: pregnancyPopulation,
            gestationalAge: normalizedGestationalAge.gestationalAge,
            efwGrams: normalizedObservation.observation.efwGrams
        });

        if (typeof hasMathematicalSupport !== "boolean") {
            integrationError("hasEfwReferenceMathematicalSupport did not return a boolean.");
        }

        if (!hasMathematicalSupport) {
            return createDecision({
                status: "invalid",
                scope: "efw_observation_without_reference_position",
                inputMode: inputMode,
                pregnancyPopulation: pregnancyPopulation,
                canCalculateEfw: canCalculateEfw,
                canPositionInReference: false,
                requiresProfessionalInterpretation: false,
                reasonCodes: ["efw_outside_reference_mathematical_support"],
                invalidFields: ["efwGrams"]
            });
        }

        return createDecision({
            status: "allowed",
            scope: "educational_efw_observation_and_reference_position",
            inputMode: inputMode,
            pregnancyPopulation: pregnancyPopulation,
            canCalculateEfw: canCalculateEfw,
            canPositionInReference: true,
            requiresProfessionalInterpretation: false,
            reasonCodes: []
        });
    }

    root.ImoancyFetalWeightSafety = Object.freeze({
        scienceVersion: scienceConfig.scienceVersion,
        screenFetalWeightContext: screenFetalWeightContext
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
