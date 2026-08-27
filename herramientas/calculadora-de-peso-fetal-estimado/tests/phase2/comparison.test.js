(function testPhase2Comparison(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var records = root.ImoancyFetalWeightRecords;

    function bioEntry(id, weeks, days, hc, ac, fl, date) {
        var outcome = ui.evaluateInput({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "biometrics",
            gestationalAge: { weeks: weeks, days: days },
            biometricsMm: { hcMm: hc, acMm: ac, flMm: fl },
            scanDate: date
        });
        return ui.buildPassportEntry(outcome, date, {
            recordId: id, createdAt: "2026-08-20T10:00:00.000Z"
        });
    }

    function reportEntry(id, efw, method, date) {
        var input = {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "report_entered",
            gestationalAge: { weeks: 32, days: 0 },
            efwGrams: efw,
            scanDate: date
        };
        if (method !== undefined) input.reportedMethod = method;
        return ui.buildPassportEntry(ui.evaluateInput(input), date, {
            recordId: id, createdAt: "2026-08-20T10:00:00.000Z"
        });
    }

    function externalEntry(id, referenceId, referenceVersion, biometrics) {
        return records.buildFetalPassportEntry({
            recordId: id,
            createdAt: "2026-08-20T10:00:00.000Z",
            scanDate: "2026-08-01",
            gestationalAgeWeeks: 32,
            gestationalAgeDays: 0,
            efwGrams: 1800,
            efwSource: "report_entered",
            efwMethod: "hadlock_hc_ac_fl",
            biometrics: biometrics === undefined ? null : biometrics,
            referenceId: referenceId,
            referenceVersion: referenceVersion,
            zScore: null,
            percentile: null
        });
    }

    h.test("two valid Hadlock records compare homogeneously when complete", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15");
        var result = records.compareFetalPassportEntries(a, b);
        h.ok(result.homogeneousComparisonAllowed);
        h.equal(result.referenceComparability, "same");
        h.equal(result.methodComparability, "same");
    });

    h.test("comparison preserves explicit A and B order", function () {
        var a = bioEntry("a", 32, 0, 300, 280, 55, "2026-07-15");
        var b = bioEntry("b", 30, 0, 280, 250, 50, "2026-07-01");
        var result = records.compareFetalPassportEntries(a, b);
        h.equal(result.recordA.recordId, "a");
        h.equal(result.recordB.recordId, "b");
        h.equal(result.scanIntervalDays, -14);
        h.equal(result.gestationalAgeDifferenceDays, -14);
    });

    h.test("PFE difference is signed B minus A", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15");
        var result = records.compareFetalPassportEntries(a, b);
        h.equal(result.efwDifferenceGrams, b.efwGrams - a.efwGrams);
    });

    h.test("percentile difference appears only for compatible references", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15");
        h.equal(records.compareFetalPassportEntries(a, b).percentileDifference,
            b.percentile - a.percentile);
    });

    h.test("missing dates remain explicit unknown data", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, null);
        var b = bioEntry("b", 32, 0, 300, 280, 55, null);
        var result = records.compareFetalPassportEntries(a, b);
        h.equal(result.scanIntervalDays, null);
        h.includes(result.unknownData, "recordA.scanDate");
        h.includes(result.unknownData, "recordB.scanDate");
        h.ok(!result.homogeneousComparisonAllowed);
    });

    h.test("unknown report method never becomes homogeneous Hadlock", function () {
        var a = reportEntry("a", 1700, undefined, "2026-07-01");
        var b = reportEntry("b", 1800, undefined, "2026-07-15");
        var result = records.compareFetalPassportEntries(a, b);
        h.equal(result.methodComparability, "unknown_or_different");
        h.ok(!result.homogeneousComparisonAllowed);
        h.includes(result.unknownData, "recordA.efwMethod");
    });

    h.test("direct report records preserve missing biometrics as unknown", function () {
        var result = records.compareFetalPassportEntries(
            reportEntry("a", 1700, undefined, "2026-07-01"),
            reportEntry("b", 1800, undefined, "2026-07-15")
        );
        h.includes(result.unknownData, "recordA.biometrics");
        h.includes(result.unknownData, "recordB.biometrics");
    });

    h.test("different declared methods are not made equivalent", function () {
        var a = reportEntry("a", 1700, "hadlock_hc_ac_fl", "2026-07-01");
        var b = reportEntry("b", 1800, "hadlock_hc_ac_fl", "2026-07-15");
        var changed = JSON.parse(JSON.stringify(b));
        changed.efwMethod = "unknown";
        var result = records.compareFetalPassportEntries(a, changed);
        h.equal(result.methodComparability, "unknown_or_different");
        h.ok(!result.homogeneousComparisonAllowed);
    });

    h.test("different reference identifiers remain incompatible", function () {
        var result = records.compareFetalPassportEntries(
            externalEntry("a", "reference-a", "2020"),
            externalEntry("b", "reference-b", "2020")
        );
        h.equal(result.referenceComparability, "different");
        h.ok(!result.homogeneousComparisonAllowed);
        h.equal(result.percentileDifference, null);
    });

    h.test("different reference versions remain incompatible", function () {
        var result = records.compareFetalPassportEntries(
            externalEntry("a", "reference-a", "2020"),
            externalEntry("b", "reference-a", "2021")
        );
        h.equal(result.referenceComparability, "different");
        h.ok(!result.homogeneousComparisonAllowed);
    });

    h.test("partial biometrics are reported rather than filled in", function () {
        var result = records.compareFetalPassportEntries(
            externalEntry("a", "reference-a", "2020", { hcCm: 30, acCm: null, flCm: null }),
            externalEntry("b", "reference-a", "2020", { hcCm: 31, acCm: null, flCm: null })
        );
        h.equal(result.recordA.biometricsAvailability, "partial");
        h.includes(result.unknownData, "recordA.biometrics.acCm");
        h.includes(result.unknownData, "recordA.biometrics.flCm");
        h.ok(!result.homogeneousComparisonAllowed);
    });

    h.test("manipulated Hadlock EFW cannot be compared", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = JSON.parse(JSON.stringify(bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15")));
        b.efwGrams = 2000;
        h.throws(function () { records.compareFetalPassportEntries(a, b); }, "inconsistent");
    });

    h.test("manipulated biometrics cannot be compared", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = JSON.parse(JSON.stringify(bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15")));
        b.biometrics.acCm = 29;
        h.throws(function () { records.compareFetalPassportEntries(a, b); }, "inconsistent");
    });

    h.test("comparison summary is frozen and descriptive", function () {
        var comparison = records.compareFetalPassportEntries(
            bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01"),
            bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15")
        );
        var summary = ui.comparisonSummary(comparison);
        h.ok(h.isDeepFrozen(summary));
        h.equal(summary.efwDifferenceGrams, comparison.efwDifferenceGrams);
    });

    ["growthRate", "growthVelocity", "score", "risk", "prediction", "diagnosis",
        "adequateGrowth", "improved", "worsened", "redatedGestationalAge"].forEach(function forbidden(key) {
        h.test("comparison contract omits " + key, function () {
            var value = records.compareFetalPassportEntries(
                bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01"),
                bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15")
            );
            h.ok(JSON.stringify(value).indexOf('"' + key + '"') === -1);
        });
    });

    h.test("comparison never mutates records", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15");
        var beforeA = JSON.stringify(a);
        var beforeB = JSON.stringify(b);
        records.compareFetalPassportEntries(a, b);
        h.equal(JSON.stringify(a), beforeA);
        h.equal(JSON.stringify(b), beforeB);
    });

    h.test("comparison is deterministic", function () {
        var a = bioEntry("a", 30, 0, 280, 250, 50, "2026-07-01");
        var b = bioEntry("b", 32, 0, 300, 280, 55, "2026-07-15");
        h.deepEqual(records.compareFetalPassportEntries(a, b),
            records.compareFetalPassportEntries(a, b));
    });
}(globalThis));
