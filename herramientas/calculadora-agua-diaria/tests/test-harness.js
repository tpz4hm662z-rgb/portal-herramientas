(function exposeWaterTestHarness(root) {
    "use strict";

    var passed = 0;
    var failures = [];

    function test(name, fn) {
        try {
            fn();
            passed += 1;
        } catch (error) {
            failures.push(name + ": " + error.message);
        }
    }

    function ok(value, message) {
        if (!value) {
            throw new Error(message || "assertion failed");
        }
    }

    function equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || (String(actual) + " !== " + String(expected)));
        }
    }

    function close(actual, expected, tolerance) {
        var allowed = typeof tolerance === "number" ? tolerance : 1e-12;

        if (!Number.isFinite(actual) || !Number.isFinite(expected) ||
            !Number.isFinite(allowed) || allowed < 0 ||
            Math.abs(actual - expected) > allowed) {
            throw new Error(String(actual) + " != " + String(expected));
        }
    }

    function deepEqual(actual, expected) {
        var actualJson = JSON.stringify(actual);
        var expectedJson = JSON.stringify(expected);

        if (actualJson !== expectedJson) {
            throw new Error(actualJson + " !== " + expectedJson);
        }
    }

    function includes(list, value) {
        ok(Array.isArray(list) && list.indexOf(value) >= 0, "missing " + String(value));
    }

    function result() {
        return {
            passed: passed,
            failed: failures.length,
            failures: failures.slice()
        };
    }

    root.ImoancyWaterTestHarness = Object.freeze({
        test: test,
        ok: ok,
        equal: equal,
        close: close,
        deepEqual: deepEqual,
        includes: includes,
        result: result
    });
}(globalThis));
