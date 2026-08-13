"use strict";

(function (root, factory) {
    const normativa = typeof module === "object" && module.exports
        ? require("./normativa-2026.js")
        : root.ImoancyIndemnizacionNormativa2026;
    const api = factory(normativa);
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.ImoancyIndemnizacionCore = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (NORMATIVA) {
    const STATUS = Object.freeze({
        OK: "OK",
        INVALID_INPUT: "INVALID_INPUT",
        UNSUPPORTED_CASE: "UNSUPPORTED_CASE",
        REQUIRES_SPECIAL_ANALYSIS: "REQUIRES_SPECIAL_ANALYSIS"
    });
    const TERMINATION_TYPE = Object.freeze({
        UNFAIR_DISMISSAL: "UNFAIR_DISMISSAL",
        OBJECTIVE_DISMISSAL: "OBJECTIVE_DISMISSAL",
        COLLECTIVE_DISMISSAL_BASE: "COLLECTIVE_DISMISSAL_BASE",
        TEMPORARY_CONTRACT_EXPIRY: "TEMPORARY_CONTRACT_EXPIRY",
        WORKER_INITIATED_INDEMNIFIED_TERMINATION: "WORKER_INITIATED_INDEMNIFIED_TERMINATION",
        GEOGRAPHICAL_MOBILITY: "GEOGRAPHICAL_MOBILITY",
        SUBSTANTIAL_CHANGE: "SUBSTANTIAL_CHANGE",
        NULL_DISMISSAL: "NULL_DISMISSAL"
    });
    const SALARY_TYPE = Object.freeze({
        ANNUAL: "ANNUAL",
        MONTHLY_PRORATED: "MONTHLY_PRORATED",
        MONTHLY_PLUS_EXTRA_PAYMENTS: "MONTHLY_PLUS_EXTRA_PAYMENTS",
        DAILY: "DAILY"
    });
    const SERVICE_PATTERN = Object.freeze({ CONTINUOUS: "CONTINUOUS", FIXED_DISCONTINUOUS: "FIXED_DISCONTINUOUS" });
    const WARNING = Object.freeze({
        CAP_APPLIED: "CAP_APPLIED",
        TRANSITIONAL_RULE_APPLIED: "TRANSITIONAL_RULE_APPLIED",
        POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP: "POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP",
        COLLECTIVE_MINIMUM_ONLY: "COLLECTIVE_MINIMUM_ONLY"
    });
    const MS_DAY = 86400000;

    function invalid(errors) {
        return { status: STATUS.INVALID_INPUT, errors: errors, warnings: [], result: null };
    }

    function parseDate(value, field, errors) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            errors.push({ field: field, code: "invalid_date", message: "Debe ser una fecha ISO YYYY-MM-DD válida." });
            return null;
        }
        const parts = value.split("-").map(Number);
        const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) {
            errors.push({ field: field, code: "invalid_date", message: "La fecha civil no existe." });
            return null;
        }
        return date;
    }

    // CGPJ: ambos días se computan; años/meses y cualquier fracción residual como un mes.
    function calculateServiceMonths(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)
                || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())
                || endDate < startDate) return null;
        let months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
            + endDate.getUTCMonth() - startDate.getUTCMonth();
        if (endDate.getUTCDate() >= startDate.getUTCDate()) months += 1;
        return months;
    }

    function normalizeSalary(salary) {
        const errors = [];
        if (!salary || typeof salary !== "object" || Array.isArray(salary)) {
            return { errors: [{ field: "salary", code: "missing", message: "Falta la estructura salarial." }] };
        }
        if (!Object.values(SALARY_TYPE).includes(salary.type)) errors.push({ field: "salary.type", code: "unsupported", message: "Modalidad salarial no soportada." });
        if (typeof salary.amount !== "number" || !Number.isFinite(salary.amount) || salary.amount <= 0) errors.push({ field: "salary.amount", code: "invalid_number", message: "El salario debe ser un número finito mayor que cero." });
        let extras = 0;
        if (salary.type === SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS) {
            if (!Array.isArray(salary.extraPayments)) errors.push({ field: "salary.extraPayments", code: "missing", message: "Debe indicar las pagas extraordinarias anuales." });
            else salary.extraPayments.forEach(function (amount, index) {
                if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) errors.push({ field: "salary.extraPayments[" + index + "]", code: "invalid_number", message: "Cada paga extra debe ser finita y no negativa." });
                else extras += amount;
            });
        } else if (Object.prototype.hasOwnProperty.call(salary, "extraPayments")) {
            errors.push({ field: "salary.extraPayments", code: "not_applicable", message: "Las pagas extra solo se admiten con MONTHLY_PLUS_EXTRA_PAYMENTS." });
        }
        if (errors.length) return { errors: errors };
        let annual;
        if (salary.type === SALARY_TYPE.ANNUAL) annual = salary.amount;
        else if (salary.type === SALARY_TYPE.DAILY) annual = salary.amount * NORMATIVA.salaryDaysPerYear;
        else if (salary.type === SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS) annual = salary.amount * 12 + extras;
        else annual = salary.amount * 12;
        const daily = annual / NORMATIVA.salaryDaysPerYear;
        if (!Number.isFinite(annual) || !Number.isFinite(daily) || daily === 0) return { errors: [{ field: "salary.amount", code: "numeric_range", message: "El salario queda fuera del rango calculable." }] };
        return { inputType: salary.type, annualGross: annual, monthlyProratedGross: annual / 12, dailyGross: daily, extraPaymentsAnnual: extras };
    }

    function classifyTermination(type) {
        const rule = NORMATIVA.rules[type];
        return rule ? { type: type, status: rule.status, legalBasis: rule.legalBasis || [], reason: rule.reason || null }
            : { type: type, status: "OUT_OF_SCOPE", legalBasis: [], reason: "Tipo de extinción desconocido." };
    }

    function baseResult(input, start, end, salary, months) {
        return {
            normativeVersion: NORMATIVA.id,
            terminationType: input.terminationType,
            period: { startDate: input.startDate, endDate: input.endDate, calendarDays: (end - start) / MS_DAY, serviceMonths: months },
            salary: salary,
            segments: [],
            rawIndemnityDays: 0,
            indemnityDays: 0,
            capDays: null,
            capApplied: false,
            grossIndemnity: 0
        };
    }

    function segment(code, startDate, endDate, months, rate) {
        return { code: code, startDate: startDate, endDate: endDate, serviceMonths: months, daysPerYear: rate, rawIndemnityDays: months * rate / 12, allowedIndemnityDays: 0 };
    }

    function calculateIndemnity(input) {
        if (!input || typeof input !== "object" || Array.isArray(input)) return invalid([{ field: "input", code: "missing", message: "Faltan los datos del cálculo." }]);
        const classification = classifyTermination(input.terminationType);
        if (classification.status !== "SUPPORTED") {
            return { status: classification.status === "REQUIRES_SPECIAL_ANALYSIS" ? STATUS.REQUIRES_SPECIAL_ANALYSIS : STATUS.UNSUPPORTED_CASE, errors: [], warnings: [], classification: classification, result: null };
        }
        if (input.servicePattern !== SERVICE_PATTERN.CONTINUOUS) {
            const message = input.servicePattern === SERVICE_PATTERN.FIXED_DISCONTINUOUS ? "El trabajo fijo-discontinuo exige periodos efectivos." : "Debe declarar el patrón de prestación continua.";
            return { status: STATUS.UNSUPPORTED_CASE, errors: [], warnings: [], classification: { type: input.servicePattern, status: "OUT_OF_SCOPE", reason: message }, result: null };
        }
        const errors = [];
        const start = parseDate(input.startDate, "startDate", errors);
        const end = parseDate(input.endDate, "endDate", errors);
        const salary = normalizeSalary(input.salary);
        if (salary.errors) errors.push.apply(errors, salary.errors);
        if (start && end && end <= start) errors.push({ field: "endDate", code: "not_after_start", message: "La fecha de extinción debe ser posterior al inicio." });
        if (errors.length) return invalid(errors);
        const totalMonths = calculateServiceMonths(start, end);
        const output = baseResult(input, start, end, salary, totalMonths);
        const warnings = [];

        if (input.terminationType === TERMINATION_TYPE.OBJECTIVE_DISMISSAL || input.terminationType === TERMINATION_TYPE.COLLECTIVE_DISMISSAL_BASE) {
            const rule = NORMATIVA.rules[input.terminationType];
            const item = segment("FULL_SERVICE", input.startDate, input.endDate, totalMonths, rule.daysPerYear);
            output.rawIndemnityDays = item.rawIndemnityDays;
            output.indemnityDays = Math.min(output.rawIndemnityDays, rule.capDays);
            item.allowedIndemnityDays = output.indemnityDays;
            output.segments.push(item);
            output.capDays = rule.capDays;
            if (input.terminationType === TERMINATION_TYPE.COLLECTIVE_DISMISSAL_BASE) warnings.push(WARNING.COLLECTIVE_MINIMUM_ONLY);
        } else {
            const rule = NORMATIVA.rules.UNFAIR_DISMISSAL;
            const transition = parseDate(NORMATIVA.transitionDate, "transitionDate", []);
            if (start >= transition) {
                const item = segment("POST_2012", input.startDate, input.endDate, totalMonths, rule.currentDaysPerYear);
                output.rawIndemnityDays = item.rawIndemnityDays;
                output.indemnityDays = Math.min(output.rawIndemnityDays, rule.ordinaryCapDays);
                item.allowedIndemnityDays = output.indemnityDays;
                output.segments.push(item);
                output.capDays = rule.ordinaryCapDays;
            } else {
                warnings.push(WARNING.TRANSITIONAL_RULE_APPLIED);
                const preEnd = end < transition ? end : new Date(transition.getTime() - MS_DAY);
                // Cada tramo prorratea su propia fracción mensual, como la herramienta CGPJ.
                const postMonths = end >= transition ? calculateServiceMonths(transition, end) : 0;
                const preMonths = calculateServiceMonths(start, preEnd);
                const pre = segment("PRE_2012", input.startDate, preEnd.toISOString().slice(0, 10), preMonths, rule.preTransitionDaysPerYear);
                output.segments.push(pre);
                let post = null;
                if (end >= transition) {
                    post = segment("POST_2012", NORMATIVA.transitionDate, input.endDate, postMonths, rule.currentDaysPerYear);
                    output.segments.push(post);
                }
                output.rawIndemnityDays = pre.rawIndemnityDays + (post ? post.rawIndemnityDays : 0);
                if (pre.rawIndemnityDays > rule.ordinaryCapDays) {
                    output.capDays = Math.min(pre.rawIndemnityDays, rule.transitionalAbsoluteCapDays);
                    output.indemnityDays = output.capDays;
                    pre.allowedIndemnityDays = output.indemnityDays;
                    if (post) {
                        post.allowedIndemnityDays = 0;
                        if (post.rawIndemnityDays > 0) warnings.push(WARNING.POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP);
                    }
                } else {
                    output.capDays = rule.ordinaryCapDays;
                    output.indemnityDays = Math.min(output.rawIndemnityDays, rule.ordinaryCapDays);
                    pre.allowedIndemnityDays = pre.rawIndemnityDays;
                    if (post) post.allowedIndemnityDays = Math.max(0, output.indemnityDays - pre.allowedIndemnityDays);
                }
            }
        }
        output.capApplied = output.rawIndemnityDays > output.indemnityDays;
        if (output.capApplied) warnings.push(WARNING.CAP_APPLIED);
        output.segments.forEach(function (item) { item.grossIndemnity = item.allowedIndemnityDays * salary.dailyGross; });
        output.grossIndemnity = output.indemnityDays * salary.dailyGross;
        if (!Number.isFinite(output.grossIndemnity)) return invalid([{ field: "salary.amount", code: "overflow", message: "El resultado excede el rango calculable." }]);
        return { status: STATUS.OK, errors: [], warnings: warnings, classification: classification, result: output };
    }

    return Object.freeze({ STATUS, TERMINATION_TYPE, SALARY_TYPE, SERVICE_PATTERN, WARNING, NORMATIVA, calculateServiceMonths, normalizeSalary, classifyTermination, calculateIndemnity });
}));
