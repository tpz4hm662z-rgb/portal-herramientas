"use strict";

(function () {
    const core = window.ImoancyIndemnizacionCore;
    const form = document.getElementById("formIndemnizacion");
    const resultPanel = document.getElementById("resultPanel");
    const resultContent = document.getElementById("resultContent");
    const extrasList = document.getElementById("extrasList");
    const extrasSection = document.getElementById("extrasSection");
    const prorationGroup = document.getElementById("extraProrationGroup");
    const typeInfo = document.getElementById("typeInfo");
    let extraSequence = 0;
    let hasResult = false;

    const typeLabels = {
        UNFAIR_DISMISSAL: "Despido improcedente",
        OBJECTIVE_DISMISSAL: "Extinción objetiva",
        COLLECTIVE_DISMISSAL_BASE: "Despido colectivo — mínimo legal base"
    };
    const moneyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true });
    const numberFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: true });

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function formatMoney(value) {
        let formatted = moneyFormatter.format(value);
        if (Math.abs(value) >= 1000 && Math.abs(value) < 10000 && !/[.\s\u00a0\u202f]\d{3}/.test(formatted)) {
            const negative = value < 0 ? "-" : "";
            const fixed = Math.abs(value).toFixed(2).split(".");
            formatted = negative + fixed[0].slice(0, -3) + "." + fixed[0].slice(-3) + "," + fixed[1] + " €";
        }
        return formatted;
    }

    function parseMoney(raw) {
        if (typeof raw !== "string") return null;
        const value = raw.trim().replace(/[€\s\u00a0\u202f]/g, "");
        if (!value || /[eE+-]/.test(value)) return null;
        let normalized;
        if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,6})?$/.test(value)) normalized = value.replace(/\./g, "").replace(",", ".");
        else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,6})?$/.test(value)) normalized = value.replace(/,/g, "");
        else if (/^\d+(?:[.,]\d{1,6})?$/.test(value)) normalized = value.replace(",", ".");
        else return null;
        const number = Number(normalized);
        return Number.isFinite(number) ? number : null;
    }

    function selected(name) {
        const input = form.querySelector('[name="' + name + '"]:checked');
        return input ? input.value : null;
    }

    function setDescription(control, errorId, invalid) {
        const ids = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
        const next = ids.filter(function (id) { return id !== errorId; });
        if (invalid) next.push(errorId);
        control.setAttribute("aria-describedby", Array.from(new Set(next)).join(" "));
        control.setAttribute("aria-invalid", invalid ? "true" : "false");
    }

    function clearErrors() {
        form.querySelectorAll(".error-campo").forEach(function (node) { node.hidden = true; node.textContent = ""; });
        form.querySelectorAll('[aria-invalid="true"]').forEach(function (node) { node.setAttribute("aria-invalid", "false"); });
        document.getElementById("resumenErrores").hidden = true;
        document.getElementById("listaErrores").replaceChildren();
    }

    function showErrors(errors) {
        clearErrors();
        const summary = document.getElementById("resumenErrores");
        const list = document.getElementById("listaErrores");
        errors.forEach(function (error) {
            const errorNode = document.getElementById("error-" + error.field);
            const control = error.control || document.getElementById(error.field) || form.querySelector('[name="' + error.field + '"]');
            if (errorNode) { errorNode.textContent = error.message; errorNode.hidden = false; }
            if (control) setDescription(control, errorNode ? errorNode.id : "", true);
            const item = element("li");
            if (control && control.id) {
                const link = element("a", "", error.message); link.href = "#" + control.id;
                link.addEventListener("click", function (event) { event.preventDefault(); control.focus(); }); item.appendChild(link);
            } else item.textContent = error.message;
            list.appendChild(item);
        });
        summary.hidden = false;
        const first = errors[0] && (errors[0].control || document.getElementById(errors[0].field) || form.querySelector('[name="' + errors[0].field + '"]'));
        if (first) first.focus(); else summary.focus();
    }

    function resetResult() {
        hasResult = false;
        resultPanel.className = "panel resultado-panel estado-inicial";
        resultContent.replaceChildren(element("p", "resultado-placeholder", "Tu estimación aparecerá aquí cuando completes el formulario."));
    }

    function invalidateResult() {
        if (hasResult) resetResult();
    }

    function updateTypeInfo() {
        const type = selected("terminationType");
        typeInfo.replaceChildren();
        if (type === "NOT_SURE") {
            typeInfo.appendChild(element("strong", "", "La causa y la calificación cambian el cálculo."));
            typeInfo.appendChild(element("p", "", "Imoancy no puede determinar jurídicamente qué tipo corresponde. Elige improcedente solo como hipótesis; objetivo o colectivo presuponen que la extinción se considera procedente."));
            typeInfo.hidden = false;
        } else if (type === core.TERMINATION_TYPE.TEMPORARY_CONTRACT_EXPIRY) {
            typeInfo.appendChild(element("p", "", "Los contratos temporales pueden depender de su modalidad, fecha y otras circunstancias. No mostraremos una cifra automática."));
            typeInfo.hidden = false;
        } else typeInfo.hidden = true;
    }

    function updateSalaryMode() {
        const mode = selected("salaryMode");
        const label = document.getElementById("salaryAmountLabel");
        const help = document.getElementById("salaryHelp");
        const amount = document.getElementById("salaryAmount");
        if (mode === "ANNUAL") { label.textContent = "Salario bruto anual"; help.textContent = "Incluye la retribución bruta anual que corresponda para este cálculo."; amount.placeholder = "Ejemplo: 28.000"; }
        else if (mode === "DAILY") { label.textContent = "Salario bruto diario"; help.textContent = "Indica el salario bruto diario regulador si ya lo conoces."; amount.placeholder = "Ejemplo: 76,71"; }
        else { label.textContent = "Salario bruto mensual"; help.textContent = "Indica el importe bruto mensual, antes de impuestos."; amount.placeholder = "Ejemplo: 1.800"; }
        prorationGroup.hidden = mode !== "MONTHLY";
        if (mode !== "MONTHLY") extrasSection.hidden = true;
        else updateExtrasVisibility();
    }

    function updateExtrasVisibility() {
        extrasSection.hidden = !(selected("salaryMode") === "MONTHLY" && selected("extrasProrated") === "NO");
    }

    function addExtra() {
        extraSequence += 1;
        const row = element("div", "extra-row"); row.dataset.extraId = String(extraSequence);
        const field = element("div", "campo");
        const label = element("label", "", "Importe bruto de la paga extra " + (extrasList.children.length + 1));
        const id = "extraAmount" + extraSequence; label.htmlFor = id;
        const wrap = element("div", "importe-wrap");
        const input = element("input"); input.type = "text"; input.id = id; input.inputMode = "decimal"; input.autocomplete = "off"; input.placeholder = "Ejemplo: 1.800";
        const error = element("p", "error-campo"); error.id = "error-" + id; error.hidden = true;
        input.setAttribute("aria-describedby", error.id); wrap.append(input, element("span", "", "€")); field.append(label, wrap, error);
        const remove = element("button", "eliminar-extra", "Eliminar"); remove.type = "button"; remove.setAttribute("aria-label", "Eliminar paga extra " + (extrasList.children.length + 1));
        remove.addEventListener("click", function () { row.remove(); renumberExtras(); invalidateResult(); });
        input.addEventListener("input", invalidateResult); row.append(field, remove); extrasList.appendChild(row); input.focus();
    }

    function renumberExtras() {
        extrasList.querySelectorAll(".extra-row").forEach(function (row, index) {
            row.querySelector("label").textContent = "Importe bruto de la paga extra " + (index + 1);
            row.querySelector("button").setAttribute("aria-label", "Eliminar paga extra " + (index + 1));
        });
    }

    function collectInput() {
        const errors = [];
        const terminationType = selected("terminationType");
        if (!terminationType) errors.push({ field: "terminationType", control: form.querySelector('[name="terminationType"]'), message: "Selecciona la situación que quieres calcular." });
        if (terminationType === "NOT_SURE") return { informational: "NOT_SURE", errors: errors };
        if (terminationType === core.TERMINATION_TYPE.TEMPORARY_CONTRACT_EXPIRY) return { errors: errors, input: { terminationType: terminationType }, salaryMode: selected("salaryMode") };
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        if (!startDate) errors.push({ field: "startDate", message: "Indica la fecha de inicio." });
        if (!endDate) errors.push({ field: "endDate", message: "Indica la fecha de extinción." });
        if (startDate && endDate && endDate <= startDate) errors.push({ field: "endDate", message: endDate === startDate ? "La fecha de extinción debe ser posterior al inicio." : "La fecha de extinción no puede ser anterior al inicio." });
        const amount = parseMoney(document.getElementById("salaryAmount").value);
        if (amount === null || amount <= 0) errors.push({ field: "salaryAmount", message: "Introduce un salario válido mayor que cero." });
        const mode = selected("salaryMode");
        let salary;
        if (mode === "ANNUAL") salary = { type: core.SALARY_TYPE.ANNUAL, amount: amount };
        else if (mode === "DAILY") salary = { type: core.SALARY_TYPE.DAILY, amount: amount };
        else {
            const prorated = selected("extrasProrated");
            if (!prorated) errors.push({ field: "extrasProrated", control: form.querySelector('[name="extrasProrated"]'), message: "Indica si las pagas extra están prorrateadas." });
            if (prorated === "YES") salary = { type: core.SALARY_TYPE.MONTHLY_PRORATED, amount: amount };
            else if (prorated === "NO") {
                const extras = [];
                if (!extrasList.children.length) errors.push({ field: "extraPayments", control: document.getElementById("addExtra"), message: "Añade al menos una paga extra o indica que tienes las pagas prorrateadas." });
                extrasList.querySelectorAll("input").forEach(function (input) {
                    const extra = parseMoney(input.value);
                    if (extra === null || extra < 0) errors.push({ field: input.id, control: input, message: "Introduce un importe de paga extra válido." }); else extras.push(extra);
                });
                salary = { type: core.SALARY_TYPE.MONTHLY_PLUS_EXTRA_PAYMENTS, amount: amount, extraPayments: extras };
            }
        }
        return { errors: errors, input: { terminationType: terminationType, servicePattern: core.SERVICE_PATTERN.CONTINUOUS, startDate: startDate, endDate: endDate, salary: salary }, salaryMode: mode };
    }

    function metric(label, value) {
        const wrapper = element("div", "metrica"); wrapper.append(element("dt", "", label), element("dd", "", value)); return wrapper;
    }

    function humanService(months) {
        const years = Math.floor(months / 12), rest = months % 12, parts = [];
        if (years) parts.push(years + (years === 1 ? " año" : " años"));
        if (rest) parts.push(rest + (rest === 1 ? " mes" : " meses"));
        return (parts.length ? parts.join(" y ") : "Menos de un mes") + " computados";
    }

    function warningBox(title, text) {
        const box = element("div", "resultado-aviso"); box.append(element("h3", "", title), element("p", "", text)); return box;
    }

    function formatIsoDate(value) {
        const parts = value.split("-");
        return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

    function renderInformational(title, text) {
        hasResult = true; resultPanel.className = "panel resultado-panel estado-informativo";
        resultContent.replaceChildren(element("h2", "", title), element("p", "", text)); resultPanel.focus();
    }

    function renderResult(response) {
        const r = response.result;
        hasResult = true; resultPanel.className = "panel resultado-panel"; resultContent.replaceChildren();
        resultContent.append(element("p", "print-brand", "IMOANCY"), element("p", "resultado-kicker", "Indemnización legal estimada"), element("p", "resultado-cifra", formatMoney(r.grossIndemnity)), element("p", "resultado-intro", "Estimación basada en los datos y supuesto de extinción que has indicado."));
        const metrics = element("dl", "metricas");
        metrics.append(metric("Tipo de cálculo", typeLabels[r.terminationType]), metric("Antigüedad", humanService(r.period.serviceMonths)), metric("Salario anual utilizado", formatMoney(r.salary.annualGross)), metric("Salario diario regulador", formatMoney(r.salary.dailyGross)), metric("Días antes del límite", numberFormatter.format(r.rawIndemnityDays)), metric("Días computados", numberFormatter.format(r.indemnityDays)), metric("Importe antes del límite", formatMoney(r.rawIndemnityDays * r.salary.dailyGross)), metric("Límite legal", r.capApplied ? "Aplicado" : "No alcanzado"));
        resultContent.appendChild(metrics);
        if (r.terminationType === core.TERMINATION_TYPE.OBJECTIVE_DISMISSAL) resultContent.appendChild(warningBox("Supuesto objetivo", "El cálculo parte de que la extinción objetiva se considera procedente."));
        if (response.warnings.indexOf(core.WARNING.COLLECTIVE_MINIMUM_ONLY) >= 0) resultContent.appendChild(warningBox("Mínimo legal base", "En un despido colectivo pueden existir acuerdos o mejoras que modifiquen la cuantía final."));
        if (r.capApplied) resultContent.appendChild(warningBox("Se ha aplicado el límite legal", "Los días generados antes del límite se han reducido a los días finalmente computados."));
        if (response.warnings.indexOf(core.WARNING.TRANSITIONAL_RULE_APPLIED) >= 0) {
            const postSegment = r.segments.find(function (segment) { return segment.code === "POST_2012"; });
            const cutoffDate = postSegment ? postSegment.startDate : core.NORMATIVA.transitionDate;
            const cutoff = formatIsoDate(cutoffDate);
            const cutoffYear = cutoffDate.slice(0, 4);
            const section = element("section", "segmentos"); section.appendChild(element("h2", "", "Tu antigüedad atraviesa el cambio legal de " + cutoffYear));
            section.appendChild(element("p", "resultado-intro", "El cálculo se divide en dos periodos, prorrateados por separado."));
            r.segments.forEach(function (segment) {
                const box = element("div", "segmento");
                box.append(element("h3", "", segment.code === "PRE_2012" ? "Periodo anterior al " + cutoff : "Periodo desde " + cutoff), element("p", "", segment.serviceMonths + " meses computados"), element("p", "", numberFormatter.format(segment.rawIndemnityDays) + " días generados · " + numberFormatter.format(segment.allowedIndemnityDays) + " días incluidos")); section.appendChild(box);
            });
            if (response.warnings.indexOf(core.WARNING.POST_TRANSITION_SERVICE_EXCLUDED_BY_CAP) >= 0) section.appendChild(warningBox("El periodo posterior no aumenta el resultado", "Ya se alcanza el límite aplicable según la regla transitoria."));
            resultContent.appendChild(section);
        }
        const difference = element("section", "diferencia-box"); difference.append(element("h2", "", "Indemnización y finiquito no son lo mismo"), element("p", "", "La indemnización compensa determinados tipos de extinción. El finiquito liquida cantidades pendientes como salario, vacaciones o pagas extra."));
        const link = element("a", "", "Calcular mi finiquito →"); link.href = "https://imoancy.com/herramientas/calculadora-finiquito/"; difference.appendChild(link); resultContent.appendChild(difference);
        const actions = element("div", "resultado-acciones"); const print = element("button", "boton-imprimir", "Imprimir resultado"); print.type = "button"; print.addEventListener("click", function () { window.print(); }); actions.appendChild(print); resultContent.appendChild(actions); resultPanel.focus();
    }

    function sendEvent(name, values) {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", name, { tool_name: "indemnity", termination_type: values && values.terminationType || "", salary_input_mode: values && values.salaryMode || selected("salaryMode") || "" });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault(); clearErrors(); invalidateResult();
        const collected = collectInput();
        if (collected.errors.length) { showErrors(collected.errors); return; }
        if (collected.informational === "NOT_SURE") { renderInformational("Primero necesitas elegir una hipótesis", "La indemnización depende de la causa y calificación de la extinción. Imoancy no puede determinar jurídicamente qué tipo corresponde a tu caso."); return; }
        const response = core.calculateIndemnity(collected.input);
        if (response.status === core.STATUS.OK) { renderResult(response); sendEvent("indemnity_calculated", { terminationType: collected.input.terminationType, salaryMode: collected.salaryMode }); }
        else if (response.status === core.STATUS.REQUIRES_SPECIAL_ANALYSIS) renderInformational("Este caso necesita un análisis más específico", "En los contratos temporales la indemnización puede depender de la modalidad, fecha y otras circunstancias. Esta versión no muestra una cifra automática para evitar un resultado que podría no corresponder.");
        else if (response.status === core.STATUS.UNSUPPORTED_CASE) renderInformational("Esta situación no está incluida", "Esta versión no ofrece un cálculo automático para este patrón o tipo de relación laboral.");
        else showErrors(response.errors.map(function (error) { return { field: error.field.replace(/^salary\.amount$/, "salaryAmount"), message: error.message }; }));
    });

    form.addEventListener("input", invalidateResult);
    form.addEventListener("change", function (event) {
        invalidateResult();
        if (event.target.name === "terminationType") updateTypeInfo();
        if (event.target.name === "salaryMode") updateSalaryMode();
        if (event.target.name === "extrasProrated") updateExtrasVisibility();
    });
    form.addEventListener("reset", function () {
        window.setTimeout(function () { extrasList.replaceChildren(); extraSequence = 0; clearErrors(); resetResult(); updateTypeInfo(); updateSalaryMode(); sendEvent("indemnity_reset", { terminationType: "", salaryMode: selected("salaryMode") }); }, 0);
    });
    document.getElementById("addExtra").addEventListener("click", addExtra);
    updateSalaryMode();
}());
