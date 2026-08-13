/* Rentabilidad de Inversiones PRO v1.0 - Fase 1. Motor financiero puro. */
(function (root, factory) {
    "use strict";
    const config = typeof module === "object" && module.exports
        ? require("./config.js")
        : root.CONFIG;
    const engine = factory(config);
    if (typeof module === "object" && module.exports) module.exports = engine;
    if (root) root.InvestmentReturnEngine = engine;
}(typeof globalThis !== "undefined" ? globalThis : this, function (config) {
    "use strict";

    const M = config.matematicas;
    const STATUS = Object.freeze({ GAIN: "GAIN", LOSS: "LOSS", BREAK_EVEN: "BREAK_EVEN", INVALID_INPUT: "INVALID_INPUT" });
    const XIRR_STATUS = Object.freeze({ OK: "XIRR_OK", NOT_FOUND: "XIRR_NOT_FOUND", MULTIPLE: "MULTIPLE_XIRR", NOT_APPLICABLE: "XIRR_NOT_APPLICABLE" });
    const WARNING = Object.freeze({ VERY_SHORT_PERIOD: "VERY_SHORT_PERIOD" });
    const finite = value => typeof value === "number" && Number.isFinite(value);
    const issue = (field, code) => Object.freeze({ field, code });
    const invalid = errors => Object.freeze({ status: STATUS.INVALID_INPUT, errors: Object.freeze(errors) });

    function utcDay(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        const [year, month, day] = value.split("-").map(Number);
        const time = Date.UTC(year, month - 1, day);
        const date = new Date(time);
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null;
    }

    function normalizeCashFlows(cashFlows) {
        if (!Array.isArray(cashFlows) || cashFlows.length < 2) return { errors: [issue("cashFlows", "insufficient_flows")] };
        const errors = [];
        const normalized = cashFlows.map((flow, index) => {
            if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
                errors.push(issue(`cashFlows[${index}]`, "invalid_flow")); return null;
            }
            const time = utcDay(flow.date);
            if (time === null) errors.push(issue(`cashFlows[${index}].date`, "invalid_date"));
            if (!finite(flow.amount)) errors.push(issue(`cashFlows[${index}].amount`, flow.amount === undefined || flow.amount === null || flow.amount === "" ? "missing" : "not_finite"));
            return time === null || !finite(flow.amount) ? null : { date: flow.date, time, amount: flow.amount };
        });
        if (errors.length) return { errors };
        normalized.sort((a, b) => a.time - b.time);
        const combined = [];
        normalized.forEach(flow => {
            const last = combined[combined.length - 1];
            if (last && last.time === flow.time) last.amount += flow.amount;
            else combined.push({ date: flow.date, time: flow.time, amount: flow.amount });
        });
        if (combined.length < 2 || combined[0].time === combined[combined.length - 1].time) return { errors: [issue("cashFlows", "dates_must_span_time")] };
        if (combined.some(flow => !finite(flow.amount))) return { errors: [issue("cashFlows", "combined_amount_not_finite")] };
        return { cashFlows: combined };
    }

    function xnpvNormalized(rate, flows) {
        if (!finite(rate) || rate <= -1) return null;
        const logBase = Math.log1p(rate);
        const first = flows[0].time;
        let sum = 0;
        for (const flow of flows) {
            const years = (flow.time - first) / M.milisegundosPorDia / M.diasPorAno;
            const term = flow.amount * Math.exp(-years * logBase);
            if (!finite(term)) return null;
            sum += term;
            if (!finite(sum)) return null;
        }
        return sum;
    }

    function xnpv(rate, cashFlows) {
        const normalized = normalizeCashFlows(cashFlows);
        if (normalized.errors) return null;
        return xnpvNormalized(rate, normalized.cashFlows);
    }

    function scaleOf(flows) {
        // Saturar evita que la propia escala de tolerancia desborde a Infinity.
        return flows.reduce((sum, flow) => Math.min(Number.MAX_VALUE, sum + Math.abs(flow.amount)), 0);
    }
    function isRoot(value, scale) { return finite(value) && scale > 0 && Math.abs(value) <= M.toleranciaXirrValor * scale; }

    function bisect(flows, left, right, scale) {
        let fl = xnpvNormalized(left, flows), fr = xnpvNormalized(right, flows);
        if (isRoot(fl, scale)) return left;
        if (isRoot(fr, scale)) return right;
        if (!finite(fl) || !finite(fr) || Math.sign(fl) === Math.sign(fr)) return null;
        for (let i = 0; i < M.iteracionesBiseccionMaximas; i += 1) {
            const mid = Math.expm1((Math.log1p(left) + Math.log1p(right)) / 2);
            const fm = xnpvNormalized(mid, flows);
            if (!finite(fm)) return null;
            if (isRoot(fm, scale) || Math.abs(right - left) <= M.toleranciaXirrTasa * Math.max(1, Math.abs(mid))) return mid;
            if (Math.sign(fl) === Math.sign(fm)) { left = mid; fl = fm; } else { right = mid; fr = fm; }
        }
        return null;
    }

    function newton(flows, guess, scale) {
        let rate = guess;
        const first = flows[0].time;
        for (let i = 0; i < M.iteracionesNewtonMaximas; i += 1) {
            if (!finite(rate) || rate <= M.tasaXirrMinima || rate > M.tasaXirrMaxima) return null;
            const base = 1 + rate;
            let value = 0, derivative = 0;
            for (const flow of flows) {
                const years = (flow.time - first) / M.milisegundosPorDia / M.diasPorAno;
                const discounted = flow.amount * Math.pow(base, -years);
                value += discounted;
                derivative += -years * discounted / base;
            }
            if (!finite(value) || !finite(derivative) || derivative === 0) return null;
            const next = rate - value / derivative;
            if (!finite(next) || next <= M.tasaXirrMinima || next > M.tasaXirrMaxima) return null;
            if (Math.abs(next - rate) <= M.toleranciaXirrTasa * Math.max(1, Math.abs(next))) return isRoot(xnpvNormalized(next, flows), scale) ? next : null;
            rate = next;
        }
        return null;
    }

    function uniqueRoots(roots, flows) {
        const sorted = roots.filter(finite).sort((a, b) => a - b), groups = [];
        sorted.forEach(root => {
            const group = groups[groups.length - 1];
            if (!group || Math.abs(root - group[group.length - 1]) > M.toleranciaDeduplicacionRaices * Math.max(1, Math.abs(root))) groups.push([root]);
            else group.push(root);
        });
        return groups.map(group => group.reduce((best, root) => Math.abs(xnpvNormalized(root, flows)) < Math.abs(xnpvNormalized(best, flows)) ? root : best));
    }

    function calculateXirr(cashFlows) {
        const normalized = normalizeCashFlows(cashFlows);
        if (normalized.errors) return Object.freeze({ status: XIRR_STATUS.NOT_FOUND, xirr: null, roots: Object.freeze([]), errors: Object.freeze(normalized.errors) });
        const flows = normalized.cashFlows;
        if (!flows.some(flow => flow.amount < 0) || !flows.some(flow => flow.amount > 0)) {
            return Object.freeze({ status: XIRR_STATUS.NOT_FOUND, xirr: null, roots: Object.freeze([]), errors: Object.freeze([issue("cashFlows", "requires_positive_and_negative")]) });
        }
        const scale = scaleOf(flows), roots = [];
        M.semillasNewton.forEach(guess => roots.push(newton(flows, guess, scale)));
        const low = Math.log1p(M.tasaXirrMinima), high = Math.log1p(M.tasaXirrMaxima);
        let previousRate = M.tasaXirrMinima, previousValue = xnpvNormalized(previousRate, flows);
        for (let i = 1; i <= M.muestrasBusquedaXirr; i += 1) {
            const rate = Math.expm1(low + (high - low) * i / M.muestrasBusquedaXirr);
            const value = xnpvNormalized(rate, flows);
            if (finite(previousValue) && finite(value) && Math.sign(previousValue) !== Math.sign(value)) roots.push(bisect(flows, previousRate, rate, scale));
            previousRate = rate; previousValue = value;
        }
        const found = uniqueRoots(roots, flows).filter(root => isRoot(xnpvNormalized(root, flows), scale));
        if (found.length > 1) return Object.freeze({ status: XIRR_STATUS.MULTIPLE, xirr: null, roots: Object.freeze(found) });
        if (found.length === 1) return Object.freeze({ status: XIRR_STATUS.OK, xirr: found[0], roots: Object.freeze(found) });
        return Object.freeze({ status: XIRR_STATUS.NOT_FOUND, xirr: null, roots: Object.freeze([]) });
    }

    function validateInvestment(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) return [issue("input", "missing")];
        const errors = [];
        [["initialInvestment", true], ["finalValue", true]].forEach(([field]) => {
            const value = data[field];
            if (value === undefined || value === null || value === "") errors.push(issue(field, "missing"));
            else if (!finite(value)) errors.push(issue(field, "not_finite"));
        });
        if (finite(data.initialInvestment) && data.initialInvestment <= 0) errors.push(issue("initialInvestment", "must_be_positive"));
        if (finite(data.finalValue) && data.finalValue < 0) errors.push(issue("finalValue", "negative"));
        ["income", "costs"].forEach(field => {
            if (data[field] === "" || data[field] === null) errors.push(issue(field, "missing"));
            else if (data[field] !== undefined && (!finite(data[field]) || data[field] < 0)) errors.push(issue(field, !finite(data[field]) ? "not_finite" : "negative"));
        });
        if (data.inflationRate === "" || data.inflationRate === null) errors.push(issue("inflationRate", "missing"));
        else if (data.inflationRate !== undefined && (!finite(data.inflationRate) || data.inflationRate <= -1)) errors.push(issue("inflationRate", !finite(data.inflationRate) ? "not_finite" : "must_be_above_minus_one"));
        const start = utcDay(data.startDate), end = utcDay(data.endDate);
        if (start === null) errors.push(issue("startDate", "invalid_date"));
        if (end === null) errors.push(issue("endDate", "invalid_date"));
        if (start !== null && end !== null && end <= start) errors.push(issue("endDate", "must_be_after_start"));
        if (data.cashFlows !== undefined) {
            const flows = normalizeCashFlows(data.cashFlows);
            if (flows.errors) errors.push(...flows.errors);
        }
        return errors;
    }

    function calculateInvestmentReturn(data) {
        const errors = validateInvestment(data);
        if (errors.length) return invalid(errors);
        const income = data.income === undefined ? 0 : data.income;
        const costs = data.costs === undefined ? 0 : data.costs;
        const inflation = data.inflationRate === undefined ? null : data.inflationRate;
        const start = utcDay(data.startDate), end = utcDay(data.endDate);
        const durationDays = (end - start) / M.milisegundosPorDia;
        const durationYears = durationDays / M.diasPorAno;
        const profit = data.finalValue - data.initialInvestment;
        const grossProfit = data.finalValue + income - data.initialInvestment;
        const netProfit = grossProfit - costs;
        const totalReturn = profit / data.initialInvestment;
        const grossReturn = grossProfit / data.initialInvestment;
        const netReturn = netProfit / data.initialInvestment;
        const multiple = data.finalValue / data.initialInvestment;
        const threshold = M.umbralCeroRelativo * Math.max(1, data.initialInvestment, data.finalValue + income, costs);
        const status = Math.abs(netProfit) <= threshold ? STATUS.BREAK_EVEN : netProfit > 0 ? STATUS.GAIN : STATUS.LOSS;
        const warnings = durationDays < M.umbralPeriodoMuyCortoDias ? [WARNING.VERY_SHORT_PERIOD] : [];
        let cagr = null, xirrResult = { status: XIRR_STATUS.NOT_APPLICABLE, xirr: null, roots: [] };
        if (data.cashFlows !== undefined) xirrResult = calculateXirr(data.cashFlows);
        else if (multiple > 0) {
            const value = Math.pow(multiple, 1 / durationYears) - 1;
            cagr = finite(value) ? value : null;
        }
        const nominalAnnualReturn = data.cashFlows !== undefined ? xirrResult.xirr : cagr;
        let realAnnualReturn = null;
        if (inflation !== null && nominalAnnualReturn !== null) {
            const value = (1 + nominalAnnualReturn) / (1 + inflation) - 1;
            realAnnualReturn = finite(value) ? value : null;
        }
        const result = { status, profit, grossProfit, netProfit, totalReturn, grossReturn, netReturn, cagr, realAnnualReturn, multiple, xirr: xirrResult.xirr, xirrStatus: xirrResult.status, xirrRoots: xirrResult.roots, durationDays, durationYears, warnings: Object.freeze(warnings) };
        if (Object.values(result).some(value => typeof value === "number" && !finite(value))) return invalid([issue("result", "not_finite")]);
        return Object.freeze(result);
    }

    return Object.freeze({ STATUS, XIRR_STATUS, WARNING, CONFIG: M, normalizeCashFlows, xnpv, calculateXirr, calculateInvestmentReturn });
}));
