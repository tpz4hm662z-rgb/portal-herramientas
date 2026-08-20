(function runWaterPassportStorageTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var science = root.ImoancyWaterScience;
    var ui = root.ImoancyWaterUI;
    var passportStorage = root.ImoancyWaterPassportStorage;

    function entry(id) {
        return science.buildSweatPassportEntry({
            id: id || "session-1",
            createdAt: "2026-08-20T12:00:00.000Z",
            sessionDate: "2026-08-20",
            inputs: {
                preWeightKg: 70,
                postWeightKg: 69.3,
                fluidIntakeLiters: 0.5,
                durationMinutes: 60,
                urineLiters: 0
            },
            context: {
                activity: "carrera",
                durationMinutes: 60,
                temperatureC: 24,
                humidityPercent: 45,
                indoorOutdoor: "outdoor",
                perceivedIntensity: "medium",
                equipmentOrClothing: "camiseta",
                notes: "sesión estable",
                sessionDate: "2026-08-20"
            }
        });
    }

    function memoryStorage(initial, failures) {
        var value = typeof initial === "undefined" ? null : initial;
        var fail = failures || {};
        return {
            getItem: function getItem() {
                if (fail.get) throw new Error("blocked get");
                return value;
            },
            setItem: function setItem(key, next) {
                if (fail.set) throw new Error("blocked set");
                value = next;
            },
            removeItem: function removeItem() {
                if (fail.remove) throw new Error("blocked remove");
                value = null;
            },
            raw: function raw() { return value; }
        };
    }

    function mutableCopy(value) {
        return JSON.parse(JSON.stringify(value));
    }

    h.test("almacén del Pasaporte expone contrato versionado y congelado", function () {
        h.equal(passportStorage.storageVersion, "1.0.0");
        h.equal(passportStorage.storageKey, "imoancy.agua-diaria.passport.v1");
        h.ok(Object.isFrozen(passportStorage));
    });
    h.test("entrada construida por el núcleo supera validación de esquema", function () {
        h.equal(passportStorage.validateEntry(entry()), true);
    });
    h.test("validación rechaza propiedades médicas ajenas al Pasaporte", function () {
        var unsafe = mutableCopy(entry());
        unsafe.hasKnownKidneyDisease = true;
        h.equal(passportStorage.validateEntry(unsafe), false);
    });
    h.test("validación rechaza versión científica distinta", function () {
        var invalid = mutableCopy(entry());
        invalid.scienceVersion = "9.0.0";
        h.equal(passportStorage.validateEntry(invalid), false);
    });
    h.test("validación rechaza sesión científica con errores", function () {
        var invalid = mutableCopy(entry());
        invalid.quality.status = "error";
        invalid.quality.errors.push({ code: "invalid" });
        h.equal(passportStorage.validateEntry(invalid), false);
    });
    h.test("validación rechaza contexto local fuera de esquema", function () {
        var invalid = mutableCopy(entry());
        invalid.context.humidityPercent = 140;
        h.equal(passportStorage.validateEntry(invalid), false);
    });
    h.test("almacén vacío devuelve estado estable", function () {
        var result = passportStorage.createStore(memoryStorage()).list();
        h.equal(result.ok, true);
        h.equal(result.status, "empty");
        h.equal(result.entries.length, 0);
    });
    h.test("guardar persiste sobre versionado local", function () {
        var adapter = memoryStorage();
        var result = passportStorage.createStore(adapter).save(entry());
        var raw = JSON.parse(adapter.raw());
        h.equal(result.ok, true);
        h.equal(result.entries.length, 1);
        h.equal(raw.storageVersion, "1.0.0");
        h.equal(raw.entries[0].id, "session-1");
    });
    h.test("listar recupera una sesión guardada", function () {
        var adapter = memoryStorage();
        var store = passportStorage.createStore(adapter);
        store.save(entry());
        h.close(store.list().entries[0].computed.sweatRateLitersPerHour, 1.2);
    });
    h.test("sesiones v1 recargadas conservan duración comparable", function () {
        var store = passportStorage.createStore(memoryStorage());
        store.save(entry("session-1"));
        store.save(entry("session-2"));
        var loaded = store.list().entries;
        var comparison = science.compareSessionContexts(loaded[0].context, loaded[1].context);
        h.equal(loaded[0].context.durationMinutes, 60);
        h.equal(loaded[1].context.durationMinutes, 60);
        h.equal(
            ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes),
            "Duración: 60 min"
        );
    });
    h.test("resultados del almacén son copias sin mutación interna", function () {
        var adapter = memoryStorage();
        var store = passportStorage.createStore(adapter);
        store.save(entry());
        var listed = store.list();
        listed.entries[0].id = "changed";
        h.equal(store.list().entries[0].id, "session-1");
    });
    h.test("identificador duplicado no se sobrescribe", function () {
        var store = passportStorage.createStore(memoryStorage());
        store.save(entry());
        var duplicate = store.save(entry());
        h.equal(duplicate.ok, false);
        h.equal(duplicate.status, "duplicate_id");
        h.equal(duplicate.entries.length, 1);
    });
    h.test("entrada inválida nunca se escribe", function () {
        var adapter = memoryStorage();
        var invalid = mutableCopy(entry());
        invalid.inputs.durationMinutes = 0;
        var result = passportStorage.createStore(adapter).save(invalid);
        h.equal(result.status, "invalid_entry");
        h.equal(adapter.raw(), null);
    });
    h.test("eliminar retira únicamente la sesión indicada", function () {
        var store = passportStorage.createStore(memoryStorage());
        store.save(entry("one"));
        store.save(entry("two"));
        var removed = store.remove("one");
        h.equal(removed.ok, true);
        h.equal(removed.entries.length, 1);
        h.equal(removed.entries[0].id, "two");
    });
    h.test("eliminar identificador inexistente conserva historial", function () {
        var store = passportStorage.createStore(memoryStorage());
        store.save(entry());
        var result = store.remove("missing");
        h.equal(result.status, "not_found");
        h.equal(result.entries.length, 1);
    });
    h.test("borrar historial elimina la clave local", function () {
        var adapter = memoryStorage();
        var store = passportStorage.createStore(adapter);
        store.save(entry());
        h.equal(store.clear().status, "cleared");
        h.equal(adapter.raw(), null);
    });
    h.test("JSON local corrupto se aísla sin romper", function () {
        var result = passportStorage.createStore(memoryStorage("{broken")).list();
        h.equal(result.ok, false);
        h.equal(result.status, "corrupt_data");
        h.equal(result.entries.length, 0);
    });
    h.test("estructura local con versión desconocida se trata como corrupta", function () {
        var raw = JSON.stringify({ storageVersion: "2.0.0", entries: [] });
        h.equal(passportStorage.createStore(memoryStorage(raw)).list().status, "corrupt_data");
    });
    h.test("entrada corrupta dentro de un sobre válido se identifica por separado", function () {
        var raw = JSON.stringify({ storageVersion: "1.0.0", entries: [{}] });
        var result = passportStorage.createStore(memoryStorage(raw)).list();
        h.equal(result.status, "partial_corruption");
        h.equal(result.invalidEntryCount, 1);
    });
    h.test("guardar una sesión válida no sobrescribe almacenamiento corrupto", function () {
        var adapter = memoryStorage("not-json");
        var store = passportStorage.createStore(adapter);
        var result = store.save(entry());
        h.equal(result.ok, false);
        h.equal(result.status, "corrupt_data");
        h.equal(adapter.raw(), "not-json");
    });
    h.test("corrupción parcial conserva entradas válidas sin escribir", function () {
        var raw = JSON.stringify({ storageVersion: "1.0.0", entries: [entry("valid"), {}] });
        var adapter = memoryStorage(raw);
        var result = passportStorage.createStore(adapter).list();
        h.equal(result.status, "partial_corruption");
        h.equal(result.entries.length, 1);
        h.equal(result.entries[0].id, "valid");
        h.equal(adapter.raw(), raw);
    });
    h.test("corrupción parcial bloquea nuevas escrituras", function () {
        var raw = JSON.stringify({ storageVersion: "1.0.0", entries: [entry("valid"), {}] });
        var adapter = memoryStorage(raw);
        var result = passportStorage.createStore(adapter).save(entry("new"));
        h.equal(result.ok, false);
        h.equal(result.status, "partial_corruption");
        h.equal(adapter.raw(), raw);
    });
    h.test("recuperación explícita conserva solo entradas validadas", function () {
        var raw = JSON.stringify({ storageVersion: "1.0.0", entries: [entry("valid"), {}] });
        var adapter = memoryStorage(raw);
        var store = passportStorage.createStore(adapter);
        var result = store.recoverValidEntries();
        h.equal(result.ok, true);
        h.equal(result.entries.length, 1);
        h.equal(result.entries[0].id, "valid");
        h.equal(store.list().status, "ready");
    });
    h.test("recuperación no está disponible para JSON ilegible", function () {
        var adapter = memoryStorage("not-json");
        var result = passportStorage.createStore(adapter).recoverValidEntries();
        h.equal(result.ok, false);
        h.equal(result.status, "recovery_not_available");
        h.equal(adapter.raw(), "not-json");
    });
    h.test("versión local desconocida también bloquea guardar sin sobrescribir", function () {
        var raw = JSON.stringify({ storageVersion: "2.0.0", entries: [] });
        var adapter = memoryStorage(raw);
        var result = passportStorage.createStore(adapter).save(entry("new"));
        h.equal(result.ok, false);
        h.equal(result.status, "corrupt_data");
        h.equal(adapter.raw(), raw);
    });
    h.test("lectura bloqueada devuelve storage_unavailable", function () {
        var result = passportStorage.createStore(memoryStorage(null, { get: true })).list();
        h.equal(result.ok, false);
        h.equal(result.status, "storage_unavailable");
    });
    h.test("escritura bloqueada no rompe la herramienta", function () {
        var result = passportStorage.createStore(memoryStorage(null, { set: true })).save(entry());
        h.equal(result.ok, false);
        h.equal(result.status, "storage_unavailable");
    });
    h.test("borrado bloqueado no rompe la herramienta", function () {
        var result = passportStorage.createStore(memoryStorage(null, { remove: true })).clear();
        h.equal(result.ok, false);
        h.equal(result.status, "storage_unavailable");
    });
    h.test("adaptador ausente devuelve storage_unavailable", function () {
        h.equal(passportStorage.createStore(null).list().status, "storage_unavailable");
    });
}(globalThis));
