"use strict";

/* Casos nuevos de preproducción: expectativas derivadas de reglas, no copiadas de suites anteriores. */
(function (root) {
    const c = root.ImoancyIndemnizacionCore;
    let passed = 0;
    const failures = [];
    function test(name, fn) { try { fn(); passed += 1; } catch (e) { failures.push(name + ": " + e.message); } }
    function ok(value, message) { if (!value) throw new Error(message || "assertion failed"); }
    function eq(a, b) { if (a !== b) throw new Error(String(a) + " !== " + String(b)); }
    function close(a, b) { if (Math.abs(a - b) > Math.max(1, Math.abs(b)) * 1e-12) throw new Error(String(a) + " != " + String(b)); }
    function input(type, start, end, salary) { return { terminationType: type, servicePattern: c.SERVICE_PATTERN.CONTINUOUS, startDate: start, endDate: end, salary: salary || { type: c.SALARY_TYPE.ANNUAL, amount: 43800 } }; }
    function calc(type, start, end, salary) { const r = c.calculateIndemnity(input(type, start, end, salary)); eq(r.status, c.STATUS.OK); return r; }

    [["2026-01-30", "2026-01-31", 1], ["2026-01-30", "2026-02-01", 1], ["2024-02-28", "2024-02-29", 1], ["2024-02-28", "2024-03-01", 1], ["2025-01-31", "2025-02-28", 1], ["2025-02-28", "2025-03-31", 2], ["2024-02-29", "2025-02-28", 12], ["2024-02-29", "2025-03-01", 13]].forEach(function (x) {
        test("calendario nuevo " + x[0] + "→" + x[1], function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, x[0], x[1]); eq(r.result.period.serviceMonths, x[2]); close(r.result.rawIndemnityDays, x[2] * 33 / 12); });
    });

    [["2012-02-10", "2012-02-11", 1, 0], ["2012-02-10", "2012-02-12", 1, 1], ["2012-02-10", "2012-02-13", 1, 1], ["2012-02-11", "2012-02-14", 1, 1], ["2012-02-12", "2012-02-14", 0, 1], ["2012-02-13", "2012-02-14", 0, 1]].forEach(function (x) {
        test("corte adversarial " + x[0] + "→" + x[1], function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, x[0], x[1]); const pre = r.result.segments.find(function (s) { return s.code === "PRE_2012"; }); const post = r.result.segments.find(function (s) { return s.code === "POST_2012"; }); eq(pre ? pre.serviceMonths : 0, x[2]); eq(post ? post.serviceMonths : 0, x[3]); close(r.result.rawIndemnityDays, x[2] * 45 / 12 + x[3] * 33 / 12); if (pre && post) { eq(pre.endDate, "2012-02-11"); eq(post.startDate, "2012-02-12"); } });
    });

    test("719,75 no reduce", function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1997-04-12", "2013-08-12"); close(r.result.rawIndemnityDays, 719.75); ok(!r.result.capApplied); ok(r.warnings.indexOf(c.WARNING.CAP_APPLIED) < 0); });
    test("mínimo escalón sobre 720 reduce", function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1997-04-12", "2013-09-12"); close(r.result.rawIndemnityDays, 722.5); eq(r.result.indemnityDays, 720); ok(r.result.capApplied); });
    test("pre cercano a 800 se conserva y excluye post", function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1994-05-12", "2026-01-12"); close(r.result.segments[0].rawIndemnityDays, 798.75); close(r.result.indemnityDays, 798.75); eq(r.result.segments[1].allowedIndemnityDays, 0); });
    test("pre 1000 conserva 1001,25", function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1989-11-12", "2026-01-12"); close(r.result.segments[0].rawIndemnityDays, 1001.25); close(r.result.indemnityDays, 1001.25); });
    test("sobre 1260 reduce al absoluto", function () { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1980-01-12", "2012-02-11"); ok(r.result.rawIndemnityDays > 1260); eq(r.result.indemnityDays, 1260); ok(r.result.capApplied); });
    test("objetivo escalón inmediatamente inferior no se redondea a cap", function () { const salary = { type: c.SALARY_TYPE.DAILY, amount: 0.01 }; const r = calc(c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, "2006-01-01", "2023-11-30", salary); close(r.result.rawIndemnityDays, 358.3333333333333); ok(!r.result.capApplied); });
    test("objetivo sobre 360 reduce", function () { const r = calc(c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, "2005-11-01", "2023-12-01"); ok(r.result.rawIndemnityDays > 360); eq(r.result.indemnityDays, 360); ok(r.result.capApplied); });

    ["ANNUAL", "MONTHLY_PRORATED", "MONTHLY_PLUS_EXTRA_PAYMENTS", "DAILY"].forEach(function (kind) {
        test("equivalencia nueva " + kind, function () { const annual = 27123.48; let salary; if (kind === "ANNUAL") salary = { type: c.SALARY_TYPE.ANNUAL, amount: annual }; if (kind === "MONTHLY_PRORATED") salary = { type: c.SALARY_TYPE.MONTHLY_PRORATED, amount: annual / 12 }; if (kind === "MONTHLY_PLUS_EXTRA_PAYMENTS") salary = { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 2000, extraPayments: [1111.11, 777.77, 1234.60] }; if (kind === "DAILY") salary = { type: c.SALARY_TYPE.DAILY, amount: annual / 365 }; const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "2022-05-17", "2024-08-03", salary); close(r.result.salary.annualGross, annual); });
    });
    test("cien pagas cero no generan no finitos", function () { const r = calc(c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, "2023-01-01", "2024-01-02", { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 0.01, extraPayments: Array(100).fill(0) }); [r.result.salary.dailyGross, r.result.indemnityDays, r.result.grossIndemnity].forEach(function (n) { ok(Number.isFinite(n)); }); });
    test("temporal nunca contiene result", function () { const r = c.calculateIndemnity(input(c.TERMINATION_TYPE.TEMPORARY_CONTRACT_EXPIRY, "2020-01-01", "2026-01-01")); eq(r.status, c.STATUS.REQUIRES_SPECIAL_ANALYSIS); ok(!r.result); });
    test("tipo manipulado nunca contiene result", function () { const r = c.calculateIndemnity(input("__PROTO_POLLUTION__", "2020-01-01", "2026-01-01")); eq(r.status, c.STATUS.UNSUPPORTED_CASE); ok(!r.result); });
    test("colectivo avisa incluso sin cap", function () { const r = calc(c.TERMINATION_TYPE.COLLECTIVE_DISMISSAL_BASE, "2026-01-01", "2026-01-02"); ok(r.warnings.indexOf(c.WARNING.COLLECTIVE_MINIMUM_ONLY) >= 0); });
    test("todo resultado OK es serializable y finito", function () { [0.01, 999999999.99, 1e200].forEach(function (amount) { const r = calc(c.TERMINATION_TYPE.UNFAIR_DISMISSAL, "1960-01-01", "2026-08-13", { type: c.SALARY_TYPE.ANNUAL, amount: amount }); ok(JSON.stringify(r)); Object.keys(r.result).forEach(function (key) { if (typeof r.result[key] === "number") ok(Number.isFinite(r.result[key]), key); }); }); });

    root.ImoancyFinalAdversarialResult = { passed: passed, failed: failures.length, failures: failures };
}(typeof globalThis !== "undefined" ? globalThis : this));
