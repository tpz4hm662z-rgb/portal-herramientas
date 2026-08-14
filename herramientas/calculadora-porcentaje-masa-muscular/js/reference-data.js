/* MRI references are descriptive and must never alter the Lee estimate. */
"use strict";

/*
 * Janssen I, Heymsfield SB, Wang ZM, Ross R. J Appl Physiol.
 * 2000;89(1):81-88. doi:10.1152/jappl.2000.89.1.81, Table 1.
 * Whole-body MRI, 468 healthy adults aged 18-88 years. Values are published
 * group mean and SD for skeletal muscle as a percentage of body mass.
 */
const MUSCLE_MRI_REFERENCE_DATA = Object.freeze([
    ["female", 18, 29, "18-29", 34.1, 5.7, "standard"],
    ["female", 30, 39, "30-39", 30.6, 5.6, "standard"],
    ["female", 40, 49, "40-49", 29.2, 5.0, "standard"],
    ["female", 50, 59, "50-59", 29.1, 4.4, "standard"],
    ["female", 60, 69, "60-69", 27.3, 4.6, "standard"],
    ["female", 70, 88, "70+", 30.2, 4.7, "limited"],
    ["male", 18, 29, "18-29", 42.3, 4.4, "standard"],
    ["male", 30, 39, "30-39", 39.1, 5.0, "standard"],
    ["male", 40, 49, "40-49", 37.1, 4.0, "standard"],
    ["male", 50, 59, "50-59", 35.1, 3.4, "standard"],
    ["male", 60, 69, "60-69", 33.8, 3.9, "standard"],
    ["male", 70, 88, "70+", 36.0, 7.3, "limited"]
].map((row) => Object.freeze({
    sex: row[0], minAge: row[1], maxAge: row[2], group: row[3],
    meanPercent: row[4], sdPercent: row[5], evidence: row[6]
})));

function lookupMuscleMriReference(sex, age) {
    if ((sex !== "male" && sex !== "female") ||
        typeof age !== "number" || !Number.isFinite(age) || !Number.isInteger(age)) {
        return null;
    }
    const row = MUSCLE_MRI_REFERENCE_DATA.find((item) =>
        item.sex === sex && age >= item.minAge && age <= item.maxAge
    );
    return row ? { ...row } : null;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { MUSCLE_MRI_REFERENCE_DATA, lookupMuscleMriReference };
}
