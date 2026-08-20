(function (root) {
    "use strict";

    var scienceConfig = root.ImoancyWaterScienceConfig;

    if (!scienceConfig) {
        throw new Error("ImoancyWaterScienceConfig must be loaded before ImoancyWaterSafety.");
    }

    var SCIENCE_VERSION = scienceConfig.scienceVersion;

    var BOOLEAN_FIELDS = Object.freeze([
        "isPregnant",
        "isLactating",
        "hasKnownKidneyDisease",
        "hasHeartFailureOrFluidRestrictionCondition",
        "hasMedicalFluidRestriction",
        "hasRelevantAcuteIllness",
        "seeksTherapeuticRecommendation"
    ]);

    var MEDICAL_REASON_BY_FIELD = Object.freeze({
        hasKnownKidneyDisease: "known_kidney_disease",
        hasHeartFailureOrFluidRestrictionCondition: "heart_failure_or_fluid_restriction_condition",
        hasMedicalFluidRestriction: "medical_fluid_restriction",
        hasRelevantAcuteIllness: "relevant_acute_illness",
        seeksTherapeuticRecommendation: "therapeutic_recommendation_requested"
    });

    var ADULT_REFERENCE_KEYS = Object.freeze(["adult_female", "adult_male"]);
    var PREGNANCY_REFERENCE_KEYS = Object.freeze(["pregnancy"]);
    var LACTATION_REFERENCE_KEYS = Object.freeze(["lactation"]);
    var PREGNANCY_AND_LACTATION_CANDIDATES = Object.freeze([
        "pregnancy",
        "lactation"
    ]);
    var NO_REFERENCE_KEYS = Object.freeze([]);

    function hasOwn(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }

    function freezeList(values) {
        return Object.freeze(values.slice());
    }

    function createDecision(options) {
        return Object.freeze({
            scienceVersion: SCIENCE_VERSION,
            status: options.status,
            scope: options.scope,
            canShowPopulationReference: options.canShowPopulationReference,
            canGenerateIndividualGuidance: false,
            requiresProfessionalGuidance: options.requiresProfessionalGuidance,
            allowedPopulationReferenceKeys: freezeList(
                options.allowedPopulationReferenceKeys || NO_REFERENCE_KEYS
            ),
            candidatePopulationReferenceKeys: freezeList(
                options.candidatePopulationReferenceKeys || NO_REFERENCE_KEYS
            ),
            reasonCodes: freezeList(options.reasonCodes || []),
            medicalReferralReasonCodes: freezeList(
                options.medicalReferralReasonCodes || []
            ),
            missingFields: freezeList(options.missingFields || []),
            invalidFields: freezeList(options.invalidFields || [])
        });
    }

    function validateProfile(profile) {
        var missingFields = [];
        var invalidFields = [];

        if (profile === undefined) {
            return {
                missingFields: ["profile"],
                invalidFields: []
            };
        }

        if (profile === null || typeof profile !== "object" || Array.isArray(profile)) {
            return {
                missingFields: [],
                invalidFields: ["profile"]
            };
        }

        if (!hasOwn(profile, "ageYears")) {
            missingFields.push("ageYears");
        } else if (
            typeof profile.ageYears !== "number" ||
            !Number.isFinite(profile.ageYears) ||
            profile.ageYears < 0
        ) {
            invalidFields.push("ageYears");
        }

        BOOLEAN_FIELDS.forEach(function (field) {
            if (!hasOwn(profile, field)) {
                missingFields.push(field);
            } else if (typeof profile[field] !== "boolean") {
                invalidFields.push(field);
            }
        });

        return {
            missingFields: missingFields,
            invalidFields: invalidFields
        };
    }

    function collectMedicalReferralReasons(profile) {
        return Object.keys(MEDICAL_REASON_BY_FIELD).filter(function (field) {
            return profile[field];
        }).map(function (field) {
            return MEDICAL_REASON_BY_FIELD[field];
        });
    }

    /**
     * Performs safety screening only. It does not calculate hydration amounts,
     * diagnose a condition or authorize personalised/therapeutic guidance.
     *
     * Required profile fields:
     * - ageYears: finite, non-negative number
     * - isPregnant: boolean
     * - isLactating: boolean
     * - hasKnownKidneyDisease: boolean
     * - hasHeartFailureOrFluidRestrictionCondition: boolean
     * - hasMedicalFluidRestriction: boolean
     * - hasRelevantAcuteIllness: boolean
     * - seeksTherapeuticRecommendation: boolean
     *
     * Every returned decision has the same immutable shape. Reference keys are
     * identifiers only; scientific quantities remain in the science engine.
     */
    function screenHydrationContext(profile) {
        var validation = validateProfile(profile);

        if (validation.invalidFields.length > 0) {
            return createDecision({
                status: "invalid",
                scope: "blocked",
                canShowPopulationReference: false,
                requiresProfessionalGuidance: false,
                reasonCodes: ["invalid_input"],
                missingFields: validation.missingFields,
                invalidFields: validation.invalidFields
            });
        }

        if (validation.missingFields.length > 0) {
            return createDecision({
                status: "incomplete",
                scope: "blocked",
                canShowPopulationReference: false,
                requiresProfessionalGuidance: false,
                reasonCodes: ["incomplete_input"],
                missingFields: validation.missingFields
            });
        }

        var medicalReferralReasonCodes = collectMedicalReferralReasons(profile);
        var isUnsupportedMinor = profile.ageYears < scienceConfig.populationScope.minimumSupportedAgeYears;
        var needsPopulationClarification = profile.isPregnant && profile.isLactating;
        var combinedReasonCodes = medicalReferralReasonCodes.slice();

        if (isUnsupportedMinor) {
            combinedReasonCodes.push("minor_population_unsupported");
        }

        if (needsPopulationClarification) {
            combinedReasonCodes.push("pregnancy_and_lactation_require_clarification");
        }

        if (medicalReferralReasonCodes.length > 0) {
            return createDecision({
                status: "medical_referral",
                scope: "professional_guidance_required",
                canShowPopulationReference: false,
                requiresProfessionalGuidance: true,
                candidatePopulationReferenceKeys: needsPopulationClarification
                    ? PREGNANCY_AND_LACTATION_CANDIDATES
                    : NO_REFERENCE_KEYS,
                reasonCodes: combinedReasonCodes,
                medicalReferralReasonCodes: medicalReferralReasonCodes
            });
        }

        if (isUnsupportedMinor) {
            return createDecision({
                status: "unsupported_population",
                scope: "unsupported_population",
                canShowPopulationReference: false,
                requiresProfessionalGuidance: true,
                reasonCodes: combinedReasonCodes
            });
        }

        if (needsPopulationClarification) {
            return createDecision({
                status: "clarification_required",
                scope: "blocked_pending_clarification",
                canShowPopulationReference: false,
                requiresProfessionalGuidance: false,
                candidatePopulationReferenceKeys: PREGNANCY_AND_LACTATION_CANDIDATES,
                reasonCodes: combinedReasonCodes
            });
        }

        if (profile.isPregnant) {
            return createDecision({
                status: "population_reference_only",
                scope: "population_reference_only",
                canShowPopulationReference: true,
                requiresProfessionalGuidance: false,
                allowedPopulationReferenceKeys: PREGNANCY_REFERENCE_KEYS,
                reasonCodes: ["pregnancy_context"]
            });
        }

        if (profile.isLactating) {
            return createDecision({
                status: "population_reference_only",
                scope: "population_reference_only",
                canShowPopulationReference: true,
                requiresProfessionalGuidance: false,
                allowedPopulationReferenceKeys: LACTATION_REFERENCE_KEYS,
                reasonCodes: ["lactation_context"]
            });
        }

        return createDecision({
            status: "educational_scope",
            scope: "educational_only",
            canShowPopulationReference: true,
            requiresProfessionalGuidance: false,
            allowedPopulationReferenceKeys: ADULT_REFERENCE_KEYS
        });
    }

    root.ImoancyWaterSafety = Object.freeze({
        scienceVersion: SCIENCE_VERSION,
        screenHydrationContext: screenHydrationContext
    });
}(globalThis));
