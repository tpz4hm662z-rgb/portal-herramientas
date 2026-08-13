/* Calculadora de Inflación PRO v1.0 - Fase 1. Motor matemático puro. */
(function (root, factory) {
    "use strict";
    const config = typeof module === "object" && module.exports
        ? require("./config.js")
        : root.CONFIG;
    const engine = factory(config);
    if (typeof module === "object" && module.exports) module.exports = engine;
    if (root) root.InflationEngine = engine;
}(typeof globalThis !== "undefined" ? globalThis : this, function (config) {
    "use strict";

    const M = config.matematicas;
    const MODE = Object.freeze({
        PURCHASING_POWER: "PURCHASING_POWER",
        REAL_VALUE: "REAL_VALUE",
        COMPARE_WITH_INFLATION: "COMPARE_WITH_INFLATION"
    });
    const STATUS = Object.freeze({
        OK: "OK",
        INVALID_INPUT: "INVALID_INPUT"
    });
    const PRICE_STATUS = Object.freeze({
        INFLATION: "INFLATION",
        DEFLATION: "DEFLATION",
        NO_PRICE_CHANGE: "NO_PRICE_CHANGE"
    });
    const POWER_STATUS = Object.freeze({
        GAINED: "PURCHASING_POWER_GAINED",
        LOST: "PURCHASING_POWER_LOST",
        UNCHANGED: "PURCHASING_POWER_UNCHANGED"
    });
    const COMPARISON_STATUS = Object.freeze({
        ABOVE: "ABOVE_INFLATION",
        BELOW: "BELOW_INFLATION",
        MATCHES: "MATCHES_INFLATION"
    });

    const finite = value => typeof value === "number" && Number.isFinite(value);
    const missing = value => value === undefined || value === null || value === "";
    const issue = (field, code) => Object.freeze({ field, code });
    const invalid = errors => Object.freeze({
        status: STATUS.INVALID_INPUT,
        errors: Object.freeze(errors)
    });
    const frozen = value => Object.freeze(value);

    function numericError(data, field, rule) {
        const value = data[field];
        if (missing(value)) return issue(field, "missing");
        if (!finite(value)) return issue(field, "not_finite_number");
        if (!rule(value)) return issue(field, field === "inflationRate" || field === "cumulativeInflation"
            ? "must_be_above_minus_one"
            : field === "initialAmount" ? "must_be_positive" : "must_be_non_negative");
        return null;
    }

    function validateObject(data) {
        return data && typeof data === "object" && !Array.isArray(data)
            ? []
            : [issue("input", "must_be_object")];
    }

    function inflationInputs(data) {
        const errors = validateObject(data);
        if (errors.length) return errors;
        const rateError = numericError(data, "inflationRate", value => value > M.tasaInflacionMinimaExclusiva);
        const yearsError = numericError(data, "years", value => value >= 0);
        if (rateError) errors.push(rateError);
        if (yearsError) errors.push(yearsError);
        return errors;
    }

    function classify(value, negative, zero, positive) {
        const scale = Math.max(1, Math.abs(value));
        if (Math.abs(value) <= M.umbralCeroRelativo * scale) return zero;
        return value < 0 ? negative : positive;
    }

    function factorFromAnnualRate(inflationRate, years) {
        const logarithm = years * Math.log1p(inflationRate);
        const factor = Math.exp(logarithm);
        return finite(logarithm) && finite(factor) && factor > 0 ? factor : null;
    }

    function cumulativeResult(inflationRate, years) {
        const factor = factorFromAnnualRate(inflationRate, years);
        if (factor === null) return invalid([issue("result", "non_finite_or_underflow")]);
        const cumulativeInflation = factor - 1;
        if (!finite(cumulativeInflation)) return invalid([issue("result", "not_finite")]);
        return frozen({
            status: STATUS.OK,
            priceStatus: classify(cumulativeInflation, PRICE_STATUS.DEFLATION, PRICE_STATUS.NO_PRICE_CHANGE, PRICE_STATUS.INFLATION),
            inflationRate,
            years,
            inflationFactor: factor,
            cumulativeInflation
        });
    }

    function calculateCumulativeInflation(data) {
        const errors = inflationInputs(data);
        return errors.length ? invalid(errors) : cumulativeResult(data.inflationRate, data.years);
    }

    function validateAmount(data, field) {
        const errors = inflationInputs(data);
        if (errors.length && errors[0].field === "input") return errors;
        const amountError = numericError(data, field, value => value >= 0);
        if (amountError) errors.push(amountError);
        return errors;
    }

    function calculatePurchasingPower(data) {
        const errors = validateAmount(data, "amount");
        if (errors.length) return invalid(errors);
        const inflation = cumulativeResult(data.inflationRate, data.years);
        if (inflation.status === STATUS.INVALID_INPUT) return inflation;
        const futureEquivalent = data.amount * inflation.inflationFactor;
        const realValue = data.amount / inflation.inflationFactor;
        const purchasingPowerChange = 1 / inflation.inflationFactor - 1;
        if (![futureEquivalent, realValue, purchasingPowerChange].every(finite)) return invalid([issue("result", "not_finite")]);
        return frozen({
            status: STATUS.OK,
            priceStatus: inflation.priceStatus,
            purchasingPowerStatus: classify(purchasingPowerChange, POWER_STATUS.LOST, POWER_STATUS.UNCHANGED, POWER_STATUS.GAINED),
            amount: data.amount,
            inflationRate: data.inflationRate,
            years: data.years,
            inflationFactor: inflation.inflationFactor,
            cumulativeInflation: inflation.cumulativeInflation,
            futureEquivalent,
            realValue,
            purchasingPowerChange
        });
    }

    function calculateRealValue(data) {
        const result = calculatePurchasingPower(data);
        if (result.status === STATUS.INVALID_INPUT) return result;
        return frozen({
            status: result.status,
            priceStatus: result.priceStatus,
            purchasingPowerStatus: result.purchasingPowerStatus,
            amount: result.amount,
            inflationRate: result.inflationRate,
            years: result.years,
            inflationFactor: result.inflationFactor,
            cumulativeInflation: result.cumulativeInflation,
            realValue: result.realValue,
            purchasingPowerChange: result.purchasingPowerChange
        });
    }

    function comparisonInflation(data, errors) {
        const hasCumulative = !missing(data.cumulativeInflation);
        const hasAnnual = !missing(data.inflationRate);
        const hasYears = !missing(data.years);
        if (hasCumulative && (hasAnnual || hasYears)) {
            errors.push(issue("inflation", "choose_one_inflation_source"));
            return null;
        }
        if (hasCumulative) {
            const error = numericError(data, "cumulativeInflation", value => value > M.tasaInflacionMinimaExclusiva);
            if (error) errors.push(error);
            return error ? null : { factor: 1 + data.cumulativeInflation, cumulative: data.cumulativeInflation };
        }
        if (!hasAnnual && !hasYears) {
            errors.push(issue("inflation", "missing"));
            return null;
        }
        const subErrors = inflationInputs(data);
        errors.push(...subErrors);
        if (subErrors.length) return null;
        const cumulative = cumulativeResult(data.inflationRate, data.years);
        if (cumulative.status === STATUS.INVALID_INPUT) {
            errors.push(...cumulative.errors);
            return null;
        }
        return { factor: cumulative.inflationFactor, cumulative: cumulative.cumulativeInflation };
    }

    function compareWithInflation(data) {
        const errors = validateObject(data);
        if (errors.length) return invalid(errors);
        const initialError = numericError(data, "initialAmount", value => value > 0);
        const finalError = numericError(data, "finalAmount", value => value >= 0);
        if (initialError) errors.push(initialError);
        if (finalError) errors.push(finalError);
        const inflation = comparisonInflation(data, errors);
        if (errors.length) return invalid(errors);
        const nominalChange = data.finalAmount / data.initialAmount - 1;
        const realChange = (1 + nominalChange) / inflation.factor - 1;
        if (![nominalChange, realChange, inflation.factor, inflation.cumulative].every(finite)) return invalid([issue("result", "not_finite")]);
        return frozen({
            status: STATUS.OK,
            comparisonStatus: classify(realChange, COMPARISON_STATUS.BELOW, COMPARISON_STATUS.MATCHES, COMPARISON_STATUS.ABOVE),
            priceStatus: classify(inflation.cumulative, PRICE_STATUS.DEFLATION, PRICE_STATUS.NO_PRICE_CHANGE, PRICE_STATUS.INFLATION),
            initialAmount: data.initialAmount,
            finalAmount: data.finalAmount,
            inflationFactor: inflation.factor,
            cumulativeInflation: inflation.cumulative,
            nominalChange,
            realChange
        });
    }

    function calculateInflationImpact(mode, data) {
        if (mode === MODE.PURCHASING_POWER) return calculatePurchasingPower(data);
        if (mode === MODE.REAL_VALUE) return calculateRealValue(data);
        if (mode === MODE.COMPARE_WITH_INFLATION) return compareWithInflation(data);
        return invalid([issue("mode", "unsupported")]);
    }

    return frozen({
        MODE, STATUS, PRICE_STATUS, POWER_STATUS, COMPARISON_STATUS,
        CONFIG: M,
        calculateCumulativeInflation,
        calculatePurchasingPower,
        calculateRealValue,
        compareWithInflation,
        calculateInflationImpact
    });
}));
