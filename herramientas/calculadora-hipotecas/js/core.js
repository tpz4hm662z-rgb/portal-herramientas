"use strict";

/*
 * Motor financiero puro de Hipoteca PRO v1.0.
 *
 * Convenciones de dominio:
 * - Los importes están expresados en euros y los plazos en meses enteros.
 * - tinAnual es un TIN nominal anual decimal (3 % = 0.03). El sistema francés
 *   usa tinAnual / 12; no se convierte como una tasa anual efectiva.
 * - Los cálculos conservan la precisión de Number. El redondeo contractual o
 *   de presentación a céntimos pertenece a otra capa.
 * - TIN cero tiene una rama explícita y no evalúa la indeterminación 0 / 0.
 * - Los costes son importes externos explícitos. Aquí no hay porcentajes
 *   fiscales, reglas autonómicas ni valores predeterminados de compraventa.
 * - No se calcula TAE: requerirá definir todos los flujos y costes aplicables.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.HipotecaEngine = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const STATUS = Object.freeze({
        VALID: "valid",
        INVALID: "invalid",
        SUFFICIENT: "sufficient",
        EXACT: "exact",
        INSUFFICIENT: "insufficient",
        PAID_OFF: "paid_off"
    });

    const CONFIG = Object.freeze({
        MONTHS_PER_YEAR: 12,
        PERCENT_BASE: 100,
        EPSILON: 1e-8,
        MAX_AMOUNT: 1e12,
        MAX_ANNUAL_TIN: 1,
        MAX_MONTHS: 1200,
        MAX_COST_ITEMS: 10000,
        INFORMATIVE_FINANCING_THRESHOLD: 0.8,
        COMPARISON_TERMS_MONTHS: Object.freeze([240, 300, 360])
    });

    function invalid(errors) {
        return { status: STATUS.INVALID, errors };
    }

    function error(field, code, reason, details) {
        return Object.assign({ field, code, reason }, details || {});
    }

    function validateNumber(field, value, options) {
        const opts = options || {};
        if (value === undefined || value === null || value === "") {
            return [error(field, "missing", "Value is required")];
        }
        if (typeof value !== "number") {
            return [error(field, "wrong_type", "Value must be a number")];
        }
        if (Number.isNaN(value)) return [error(field, "nan", "Value cannot be NaN")];
        if (!Number.isFinite(value)) return [error(field, "infinite", "Value must be finite")];
        if (value < 0 && opts.allowNegative !== true) {
            return [error(field, "negative", "Value cannot be negative")];
        }
        if (value === 0 && opts.allowZero === false) {
            return [error(field, "zero_not_allowed", "Value must be greater than zero")];
        }
        if (opts.integer && !Number.isInteger(value)) {
            return [error(field, "not_integer", "Value must be an integer")];
        }
        if (opts.max !== undefined && value > opts.max) {
            return [error(field, "above_technical_limit", "Value exceeds the technical limit", { max: opts.max })];
        }
        return [];
    }

    function validateAmount(field, value, allowZero) {
        return validateNumber(field, value, { allowZero, max: CONFIG.MAX_AMOUNT });
    }

    function validateTin(tinAnual) {
        return validateNumber("tinAnual", tinAnual, { allowZero: true, max: CONFIG.MAX_ANNUAL_TIN });
    }

    function validateMonths(cuotas, allowZero) {
        return validateNumber("cuotas", cuotas, { allowZero, integer: true, max: CONFIG.MAX_MONTHS });
    }

    function ensureFinite(field, values) {
        return values.every(Number.isFinite)
            ? null
            : invalid([error(field, "non_finite_result", "Calculation produced a non-finite result")]);
    }

    function calcularCapitalCompra(datos) {
        const input = datos || {};
        const errors = [].concat(
            validateAmount("precioVivienda", input.precioVivienda, false),
            validateAmount("entrada", input.entrada, true)
        );
        if (errors.length) return invalid(errors);
        if (input.entrada >= input.precioVivienda) {
            return invalid([error("entrada", "not_below_purchase_price", "Entry must be lower than purchase price")]);
        }
        const capitalHipotecario = input.precioVivienda - input.entrada;
        const porcentajeFinanciado = capitalHipotecario / input.precioVivienda;
        const porcentajeEntrada = input.entrada / input.precioVivienda;
        return {
            status: STATUS.VALID,
            precioVivienda: input.precioVivienda,
            entrada: input.entrada,
            capitalHipotecario,
            porcentajeFinanciado,
            porcentajeEntrada,
            superaUmbralFinanciacionInformativo: porcentajeFinanciado > CONFIG.INFORMATIVE_FINANCING_THRESHOLD
        };
    }

    function calcularCuotaFrancesa(datos) {
        const input = datos || {};
        const errors = [].concat(
            validateAmount("capital", input.capital, false),
            validateTin(input.tinAnual),
            validateMonths(input.cuotas, false)
        );
        if (errors.length) return invalid(errors);
        const tinMensual = input.tinAnual / CONFIG.MONTHS_PER_YEAR;
        const cuota = tinMensual === 0
            ? input.capital / input.cuotas
            : input.capital * tinMensual / -Math.expm1(-input.cuotas * Math.log1p(tinMensual));
        const failure = ensureFinite("cuota", [tinMensual, cuota]);
        return failure || {
            status: STATUS.VALID,
            capital: input.capital,
            tinAnual: input.tinAnual,
            tinMensual,
            cuotas: input.cuotas,
            cuota
        };
    }

    function resumirPrestamo(datos) {
        const payment = calcularCuotaFrancesa(datos);
        if (payment.status === STATUS.INVALID) return payment;
        const totalCuotas = payment.cuota * payment.cuotas;
        const interesesTotales = totalCuotas - payment.capital;
        const failure = ensureFinite("resumenPrestamo", [totalCuotas, interesesTotales]);
        return failure || Object.assign({}, payment, {
            plazo: {
                meses: payment.cuotas,
                anosCompletos: Math.floor(payment.cuotas / CONFIG.MONTHS_PER_YEAR),
                mesesRestantes: payment.cuotas % CONFIG.MONTHS_PER_YEAR
            },
            cuotaMatematica: payment.cuota,
            totalMatematicoCuotas: totalCuotas,
            interesesTotales
        });
    }

    function cuadroAmortizacion(datos) {
        const summary = resumirPrestamo(datos);
        if (summary.status === STATUS.INVALID) return summary;
        const rows = [];
        let balance = summary.capital;
        let totalInterest = 0;
        let totalPrincipal = 0;
        for (let number = 1; number <= summary.cuotas; number += 1) {
            const opening = balance;
            const interest = opening * summary.tinMensual;
            let payment = summary.cuotaMatematica;
            let principal = payment - interest;
            if (number === summary.cuotas || principal > opening || Math.abs(opening - principal) <= CONFIG.EPSILON) {
                principal = opening;
                payment = principal + interest;
            }
            balance = opening - principal;
            if (Math.abs(balance) <= CONFIG.EPSILON) balance = 0;
            totalInterest += interest;
            totalPrincipal += principal;
            rows.push({ numeroCuota: number, saldoInicial: opening, intereses: interest, capitalAmortizado: principal, cuota: payment, saldoFinal: balance });
        }
        const failure = ensureFinite("cuadroAmortizacion", [balance, totalInterest, totalPrincipal]);
        return failure || {
            status: STATUS.VALID,
            capitalInicial: summary.capital,
            tinAnual: summary.tinAnual,
            tinMensual: summary.tinMensual,
            cuotaMatematica: summary.cuotaMatematica,
            filas: rows,
            capitalAmortizadoTotal: totalPrincipal,
            interesesTotales: totalInterest,
            saldoFinal: balance
        };
    }

    function serieAnual(datos) {
        const schedule = cuadroAmortizacion(datos);
        if (schedule.status === STATUS.INVALID) return schedule;
        const years = [];
        let principal = 0;
        let interest = 0;
        schedule.filas.forEach(function (row, index) {
            principal += row.capitalAmortizado;
            interest += row.intereses;
            const closesYear = row.numeroCuota % CONFIG.MONTHS_PER_YEAR === 0;
            const isLast = index === schedule.filas.length - 1;
            if (closesYear || isLast) {
                years.push({
                    ano: Math.ceil(row.numeroCuota / CONFIG.MONTHS_PER_YEAR),
                    cuotasTranscurridas: row.numeroCuota,
                    capitalAmortizadoAcumulado: principal,
                    interesesAcumulados: interest,
                    saldoPendiente: row.saldoFinal,
                    periodoParcial: !closesYear
                });
            }
        });
        return { status: STATUS.VALID, serie: years };
    }

    function estadoTrasCuotas(datos) {
        const input = datos || {};
        const elapsedErrors = validateNumber("cuotasTranscurridas", input.cuotasTranscurridas, { allowZero: true, integer: true, max: CONFIG.MAX_MONTHS });
        if (elapsedErrors.length) return invalid(elapsedErrors);
        const schedule = cuadroAmortizacion(input);
        if (schedule.status === STATUS.INVALID) return schedule;
        if (input.cuotasTranscurridas > schedule.filas.length) {
            return invalid([error("cuotasTranscurridas", "exceeds_loan_term", "Elapsed payments exceed the loan term")]);
        }
        if (input.cuotasTranscurridas === 0) {
            return { status: STATUS.VALID, saldoPendiente: input.capital, capitalAmortizado: 0, interesesPagados: 0, cuotasRestantes: input.cuotas, cuotaMatematica: schedule.cuotaMatematica };
        }
        const paidRows = schedule.filas.slice(0, input.cuotasTranscurridas);
        const last = paidRows[paidRows.length - 1];
        return {
            status: last.saldoFinal === 0 ? STATUS.PAID_OFF : STATUS.VALID,
            saldoPendiente: last.saldoFinal,
            capitalAmortizado: paidRows.reduce((sum, row) => sum + row.capitalAmortizado, 0),
            interesesPagados: paidRows.reduce((sum, row) => sum + row.intereses, 0),
            cuotasRestantes: input.cuotas - input.cuotasTranscurridas,
            cuotaMatematica: schedule.cuotaMatematica
        };
    }

    function compararPlazos(datos) {
        const input = datos || {};
        const terms = input.plazosMeses;
        if (!Array.isArray(terms) || terms.length === 0) {
            return invalid([error("plazosMeses", "invalid_collection", "At least one term is required")]);
        }
        const unique = [];
        const errors = [];
        terms.forEach(function (term) {
            errors.push.apply(errors, validateMonths(term, false));
            if (!unique.includes(term)) unique.push(term);
        });
        errors.push.apply(errors, validateAmount("capital", input.capital, false));
        errors.push.apply(errors, validateTin(input.tinAnual));
        if (errors.length) return invalid(errors);
        const base = input.plazoBaseMeses === undefined ? unique[0] : input.plazoBaseMeses;
        if (!unique.includes(base)) return invalid([error("plazoBaseMeses", "base_not_in_collection", "Base term must belong to the comparison")]);
        const summaries = unique.map(function (cuotas) { return resumirPrestamo({ capital: input.capital, tinAnual: input.tinAnual, cuotas }); });
        const baseSummary = summaries[unique.indexOf(base)];
        return {
            status: STATUS.VALID,
            plazoBaseMeses: base,
            escenarios: summaries.map(function (summary) {
                return {
                    cuotas: summary.cuotas,
                    cuota: summary.cuotaMatematica,
                    interesesTotales: summary.interesesTotales,
                    totalCuotas: summary.totalMatematicoCuotas,
                    diferenciaCuotaVsBase: summary.cuotaMatematica - baseSummary.cuotaMatematica,
                    diferenciaInteresesVsBase: summary.interesesTotales - baseSummary.interesesTotales,
                    diferenciaTotalVsBase: summary.totalMatematicoCuotas - baseSummary.totalMatematicoCuotas
                };
            })
        };
    }

    function validatePrepayment(input) {
        const commission = input.comision === undefined ? 0 : input.comision;
        const errors = [].concat(
            validateAmount("saldoPendiente", input.saldoPendiente, false),
            validateTin(input.tinAnual),
            validateMonths(input.cuotasRestantes, false),
            validateAmount("importeAmortizacion", input.importeAmortizacion, false),
            validateAmount("comision", commission, true)
        );
        if (errors.length) return invalid(errors);
        if (input.importeAmortizacion > input.saldoPendiente) {
            return invalid([error("importeAmortizacion", "exceeds_balance", "Prepayment cannot exceed outstanding balance")]);
        }
        return { status: STATUS.VALID, comision: commission };
    }

    function amortizarReduciendoCuota(datos) {
        const input = datos || {};
        const validation = validatePrepayment(input);
        if (validation.status === STATUS.INVALID) return validation;
        const before = resumirPrestamo({ capital: input.saldoPendiente, tinAnual: input.tinAnual, cuotas: input.cuotasRestantes });
        const newBalance = input.saldoPendiente - input.importeAmortizacion;
        if (newBalance === 0) {
            return {
                status: STATUS.PAID_OFF, saldoAnterior: input.saldoPendiente, importeAmortizado: input.importeAmortizacion,
                saldoNuevo: 0, cuotasRestantes: 0, cuotaAnterior: before.cuotaMatematica, cuotaNueva: 0,
                interesesFuturosAntes: before.interesesTotales, interesesFuturosDespues: 0,
                ahorroBrutoIntereses: before.interesesTotales, comision: validation.comision,
                ahorroNeto: before.interesesTotales - validation.comision
            };
        }
        const after = resumirPrestamo({ capital: newBalance, tinAnual: input.tinAnual, cuotas: input.cuotasRestantes });
        const gross = before.interesesTotales - after.interesesTotales;
        return {
            status: STATUS.VALID, saldoAnterior: input.saldoPendiente, importeAmortizado: input.importeAmortizacion,
            saldoNuevo: newBalance, cuotasRestantes: input.cuotasRestantes, cuotaAnterior: before.cuotaMatematica,
            cuotaNueva: after.cuotaMatematica, interesesFuturosAntes: before.interesesTotales,
            interesesFuturosDespues: after.interesesTotales, ahorroBrutoIntereses: gross,
            comision: validation.comision, ahorroNeto: gross - validation.comision
        };
    }

    function scheduleWithFixedPayment(balance, monthlyRate, regularPayment, maxPayments) {
        const rows = [];
        let current = balance;
        let totalInterest = 0;
        for (let number = 1; number <= maxPayments && current > CONFIG.EPSILON; number += 1) {
            const interest = current * monthlyRate;
            if (regularPayment <= interest) return invalid([error("cuotaAnterior", "non_amortizing_payment", "Payment does not amortize principal")]);
            const payment = Math.min(regularPayment, current + interest);
            const principal = payment - interest;
            const finalBalance = Math.max(0, current - principal);
            rows.push({ numeroCuota: number, saldoInicial: current, intereses: interest, capitalAmortizado: principal, cuota: payment, saldoFinal: finalBalance });
            totalInterest += interest;
            current = finalBalance <= CONFIG.EPSILON ? 0 : finalBalance;
        }
        if (current !== 0) return invalid([error("cuotasRestantes", "not_paid_within_limit", "Loan was not paid within the available payments")]);
        return { status: STATUS.VALID, filas: rows, interesesTotales: totalInterest, saldoFinal: current };
    }

    function amortizarReduciendoPlazo(datos) {
        const input = datos || {};
        const validation = validatePrepayment(input);
        if (validation.status === STATUS.INVALID) return validation;
        const before = resumirPrestamo({ capital: input.saldoPendiente, tinAnual: input.tinAnual, cuotas: input.cuotasRestantes });
        const newBalance = input.saldoPendiente - input.importeAmortizacion;
        if (newBalance === 0) {
            return {
                status: STATUS.PAID_OFF, saldoAnterior: input.saldoPendiente, importeAmortizado: input.importeAmortizacion,
                saldoNuevo: 0, cuotaReferencia: before.cuotaMatematica, nuevasCuotas: 0,
                cuotasAhorradas: input.cuotasRestantes, nuevoPlazo: { meses: 0, anosCompletos: 0, mesesRestantes: 0 },
                interesesFuturosAntes: before.interesesTotales, interesesFuturosDespues: 0,
                ahorroBrutoIntereses: before.interesesTotales, comision: validation.comision,
                ahorroNeto: before.interesesTotales - validation.comision, ultimaCuota: 0
            };
        }
        const schedule = scheduleWithFixedPayment(newBalance, input.tinAnual / CONFIG.MONTHS_PER_YEAR, before.cuotaMatematica, input.cuotasRestantes);
        if (schedule.status === STATUS.INVALID) return schedule;
        const newPayments = schedule.filas.length;
        const gross = before.interesesTotales - schedule.interesesTotales;
        return {
            status: STATUS.VALID, saldoAnterior: input.saldoPendiente, importeAmortizado: input.importeAmortizacion,
            saldoNuevo: newBalance, cuotaReferencia: before.cuotaMatematica, nuevasCuotas: newPayments,
            cuotasAhorradas: input.cuotasRestantes - newPayments,
            nuevoPlazo: { meses: newPayments, anosCompletos: Math.floor(newPayments / CONFIG.MONTHS_PER_YEAR), mesesRestantes: newPayments % CONFIG.MONTHS_PER_YEAR },
            interesesFuturosAntes: before.interesesTotales, interesesFuturosDespues: schedule.interesesTotales,
            ahorroBrutoIntereses: gross, comision: validation.comision, ahorroNeto: gross - validation.comision,
            ultimaCuota: schedule.filas[schedule.filas.length - 1].cuota
        };
    }

    function compararAmortizacion(datos) {
        const reducePayment = amortizarReduciendoCuota(datos);
        if (reducePayment.status === STATUS.INVALID) return reducePayment;
        const reduceTerm = amortizarReduciendoPlazo(datos);
        if (reduceTerm.status === STATUS.INVALID) return reduceTerm;
        return { status: reducePayment.status === STATUS.PAID_OFF ? STATUS.PAID_OFF : STATUS.VALID, reducirCuota: reducePayment, reducirPlazo: reduceTerm };
    }

    function compararAmortizacionTrasCuotas(datos) {
        const input = datos || {};
        const state = estadoTrasCuotas(input);
        if (state.status === STATUS.INVALID) return state;
        if (state.status === STATUS.PAID_OFF) return invalid([error("prestamo", "already_paid_off", "Loan is already paid off")]);
        return compararAmortizacion({
            saldoPendiente: state.saldoPendiente,
            tinAnual: input.tinAnual,
            cuotasRestantes: state.cuotasRestantes,
            importeAmortizacion: input.importeAmortizacion,
            comision: input.comision
        });
    }

    function agregarCostesExternos(conceptos) {
        if (!Array.isArray(conceptos)) return invalid([error("conceptos", "wrong_type", "Costs must be an array")]);
        if (conceptos.length > CONFIG.MAX_COST_ITEMS) return invalid([error("conceptos", "above_technical_limit", "Too many cost items", { max: CONFIG.MAX_COST_ITEMS })]);
        const errors = [];
        const ids = new Set();
        const breakdown = conceptos.map(function (item, index) {
            if (!item || typeof item !== "object") {
                errors.push(error(`conceptos[${index}]`, "wrong_type", "Cost item must be an object"));
                return null;
            }
            if (typeof item.id !== "string" || item.id.trim() === "") errors.push(error(`conceptos[${index}].id`, "invalid_id", "A non-empty id is required"));
            else if (ids.has(item.id)) errors.push(error(`conceptos[${index}].id`, "duplicate_id", "Cost ids must be unique"));
            else ids.add(item.id);
            if (typeof item.categoria !== "string" || item.categoria.trim() === "") errors.push(error(`conceptos[${index}].categoria`, "invalid_category", "A non-empty category is required"));
            if (item.ambito !== "purchase" && item.ambito !== "loan") errors.push(error(`conceptos[${index}].ambito`, "invalid_scope", "Scope must be purchase or loan"));
            errors.push.apply(errors, validateAmount(`conceptos[${index}].importe`, item.importe, true));
            return item ? { id: item.id, categoria: item.categoria, ambito: item.ambito, importe: item.importe } : null;
        });
        if (errors.length) return invalid(errors);
        const categorias = {};
        let costesCompraventa = 0;
        let costesPrestamo = 0;
        breakdown.forEach(function (item) {
            categorias[item.categoria] = (categorias[item.categoria] || 0) + item.importe;
            if (item.ambito === "purchase") costesCompraventa += item.importe;
            else costesPrestamo += item.importe;
        });
        const total = costesCompraventa + costesPrestamo;
        const failure = ensureFinite("costes", [costesCompraventa, costesPrestamo, total]);
        return failure || { status: STATUS.VALID, total, costesCompraventa, costesPrestamo, desglose: breakdown, categorias };
    }

    function evaluarAhorros(datos) {
        const input = datos || {};
        const errors = [].concat(
            validateAmount("ahorrosDisponibles", input.ahorrosDisponibles, true),
            validateAmount("entrada", input.entrada, true),
            validateAmount("costesCompraventa", input.costesCompraventa, true),
            validateAmount("costesPrestamo", input.costesPrestamo, true)
        );
        if (errors.length) return invalid(errors);
        const dineroInicialNecesario = input.entrada + input.costesCompraventa + input.costesPrestamo;
        const colchonRestante = input.ahorrosDisponibles - dineroInicialNecesario;
        const failure = ensureFinite("ahorros", [dineroInicialNecesario, colchonRestante]);
        if (failure) return failure;
        const status = colchonRestante > CONFIG.EPSILON ? STATUS.SUFFICIENT
            : colchonRestante < -CONFIG.EPSILON ? STATUS.INSUFFICIENT : STATUS.EXACT;
        return {
            status, ahorrosDisponibles: input.ahorrosDisponibles, entrada: input.entrada,
            costesCompraventa: input.costesCompraventa, costesPrestamo: input.costesPrestamo,
            dineroInicialNecesario, colchonRestante,
            superavit: Math.max(0, colchonRestante), deficit: Math.max(0, -colchonRestante)
        };
    }

    function calcularEsfuerzoMensual(datos) {
        const input = datos || {};
        const errors = [].concat(validateAmount("cuota", input.cuota, true), validateAmount("ingresosNetosMensuales", input.ingresosNetosMensuales, false));
        if (errors.length) return invalid(errors);
        const ratio = input.cuota / input.ingresosNetosMensuales;
        return Number.isFinite(ratio) ? { status: STATUS.VALID, ratio } : invalid([error("ratio", "non_finite_result", "Calculation produced a non-finite result")]);
    }

    return Object.freeze({
        STATUS, CONFIG, validateNumber, calcularCapitalCompra, calcularCuotaFrancesa, resumirPrestamo,
        cuadroAmortizacion, serieAnual, estadoTrasCuotas, compararPlazos,
        amortizarReduciendoCuota, amortizarReduciendoPlazo, compararAmortizacion,
        compararAmortizacionTrasCuotas, agregarCostesExternos, evaluarAhorros, calcularEsfuerzoMensual
    });
}));
