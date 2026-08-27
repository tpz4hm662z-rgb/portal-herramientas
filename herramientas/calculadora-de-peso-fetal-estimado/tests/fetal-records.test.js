(function runFetalWeightRecordTests(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var config = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var records = root.ImoancyFetalWeightRecords;

    function reportOptions(changes) {
        var value = {
            recordId: "record-1",
            createdAt: "2026-08-20T10:00:00+02:00",
            gestationalAgeWeeks: 30,
            gestationalAgeDays: 0,
            efwGrams: 1500,
            efwSource: "report_entered"
        };

        Object.keys(changes || {}).forEach(function apply(key) {
            value[key] = changes[key];
        });
        return value;
    }

    function hadlockOptions(changes) {
        var value = {
            recordId: "hadlock-1",
            createdAt: "caller-created-at",
            scanDate: "2026-08-20",
            gestationalAgeWeeks: 30,
            gestationalAgeDays: 3,
            efwGrams: 1739.241942300274,
            efwSource: "imoancy_hadlock_hc_ac_fl",
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        };

        Object.keys(changes || {}).forEach(function apply(key) {
            value[key] = changes[key];
        });
        return value;
    }

    function referenceSnapshot(weeks, days, grams, method) {
        var position = science.positionEfwInReference({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: { weeks: weeks, days: days },
            efwObservation: {
                efwGrams: grams,
                source: method === "hadlock_hc_ac_fl" ?
                    "imoancy_hadlock_hc_ac_fl" : "report_entered",
                method: method
            }
        });

        h.equal(position.status, "valid");
        return {
            referenceId: position.referenceId,
            referenceVersion: position.referenceVersion,
            zScore: position.zScore,
            percentile: position.percentile
        };
    }

    function merge(target, extra) {
        Object.keys(extra || {}).forEach(function assign(key) {
            target[key] = extra[key];
        });
        return target;
    }

    function comparableEntry(id, date, weeks, days, grams) {
        var snapshot = referenceSnapshot(weeks, days, grams, "hadlock_hc_ac_fl");
        return records.buildFetalPassportEntry(reportOptions(merge({
            recordId: id,
            createdAt: "created-" + id,
            scanDate: date,
            gestationalAgeWeeks: weeks,
            gestationalAgeDays: days,
            efwGrams: grams,
            efwMethod: "hadlock_hc_ac_fl",
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        }, snapshot)));
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function nextRepresentableAbove(value) {
        var exponent = Math.floor(Math.log(value) / Math.LN2);
        return value + Math.pow(2, exponent - 52);
    }

    function comparableHadlockEntry(id, date, weeks, days, biometrics) {
        var calculation = science.calculateHadlockHcAcFl(biometrics);
        var snapshot;

        h.equal(calculation.status, "valid");
        snapshot = referenceSnapshot(
            weeks,
            days,
            calculation.estimate.efwGrams,
            "hadlock_hc_ac_fl"
        );

        return records.buildFetalPassportEntry(hadlockOptions(merge({
            recordId: id,
            createdAt: "created-" + id,
            scanDate: date,
            gestationalAgeWeeks: weeks,
            gestationalAgeDays: days,
            efwGrams: calculation.estimate.efwGrams,
            biometrics: biometrics
        }, snapshot)));
    }

    h.test("API de Pasaporte fetal disponible y congelada", function () {
        h.ok(records && typeof records.buildFetalPassportEntry === "function");
        h.ok(typeof records.compareFetalPassportEntries === "function");
        h.ok(Object.isFrozen(records));
    });
    h.test("API de Pasaporte mantiene versiones coordinadas", function () {
        h.equal(records.scienceVersion, config.scienceVersion);
        h.equal(records.schemaVersion, config.schemaVersions.fetalPassportEntry);
    });
    h.test("superficie pública del Pasaporte es mínima", function () {
        h.keys(records, [
            "scienceVersion",
            "schemaVersion",
            "buildFetalPassportEntry",
            "compareFetalPassportEntries"
        ]);
    });
    h.test("entrada mínima de informe tiene contrato exacto y defaults nulos", function () {
        var entry = records.buildFetalPassportEntry(reportOptions());
        h.keys(entry, [
            "schemaVersion", "scienceVersion", "referenceId", "referenceVersion",
            "recordId", "scanDate", "gestationalAgeWeeks", "gestationalAgeDays",
            "efwGrams", "efwSource", "efwMethod", "biometrics", "zScore",
            "percentile", "createdAt"
        ]);
        h.equal(entry.recordId, "record-1");
        h.equal(entry.createdAt, "2026-08-20T10:00:00+02:00");
        h.equal(entry.scanDate, null);
        h.equal(entry.efwMethod, "unknown");
        h.equal(entry.biometrics, null);
        h.equal(entry.referenceId, null);
        h.equal(entry.referenceVersion, null);
        h.equal(entry.zScore, null);
        h.equal(entry.percentile, null);
    });
    h.test("método de informe se normaliza sin inferirlo", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({
            efwMethod: "  hadlock_hc_ac_fl  "
        }));
        h.equal(entry.efwMethod, "hadlock_hc_ac_fl");
        h.equal(entry.efwSource, "report_entered");
    });
    h.test("método unknown explícito permanece unknown", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({ efwMethod: "unknown" }));
        h.equal(entry.efwMethod, "unknown");
    });
    h.test("informe admite biometría parcial sin inventar medidas", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({
            biometrics: { hcCm: 30 }
        }));
        h.deepEqual(entry.biometrics, { hcCm: 30, acCm: null, flCm: null });
    });
    h.test("referencia externa sin números se conserva como metadato", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({
            referenceId: "external-reference",
            referenceVersion: "2025",
            zScore: null,
            percentile: null
        }));
        h.equal(entry.referenceId, "external-reference");
        h.equal(entry.referenceVersion, "2025");
        h.equal(entry.zScore, null);
        h.equal(entry.percentile, null);
    });
    h.test("referencia actual acepta snapshot exacto verificado", function () {
        var snapshot = referenceSnapshot(30, 0, 1500, "hadlock_hc_ac_fl");
        var entry = records.buildFetalPassportEntry(reportOptions(merge({
            efwMethod: "hadlock_hc_ac_fl"
        }, snapshot)));
        h.equal(entry.referenceId, config.reference.id);
        h.equal(entry.referenceVersion, config.reference.version);
        h.close(entry.zScore, snapshot.zScore, 0);
        h.close(entry.percentile, snapshot.percentile, 0);
    });
    h.test("referencia actual puede registrarse sin posición numérica", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({
            referenceId: config.reference.id,
            referenceVersion: config.reference.version,
            zScore: null,
            percentile: null
        }));
        h.equal(entry.referenceId, config.reference.id);
        h.equal(entry.zScore, null);
    });
    h.test("entrada Hadlock conserva resultado exacto y biometrías", function () {
        var entry = records.buildFetalPassportEntry(hadlockOptions());
        h.equal(entry.efwSource, "imoancy_hadlock_hc_ac_fl");
        h.equal(entry.efwMethod, "hadlock_hc_ac_fl");
        h.close(entry.efwGrams, 1739.241942300274, 0);
        h.deepEqual(entry.biometrics, { hcCm: 30, acCm: 28, flCm: 5.5 });
    });
    h.test("entrada de Pasaporte queda profundamente congelada", function () {
        h.ok(h.isDeepFrozen(records.buildFetalPassportEntry(hadlockOptions())));
    });
    h.test("builder es puro y determinista", function () {
        var options = reportOptions({ scanDate: "2026-08-20", biometrics: { hcCm: 30 } });
        var before = JSON.stringify(options);
        var first = records.buildFetalPassportEntry(options);
        var second = records.buildFetalPassportEntry(options);
        h.equal(JSON.stringify(options), before);
        h.deepEqual(first, second);
    });
    h.test("builder acepta opciones y biometrías congeladas", function () {
        var values = Object.freeze({ hcCm: 30, acCm: 28, flCm: 5.5 });
        var options = Object.freeze(hadlockOptions({ biometrics: values }));
        var entry = records.buildFetalPassportEntry(options);
        h.equal(entry.efwMethod, "hadlock_hc_ac_fl");
        h.deepEqual(options.biometrics, { hcCm: 30, acCm: 28, flCm: 5.5 });
        h.close(options.efwGrams, 1739.241942300274, 0);
    });
    h.test("builder nunca genera recordId createdAt ni scanDate", function () {
        var entry = records.buildFetalPassportEntry(reportOptions({
            recordId: "caller-id",
            createdAt: "not-a-clock-value",
            scanDate: null
        }));
        h.equal(entry.recordId, "caller-id");
        h.equal(entry.createdAt, "not-a-clock-value");
        h.equal(entry.scanDate, null);
    });

    h.test("builder rechaza opciones no objeto", function () {
        h.throws(function () { records.buildFetalPassportEntry(null); }, "options");
    });
    [
        "recordId",
        "createdAt",
        "gestationalAgeWeeks",
        "gestationalAgeDays",
        "efwGrams",
        "efwSource"
    ].forEach(function testRequiredField(field) {
        h.test("builder exige propiedad propia " + field, function () {
            var options = reportOptions();
            delete options[field];
            h.throws(function () { records.buildFetalPassportEntry(options); }, field);
        });
    });
    [
        ["recordId vacío", { recordId: "" }, "recordId"],
        ["recordId espacios", { recordId: "   " }, "recordId"],
        ["createdAt vacío", { createdAt: "" }, "createdAt"],
        ["createdAt no texto", { createdAt: 123 }, "createdAt"]
    ].forEach(function testCallerMetadata(row) {
        h.test("builder rechaza " + row[0], function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions(row[1]));
            }, row[2]);
        });
    });
    ["name", "email", "maternalAge", "patientId", "notes", "diagnosis"].forEach(
        function testExtraField(field) {
            h.test("contrato rechaza campo extra/PII " + field, function () {
                var options = reportOptions();
                options[field] = "not allowed";
                h.throws(function () { records.buildFetalPassportEntry(options); }, "outside");
            });
        }
    );
    [0, -1, NaN, Infinity, "1500", null, true, []].forEach(function testInvalidEfw(value, index) {
        h.test("builder rechaza EFW no positivo/finito caso " + String(index + 1), function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions({ efwGrams: value }));
            }, "efwGrams");
        });
    });
    ["hadlock", "actual_birth_weight", "", null].forEach(function testInvalidSource(value, index) {
        h.test("builder rechaza fuente EFW caso " + String(index + 1), function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions({ efwSource: value }));
            }, "efwSource");
        });
    });
    [
        { gestationalAgeWeeks: 30.5 },
        { gestationalAgeWeeks: -1 },
        { gestationalAgeWeeks: "30" },
        { gestationalAgeDays: -1 },
        { gestationalAgeDays: 7 },
        { gestationalAgeDays: 0.5 }
    ].forEach(function testInvalidAge(changes, index) {
        h.test("builder rechaza edad gestacional caso " + String(index + 1), function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions(changes));
            }, "gestationalAge");
        });
    });
    [
        "2024-02-29",
        "2000-02-29",
        "1900-02-28",
        "2026-01-01",
        "9999-12-31"
    ].forEach(function testValidDate(value) {
        h.test("builder acepta fecha civil válida " + value, function () {
            h.equal(records.buildFetalPassportEntry(reportOptions({ scanDate: value })).scanDate, value);
        });
    });
    [
        "2023-02-29",
        "1900-02-29",
        "2026-02-30",
        "2026-04-31",
        "2026-00-01",
        "2026-13-01",
        "0000-01-01",
        "2026-1-01",
        "20-01-01",
        "2026-01-01T00:00:00Z"
    ].forEach(function testInvalidDate(value) {
        h.test("builder rechaza fecha civil inválida " + value, function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions({ scanDate: value }));
            }, "scanDate");
        });
    });
    h.test("builder rechaza objeto biométrico con campo extraño", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(reportOptions({ biometrics: { hcCm: 30, bpdCm: 7 } }));
        }, "biometrics");
    });
    ["hcCm", "acCm", "flCm"].forEach(function testInvalidOptionalBiometric(field) {
        h.test("builder rechaza biometría opcional no positiva " + field, function () {
            var values = { hcCm: 30, acCm: 28, flCm: 5.5 };
            values[field] = 0;
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions({ biometrics: values }));
            }, "biometrics." + field);
        });
    });
    h.test("fuente Hadlock exige biometrías completas", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(hadlockOptions({ biometrics: { hcCm: 30 } }));
        }, "biometrics");
    });
    h.test("fuente Hadlock rechaza EFW redondeado o incongruente", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(hadlockOptions({ efwGrams: 1739 }));
        }, "unrounded");
    });
    h.test("fuente Hadlock rechaza método declarado distinto", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(hadlockOptions({ efwMethod: "unknown" }));
        }, "efwMethod");
    });

    [
        [{ referenceId: "ref" }, "reference"],
        [{ referenceVersion: "v1" }, "reference"],
        [{ referenceId: "", referenceVersion: "v1" }, "referenceId"],
        [{ referenceId: "ref", referenceVersion: "" }, "referenceVersion"],
        [{ zScore: 0 }, "reference"],
        [{ percentile: 50 }, "reference"],
        [{ referenceId: "ref", referenceVersion: "v1", zScore: 0 }, "reference"],
        [{ referenceId: "ref", referenceVersion: "v1", percentile: 50 }, "reference"],
        [{ referenceId: "ref", referenceVersion: "v1", zScore: NaN, percentile: 50 }, "zScore"],
        [{ referenceId: "ref", referenceVersion: "v1", zScore: 0, percentile: -1 }, "percentile"],
        [{ referenceId: "ref", referenceVersion: "v1", zScore: 0, percentile: 101 }, "percentile"]
    ].forEach(function testReferenceShape(row, index) {
        h.test("builder rechaza snapshot de referencia caso " + String(index + 1), function () {
            h.throws(function () {
                records.buildFetalPassportEntry(reportOptions(row[0]));
            }, row[1]);
        });
    });
    h.test("builder rechaza números inventados para referencia actual", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(reportOptions({
                efwMethod: "hadlock_hc_ac_fl",
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                zScore: 0,
                percentile: 50
            }));
        }, "does not match");
    });
    h.test("builder rechaza posición numérica de referencia externa no verificable", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(reportOptions({
                referenceId: "external",
                referenceVersion: "v1",
                zScore: 0,
                percentile: 50
            }));
        }, "cannot be verified");
    });
    h.test("builder rechaza posición actual con método incompatible", function () {
        h.throws(function () {
            records.buildFetalPassportEntry(reportOptions({
                efwMethod: "intergrowth_two_parameter",
                referenceId: config.reference.id,
                referenceVersion: config.reference.version,
                zScore: 0,
                percentile: 50
            }));
        }, "unavailable");
    });

    h.test("comparación homogénea devuelve diferencias descriptivas exactas", function () {
        var first = comparableEntry("a", "2026-08-01", 30, 0, 1500);
        var second = comparableEntry("b", "2026-08-15", 32, 3, 1900);
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.comparisonType, "descriptive_only");
        h.equal(result.scanIntervalDays, 14);
        h.equal(result.gestationalAgeDifferenceDays, 17);
        h.equal(result.efwDifferenceGrams, 400);
        h.close(result.percentileDifference, second.percentile - first.percentile, 0);
        h.equal(result.referenceComparability, "same");
        h.equal(result.methodComparability, "same");
        h.equal(result.scienceVersionComparability, "same");
        h.equal(result.schemaVersionComparability, "same");
        h.equal(result.homogeneousComparisonAllowed, true);
        h.deepEqual(result.unknownData, []);
        h.deepEqual(result.compatibilityIssues, []);
    });
    h.test("comparación expone contrato y snapshots versionados", function () {
        var first = comparableEntry("a2", "2026-08-01", 30, 0, 1500);
        var second = comparableEntry("b2", "2026-08-15", 32, 0, 1800);
        var result = records.compareFetalPassportEntries(first, second);
        h.keys(result, [
            "scienceVersion", "schemaVersion", "comparisonType", "recordA", "recordB",
            "scanIntervalDays", "gestationalAgeDifferenceDays", "efwDifferenceGrams",
            "percentileDifference", "referenceComparability", "methodComparability",
            "scienceVersionComparability", "schemaVersionComparability",
            "homogeneousComparisonAllowed", "unknownData", "compatibilityIssues", "semantics"
        ]);
        h.equal(result.recordA.schemaVersion, config.schemaVersions.fetalPassportEntry);
        h.equal(result.recordA.scienceVersion, config.scienceVersion);
        h.equal(result.recordA.biometricsAvailability, "complete");
        h.equal(result.recordB.gestationalAge.totalDays, 224);
        h.ok(h.isDeepFrozen(result));
    });
    h.test("comparación inversa conserva signos matemáticos", function () {
        var first = comparableEntry("a3", "2026-08-01", 30, 0, 1500);
        var second = comparableEntry("b3", "2026-08-15", 32, 0, 1800);
        var forward = records.compareFetalPassportEntries(first, second);
        var reverse = records.compareFetalPassportEntries(second, first);
        h.equal(reverse.scanIntervalDays, -forward.scanIntervalDays);
        h.equal(reverse.gestationalAgeDifferenceDays, -forward.gestationalAgeDifferenceDays);
        h.equal(reverse.efwDifferenceGrams, -forward.efwDifferenceGrams);
        h.close(reverse.percentileDifference, -forward.percentileDifference, 1e-12);
    });
    h.test("intervalo civil maneja día bisiesto sin Date", function () {
        var first = comparableEntry("leap-a", "2024-02-28", 30, 0, 1500);
        var second = comparableEntry("leap-b", "2024-03-01", 30, 2, 1510);
        h.equal(records.compareFetalPassportEntries(first, second).scanIntervalDays, 2);
    });
    h.test("datos ausentes se enumeran y bloquean homogeneidad", function () {
        var first = records.buildFetalPassportEntry(reportOptions({ recordId: "u-a" }));
        var second = records.buildFetalPassportEntry(reportOptions({ recordId: "u-b", efwGrams: 1600 }));
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.scanIntervalDays, null);
        h.equal(result.percentileDifference, null);
        h.equal(result.referenceComparability, "unknown_or_different");
        h.equal(result.methodComparability, "unknown_or_different");
        h.equal(result.homogeneousComparisonAllowed, false);
        h.includes(result.unknownData, "recordA.scanDate");
        h.includes(result.unknownData, "recordB.reference");
        h.includes(result.unknownData, "recordA.efwMethod");
        h.includes(result.unknownData, "recordB.biometrics");
    });
    h.test("disponibilidad biométrica distingue none partial complete", function () {
        var none = records.buildFetalPassportEntry(reportOptions({ recordId: "none" }));
        var partial = records.buildFetalPassportEntry(reportOptions({
            recordId: "partial", biometrics: { hcCm: 30 }
        }));
        var complete = records.buildFetalPassportEntry(reportOptions({
            recordId: "complete", biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        }));
        h.equal(records.compareFetalPassportEntries(none, partial).recordA.biometricsAvailability, "none");
        h.equal(records.compareFetalPassportEntries(none, partial).recordB.biometricsAvailability, "partial");
        h.equal(records.compareFetalPassportEntries(complete, partial).recordA.biometricsAvailability, "complete");
    });
    h.test("métodos conocidos distintos no son comparables", function () {
        var first = records.buildFetalPassportEntry(reportOptions({
            recordId: "method-a", efwMethod: "hadlock_hc_ac_fl"
        }));
        var second = records.buildFetalPassportEntry(reportOptions({
            recordId: "method-b", efwMethod: "other_formula"
        }));
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.methodComparability, "different");
        h.equal(result.homogeneousComparisonAllowed, false);
    });
    h.test("referencias distintas sin números no producen diferencia de percentil", function () {
        var first = records.buildFetalPassportEntry(reportOptions({
            recordId: "ref-a",
            referenceId: config.reference.id,
            referenceVersion: config.reference.version,
            zScore: null,
            percentile: null
        }));
        var second = records.buildFetalPassportEntry(reportOptions({
            recordId: "ref-b",
            referenceId: "external-reference",
            referenceVersion: "v2",
            zScore: null,
            percentile: null
        }));
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.referenceComparability, "different");
        h.equal(result.percentileDifference, null);
        h.equal(result.homogeneousComparisonAllowed, false);
    });
    h.test("versiones científicas distintas bloquean diferencia de percentil", function () {
        var first = comparableEntry("sv-a", "2026-08-01", 30, 0, 1500);
        var second = clone(comparableEntry("sv-b", "2026-08-15", 32, 0, 1800));
        second.scienceVersion = "0.9.0";
        var result = records.compareFetalPassportEntries(first, second);
        h.ok(first.percentile !== second.percentile);
        h.equal(result.scienceVersionComparability, "different");
        h.equal(result.percentileDifference, null);
        h.equal(result.homogeneousComparisonAllowed, false);
        h.includes(result.compatibilityIssues, "different_science_versions");
    });
    h.test("versiones de esquema distintas bloquean homogeneidad", function () {
        var first = comparableEntry("schema-a", "2026-08-01", 30, 0, 1500);
        var second = clone(comparableEntry("schema-b", "2026-08-15", 32, 0, 1800));
        second.schemaVersion = "0.8.0";
        var result = records.compareFetalPassportEntries(first, second);
        h.ok(first.percentile !== second.percentile);
        h.equal(result.schemaVersionComparability, "different");
        h.equal(result.percentileDifference, null);
        h.equal(result.homogeneousComparisonAllowed, false);
        h.includes(result.compatibilityIssues, "different_schema_versions");
    });
    h.test("compare rechaza snapshot actual corrupto", function () {
        var valid = comparableEntry("corrupt-a", "2026-08-01", 30, 0, 1500);
        var corrupt = clone(comparableEntry("corrupt-b", "2026-08-15", 32, 0, 1800));
        corrupt.percentile += 1;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "does not match");
    });
    h.test("integridad A acepta Hadlock exacto HC 30 AC 28 FL 5.5", function () {
        var expectedEfw = 1739.241942300274;
        var calculated = science.calculateHadlockHcAcFl({ hcCm: 30, acCm: 28, flCm: 5.5 });
        var entry = records.buildFetalPassportEntry(hadlockOptions());
        h.equal(calculated.status, "valid");
        h.equal(calculated.estimate.efwGrams, expectedEfw);
        h.equal(entry.efwGrams, expectedEfw);
    });
    h.test("integridad B rechaza EFW Hadlock manipulado aunque Z y percentil sean coherentes", function () {
        var valid = comparableHadlockEntry(
            "hadlock-b-valid",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var corrupt = clone(valid);
        var manipulatedSnapshot = referenceSnapshot(30, 3, 2000, "hadlock_hc_ac_fl");
        corrupt.recordId = "hadlock-b-corrupt";
        corrupt.efwGrams = 2000;
        corrupt.zScore = manipulatedSnapshot.zScore;
        corrupt.percentile = manipulatedSnapshot.percentile;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "inconsistent with its Imoancy Hadlock biometrics");
    });
    h.test("integridad C rechaza EFW Hadlock manipulado sin recalcular posición", function () {
        var valid = comparableHadlockEntry(
            "hadlock-c-valid",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var corrupt = clone(valid);
        corrupt.recordId = "hadlock-c-corrupt";
        corrupt.efwGrams = 2000;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "inconsistent with its Imoancy Hadlock biometrics");
    });
    h.test("integridad D rechaza biometría alterada con EFW Hadlock original", function () {
        var valid = comparableHadlockEntry(
            "hadlock-d-valid",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var corrupt = clone(valid);
        corrupt.recordId = "hadlock-d-corrupt";
        corrupt.biometrics.hcCm = 31;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "inconsistent with its Imoancy Hadlock biometrics");
    });
    h.test("integridad E no impone Hadlock a un informe con método unknown", function () {
        var first = records.buildFetalPassportEntry(reportOptions({
            recordId: "report-e-a",
            efwGrams: 2000,
            efwMethod: "unknown",
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        }));
        var second = clone(first);
        second.recordId = "report-e-b";
        h.equal(records.compareFetalPassportEntries(clone(first), second).methodComparability,
            "unknown_or_different");
    });
    h.test("integridad F acepta Hadlock íntegro tras serializar y deserializar", function () {
        var original = comparableHadlockEntry(
            "hadlock-f",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var restored = clone(original);
        var comparison = records.compareFetalPassportEntries(original, restored);
        h.equal(restored.efwGrams, original.efwGrams);
        h.equal(comparison.homogeneousComparisonAllowed, true);
    });
    h.test("integridad G conserva comparación homogénea entre dos Hadlock íntegros", function () {
        var first = comparableHadlockEntry(
            "hadlock-g-a",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var second = comparableHadlockEntry(
            "hadlock-g-b",
            "2026-08-15",
            32,
            3,
            { hcCm: 31, acCm: 29, flCm: 5.8 }
        );
        var comparison = records.compareFetalPassportEntries(first, second);
        h.equal(comparison.methodComparability, "same");
        h.equal(comparison.referenceComparability, "same");
        h.equal(comparison.homogeneousComparisonAllowed, true);
    });
    h.test("integridad Hadlock rechaza incluso el siguiente Number binario64", function () {
        var valid = comparableHadlockEntry(
            "hadlock-ulp-valid",
            "2026-08-01",
            30,
            3,
            { hcCm: 30, acCm: 28, flCm: 5.5 }
        );
        var corrupt = clone(valid);
        var adjacentEfw = nextRepresentableAbove(valid.efwGrams);
        var adjacentSnapshot = referenceSnapshot(30, 3, adjacentEfw, "hadlock_hc_ac_fl");
        h.ok(adjacentEfw > valid.efwGrams);
        corrupt.recordId = "hadlock-ulp-corrupt";
        corrupt.efwGrams = adjacentEfw;
        corrupt.zScore = adjacentSnapshot.zScore;
        corrupt.percentile = adjacentSnapshot.percentile;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "inconsistent with its Imoancy Hadlock biometrics");
    });
    h.test("compare rechaza posición numérica externa no verificable", function () {
        var valid = records.buildFetalPassportEntry(reportOptions({ recordId: "external-a" }));
        var corrupt = clone(valid);
        corrupt.recordId = "external-b";
        corrupt.referenceId = "external";
        corrupt.referenceVersion = "v1";
        corrupt.zScore = 0;
        corrupt.percentile = 50;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "cannot be verified");
    });
    h.test("compare rechaza registro con clave faltante", function () {
        var valid = records.buildFetalPassportEntry(reportOptions());
        var corrupt = clone(valid);
        delete corrupt.createdAt;
        h.throws(function () {
            records.compareFetalPassportEntries(valid, corrupt);
        }, "contract");
    });
    h.test("compare no añade significado clínico ni predicción", function () {
        var first = records.buildFetalPassportEntry(reportOptions({ recordId: "sem-a" }));
        var second = records.buildFetalPassportEntry(reportOptions({ recordId: "sem-b" }));
        var result = records.compareFetalPassportEntries(first, second);
        h.equal(result.semantics.differencesAreMathematicalOnly, true);
        h.equal(result.semantics.clinicalMeaningAttached, false);
        h.equal(result.semantics.futureInferenceAttached, false);
    });
}(globalThis));
