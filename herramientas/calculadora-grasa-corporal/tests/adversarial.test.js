"use strict";
(function (root) {
    const t = root.ImoancyBodyFatTracking;
    const F = root.ImoancyBodyFatHistoryStore;
    const I = root.ImoancyBodyFatChangeInterpreter;
    let passed = 0, failures = [];
    function test(name, fn) { try { fn(); passed += 1; } catch (error) { failures.push("adversarial · " + name + ": " + error.message); } }
    function ok(value) { if (!value) throw Error("assertion failed"); }
    function eq(actual, expected) { if (actual !== expected) throw Error(actual + " !== " + expected); }
    function Memory() { this.data = {}; }
    Memory.prototype.getItem = function (key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; };
    Memory.prototype.setItem = function (key, value) { this.data[key] = String(value); };
    Memory.prototype.removeItem = function (key) { delete this.data[key]; };
    function observed(extra) { return Object.assign({ sex: "male", ageYears: 35, heightCm: 180, weightKg: 80, waistCm: 100 }, extra || {}); }
    function rec(id, date, method, extra) {
        return t.createMeasurement({ id, measuredAt: date, methodId: method || "cun-bae", observed: observed(extra) });
    }
    function group(prefix, date, extra, withRfm) {
        const input = observed(extra), measurements = [rec(prefix + "_cun", date, "cun-bae", input)];
        if (withRfm !== false) measurements.push(rec(prefix + "_rfm", date, "rfm", input));
        return { measuredAt: new Date(date).toISOString(), measurements };
    }
    function legacyPercent(id, date, percent) {
        const record = JSON.parse(JSON.stringify(rec(id, date, "cun-bae")));
        record.method.version = "legacy-rounding";
        record.estimated.bodyFatPercent = percent;
        record.estimated.fatMassKg = record.observed.weightKg * percent / 100;
        record.estimated.fatFreeMassKg = record.observed.weightKg - record.estimated.fatMassKg;
        return record;
    }
    function one(record) { return { measuredAt: record.measuredAt, measurements: [record] }; }

    test("registro heredado exige id válido", () => { const x = JSON.parse(JSON.stringify(rec("adv_id_001", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.id = "x"; ok(!t.validateMeasurement(x)); });
    test("registro heredado exige timestamp válido", () => { const x = JSON.parse(JSON.stringify(rec("adv_date_01", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.measuredAt = "no-date"; ok(!t.validateMeasurement(x)); });
    test("número como string se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_num_001", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.observed.weightKg = "80"; ok(!t.validateMeasurement(x)); });
    test("NaN adversarial se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_nan_001", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.observed.weightKg = NaN; ok(!t.validateMeasurement(x)); });
    test("infinito adversarial se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_inf_001", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.estimated.bodyFatPercent = Infinity; ok(!t.validateMeasurement(x)); });
    test("altura imposible heredada se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_height1", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.observed.heightCm = 20; ok(!t.validateMeasurement(x)); });
    test("cintura imposible heredada se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_waist_1", "2026-01-01T00:00:00Z", "rfm"))); x.method.version = "legacy"; x.observed.waistCm = 250; ok(!t.validateMeasurement(x)); });
    test("masa negativa heredada se rechaza", () => { const x = JSON.parse(JSON.stringify(rec("adv_mass_01", "2026-01-01T00:00:00Z"))); x.method.version = "legacy"; x.estimated.fatMassKg = -1; x.estimated.fatFreeMassKg = 81; ok(!t.validateMeasurement(x)); });
    test("engineVersion diferente suprime delta", () => { const a = rec("adv_eng_001", "2026-01-01T00:00:00Z"), b = JSON.parse(JSON.stringify(rec("adv_eng_002", "2026-02-01T00:00:00Z"))); b.method.engineVersion = "0.9.0"; const c = t.compareMeasurements(a, b); ok(!c.compatibleForEstimatedTrend); eq(c.estimatedDelta, null); });
    test("cambio de variante por sexo suprime delta", () => { const a = rec("adv_sex_001", "2026-01-01T00:00:00Z"), b = rec("adv_sex_002", "2026-02-01T00:00:00Z", "cun-bae", { sex: "female" }); const c = t.compareMeasurements(a, b); ok(!c.compatibleForEstimatedTrend); eq(c.incompatibilityReason, "EQUATION_VARIANT_CHANGED"); eq(c.estimatedDelta, null); });
    test("registro corrupto directo nunca produce delta", () => { const c = t.compareMeasurements(rec("adv_bad_001", "2026-01-01T00:00:00Z"), {}); ok(!c.compatibleForEstimatedTrend); eq(c.incompatibilityReason, "INVALID_RECORD"); eq(c.estimatedDelta, null); });

    test("documento demasiado grande se aísla", () => { const m = new Memory(); m.data[F.STORAGE_KEY] = "x".repeat(F.MAX_DOCUMENT_CHARS + 1); eq(F.createStore(m).read().status, "DOCUMENT_TOO_LARGE"); });
    test("array desmesurado se rechaza antes de recorrerlo", () => { const m = new Memory(), s = F.createStore(m), r = rec("adv_many_01", "2026-01-01T00:00:00Z"); eq(s.write(new Array(F.MAX_INPUT_RECORDS + 1).fill(r)).status, "TOO_MANY_RECORDS"); });
    test("más de mil conserva los mil cronológicamente nuevos", () => { const m = new Memory(), s = F.createStore(m), records = []; for (let index = 0; index < 1100; index += 1) records.push(rec("adv_cap_" + String(index).padStart(4, "0"), new Date(Date.UTC(2020, 0, 1, 0, 0, index)).toISOString())); const out = s.write(records); eq(out.records.length, 1000); eq(out.records[0].id, "adv_cap_0100"); });
    test("id duplicado manipulado se aísla", () => { const m = new Memory(), a = rec("adv_dup_001", "2026-01-01T00:00:00Z"), b = JSON.parse(JSON.stringify(a)); b.measuredAt = "2026-02-01T00:00:00.000Z"; m.data[F.STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, records: [a, b] }); const out = F.createStore(m).read(); eq(out.status, "PARTIAL"); eq(out.records.length, 1); });
    test("grupo con observados contradictorios se aísla completo", () => { const m = new Memory(), date = "2026-01-01T00:00:00Z", a = rec("adv_pair_01", date, "cun-bae"), b = rec("adv_pair_02", date, "rfm", { heightCm: 179 }); m.data[F.STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, records: [a, b] }); const out = F.createStore(m).read(); eq(out.status, "PARTIAL"); eq(out.records.length, 0); eq(out.invalidRecords, 2); });
    test("dos registros del mismo método e instante se aíslan", () => { const m = new Memory(), date = "2026-01-01T00:00:00Z", a = rec("adv_same_01", date, "cun-bae"), b = rec("adv_same_02", date, "cun-bae"); m.data[F.STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, records: [a, b] }); const out = F.createStore(m).read(); eq(out.status, "PARTIAL"); eq(out.records.length, 0); });
    test("timestamp futuro se aísla", () => { const m = new Memory(); m.data[F.STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, records: [rec("adv_future1", "2030-01-01T00:00:00Z")] }); const out = F.createStore(m, { now: () => Date.parse("2026-08-14T12:00:00Z") }).read(); eq(out.status, "PARTIAL"); eq(out.records.length, 0); });
    test("timestamp extremadamente antiguo se aísla", () => { const m = new Memory(); m.data[F.STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, records: [rec("adv_ancient", "1980-01-01T00:00:00Z")] }); const out = F.createStore(m, { now: () => Date.parse("2026-08-14T12:00:00Z") }).read(); eq(out.status, "PARTIAL"); eq(out.records.length, 0); });
    test("setItem interrumpido no rompe", () => { const m = new Memory(); m.setItem = function () { throw Error("interrupted"); }; eq(F.createStore(m).write([rec("adv_write01", "2026-01-01T00:00:00Z")]).status, "WRITE_ERROR"); });
    test("removeItem bloqueado no rompe", () => { const m = new Memory(); m.removeItem = function () { throw Error("blocked"); }; eq(F.createStore(m).clear().status, "WRITE_ERROR"); });
    test("documento grande no se sobrescribe al añadir", () => { const m = new Memory(); m.data[F.STORAGE_KEY] = "x".repeat(F.MAX_DOCUMENT_CHARS + 1); eq(F.createStore(m).add([rec("adv_keep_01", "2026-01-01T00:00:00Z")]).status, "DOCUMENT_TOO_LARGE"); });

    test("A: peso cintura CUN y RFM bajan sin afirmar pérdida real", () => { const r = I.interpretChange(group("adv_a1", "2026-01-01T00:00:00Z", { weightKg: 80, waistCm: 100 }), group("adv_a2", "2026-02-01T00:00:00Z", { weightKg: 75, waistCm: 90 })); eq(r.estimates.cunBae.direction, "down"); eq(r.estimates.rfm.direction, "down"); ok(r.cannotSay.includes("no demuestran")); });
    test("B: peso sube cintura baja produce oposición prudente", () => { const r = I.interpretChange(group("adv_b1", "2026-01-01T00:00:00Z", { weightKg: 80, waistCm: 100 }), group("adv_b2", "2026-02-01T00:00:00Z", { weightKg: 90, waistCm: 90 })); ok(r.oppositeDirections); ok(r.explanation.includes("no demuestra")); });
    test("C: peso baja cintura sube queda descrito", () => { const r = I.interpretChange(group("adv_c1", "2026-01-01T00:00:00Z", { weightKg: 80, waistCm: 90 }), group("adv_c2", "2026-02-01T00:00:00Z", { weightKg: 75, waistCm: 100 })); eq(r.observed.weightDirection, "down"); eq(r.observed.waistDirection, "up"); });
    test("D: peso igual cintura baja queda descrito", () => { const r = I.interpretChange(group("adv_d1", "2026-01-01T00:00:00Z", { weightKg: 80, waistCm: 100 }), group("adv_d2", "2026-02-01T00:00:00Z", { weightKg: 80, waistCm: 90 })); eq(r.observed.weightDirection, "same"); eq(r.observed.waistDirection, "down"); });
    test("E: peso baja cintura igual queda descrito", () => { const r = I.interpretChange(group("adv_e1", "2026-01-01T00:00:00Z", { weightKg: 80, waistCm: 90 }), group("adv_e2", "2026-02-01T00:00:00Z", { weightKg: 75, waistCm: 90 })); eq(r.observed.weightDirection, "down"); eq(r.observed.waistDirection, "same"); });
    test("F/G: cambio interno oculto por redondeo se etiqueta", () => { const a = legacyPercent("adv_round1", "2026-01-01T00:00:00Z", 18.40), b = legacyPercent("adv_round2", "2026-02-01T00:00:00Z", 18.49); const r = I.interpretChange(one(a), one(b)); eq(r.estimates.cunBae.rounding.relation, "HIDDEN_INTERNAL_CHANGE"); eq(r.estimates.cunBae.rounding.earlierDisplay, 18); eq(r.estimates.cunBae.rounding.laterDisplay, 18); });
    test("H: 18,49 a 18,51 se etiqueta como frontera visual", () => { const a = legacyPercent("adv_bound1", "2026-01-01T00:00:00Z", 18.49), b = legacyPercent("adv_bound2", "2026-02-01T00:00:00Z", 18.51); const r = I.interpretChange(one(a), one(b)); eq(r.estimates.cunBae.rounding.relation, "VISIBLE_ROUNDING_BOUNDARY"); eq(r.estimates.cunBae.rounding.visibleDelta, 1); });
    test("I: versión incompatible no ofrece delta", () => { const a = group("adv_i1", "2026-01-01T00:00:00Z", {}, false), b = group("adv_i2", "2026-02-01T00:00:00Z", {}, false); b.measurements[0] = JSON.parse(JSON.stringify(b.measurements[0])); b.measurements[0].method.engineVersion = "2.0.0"; const r = I.interpretChange(a, b); ok(!r.estimates.cunBae.comparable); eq(r.estimates.cunBae.deltaPercentagePoints, null); });
    test("J: antiguo sin RFM frente a nuevo con RFM no inventa delta", () => { const r = I.interpretChange(group("adv_j1", "2026-01-01T00:00:00Z", {}, false), group("adv_j2", "2026-02-01T00:00:00Z", {}, true)); ok(!r.estimates.rfm.available); eq(r.estimates.rfm.deltaPercentagePoints, undefined); });
    test("cumplir años sigue comparable y se reconoce", () => { const r = I.interpretChange(group("adv_age1", "2026-01-01T00:00:00Z", { ageYears: 35 }, false), group("adv_age2", "2027-01-01T00:00:00Z", { ageYears: 36 }, false)); ok(r.estimates.cunBae.comparable); ok(r.estimates.cunBae.changedInputs.includes("ageYears")); ok(r.explanation.includes("edad introducida cambió")); });
    test("cambio de altura se reconoce como variable matemática", () => { const r = I.interpretChange(group("adv_hgt1", "2026-01-01T00:00:00Z", { heightCm: 180 }, true), group("adv_hgt2", "2026-02-01T00:00:00Z", { heightCm: 179 }, true)); ok(r.estimates.cunBae.changedInputs.includes("heightCm")); ok(r.estimates.rfm.changedInputs.includes("heightCm")); ok(r.explanation.includes("altura introducida cambió")); });
    test("cambio de sexo no se interpreta como evolución", () => { const r = I.interpretChange(group("adv_sx1", "2026-01-01T00:00:00Z", { sex: "male" }, true), group("adv_sx2", "2026-02-01T00:00:00Z", { sex: "female" }, true)); ok(!r.structurallyComparable); eq(r.estimates.cunBae.deltaPercentagePoints, null); ok(r.explanation.includes("coeficientes distintos")); });

    (root.ImoancyBodyFatPhase2Suites || (root.ImoancyBodyFatPhase2Suites = [])).push({ passed, failed: failures.length, failures });
})(globalThis);
