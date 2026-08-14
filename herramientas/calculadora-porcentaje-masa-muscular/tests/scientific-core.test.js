"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { estimateSkeletalMuscle: estimate, centimetresToMetres, roundForPresentation } = require("../js/scientific-core.js");
const { MUSCLE_MRI_REFERENCE_DATA, lookupMuscleMriReference } = require("../js/reference-data.js");

const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const base = { sex: "male", age: 40, heightM: 1.75, weightKg: 75, populationGroup: "white_hispanic" };

test("direct independently calculated male and female cases", () => {
    const male = estimate(base);
    close(male.muscleKg, 0.244 * 75 + 7.8 * 1.75 + 6.6 - 0.098 * 40 - 3.3);
    const female = estimate({ sex: "female", age: 35, heightM: 1.65, weightKg: 60, populationGroup: "asian" });
    close(female.muscleKg, 0.244 * 60 + 7.8 * 1.65 - 0.098 * 35 - 1.2 - 3.3);
});

test("metamorphic coefficients are exact", () => {
    const v = estimate(base).muscleKg;
    close(estimate({ ...base, weightKg: 76 }).muscleKg - v, 0.244);
    close(estimate({ ...base, heightM: 1.76 }).muscleKg - v, 0.078);
    close(estimate({ ...base, age: 41 }).muscleKg - v, -0.098);
    close(v - estimate({ ...base, sex: "female" }).muscleKg, 6.6);
    close(estimate({ ...base, populationGroup: "asian" }).muscleKg - v, -1.2);
    close(estimate({ ...base, populationGroup: "african_american" }).muscleKg - v, 1.4);
    close(estimate({ ...base, populationGroup: "african_american" }).muscleKg - estimate({ ...base, populationGroup: "asian" }).muscleKg, 2.6);
});

test("age boundaries fail closed", () => {
    for (const age of [19, 82]) assert.equal(estimate({ ...base, age }).validationStatus, "not_applicable_age");
    for (const age of [20, 21, 80, 81]) assert.notEqual(estimate({ ...base, age }).validationStatus, "not_applicable_age");
});

test("BMI boundary changes exactly at 30", () => {
    const heightM = 2;
    assert.equal(estimate({ ...base, heightM, weightKg: 29.99 * 4 }).validationStatus, "primary");
    assert.equal(estimate({ ...base, heightM, weightKg: 30 * 4 }).validationStatus, "extended_bmi");
    assert.equal(estimate({ ...base, heightM, weightKg: 30.01 * 4 }).validationStatus, "extended_bmi");
});

test("population selection distinguishes zero, omitted and uncovered", () => {
    const selected = estimate(base), omitted = estimate({ ...base, populationGroup: undefined });
    assert.equal(selected.populationAdjustmentApplied, true);
    assert.equal(selected.populationAdjustmentKg, 0);
    assert.equal(omitted.populationAdjustmentApplied, false);
    assert.equal(omitted.populationGroup, null);
    for (const group of [null, "other", "mixed", "unknown", "prefer_not_to_say"]) {
        const r = estimate({ ...base, populationGroup: group });
        assert.equal(r.populationAdjustmentApplied, false);
        assert.ok(r.warnings.length);
    }
});

test("hostile values and wrong units are rejected safely", () => {
    const bad = [NaN, Infinity, -Infinity, "hola", "", " ", null, undefined, [], {}, -1, 0, 1e-300, 1e300, 170];
    for (const heightM of bad) assert.notEqual(estimate({ ...base, heightM }).validationStatus, "primary");
    assert.equal(estimate({ ...base, heightM: 170 }).validationStatus, "invalid_input");
    for (const weightKg of bad) assert.notEqual(estimate({ ...base, weightKg }).validationStatus, "primary");
    assert.equal(estimate({ ...base, sex: 1 }).validationStatus, "invalid_input");
    assert.equal(estimate({ ...base, age: 40.5 }).validationStatus, "invalid_input");
    assert.equal(estimate({ ...base, populationGroup: "invented" }).validationStatus, "invalid_input");
});

test("normalization is separate and does not guess", () => {
    assert.equal(centimetresToMetres(170), 1.7);
    for (const value of ["170", "170,5", null, NaN, Infinity, 0, -1]) assert.equal(centimetresToMetres(value), null);
});

test("full precision drives percentage; presentation rounding is separate", () => {
    const r = estimate({ ...base, weightKg: 73.37, heightM: 1.783 });
    close(r.musclePercent, r.muscleKg / 73.37 * 100);
    assert.notEqual(r.musclePercent, roundForPresentation(r.muscleKg, 1) / 73.37 * 100);
    assert.equal(roundForPresentation(r.muscleKg, 1), Math.round((r.muscleKg + Number.EPSILON) * 10) / 10);
});

test("invariants, metadata and no clinical interpretation", () => {
    for (const populationGroup of ["white_hispanic", "asian", "african_american", undefined]) {
        const r = estimate({ ...base, populationGroup });
        assert.ok(Number.isFinite(r.muscleKg) && r.muscleKg > 0 && r.muscleKg < base.weightKg);
        assert.ok(Number.isFinite(r.musclePercent) && r.musclePercent > 0 && r.musclePercent < 100);
        assert.ok(Number.isFinite(r.bmi) && r.bmi > 0);
        assert.equal(r.clinicalInterpretation, null);
        assert.equal(r.modelSEE, 2.8);
        assert.equal("lowerBound" in r, false);
        assert.equal("upperBound" in r, false);
    }
});

test("physiologically absurd output is suppressed", () => {
    const r = estimate({ sex: "female", age: 81, heightM: 0.01, weightKg: 0.01 });
    assert.equal(r.validationStatus, "physiologically_invalid");
    assert.equal(r.muscleKg, null);
    assert.equal(r.musclePercent, null);
});

test("reference lookup cannot affect Lee arithmetic", () => {
    const r = estimate(base);
    close(r.muscleKg, 31.33);
    assert.equal(r.referenceGroup, "40-49");
    assert.equal(r.referenceMeanPercent, 37.1);
    assert.equal(r.referenceSdPercent, 4.0);
});

const references = {
    male: [[20,29,"18-29",42.3,4.4,"standard"],[30,39,"30-39",39.1,5.0,"standard"],[40,49,"40-49",37.1,4.0,"standard"],[50,59,"50-59",35.1,3.4,"standard"],[60,69,"60-69",33.8,3.9,"standard"],[70,81,"70+",36.0,7.3,"limited"]],
    female: [[20,29,"18-29",34.1,5.7,"standard"],[30,39,"30-39",30.6,5.6,"standard"],[40,49,"40-49",29.2,5.0,"standard"],[50,59,"50-59",29.1,4.4,"standard"],[60,69,"60-69",27.3,4.6,"standard"],[70,81,"70+",30.2,4.7,"limited"]]
};

test("published MRI reference values and every boundary are exact", () => {
    for (const [sex, rows] of Object.entries(references)) for (const [min,max,group,mean,sd,evidence] of rows) {
        for (const age of [min,max]) {
            const r = estimate({ ...base, sex, age });
            assert.equal(r.referenceGroup, group); assert.equal(r.referenceMeanPercent, mean);
            assert.equal(r.referenceSdPercent, sd); assert.equal(r.referenceEvidence, evidence);
        }
    }
});

test("reference is descriptive, non-interpolated and non-clinical", () => {
    for (const sex of ["male", "female"]) for (const age of [20,29,30,39,40,49,50,59,60,69,70,81]) {
        const withReference = estimate({ ...base, sex, age });
        const expectedKg = .244*75 + 7.8*1.75 + 6.6*(sex === "male" ? 1 : 0) - .098*age - 3.3;
        close(withReference.muscleKg, expectedKg);
        close(withReference.musclePercent, expectedKg / 75 * 100);
        assert.equal(withReference.clinicalInterpretation, null);
        for (const key of ["classification","qualitativeClassification","percentile","healthyRange","idealRange"]) assert.equal(key in withReference, false);
    }
});

test("reference dataset has exact coverage and rejects unpublished or coerced ages", () => {
    assert.equal(MUSCLE_MRI_REFERENCE_DATA.length, 12);
    assert.equal(new Set(MUSCLE_MRI_REFERENCE_DATA.map((r) => `${r.sex}:${r.group}`)).size, 12);
    assert.ok(Object.isFrozen(MUSCLE_MRI_REFERENCE_DATA));
    assert.ok(MUSCLE_MRI_REFERENCE_DATA.every(Object.isFrozen));
    for (const value of [17, 89, 29.5, "29", null, undefined, NaN, Infinity]) {
        assert.equal(lookupMuscleMriReference("male", value), null);
    }
    assert.equal(lookupMuscleMriReference("other", 40), null);
});
