"use strict";

(function (root) {
    const c = root.ImoancyIndemnizacionCore;
    let passed = 0;
    const failures = [];
    function test(name, fn) { try { fn(); passed += 1; } catch (error) { failures.push(name + ": " + error.message); } }
    function equal(a, b) { if (a !== b) throw new Error(String(a) + " !== " + String(b)); }
    function close(a, b, tolerance) { const scale = Math.max(1, Math.abs(b)); if (Math.abs(a - b) > (tolerance || 1e-12) * scale) throw new Error(String(a) + " != " + String(b)); }
    function ok(v) { if (!v) throw new Error("assertion failed"); }
    function base(changes) { const x = { terminationType: c.TERMINATION_TYPE.UNFAIR_DISMISSAL, servicePattern: c.SERVICE_PATTERN.CONTINUOUS, startDate: "2020-01-01", endDate: "2021-01-01", salary: { type: c.SALARY_TYPE.ANNUAL, amount: 36500 } }; Object.keys(changes || {}).forEach(function (k) { x[k] = changes[k]; }); return x; }
    function result(changes) { const r = c.calculateIndemnity(base(changes)); equal(r.status, c.STATUS.OK); return r; }
    function months(a, b) { return c.calculateServiceMonths(new Date(a + "T00:00:00Z"), new Date(b + "T00:00:00Z")); }

    [
        ["2024-01-01", "2024-01-31", 1], ["2024-01-01", "2024-02-01", 2],
        ["2024-01-31", "2024-02-01", 1], ["2023-02-28", "2023-03-01", 1],
        ["2024-02-29", "2024-03-01", 1], ["2024-03-31", "2024-04-30", 1],
        ["2024-04-30", "2024-05-31", 2], ["2024-01-01", "2024-01-01", 1],
        ["2024-01-01", "2024-01-02", 1], ["2024-01-01", "2024-02-02", 2],
        ["2023-01-01", "2024-01-01", 13], ["2023-01-01", "2024-01-02", 13],
        ["2020-02-29", "2024-02-29", 49]
    ].forEach(function (x) { test("meses civiles " + x[0] + "→" + x[1], function () { equal(months(x[0], x[1]), x[2]); }); });
    test("calculateServiceMonths controla Date inválido", function () { equal(c.calculateServiceMonths(new Date(NaN), new Date(Date.UTC(2024, 0, 1))), null); });
    test("calculateServiceMonths controla tipos incorrectos", function () { equal(c.calculateServiceMonths("2024-01-01", new Date(Date.UTC(2024, 0, 2))), null); });

    ["2012-02-10", "2012-02-11"].forEach(function (start) { test("inicio pre corte " + start, function () { const r = result({ startDate: start, endDate: "2012-02-14" }); equal(r.result.segments[0].code, "PRE_2012"); equal(r.result.segments[1].code, "POST_2012"); }); });
    ["2012-02-12", "2012-02-13", "2012-02-14"].forEach(function (start) { test("inicio post corte " + start, function () { const r = result({ startDate: start, endDate: "2012-03-14" }); equal(r.result.segments.length, 1); equal(r.result.segments[0].code, "POST_2012"); }); });
    [["2012-02-10", "2012-02-11"], ["2012-02-10", "2012-02-12"], ["2012-02-10", "2012-02-13"], ["2012-02-10", "2012-02-14"]].forEach(function (x) { test("extinción frontera " + x[1], function () { const r = result({ startDate: x[0], endDate: x[1] }); ok(r.result.segments.every(function (s) { return s.serviceMonths > 0; })); }); });
    test("transición puede redondear cada tramo sin doble día", function () { const r = result({ startDate: "2012-02-10", endDate: "2012-02-14" }); equal(r.result.period.calendarDays, 4); equal(r.result.segments[0].endDate, "2012-02-11"); equal(r.result.segments[1].startDate, "2012-02-12"); close(r.result.indemnityDays, 6.5); });

    test("719,75 queda sin cap", function () { const r = result({ startDate: "1997-04-12", endDate: "2013-08-12" }); close(r.result.indemnityDays, 719.75); equal(r.result.capApplied, false); equal(r.warnings.indexOf(c.WARNING.CAP_APPLIED), -1); });
    test("722,5 topa en 720", function () { const r = result({ startDate: "1997-04-12", endDate: "2013-09-12" }); close(r.result.rawIndemnityDays, 722.5); equal(r.result.indemnityDays, 720); equal(r.result.capApplied, true); });
    test("720 exactos sin CAP_APPLIED", function () { const r = result({ startDate: "1996-02-12", endDate: "2012-02-11" }); close(r.result.rawIndemnityDays, 720); equal(r.result.capApplied, false); });
    test("pre superior a 720 excluye post", function () { const r = result({ startDate: "1996-01-12", endDate: "2013-01-12" }); ok(r.result.segments[0].rawIndemnityDays > 720); equal(r.result.segments[1].allowedIndemnityDays, 0); ok(r.warnings.indexOf(c.WARNING.POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP) >= 0); });
    test("sin tramo post no advierte exclusión post", function () { const r = result({ startDate: "1980-01-01", endDate: "2012-02-11" }); equal(r.warnings.indexOf(c.WARNING.POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP), -1); });
    test("1260 exactos sin cap técnico", function () { const r = result({ startDate: "1984-02-12", endDate: "2012-02-11" }); close(r.result.rawIndemnityDays, 1260); equal(r.result.capApplied, false); });
    test("sobre 1260 nunca devuelve más", function () { const r = result({ startDate: "1970-01-01", endDate: "2020-01-01" }); equal(r.result.indemnityDays, 1260); ok(r.result.segments[0].allowedIndemnityDays <= 1260); });

    test("objetivo 358,333 sin tope", function () { const r = result({ terminationType: c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, startDate: "2006-01-01", endDate: "2023-11-30" }); close(r.result.rawIndemnityDays, 358.3333333333333); equal(r.result.capApplied, false); });
    test("objetivo 360 exacto sin CAP_APPLIED", function () { const r = result({ terminationType: c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, startDate: "2006-01-01", endDate: "2023-12-31" }); close(r.result.rawIndemnityDays, 360); equal(r.result.capApplied, false); });
    test("objetivo sobre 360 topa", function () { const r = result({ terminationType: c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, startDate: "2006-01-01", endDate: "2024-01-01" }); ok(r.result.rawIndemnityDays > 360); equal(r.result.indemnityDays, 360); equal(r.result.capApplied, true); });
    test("colectivo siempre advierte mínimo", function () { ["2020-01-02", "2050-01-01"].forEach(function (end) { const r = result({ terminationType: c.TERMINATION_TYPE.COLLECTIVE_DISMISSAL_BASE, startDate: "2020-01-01", endDate: end }); ok(r.warnings.indexOf(c.WARNING.COLLECTIVE_MINIMUM_ONLY) >= 0); }); });

    [1, 100, 1000, 12000, 28000, 50000, 100000, 35500.75].forEach(function (annual) { test("anual/365 sin redondeo " + annual, function () { close(c.normalizeSalary({ type: c.SALARY_TYPE.ANNUAL, amount: annual }).dailyGross, annual / 365, 1e-15); }); });
    [12000, 18000, 28000, 35500.75, 60000, 100000].forEach(function (annual) { test("equivalencia salarial " + annual, function () { const variants = [
        { type: c.SALARY_TYPE.ANNUAL, amount: annual },
        { type: c.SALARY_TYPE.MONTHLY_PRORATED, amount: annual / 12 },
        { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: annual / 12, extraPayments: [] },
        { type: c.SALARY_TYPE.DAILY, amount: annual / 365 }
    ]; const values = variants.map(function (salary) { return result({ salary: salary }).result.grossIndemnity; }); values.forEach(function (value) { close(value, values[0], 2e-15); }); }); });
    test("extras variadas y céntimos", function () { const s = c.normalizeSalary({ type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000.25, extraPayments: [0, 750.10, 1200.35] }); close(s.annualGross, 13953.45); });
    [null, undefined, "", "100", NaN, Infinity, -Infinity, -1, {}].forEach(function (extra) { test("extra hostil " + String(extra), function () { const s = c.normalizeSalary({ type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000, extraPayments: [extra] }); ok(s.errors); }); });
    test("array extras vacío es válido", function () { equal(c.normalizeSalary({ type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000, extraPayments: [] }).annualGross, 12000); });
    test("daily equivalente a annual", function () { const a = result({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: 35500.75 } }); const d = result({ salary: { type: c.SALARY_TYPE.DAILY, amount: 35500.75 / 365 } }); close(a.result.grossIndemnity, d.result.grossIndemnity, 2e-15); });

    [undefined, null, "", " ", "0", "1000", 0, -0, NaN, Infinity, -Infinity, {}, [], true, false].forEach(function (amount) { test("amount hostil " + String(amount), function () { ok(c.normalizeSalary({ type: c.SALARY_TYPE.ANNUAL, amount: amount }).errors); }); });
    ["2026-02-29", "2026-13-01", "01/01/2020", "2020-1-1", "2020-01-01T00:00:00Z", "not-a-date"].forEach(function (date) { test("fecha hostil " + date, function () { equal(c.calculateIndemnity(base({ startDate: date })).status, c.STATUS.INVALID_INPUT); }); });
    test("fecha bisiesta válida", function () { equal(result({ startDate: "2024-02-29", endDate: "2024-03-01" }).result.period.serviceMonths, 1); });

    test("ningún OK contiene número no finito", function () { [1, 1e100, 1e300].forEach(function (annual) { const r = result({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: annual } }); [r.result.salary.annualGross, r.result.salary.dailyGross, r.result.rawIndemnityDays, r.result.indemnityDays, r.result.grossIndemnity].concat(r.result.segments.reduce(function (a, s) { return a.concat([s.rawIndemnityDays, s.allowedIndemnityDays, s.grossIndemnity]); }, [])).forEach(function (n) { ok(Number.isFinite(n)); }); }); });
    test("entrada profundamente congelada", function () { const x = base({ salary: { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000, extraPayments: Object.freeze([1000, 500]) } }); Object.freeze(x.salary); Object.freeze(x); equal(c.calculateIndemnity(x).status, c.STATUS.OK); });
    test("determinismo y resultados sin estado compartido", function () { const x = base({}); const a = c.calculateIndemnity(x); const b = c.calculateIndemnity(x); equal(JSON.stringify(a), JSON.stringify(b)); a.warnings.push("FOREIGN"); equal(b.warnings.indexOf("FOREIGN"), -1); });
    test("classifyTermination determinista", function () { equal(JSON.stringify(c.classifyTermination(c.TERMINATION_TYPE.UNFAIR_DISMISSAL)), JSON.stringify(c.classifyTermination(c.TERMINATION_TYPE.UNFAIR_DISMISSAL))); });
    test("temporal nunca calcula", function () { equal(c.calculateIndemnity(base({ terminationType: c.TERMINATION_TYPE.TEMPORARY_CONTRACT_EXPIRY })).status, c.STATUS.REQUIRES_SPECIAL_ANALYSIS); });
    [c.TERMINATION_TYPE.NULL_DISMISSAL, c.TERMINATION_TYPE.GEOGRAPHICAL_MOBILITY, c.TERMINATION_TYPE.SUBSTANTIAL_CHANGE, "SPECIAL_RELATIONSHIP", "INVENTED"].forEach(function (type) { test("fuera de alcance " + type, function () { equal(c.calculateIndemnity(base({ terminationType: type })).status, c.STATUS.UNSUPPORTED_CASE); }); });

    root.ImoancyIndemnizacionFreezeAuditResult = { passed: passed, failed: failures.length, failures: failures };
}(typeof globalThis !== "undefined" ? globalThis : this));
