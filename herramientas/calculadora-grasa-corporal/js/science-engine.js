/* Imoancy Grasa Corporal PRO — motor científico puro v1.0.0 (sin DOM) */
"use strict";

(function (root, factory) {
    const config = typeof module === "object" && module.exports
        ? require("./science-config.js")
        : root.ImoancyBodyFatScienceConfig;
    const api = factory(config);
    if (typeof module === "object" && module.exports) module.exports = api;
    root.ImoancyBodyFatScience = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (CONFIG) {
    if (!CONFIG) throw new Error("Falta la configuración científica");

    class ScienceValidationError extends Error {
        constructor(code, field, message) {
            super(message);
            this.name = "ScienceValidationError";
            this.code = code;
            this.field = field;
        }
    }

    function requireFiniteNumber(value, field, limits) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new ScienceValidationError("INVALID_NUMBER", field, `${field} debe ser un número finito`);
        }
        if (limits.integer && !Number.isInteger(value)) {
            throw new ScienceValidationError("NOT_INTEGER", field, `${field} debe ser entero`);
        }
        if (value < limits.min || value > limits.max) {
            throw new ScienceValidationError("OUT_OF_RANGE", field, `${field} está fuera del intervalo admitido`);
        }
        return value;
    }

    function requireSex(sex) {
        if (sex !== "male" && sex !== "female") {
            throw new ScienceValidationError("INVALID_SEX", "sex", "sex debe ser male o female");
        }
        return sex;
    }

    function roundForDisplay(value) {
        if (!Number.isFinite(value)) return null;
        return Math.round(value); // ≈ entero: evita comunicar precisión individual inexistente.
    }

    function derived(bodyFatPercent, weightKg) {
        const fatMassKg = weightKg * bodyFatPercent / 100;
        const fatFreeMassKg = weightKg - fatMassKg;
        return { fatMassKg, fatFreeMassKg };
    }

    function calculateCunBae(input) {
        const sex = requireSex(input.sex);
        const age = requireFiniteNumber(input.ageYears, "ageYears", CONFIG.INPUT_LIMITS.ageYears);
        const height = requireFiniteNumber(input.heightCm, "heightCm", CONFIG.INPUT_LIMITS.heightCm);
        const weight = requireFiniteNumber(input.weightKg, "weightKg", CONFIG.INPUT_LIMITS.weightKg);
        const method = CONFIG.METHODS.CUN_BAE;
        if (age > method.population.maxAgeYears) {
            throw new ScienceValidationError("OUTSIDE_METHOD_POPULATION", "ageYears", "CUN-BAE se limita a 18-80 años");
        }
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        requireFiniteNumber(bmi, "bmi", CONFIG.INPUT_LIMITS.bmi);
        const s = sex === "female" ? 1 : 0;
        const bmi2 = bmi * bmi;
        const bodyFatPercent = -44.988 + 0.503 * age + 10.689 * s + 3.172 * bmi
            - 0.026 * bmi2 + 0.181 * bmi * s - 0.02 * bmi * age
            - 0.005 * bmi2 * s + 0.00021 * bmi2 * age;
        if (!(bodyFatPercent > 0 && bodyFatPercent < 100)) {
            throw new ScienceValidationError("IMPLAUSIBLE_RESULT", "bodyFatPercent", "La ecuación produjo un resultado no fisiológico");
        }
        return Object.freeze({
            methodId: method.id,
            methodVersion: method.version,
            engineVersion: CONFIG.ENGINE_VERSION,
            bodyFatPercent,
            displayBodyFatPercent: roundForDisplay(bodyFatPercent),
            bmi,
            ...derived(bodyFatPercent, weight),
            uncertainty: Object.freeze({
                populationSEEPercentagePoints: 4.66,
                individualIntervalAvailable: false,
                statement: "El SEE poblacional no es un intervalo de confianza individual."
            })
        });
    }

    function calculateRfm(input) {
        const sex = requireSex(input.sex);
        const age = requireFiniteNumber(input.ageYears, "ageYears", CONFIG.INPUT_LIMITS.ageYears);
        const height = requireFiniteNumber(input.heightCm, "heightCm", CONFIG.INPUT_LIMITS.heightCm);
        const waist = requireFiniteNumber(input.waistCm, "waistCm", CONFIG.INPUT_LIMITS.waistCm);
        if (age < CONFIG.METHODS.RFM.population.minAgeYears) {
            throw new ScienceValidationError("OUTSIDE_METHOD_POPULATION", "ageYears", "RFM se validó desde los 20 años");
        }
        if (waist >= height) {
            throw new ScienceValidationError("IMPLAUSIBLE_COMBINATION", "waistCm", "La cintura debe ser menor que la altura");
        }
        const s = sex === "female" ? 1 : 0;
        const bodyFatPercent = 64 - 20 * (height / waist) + 12 * s;
        if (!(bodyFatPercent > 0 && bodyFatPercent < 100)) {
            throw new ScienceValidationError("IMPLAUSIBLE_RESULT", "bodyFatPercent", "La ecuación produjo un resultado no fisiológico");
        }
        const result = {
            methodId: CONFIG.METHODS.RFM.id,
            methodVersion: CONFIG.METHODS.RFM.version,
            engineVersion: CONFIG.ENGINE_VERSION,
            bodyFatPercent,
            displayBodyFatPercent: roundForDisplay(bodyFatPercent),
            waistProtocol: CONFIG.METHODS.RFM.waistProtocol,
            uncertainty: Object.freeze({
                validationPrecisionPercentagePoints: sex === "female" ? 4.9 : 4.2,
                individualIntervalAvailable: false,
                statement: "La precisión poblacional publicada no define el error de esta persona."
            })
        };
        if (input.weightKg !== undefined) {
            const weight = requireFiniteNumber(input.weightKg, "weightKg", CONFIG.INPUT_LIMITS.weightKg);
            Object.assign(result, derived(bodyFatPercent, weight));
        }
        return Object.freeze(result);
    }

    function calculate(methodId, input) {
        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new ScienceValidationError("INVALID_INPUT", null, "Se requiere un objeto de entrada");
        }
        if (methodId === CONFIG.METHODS.CUN_BAE.id) return calculateCunBae(input);
        if (methodId === CONFIG.METHODS.RFM.id) return calculateRfm(input);
        throw new ScienceValidationError("UNKNOWN_METHOD", "methodId", "Método desconocido");
    }

    return Object.freeze({ calculate, calculateCunBae, calculateRfm, roundForDisplay, ScienceValidationError });
});
