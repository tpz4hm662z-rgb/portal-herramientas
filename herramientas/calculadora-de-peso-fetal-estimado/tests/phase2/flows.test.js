(function testPhase2Flows(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var config = root.ImoancyFetalWeightScienceConfig;

    function biometricsInput(weeks, days, hcMm, acMm, flMm) {
        return {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "biometrics",
            gestationalAge: { weeks: weeks, days: days },
            biometricsMm: { hcMm: hcMm, acMm: acMm, flMm: flMm },
            scanDate: null
        };
    }

    function reportInput(method) {
        var input = {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "report_entered",
            gestationalAge: { weeks: 32, days: 3 },
            efwGrams: 1800,
            scanDate: null
        };
        if (method !== undefined) input.reportedMethod = method;
        return input;
    }

    h.test("Phase 2 exposes a frozen controller surface", function () {
        h.ok(Object.isFrozen(ui));
        h.ok(typeof ui.evaluateInput === "function");
        h.ok(typeof ui.buildPassportEntry === "function");
    });

    h.test("biometrics path computes an Imoancy Hadlock observation", function () {
        var result = ui.evaluateInput(biometricsInput(32, 3, 300, 280, 55));
        h.equal(result.status, "allowed");
        h.ok(result.canExposeObservation);
        h.equal(result.evaluation.efwObservation.source, config.efwSources.imoancyHadlock);
        h.equal(result.evaluation.efwObservation.method, config.efwMethods.hadlockHcAcFl);
    });

    h.test("biometrics conversion is mm to cm and BPD-free", function () {
        var result = ui.evaluateInput(biometricsInput(32, 3, 300, 280, 55));
        h.deepEqual(result.conversion.biometrics, { hcCm: 30, acCm: 28, flCm: 5.5 });
        h.ok(!Object.prototype.hasOwnProperty.call(result.conversion.biometrics, "bpdCm"));
    });

    h.test("direct report path preserves the entered PFE", function () {
        var result = ui.evaluateInput(reportInput());
        h.equal(result.status, "incompatible_efw_method");
        h.equal(result.evaluation.efwObservation.efwGrams, 1800);
        h.equal(result.evaluation.efwObservation.source, config.efwSources.reportEntered);
        h.equal(result.evaluation.referencePosition.percentile, null);
        h.equal(result.evaluation.referencePosition.zScore, null);
    });

    h.test("unknown direct method remains unknown", function () {
        var result = ui.evaluateInput(reportInput());
        h.equal(result.evaluation.efwObservation.method, "report_efw_method_unknown");
        h.ok(ui.describeMethod(config.efwSources.reportEntered, "report_efw_method_unknown")
            .indexOf("método no indicado") !== -1);
    });

    h.test("direct Hadlock is explicit rather than inferred", function () {
        var result = ui.evaluateInput(reportInput(config.efwMethods.hadlockHcAcFl));
        h.equal(result.status, "allowed");
        h.equal(result.evaluation.efwObservation.source, config.efwSources.reportEntered);
        h.equal(result.evaluation.efwObservation.method, config.efwMethods.hadlockHcAcFl);
        h.ok(Number.isFinite(result.evaluation.referencePosition.percentile));
        h.ok(Number.isFinite(result.evaluation.referencePosition.zScore));
    });

    h.test("unknown report method never receives Stirnemann-Hadlock position", function () {
        var result = ui.evaluateInput(reportInput());
        h.equal(result.status, "incompatible_efw_method");
        h.equal(result.evaluation.referencePosition.percentile, null);
        h.equal(result.evaluation.referencePosition.zScore, null);
    });

    h.test("explicit legacy unknown token also receives no reference position", function () {
        var result = ui.evaluateInput(reportInput(config.efwMethods.unknown));
        h.equal(result.status, "incompatible_efw_method");
        h.equal(result.evaluation.efwObservation.method, "report_efw_method_unknown");
        h.equal(result.evaluation.referencePosition.percentile, null);
        h.equal(result.evaluation.referencePosition.zScore, null);
    });

    [false, undefined].forEach(function blockedDating(value, index) {
        h.test("clinical dating confirmation blocks case " + String(index + 1), function () {
            var input = biometricsInput(32, 3, 300, 280, 55);
            if (value === undefined) delete input.gestationalAgeEstablished;
            else input.gestationalAgeEstablished = value;
            var result = ui.evaluateInput(input);
            h.equal(result.status, "gestational_age_confirmation_required");
            h.ok(!result.canExposeObservation);
            h.equal(result.evaluation, null);
        });
    });

    h.test("a declared incompatible report method preserves PFE without a percentile", function () {
        var result = ui.evaluateInput(reportInput("shepard_reported"));
        h.equal(result.status, "incompatible_efw_method");
        h.ok(result.canExposeObservation);
        h.equal(result.evaluation.efwObservation.efwGrams, 1800);
        h.equal(result.evaluation.referencePosition.percentile, null);
    });

    h.test("multiple pregnancy is blocked before an observation is exposed", function () {
        var input = biometricsInput(32, 3, 300, 280, 55);
        input.pregnancyPopulation = "multiple";
        var result = ui.evaluateInput(input);
        h.equal(result.status, "unsupported_population");
        h.ok(!result.canExposeObservation);
        h.equal(result.evaluation, null);
    });

    h.test("unknown pregnancy population requires singleton confirmation", function () {
        var input = reportInput();
        input.pregnancyPopulation = "unknown";
        var result = ui.evaluateInput(input);
        h.equal(result.status, "singleton_confirmation_required");
        h.ok(!result.canExposeObservation);
    });

    h.test("outside published reference domain keeps the observation but not position", function () {
        var result = ui.evaluateInput(biometricsInput(17, 6, 300, 280, 55));
        h.equal(result.status, "reference_out_of_range");
        h.ok(result.canExposeObservation);
        h.equal(result.evaluation.referencePosition.percentile, null);
    });

    h.test("41+0 is positionable by the approved contract", function () {
        var result = ui.evaluateInput(biometricsInput(41, 0, 352, 331, 71));
        h.equal(result.status, "allowed");
        h.ok(Number.isFinite(result.evaluation.referencePosition.percentile));
    });

    h.test("41+1 is not extrapolated", function () {
        var result = ui.evaluateInput(biometricsInput(41, 1, 352, 331, 71));
        h.equal(result.status, "reference_out_of_range");
        h.equal(result.evaluation.referencePosition.percentile, null);
    });

    h.test("invalid biometric conversion never exposes an observation", function () {
        var result = ui.evaluateInput(biometricsInput(32, 3, 0, 280, 55));
        h.ok(!result.canExposeObservation);
        h.equal(result.evaluation, null);
    });

    h.test("input objects are not mutated", function () {
        var input = biometricsInput(32, 3, 300, 280, 55);
        var before = JSON.stringify(input);
        ui.evaluateInput(Object.freeze(input));
        h.equal(JSON.stringify(input), before);
    });

    h.test("flow outcomes are deeply frozen", function () {
        h.ok(h.isDeepFrozen(ui.evaluateInput(reportInput())));
    });

    h.test("flow evaluation is deterministic", function () {
        var input = reportInput();
        h.deepEqual(ui.evaluateInput(input), ui.evaluateInput(input));
    });

    h.test("formatting presents grams first without changing the stored number", function () {
        h.equal(ui.formatGrams(1739.241942300274), "1.739");
        h.equal(ui.formatKilograms(1739.241942300274), "1,74");
    });

    h.test("gestational age formatter uses human Spanish units", function () {
        h.equal(ui.formatGestationalAge({ weeks: 32, days: 1 }), "32 semanas + 1 día");
        h.equal(ui.formatGestationalAge({ weeks: 32, days: 3 }), "32 semanas + 3 días");
    });

    h.test("Passport entry from biometrics preserves the exact unrounded EFW", function () {
        var outcome = ui.evaluateInput(biometricsInput(32, 3, 300, 280, 55));
        var entry = ui.buildPassportEntry(outcome, "2026-08-20", {
            recordId: "phase2-bio", createdAt: "2026-08-20T10:00:00.000Z"
        });
        h.equal(entry.efwGrams, outcome.evaluation.efwObservation.efwGrams);
        h.deepEqual(entry.biometrics, { hcCm: 30, acCm: 28, flCm: 5.5 });
        h.ok(Number.isFinite(entry.percentile));
    });

    h.test("Passport entry from direct unknown remains report-entered unknown", function () {
        var outcome = ui.evaluateInput(reportInput());
        var entry = ui.buildPassportEntry(outcome, null, {
            recordId: "phase2-report", createdAt: "2026-08-20T10:00:00.000Z"
        });
        h.equal(entry.efwSource, config.efwSources.reportEntered);
        h.equal(entry.efwMethod, config.efwMethods.unknown);
        h.equal(entry.biometrics, null);
    });

    h.test("local metadata is caller-triggered and well formed", function () {
        var value = ui.createLocalRecordMetadata(1787212800000, "nonce-1");
        h.equal(value.recordId, "fetal-1787212800000-nonce-1");
        h.ok(/^2026-/.test(value.createdAt));
        h.ok(Object.isFrozen(value));
    });

    h.test("local metadata rejects invalid timestamps", function () {
        h.throws(function () { ui.createLocalRecordMetadata(NaN, "n"); }, "valid time");
    });

    h.test("local metadata strips unsafe nonce characters", function () {
        var value = ui.createLocalRecordMetadata(1787212800000, "a <b>/c");
        h.equal(value.recordId, "fetal-1787212800000-abc");
    });
}(globalThis));
