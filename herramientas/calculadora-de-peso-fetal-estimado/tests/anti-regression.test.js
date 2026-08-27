(function runFetalWeightAntiRegressionTests(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var config = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var safety = root.ImoancyFetalWeightSafety;
    var records = root.ImoancyFetalWeightRecords;
    var read = root.ImoancyFetalWeightTestRead;
    var base = root.ImoancyFetalWeightTestBase;
    var sourceFiles = [
        "js/science-config.js",
        "js/science-engine.js",
        "js/safety-screening.js",
        "js/fetal-records.js"
    ];
    var sources = {};

    sourceFiles.forEach(function loadSource(relativePath) {
        sources[relativePath] = read(base + "/" + relativePath);
    });

    function collectKeys(value, output, seen) {
        var result = output || [];
        var visited = seen || [];

        if (!value || typeof value !== "object" || visited.indexOf(value) !== -1) {
            return result;
        }

        visited.push(value);
        Object.keys(value).forEach(function visit(key) {
            result.push(key);
            collectKeys(value[key], result, visited);
        });
        return result;
    }

    function currentReferenceSnapshot(evaluation) {
        return {
            referenceId: evaluation.referencePosition.referenceId,
            referenceVersion: evaluation.referencePosition.referenceVersion,
            zScore: evaluation.referencePosition.zScore,
            percentile: evaluation.referencePosition.percentile
        };
    }

    function reportEntry(id, createdAt, scanDate, weeks, days, grams, snapshot) {
        var input = {
            recordId: id,
            createdAt: createdAt,
            scanDate: scanDate,
            gestationalAgeWeeks: weeks,
            gestationalAgeDays: days,
            efwGrams: grams,
            efwSource: "report_entered",
            efwMethod: "hadlock_hc_ac_fl"
        };

        if (snapshot) {
            input.referenceId = snapshot.referenceId;
            input.referenceVersion = snapshot.referenceVersion;
            input.zScore = snapshot.zScore;
            input.percentile = snapshot.percentile;
        }
        return records.buildFetalPassportEntry(input);
    }

    h.test("harness close acepta igualdad finita exacta", function () {
        h.close(1.25, 1.25, 0);
    });
    h.test("harness close rechaza actual NaN", function () {
        h.throws(function () { h.close(NaN, 1, 1); }, "actual value is not finite");
    });
    h.test("harness close rechaza expected infinito", function () {
        h.throws(function () { h.close(1, Infinity, 1); }, "expected value is not finite");
    });
    h.test("harness close rechaza tolerancia NaN", function () {
        h.throws(function () { h.close(1, 1, NaN); }, "tolerance is invalid");
    });
    h.test("harness close rechaza tolerancia negativa", function () {
        h.throws(function () { h.close(1, 1, -1); }, "tolerance is invalid");
    });

    h.test("módulos científicos no acceden al DOM", function () {
        sourceFiles.forEach(function inspect(relativePath) {
            var source = sources[relativePath];
            h.equal(/\bdocument\s*\.|querySelector\s*\(|getElementById\s*\(/.test(source), false,
                relativePath + " contains DOM access");
        });
    });
    h.test("módulos científicos no almacenan ni transmiten datos", function () {
        sourceFiles.forEach(function inspect(relativePath) {
            var source = sources[relativePath];
            h.equal(/\b(localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|sendBeacon)\b/.test(source), false,
                relativePath + " contains storage/network access");
        });
    });
    h.test("núcleo y Pasaporte no generan reloj ni identificadores", function () {
        ["js/science-engine.js", "js/fetal-records.js"].forEach(function inspect(relativePath) {
            var source = sources[relativePath];
            h.equal(/\bDate\s*\.\s*now\s*\(|\bnew\s+Date\s*\(|\bMath\s*\.\s*random\s*\(/.test(source), false,
                relativePath + " contains clock/random generation");
        });
    });
    h.test("motor no duplica literales de coeficientes Hadlock", function () {
        var engine = sources["js/science-engine.js"];
        ["1.326", "0.00326", "0.0107", "0.0438", "0.158"].forEach(function absent(literal) {
            h.equal(engine.indexOf(literal), -1, "engine duplicates coefficient " + literal);
        });
    });
    h.test("motor no contiene tabla semanal heredada", function () {
        var engine = sources["js/science-engine.js"];
        h.equal(engine.indexOf("INTERGROWTH_HADLOCK"), -1);
        h.equal(engine.indexOf("interpolarCurvas"), -1);
        h.equal(engine.indexOf("obtenerCurvas"), -1);
    });
    h.test("configuración mantiene única fórmula Hadlock primaria", function () {
        h.equal(config.hadlock.averagesMultipleMethods, false);
        h.equal(config.guardrails.averagesEfwMethods, false);
        h.equal(config.hadlock.id, "hadlock_hc_ac_fl");
    });

    h.test("salida educativa no crea campos clínicos prescriptivos", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500
        });
        var keys = collectKeys(result);
        [
            "diagnosis",
            "growthClassification",
            "riskScore",
            "clinicalRecommendation",
            "recommendedDeliveryDate",
            "predictedBirthWeight",
            "futureWeight"
        ].forEach(function forbidden(key) {
            h.equal(keys.indexOf(key), -1, "forbidden output key " + key);
        });
    });
    h.test("safety no devuelve cantidades científicas", function () {
        var decision = safety.screenFetalWeightContext({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            seeksDiagnosis: false,
            seeksClinicalInterpretation: false,
            efwGrams: 1500
        });
        var keys = collectKeys(decision);
        ["efwGrams", "zScore", "percentile", "referenceCentiles", "estimatedFetalWeight"]
            .forEach(function forbidden(key) {
                h.equal(keys.indexOf(key), -1, "safety leaked " + key);
            });
    });
    h.test("múltiples nunca reciben EFW ni posición singleton", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "multiple",
            inputMode: "biometrics",
            gestationalAge: { weeks: 30, days: 0 },
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        });
        h.equal(result.status, "unsupported_population");
        h.equal(result.efwObservation, null);
        h.equal(result.referencePosition, null);
    });
    h.test("posición válida siempre identifica referencia y versión", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500,
            reportedMethod: "hadlock_hc_ac_fl"
        });
        h.equal(result.referencePosition.referenceId, config.reference.id);
        h.equal(result.referencePosition.referenceVersion, config.reference.version);
        h.equal(result.referencePosition.reference.id, config.reference.id);
        h.equal(result.referencePosition.reference.version, config.reference.version);
    });
    h.test("Pasaporte conserva snapshot del motor sin recalcular por fecha", function () {
        var evaluation = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500,
            reportedMethod: "hadlock_hc_ac_fl"
        });
        var snapshot = currentReferenceSnapshot(evaluation);
        var entry = reportEntry("ar-1", "caller-time", "2026-08-20", 30, 0, 1500, snapshot);
        h.equal(entry.referenceId, snapshot.referenceId);
        h.equal(entry.referenceVersion, snapshot.referenceVersion);
        h.close(entry.zScore, snapshot.zScore, 0);
        h.close(entry.percentile, snapshot.percentile, 0);
        h.equal(entry.createdAt, "caller-time");
    });
    h.test("comparación del Pasaporte sigue siendo descriptiva", function () {
        var first = reportEntry("ar-a", "t-a", "2026-08-01", 30, 0, 1500, null);
        var second = reportEntry("ar-b", "t-b", "2026-08-15", 32, 0, 1800, null);
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.comparisonType, "descriptive_only");
        h.equal(result.semantics.differencesAreMathematicalOnly, true);
        h.equal(result.semantics.clinicalMeaningAttached, false);
        h.equal(result.semantics.futureInferenceAttached, false);
    });
    h.test("regresión: método conocido incompatible no obtiene percentil", function () {
        var result = science.evaluateFetalWeight({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500,
            reportedMethod: "intergrowth_two_parameter"
        });
        h.equal(result.status, "incompatible_efw_method");
        h.equal(result.referencePosition.percentile, null);
        h.equal(result.referencePosition.zScore, null);
    });
    h.test("suite conserva al menos 500 casos lógicos", function () {
        var minimumLogicalTests = 500;
        var totalIncludingThisGuard = h.result().total + 1;

        /* Stable floor, not an exact snapshot: growth does not require updating it. */
        h.ok(totalIncludingThisGuard >= minimumLogicalTests,
            "only " + String(totalIncludingThisGuard) + " logical tests");
    });
}(globalThis));
