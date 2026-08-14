/* Persistencia local tolerante a fallos. No accede al DOM ni envía datos. */
"use strict";

(function (root, factory) {
    const tracking = typeof module === "object" && module.exports
        ? require("./tracking-schema.js")
        : root.ImoancyBodyFatTracking;
    const api = factory(tracking);
    if (typeof module === "object" && module.exports) module.exports = api;
    root.ImoancyBodyFatHistoryStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (tracking) {
    const STORAGE_KEY = "imoancy.body-fat-pro.history.v1";
    const DOCUMENT_VERSION = 1;
    const MAX_DOCUMENT_CHARS = 2000000;
    const MAX_INPUT_RECORDS = 5000;
    const MIN_TIMESTAMP_MS = Date.UTC(2000, 0, 1);
    const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

    function emptyResult(status, detail) {
        return { status, records: [], invalidRecords: 0, detail: detail || null };
    }

    function createStore(storage, options) {
        const now = options && typeof options.now === "function" ? options.now : Date.now;
        function currentTime() {
            try {
                const value = Number(now());
                return Number.isFinite(value) ? value : Date.now();
            } catch (_) { return Date.now(); }
        }
        function validStoredRecord(record, referenceTime) {
            if (!tracking.validateMeasurement(record)) return false;
            const timestamp = new Date(record.measuredAt).getTime();
            return timestamp >= MIN_TIMESTAMP_MS && timestamp <= referenceTime + MAX_FUTURE_SKEW_MS;
        }

        function read() {
            if (!storage || typeof storage.getItem !== "function") return emptyResult("UNAVAILABLE");
            try {
                const raw = storage.getItem(STORAGE_KEY);
                if (raw === null) return emptyResult("EMPTY");
                if (typeof raw !== "string" || raw.length > MAX_DOCUMENT_CHARS) return emptyResult("DOCUMENT_TOO_LARGE");
                const parsed = JSON.parse(raw);
                if (!parsed || parsed.schemaVersion !== DOCUMENT_VERSION || !Array.isArray(parsed.records)) {
                    return emptyResult("CORRUPT_DOCUMENT");
                }
                if (parsed.records.length > MAX_INPUT_RECORDS) return emptyResult("TOO_MANY_RECORDS");
                const candidates = [], valid = [], ids = new Set();
                let invalidRecords = 0;
                const referenceTime = currentTime();
                parsed.records.forEach(record => {
                    if (!validStoredRecord(record, referenceTime) || ids.has(record.id)) invalidRecords += 1;
                    else { ids.add(record.id); candidates.push(record); }
                });
                const temporalGroups = new Map();
                candidates.forEach(record => {
                    if (!temporalGroups.has(record.measuredAt)) temporalGroups.set(record.measuredAt, []);
                    temporalGroups.get(record.measuredAt).push(record);
                });
                temporalGroups.forEach(group => {
                    if (tracking.isCoherentMeasurementGroup(group)) valid.push(...group);
                    else invalidRecords += group.length;
                });
                valid.sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
                return {
                    status: invalidRecords ? "PARTIAL" : "OK",
                    records: valid.slice(-tracking.MAX_RECORDS),
                    invalidRecords,
                    detail: null
                };
            } catch (error) {
                return emptyResult(error instanceof SyntaxError ? "CORRUPT_DOCUMENT" : "READ_ERROR", error && error.name);
            }
        }

        function write(records) {
            if (!storage || typeof storage.setItem !== "function") return { status: "UNAVAILABLE" };
            if (!Array.isArray(records)) return { status: "INVALID_RECORDS" };
            if (records.length > MAX_INPUT_RECORDS) return { status: "TOO_MANY_RECORDS" };
            const referenceTime = currentTime();
            const valid = records.filter(record => validStoredRecord(record, referenceTime))
                .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt))
                .slice(-tracking.MAX_RECORDS);
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: DOCUMENT_VERSION, records: valid }));
                return { status: "OK", records: valid };
            } catch (error) {
                return { status: error && error.name === "QuotaExceededError" ? "QUOTA_EXCEEDED" : "WRITE_ERROR", detail: error && error.name };
            }
        }

        function add(recordsToAdd) {
            const referenceTime = currentTime();
            if (!Array.isArray(recordsToAdd) || !recordsToAdd.length || recordsToAdd.length > 10 ||
                !recordsToAdd.every(record => validStoredRecord(record, referenceTime))) {
                return { status: "INVALID_RECORDS" };
            }
            const current = read();
            if (["UNAVAILABLE", "READ_ERROR", "CORRUPT_DOCUMENT", "DOCUMENT_TOO_LARGE", "TOO_MANY_RECORDS"].includes(current.status)) return { status: current.status };
            const merged = current.records.slice();
            recordsToAdd.forEach(candidate => {
                const duplicate = merged.some(record => record.id === candidate.id || (
                    record.measuredAt === candidate.measuredAt &&
                    record.method.id === candidate.method.id &&
                    JSON.stringify(record.observed) === JSON.stringify(candidate.observed)
                ));
                if (!duplicate) merged.push(candidate);
            });
            return write(merged);
        }

        function removeAt(measuredAt) {
            const current = read();
            if (!["OK", "PARTIAL"].includes(current.status)) return { status: current.status };
            return write(current.records.filter(record => record.measuredAt !== measuredAt));
        }

        function clear() {
            if (!storage || typeof storage.removeItem !== "function") return { status: "UNAVAILABLE" };
            try { storage.removeItem(STORAGE_KEY); return { status: "OK" }; }
            catch (error) { return { status: "WRITE_ERROR", detail: error && error.name }; }
        }

        return Object.freeze({ read, write, add, removeAt, clear });
    }

    return Object.freeze({ createStore, STORAGE_KEY, DOCUMENT_VERSION, MAX_DOCUMENT_CHARS, MAX_INPUT_RECORDS });
});
