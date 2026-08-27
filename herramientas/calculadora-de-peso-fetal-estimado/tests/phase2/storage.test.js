(function testPhase2Storage(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var storageModule = root.ImoancyFetalWeightRecordStorage;

    function memory(initial) {
        var value = initial === undefined ? null : initial;
        return {
            getItem: function () { return value; },
            setItem: function (key, next) { value = next; },
            removeItem: function () { value = null; },
            inspect: function () { return value; }
        };
    }

    function input(hc, ac, fl, weeks, days) {
        return {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAgeEstablished: true,
            inputMode: "biometrics",
            gestationalAge: { weeks: weeks || 32, days: days || 0 },
            biometricsMm: { hcMm: hc, acMm: ac, flMm: fl },
            scanDate: null
        };
    }

    function entry(id, hc, ac, fl, scanDate, weeks, days) {
        var outcome = ui.evaluateInput(input(hc, ac, fl, weeks, days));
        return ui.buildPassportEntry(outcome, scanDate || null, {
            recordId: id,
            createdAt: "2026-08-20T10:00:00.000Z"
        });
    }

    function envelope(entries) {
        return JSON.stringify({ storageVersion: storageModule.storageVersion, entries: entries });
    }

    h.test("storage API and version are frozen", function () {
        h.ok(Object.isFrozen(storageModule));
        h.equal(storageModule.storageVersion, "1.0.0");
        h.ok(typeof storageModule.createStore === "function");
    });

    h.test("empty local storage returns an empty immutable result", function () {
        var result = storageModule.createStore(memory()).list();
        h.ok(result.ok);
        h.equal(result.status, "empty");
        h.deepEqual(result.entries, []);
        h.ok(h.isDeepFrozen(result));
    });

    h.test("saving writes one exact versioned record", function () {
        var adapter = memory();
        var store = storageModule.createStore(adapter);
        var saved = store.save(entry("one", 300, 280, 55, "2026-08-01"));
        h.ok(saved.ok);
        h.equal(saved.entries.length, 1);
        h.equal(JSON.parse(adapter.inspect()).entries[0].recordId, "one");
    });

    h.test("list round-trips a legitimate stored record", function () {
        var adapter = memory();
        var store = storageModule.createStore(adapter);
        var original = entry("roundtrip", 300, 280, 55, "2026-08-01");
        store.save(original);
        h.deepEqual(store.list().entries[0], original);
    });

    h.test("two saved observations are both retained newest first", function () {
        var store = storageModule.createStore(memory());
        store.save(entry("first", 300, 280, 55));
        var result = store.save(entry("second", 320, 300, 62));
        h.deepEqual(result.entries.map(function (value) { return value.recordId; }), ["second", "first"]);
    });

    h.test("duplicate record identifiers are blocked", function () {
        var store = storageModule.createStore(memory());
        store.save(entry("same", 300, 280, 55));
        var result = store.save(entry("same", 320, 300, 62));
        h.ok(!result.ok);
        h.equal(result.status, "duplicate_id");
        h.equal(result.entries.length, 1);
    });

    h.test("remove deletes only the selected record", function () {
        var store = storageModule.createStore(memory());
        store.save(entry("first", 300, 280, 55));
        store.save(entry("second", 320, 300, 62));
        var result = store.remove("first");
        h.ok(result.ok);
        h.deepEqual(result.entries.map(function (value) { return value.recordId; }), ["second"]);
    });

    h.test("remove reports a missing identifier without mutation", function () {
        var store = storageModule.createStore(memory());
        store.save(entry("first", 300, 280, 55));
        var result = store.remove("absent");
        h.ok(!result.ok);
        h.equal(result.status, "not_found");
        h.equal(store.list().entries.length, 1);
    });

    h.test("clear removes an intact Passport", function () {
        var adapter = memory();
        var store = storageModule.createStore(adapter);
        store.save(entry("first", 300, 280, 55));
        var result = store.clear();
        h.ok(result.ok);
        h.equal(result.status, "cleared");
        h.equal(adapter.inspect(), null);
    });

    h.test("malformed JSON is reported and preserved", function () {
        var adapter = memory("{not-json");
        var result = storageModule.createStore(adapter).list();
        h.ok(!result.ok);
        h.equal(result.status, "corrupt_data");
        h.equal(adapter.inspect(), "{not-json");
    });

    h.test("wrong envelope version is corrupt and preserved", function () {
        var raw = JSON.stringify({ storageVersion: "0.9", entries: [] });
        var adapter = memory(raw);
        var result = storageModule.createStore(adapter).list();
        h.equal(result.status, "corrupt_data");
        h.equal(adapter.inspect(), raw);
    });

    h.test("extra envelope fields are rejected", function () {
        var raw = JSON.stringify({ storageVersion: "1.0.0", entries: [], extra: true });
        h.equal(storageModule.createStore(memory(raw)).list().status, "corrupt_data");
    });

    h.test("one corrupt record does not hide an intact record", function () {
        var valid = entry("valid", 300, 280, 55);
        var corrupt = JSON.parse(JSON.stringify(valid));
        corrupt.recordId = "corrupt";
        corrupt.efwGrams = 2000;
        var result = storageModule.createStore(memory(envelope([valid, corrupt]))).list();
        h.equal(result.status, "partial_corruption");
        h.equal(result.entries.length, 1);
        h.equal(result.entries[0].recordId, "valid");
        h.equal(result.invalidEntryCount, 1);
    });

    h.test("partial corruption is never rewritten during read", function () {
        var valid = entry("valid", 300, 280, 55);
        var corrupt = JSON.parse(JSON.stringify(valid));
        corrupt.recordId = "bad";
        corrupt.efwGrams = 2000;
        var raw = envelope([valid, corrupt]);
        var adapter = memory(raw);
        storageModule.createStore(adapter).list();
        h.equal(adapter.inspect(), raw);
    });

    h.test("save is blocked while any stored record is corrupt", function () {
        var valid = entry("valid", 300, 280, 55);
        var corrupt = JSON.parse(JSON.stringify(valid));
        corrupt.efwGrams = 2000;
        var adapter = memory(envelope([valid, corrupt]));
        var raw = adapter.inspect();
        var result = storageModule.createStore(adapter).save(entry("new", 320, 300, 62));
        h.equal(result.status, "partial_corruption");
        h.equal(adapter.inspect(), raw);
    });

    h.test("remove is blocked while stored data is corrupt", function () {
        var valid = entry("valid", 300, 280, 55);
        var raw = envelope([valid, { recordId: "broken" }]);
        var adapter = memory(raw);
        var result = storageModule.createStore(adapter).remove("valid");
        h.equal(result.status, "partial_corruption");
        h.equal(adapter.inspect(), raw);
    });

    h.test("clear is blocked while stored data is corrupt", function () {
        var raw = "broken";
        var adapter = memory(raw);
        var result = storageModule.createStore(adapter).clear();
        h.equal(result.status, "corrupt_data");
        h.equal(adapter.inspect(), raw);
    });

    h.test("explicit recovery keeps only isolated valid records", function () {
        var valid = entry("valid", 300, 280, 55);
        var adapter = memory(envelope([valid, { recordId: "broken" }]));
        var result = storageModule.createStore(adapter).recoverValidEntries();
        h.ok(result.ok);
        h.equal(result.entries.length, 1);
        h.equal(JSON.parse(adapter.inspect()).entries[0].recordId, "valid");
    });

    h.test("recovery is unavailable without partial corruption", function () {
        var result = storageModule.createStore(memory()).recoverValidEntries();
        h.ok(!result.ok);
        h.equal(result.status, "recovery_not_available");
    });

    h.test("explicit discard removes unreadable data", function () {
        var adapter = memory("broken");
        var result = storageModule.createStore(adapter).discardCorruptData();
        h.ok(result.ok);
        h.equal(result.status, "corrupt_data_discarded");
        h.equal(adapter.inspect(), null);
    });

    h.test("discard is unavailable for intact data", function () {
        var adapter = memory();
        var store = storageModule.createStore(adapter);
        store.save(entry("valid", 300, 280, 55));
        h.equal(store.discardCorruptData().status, "discard_not_available");
        h.equal(store.list().entries.length, 1);
    });

    h.test("corrupt Hadlock EFW is rejected by storage validation", function () {
        var corrupt = JSON.parse(JSON.stringify(entry("valid", 300, 280, 55)));
        corrupt.efwGrams = 2000;
        h.ok(!storageModule.validateEntry(corrupt));
    });

    h.test("corrupt Hadlock biometrics are rejected by storage validation", function () {
        var corrupt = JSON.parse(JSON.stringify(entry("valid", 300, 280, 55)));
        corrupt.biometrics.hcCm = 31;
        h.ok(!storageModule.validateEntry(corrupt));
    });

    h.test("legitimate JSON serialization preserves Hadlock integrity", function () {
        var original = entry("valid", 300, 280, 55);
        h.ok(storageModule.validateEntry(JSON.parse(JSON.stringify(original))));
    });

    h.test("storage returns snapshots rather than mutable aliases", function () {
        var adapter = memory();
        var store = storageModule.createStore(adapter);
        var original = entry("valid", 300, 280, 55);
        var saved = store.save(original);
        h.ok(h.isDeepFrozen(saved));
        h.ok(saved.entries[0] !== original);
    });

    h.test("stored payload contains only the frozen record contract", function () {
        var adapter = memory();
        storageModule.createStore(adapter).save(entry("valid", 300, 280, 55));
        var saved = JSON.parse(adapter.inspect()).entries[0];
        h.keys(saved, [
            "schemaVersion", "scienceVersion", "referenceId", "referenceVersion",
            "recordId", "scanDate", "gestationalAgeWeeks", "gestationalAgeDays",
            "efwGrams", "efwSource", "efwMethod", "biometrics", "zScore",
            "percentile", "createdAt"
        ]);
    });

    ["motherName", "babyName", "medicalRecordNumber", "pregnancyPopulation",
        "seeksDiagnosis", "seeksClinicalInterpretation"].forEach(function forbidden(field) {
        h.test("Passport storage does not persist " + field, function () {
            var adapter = memory();
            storageModule.createStore(adapter).save(entry("valid", 300, 280, 55));
            h.ok(adapter.inspect().indexOf(field) === -1);
        });
    });

    h.test("unavailable adapter blocks persistence without throwing", function () {
        var result = storageModule.createStore(null).list();
        h.ok(!result.ok);
        h.equal(result.status, "storage_unavailable");
    });

    h.test("adapter read exceptions produce storage_unavailable", function () {
        var adapter = {
            getItem: function () { throw new Error("denied"); },
            setItem: function () {}, removeItem: function () {}
        };
        h.equal(storageModule.createStore(adapter).list().status, "storage_unavailable");
    });

    h.test("adapter write exceptions do not claim success", function () {
        var adapter = {
            getItem: function () { return null; },
            setItem: function () { throw new Error("quota"); }, removeItem: function () {}
        };
        h.equal(storageModule.createStore(adapter).save(entry("valid", 300, 280, 55)).status,
            "storage_unavailable");
    });
}(globalThis));
