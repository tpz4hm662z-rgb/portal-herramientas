"use strict";

(function () {
    const engine = window.HipotecaEngine;
    const form = document.getElementById("formulario-hipoteca");
    const results = document.getElementById("resultados");
    const formError = document.getElementById("error-formulario");
    const mortgageButton = document.getElementById("calcular-amortizacion");
    const state = { input: null, purchase: null, summary: null, schedule: null };

    const fields = {
        precioVivienda: { id: "precio-vivienda", error: "error-precio", label: "precio de la vivienda", zero: false, max: engine.CONFIG.MAX_AMOUNT },
        entrada: { id: "entrada", error: "error-entrada", label: "entrada", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        tinPorcentaje: { id: "tin-anual", error: "error-tin", label: "TIN anual", zero: true, max: engine.CONFIG.MAX_ANNUAL_TIN * 100 },
        plazoAnos: { id: "plazo-anos", error: "error-plazo", label: "plazo", zero: false, max: engine.CONFIG.MAX_MONTHS / engine.CONFIG.MONTHS_PER_YEAR, integer: true },
        ahorrosDisponibles: { id: "ahorros", error: "error-ahorros", label: "ahorros disponibles", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        impuestosManuales: { id: "impuestos-manuales", error: "error-impuestos", label: "impuestos conocidos", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        tasacion: { id: "tasacion", error: "error-tasacion", label: "tasación", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        comisionApertura: { id: "comision-apertura", error: "error-apertura", label: "comisión de apertura", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        otrosCompra: { id: "otros-compra", error: "error-otros-compra", label: "otros costes de compraventa", zero: true, max: engine.CONFIG.MAX_AMOUNT },
        otrosPrestamo: { id: "otros-prestamo", error: "error-otros-prestamo", label: "otros costes del préstamo", zero: true, max: engine.CONFIG.MAX_AMOUNT }
    };

    const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
    const percent = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

    function safeFormat(formatter, value) {
        return Number.isFinite(value) ? formatter.format(value) : "—";
    }

    function money(value) { return safeFormat(euro, value); }
    function percentage(value) { return safeFormat(percent, value); }
    function yearsLabel(value) { return `${safeFormat(number, value)} ${value === 1 ? "año" : "años"}`; }
    function durationLabel(years, months) {
        const yearText = `${years} ${years === 1 ? "año" : "años"}`;
        const monthText = `${months} ${months === 1 ? "mes" : "meses"}`;
        return `${yearText} y ${monthText}`;
    }

    function clearFieldError(definition) {
        const input = document.getElementById(definition.id);
        input.removeAttribute("aria-invalid");
        document.getElementById(definition.error).textContent = "";
    }

    function setFieldError(definition, message) {
        const input = document.getElementById(definition.id);
        input.setAttribute("aria-invalid", "true");
        document.getElementById(definition.error).textContent = message;
    }

    function readNumber(definition) {
        clearFieldError(definition);
        const input = document.getElementById(definition.id);
        const raw = input.value.trim();
        if (raw === "") return { error: `Introduce ${definition.label}.` };
        const value = Number(raw);
        if (Number.isNaN(value)) return { error: `${definition.label} debe ser un número.` };
        if (!Number.isFinite(value)) return { error: `${definition.label} debe ser un valor finito.` };
        if (value < 0) return { error: `${definition.label} no puede ser negativo.` };
        if (!definition.zero && value === 0) return { error: `${definition.label} debe ser mayor que cero.` };
        if (definition.integer && !Number.isInteger(value)) return { error: `${definition.label} debe expresarse en años completos.` };
        if (value > definition.max) return { error: `${definition.label} supera el límite técnico de ${safeFormat(number, definition.max)}.` };
        return { value };
    }

    function readMainInputs() {
        const data = {};
        let firstInvalid = null;
        Object.keys(fields).forEach(function (key) {
            const parsed = readNumber(fields[key]);
            if (parsed.error) {
                setFieldError(fields[key], parsed.error);
                if (!firstInvalid) firstInvalid = document.getElementById(fields[key].id);
            } else data[key] = parsed.value;
        });
        if (firstInvalid) return { error: true, firstInvalid };
        data.tinAnual = data.tinPorcentaje / engine.CONFIG.PERCENT_BASE;
        data.cuotas = data.plazoAnos * engine.CONFIG.MONTHS_PER_YEAR;
        if (!Number.isInteger(data.cuotas)) {
            setFieldError(fields.plazoAnos, "El plazo debe producir mensualidades completas.");
            return { error: true, firstInvalid: document.getElementById(fields.plazoAnos.id) };
        }
        return { data };
    }

    function messageFromCore(result) {
        if (!result || !Array.isArray(result.errors)) return "No se ha podido completar el cálculo.";
        const first = result.errors[0];
        if (first.code === "not_below_purchase_price") return "La entrada debe ser inferior al precio de la vivienda.";
        if (first.code === "non_finite_result") return "El cálculo supera los límites numéricos permitidos.";
        return "Revisa los datos introducidos antes de calcular.";
    }

    function metric(label, value) {
        return `<dl class="metrica"><dt>${label}</dt><dd>${value}</dd></dl>`;
    }

    function renderPrimary(input, purchase, summary) {
        document.getElementById("cuota-principal").textContent = `${money(summary.cuotaMatematica)} / mes`;
        document.getElementById("metricas-principales").innerHTML = [
            metric("Capital solicitado", money(purchase.capitalHipotecario)),
            metric("Porcentaje financiado", percentage(purchase.porcentajeFinanciado)),
            metric("Entrada", `${money(purchase.entrada)} · ${percentage(purchase.porcentajeEntrada)}`),
            metric("Plazo", `${yearsLabel(input.plazoAnos)} · ${summary.cuotas} cuotas`),
            metric("TIN anual", `${safeFormat(number, input.tinPorcentaje)} %`),
            metric("Intereses totales", money(summary.interesesTotales)),
            metric("Total pagado al banco", money(summary.totalMatematicoCuotas))
        ].join("");
        const warning = document.getElementById("aviso-financiacion");
        warning.hidden = !purchase.superaUmbralFinanciacionInformativo;
        warning.textContent = purchase.superaUmbralFinanciacionInformativo
            ? "Orientación: la financiación supera el 80 % del precio indicado. Muchas operaciones usan referencias sobre el valor del inmueble o de tasación, pero la concesión depende de la política de cada entidad y de la capacidad de pago."
            : "";
    }

    function buildCosts(input) {
        const definitions = [
            { id: "impuestos-manuales", categoria: "Impuestos introducidos", ambito: "purchase", importe: input.impuestosManuales },
            { id: "otros-compra", categoria: "Otros costes de compraventa", ambito: "purchase", importe: input.otrosCompra },
            { id: "tasacion", categoria: "Tasación", ambito: "loan", importe: input.tasacion },
            { id: "comision-apertura", categoria: "Comisión de apertura", ambito: "loan", importe: input.comisionApertura },
            { id: "otros-prestamo", categoria: "Otros costes del préstamo", ambito: "loan", importe: input.otrosPrestamo }
        ];
        return { all: definitions, included: definitions.filter(item => item.importe > 0), aggregate: engine.agregarCostesExternos(definitions.filter(item => item.importe > 0)) };
    }

    function listItems(element, items) {
        element.replaceChildren();
        items.forEach(function (text) { const li = document.createElement("li"); li.textContent = text; element.appendChild(li); });
    }

    function renderSavings(input, purchase) {
        const costs = buildCosts(input);
        if (costs.aggregate.status === engine.STATUS.INVALID) return costs.aggregate;
        const savings = engine.evaluarAhorros({
            ahorrosDisponibles: input.ahorrosDisponibles,
            entrada: purchase.entrada,
            costesCompraventa: costs.aggregate.costesCompraventa,
            costesPrestamo: costs.aggregate.costesPrestamo
        });
        if (savings.status === engine.STATUS.INVALID) return savings;
        const taxKnown = input.impuestosManuales > 0;
        document.getElementById("resumen-dinero").innerHTML = [
            `<div class="linea-dinero"><span>Entrada</span><strong>${money(purchase.entrada)}</strong></div>`,
            `<div class="linea-dinero"><span>${taxKnown ? "Impuestos incluidos" : "Impuestos"}</span><strong>${taxKnown ? money(input.impuestosManuales) : "No calculados"}</strong></div>`,
            `<div class="linea-dinero"><span>Costes de compraventa incluidos</span><strong>${money(costs.aggregate.costesCompraventa - input.impuestosManuales)}</strong></div>`,
            `<div class="linea-dinero"><span>Costes del préstamo incluidos</span><strong>${money(costs.aggregate.costesPrestamo)}</strong></div>`,
            `<div class="linea-dinero total"><span>Total de conceptos incluidos</span><strong>${money(savings.dineroInicialNecesario)}</strong></div>`,
            `<div class="linea-dinero"><span>Ahorros disponibles</span><strong>${money(savings.ahorrosDisponibles)}</strong></div>`
        ].join("");
        const status = document.getElementById("estado-ahorros");
        status.className = `estado-ahorros ${savings.status}`;
        status.textContent = savings.status === engine.STATUS.SUFFICIENT
            ? `Después de cubrir los conceptos incluidos quedarían aproximadamente ${money(savings.superavit)}.`
            : savings.status === engine.STATUS.EXACT
                ? "Tus ahorros coinciden aproximadamente con el total de conceptos incluidos."
                : `Te faltarían aproximadamente ${money(savings.deficit)} para cubrir los conceptos incluidos.`;
        const included = ["Entrada", ...costs.included.map(item => `${item.categoria}: ${money(item.importe)}`)];
        const pending = [
            ...(taxKnown ? [] : [`Impuestos de ${document.getElementById("tipo-vivienda").value === "new" ? "vivienda nueva" : "vivienda usada"}: no calculados`]),
            "Cualquier concepto de compra o préstamo no introducido manualmente"
        ];
        listItems(document.getElementById("lista-incluido"), included);
        listItems(document.getElementById("lista-pendiente"), pending);
        return savings;
    }

    function renderComparison(input, purchase) {
        const terms = [input.cuotas].concat(engine.CONFIG.COMPARISON_TERMS_MONTHS);
        const comparison = engine.compararPlazos({ capital: purchase.capitalHipotecario, tinAnual: input.tinAnual, plazosMeses: terms, plazoBaseMeses: input.cuotas });
        if (comparison.status === engine.STATUS.INVALID) return comparison;
        document.getElementById("comparacion-plazos").innerHTML = comparison.escenarios
            .sort((a, b) => a.cuotas - b.cuotas)
            .map(function (scenario) {
                const selected = scenario.cuotas === input.cuotas;
                const years = scenario.cuotas / engine.CONFIG.MONTHS_PER_YEAR;
                return `<article class="escenario${selected ? " seleccionado" : ""}">${selected ? '<span class="etiqueta">Tu plazo</span>' : ""}<h3>${yearsLabel(years)}</h3><dl><dt>Cuota mensual</dt><dd>${money(scenario.cuota)}</dd><dt>Intereses totales</dt><dd>${money(scenario.interesesTotales)}</dd><dt>Total pagado</dt><dd>${money(scenario.totalCuotas)}</dd></dl></article>`;
            }).join("");
        return comparison;
    }

    function renderGraph(input, purchase) {
        const annual = engine.serieAnual({ capital: purchase.capitalHipotecario, tinAnual: input.tinAnual, cuotas: input.cuotas });
        if (annual.status === engine.STATUS.INVALID) return annual;
        const points = [{ ano: 0, saldoPendiente: purchase.capitalHipotecario }].concat(annual.serie);
        const width = 800, height = 320, left = 72, right = 24, top = 24, bottom = 48;
        const plotWidth = width - left - right, plotHeight = height - top - bottom;
        const coordinates = points.map(function (point, index) {
            const x = left + (index / Math.max(1, points.length - 1)) * plotWidth;
            const y = top + (1 - point.saldoPendiente / purchase.capitalHipotecario) * plotHeight;
            return { x, y };
        });
        const line = coordinates.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
        const area = `${line} L${coordinates[coordinates.length - 1].x},${top + plotHeight} L${left},${top + plotHeight} Z`;
        const grid = [0, .25, .5, .75, 1].map(function (fraction) {
            const y = top + fraction * plotHeight;
            const value = purchase.capitalHipotecario * (1 - fraction);
            return `<line class="grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text x="${left - 8}" y="${y + 4}" text-anchor="end">${safeFormat(number, value)}</text>`;
        }).join("");
        const graph = document.getElementById("grafico-saldo");
        graph.querySelectorAll("svg").forEach(svg => svg.remove());
        graph.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><defs><linearGradient id="areaSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".28"></stop><stop offset="1" stop-color="#2563eb" stop-opacity=".03"></stop></linearGradient></defs>${grid}<path class="area" d="${area}"></path><path class="linea" d="${line}"></path><text x="${left}" y="${height - 15}">Inicio</text><text x="${width - right}" y="${height - 15}" text-anchor="end">${input.plazoAnos} años</text></svg>`);
        document.getElementById("grafico-descripcion").textContent = `El saldo parte de ${money(purchase.capitalHipotecario)} y desciende hasta ${money(annual.serie[annual.serie.length - 1].saldoPendiente)} tras ${yearsLabel(input.plazoAnos)}. La serie contiene ${annual.serie.length} cierres anuales o periodos finales.`;
        return annual;
    }

    function renderSchedule(schedule) {
        document.getElementById("cuerpo-amortizacion").innerHTML = schedule.filas.map(function (row) {
            return `<tr><th scope="row">${row.numeroCuota}</th><td>${money(row.saldoInicial)}</td><td>${money(row.intereses)}</td><td>${money(row.capitalAmortizado)}</td><td>${money(row.cuota)}</td><td>${money(row.saldoFinal)}</td></tr>`;
        }).join("");
    }

    function optionCard(title, entries) {
        return `<article class="opcion-amortizacion"><h3>${title}</h3><dl>${entries.map(entry => `<dt>${entry[0]}</dt><dd>${entry[1]}</dd>`).join("")}</dl></article>`;
    }

    function renderPrepayment() {
        const errorElement = document.getElementById("error-amortizacion");
        const output = document.getElementById("resultado-amortizacion");
        errorElement.textContent = "";
        output.replaceChildren();
        if (!state.input) { errorElement.textContent = "Calcula primero la hipoteca."; return false; }
        const amount = Number(document.getElementById("cantidad-amortizar").value);
        const years = Number(document.getElementById("momento-amortizacion").value);
        const commission = Number(document.getElementById("comision-amortizacion").value);
        if (![amount, years, commission].every(Number.isFinite) || amount <= 0 || years < 0 || !Number.isInteger(years) || commission < 0) {
            errorElement.textContent = "Introduce una cantidad positiva, años completos no negativos y una comisión válida."; return false;
        }
        const elapsed = years * engine.CONFIG.MONTHS_PER_YEAR;
        if (elapsed >= state.input.cuotas) { errorElement.textContent = "El momento debe ser anterior al final del préstamo."; return false; }
        const result = engine.compararAmortizacionTrasCuotas({
            capital: state.purchase.capitalHipotecario, tinAnual: state.input.tinAnual, cuotas: state.input.cuotas,
            cuotasTranscurridas: elapsed, importeAmortizacion: amount, comision: commission
        });
        if (result.status === engine.STATUS.INVALID) { errorElement.textContent = messageFromCore(result); return false; }
        const payment = result.reducirCuota, term = result.reducirPlazo;
        output.innerHTML = optionCard("Reducir cuota", [
            ["Cuota antes", money(payment.cuotaAnterior)], ["Cuota después", money(payment.cuotaNueva)],
            ["Intereses futuros", money(payment.interesesFuturosDespues)], ["Ahorro bruto", money(payment.ahorroBrutoIntereses)],
            ["Comisión introducida", money(payment.comision)], ["Ahorro neto", money(payment.ahorroNeto)]
        ]) + optionCard("Reducir plazo", [
            ["Cuota de referencia", money(term.cuotaReferencia)], ["Nuevo plazo", durationLabel(term.nuevoPlazo.anosCompletos, term.nuevoPlazo.mesesRestantes)],
            ["Cuotas ahorradas", `${term.cuotasAhorradas}`], ["Intereses futuros", money(term.interesesFuturosDespues)],
            ["Ahorro bruto", money(term.ahorroBrutoIntereses)], ["Comisión introducida", money(term.comision)], ["Ahorro neto", money(term.ahorroNeto)]
        ]);
        return true;
    }

    function calculate(options) {
        formError.textContent = "";
        const read = readMainInputs();
        if (read.error) {
            formError.textContent = "Revisa los campos señalados.";
            read.firstInvalid.focus();
            results.hidden = true;
            return false;
        }
        const input = read.data;
        const purchase = engine.calcularCapitalCompra({ precioVivienda: input.precioVivienda, entrada: input.entrada });
        if (purchase.status === engine.STATUS.INVALID) {
            const message = messageFromCore(purchase);
            setFieldError(fields.entrada, message);
            formError.textContent = message;
            document.getElementById(fields.entrada.id).focus();
            results.hidden = true;
            return false;
        }
        const summary = engine.resumirPrestamo({ capital: purchase.capitalHipotecario, tinAnual: input.tinAnual, cuotas: input.cuotas });
        const schedule = engine.cuadroAmortizacion({ capital: purchase.capitalHipotecario, tinAnual: input.tinAnual, cuotas: input.cuotas });
        if (summary.status === engine.STATUS.INVALID || schedule.status === engine.STATUS.INVALID) {
            formError.textContent = messageFromCore(summary.status === engine.STATUS.INVALID ? summary : schedule);
            results.hidden = true;
            return false;
        }
        state.input = input; state.purchase = purchase; state.summary = summary; state.schedule = schedule;
        renderPrimary(input, purchase, summary);
        const savings = renderSavings(input, purchase);
        const comparison = renderComparison(input, purchase);
        const graph = renderGraph(input, purchase);
        if ([savings, comparison, graph].some(result => result.status === engine.STATUS.INVALID)) {
            formError.textContent = "No se han podido generar todos los resultados."; results.hidden = true; return false;
        }
        renderSchedule(schedule);
        document.getElementById("resultado-amortizacion").replaceChildren();
        document.getElementById("error-amortizacion").textContent = "";
        results.hidden = false;
        if (!options || options.focus !== false) results.focus({ preventScroll: true });
        return true;
    }

    function resetAll() {
        Object.values(fields).forEach(function (definition) {
            const input = document.getElementById(definition.id);
            input.value = "";
            clearFieldError(definition);
        });
        document.getElementById("tipo-vivienda").selectedIndex = 0;
        ["cantidad-amortizar", "momento-amortizacion", "comision-amortizacion"].forEach(id => { document.getElementById(id).value = ""; });
        formError.textContent = "";
        document.getElementById("error-amortizacion").textContent = "";
        document.getElementById("resultado-amortizacion").replaceChildren();
        document.getElementById("metricas-principales").replaceChildren();
        document.getElementById("comparacion-plazos").replaceChildren();
        document.getElementById("cuerpo-amortizacion").replaceChildren();
        document.getElementById("resumen-dinero").replaceChildren();
        document.getElementById("lista-incluido").replaceChildren();
        document.getElementById("lista-pendiente").replaceChildren();
        document.getElementById("grafico-saldo").querySelectorAll("svg").forEach(svg => svg.remove());
        document.getElementById("grafico-descripcion").textContent = "";
        document.getElementById("opciones-avanzadas").open = false;
        document.getElementById("detalle-amortizacion").open = false;
        document.getElementById("detalle-anticipada").open = false;
        results.hidden = true;
        state.input = null; state.purchase = null; state.summary = null; state.schedule = null;
        document.getElementById("precio-vivienda").focus();
    }

    form.addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
    form.addEventListener("reset", function (event) { event.preventDefault(); resetAll(); });
    mortgageButton.addEventListener("click", renderPrepayment);
    Object.values(fields).forEach(function (definition) {
        document.getElementById(definition.id).addEventListener("input", function () { clearFieldError(definition); });
    });

    window.HipotecaUI = Object.freeze({ calculate, reset: resetAll, renderPrepayment, state });
}());
