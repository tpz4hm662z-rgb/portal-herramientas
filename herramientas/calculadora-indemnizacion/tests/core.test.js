"use strict";

(function (root) {
    const c = root.ImoancyIndemnizacionCore;
    let passed = 0;
    const failures = [];
    function test(name, fn) { try { fn(); passed += 1; } catch (error) { failures.push(name + ": " + error.message); } }
    function equal(actual, expected) { if (actual !== expected) throw new Error(String(actual) + " !== " + String(expected)); }
    function close(actual, expected, tolerance) { if (Math.abs(actual - expected) > (tolerance || 1e-9)) throw new Error(String(actual) + " != " + String(expected)); }
    function ok(value) { if (!value) throw new Error("assertion failed"); }
    function base(changes) {
        const value = { terminationType: c.TERMINATION_TYPE.UNFAIR_DISMISSAL, servicePattern: c.SERVICE_PATTERN.CONTINUOUS, startDate: "2020-01-01", endDate: "2021-01-01", salary: { type: c.SALARY_TYPE.ANNUAL, amount: 36500 } };
        Object.keys(changes || {}).forEach(function (key) { value[key] = changes[key]; });
        return value;
    }

    test("improcedente post-2012: ambos días y 33 días por año", function () { const r = c.calculateIndemnity(base()); equal(r.status, c.STATUS.OK); close(r.result.indemnityDays, 35.75); close(r.result.grossIndemnity, 3575); });
    test("un día se prorratea como un mes", function () { const r = c.calculateIndemnity(base({ startDate: "2024-01-01", endDate: "2024-01-02" })); equal(r.result.period.serviceMonths, 1); close(r.result.indemnityDays, 2.75); });
    test("once meses exactos inclusivos computan doce", function () { equal(c.calculateIndemnity(base({ startDate: "2023-01-15", endDate: "2023-12-15" })).result.period.serviceMonths, 12); });
    test("un año más un día computa trece meses", function () { equal(c.calculateIndemnity(base({ startDate: "2023-01-15", endDate: "2024-01-16" })).result.period.serviceMonths, 13); });
    test("aniversario exacto añade mes por cómputo inclusivo CGPJ", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2023, 0, 15)), new Date(Date.UTC(2024, 0, 15))), 13); });
    test("fracción residual añade mes", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2023, 0, 15)), new Date(Date.UTC(2024, 0, 16))), 13); });
    test("fin de mes se calcula en calendario UTC", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2024, 0, 31)), new Date(Date.UTC(2024, 2, 1))), 2); });
    test("31 de marzo a 30 de abril es un mes según CGPJ", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2024, 2, 31)), new Date(Date.UTC(2024, 3, 30))), 1); });
    test("30 de abril a 31 de mayo son dos meses inclusivos", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2024, 3, 30)), new Date(Date.UTC(2024, 4, 31))), 2); });
    test("bisiesto conserva el cómputo mensual inclusivo", function () { equal(c.calculateServiceMonths(new Date(Date.UTC(2024, 1, 1)), new Date(Date.UTC(2024, 2, 1))), 2); });
    test("tope improcedente ordinario 720", function () { const r = c.calculateIndemnity(base({ startDate: "2013-01-01", endDate: "2040-01-01" })); equal(r.result.indemnityDays, 720); ok(r.result.capApplied); });
    test("objetivo 20 días por año", function () { const r = c.calculateIndemnity(base({ terminationType: c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL })); close(r.result.indemnityDays, 65 / 3); close(r.result.grossIndemnity, 6500 / 3); });
    test("objetivo topa en 360 días", function () { const r = c.calculateIndemnity(base({ terminationType: c.TERMINATION_TYPE.OBJECTIVE_DISMISSAL, startDate: "2000-01-01", endDate: "2025-01-01" })); equal(r.result.indemnityDays, 360); });
    test("colectivo usa solo mínimo legal y advierte", function () { const r = c.calculateIndemnity(base({ terminationType: c.TERMINATION_TYPE.COLLECTIVE_DISMISSAL_BASE })); close(r.result.indemnityDays, 65 / 3); ok(r.warnings.indexOf(c.WARNING.COLLECTIVE_MINIMUM_ONLY) >= 0); });
    test("transición separa 45 y 33 sin duplicar corte", function () { const r = c.calculateIndemnity(base({ startDate: "2011-02-12", endDate: "2013-02-12" })); equal(r.result.segments.length, 2); close(r.result.segments[0].rawIndemnityDays, 45); close(r.result.segments[1].rawIndemnityDays, 35.75); close(r.result.indemnityDays, 80.75); });
    test("inicio 11-02-2012 conserva un mes pre", function () { const r = c.calculateIndemnity(base({ startDate: "2012-02-11", endDate: "2012-03-12" })); equal(r.result.segments[0].serviceMonths, 1); equal(r.result.segments[1].serviceMonths, 2); close(r.result.indemnityDays, 9.25); });
    test("inicio 12-02-2012 es íntegramente post", function () { const r = c.calculateIndemnity(base({ startDate: "2012-02-12", endDate: "2012-03-12" })); equal(r.result.segments.length, 1); equal(r.result.segments[0].code, "POST_2012"); });
    test("inicio 13-02-2012 es íntegramente post", function () { const r = c.calculateIndemnity(base({ startDate: "2012-02-13", endDate: "2012-03-13" })); equal(r.result.segments.length, 1); });
    test("extinción en el corte asigna ese día al tramo post", function () { const r = c.calculateIndemnity(base({ startDate: "2011-02-12", endDate: "2012-02-12" })); equal(r.result.segments.length, 2); equal(r.result.segments[0].serviceMonths, 12); equal(r.result.segments[1].serviceMonths, 1); close(r.result.indemnityDays, 47.75); });
    test("extinción un día antes del corte", function () { const r = c.calculateIndemnity(base({ startDate: "2011-02-12", endDate: "2012-02-11" })); equal(r.result.segments.length, 1); equal(r.result.segments[0].serviceMonths, 12); });
    test("extinción un día después del corte prorratea ambos tramos", function () { const r = c.calculateIndemnity(base({ startDate: "2011-02-12", endDate: "2012-02-13" })); equal(r.result.segments[0].serviceMonths, 12); equal(r.result.segments[1].serviceMonths, 1); });
    test("pre-2012 mayor de 720 congela el post", function () { const r = c.calculateIndemnity(base({ startDate: "1992-02-12", endDate: "2020-02-12" })); close(r.result.segments[0].rawIndemnityDays, 900); equal(r.result.segments[1].allowedIndemnityDays, 0); close(r.result.indemnityDays, 900); ok(r.warnings.indexOf(c.WARNING.POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP) >= 0); });
    test("tope transitorio absoluto 1260", function () { const r = c.calculateIndemnity(base({ startDate: "1970-01-01", endDate: "2020-01-01" })); equal(r.result.indemnityDays, 1260); ok(r.result.capApplied); });
    test("pre exactamente 720 deja post sin incrementar", function () { const r = c.calculateIndemnity(base({ startDate: "1996-02-12", endDate: "2013-02-12" })); close(r.result.segments[0].rawIndemnityDays, 720); close(r.result.indemnityDays, 720); equal(r.result.segments[1].allowedIndemnityDays, 0); });
    test("pre inferior a 720 admite post hasta 720", function () { const r = c.calculateIndemnity(base({ startDate: "1997-02-12", endDate: "2030-02-12" })); close(r.result.segments[0].rawIndemnityDays, 675); close(r.result.indemnityDays, 720); close(r.result.segments[1].allowedIndemnityDays, 45); });
    test("frontera 719,75 no activa tope", function () { const r = c.calculateIndemnity(base({ startDate: "1997-04-12", endDate: "2013-08-12" })); close(r.result.rawIndemnityDays, 719.75); ok(!r.result.capApplied); });
    test("primer escalón sobre 720 activa tope", function () { const r = c.calculateIndemnity(base({ startDate: "1997-04-12", endDate: "2013-09-12" })); ok(r.result.rawIndemnityDays > 720); equal(r.result.indemnityDays, 720); ok(r.result.capApplied); });
    test("42 mensualidades exactas", function () { const r = c.calculateIndemnity(base({ startDate: "1984-02-12", endDate: "2012-02-11" })); close(r.result.rawIndemnityDays, 1260); close(r.result.indemnityDays, 1260); });
    test("salario anual", function () { close(c.normalizeSalary({ type: c.SALARY_TYPE.ANNUAL, amount: 36500 }).dailyGross, 100); });
    test("salario mensual con extras prorrateadas", function () { close(c.normalizeSalary({ type: c.SALARY_TYPE.MONTHLY_PRORATED, amount: 1400 }).annualGross, 16800); });
    test("salario mensual y pagas extra explícitas", function () { const s = c.normalizeSalary({ type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1200, extraPayments: [1200, 1200] }); close(s.annualGross, 16800); close(s.monthlyProratedGross, 1400); });
    test("salario diario no se reconvierte incorrectamente", function () { close(c.normalizeSalary({ type: c.SALARY_TYPE.DAILY, amount: 100 }).dailyGross, 100); });
    test("temporal exige análisis especial", function () { equal(c.calculateIndemnity(base({ terminationType: c.TERMINATION_TYPE.TEMPORARY_CONTRACT_EXPIRY })).status, c.STATUS.REQUIRES_SPECIAL_ANALYSIS); });
    test("fijo-discontinuo queda fuera", function () { equal(c.calculateIndemnity(base({ servicePattern: c.SERVICE_PATTERN.FIXED_DISCONTINUOUS })).status, c.STATUS.UNSUPPORTED_CASE); });
    test("tipo desconocido queda fuera", function () { equal(c.calculateIndemnity(base({ terminationType: "ALIEN" })).status, c.STATUS.UNSUPPORTED_CASE); });
    test("input undefined, null y array se rechaza", function () { [undefined, null, []].forEach(function (value) { equal(c.calculateIndemnity(value).status, c.STATUS.INVALID_INPUT); }); });
    ["", null, NaN, Infinity, -1, 0].forEach(function (amount) { test("salario inválido " + String(amount), function () { equal(c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: amount } })).status, c.STATUS.INVALID_INPUT); }); });
    ["2024-02-30", "2024-2-01", "01/02/2024", "2024-01-01T00:00:00Z"].forEach(function (date) { test("fecha inválida " + date, function () { equal(c.calculateIndemnity(base({ startDate: date })).status, c.STATUS.INVALID_INPUT); }); });
    test("fecha igual se rechaza", function () { equal(c.calculateIndemnity(base({ endDate: "2020-01-01" })).status, c.STATUS.INVALID_INPUT); });
    test("fecha anterior se rechaza", function () { equal(c.calculateIndemnity(base({ endDate: "2019-01-01" })).status, c.STATUS.INVALID_INPUT); });
    test("pagas extra negativas se rechazan", function () { equal(c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000, extraPayments: [1000, -1] } })).status, c.STATUS.INVALID_INPUT); });
    test("pagas extra no se aceptan con salario anual", function () { equal(c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: 12000, extraPayments: [1000] } })).status, c.STATUS.INVALID_INPUT); });
    test("no muta la entrada", function () { const input = base({ salary: { type: c.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: 1000, extraPayments: [1000, 1000] } }); const before = JSON.stringify(input); c.calculateIndemnity(input); equal(JSON.stringify(input), before); });
    test("normativa está congelada", function () { ok(Object.isFrozen(c.NORMATIVA)); ok(Object.isFrozen(c.NORMATIVA.rules.UNFAIR_DISMISSAL)); });
    test("resultado finito en valor grande calculable", function () { const r = c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: 1e300 } })); equal(r.status, c.STATUS.OK); ok(Number.isFinite(r.result.grossIndemnity)); });
    test("overflow se convierte en error", function () { equal(c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.DAILY, amount: Number.MAX_VALUE } })).status, c.STATUS.INVALID_INPUT); });
    test("subnormal que infradesborda se rechaza", function () { equal(c.calculateIndemnity(base({ salary: { type: c.SALARY_TYPE.ANNUAL, amount: Number.MIN_VALUE } })).status, c.STATUS.INVALID_INPUT); });
    test("importe de tramos suma el resultado", function () { const r = c.calculateIndemnity(base({ startDate: "2011-02-12", endDate: "2013-02-12" })); close(r.result.segments.reduce(function (sum, item) { return sum + item.grossIndemnity; }, 0), r.result.grossIndemnity); });

    root.ImoancyIndemnizacionTestResult = { passed: passed, failed: failures.length, failures: failures };
}(typeof globalThis !== "undefined" ? globalThis : this));
