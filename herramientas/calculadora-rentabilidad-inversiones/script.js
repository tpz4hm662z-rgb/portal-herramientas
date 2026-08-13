(function () {
    "use strict";

    const engine = globalThis.InvestmentReturnEngine;
    const $ = selector => document.querySelector(selector);
    const form = $("#form-rentabilidad");
    const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
    const percent = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const multipleFormat = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let movementSequence = 0;

    function todayLocal() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    function raw(id) { return document.getElementById(id).value.trim(); }
    function numberOrMissing(id) { const text = raw(id); return text === "" ? undefined : Number(text); }
    function signed(value, formatter) {
        if (Math.abs(value) < 1e-14) return formatter.format(0);
        return `${value > 0 ? "+" : "−"}${formatter.format(Math.abs(value))}`;
    }
    function euro(value, withSign) { return withSign ? signed(value, money) : money.format(value); }
    function pct(value, withSign) { return withSign ? signed(value, percent) : percent.format(value); }
    function metric(label, value, detail, valueClass) {
        return `<dl class="metrica"><dt>${label}</dt><dd${valueClass ? ` class="${valueClass}"` : ""}>${value}${detail ? `<span class="detalle">${detail}</span>` : ""}</dd></dl>`;
    }
    function valueClass(value) { return value > 0 ? "positivo" : value < 0 ? "negativo" : ""; }
    function durationText(startText, endText) {
        const start = new Date(`${startText}T00:00:00Z`), end = new Date(`${endText}T00:00:00Z`);
        let years = end.getUTCFullYear() - start.getUTCFullYear();
        let months = end.getUTCMonth() - start.getUTCMonth();
        if (end.getUTCDate() < start.getUTCDate()) months -= 1;
        if (months < 0) { years -= 1; months += 12; }
        const parts = [];
        if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
        if (months) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
        return parts.length ? parts.join(" y ") : "menos de un mes";
    }
    function track(action) {
        if (typeof globalThis.gtag === "function") globalThis.gtag("event", action, { tool_name: "investment_return" });
    }
    function clearErrors() {
        form.querySelectorAll("[aria-invalid=true]").forEach(field => field.removeAttribute("aria-invalid"));
        form.querySelectorAll(".error-campo").forEach(error => { error.textContent = ""; });
        const summary = $("#resumen-errores"); summary.hidden = true; summary.textContent = "";
    }
    function showError(id, message) {
        const field = document.getElementById(id), output = document.getElementById(`error-${id}`);
        if (!field || !output) return;
        field.setAttribute("aria-invalid", "true"); output.textContent = message;
    }
    function showSummary(count) {
        const summary = $("#resumen-errores");
        summary.textContent = count === 1 ? "Revisa el campo indicado." : `Revisa los ${count} campos indicados.`;
        summary.hidden = false;
    }
    function validateBase() {
        clearErrors();
        let count = 0;
        const requiredNumber = (id, label, positive) => {
            const text = raw(id), value = Number(text);
            let message = "";
            if (text === "") message = `Introduce ${label}.`;
            else if (!Number.isFinite(value)) message = `${label} debe ser un número válido.`;
            else if (positive ? value <= 0 : value < 0) message = positive ? `${label} debe ser mayor que cero.` : `${label} no puede ser negativo.`;
            if (message) { showError(id, message); count += 1; }
        };
        requiredNumber("initialInvestment", "la inversión inicial", true);
        requiredNumber("finalValue", "el valor actual o final", false);
        ["income", "costs"].forEach(id => {
            const value = numberOrMissing(id);
            if (value !== undefined && (!Number.isFinite(value) || value < 0)) { showError(id, "Introduce un importe válido igual o mayor que cero."); count += 1; }
        });
        const inflation = numberOrMissing("inflationRate");
        if (inflation !== undefined && (!Number.isFinite(inflation) || inflation <= -100)) { showError("inflationRate", "La inflación debe ser un porcentaje mayor que −100 %."); count += 1; }
        const start = raw("startDate"), end = raw("endDate");
        if (!start) { showError("startDate", "Introduce la fecha inicial."); count += 1; }
        if (!end) { showError("endDate", "Introduce la fecha de valoración."); count += 1; }
        if (start && end && end <= start) { showError("endDate", "La fecha de valoración debe ser posterior a la fecha inicial."); count += 1; }
        return count;
    }
    function movementRows() { return Array.from(document.querySelectorAll(".movimiento")); }
    function collectMovements(startDate, endDate) {
        const flows = [];
        let errors = 0;
        movementRows().forEach((row, index) => {
            const dateField = row.querySelector("[data-field=date]"), typeField = row.querySelector("[data-field=type]"), amountField = row.querySelector("[data-field=amount]");
            const date = dateField.value, text = amountField.value.trim(), amount = Number(text);
            const dateError = row.querySelector("[data-error=date]"), amountError = row.querySelector("[data-error=amount]");
            dateField.removeAttribute("aria-invalid"); amountField.removeAttribute("aria-invalid"); dateError.textContent = ""; amountError.textContent = "";
            if (!date) { dateField.setAttribute("aria-invalid", "true"); dateError.textContent = "Introduce la fecha."; errors += 1; }
            else if (date < startDate || date > endDate) { dateField.setAttribute("aria-invalid", "true"); dateError.textContent = "Debe estar entre las fechas principal y de valoración."; errors += 1; }
            if (text === "" || !Number.isFinite(amount) || amount <= 0) { amountField.setAttribute("aria-invalid", "true"); amountError.textContent = "Introduce un importe mayor que cero."; errors += 1; }
            if (date && date >= startDate && date <= endDate && text !== "" && Number.isFinite(amount) && amount > 0) flows.push({ date, amount: typeField.value === "contribution" ? -amount : amount, uiIndex: index });
        });
        return { flows, errors };
    }
    function buildInput() {
        const errorCount = validateBase();
        if (errorCount) return { input: null, errors: errorCount };
        const input = { initialInvestment: numberOrMissing("initialInvestment"), finalValue: numberOrMissing("finalValue"), startDate: raw("startDate"), endDate: raw("endDate") };
        const optional = { income: numberOrMissing("income"), costs: numberOrMissing("costs"), inflationRate: numberOrMissing("inflationRate") };
        Object.keys(optional).forEach(key => { if (optional[key] !== undefined) input[key] = key === "inflationRate" ? optional[key] / 100 : optional[key]; });
        const movements = collectMovements(input.startDate, input.endDate);
        if (movements.errors) return { input: null, errors: movements.errors };
        if (movements.flows.length) input.cashFlows = [{ date: input.startDate, amount: -input.initialInvestment }].concat(movements.flows.map(({ date, amount }) => ({ date, amount })), [{ date: input.endDate, amount: input.finalValue }]);
        return { input, errors: 0 };
    }
    function mapEngineErrors(result) {
        const messages = { missing: "Este dato es obligatorio.", not_finite: "Introduce un número válido.", must_be_positive: "Debe ser mayor que cero.", negative: "No puede ser negativo.", invalid_date: "Introduce una fecha válida.", must_be_after_start: "Debe ser posterior a la fecha inicial." };
        let mapped = 0;
        (result.errors || []).forEach(error => {
            const id = error.field === "endDate" ? "endDate" : error.field;
            if (document.getElementById(id)) { showError(id, messages[error.code] || "Revisa este dato."); mapped += 1; }
        });
        return Math.max(mapped, 1);
    }
    function renderPrincipal(result, hasCosts) {
        const panel = $("#resultado-principal");
        const meta = result.status === engine.STATUS.GAIN
            ? { className: "gain", eyebrow: "Resultado positivo", title: "Has ganado", symbol: "↑" }
            : result.status === engine.STATUS.LOSS
                ? { className: "loss", eyebrow: "Resultado negativo", title: "Has perdido", symbol: "↓" }
                : { className: "neutral", eyebrow: "Resultado neutral", title: "Sin ganancia ni pérdida", symbol: "=" };
        panel.className = `resultado-principal ${meta.className}`;
        panel.innerHTML = `<p class="paso">${meta.symbol} ${meta.eyebrow}</p><h2 id="resultado-titulo">${meta.title}</h2><strong class="resultado-importe">${euro(result.netProfit, true)}</strong><p>${hasCosts ? "Resultado después de descontar los costes que has indicado." : "Resultado según el valor, los ingresos y los datos que has indicado."}</p>`;
    }
    function renderXirr(result, hasMovements) {
        const section = $("#resultado-xirr");
        if (!hasMovements || result.xirrStatus === engine.XIRR_STATUS.NOT_APPLICABLE) { section.hidden = true; section.innerHTML = ""; return; }
        section.hidden = false;
        if (result.xirrStatus === engine.XIRR_STATUS.OK) {
            section.innerHTML = `<p class="paso">Movimientos con fecha</p><h2>Rentabilidad anualizada según tus movimientos</h2><p class="dato-xirr"><strong class="${valueClass(result.xirr)}">${pct(result.xirr, true)} anual</strong></p><p class="aclaracion">TIR con fechas reales: considera cuánto dinero aportaste o retiraste y cuándo ocurrió cada movimiento.</p>`;
        } else if (result.xirrStatus === engine.XIRR_STATUS.MULTIPLE) {
            section.innerHTML = `<p class="paso">Interpretación necesaria</p><h2>Tus movimientos producen más de una rentabilidad anualizada posible</h2><p class="mensaje-xirr">Cuando una inversión alterna varias veces entre aportaciones y cobros, puede existir más de una TIR matemática. No mostramos una única tasa porque podría ser engañosa.</p><details><summary>Ver soluciones matemáticas detectadas</summary><ul class="soluciones">${result.xirrRoots.map(root => `<li>${pct(root, true)} anual</li>`).join("")}</ul></details>`;
        } else {
            section.innerHTML = `<p class="paso">Movimientos con fecha</p><h2>No se puede obtener una rentabilidad anualizada fiable con estos movimientos</h2><p class="mensaje-xirr">El resto de métricas sigue siendo válido. Revisa la combinación y las fechas de tus aportaciones y cobros.</p>`;
        }
    }
    function renderAdvanced(result, input) {
        const hasIncome = Object.hasOwn(input, "income"), hasCosts = Object.hasOwn(input, "costs"), hasInflation = Object.hasOwn(input, "inflationRate"), hasMovements = Object.hasOwn(input, "cashFlows");
        const section = $("#resultados-avanzados"), grid = $("#metricas-avanzadas"), items = [];
        if (hasIncome || hasCosts) {
            items.push(metric("Beneficio antes de costes", euro(result.grossProfit, true), "Incluye ingresos indicados", valueClass(result.grossProfit)));
            items.push(metric("Rentabilidad bruta", pct(result.grossReturn, true), "Antes de costes", valueClass(result.grossReturn)));
        }
        if (hasCosts) {
            items.push(metric("Costes indicados", euro(input.costs, false)));
            items.push(metric("Beneficio después de costes", euro(result.netProfit, true), "No es neto fiscal", valueClass(result.netProfit)));
            items.push(metric("Rentabilidad neta de costes", pct(result.netReturn, true), "No incluye impuestos", valueClass(result.netReturn)));
        }
        const nominal = hasMovements ? result.xirr : result.cagr;
        if (hasInflation && nominal !== null) {
            items.push(metric("Rentabilidad anual nominal", pct(nominal, true), "Según valor o movimientos", valueClass(nominal)));
            if (result.realAnnualReturn !== null) items.push(metric("Rentabilidad anual real", pct(result.realAnnualReturn, true), "Descontada la inflación", valueClass(result.realAnnualReturn)));
        }
        section.hidden = items.length === 0; grid.innerHTML = items.join(""); $("#nota-real").hidden = !hasInflation || result.realAnnualReturn === null;
    }
    function renderResult(result, input) {
        renderPrincipal(result, Object.hasOwn(input, "costs"));
        const annual = Object.hasOwn(input, "cashFlows") ? result.xirr : result.cagr;
        $("#metricas-esenciales").innerHTML = [
            metric("Rentabilidad total", pct(result.totalReturn, true), "Valor frente a inversión inicial", valueClass(result.totalReturn)),
            metric(Object.hasOwn(input, "cashFlows") ? "Rentabilidad según movimientos" : "Rentabilidad anualizada", annual === null ? "No disponible" : `${pct(annual, true)} anual`, Object.hasOwn(input, "cashFlows") ? "TIR con fechas reales" : "CAGR Actual/365", annual === null ? "" : valueClass(annual)),
            metric("Multiplicador del valor", `${multipleFormat.format(result.multiple)}×`, "No incluye ingresos ni costes"),
            metric("Duración", durationText(input.startDate, input.endDate), `${result.durationDays} días`)
        ].join("");
        $("#warning-periodo").hidden = !result.warnings.includes(engine.WARNING.VERY_SHORT_PERIOD);
        renderXirr(result, Object.hasOwn(input, "cashFlows")); renderAdvanced(result, input);
        $("#resultados").hidden = false; $("#resultados").focus({ preventScroll: true }); $("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function calculate(event) {
        event.preventDefault();
        const collected = buildInput();
        if (!collected.input) { showSummary(collected.errors); form.querySelector("[aria-invalid=true]")?.focus(); $("#resultados").hidden = true; return; }
        const result = engine.calculateInvestmentReturn(collected.input);
        if (result.status === engine.STATUS.INVALID_INPUT) { const count = mapEngineErrors(result); showSummary(count); form.querySelector("[aria-invalid=true]")?.focus(); $("#resultados").hidden = true; return; }
        renderResult(result, collected.input); track("investment_return_calculated");
    }
    function movementTemplate(id) {
        return `<div class="movimiento" data-movement-id="${id}"><div class="campo"><label for="movement-date-${id}">Fecha</label><input type="date" id="movement-date-${id}" data-field="date" aria-describedby="movement-date-error-${id}"><p class="error-campo" id="movement-date-error-${id}" data-error="date"></p></div><div class="campo"><label for="movement-type-${id}">Tipo</label><select id="movement-type-${id}" data-field="type"><option value="contribution">Aportación</option><option value="withdrawal">Retirada / cobro</option></select></div><div class="campo"><label for="movement-amount-${id}">Importe <span class="unidad">€</span></label><input type="number" id="movement-amount-${id}" data-field="amount" inputmode="decimal" min="0" step="0.01" aria-describedby="movement-amount-error-${id}"><p class="error-campo" id="movement-amount-error-${id}" data-error="amount"></p></div><button type="button" class="eliminar-movimiento" aria-label="Eliminar movimiento ${id}">Eliminar</button></div>`;
    }
    function addMovement() { movementSequence += 1; $("#movimientos").insertAdjacentHTML("beforeend", movementTemplate(movementSequence)); $("#movimientos .movimiento:last-child [data-field=date]").focus(); }
    function resetUI() {
        globalThis.setTimeout(() => {
            clearErrors(); $("#movimientos").innerHTML = ""; movementSequence = 0; $("#endDate").value = todayLocal();
            ["#opciones-avanzadas", "#movimientos-bloque"].forEach(selector => { $(selector).open = false; selector && $(selector).querySelector("summary").setAttribute("aria-expanded", "false"); });
            $("#resultados").hidden = true; ["#resultado-principal", "#metricas-esenciales", "#resultado-xirr", "#metricas-avanzadas"].forEach(selector => { $(selector).innerHTML = ""; });
            $("#initialInvestment").focus(); track("investment_return_reset");
        }, 0);
    }
    function hideStaleResult() { if (!$("#resultados").hidden) $("#resultados").hidden = true; }
    function start() {
        if (!engine || !form) return;
        $("#endDate").value = todayLocal();
        form.addEventListener("submit", calculate); form.addEventListener("reset", resetUI); form.addEventListener("input", hideStaleResult); form.addEventListener("change", hideStaleResult);
        $("#anadir-movimiento").addEventListener("click", addMovement);
        $("#movimientos").addEventListener("click", event => { const button = event.target.closest(".eliminar-movimiento"); if (button) { button.closest(".movimiento").remove(); hideStaleResult(); } });
        document.querySelectorAll(".bloque-plegable").forEach(details => details.addEventListener("toggle", () => details.querySelector("summary").setAttribute("aria-expanded", String(details.open))));
        globalThis.RentabilidadUI = Object.freeze({ buildInput, calculate, addMovement, euro, pct, durationText, resetUI });
    }
    start();
}());
