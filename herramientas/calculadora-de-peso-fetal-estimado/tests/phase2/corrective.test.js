(function testPhase21Corrections(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var records = root.ImoancyFetalWeightRecords;
    var storageModule = root.ImoancyFetalWeightRecordStorage;
    var base = root.ImoancyFetalWeightTestBase;
    var read = root.ImoancyFetalWeightTestRead;
    var html = read(base + "/index.html");
    var controller = read(base + "/js/script.js");

    function adapter() {
        return {
            raw: null,
            failWrite: false,
            failRead: false,
            getItem: function () {
                if (this.failRead) throw new Error("blocked");
                return this.raw;
            },
            setItem: function (key, value) {
                if (this.failWrite) throw new Error("quota");
                this.raw = value;
            },
            removeItem: function () {
                if (this.failWrite) throw new Error("blocked");
                this.raw = null;
            }
        };
    }

    function outcome(hc, ac, fl, weeks, days) {
        return ui.evaluateInput({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "biometrics",
            gestationalAge: { weeks: weeks, days: days },
            biometricsMm: { hcMm: hc, acMm: ac, flMm: fl },
            biometricsUnit: "mm",
            scanDate: null
        });
    }

    function entry(id, hc, ac, fl, createdAt) {
        return ui.buildPassportEntry(outcome(hc, ac, fl, 32, 0), "2026-08-01", {
            recordId: id,
            createdAt: createdAt || "2026-08-20T10:00:00.000Z"
        });
    }

    h.test("privacy is structural: there is no native form element", function () {
        h.ok(!/<form\b/i.test(html));
        h.ok(!/<\/form>/i.test(html));
        h.ok(/id="fetal-form"[^>]+role="form"/.test(html));
    });

    h.test("privacy is structural: calculation is never a submit control", function () {
        h.ok(/id="calculate-observation"[^>]+type="button"/.test(html) ||
            /type="button"[^>]+id="calculate-observation"/.test(html));
        h.ok(!/type="submit"/i.test(html));
    });

    h.test("Enter is intercepted only by the controller and cannot trigger native navigation", function () {
        h.ok(controller.indexOf('event.key !== "Enter"') !== -1);
        h.ok(controller.indexOf("event.preventDefault()") !== -1);
        h.ok(controller.indexOf("addEventListener(\"keydown\", handleCalculatorKeydown)") !== -1);
        h.ok(!/location\s*=|location\.|URLSearchParams|window\.open/.test(controller));
    });

    h.test("calculation is attached directly to a type button", function () {
        h.ok(controller.indexOf('byId("calculate-observation").addEventListener("click"') !== -1);
        h.ok(controller.indexOf('addEventListener("submit"') === -1);
    });

    h.test("mm presentation conversion preserves millimeters", function () {
        h.deepEqual(ui.convertBiometricsToMillimeters({ hc: 300, ac: 280, fl: 55 }, "mm"),
            { hcMm: 300, acMm: 280, flMm: 55 });
    });

    h.test("cm presentation conversion produces exact millimeters", function () {
        h.deepEqual(ui.convertBiometricsToMillimeters({ hc: 30, ac: 28, fl: 5.5 }, "cm"),
            { hcMm: 300, acMm: 280, flMm: 55 });
    });

    h.test("300 mm and 30 cm produce identical scientific input", function () {
        h.deepEqual(
            ui.convertBiometricsToMillimeters({ hc: 300, ac: 280, fl: 55 }, "mm"),
            ui.convertBiometricsToMillimeters({ hc: 30, ac: 28, fl: 5.5 }, "cm")
        );
    });

    h.test("300 mm and 30 cm produce identical scientific results", function () {
        var mm = ui.convertBiometricsToMillimeters({ hc: 300, ac: 280, fl: 55 }, "mm");
        var cm = ui.convertBiometricsToMillimeters({ hc: 30, ac: 28, fl: 5.5 }, "cm");
        var mmResult = ui.evaluateInput({ pregnancyPopulation: "singleton_confirmed", gestationalAgeEstablished: true, inputMode: "biometrics",
            gestationalAge: { weeks: 32, days: 0 }, biometricsMm: mm });
        var cmResult = ui.evaluateInput({ pregnancyPopulation: "singleton_confirmed", gestationalAgeEstablished: true, inputMode: "biometrics",
            gestationalAge: { weeks: 32, days: 0 }, biometricsMm: cm });
        h.deepEqual(mmResult.evaluation, cmResult.evaluation);
    });

    h.test("unit conversion refuses to guess an absent unit", function () {
        h.throws(function () {
            ui.convertBiometricsToMillimeters({ hc: 30, ac: 28, fl: 5.5 }, "");
        }, "explicit mm or cm");
    });

    h.test("unit selection and aliases are visible", function () {
        h.ok(html.indexOf('id="biometric-unit"') !== -1);
        ["HC / CC", "AC / CA", "FL / LF"].forEach(function (alias) {
            h.ok(html.indexOf(alias) !== -1);
        });
        h.ok(html.indexOf("tal como aparecen en tu informe") !== -1);
    });

    h.test("two clinically identical records receive distinct presentation identities", function () {
        var a = entry("a", 300, 280, 55, "2026-08-20T10:00:00.000Z");
        var b = entry("b", 300, 280, 55, "2026-08-20T10:00:00.000Z");
        var identities = ui.buildPresentationIdentities([a, b]);
        h.equal(identities[0].label, "Ecografía 1");
        h.equal(identities[1].label, "Ecografía 2");
    });

    h.test("presentation identities remain deterministic", function () {
        var entries = [entry("b", 300, 280, 55), entry("a", 300, 280, 55)];
        h.deepEqual(ui.buildPresentationIdentities(entries), ui.buildPresentationIdentities(entries));
    });

    h.test("presentation identity does not modify scientific records", function () {
        var value = entry("a", 300, 280, 55);
        var before = JSON.stringify(value);
        ui.buildPresentationIdentities([value]);
        h.equal(JSON.stringify(value), before);
    });

    h.test("accessible history names include the presentation identity", function () {
        h.ok(controller.indexOf('aria-label="Abrir ') !== -1);
        h.ok(controller.indexOf('aria-label="Eliminar ') !== -1);
        h.ok(controller.indexOf("presentationLabel(entry)") !== -1);
    });

    h.test("quota failure returns the previously stored snapshot", function () {
        var memory = adapter();
        var store = storageModule.createStore(memory);
        var first = entry("first", 300, 280, 55);
        store.save(first);
        memory.failWrite = true;
        var failed = store.save(entry("second", 310, 290, 58));
        h.equal(failed.status, "storage_unavailable");
        h.equal(failed.entries.length, 1);
        h.equal(failed.entries[0].recordId, "first");
        h.ok(failed.preservedExistingEntries);
    });

    h.test("quota failure view keeps history visible and blocks writes", function () {
        var memory = adapter();
        var store = storageModule.createStore(memory);
        store.save(entry("first", 300, 280, 55));
        memory.failWrite = true;
        var view = ui.passportViewState(store.save(entry("second", 310, 290, 58)));
        h.ok(!view.isEmpty);
        h.ok(view.storageBlocked);
        h.equal(view.entries.length, 1);
    });

    h.test("failed delete returns every record that remains stored", function () {
        var memory = adapter();
        var store = storageModule.createStore(memory);
        store.save(entry("first", 300, 280, 55));
        store.save(entry("second", 310, 290, 58));
        memory.failWrite = true;
        var failed = store.remove("first");
        h.equal(failed.status, "storage_unavailable");
        h.equal(failed.entries.length, 2);
        h.deepEqual(store.list().entries.map(function (item) { return item.recordId; }), ["second", "first"]);
    });

    h.test("failed clear already preserves the loaded snapshot", function () {
        var memory = adapter();
        var store = storageModule.createStore(memory);
        store.save(entry("first", 300, 280, 55));
        memory.failWrite = true;
        var failed = store.clear();
        h.equal(failed.status, "storage_unavailable");
        h.equal(failed.entries.length, 1);
    });

    h.test("blocked storage never claims that a write succeeded", function () {
        var memory = adapter();
        memory.failRead = true;
        var result = storageModule.createStore(memory).save(entry("first", 300, 280, 55));
        h.ok(!result.ok);
        h.equal(result.status, "storage_unavailable");
    });

    h.test("no historical science version is invented when the audited allowlist is empty", function () {
        var historical = JSON.parse(JSON.stringify(entry("old", 300, 280, 55)));
        historical.scienceVersion = "0.9.0";
        h.deepEqual(storageModule.historicalPolicy.knownHistoricalScienceVersions, []);
        h.equal(storageModule.entryVersionStatus(historical), "unsupported_version");
        h.ok(!storageModule.validateEntry(historical));
    });

    h.test("unsupported version is isolated while a current record remains visible", function () {
        var current = entry("current", 300, 280, 55);
        var historical = JSON.parse(JSON.stringify(entry("old", 300, 280, 55)));
        historical.scienceVersion = "0.9.0";
        var memory = adapter();
        memory.raw = JSON.stringify({ storageVersion: storageModule.storageVersion,
            entries: [current, historical] });
        var loaded = storageModule.createStore(memory).list();
        h.ok(!loaded.ok);
        h.equal(loaded.status, "partial_corruption");
        h.equal(loaded.entries.length, 1);
        h.equal(loaded.entries[0].recordId, "current");
        h.equal(loaded.historicalEntryCount, 0);
    });

    h.test("Records can describe a version difference but Storage blocks the unknown version", function () {
        var current = entry("current", 300, 280, 55);
        var historical = JSON.parse(JSON.stringify(entry("old", 300, 280, 55)));
        historical.scienceVersion = "0.9.0";
        var comparison = records.compareFetalPassportEntries(current, historical);
        h.equal(comparison.scienceVersionComparability, "different");
        h.ok(!comparison.homogeneousComparisonAllowed);
        h.ok(!storageModule.validateEntry(historical));
    });

    h.test("unsupported version validation does not recalculate or migrate the snapshot", function () {
        var historical = JSON.parse(JSON.stringify(entry("old", 300, 280, 55)));
        historical.scienceVersion = "0.9.0";
        var before = JSON.stringify(historical);
        storageModule.validateEntry(historical);
        h.equal(JSON.stringify(historical), before);
        h.ok(!storageModule.historicalPolicy.recalculatesHistoricalRecords);
        h.ok(!storageModule.historicalPolicy.migratesHistoricalRecordsSilently);
    });

    h.test("unrecognizable science version remains corruption", function () {
        var corrupt = JSON.parse(JSON.stringify(entry("bad", 300, 280, 55)));
        corrupt.scienceVersion = "legacy";
        h.equal(storageModule.entryVersionStatus(corrupt), "unsupported_version");
        h.ok(!storageModule.validateEntry(corrupt));
    });

    h.test("unknown schema remains corruption", function () {
        var corrupt = JSON.parse(JSON.stringify(entry("bad", 300, 280, 55)));
        corrupt.schemaVersion = "0.9.0";
        h.equal(storageModule.entryVersionStatus(corrupt), "invalid");
        h.ok(!storageModule.validateEntry(corrupt));
    });

    h.test("manipulated unsupported-version Hadlock record remains corruption", function () {
        var corrupt = JSON.parse(JSON.stringify(entry("bad", 300, 280, 55)));
        corrupt.scienceVersion = "0.9.0";
        corrupt.efwGrams = 2000;
        h.ok(!storageModule.validateEntry(corrupt));
    });

    h.test("unknown report method copy exposes methodological uncertainty", function () {
        h.ok(html.indexOf('id="result-method-uncertainty"') !== -1);
        h.ok(html.indexOf("método utilizado para obtener este PFE no está confirmado") !== -1);
        h.ok(controller.indexOf("no se calculan percentil ni z-score Stirnemann-Hadlock") !== -1);
    });

    h.test("unknown method is still never inferred as Hadlock", function () {
        var result = ui.evaluateInput({ pregnancyPopulation: "singleton_confirmed", gestationalAgeEstablished: true,
            inputMode: "report_entered", gestationalAge: { weeks: 32, days: 0 }, efwGrams: 1800 });
        h.equal(result.evaluation.efwObservation.source, "report_entered");
        h.equal(result.evaluation.efwObservation.method, "report_efw_method_unknown");
        h.equal(result.evaluation.referencePosition.percentile, null);
        h.equal(result.evaluation.referencePosition.zScore, null);
    });

    h.test("free method field and unnecessary PII collection are removed", function () {
        h.ok(html.indexOf('id="report-method-other"') === -1);
        h.ok(html.indexOf("No necesitamos el nombre del centro ni del profesional") !== -1);
        h.ok(controller.indexOf('OTHER_REPORTED_METHOD = "other_reported_method"') !== -1);
    });

    h.test("dialog declares modality and a safe initial focus", function () {
        h.ok(/id="confirmation-panel"[^>]+aria-modal="true"/.test(html));
        h.ok(controller.indexOf('focusElement(byId("confirmation-cancel"))') !== -1);
    });

    h.test("dialog traps forward and reverse Tab", function () {
        h.ok(controller.indexOf('event.key !== "Tab"') !== -1);
        h.ok(controller.indexOf("event.shiftKey") !== -1);
        h.ok(controller.indexOf("last.focus()") !== -1);
        h.ok(controller.indexOf("first.focus()") !== -1);
    });

    h.test("dialog Escape is handled at the containing panel", function () {
        h.ok(controller.indexOf('event.key === "Escape"') !== -1);
        h.ok(controller.indexOf('addEventListener("keydown", handleConfirmationKeydown)') !== -1);
    });

    h.test("result mutation invalidation clears stale result and transient messages", function () {
        h.ok(controller.indexOf("function invalidateCurrentResult") !== -1);
        h.ok(controller.indexOf("currentResult = null") !== -1);
        h.ok(controller.indexOf('setHidden(byId("resultados"), true)') !== -1);
        h.ok(controller.indexOf("clearTransientMessages()") !== -1);
        h.ok(controller.indexOf("invalidateComparison()") !== -1);
    });

    ["hc-mm", "ac-mm", "fl-mm", "report-efw", "gestational-weeks",
        "gestational-days", "population-singleton", "report-method",
        "input-mode-biometrics"].forEach(function mutation(id) {
        h.test("result-affecting control is inside centralized invalidation: " + id, function () {
            h.ok(html.indexOf('id="' + id + '"') !== -1);
            h.ok(controller.indexOf('form.addEventListener("input"') !== -1);
            h.ok(controller.indexOf('form.addEventListener("change"') !== -1);
            h.ok(controller.indexOf("invalidateCurrentResult()") !== -1);
        });
    });

    h.test("human comparison labels cover every biometric", function () {
        ["Circunferencia cefálica", "Circunferencia abdominal", "Longitud del fémur"].forEach(function (label) {
            h.ok(controller.indexOf(label) !== -1);
        });
        h.ok(controller.indexOf("Ecografía A.biometrics") === -1);
    });

    h.test("incompatibilities distinguish method, reference and science version", function () {
        h.ok(controller.indexOf("métodos de PFE diferentes") !== -1);
        h.ok(controller.indexOf("método del PFE es desconocido") !== -1);
        h.ok(controller.indexOf("versión de referencia diferente") !== -1);
        h.ok(controller.indexOf("versiones científicas son diferentes") !== -1);
    });

    h.test("decimal PFE display explains presentation rounding without changing records", function () {
        h.ok(html.indexOf('id="result-rounding-note"') !== -1);
        h.ok(html.indexOf("redondeada al gramo") !== -1);
        var value = entry("decimal", 300, 280, 55).efwGrams;
        h.ok(!Number.isInteger(value));
        h.equal(entry("decimal", 300, 280, 55).efwGrams, value);
    });
}(globalThis));
