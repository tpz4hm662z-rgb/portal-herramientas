(function testPhase22Corrections(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var storageModule = root.ImoancyFetalWeightRecordStorage;
    var base = root.ImoancyFetalWeightTestBase;
    var read = root.ImoancyFetalWeightTestRead;
    var html = read(base + "/index.html");
    var controller = read(base + "/js/script.js");
    var css = read(base + "/css/style.css");

    function adapter(raw) {
        return {
            raw: raw === undefined ? null : raw,
            failRead: false,
            failWrite: false,
            getItem: function getItem() {
                if (this.failRead) throw new Error("blocked read");
                return this.raw;
            },
            setItem: function setItem(key, value) {
                if (this.failWrite) throw new Error("blocked write");
                this.raw = value;
            },
            removeItem: function removeItem() {
                if (this.failWrite) throw new Error("blocked removal");
                this.raw = null;
            }
        };
    }

    function outcome(hc, ac, fl) {
        return ui.evaluateInput({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "biometrics",
            gestationalAge: { weeks: 32, days: 0 },
            biometricsMm: { hcMm: hc, acMm: ac, flMm: fl }
        });
    }

    function entry(id, hc, ac, fl, createdAt) {
        return ui.buildPassportEntry(outcome(hc || 300, ac || 280, fl || 55), "2026-08-20", {
            recordId: id,
            createdAt: createdAt || "2026-08-20T10:00:00.000Z"
        });
    }

    function envelope(entries) {
        return JSON.stringify({ storageVersion: storageModule.storageVersion, entries: entries });
    }

    h.test("2.2 remembers a successfully read non-empty snapshot", function () {
        var memory = adapter(envelope([entry("a")]));
        var store = storageModule.createStore(memory);
        h.equal(store.list().entries.length, 1);
        memory.failRead = true;
        var unavailable = store.list();
        h.equal(unavailable.status, "storage_unavailable");
        h.equal(unavailable.entries.length, 1);
        h.equal(unavailable.entries[0].recordId, "a");
        h.ok(unavailable.snapshotKnown);
        h.equal(unavailable.historyAvailability, "last_known_snapshot");
        h.ok(!unavailable.confirmedEmpty);
    });

    h.test("2.2 save read failure preserves the last known snapshot", function () {
        var memory = adapter(envelope([entry("a")]));
        var store = storageModule.createStore(memory);
        store.list();
        memory.failRead = true;
        var result = store.save(entry("b", 310, 290, 58));
        h.ok(!result.ok);
        h.equal(result.entries.length, 1);
        h.equal(result.entries[0].recordId, "a");
        h.ok(result.preservedExistingEntries);
    });

    h.test("2.2 remove read failure preserves the last known snapshot and raw data", function () {
        var raw = envelope([entry("a"), entry("b", 310, 290, 58)]);
        var memory = adapter(raw);
        var store = storageModule.createStore(memory);
        store.list();
        memory.failRead = true;
        var result = store.remove("a");
        h.ok(!result.ok);
        h.equal(result.entries.length, 2);
        h.equal(memory.raw, raw);
    });

    h.test("2.2 first read failure is unavailable rather than confirmed empty", function () {
        var memory = adapter();
        memory.failRead = true;
        var result = storageModule.createStore(memory).list();
        var view = ui.passportViewState(result);
        h.equal(result.status, "storage_unavailable");
        h.ok(!result.snapshotKnown);
        h.equal(result.historyAvailability, "unknown");
        h.ok(!result.confirmedEmpty);
        h.ok(!view.isEmpty);
        h.equal(view.historyAvailability, "unknown");
    });

    h.test("2.2 recovered storage replaces memory with the real authoritative snapshot", function () {
        var memory = adapter(envelope([entry("old")]));
        var store = storageModule.createStore(memory);
        store.list();
        memory.failRead = true;
        h.equal(store.list().entries[0].recordId, "old");
        memory.raw = envelope([entry("real", 310, 290, 58)]);
        memory.failRead = false;
        var recovered = store.list();
        h.ok(recovered.ok);
        h.equal(recovered.entries.length, 1);
        h.equal(recovered.entries[0].recordId, "real");
    });

    h.test("2.2 a previously confirmed empty snapshot is not asserted empty after read failure", function () {
        var memory = adapter(null);
        var store = storageModule.createStore(memory);
        h.ok(ui.passportViewState(store.list()).isEmpty);
        memory.failRead = true;
        var unavailable = store.list();
        h.ok(unavailable.snapshotKnown);
        h.equal(unavailable.entries.length, 0);
        h.ok(!unavailable.confirmedEmpty);
        h.ok(!ui.passportViewState(unavailable).isEmpty);
    });

    h.test("2.2 historical allowlist is explicit, frozen and empty", function () {
        h.deepEqual(storageModule.historicalPolicy.knownHistoricalScienceVersions, []);
        h.ok(Object.isFrozen(storageModule.historicalPolicy.knownHistoricalScienceVersions));
        h.equal(storageModule.historicalPolicy.currentScienceVersion, "1.0.0");
        h.ok(!storageModule.historicalPolicy.unknownVersionsAccepted);
    });

    ["999.123.456", "1.0.1", "2025.1.0", "0.9.0", "legacy", "1.0"].forEach(function unknownVersion(version) {
        h.test("2.2 rejects unknown science version " + version, function () {
            var value = JSON.parse(JSON.stringify(entry("version-" + version)));
            value.scienceVersion = version;
            h.equal(storageModule.entryVersionStatus(value), "unsupported_version");
            h.ok(!storageModule.validateEntry(value));
        });
    });

    h.test("2.2 accepts the exact current science version", function () {
        var value = entry("current");
        h.equal(storageModule.entryVersionStatus(value), "current");
        h.ok(storageModule.validateEntry(value));
    });

    h.test("2.2 two identical invented versions are isolated before comparison", function () {
        var first = JSON.parse(JSON.stringify(entry("invented-a")));
        var second = JSON.parse(JSON.stringify(entry("invented-b", 310, 290, 58)));
        first.scienceVersion = "999.123.456";
        second.scienceVersion = "999.123.456";
        var loaded = storageModule.createStore(adapter(envelope([first, second]))).list();
        h.equal(loaded.status, "partial_corruption");
        h.equal(loaded.entries.length, 0);
        h.equal(loaded.invalidEntryCount, 2);
    });

    h.test("2.2 detects two identical entries with the same recordId", function () {
        var first = entry("duplicate");
        var second = JSON.parse(JSON.stringify(first));
        var loaded = storageModule.createStore(adapter(envelope([first, second]))).list();
        h.equal(loaded.status, "partial_corruption");
        h.equal(loaded.entries.length, 0);
        h.equal(loaded.invalidEntryCount, 2);
        h.equal(loaded.duplicateEntryCount, 2);
        h.deepEqual(loaded.duplicateRecordIds, ["duplicate"]);
    });

    h.test("2.2 detects duplicate recordId even when contents differ", function () {
        var first = entry("duplicate");
        var second = entry("duplicate", 310, 290, 58, "2026-08-20T11:00:00.000Z");
        var loaded = storageModule.createStore(adapter(envelope([first, second]))).list();
        h.equal(loaded.status, "partial_corruption");
        h.equal(loaded.entries.length, 0);
        h.equal(loaded.duplicateEntryCount, 2);
    });

    h.test("2.2 isolates both duplicates but preserves an unambiguous third entry", function () {
        var first = entry("duplicate");
        var second = entry("duplicate", 310, 290, 58, "2026-08-20T11:00:00.000Z");
        var unique = entry("unique", 320, 300, 60);
        var loaded = storageModule.createStore(adapter(envelope([first, unique, second]))).list();
        h.equal(loaded.status, "partial_corruption");
        h.equal(loaded.entries.length, 1);
        h.equal(loaded.entries[0].recordId, "unique");
        h.equal(loaded.invalidEntryCount, 2);
    });

    h.test("2.2 ambiguous deletion is blocked and leaves raw storage byte-for-byte intact", function () {
        var duplicate = entry("duplicate");
        var raw = envelope([duplicate, duplicate]);
        var memory = adapter(raw);
        var result = storageModule.createStore(memory).remove("duplicate");
        h.ok(!result.ok);
        h.equal(result.status, "partial_corruption");
        h.equal(memory.raw, raw);
    });

    h.test("2.2 explicit recovery keeps only unambiguous valid entries", function () {
        var duplicate = entry("duplicate");
        var unique = entry("unique", 310, 290, 58);
        var memory = adapter(envelope([duplicate, unique, duplicate]));
        var store = storageModule.createStore(memory);
        h.equal(store.list().status, "partial_corruption");
        var recovered = store.recoverValidEntries();
        h.ok(recovered.ok);
        h.equal(recovered.entries.length, 1);
        h.equal(recovered.entries[0].recordId, "unique");
        var reloaded = storageModule.createStore(memory).list();
        h.ok(reloaded.ok);
        h.equal(reloaded.entries[0].recordId, "unique");
    });

    h.test("2.2 duplicate ambiguity persists across reload until explicit action", function () {
        var duplicate = entry("duplicate");
        var memory = adapter(envelope([duplicate, duplicate]));
        h.equal(storageModule.createStore(memory).list().status, "partial_corruption");
        h.equal(storageModule.createStore(memory).list().status, "partial_corruption");
        h.ok(memory.raw !== null);
    });

    h.test("2.2 explicit discard removes a duplicate-corrupt container", function () {
        var duplicate = entry("duplicate");
        var memory = adapter(envelope([duplicate, duplicate]));
        var store = storageModule.createStore(memory);
        h.equal(store.list().status, "partial_corruption");
        var discarded = store.discardCorruptData();
        h.ok(discarded.ok);
        h.equal(discarded.status, "corrupt_data_discarded");
        h.equal(memory.raw, null);
    });

    h.test("2.2 presentation identity includes stable local metadata", function () {
        var first = entry("record-ABC123", 300, 280, 55, "2026-08-20T10:00:00.000Z");
        var second = entry("record-XYZ789", 300, 280, 55, "2026-08-20T10:00:00.000Z");
        var identities = ui.buildPresentationIdentities([first, second]);
        h.equal(identities[0].label, "Ecografía 1");
        h.equal(identities[1].label, "Ecografía 2");
        h.ok(identities[0].stableLabel.indexOf("ABC123") !== -1);
        h.ok(identities[1].stableLabel.indexOf("XYZ789") !== -1);
        h.ok(identities[0].stableLabel !== identities[1].stableLabel);
    });

    h.test("2.2 stable identity survives ordinal renumbering after another record disappears", function () {
        var first = entry("record-ABC123");
        var second = entry("record-XYZ789", 300, 280, 55, "2026-08-20T11:00:00.000Z");
        var before = ui.buildPresentationIdentities([first, second])[1];
        var after = ui.buildPresentationIdentities([second])[0];
        h.equal(before.label, "Ecografía 2");
        h.equal(after.label, "Ecografía 1");
        h.equal(before.stableLabel, after.stableLabel);
    });

    h.test("2.2 uses a native modal dialog and a visual backdrop", function () {
        h.ok(/<dialog\b[^>]*id="confirmation-panel"/.test(html));
        h.ok(html.indexOf('aria-modal="true"') !== -1);
        h.ok(controller.indexOf("panel.showModal()") !== -1);
        h.ok(controller.indexOf('addEventListener("cancel"') !== -1);
        h.ok(css.indexOf(".confirmation-panel::backdrop") !== -1);
    });

    h.test("2.2 modal fallback guards focus, clicks and document Escape", function () {
        h.ok(controller.indexOf('addEventListener("focusin", keepModalFocus, true)') !== -1);
        h.ok(controller.indexOf('addEventListener("click", blockOutsideModalInteraction, true)') !== -1);
        h.ok(controller.indexOf('addEventListener("keydown", handleDocumentModalKeydown, true)') !== -1);
        h.ok(controller.indexOf("!panel.contains(event.target)") !== -1);
        h.ok(controller.indexOf("event.stopImmediatePropagation()") !== -1);
    });

    h.test("2.2 privacy copy is concise and states local-only non-identifying storage", function () {
        ["Tus ecografías se guardan únicamente en este navegador",
            "no solicita nombres ni datos identificativos",
            "el contenido del Pasaporte no se envía a ningún servidor"].forEach(function expected(text) {
            h.ok(html.indexOf(text) !== -1, "missing privacy copy: " + text);
        });
    });
}(globalThis));
