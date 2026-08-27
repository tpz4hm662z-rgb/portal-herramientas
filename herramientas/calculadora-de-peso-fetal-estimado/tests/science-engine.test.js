(function runFetalWeightScienceTests(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var config = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;

    function issueCodes(result) {
        return (result.errors || []).map(function codeOf(item) {
            return item.code;
        });
    }

    function biometrics(changes) {
        var value = { hcCm: 30, acCm: 28, flCm: 5.5 };

        Object.keys(changes || {}).forEach(function apply(key) {
            value[key] = changes[key];
        });
        return value;
    }

    function referenceInput(weeks, days) {
        return {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: { weeks: weeks, days: days }
        };
    }

    function observation(efwGrams, method) {
        return {
            efwGrams: efwGrams,
            source: method === "hadlock_hc_ac_fl" ?
                "imoancy_hadlock_hc_ac_fl" : "report_entered",
            method: method
        };
    }

    function positionInput(weeks, days, efwGrams, method) {
        var value = referenceInput(weeks, days);
        value.efwObservation = observation(efwGrams, method || "hadlock_hc_ac_fl");
        return value;
    }

    function centile(result, percentile) {
        return result.referenceCentiles.filter(function matches(row) {
            return row.percentile === percentile;
        })[0];
    }

    h.test("configuración científica fetal disponible", function () {
        h.ok(config && typeof config === "object");
    });
    h.test("API científica fetal disponible", function () {
        h.ok(science && typeof science.evaluateFetalWeight === "function");
        h.equal(typeof science.hasEfwReferenceMathematicalSupport, "function");
    });
    h.test("configuración científica profundamente congelada", function () {
        h.ok(h.isDeepFrozen(config));
    });
    h.test("API científica profundamente congelada", function () {
        h.ok(h.isDeepFrozen(science));
    });
    h.test("versiones científicas y de Pasaporte son explícitas", function () {
        h.equal(config.scienceVersion, "1.0.0");
        h.equal(science.scienceVersion, config.scienceVersion);
        h.equal(config.schemaVersions.fetalPassportEntry, "1.0.0");
    });
    h.test("superficie pública del motor es mínima y estable", function () {
        h.keys(science, [
            "scienceVersion",
            "normalizeGestationalAge",
            "convertBiometricsMmToCm",
            "calculateHadlockHcAcFl",
            "resolveEfwObservation",
            "getIntergrowthHadlockLms",
            "hasEfwReferenceMathematicalSupport",
            "positionEfwInReference",
            "generateReferenceCentiles",
            "evaluateFetalWeight"
        ]);
    });
    h.test("coeficientes Hadlock HC AC FL permanecen exactos", function () {
        h.deepEqual(config.hadlock.coefficients, {
            intercept: 1.326,
            acTimesFl: -0.00326,
            hc: 0.0107,
            ac: 0.0438,
            fl: 0.158
        });
    });
    h.test("Hadlock primario exige HC AC FL y nunca BPD", function () {
        h.deepEqual(config.hadlock.requiredBiometrics, ["hcCm", "acCm", "flCm"]);
        h.equal(config.hadlock.bpdUsed, false);
        h.equal(config.abbreviations.BPD.usedInPrimaryHadlock, false);
    });
    h.test("fuentes Hadlock e INTERGROWTH son trazables por DOI", function () {
        h.equal(config.sources.hadlock_1985.doi, "10.1016/0002-9378(85)90298-4");
        h.equal(config.sources.intergrowth_hadlock_2020.doi, "10.1002/uog.22000");
    });
    h.test("dominio INTERGROWTH publicado es inclusivo de 18+0 a 41+0", function () {
        var domain = config.reference.gestationalAgeDomain;
        h.equal(domain.minimumTotalDays, 126);
        h.equal(domain.maximumTotalDays, 287);
        h.equal(domain.inclusive, true);
        h.equal(domain.extrapolates, false);
        h.equal(domain.clamps, false);
        h.equal(domain.interpolatesWeeklyRows, false);
    });
    h.test("motor declara ln(EFW) y LMS, no una tabla interpolada", function () {
        h.equal(config.reference.responseTransformation, "natural_log_of_efw_grams");
        h.equal(config.reference.distribution, "box_cox_gaussian_lms");
        h.equal(config.reference.verification.legacyWeeklyRowsUsedByRuntime, false);
    });
    h.test("guardrails científicos críticos permanecen desactivados", function () {
        Object.keys(config.guardrails).forEach(function isFalse(key) {
            h.equal(config.guardrails[key], false, "guardrail " + key + " must remain false");
        });
    });

    [
        [0, 0, 0, 0],
        [18, 0, 126, 18],
        [18, 1, 127, 18 + (1 / 7)],
        [18, 6, 132, 18 + (6 / 7)],
        [19, 0, 133, 19],
        [41, 0, 287, 41]
    ].forEach(function testValidGestationalAge(row) {
        h.test("edad gestacional exacta " + row[0] + "+" + row[1], function () {
            var result = science.normalizeGestationalAge({ weeks: row[0], days: row[1] });
            h.equal(result.status, "valid");
            h.equal(result.gestationalAge.totalDays, row[2]);
            h.close(result.gestationalAge.continuousWeeks, row[3], 1e-14);
            h.equal(result.gestationalAge.unit, "exact_weeks");
        });
    });
    h.test("edad gestacional conserva semántica de no redatación", function () {
        var result = science.normalizeGestationalAge({ weeks: 30, days: 3 });
        h.equal(result.semantics.redatedFromBiometrics, false);
        h.equal(result.semantics.redatedFromEstimatedFetalWeight, false);
        h.equal(result.semantics.inputConvention, "completed_weeks_plus_additional_days");
    });
    [
        ["vacío", {}, "incomplete", "missing_weeks"],
        ["sin días", { weeks: 18 }, "incomplete", "missing_days"],
        ["sin semanas", { days: 0 }, "incomplete", "missing_weeks"],
        ["semanas texto", { weeks: "18", days: 0 }, "invalid", "invalid_weeks"],
        ["días texto", { weeks: 18, days: "0" }, "invalid", "invalid_days"],
        ["semana fraccionaria", { weeks: 18.5, days: 0 }, "invalid", "invalid_weeks"],
        ["semana negativa", { weeks: -1, days: 0 }, "invalid", "invalid_weeks"],
        ["día negativo", { weeks: 18, days: -1 }, "invalid", "invalid_days"],
        ["día siete", { weeks: 18, days: 7 }, "invalid", "invalid_days"],
        ["día fraccionario", { weeks: 18, days: 0.5 }, "invalid", "invalid_days"],
        ["semana NaN", { weeks: NaN, days: 0 }, "invalid", "invalid_weeks"],
        ["día infinito", { weeks: 18, days: Infinity }, "invalid", "invalid_days"],
        ["nulo", null, "invalid", "invalid_gestationalAge"],
        ["array", [18, 0], "invalid", "invalid_gestationalAge"]
    ].forEach(function testInvalidGestationalAge(row) {
        h.test("rechaza edad gestacional: " + row[0], function () {
            var result = science.normalizeGestationalAge(row[1]);
            h.equal(result.status, row[2]);
            h.equal(result.gestationalAge, null);
            h.includes(issueCodes(result), row[3]);
        });
    });
    h.test("edad gestacional exige propiedades propias", function () {
        var inherited = Object.create({ weeks: 18 });
        inherited.days = 0;
        var result = science.normalizeGestationalAge(inherited);
        h.equal(result.status, "incomplete");
        h.includes(issueCodes(result), "missing_weeks");
    });
    h.test("normalización de edad es pura, determinista e inmutable", function () {
        var input = { weeks: 30, days: 4 };
        var before = JSON.stringify(input);
        var first = science.normalizeGestationalAge(input);
        var second = science.normalizeGestationalAge(input);
        h.equal(JSON.stringify(input), before);
        h.deepEqual(first, second);
        h.ok(h.isDeepFrozen(first));
    });
    h.test("normalización acepta input de edad congelado", function () {
        var input = Object.freeze({ weeks: 32, days: 6 });
        var result = science.normalizeGestationalAge(input);
        h.equal(result.status, "valid");
        h.equal(result.gestationalAge.totalDays, 230);
        h.deepEqual(input, { weeks: 32, days: 6 });
    });
    h.test("transición 32+6 a 33+0 avanza exactamente un día", function () {
        var before = science.normalizeGestationalAge({ weeks: 32, days: 6 });
        var after = science.normalizeGestationalAge({ weeks: 33, days: 0 });
        h.equal(after.gestationalAge.totalDays - before.gestationalAge.totalDays, 1);
        h.close(after.gestationalAge.continuousWeeks - before.gestationalAge.continuousWeeks, 1 / 7, 1e-14);
    });

    [
        [{ hcMm: 300, acMm: 280, flMm: 55 }, { hcCm: 30, acCm: 28, flCm: 5.5 }],
        [{ hcMm: 254.5, acMm: 228.25, flMm: 42.75 }, { hcCm: 25.45, acCm: 22.825, flCm: 4.275 }]
    ].forEach(function testConversion(row, index) {
        h.test("conversión mm a cm fixture " + String(index + 1), function () {
            var result = science.convertBiometricsMmToCm(row[0]);
            h.equal(result.status, "valid");
            h.deepEqual(result.biometrics, row[1]);
            h.deepEqual(result.units, { input: "mm", output: "cm" });
            h.equal(result.semantics.conversionOnly, true);
            h.equal(result.semantics.changesGestationalAge, false);
        });
    });
    ["hcMm", "acMm", "flMm"].forEach(function testMissingMm(field) {
        h.test("conversión exige " + field, function () {
            var input = { hcMm: 300, acMm: 280, flMm: 55 };
            delete input[field];
            var result = science.convertBiometricsMmToCm(input);
            h.equal(result.status, "incomplete");
            h.includes(issueCodes(result), "missing_" + field);
        });
    });
    ["hcMm", "acMm", "flMm"].forEach(function testMmTypeField(field) {
        ["300", null, true, [], {}].forEach(function testMmType(value, index) {
            h.test("conversión no coacciona " + field + " tipo hostil " + String(index + 1), function () {
                var input = { hcMm: 300, acMm: 280, flMm: 55 };
                input[field] = value;
                var result = science.convertBiometricsMmToCm(input);
                h.equal(result.status, "invalid");
                h.includes(issueCodes(result), "invalid_" + field);
            });
        });
        h.test("conversión no invoca valueOf de " + field, function () {
            var invoked = false;
            var hostile = {
                valueOf: function forbiddenCoercion() {
                    invoked = true;
                    throw new Error("coercion attempted");
                }
            };
            var input = { hcMm: 300, acMm: 280, flMm: 55 };
            input[field] = hostile;
            h.equal(science.convertBiometricsMmToCm(input).status, "invalid");
            h.equal(invoked, false);
        });
    });
    [
        ["cero", 0, "non_positive_hcMm"],
        ["cero negativo", -0, "non_positive_hcMm"],
        ["negativo", -1, "non_positive_hcMm"],
        ["NaN", NaN, "invalid_hcMm"],
        ["infinito", Infinity, "invalid_hcMm"],
        ["menos infinito", -Infinity, "invalid_hcMm"]
    ].forEach(function testInvalidMm(row) {
        h.test("conversión rechaza HC " + row[0], function () {
            var result = science.convertBiometricsMmToCm({
                hcMm: row[1], acMm: 280, flMm: 55
            });
            h.equal(result.status, "invalid");
            h.includes(issueCodes(result), row[2]);
        });
    });
    h.test("conversión rechaza contenedor no objeto", function () {
        var result = science.convertBiometricsMmToCm(null);
        h.equal(result.status, "invalid");
        h.includes(issueCodes(result), "invalid_biometrics");
    });
    h.test("conversión es pura y devuelve salida profundamente congelada", function () {
        var input = { hcMm: 300, acMm: 280, flMm: 55 };
        var before = JSON.stringify(input);
        var result = science.convertBiometricsMmToCm(input);
        h.equal(JSON.stringify(input), before);
        h.ok(h.isDeepFrozen(result));
    });

    [
        [{ hcCm: 30, acCm: 28, flCm: 5.5 }, 3.24036, 1739.24194230028],
        [{ hcCm: 25.4, acCm: 22.8, flCm: 4.2 }, 2.9478424, 886.834132696419],
        [{ hcCm: 35.2, acCm: 33.1, flCm: 7.1 }, 3.5080874, 3221.7170835218],
        [{ hcCm: 1, acCm: 1, flCm: 1 }, 1.53524, 34.2957259373864]
    ].forEach(function testIndependentHadlockFixture(row, index) {
        h.test("Hadlock fixture independiente " + String(index + 1), function () {
            var result = science.calculateHadlockHcAcFl(row[0]);
            h.equal(result.status, "valid");
            h.close(result.estimate.log10Efw, row[1], 1e-12);
            h.close(result.estimate.efwGrams, row[2], 1e-9);
            h.equal(result.estimate.type, "estimated_fetal_weight");
        });
    });
    ["hcCm", "acCm", "flCm"].forEach(function testMissingHadlockField(field) {
        h.test("Hadlock exige " + field, function () {
            var input = biometrics();
            delete input[field];
            var result = science.calculateHadlockHcAcFl(input);
            h.equal(result.status, "incomplete");
            h.includes(issueCodes(result), "missing_" + field);
        });
    });
    ["hcCm", "acCm", "flCm"].forEach(function testHostileHadlockField(field) {
        [0, -0, -1, NaN, Infinity, -Infinity, "30", null, true, [], {}].forEach(function testHostileValue(value, index) {
            h.test("Hadlock rechaza " + field + " caso hostil " + String(index + 1), function () {
                var changes = {};
                changes[field] = value;
                var result = science.calculateHadlockHcAcFl(biometrics(changes));
                h.equal(result.status, "invalid");
                h.equal(result.estimate, null);
            });
        });
        h.test("Hadlock no invoca valueOf de " + field, function () {
            var invoked = false;
            var hostile = {
                valueOf: function forbiddenCoercion() {
                    invoked = true;
                    throw new Error("coercion attempted");
                }
            };
            var changes = {};
            changes[field] = hostile;
            h.equal(science.calculateHadlockHcAcFl(biometrics(changes)).status, "invalid");
            h.equal(invoked, false);
        });
    });
    h.test("Hadlock rechaza desbordamiento matemático", function () {
        var result = science.calculateHadlockHcAcFl({
            hcCm: 1e308, acCm: 1e308, flCm: 1e308
        });
        h.equal(result.status, "invalid");
        h.includes(issueCodes(result), "non_finite_hadlock_result");
    });
    h.test("BPD y campos ajenos no alteran Hadlock", function () {
        var plain = science.calculateHadlockHcAcFl(biometrics());
        var extra = biometrics({ bpdCm: 7.7, gestationalAge: 30 });
        var withExtra = science.calculateHadlockHcAcFl(extra);
        h.close(withExtra.estimate.efwGrams, plain.estimate.efwGrams, 0);
        h.equal(Object.prototype.hasOwnProperty.call(withExtra.inputs, "bpdCm"), false);
    });
    h.test("Hadlock no consulta getter de BPD no utilizado", function () {
        var input = biometrics();
        Object.defineProperty(input, "bpdCm", {
            enumerable: true,
            get: function forbiddenGetter() { throw new Error("BPD read"); }
        });
        h.equal(science.calculateHadlockHcAcFl(input).status, "valid");
    });
    h.test("Hadlock conserva semántica de estimación no diagnóstica", function () {
        var result = science.calculateHadlockHcAcFl(biometrics());
        h.equal(result.semantics.isEstimatedFetalWeight, true);
        h.equal(result.semantics.isActualFetalWeight, false);
        h.equal(result.semantics.isDiagnosis, false);
        h.equal(result.semantics.changesGestationalAge, false);
        h.equal(result.semantics.averagesMultipleMethods, false);
        h.equal(result.estimate.source, "imoancy_hadlock_hc_ac_fl");
        h.equal(result.estimate.method, "hadlock_hc_ac_fl");
    });
    h.test("Hadlock es puro, determinista y no redondea internamente", function () {
        var input = biometrics();
        var before = JSON.stringify(input);
        var first = science.calculateHadlockHcAcFl(input);
        var second = science.calculateHadlockHcAcFl(input);
        h.equal(JSON.stringify(input), before);
        h.deepEqual(first, second);
        h.ok(h.isDeepFrozen(first));
        h.ok(first.estimate.efwGrams !== Math.round(first.estimate.efwGrams));
    });
    h.test("Hadlock acepta biometrías explícitamente congeladas sin mutarlas", function () {
        var input = Object.freeze({ hcCm: 30, acCm: 28, flCm: 5.5 });
        var result = science.calculateHadlockHcAcFl(input);
        h.equal(result.status, "valid");
        h.close(result.estimate.efwGrams, 1739.24194230028, 1e-9);
        h.deepEqual(input, { hcCm: 30, acCm: 28, flCm: 5.5 });
    });

    h.test("observación biométrica usa exclusivamente Hadlock HC AC FL", function () {
        var result = science.resolveEfwObservation({ mode: "biometrics", biometrics: biometrics() });
        h.equal(result.status, "valid");
        h.equal(result.mode, "biometrics");
        h.equal(result.observation.method, "hadlock_hc_ac_fl");
        h.close(result.observation.efwGrams, 1739.24194230028, 1e-9);
    });
    h.test("observación de informe conserva el EFW introducido", function () {
        var result = science.resolveEfwObservation({
            mode: "report_entered", efwGrams: 1739.25, reportedMethod: "  Hadlock local  "
        });
        h.equal(result.status, "valid");
        h.equal(result.observation.efwGrams, 1739.25);
        h.equal(result.observation.method, "Hadlock local");
        h.equal(result.observation.log10Efw, null);
        h.equal(result.observation.biometrics, null);
    });
    [undefined, null].forEach(function testUnknownReportedMethod(value, index) {
        h.test("informe sin método conocido caso " + String(index + 1), function () {
            var input = { mode: "report_entered", efwGrams: 1200 };
            if (index === 1) {
                input.reportedMethod = value;
            }
            h.equal(science.resolveEfwObservation(input).observation.method, "unknown");
        });
    });
    [
        [{}, "incomplete"],
        [{ mode: "otra" }, "invalid"],
        [{ mode: "biometrics" }, "incomplete"],
        [{ mode: "report_entered" }, "incomplete"],
        [{ mode: "report_entered", efwGrams: 0 }, "invalid"],
        [{ mode: "report_entered", efwGrams: -1 }, "invalid"],
        [{ mode: "report_entered", efwGrams: NaN }, "invalid"],
        [{ mode: "report_entered", efwGrams: 1200, reportedMethod: "  " }, "invalid"]
    ].forEach(function testInvalidObservation(row, index) {
        h.test("observación inválida caso " + String(index + 1), function () {
            var result = science.resolveEfwObservation(row[0]);
            h.equal(result.status, row[1]);
            h.equal(result.observation, null);
        });
    });
    h.test("modo informe no consulta biometrías ajenas a su rama", function () {
        var input = { mode: "report_entered", efwGrams: 1200 };
        Object.defineProperty(input, "biometrics", {
            get: function forbiddenGetter() { throw new Error("biometrics read"); }
        });
        h.equal(science.resolveEfwObservation(input).status, "valid");
    });
    h.test("modo biométrico no consulta EFW ajeno a su rama", function () {
        var input = { mode: "biometrics", biometrics: biometrics() };
        Object.defineProperty(input, "efwGrams", {
            get: function forbiddenGetter() { throw new Error("efw read"); }
        });
        h.equal(science.resolveEfwObservation(input).status, "valid");
    });
    h.test("resolución de observación es pura y profundamente congelada", function () {
        var input = { mode: "report_entered", efwGrams: 1200, reportedMethod: "Hadlock" };
        var before = JSON.stringify(input);
        var result = science.resolveEfwObservation(input);
        h.equal(JSON.stringify(input), before);
        h.ok(h.isDeepFrozen(result));
        h.equal(result.semantics.isActualFetalWeight, false);
        h.equal(result.semantics.methodIsInferred, false);
    });

    [
        [18, 0, "valid"],
        [18, 1, "valid"],
        [18, 6, "valid"],
        [40, 6, "valid"],
        [41, 0, "valid"],
        [17, 6, "reference_out_of_range"],
        [41, 1, "reference_out_of_range"],
        [42, 0, "reference_out_of_range"]
    ].forEach(function testReferenceDomain(row) {
        h.test("dominio de referencia " + row[0] + "+" + row[1], function () {
            var result = science.getIntergrowthHadlockLms(referenceInput(row[0], row[1]));
            h.equal(result.status, row[2]);
            h.equal(result.lms === null, row[2] !== "valid");
        });
    });
    [
        [{ gestationalAge: { weeks: 30, days: 0 } }, "incomplete"],
        [{ pregnancyPopulation: "singleton_confirmed" }, "incomplete"],
        [{ pregnancyPopulation: "multiple", gestationalAge: { weeks: 30, days: 0 } }, "unsupported_population"],
        [{ pregnancyPopulation: "unknown", gestationalAge: { weeks: 30, days: 0 } }, "invalid"],
        [null, "invalid"]
    ].forEach(function testReferenceValidation(row, index) {
        h.test("validación LMS caso " + String(index + 1), function () {
            h.equal(science.getIntergrowthHadlockLms(row[0]).status, row[1]);
        });
    });
    [
        [18, -2.8133234310450028, 5.3761395237263, 0.017016043530463276],
        [30, 0.28479693973678266, 7.2691934078448375, 0.014781064899240042],
        [41, 2.9842488010055037, 8.185461977580028, 0.0156844882743533]
    ].forEach(function testIndependentLmsFixture(row) {
        h.test("LMS Table S1 fixture semana " + row[0], function () {
            var result = science.getIntergrowthHadlockLms(referenceInput(row[0], 0));
            h.equal(result.status, "valid");
            h.close(result.lms.lambda, row[1], 1e-13);
            h.close(result.lms.mu, row[2], 1e-13);
            h.close(result.lms.sigma, row[3], 1e-15);
        });
    });

    /*
     * External rounded-gram fixtures transcribed from the publisher's official
     * uog22000 Table S2 (DOI 10.1002/uog.22000). They are deliberately literal:
     * expected values must never be regenerated by the implementation under test.
     * This protects the published/computable 18+0--41+0 rows; it does not turn
     * that table domain into a routine clinical-use recommendation.
     */
    var officialTableS2Percentiles = [3, 5, 10, 50, 90, 95, 97];
    var officialTableS2RoundedGrams = [
        [18, 184, 187, 193, 216, 244, 253, 260],
        [19, 224, 228, 235, 263, 297, 308, 316],
        [20, 271, 276, 284, 318, 359, 372, 381],
        [21, 324, 330, 341, 381, 430, 446, 457],
        [22, 385, 392, 405, 454, 513, 532, 544],
        [23, 453, 463, 478, 537, 607, 629, 645],
        [24, 530, 541, 559, 630, 714, 740, 758],
        [25, 616, 629, 650, 734, 834, 865, 887],
        [26, 710, 726, 751, 851, 968, 1005, 1030],
        [27, 813, 832, 862, 979, 1116, 1160, 1189],
        [28, 925, 947, 982, 1119, 1279, 1330, 1364],
        [29, 1046, 1072, 1113, 1272, 1457, 1515, 1554],
        [30, 1175, 1205, 1252, 1435, 1649, 1716, 1760],
        [31, 1312, 1346, 1400, 1610, 1854, 1930, 1981],
        [32, 1455, 1494, 1556, 1795, 2072, 2158, 2216],
        [33, 1604, 1648, 1718, 1988, 2300, 2397, 2462],
        [34, 1757, 1807, 1885, 2189, 2538, 2646, 2719],
        [35, 1913, 1968, 2056, 2394, 2782, 2902, 2983],
        [36, 2070, 2131, 2228, 2602, 3031, 3163, 3251],
        [37, 2226, 2293, 2400, 2811, 3280, 3425, 3522],
        [38, 2379, 2453, 2569, 3017, 3527, 3684, 3789],
        [39, 2527, 2607, 2733, 3217, 3768, 3937, 4051],
        [40, 2667, 2753, 2888, 3409, 3999, 4180, 4302],
        [41, 2798, 2889, 3034, 3588, 4217, 4409, 4538]
    ];
    h.test("fixtures Table S2 cubren exactamente 18-41 y siete centiles", function () {
        h.deepEqual(officialTableS2RoundedGrams.map(function weekOf(row) {
            return row[0];
        }), [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41]);
        officialTableS2RoundedGrams.forEach(function hasEveryCentile(row) {
            h.equal(row.length, officialTableS2Percentiles.length + 1);
        });
    });
    officialTableS2RoundedGrams.forEach(function testOfficialTableS2(row) {

        officialTableS2Percentiles.forEach(function testPublishedCell(percentile, index) {
            var publishedGrams = row[index + 1];

            h.test("Table S2 literal semana " + row[0] + " P" + percentile, function () {
                var result = science.generateReferenceCentiles(referenceInput(row[0], 0));
                var calculatedGrams;

                h.equal(result.status, "valid");
                calculatedGrams = centile(result, percentile).efwGrams;
                h.equal(Math.round(calculatedGrams), publishedGrams);
            });
        });
    });
    h.test("centiles configurados incluyen P3 P5 P10 P50 P90 P95 P97", function () {
        var result = science.generateReferenceCentiles(referenceInput(30, 0));
        h.deepEqual(result.referenceCentiles.map(function percentile(row) {
            return row.percentile;
        }), [3, 5, 10, 50, 90, 95, 97]);
        h.equal(result.semantics.valuesAreExpectedIndividualWeights, false);
        h.equal(result.semantics.derivedFromSameLmsEngine, true);
    });
    h.test("días adicionales usan edad continua y no interpolación semanal", function () {
        var at18 = centile(science.generateReferenceCentiles(referenceInput(18, 0)), 50).efwGrams;
        var at19 = centile(science.generateReferenceCentiles(referenceInput(19, 0)), 50).efwGrams;
        var atThreeDays = centile(science.generateReferenceCentiles(referenceInput(18, 3)), 50).efwGrams;
        var linear = at18 + ((at19 - at18) * (3 / 7));
        h.ok(atThreeDays > at18 && atThreeDays < at19);
        h.ok(Math.abs(atThreeDays - linear) > 0.01);
    });
    h.test("P50 aumenta de forma continua cada día de 18+0 a 19+0", function () {
        var previous = 0;
        var day;
        var value;
        for (day = 0; day <= 6; day += 1) {
            value = centile(science.generateReferenceCentiles(referenceInput(18, day)), 50).efwGrams;
            h.ok(value > previous);
            previous = value;
        }
        h.ok(centile(science.generateReferenceCentiles(referenceInput(19, 0)), 50).efwGrams > previous);
    });
    [3, 5, 10, 50, 90, 95, 97].forEach(function testRoundTripPercentile(percentile) {
        h.test("round-trip de centil P" + percentile, function () {
            var generated = science.generateReferenceCentiles(referenceInput(30, 3));
            var target = centile(generated, percentile);
            var positioned = science.positionEfwInReference(
                positionInput(30, 3, target.efwGrams, "hadlock_hc_ac_fl")
            );
            h.equal(positioned.status, "valid");
            h.close(positioned.zScore, target.zScore, 1e-11);
            h.close(positioned.percentile, percentile, 0.00002);
        });
    });
    h.test("posición conserva percentil de cola sin clamp artificial", function () {
        var low = science.positionEfwInReference(positionInput(30, 0, 1.000001));
        var high = science.positionEfwInReference(positionInput(30, 0, Number.MAX_VALUE));
        h.equal(low.status, "valid");
        h.equal(high.status, "valid");
        h.ok(low.percentile <= 0.001);
        h.ok(high.percentile >= 99.999);
        h.equal(low.semantics.tailPresentation.appliesArtificialClamp, false);
        h.equal(high.semantics.tailPresentation.preservesComputedPercentile, true);
    });
    h.test("EFW fuera del soporte matemático explícito se rechaza", function () {
        var result = science.positionEfwInReference(positionInput(30, 0, 1));
        h.equal(result.status, "invalid");
        h.includes(issueCodes(result), "efw_outside_reference_mathematical_support");
    });
    [
        ["hadlock_hc_ac_fl", "compatible_hadlock_hc_ac_fl"],
        ["unknown", "unknown_report_method"],
        ["otra_formula", "reported_method_not_confirmed_as_hadlock_hc_ac_fl"]
    ].forEach(function testMethodCompatibility(row) {
        h.test("compatibilidad de método " + row[0], function () {
            var result = science.positionEfwInReference(positionInput(30, 0, 1500, row[0]));
            h.equal(result.reference.observedEfwMethodCompatibility, row[1]);
            if (row[0] === "otra_formula") {
                h.equal(result.status, "incompatible_efw_method");
                h.equal(result.zScore, null);
                h.equal(result.percentile, null);
                h.includes(issueCodes(result), "efw_method_incompatible_with_reference");
            } else {
                h.equal(result.status, "valid");
            }
        });
    });
    h.test("generación de centiles bloquea múltiples", function () {
        var result = science.generateReferenceCentiles({
            pregnancyPopulation: "multiple",
            gestationalAge: { weeks: 30, days: 0 }
        });
        h.equal(result.status, "unsupported_population");
        h.equal(result.referenceCentiles, null);
    });
    h.test("generación de centiles no extrapola fuera del dominio", function () {
        var result = science.generateReferenceCentiles(referenceInput(41, 1));
        h.equal(result.status, "reference_out_of_range");
        h.equal(result.referenceCentiles, null);
    });
    h.test("dos modos producen igual posición para mismo EFW Hadlock", function () {
        var calculated = science.calculateHadlockHcAcFl(biometrics()).estimate.efwGrams;
        var fromBiometrics = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "biometrics",
            gestationalAge: { weeks: 30, days: 3 },
            biometrics: biometrics()
        });
        var fromReport = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 3 },
            efwGrams: calculated,
            reportedMethod: "hadlock_hc_ac_fl"
        });
        h.equal(fromBiometrics.status, "valid");
        h.equal(fromReport.status, "valid");
        h.close(fromBiometrics.referencePosition.zScore, fromReport.referencePosition.zScore, 0);
        h.close(fromBiometrics.referencePosition.percentile, fromReport.referencePosition.percentile, 0);
    });
    h.test("cambiar biometrías nunca cambia la edad gestacional aportada", function () {
        var first = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "biometrics",
            gestationalAge: { weeks: 32, days: 6 },
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        });
        var second = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "biometrics",
            gestationalAge: { weeks: 32, days: 6 },
            biometrics: { hcCm: 35.2, acCm: 33.1, flCm: 7.1 }
        });
        h.equal(first.status, "valid");
        h.equal(second.status, "valid");
        h.deepEqual(first.gestationalAge, second.gestationalAge);
        h.equal(first.gestationalAge.weeks, 32);
        h.equal(first.gestationalAge.days, 6);
        h.ok(first.efwObservation.efwGrams !== second.efwObservation.efwGrams);
    });
    h.test("embarazo múltiple corta antes de leer biometrías", function () {
        var input = {
            pregnancyPopulation: "multiple",
            inputMode: "biometrics",
            gestationalAge: { weeks: 30, days: 0 }
        };
        Object.defineProperty(input, "biometrics", {
            get: function forbiddenGetter() { throw new Error("singleton path executed"); }
        });
        var result = science.evaluateFetalWeight(input);
        h.equal(result.status, "unsupported_population");
        h.equal(result.efwObservation, null);
        h.equal(result.referencePosition, null);
    });
    h.test("evaluación fuera de rango conserva EFW pero no inventa percentil", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 17, days: 6 },
            efwGrams: 200,
            reportedMethod: "hadlock_hc_ac_fl"
        });
        h.equal(result.status, "reference_out_of_range");
        h.equal(result.efwObservation.efwGrams, 200);
        h.equal(result.referencePosition.percentile, null);
        h.equal(result.referencePosition.zScore, null);
    });
    h.test("evaluación es educativa, no diagnóstica ni predictiva", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500
        });
        h.equal(result.status, "valid");
        h.equal(result.semantics.educationalEstimationOnly, true);
        h.equal(result.semantics.isDiagnosis, false);
        h.equal(result.semantics.changesGestationalAge, false);
        h.equal(result.semantics.predictsFutureWeight, false);
        h.equal(result.referencePosition.semantics.classifiesFetalGrowth, false);
        h.ok(h.isDeepFrozen(result));
    });
}(globalThis));
