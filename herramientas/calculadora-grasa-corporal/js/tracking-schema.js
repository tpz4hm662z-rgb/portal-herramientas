/* Esquema local y comparaciones puras — no accede a localStorage ni al DOM. */
"use strict";

const science = typeof module === "object" && module.exports ? require("./science-engine.js") : globalThis.ImoancyBodyFatScience;
const config = typeof module === "object" && module.exports ? require("./science-config.js") : globalThis.ImoancyBodyFatScienceConfig;

function createMeasurement(input) {
    if (!input || typeof input !== "object") throw new TypeError("measurement debe ser un objeto");
    if (typeof input.id !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(input.id)) throw new TypeError("id inválido");
    const measuredAt = new Date(input.measuredAt);
    if (!Number.isFinite(measuredAt.getTime())) throw new TypeError("measuredAt inválido");
    const estimate = science.calculate(input.methodId, input.observed);
    return Object.freeze({
        schemaVersion: config.SCHEMA_VERSION,
        id: input.id,
        measuredAt: measuredAt.toISOString(),
        method: Object.freeze({ id: estimate.methodId, version: estimate.methodVersion, engineVersion: estimate.engineVersion }),
        protocol: Object.freeze({
            waist: input.methodId === "rfm" ? config.METHODS.RFM.waistProtocol : null,
            conditionsNote: typeof input.conditionsNote === "string" ? input.conditionsNote.slice(0, 240) : null
        }),
        observed: Object.freeze({
            sex: input.observed.sex,
            ageYears: input.observed.ageYears,
            heightCm: input.observed.heightCm,
            weightKg: input.observed.weightKg,
            waistCm: input.observed.waistCm
        }),
        estimated: Object.freeze({
            bodyFatPercent: estimate.bodyFatPercent,
            fatMassKg: estimate.fatMassKg ?? null,
            fatFreeMassKg: estimate.fatFreeMassKg ?? null,
            bmi: estimate.bmi ?? null
        })
    });
}

function validateMeasurement(record) {
    try {
        if (!record || typeof record !== "object" || Array.isArray(record)) return false;
        if (record.schemaVersion !== config.SCHEMA_VERSION) return false;
        if (typeof record.id !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(record.id)) return false;
        if (typeof record.measuredAt !== "string") return false;
        const measuredAt = new Date(record.measuredAt);
        if (!Number.isFinite(measuredAt.getTime()) || measuredAt.toISOString() !== record.measuredAt) return false;
        if (!record.method || !record.observed || !record.estimated || !record.protocol) return false;
        if (record.method.id !== "cun-bae" && record.method.id !== "rfm") return false;
        if (typeof record.method.version !== "string" || typeof record.method.engineVersion !== "string") return false;
        if (!record.method.version.trim() || !record.method.engineVersion.trim()) return false;
        const finiteOrNull = value => value === null || Number.isFinite(value);
        if (!(Number.isFinite(record.estimated.bodyFatPercent) && record.estimated.bodyFatPercent > 0 && record.estimated.bodyFatPercent < 100)) return false;
        if (!finiteOrNull(record.estimated.fatMassKg) || !finiteOrNull(record.estimated.fatFreeMassKg) || !finiteOrNull(record.estimated.bmi)) return false;
        if ((record.estimated.fatMassKg === null) !== (record.estimated.fatFreeMassKg === null)) return false;
        if (Number.isFinite(record.estimated.fatMassKg) && record.estimated.fatMassKg < 0) return false;
        if (Number.isFinite(record.estimated.fatFreeMassKg) && record.estimated.fatFreeMassKg <= 0) return false;
        if (Number.isFinite(record.estimated.bmi) && record.estimated.bmi <= 0) return false;
        if (record.observed.sex !== "male" && record.observed.sex !== "female") return false;
        const inRange = (value, limits) => Number.isFinite(value) && value >= limits.min && value <= limits.max;
        if (!inRange(record.observed.ageYears, config.INPUT_LIMITS.ageYears) || !Number.isInteger(record.observed.ageYears)) return false;
        if (!inRange(record.observed.heightCm, config.INPUT_LIMITS.heightCm) || !inRange(record.observed.weightKg, config.INPUT_LIMITS.weightKg)) return false;
        if (record.observed.waistCm !== undefined && record.observed.waistCm !== null && !inRange(record.observed.waistCm, config.INPUT_LIMITS.waistCm)) return false;
        if (record.method.id === "rfm" && !inRange(record.observed.waistCm, config.INPUT_LIMITS.waistCm)) return false;
        if (record.method.id === "rfm" && record.observed.waistCm >= record.observed.heightCm) return false;
        if (record.protocol.conditionsNote !== null && (typeof record.protocol.conditionsNote !== "string" || record.protocol.conditionsNote.length > 240)) return false;
        if (record.method.id === "rfm" && (typeof record.protocol.waist !== "string" || !record.protocol.waist.trim())) return false;
        if (record.method.id === "cun-bae" && record.protocol.waist !== null) return false;
        if (Number.isFinite(record.estimated.fatMassKg) &&
            Math.abs(record.estimated.fatMassKg + record.estimated.fatFreeMassKg - record.observed.weightKg) > 1e-6) return false;
        const currentMethod = record.method.id === "cun-bae" ? config.METHODS.CUN_BAE : config.METHODS.RFM;
        const isCurrentVersion = record.method.version === currentMethod.version && record.method.engineVersion === config.ENGINE_VERSION;
        if (!isCurrentVersion) {
            return true; // Se conserva una versión anterior coherente, pero nunca se compara con la actual.
        }
        const rebuilt = createMeasurement({
            id: record.id,
            measuredAt: record.measuredAt,
            methodId: record.method.id,
            observed: record.observed,
            conditionsNote: record.protocol.conditionsNote
        });
        const close = (a, b) => (a === null && b === null) ||
            (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9);
        return rebuilt.method.version === record.method.version &&
            rebuilt.method.engineVersion === record.method.engineVersion &&
            close(rebuilt.estimated.bodyFatPercent, record.estimated.bodyFatPercent) &&
            close(rebuilt.estimated.fatMassKg, record.estimated.fatMassKg) &&
            close(rebuilt.estimated.fatFreeMassKg, record.estimated.fatFreeMassKg) &&
            close(rebuilt.estimated.bmi, record.estimated.bmi);
    } catch (_) {
        return false;
    }
}

function isCoherentMeasurementGroup(records) {
    if (!Array.isArray(records) || !records.length || !records.every(validateMeasurement)) return false;
    const methodIds = new Set(records.map(record => record.method.id));
    if (methodIds.size !== records.length) return false;
    const reference = records[0].observed;
    const sharedKeys = ["sex", "ageYears", "heightCm", "weightKg"];
    if (!records.every(record => sharedKeys.every(key => Object.is(record.observed[key], reference[key])))) return false;
    const waists = records.map(record => record.observed.waistCm).filter(Number.isFinite);
    return waists.every(value => Object.is(value, waists[0]));
}

function groupByMeasuredAt(records) {
    if (!Array.isArray(records)) return [];
    const groups = new Map();
    records.filter(validateMeasurement).forEach(record => {
        if (!groups.has(record.measuredAt)) groups.set(record.measuredAt, []);
        groups.get(record.measuredAt).push(record);
    });
    return Array.from(groups.entries())
        .filter(([, measurements]) => isCoherentMeasurementGroup(measurements))
        .map(([measuredAt, measurements]) => Object.freeze({ measuredAt, measurements: Object.freeze(measurements.slice()) }))
        .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
}

function compareMeasurements(earlier, later) {
    const delta = (a, b) => Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
    if (!validateMeasurement(earlier) || !validateMeasurement(later)) {
        return Object.freeze({
            compatibleForEstimatedTrend: false,
            incompatibilityReason: "INVALID_RECORD",
            elapsedMs: null,
            observedDelta: Object.freeze({ weightKg: null, waistCm: null }),
            estimatedDelta: null,
            interpretation: null
        });
    }
    if (new Date(later.measuredAt) <= new Date(earlier.measuredAt)) throw new TypeError("Orden temporal inválido");
    const sameMethodVersion = earlier.method.id === later.method.id &&
        earlier.method.version === later.method.version &&
        earlier.method.engineVersion === later.method.engineVersion;
    // El sexo selecciona una variante distinta de ambas ecuaciones; no es un delta longitudinal homogéneo.
    const sameEquationVariant = earlier.observed.sex === later.observed.sex;
    const compatible = sameMethodVersion && sameEquationVariant;
    const incompatibilityReason = !sameMethodVersion
        ? "DIFFERENT_METHOD_OR_VERSION"
        : !sameEquationVariant ? "EQUATION_VARIANT_CHANGED" : null;
    return Object.freeze({
        compatibleForEstimatedTrend: compatible,
        incompatibilityReason,
        elapsedMs: new Date(later.measuredAt) - new Date(earlier.measuredAt),
        observedDelta: Object.freeze({
            weightKg: delta(earlier.observed.weightKg, later.observed.weightKg),
            waistCm: delta(earlier.observed.waistCm, later.observed.waistCm)
        }),
        estimatedDelta: compatible ? Object.freeze({
            bodyFatPercentagePoints: delta(earlier.estimated.bodyFatPercent, later.estimated.bodyFatPercent),
            fatMassKg: delta(earlier.estimated.fatMassKg, later.estimated.fatMassKg)
        }) : null,
        interpretation: null
    });
}

const api = Object.freeze({ createMeasurement, validateMeasurement, isCoherentMeasurementGroup, groupByMeasuredAt, compareMeasurements, MAX_RECORDS: 1000 });
if (typeof module === "object" && module.exports) module.exports = api;
else globalThis.ImoancyBodyFatTracking = api;
