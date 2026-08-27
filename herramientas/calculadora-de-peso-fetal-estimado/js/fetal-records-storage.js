(function exposeFetalWeightRecordStorage(root) {
    "use strict";

    var records = root.ImoancyFetalWeightRecords;
    var STORAGE_VERSION = "1.0.0";
    var STORAGE_KEY = "imoancy.peso-fetal.passport.v1";
    var KNOWN_HISTORICAL_SCIENCE_VERSIONS = Object.freeze([]);

    if (!records) {
        throw new Error(
            "ImoancyFetalWeightRecords must be loaded before ImoancyFetalWeightRecordStorage."
        );
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function hasExactKeys(value, expectedKeys) {
        return isRecord(value) &&
            Object.keys(value).sort().join("|") === expectedKeys.slice().sort().join("|");
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }

        Object.getOwnPropertyNames(value).forEach(function freezeProperty(key) {
            deepFreeze(value[key]);
        });

        return Object.freeze(value);
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

        return deepFreeze(output);
    }

    function entryVersionStatus(entry) {
        if (!isRecord(entry) ||
            entry.schemaVersion !== records.schemaVersion ||
            typeof entry.scienceVersion !== "string") {
            return "invalid";
        }
        if (entry.scienceVersion === records.scienceVersion) {
            return "current";
        }
        if (KNOWN_HISTORICAL_SCIENCE_VERSIONS.indexOf(entry.scienceVersion) !== -1) {
            return "historical";
        }
        return "unsupported_version";
    }

    function validateEntry(entry) {
        if (["current", "historical"].indexOf(entryVersionStatus(entry)) === -1) {
            return false;
        }

        try {
            /*
             * The frozen records contract is the only integrity validator.
             * Comparing an entry with itself validates its complete snapshot,
             * including Hadlock provenance and any current reference position.
             */
            records.compareFetalPassportEntries(entry, entry);
            return true;
        } catch (error) {
            return false;
        }
    }

    function historicalEntries(entries) {
        return entries.filter(function historical(entry) {
            return entryVersionStatus(entry) === "historical";
        });
    }

    function duplicateRecordIdInfo(entries) {
        var counts = Object.create(null);
        var duplicateIds = [];
        var duplicateEntryCount = 0;

        entries.forEach(function count(entry) {
            if (isRecord(entry) && typeof entry.recordId === "string") {
                counts[entry.recordId] = (counts[entry.recordId] || 0) + 1;
            }
        });
        Object.keys(counts).sort().forEach(function collect(recordId) {
            if (counts[recordId] > 1) {
                duplicateIds.push(recordId);
                duplicateEntryCount += counts[recordId];
            }
        });
        return {
            duplicateIds: duplicateIds,
            duplicateEntryCount: duplicateEntryCount,
            isDuplicate: function isDuplicate(recordId) {
                return typeof recordId === "string" && counts[recordId] > 1;
            }
        };
    }

    function createStore(adapter) {
        var storage = null;
        var lastKnownSnapshot = null;

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

        function remember(entries) {
            lastKnownSnapshot = clone(entries);
        }

        function unavailable(status, extra) {
            var snapshotKnown = Array.isArray(lastKnownSnapshot);
            var snapshot = snapshotKnown ? clone(lastKnownSnapshot) : [];
            var metadata = {
                snapshotKnown: snapshotKnown,
                historyAvailability: snapshotKnown ? "last_known_snapshot" : "unknown",
                confirmedEmpty: false,
                preservedExistingEntries: snapshotKnown && snapshot.length > 0
            };
            Object.keys(extra || {}).forEach(function copy(key) {
                metadata[key] = extra[key];
            });
            return result(false, status, snapshot, metadata);
        }

        function read() {
            var raw;
            var parsed;
            var validEntries;
            var invalidEntryCount;
            var historical;
            var duplicateInfo;

            if (!storageAvailable()) {
                return unavailable("storage_unavailable");
            }

            try {
                raw = storage.getItem(STORAGE_KEY);
            } catch (error) {
                return unavailable("storage_unavailable");
            }

            if (raw === null) {
                remember([]);
                return result(true, "empty", [], {
                    snapshotKnown: true,
                    historyAvailability: "confirmed",
                    confirmedEmpty: true,
                    historicalEntryCount: 0
                });
            }

            try {
                parsed = JSON.parse(raw);
            } catch (error) {
                return unavailable("corrupt_data");
            }

            if (!hasExactKeys(parsed, ["storageVersion", "entries"]) ||
                parsed.storageVersion !== STORAGE_VERSION ||
                !Array.isArray(parsed.entries)) {
                return unavailable("corrupt_data");
            }

            duplicateInfo = duplicateRecordIdInfo(parsed.entries);
            validEntries = parsed.entries.filter(function validAndUnambiguous(entry) {
                return validateEntry(entry) && !duplicateInfo.isDuplicate(entry.recordId);
            });
            invalidEntryCount = parsed.entries.length - validEntries.length;
            historical = historicalEntries(validEntries);
            remember(validEntries);

            if (invalidEntryCount > 0) {
                return result(false, "partial_corruption", clone(validEntries), {
                    invalidEntryCount: invalidEntryCount,
                    historicalEntryCount: historical.length,
                    duplicateRecordIds: duplicateInfo.duplicateIds,
                    duplicateEntryCount: duplicateInfo.duplicateEntryCount,
                    snapshotKnown: true,
                    historyAvailability: "isolated_valid_entries",
                    confirmedEmpty: false
                });
            }

            return result(
                true,
                parsed.entries.length > 0 ?
                    (historical.length > 0 ? "ready_with_historical_entries" : "ready") :
                    "empty",
                clone(parsed.entries),
                {
                    historicalEntryCount: historical.length,
                    duplicateRecordIds: [],
                    duplicateEntryCount: 0,
                    snapshotKnown: true,
                    historyAvailability: "confirmed",
                    confirmedEmpty: parsed.entries.length === 0
                }
            );
        }

        function write(entries, fallbackEntries) {
            var snapshot;
            var fallback = Array.isArray(fallbackEntries) ? clone(fallbackEntries) : [];

            if (!storageAvailable()) {
                return unavailable("storage_unavailable", {
                    operationFallbackEntries: fallback.length
                });
            }

            if (!Array.isArray(entries) || !entries.every(validateEntry)) {
                return result(false, "invalid_entry", fallback, {
                    preservedExistingEntries: fallback.length > 0
                });
            }

            snapshot = clone(entries);

            try {
                storage.setItem(STORAGE_KEY, JSON.stringify({
                    storageVersion: STORAGE_VERSION,
                    entries: snapshot
                }));
            } catch (error) {
                return unavailable("storage_unavailable", {
                    operationFallbackEntries: fallback.length
                });
            }

            remember(snapshot);

            return result(
                true,
                snapshot.length > 0 ?
                    (historicalEntries(snapshot).length > 0 ? "ready_with_historical_entries" : "ready") :
                    "empty",
                snapshot,
                {
                    historicalEntryCount: historicalEntries(snapshot).length,
                    snapshotKnown: true,
                    historyAvailability: "confirmed",
                    confirmedEmpty: snapshot.length === 0
                }
            );
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

            entries = clone(loaded.entries);
            if (entries.some(function duplicate(saved) {
                return saved.recordId === entry.recordId;
            })) {
                return result(false, "duplicate_id", entries);
            }

            entries.unshift(clone(entry));
            return write(entries, loaded.entries);
        }

        function remove(recordId) {
            var loaded = read();
            var entries;
            var filtered;

            if (!loaded.ok) {
                return loaded;
            }

            entries = clone(loaded.entries);
            filtered = entries.filter(function keep(entry) {
                return entry.recordId !== recordId;
            });

            if (filtered.length === entries.length) {
                return result(false, "not_found", entries);
            }

            return write(filtered, loaded.entries);
        }

        function clear() {
            var loaded = read();

            if (!loaded.ok) {
                return loaded;
            }

            try {
                storage.removeItem(STORAGE_KEY);
            } catch (error) {
                return unavailable("storage_unavailable");
            }

            remember([]);
            return result(true, "cleared", []);
        }

        function recoverValidEntries() {
            var loaded = read();

            if (loaded.status !== "partial_corruption") {
                return result(false, "recovery_not_available", loaded.entries, {
                    sourceStatus: loaded.status
                });
            }

            return write(clone(loaded.entries), loaded.entries);
        }

        function discardCorruptData() {
            var loaded = read();

            if (loaded.status !== "partial_corruption" && loaded.status !== "corrupt_data") {
                return result(false, "discard_not_available", loaded.entries, {
                    sourceStatus: loaded.status
                });
            }

            try {
                storage.removeItem(STORAGE_KEY);
            } catch (error) {
                return unavailable("storage_unavailable");
            }

            remember([]);
            return result(true, "corrupt_data_discarded", []);
        }

        return Object.freeze({
            list: read,
            save: save,
            remove: remove,
            clear: clear,
            recoverValidEntries: recoverValidEntries,
            discardCorruptData: discardCorruptData
        });
    }

    root.ImoancyFetalWeightRecordStorage = Object.freeze({
        storageVersion: STORAGE_VERSION,
        storageKey: STORAGE_KEY,
        historicalPolicy: deepFreeze({
            currentScienceVersion: records.scienceVersion,
            knownHistoricalScienceVersions: KNOWN_HISTORICAL_SCIENCE_VERSIONS,
            unknownVersionsAccepted: false,
            requiresCurrentSchemaVersion: true,
            requiresFrozenRecordsIntegrityValidation: true,
            recalculatesHistoricalRecords: false,
            migratesHistoricalRecordsSilently: false
        }),
        entryVersionStatus: entryVersionStatus,
        validateEntry: validateEntry,
        createStore: createStore
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
