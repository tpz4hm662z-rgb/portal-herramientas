(function exposeFetalWeightTestHarness(root) {
    "use strict";

    var passed = 0;
    var failures = [];

    function describe(value) {
        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        try {
            return JSON.stringify(value);
        } catch (error) {
            return String(value);
        }
    }

    function test(name, fn) {
        try {
            fn();
            passed += 1;
        } catch (error) {
            failures.push(name + ": " + (error && error.message ? error.message : String(error)));
        }
    }

    function ok(value, message) {
        if (!value) {
            throw new Error(message || "assertion failed");
        }
    }

    function equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(
                message || (describe(actual) + " !== " + describe(expected))
            );
        }
    }

    function close(actual, expected, tolerance, message) {
        var allowed = tolerance === undefined ? 1e-12 : tolerance;

        if (typeof actual !== "number" || !Number.isFinite(actual)) {
            throw new Error(message || ("actual value is not finite: " + String(actual)));
        }
        if (typeof expected !== "number" || !Number.isFinite(expected)) {
            throw new Error(message || ("expected value is not finite: " + String(expected)));
        }
        if (typeof allowed !== "number" || !Number.isFinite(allowed) || allowed < 0) {
            throw new Error(message || ("tolerance is invalid: " + String(allowed)));
        }
        if (Math.abs(actual - expected) > allowed) {
            throw new Error(
                message || (
                    String(actual) + " != " + String(expected) +
                    " (tolerance " + String(allowed) + ")"
                )
            );
        }
    }

    function sameValue(actual, expected) {
        var actualKeys;
        var expectedKeys;

        if (actual === expected) {
            return true;
        }
        if (typeof actual === "number" && typeof expected === "number" &&
            Number.isNaN(actual) && Number.isNaN(expected)) {
            return true;
        }
        if (!actual || !expected || typeof actual !== "object" || typeof expected !== "object") {
            return false;
        }
        if (Array.isArray(actual) !== Array.isArray(expected)) {
            return false;
        }

        actualKeys = Object.keys(actual).sort();
        expectedKeys = Object.keys(expected).sort();

        if (actualKeys.length !== expectedKeys.length) {
            return false;
        }

        return actualKeys.every(function compareKey(key, index) {
            return key === expectedKeys[index] && sameValue(actual[key], expected[key]);
        });
    }

    function deepEqual(actual, expected, message) {
        if (!sameValue(actual, expected)) {
            throw new Error(
                message || (describe(actual) + " !== " + describe(expected))
            );
        }
    }

    function includes(list, value, message) {
        ok(
            Array.isArray(list) && list.indexOf(value) !== -1,
            message || ("missing " + describe(value))
        );
    }

    function throws(fn, expectedMessagePart, message) {
        var thrown = null;

        try {
            fn();
        } catch (error) {
            thrown = error;
        }

        if (!thrown) {
            throw new Error(message || "expected function to throw");
        }

        if (expectedMessagePart !== undefined &&
            String(thrown.message).indexOf(String(expectedMessagePart)) === -1) {
            throw new Error(
                message || (
                    "thrown message " + describe(String(thrown.message)) +
                    " does not include " + describe(String(expectedMessagePart))
                )
            );
        }

        return thrown;
    }

    function keys(value, expected, message) {
        deepEqual(Object.keys(value).sort(), expected.slice().sort(), message);
    }

    function isDeepFrozen(value) {
        if (!value || typeof value !== "object" || !Object.isFrozen(value)) {
            return false;
        }

        return Object.getOwnPropertyNames(value).every(function childIsFrozen(key) {
            return !value[key] || typeof value[key] !== "object" || isDeepFrozen(value[key]);
        });
    }

    function result() {
        return {
            passed: passed,
            failed: failures.length,
            total: passed + failures.length,
            failures: failures.slice()
        };
    }

    root.ImoancyFetalWeightTestHarness = Object.freeze({
        test: test,
        ok: ok,
        equal: equal,
        close: close,
        deepEqual: deepEqual,
        includes: includes,
        throws: throws,
        keys: keys,
        isDeepFrozen: isDeepFrozen,
        result: result
    });
}(globalThis));
