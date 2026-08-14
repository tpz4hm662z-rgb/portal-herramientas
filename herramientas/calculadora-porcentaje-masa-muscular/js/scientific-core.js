/*
 * Pure PRO v1.0 scientific engine. Estimates total skeletal muscle mass; it
 * does not measure lean mass, diagnose disease, detect sarcopenia or classify.
 * The simple Lee model is used because the advanced skinfold/circumference
 * inputs are outside v1.0. Units are kg, metres and completed years.
 */
"use strict";

const SCIENCE_CONFIG = typeof module !== "undefined" && module.exports
    ? require("./scientific-config.js")
    : MUSCLE_SCIENCE_CONFIG;
const REFERENCE_LOOKUP = typeof module !== "undefined" && module.exports
    ? require("./reference-data.js").lookupMuscleMriReference
    : lookupMuscleMriReference;

function centimetresToMetres(heightCm) {
    if (typeof heightCm !== "number" || !Number.isFinite(heightCm) || heightCm <= 0) {
        return null;
    }
    return heightCm / 100;
}

function roundForPresentation(value, decimals = 1) {
    if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(decimals) || decimals < 0) {
        return null;
    }
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
}

function emptyResult(status, warnings, population) {
    return {
        muscleKg: null, musclePercent: null, bmi: null,
        populationAdjustmentKg: population.adjustmentKg,
        populationAdjustmentApplied: population.applied,
        populationGroup: population.group,
        validationStatus: status,
        warnings,
        referenceGroup: null,
        referenceMeanPercent: null,
        referenceSdPercent: null,
        referenceEvidence: null,
        clinicalInterpretation: null,
        modelSEE: SCIENCE_CONFIG.modelSEE
    };
}

function resolvePopulation(group) {
    if (group === undefined || group === null) {
        return { valid: true, group: null, adjustmentKg: 0, applied: false,
            warning: "No population group was supplied; no specific adjustment was applied." };
    }
    if (typeof group !== "string") return { valid: false, group: null, adjustmentKg: 0, applied: false };
    if (Object.prototype.hasOwnProperty.call(SCIENCE_CONFIG.populationAdjustmentsKg, group)) {
        return { valid: true, group, adjustmentKg: SCIENCE_CONFIG.populationAdjustmentsKg[group], applied: true };
    }
    if (SCIENCE_CONFIG.uncoveredPopulationGroups.includes(group)) {
        return { valid: true, group, adjustmentKg: 0, applied: false,
            warning: "The selected population group has no specific coefficient in the model; no adjustment was applied." };
    }
    return { valid: false, group, adjustmentKg: 0, applied: false };
}

function estimateSkeletalMuscle(input) {
    const rawPopulation = input && typeof input === "object" ? input.populationGroup : undefined;
    const population = resolvePopulation(rawPopulation);
    const warnings = population.warning ? [population.warning] : [];
    if (!input || typeof input !== "object" || Array.isArray(input) || !population.valid) {
        return emptyResult(SCIENCE_CONFIG.validationStatuses.INVALID_INPUT, warnings, population);
    }
    const { sex, age, heightM, weightKg } = input;
    const validNumbers = [age, heightM, weightKg].every(
        (value) => typeof value === "number" && Number.isFinite(value)
    );
    if (!validNumbers || !Number.isInteger(age) || age <= 0 || heightM <= 0 ||
        heightM > SCIENCE_CONFIG.maximumHeightM || weightKg <= 0 ||
        (sex !== "male" && sex !== "female")) {
        return emptyResult(SCIENCE_CONFIG.validationStatuses.INVALID_INPUT, warnings, population);
    }
    if (age < SCIENCE_CONFIG.ageYears.min || age > SCIENCE_CONFIG.ageYears.max) {
        warnings.push("Age is outside the validated 20–81 year domain; no estimate was calculated.");
        return emptyResult(SCIENCE_CONFIG.validationStatuses.NOT_APPLICABLE_AGE, warnings, population);
    }
    const bmi = weightKg / (heightM ** 2);
    const c = SCIENCE_CONFIG.leeCoefficients;
    const muscleKg = c.weightKg * weightKg + c.heightM * heightM +
        c.male * (sex === "male" ? 1 : 0) + c.ageYears * age +
        population.adjustmentKg + c.intercept;
    const musclePercent = muscleKg / weightKg * 100;
    if (![bmi, muscleKg, musclePercent].every(Number.isFinite) || bmi <= 0 ||
        muscleKg <= 0 || muscleKg >= weightKg || musclePercent <= 0 || musclePercent >= 100) {
        warnings.push("The calculated values are not physiologically coherent; the estimate was suppressed.");
        const invalid = emptyResult(SCIENCE_CONFIG.validationStatuses.PHYSIOLOGICALLY_INVALID, warnings, population);
        invalid.bmi = Number.isFinite(bmi) && bmi > 0 ? bmi : null;
        return invalid;
    }
    const validationStatus = bmi >= SCIENCE_CONFIG.extendedBmiThreshold
        ? SCIENCE_CONFIG.validationStatuses.EXTENDED_BMI
        : SCIENCE_CONFIG.validationStatuses.PRIMARY;
    if (validationStatus === SCIENCE_CONFIG.validationStatuses.EXTENDED_BMI) {
        warnings.push("BMI is 30 or higher. The original equation was developed mainly in non-obese adults; interpret applicability with greater caution.");
    }
    const reference = REFERENCE_LOOKUP(sex, age);
    if (!reference) warnings.push("No verified MRI reference is available for this sex and age group.");
    return {
        muscleKg, musclePercent, bmi,
        populationAdjustmentKg: population.adjustmentKg,
        populationAdjustmentApplied: population.applied,
        populationGroup: population.group,
        validationStatus, warnings,
        referenceGroup: reference ? reference.group : null,
        referenceMeanPercent: reference ? reference.meanPercent : null,
        referenceSdPercent: reference ? reference.sdPercent : null,
        referenceEvidence: reference ? reference.evidence : null,
        clinicalInterpretation: null,
        modelSEE: SCIENCE_CONFIG.modelSEE
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { estimateSkeletalMuscle, centimetresToMetres, roundForPresentation, resolvePopulation };
}
