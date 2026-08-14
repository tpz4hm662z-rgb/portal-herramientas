/* Scientific constants for the Lee et al. simple anthropometric estimator. */
"use strict";

const MUSCLE_SCIENCE_CONFIG = Object.freeze({
    leeCoefficients: Object.freeze({
        weightKg: 0.244,
        heightM: 7.80,
        male: 6.6,
        ageYears: -0.098,
        intercept: -3.3
    }),
    populationAdjustmentsKg: Object.freeze({
        white_hispanic: 0,
        asian: -1.2,
        african_american: 1.4
    }),
    uncoveredPopulationGroups: Object.freeze([
        "other", "mixed", "unknown", "prefer_not_to_say"
    ]),
    ageYears: Object.freeze({ min: 20, max: 81 }),
    /* Unit guard, not a physiological eligibility range: catches cm-as-m input. */
    maximumHeightM: 3,
    extendedBmiThreshold: 30,
    modelSEE: 2.8,
    validationStatuses: Object.freeze({
        PRIMARY: "primary",
        EXTENDED_BMI: "extended_bmi",
        NOT_APPLICABLE_AGE: "not_applicable_age",
        INVALID_INPUT: "invalid_input",
        PHYSIOLOGICALLY_INVALID: "physiologically_invalid"
    })
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = MUSCLE_SCIENCE_CONFIG;
}
