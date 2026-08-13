(function () {
    "use strict";

    const engine = globalThis.InflationEngine;
    const form = document.getElementById("form-inflacion");
    if (!engine || !form) return;

    const MODES = Object.freeze({
        purchasing_power: Object.freeze({ prefix: "power", engineMode: engine.MODE.PURCHASING_POWER }),
        real_value: Object.freeze({ prefix: "real", engineMode: engine.MODE.REAL_VALUE }),
        compare: Object.freeze({ prefix: "compare", engineMode: engine.MODE.COMPARE_WITH_INFLATION })
    });
    const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const percent = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const factorFormat = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    let activeMode = "purchasing_power";

    const byId = id => document.getElementById(id);
    const currentPanel = () => byId(`panel-${activeMode}`);
    const raw = id => byId(id).value.trim();
    function parseLocalized(id) {
        const text = raw(id);
        if (text === "") return undefined;
        if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return NaN;
        return Number(text.replace(",", "."));
    }
    function signed(value, formatter) {
        if (Math.abs(value) < 5e-15) return formatter.format(0);
        return `${value > 0 ? "+" : "−"}${formatter.format(Math.abs(value))}`;
    }
    function euro(value) {
        const parts = money.formatToParts(value);
        if (!parts.some(part => part.type === "group")) {
            const integer = parts.find(part => part.type === "integer");
            if (integer && integer.value.length > 3) integer.value = integer.value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        return parts.map(part => part.value).join("");
    }
    const pct = (value, withSign) => withSign ? signed(value, percent) : percent.format(value);
    function periodText(value, unit) {
        const singular = unit === "months" ? "mes" : "año";
        const plural = unit === "months" ? "meses" : "años";
        return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 10 }).format(value)} ${value === 1 ? singular : plural}`;
    }
    function metric(label, value, detail, valueClass) {
        return `<dl class="metrica"><dt>${label}</dt><dd${valueClass ? ` class="${valueClass}"` : ""}>${value}${detail ? `<span class="detalle">${detail}</span>` : ""}</dd></dl>`;
    }
    const semanticClass = value => value > 0 ? "positivo" : value < 0 ? "negativo" : "";
    function track(action) {
        if (typeof globalThis.gtag === "function") globalThis.gtag("event", action, { tool_name: "inflation", mode: activeMode });
    }

    function clearErrors() {
        form.querySelectorAll("[aria-invalid=true]").forEach(field => field.removeAttribute("aria-invalid"));
        form.querySelectorAll(".error-campo").forEach(output => { output.textContent = ""; });
        byId("resumen-errores").hidden = true;
        byId("resumen-errores").textContent = "";
    }
    function showError(id, message) {
        const field = byId(id), output = byId(`${id}-error`);
        if (!field || !output || field.getAttribute("aria-invalid") === "true") return false;
        field.setAttribute("aria-invalid", "true");
        output.textContent = message;
        return true;
    }
    function showSummary(count) {
        const summary = byId("resumen-errores");
        summary.textContent = count === 1 ? "Revisa el campo indicado." : `Revisa los ${count} campos indicados.`;
        summary.hidden = false;
    }
    function hideResult() {
        byId("resultados").hidden = true;
        byId("resultado-principal").innerHTML = "";
        byId("metricas").innerHTML = "";
        byId("nota-deflacion").hidden = true;
        byId("transicion-resultado").hidden = true;
    }
    function validateNumber(id, label, positive) {
        const value = parseLocalized(id);
        let message = "";
        if (value === undefined) message = `Introduce ${label}.`;
        else if (!Number.isFinite(value)) message = `${label} debe ser un número válido.`;
        else if (positive ? value <= 0 : value < 0) message = positive ? `${label} debe ser mayor que cero.` : `${label} no puede ser negativo.`;
        return message ? { value, error: showError(id, message) ? 1 : 0 } : { value, error: 0 };
    }
    function validateRate(id) {
        const value = parseLocalized(id);
        let message = "";
        if (value === undefined) message = "Introduce la inflación anual.";
        else if (!Number.isFinite(value)) message = "La inflación debe ser un número válido.";
        else if (value <= -100) message = "La inflación debe ser superior a −100 %.";
        return message ? { value, error: showError(id, message) ? 1 : 0 } : { value, error: 0 };
    }
    function validatePeriod(prefix) {
        return validateNumber(`${prefix}-period`, "un periodo", false);
    }
    function buildInput() {
        clearErrors();
        const prefix = MODES[activeMode].prefix;
        const rate = validateRate(`${prefix}-rate`);
        const period = validatePeriod(prefix);
        let errors = rate.error + period.error;
        const unit = byId(`${prefix}-unit`).value;
        const years = period.value === undefined ? undefined : unit === "months" ? period.value / 12 : period.value;
        if (activeMode === "compare") {
            const initial = validateNumber("compare-initial", "el valor inicial", true);
            const final = validateNumber("compare-final", "el valor final", false);
            errors += initial.error + final.error;
            return { errors, input: { initialAmount: initial.value, finalAmount: final.value, inflationRate: rate.value / 100, years }, period: period.value, unit };
        }
        const amount = validateNumber(`${prefix}-amount`, activeMode === "real_value" ? "la cantidad nominal" : "la cantidad actual", false);
        errors += amount.error;
        return { errors, input: { amount: amount.value, inflationRate: rate.value / 100, years }, period: period.value, unit };
    }
    function mapEngineErrors(result) {
        const prefix = MODES[activeMode].prefix;
        const fields = {
            amount: `${prefix}-amount`, initialAmount: "compare-initial", finalAmount: "compare-final",
            inflationRate: `${prefix}-rate`, years: `${prefix}-period`, result: `${prefix}-rate`
        };
        const messages = {
            missing: "Este dato es obligatorio.", not_finite_number: "Introduce un número válido.",
            must_be_above_minus_one: "La inflación debe ser superior a −100 %.", must_be_positive: "Debe ser mayor que cero.",
            must_be_non_negative: "No puede ser negativo.", non_finite_or_underflow: "La combinación es demasiado extrema para calcularse.",
            not_finite: "La combinación es demasiado grande para calcularse."
        };
        let count = 0;
        (result.errors || []).forEach(error => {
            const id = fields[error.field];
            if (id && showError(id, messages[error.code] || "Revisa este dato.")) count += 1;
        });
        return Math.max(count, 1);
    }

    function principal(step, heading, value, description, tone) {
        const output = byId("resultado-principal");
        output.className = `resultado-principal ${tone}`;
        output.innerHTML = `<p class="paso">${step}</p><h2>${heading}</h2><strong class="resultado-valor">${value}</strong><p>${description}</p>`;
    }
    function renderPower(result, collected) {
        principal("Resultado", "Necesitarías", euro(result.futureEquivalent), `Para conservar aproximadamente el poder adquisitivo de ${euro(result.amount)} tras ${periodText(collected.period,collected.unit)} con una inflación anual del ${pct(result.inflationRate,false)}.`, "neutral");
        byId("metricas").innerHTML = [
            metric("Inflación acumulada",pct(result.cumulativeInflation,true),"Durante todo el periodo",semanticClass(result.cumulativeInflation)),
            metric(`Valor real de ${euro(result.amount)}`,euro(result.realValue),"En euros del inicio"),
            metric("Cambio de poder adquisitivo",pct(result.purchasingPowerChange,true),result.purchasingPowerStatus===engine.POWER_STATUS.GAINED?"Poder adquisitivo ganado":result.purchasingPowerStatus===engine.POWER_STATUS.LOST?"Poder adquisitivo perdido":"Sin cambio",semanticClass(result.purchasingPowerChange))
        ].join("");
    }
    function renderReal(result, collected) {
        const powerLabel = result.purchasingPowerStatus===engine.POWER_STATUS.GAINED?"Ganancia de poder adquisitivo":result.purchasingPowerStatus===engine.POWER_STATUS.LOST?"Pérdida de poder adquisitivo":"Sin cambio de poder adquisitivo";
        principal("Resultado", "Valor real aproximado", euro(result.realValue), `Ese importe tendría aproximadamente el poder adquisitivo de ${euro(result.realValue)} en euros del inicio, tras ${periodText(collected.period,collected.unit)}.`, "neutral");
        byId("metricas").innerHTML = [
            metric("Factor inflacionario",factorFormat.format(result.inflationFactor),"Multiplicador del nivel de precios"),
            metric("Inflación acumulada",pct(result.cumulativeInflation,true),"Durante todo el periodo",semanticClass(result.cumulativeInflation)),
            metric(powerLabel,pct(result.purchasingPowerChange,true),"Respecto al importe nominal",semanticClass(result.purchasingPowerChange))
        ].join("");
    }
    function renderCompare(result) {
        const copy = result.comparisonStatus === engine.COMPARISON_STATUS.ABOVE
            ? { heading:"Has ganado poder adquisitivo", label:"Por encima de la inflación", tone:"positive" }
            : result.comparisonStatus === engine.COMPARISON_STATUS.BELOW
                ? { heading:"Has perdido poder adquisitivo", label:"Por debajo de la inflación", tone:"negative" }
                : { heading:"Has mantenido aproximadamente tu poder adquisitivo", label:"Igual que la inflación", tone:"neutral" };
        principal(copy.label,copy.heading,pct(result.realChange,true),`${euro(result.initialAmount)} pasaron a ${euro(result.finalAmount)}. La comparación descuenta la inflación acumulada del periodo.`,copy.tone);
        byId("metricas").innerHTML = [
            metric("Subida nominal",pct(result.nominalChange,true),"Antes de descontar inflación",semanticClass(result.nominalChange)),
            metric("Inflación acumulada",pct(result.cumulativeInflation,true),"Durante todo el periodo",semanticClass(result.cumulativeInflation))
        ].join("");
        byId("transicion-resultado").hidden = false;
    }
    function renderResult(result, collected) {
        if (activeMode === "purchasing_power") renderPower(result,collected);
        else if (activeMode === "real_value") renderReal(result,collected);
        else renderCompare(result);
        byId("nota-deflacion").hidden = result.priceStatus !== engine.PRICE_STATUS.DEFLATION;
        byId("resultados").hidden = false;
        byId("resultados").focus({ preventScroll:true });
        byId("resultados").scrollIntoView({ behavior:"smooth", block:"start" });
    }
    function calculate(event) {
        event.preventDefault();
        const collected = buildInput();
        if (collected.errors) {
            showSummary(collected.errors); currentPanel().querySelector("[aria-invalid=true]")?.focus(); hideResult(); return;
        }
        const result = engine.calculateInflationImpact(MODES[activeMode].engineMode,collected.input);
        if (result.status === engine.STATUS.INVALID_INPUT) {
            const count = mapEngineErrors(result); showSummary(count); currentPanel().querySelector("[aria-invalid=true]")?.focus(); hideResult(); return;
        }
        renderResult(result,collected); track("inflation_calculated");
    }
    function selectMode(mode, focusTab) {
        if (!MODES[mode]) return;
        activeMode = mode;
        document.querySelectorAll("[role=tab]").forEach(tab => {
            const selected = tab.dataset.mode === mode;
            tab.setAttribute("aria-selected",String(selected)); tab.tabIndex = selected ? 0 : -1;
            if (selected && focusTab) tab.focus();
        });
        document.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== mode; });
        clearErrors(); hideResult();
    }
    function resetUI() {
        globalThis.setTimeout(() => {
            clearErrors(); hideResult(); currentPanel().querySelector("input")?.focus(); track("inflation_reset");
        },0);
    }
    function handleTabKey(event) {
        const tabs = Array.from(document.querySelectorAll("[role=tab]"));
        const index = tabs.indexOf(event.currentTarget);
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index+1)%tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index-1+tabs.length)%tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length-1;
        if (next !== null) { event.preventDefault(); selectMode(tabs[next].dataset.mode,true); }
    }
    document.querySelectorAll("[role=tab]").forEach(tab => {
        tab.addEventListener("click",() => selectMode(tab.dataset.mode,false));
        tab.addEventListener("keydown",handleTabKey);
    });
    form.addEventListener("submit",calculate);
    form.addEventListener("reset",resetUI);
    form.addEventListener("input",hideResult);
    form.addEventListener("change",hideResult);
    globalThis.InflationUI = Object.freeze({ parseLocalized, buildInput, selectMode, calculate, resetUI, euro, pct, getMode:()=>activeMode });
}());
