(function exposeWaterPassportStorage(root) {
    "use strict";

    var scienceConfig = root.ImoancyWaterScienceConfig;
    var STORAGE_VERSION = "1.0.0";
    var STORAGE_KEY = "imoancy.agua-diaria.passport.v1";

    if (!scienceConfig) {
        throw new Error("ImoancyWaterScienceConfig must be loaded before ImoancyWaterPassportStorage.");
    }

    function hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isFiniteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function result(ok, status, entries, extra) {
        var output = {
            ok: ok,
            status: status,
            entries: entries || []
        };

        Object.keys(extra || {}).forEach(function copyExtra(key) {
            output[key] = extra[key];
        });

        return output;
    }

    function validOptionalText(value) {
        return value === null || typeof value === "string";
    }

    function hasExactKeys(value, keys) {
        return isRecord(value) &&
            Object.keys(value).sort().join("|") === keys.slice().sort().join("|");
    }

    function validateEntry(entry) {
        var inputFields = [
            "preWeightKg",
            "postWeightKg",
            "fluidIntakeLiters",
            "durationMinutes",
            "urineLiters"
        ];
        var computedFields = [
            "durationHours",
            "sweatLossLiters",
            "sweatRateLitersPerHour",
            "bodyMassChangePercent"
        ];

        if (!hasExactKeys(entry, [
            "schemaVersion", "scienceVersion", "id", "createdAt", "sessionDate",
            "inputs", "context", "computed", "quality", "qualityFlags", "semantics"
        ]) ||
            entry.schemaVersion !== scienceConfig.schemaVersions.sweatPassportEntry ||
            entry.scienceVersion !== scienceConfig.scienceVersion ||
            typeof entry.id !== "string" || entry.id.trim() === "" ||
            typeof entry.createdAt !== "string" || entry.createdAt.trim() === "" ||
            !validOptionalText(entry.sessionDate) ||
            !hasExactKeys(entry.inputs, inputFields) ||
            !hasExactKeys(entry.context, [
                "activity", "durationMinutes", "temperatureC", "humidityPercent",
                "indoorOutdoor", "perceivedIntensity", "equipmentOrClothing", "notes", "sessionDate"
            ]) ||
            !hasExactKeys(entry.computed, computedFields.concat(["observationType"])) ||
            !hasExactKeys(entry.quality, ["status", "errors", "warnings"]) ||
            !hasExactKeys(entry.semantics, [
                "isSessionSpecificObservation", "isDailyWaterNeed",
                "isFluidIntakePrescription", "combinesWithEfsaReference"
            ]) ||
            !Array.isArray(entry.qualityFlags)) {
            return false;
        }

        if (!inputFields.every(function validInput(field) {
            return hasOwn(entry.inputs, field) && isFiniteNumber(entry.inputs[field]);
        }) || !computedFields.every(function validComputed(field) {
            return hasOwn(entry.computed, field) && isFiniteNumber(entry.computed[field]);
        })) {
            return false;
        }

        if (entry.inputs.preWeightKg <= 0 || entry.inputs.postWeightKg <= 0 ||
            entry.inputs.fluidIntakeLiters < 0 || entry.inputs.durationMinutes <= 0 ||
            entry.inputs.urineLiters < 0 || entry.computed.durationHours <= 0 ||
            entry.computed.sweatLossLiters < 0 || entry.computed.sweatRateLitersPerHour < 0 ||
            typeof entry.computed.observationType !== "string") {
            return false;
        }

        if (!["activity", "indoorOutdoor", "perceivedIntensity", "equipmentOrClothing", "notes", "sessionDate"]
            .every(function validContextText(field) { return validOptionalText(entry.context[field]); }) ||
            !isFiniteNumber(entry.context.durationMinutes) || entry.context.durationMinutes <= 0 ||
            (entry.context.temperatureC !== null && !isFiniteNumber(entry.context.temperatureC)) ||
            (entry.context.humidityPercent !== null &&
                (!isFiniteNumber(entry.context.humidityPercent) ||
                    entry.context.humidityPercent < 0 || entry.context.humidityPercent > 100)) ||
            entry.context.durationMinutes !== entry.inputs.durationMinutes ||
            entry.context.sessionDate !== entry.sessionDate ||
            !entry.qualityFlags.every(function validFlag(flag) { return typeof flag === "string"; })) {
            return false;
        }

        if ((entry.quality.status !== "valid" && entry.quality.status !== "warning") ||
            !Array.isArray(entry.quality.errors) || entry.quality.errors.length > 0 ||
            !Array.isArray(entry.quality.warnings) ||
            entry.semantics.isSessionSpecificObservation !== true ||
            entry.semantics.isDailyWaterNeed !== false ||
            entry.semantics.isFluidIntakePrescription !== false ||
            entry.semantics.combinesWithEfsaReference !== false) {
            return false;
        }

        return true;
    }

    function createStore(adapter) {
        var storage = null;

        if (arguments.length > 0) {
            storage = adapter;
        } else {
            try {
                storage = root.localStorage;
            } catch (error) {
                storage = null;
            }
        }

        function storageAvailable() {
            return storage &&
                typeof storage.getItem === "function" &&
                typeof storage.setItem === "function" &&
                typeof storage.removeItem === "function";
        }

        function read() {
            var raw;
            var parsed;
            var validEntries;
            var invalidEntryCount;

            if (!storageAvailable()) {
                return result(false, "storage_unavailable", []);
            }

            try {
                raw = storage.getItem(STORAGE_KEY);
            } catch (error) {
                return result(false, "storage_unavailable", []);
            }

            if (raw === null) {
                return result(true, "empty", []);
            }

            try {
                parsed = JSON.parse(raw);
            } catch (error) {
                return result(false, "corrupt_data", []);
            }

            if (!isRecord(parsed) || parsed.storageVersion !== STORAGE_VERSION ||
                !Array.isArray(parsed.entries)) {
                return result(false, "corrupt_data", []);
            }

            validEntries = parsed.entries.filter(validateEntry);
            invalidEntryCount = parsed.entries.length - validEntries.length;
            if (invalidEntryCount > 0) {
                return result(false, "partial_corruption", clone(validEntries), {
                    invalidEntryCount: invalidEntryCount
                });
            }

            return result(true, parsed.entries.length > 0 ? "ready" : "empty", clone(parsed.entries));
        }

        function write(entries) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify({
                    storageVersion: STORAGE_VERSION,
                    entries: entries
                }));
            } catch (error) {
                return result(false, "storage_unavailable", []);
            }

            return result(true, entries.length > 0 ? "ready" : "empty", clone(entries));
        }

        function save(entry) {
            var loaded;
            var entries;

            if (!validateEntry(entry)) {
                return result(false, "invalid_entry", []);
            }

            loaded = read();
            if (!loaded.ok) {
                return loaded;
            }

            entries = loaded.entries;
            if (entries.some(function duplicate(saved) { return saved.id === entry.id; })) {
                return result(false, "duplicate_id", entries);
            }

            entries.unshift(clone(entry));
            return write(entries);
        }

        function remove(id) {
            var loaded = read();
            var entries;
            var filtered;

            if (!loaded.ok) {
                return loaded;
            }

            entries = loaded.entries;
            filtered = entries.filter(function keep(entry) { return entry.id !== id; });
            if (filtered.length === entries.length) {
                return result(false, "not_found", entries);
            }

            return write(filtered);
        }

        function clear() {
            if (!storageAvailable()) {
                return result(false, "storage_unavailable", []);
            }

            try {
                storage.removeItem(STORAGE_KEY);
            } catch (error) {
                return result(false, "storage_unavailable", []);
            }

            return result(true, "cleared", []);
        }

        function recoverValidEntries() {
            var loaded = read();

            if (loaded.status !== "partial_corruption") {
                return result(false, "recovery_not_available", loaded.entries, {
                    sourceStatus: loaded.status
                });
            }

            return write(loaded.entries);
        }

        return Object.freeze({
            list: read,
            save: save,
            remove: remove,
            clear: clear,
            recoverValidEntries: recoverValidEntries
        });
    }

    root.ImoancyWaterPassportStorage = Object.freeze({
        storageVersion: STORAGE_VERSION,
        storageKey: STORAGE_KEY,
        validateEntry: validateEntry,
        createStore: createStore
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
