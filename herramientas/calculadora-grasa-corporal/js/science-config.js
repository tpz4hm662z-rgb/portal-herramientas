/* Imoancy Grasa Corporal PRO — configuración científica v1.0.0 */
"use strict";

(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.ImoancyBodyFatScienceConfig = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const ENGINE_VERSION = "1.0.0";
    const SCHEMA_VERSION = 1;

    const METHODS = Object.freeze({
        CUN_BAE: Object.freeze({
            id: "cun-bae",
            version: "gomez-ambrosi-2012",
            required: Object.freeze(["sex", "ageYears", "heightCm", "weightKg"]),
            population: Object.freeze({ minAgeYears: 18, maxAgeYears: 80 }),
            reference: "Gomez-Ambrosi et al., Diabetes Care 2012;35:383-388. doi:10.2337/dc11-1334"
        }),
        RFM: Object.freeze({
            id: "rfm",
            version: "woolcott-bergman-2018",
            required: Object.freeze(["sex", "heightCm", "waistCm"]),
            population: Object.freeze({ minAgeYears: 20 }),
            waistProtocol: "NHANES: cinta horizontal inmediatamente sobre el borde lateral superior del ilion derecho",
            reference: "Woolcott & Bergman, Scientific Reports 2018;8:10980. doi:10.1038/s41598-018-29362-1"
        })
    });

    const INPUT_LIMITS = Object.freeze({
        ageYears: Object.freeze({ min: 18, max: 120, integer: true }),
        heightCm: Object.freeze({ min: 120, max: 230 }),
        weightKg: Object.freeze({ min: 30, max: 300 }),
        waistCm: Object.freeze({ min: 40, max: 200 }),
        neckCm: Object.freeze({ min: 20, max: 80 }),
        hipCm: Object.freeze({ min: 45, max: 220 }),
        bmi: Object.freeze({ min: 12, max: 70 })
    });

    return Object.freeze({ ENGINE_VERSION, SCHEMA_VERSION, METHODS, INPUT_LIMITS });
});
