(function exposeFetalWeightRecords(root) {
    "use strict";

    var scienceConfig = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var ENTRY_KEYS = Object.freeze([
        "schemaVersion",
        "scienceVersion",
        "referenceId",
        "referenceVersion",
        "recordId",
        "scanDate",
        "gestationalAgeWeeks",
        "gestationalAgeDays",
        "efwGrams",
        "efwSource",
        "efwMethod",
        "biometrics",
        "zScore",
        "percentile",
        "createdAt"
    ]);
    var BUILD_INPUT_KEYS = Object.freeze([
        "referenceId",
        "referenceVersion",
        "recordId",
        "scanDate",
        "gestationalAgeWeeks",
        "gestationalAgeDays",
        "efwGrams",
        "efwSource",
        "efwMethod",
        "biometrics",
        "zScore",
        "percentile",
        "createdAt"
    ]);
    var BIOMETRIC_KEYS = Object.freeze(["hcCm", "acCm", "flCm"]);
    var UNKNOWN_METHODS = Object.freeze(["unknown", "report_efw_method_unknown"]);

    if (!scienceConfig) {
        throw new Error(
            "ImoancyFetalWeightScienceConfig must be loaded before ImoancyFetalWeightRecords."
        );
    }

    if (!science) {
        throw new Error(
            "ImoancyFetalWeightScience must be loaded before ImoancyFetalWeightRecords."
        );
    }

    if (science.scienceVersion !== scienceConfig.scienceVersion) {
        throw new Error("Fetal-weight science dependency versions do not match.");
    }

    if (
        typeof science.normalizeGestationalAge !== "function" ||
        typeof science.calculateHadlockHcAcFl !== "function" ||
        typeof science.resolveEfwObservation !== "function" ||
        typeof science.positionEfwInReference !== "function"
    ) {
        throw new Error("Fetal-weight record dependencies expose an invalid contract.");
    }

    if (
        !scienceConfig.schemaVersions ||
        typeof scienceConfig.schemaVersions.fetalPassportEntry !== "string"
    ) {
        throw new Error("The fetal Passport schema version is not configured.");
    }

    function hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isFiniteNumber(value) {
        return typeof value === "number" && isFinite(value);
    }

    function isPositiveFiniteNumber(value) {
        return isFiniteNumber(value) && value > 0;
    }

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim() !== "";
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

    function sameKeysOrSubset(value, allowedKeys) {
        return Object.keys(value).every(function isAllowed(key) {
            return allowedKeys.indexOf(key) !== -1;
        });
    }

    function hasExactKeys(value, expectedKeys) {
        var actual;
        var expected;

        if (!isRecord(value)) {
            return false;
        }

        actual = Object.keys(value).sort().join("|");
        expected = expectedKeys.slice().sort().join("|");
        return actual === expected;
    }

    function fail(field, message) {
        throw new TypeError(field + ": " + message);
    }

    function ensureBuilderInput(options) {
        if (!isRecord(options)) {
            fail("options", "must be an object");
        }

        if (!sameKeysOrSubset(options, BUILD_INPUT_KEYS)) {
            fail("options", "contains a field outside the versioned Passport contract");
        }

        [
            "recordId",
            "createdAt",
            "gestationalAgeWeeks",
            "gestationalAgeDays",
            "efwGrams",
            "efwSource"
        ].forEach(function requireOwnField(field) {
            if (!hasOwn(options, field)) {
                fail(field, "is required and must be provided by the caller");
            }
        });

        if (!isNonEmptyString(options.recordId)) {
            fail("recordId", "must be a non-empty caller-provided string");
        }

        if (!isNonEmptyString(options.createdAt)) {
            fail("createdAt", "must be a non-empty caller-provided string");
        }

        if (!isPositiveFiniteNumber(options.efwGrams)) {
            fail("efwGrams", "must be a positive finite number");
        }

        if (
            options.efwSource !== "imoancy_hadlock_hc_ac_fl" &&
            options.efwSource !== "report_entered"
        ) {
            fail("efwSource", "is not supported by this schema version");
        }

        if (
            hasOwn(options, "efwMethod") &&
            options.efwMethod !== null &&
            !isNonEmptyString(options.efwMethod)
        ) {
            fail("efwMethod", "must be null or a non-empty string when supplied");
        }
    }

    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function daysInMonth(year, month) {
        var lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return lengths[month - 1];
    }

    function parseIsoDate(value) {
        var match;
        var year;
        var month;
        var day;

        if (typeof value !== "string") {
            return null;
        }

        match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return null;
        }

        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);

        if (
            year < 1 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > daysInMonth(year, month)
        ) {
            return null;
        }

        return {
            year: year,
            month: month,
            day: day
        };
    }

    /* Gregorian civil date to a deterministic serial day; no clock or Date object. */
    function civilDateToSerialDay(dateParts) {
        var year = dateParts.year;
        var month = dateParts.month;
        var day = dateParts.day;
        var era;
        var yearOfEra;
        var dayOfYear;
        var dayOfEra;

        year -= month <= 2 ? 1 : 0;
        era = Math.floor(year / 400);
        yearOfEra = year - era * 400;
        dayOfYear = Math.floor(
            (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5
        ) + day - 1;
        dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) -
            Math.floor(yearOfEra / 100) + dayOfYear;

        return era * 146097 + dayOfEra;
    }

    function normalizeOptionalScanDate(options) {
        var value = hasOwn(options, "scanDate") ? options.scanDate : null;

        if (value !== null && !parseIsoDate(value)) {
            fail("scanDate", "must be null or a valid YYYY-MM-DD calendar date");
        }

        return value;
    }

    function normalizeGestationalAge(options) {
        var result = science.normalizeGestationalAge({
            weeks: options.gestationalAgeWeeks,
            days: options.gestationalAgeDays
        });

        if (!isRecord(result) || result.status !== "valid" || !isRecord(result.gestationalAge)) {
            fail("gestationalAge", "must contain valid completed weeks and 0-6 additional days");
        }

        return result.gestationalAge;
    }

    function normalizeBiometrics(value, requireComplete) {
        var normalized;
        var availableCount;

        if (value === undefined || value === null) {
            if (requireComplete) {
                fail("biometrics", "HC, AC and FL are required for the Imoancy Hadlock source");
            }
            return null;
        }

        if (!isRecord(value) || !sameKeysOrSubset(value, BIOMETRIC_KEYS)) {
            fail("biometrics", "must contain only hcCm, acCm and flCm");
        }

        normalized = {
            hcCm: hasOwn(value, "hcCm") ? value.hcCm : null,
            acCm: hasOwn(value, "acCm") ? value.acCm : null,
            flCm: hasOwn(value, "flCm") ? value.flCm : null
        };

        BIOMETRIC_KEYS.forEach(function validateKnownBiometric(field) {
            if (normalized[field] !== null && !isPositiveFiniteNumber(normalized[field])) {
                fail("biometrics." + field, "must be a positive finite number when present");
            }
        });

        availableCount = BIOMETRIC_KEYS.filter(function isAvailable(field) {
            return normalized[field] !== null;
        }).length;

        if (requireComplete && availableCount !== BIOMETRIC_KEYS.length) {
            fail("biometrics", "HC, AC and FL are required for the Imoancy Hadlock source");
        }

        return availableCount === 0 ? null : normalized;
    }

    function numbersPreserveSameBinary64Value(left, right) {
        /*
         * The schema stores the unrounded finite Number. JSON serialization
         * round-trips that IEEE-754 binary64 value exactly, so accepting even
         * an adjacent representable value would conceal a changed EFW.
         */
        return left === right;
    }

    function normalizeEfwObservation(options, biometrics) {
        var input;
        var result;
        var observation;
        var explicitMethod;

        if (options.efwSource === "imoancy_hadlock_hc_ac_fl") {
            input = {
                mode: "biometrics",
                biometrics: {
                    hcCm: biometrics.hcCm,
                    acCm: biometrics.acCm,
                    flCm: biometrics.flCm
                }
            };
        } else {
            explicitMethod = hasOwn(options, "efwMethod") &&
                isNonEmptyString(options.efwMethod) &&
                !isUnknownMethod(options.efwMethod);
            input = {
                mode: "report_entered",
                efwGrams: options.efwGrams
            };

            if (explicitMethod) {
                input.reportedMethod = options.efwMethod;
            }
        }

        result = science.resolveEfwObservation(input);

        if (!isRecord(result) || result.status !== "valid" || !isRecord(result.observation)) {
            fail("efwGrams", "does not form a valid EFW observation");
        }

        observation = result.observation;

        if (!numbersPreserveSameBinary64Value(observation.efwGrams, options.efwGrams)) {
            fail(
                "efwGrams",
                "must preserve the unrounded result for the supplied Imoancy Hadlock biometrics"
            );
        }

        if (
            options.efwSource === "imoancy_hadlock_hc_ac_fl" &&
            hasOwn(options, "efwMethod") &&
            options.efwMethod !== observation.method
        ) {
            fail("efwMethod", "does not match the Imoancy Hadlock observation");
        }

        return {
            source: options.efwSource,
            method: options.efwSource === "report_entered" && !explicitMethod ?
                "unknown" : observation.method
        };
    }

    function normalizeReferenceSnapshot(options) {
        var referenceId = hasOwn(options, "referenceId") ? options.referenceId : null;
        var referenceVersion = hasOwn(options, "referenceVersion") ?
            options.referenceVersion : null;
        var zScore = hasOwn(options, "zScore") ? options.zScore : null;
        var percentile = hasOwn(options, "percentile") ? options.percentile : null;

        if (referenceId !== null && !isNonEmptyString(referenceId)) {
            fail("referenceId", "must be null or a non-empty string");
        }

        if (referenceVersion !== null && !isNonEmptyString(referenceVersion)) {
            fail("referenceVersion", "must be null or a non-empty string");
        }

        if ((referenceId === null) !== (referenceVersion === null)) {
            fail("reference", "id and version must be present together");
        }

        if (zScore !== null && !isFiniteNumber(zScore)) {
            fail("zScore", "must be null or a finite number");
        }

        if (
            percentile !== null &&
            (!isFiniteNumber(percentile) || percentile < 0 || percentile > 100)
        ) {
            fail("percentile", "must be null or a finite number from 0 through 100");
        }

        if (referenceId === null && (zScore !== null || percentile !== null)) {
            fail("reference", "must identify the reference for a Z-score or percentile");
        }

        return {
            referenceId: referenceId,
            referenceVersion: referenceVersion,
            zScore: zScore,
            percentile: percentile
        };
    }

    function verifyReferenceSnapshot(options, gestationalAge, observation, reference) {
        var hasZScore = reference.zScore !== null;
        var hasPercentile = reference.percentile !== null;
        var position;

        if (hasZScore !== hasPercentile) {
            fail("reference", "Z-score and percentile must be present together");
        }

        if (reference.referenceId === null) {
            return;
        }

        if (
            reference.referenceId !== scienceConfig.reference.id ||
            reference.referenceVersion !== scienceConfig.reference.version
        ) {
            if (hasZScore || hasPercentile) {
                fail(
                    "reference",
                    "numeric position from an external reference cannot be verified by this science version"
                );
            }
            return;
        }

        if (!hasZScore) {
            return;
        }

        position = science.positionEfwInReference({
            pregnancyPopulation: scienceConfig.populationScope.supportedPopulation,
            gestationalAge: {
                weeks: gestationalAge.weeks,
                days: gestationalAge.days
            },
            efwObservation: {
                efwGrams: options.efwGrams,
                source: observation.source,
                method: observation.method
            }
        });

        if (!isRecord(position) || position.status !== "valid") {
            fail("reference", "numeric position is unavailable for this observation");
        }

        if (Math.abs(position.zScore - reference.zScore) > 1e-9 ||
            Math.abs(position.percentile - reference.percentile) > 1e-6) {
            fail("reference", "Z-score or percentile does not match the scientific engine");
        }
    }

    /**
     * Creates one immutable, storage-agnostic ultrasound record. recordId,
     * createdAt and scanDate (when used) come exclusively from the caller.
     */
    function buildFetalPassportEntry(options) {
        var gestationalAge;
        var biometrics;
        var observation;
        var reference;

        ensureBuilderInput(options);
        gestationalAge = normalizeGestationalAge(options);
        biometrics = normalizeBiometrics(
            hasOwn(options, "biometrics") ? options.biometrics : undefined,
            options.efwSource === "imoancy_hadlock_hc_ac_fl"
        );
        observation = normalizeEfwObservation(options, biometrics);
        reference = normalizeReferenceSnapshot(options);
        verifyReferenceSnapshot(options, gestationalAge, observation, reference);

        return deepFreeze({
            schemaVersion: scienceConfig.schemaVersions.fetalPassportEntry,
            scienceVersion: scienceConfig.scienceVersion,
            referenceId: reference.referenceId,
            referenceVersion: reference.referenceVersion,
            recordId: options.recordId,
            scanDate: normalizeOptionalScanDate(options),
            gestationalAgeWeeks: gestationalAge.weeks,
            gestationalAgeDays: gestationalAge.days,
            efwGrams: options.efwGrams,
            efwSource: observation.source,
            efwMethod: observation.method,
            biometrics: biometrics,
            zScore: reference.zScore,
            percentile: reference.percentile,
            createdAt: options.createdAt
        });
    }

    function validateStoredEntry(entry, label) {
        var ageResult;
        var biometrics;
        var hadlockResult;
        var reference;

        if (!hasExactKeys(entry, ENTRY_KEYS)) {
            fail(label, "does not match the versioned fetal Passport contract");
        }

        if (!isNonEmptyString(entry.schemaVersion) || !isNonEmptyString(entry.scienceVersion)) {
            fail(label, "has invalid version metadata");
        }

        if (!isNonEmptyString(entry.recordId) || !isNonEmptyString(entry.createdAt)) {
            fail(label, "has invalid caller-provided metadata");
        }

        if (entry.scanDate !== null && !parseIsoDate(entry.scanDate)) {
            fail(label, "has an invalid scanDate");
        }

        ageResult = science.normalizeGestationalAge({
            weeks: entry.gestationalAgeWeeks,
            days: entry.gestationalAgeDays
        });

        if (!isRecord(ageResult) || ageResult.status !== "valid") {
            fail(label, "has an invalid gestational age");
        }

        if (!isPositiveFiniteNumber(entry.efwGrams)) {
            fail(label, "has an invalid EFW");
        }

        if (
            entry.efwSource !== "imoancy_hadlock_hc_ac_fl" &&
            entry.efwSource !== "report_entered"
        ) {
            fail(label, "has an invalid EFW source");
        }

        if (!isNonEmptyString(entry.efwMethod)) {
            fail(label, "has an invalid EFW method");
        }

        biometrics = normalizeBiometrics(
            entry.biometrics,
            entry.efwSource === "imoancy_hadlock_hc_ac_fl"
        );

        if (entry.efwSource === "imoancy_hadlock_hc_ac_fl") {
            hadlockResult = science.calculateHadlockHcAcFl(biometrics);

            if (!isRecord(hadlockResult) || hadlockResult.status !== "valid" ||
                !isRecord(hadlockResult.estimate)) {
                fail(label, "has Hadlock biometrics that cannot reproduce its EFW");
            }

            if (entry.efwMethod !== hadlockResult.estimate.method) {
                fail(label, "has an EFW method inconsistent with its Imoancy Hadlock source");
            }

            if (!numbersPreserveSameBinary64Value(
                entry.efwGrams,
                hadlockResult.estimate.efwGrams
            )) {
                fail(label, "has an EFW inconsistent with its Imoancy Hadlock biometrics");
            }
        }

        reference = normalizeReferenceSnapshot(entry);
        verifyReferenceSnapshot(entry, ageResult.gestationalAge, {
            source: entry.efwSource,
            method: entry.efwMethod
        }, reference);
        return ageResult.gestationalAge;
    }

    function biometricAvailability(biometrics) {
        var count;

        if (biometrics === null) {
            return "none";
        }

        count = BIOMETRIC_KEYS.filter(function isAvailable(field) {
            return biometrics[field] !== null;
        }).length;

        return count === BIOMETRIC_KEYS.length ? "complete" : "partial";
    }

    function isUnknownMethod(method) {
        return !isNonEmptyString(method) || UNKNOWN_METHODS.indexOf(method) !== -1;
    }

    function referenceComparability(entryA, entryB) {
        if (
            entryA.referenceId === null ||
            entryA.referenceVersion === null ||
            entryB.referenceId === null ||
            entryB.referenceVersion === null
        ) {
            return "unknown_or_different";
        }

        return entryA.referenceId === entryB.referenceId &&
            entryA.referenceVersion === entryB.referenceVersion ? "same" : "different";
    }

    function methodComparability(entryA, entryB) {
        if (isUnknownMethod(entryA.efwMethod) || isUnknownMethod(entryB.efwMethod)) {
            return "unknown_or_different";
        }

        return entryA.efwMethod === entryB.efwMethod ? "same" : "different";
    }

    function buildUnknownData(entry, label, output) {
        if (entry.scanDate === null) {
            output.push(label + ".scanDate");
        }
        if (entry.referenceId === null || entry.referenceVersion === null) {
            output.push(label + ".reference");
        }
        if (entry.zScore === null) {
            output.push(label + ".zScore");
        }
        if (entry.percentile === null) {
            output.push(label + ".percentile");
        }
        if (isUnknownMethod(entry.efwMethod)) {
            output.push(label + ".efwMethod");
        }

        if (entry.biometrics === null) {
            output.push(label + ".biometrics");
        } else {
            BIOMETRIC_KEYS.forEach(function addMissingBiometric(field) {
                if (entry.biometrics[field] === null) {
                    output.push(label + ".biometrics." + field);
                }
            });
        }
    }

    function snapshotForComparison(entry, gestationalAge) {
        return {
            recordId: entry.recordId,
            schemaVersion: entry.schemaVersion,
            scienceVersion: entry.scienceVersion,
            scanDate: entry.scanDate,
            gestationalAge: {
                weeks: gestationalAge.weeks,
                days: gestationalAge.days,
                totalDays: gestationalAge.totalDays
            },
            efwGrams: entry.efwGrams,
            efwSource: entry.efwSource,
            efwMethod: entry.efwMethod,
            percentile: entry.percentile,
            referenceId: entry.referenceId,
            referenceVersion: entry.referenceVersion,
            biometricsAvailability: biometricAvailability(entry.biometrics)
        };
    }

    /**
     * Returns mathematical differences only. It does not infer growth quality,
     * clinical meaning, future weight, risk or a comparability score.
     */
    function compareFetalPassportEntries(entryA, entryB) {
        var gestationalAgeA = validateStoredEntry(entryA, "entryA");
        var gestationalAgeB = validateStoredEntry(entryB, "entryB");
        var referenceStatus = referenceComparability(entryA, entryB);
        var methodStatus = methodComparability(entryA, entryB);
        var scienceVersionStatus = entryA.scienceVersion === entryB.scienceVersion ?
            "same" : "different";
        var schemaVersionStatus = entryA.schemaVersion === entryB.schemaVersion ?
            "same" : "different";
        var intervalDays = null;
        var percentileDifference = null;
        var unknownData = [];
        var compatibilityIssues = [];

        if (entryA.scanDate !== null && entryB.scanDate !== null) {
            intervalDays = civilDateToSerialDay(parseIsoDate(entryB.scanDate)) -
                civilDateToSerialDay(parseIsoDate(entryA.scanDate));
        }

        if (
            referenceStatus === "same" &&
            scienceVersionStatus === "same" &&
            schemaVersionStatus === "same" &&
            isFiniteNumber(entryA.percentile) &&
            isFiniteNumber(entryB.percentile)
        ) {
            percentileDifference = entryB.percentile - entryA.percentile;
        }

        buildUnknownData(entryA, "recordA", unknownData);
        buildUnknownData(entryB, "recordB", unknownData);

        if (scienceVersionStatus === "different") {
            compatibilityIssues.push("different_science_versions");
        }
        if (schemaVersionStatus === "different") {
            compatibilityIssues.push("different_schema_versions");
        }

        return deepFreeze({
            scienceVersion: scienceConfig.scienceVersion,
            schemaVersion: scienceConfig.schemaVersions.fetalPassportEntry,
            comparisonType: "descriptive_only",
            recordA: snapshotForComparison(entryA, gestationalAgeA),
            recordB: snapshotForComparison(entryB, gestationalAgeB),
            scanIntervalDays: intervalDays,
            gestationalAgeDifferenceDays:
                gestationalAgeB.totalDays - gestationalAgeA.totalDays,
            efwDifferenceGrams: entryB.efwGrams - entryA.efwGrams,
            percentileDifference: percentileDifference,
            referenceComparability: referenceStatus,
            methodComparability: methodStatus,
            scienceVersionComparability: scienceVersionStatus,
            schemaVersionComparability: schemaVersionStatus,
            homogeneousComparisonAllowed:
                referenceStatus === "same" &&
                methodStatus === "same" &&
                scienceVersionStatus === "same" &&
                schemaVersionStatus === "same" &&
                unknownData.length === 0,
            unknownData: unknownData,
            compatibilityIssues: compatibilityIssues,
            semantics: {
                differencesAreMathematicalOnly: true,
                clinicalMeaningAttached: false,
                futureInferenceAttached: false
            }
        });
    }

    root.ImoancyFetalWeightRecords = Object.freeze({
        scienceVersion: scienceConfig.scienceVersion,
        schemaVersion: scienceConfig.schemaVersions.fetalPassportEntry,
        buildFetalPassportEntry: buildFetalPassportEntry,
        compareFetalPassportEntries: compareFetalPassportEntries
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
