/* Calculadora de Grasa Corporal PRO · Fase 2 · controlador UI */
"use strict";

(function () {
    const science = globalThis.ImoancyBodyFatScience;
    const tracking = globalThis.ImoancyBodyFatTracking;
    const storeFactory = globalThis.ImoancyBodyFatHistoryStore;
    const interpreter = globalThis.ImoancyBodyFatChangeInterpreter;
    if (!science || !tracking || !storeFactory || !interpreter) {
        console.error("No se han cargado los módulos de Grasa Corporal PRO.");
        return;
    }

    const state = { input: null, cun: null, rfm: null, waistCm: null, records: [], storageStatus: "UNKNOWN", saved: false };
    const el = {};
    let historyStore;

    function q(id) { return document.getElementById(id); }
    function show(node) { if (node) { node.classList.remove("oculto"); node.removeAttribute("hidden"); } }
    function hide(node) { if (node) node.classList.add("oculto"); }
    function number(value) { return typeof value === "string" && value.trim() !== "" ? Number(value.replace(",", ".")) : NaN; }
    function format(value, decimals) { return Number(value).toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }
    function signed(value, unit, decimals) {
        if (!Number.isFinite(value)) return "No disponible";
        if (Math.abs(value) < 1e-12) return `Sin cambio (${format(0, decimals)}${unit})`;
        return `${value > 0 ? "+" : "−"}${format(Math.abs(value), decimals)}${unit}`;
    }
    function safeStorage() {
        try { return window.localStorage; } catch (_) { return null; }
    }
    function preferredScrollBehavior() {
        try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }
        catch (_) { return "auto"; }
    }
    function roundSymmetrically(value) {
        return Math.sign(value) * Math.round(Math.abs(value));
    }

    function collectElements() {
        ["formularioHerramienta", "sexo", "edad", "altura", "peso", "errorSexo", "errorEdad", "errorAltura", "errorPeso",
            "botonCalcular", "botonReiniciar", "estadoCalculadora", "resultados", "resultadoPrincipal", "resultadoMasaGrasa",
            "resultadoMasaLibre", "resultadoImc", "botonMostrarCintura", "avisoRfmEdad", "botonGuardar", "panelCintura", "formularioCintura",
            "cinturaUno", "cinturaDos", "usarCinturaUno", "usarCinturaDos", "diferenciaLecturas", "errorCintura", "cerrarCintura", "resultadoRfm", "cunComparado", "rfmComparado",
            "explicacionMetodos", "panelGuardar", "tituloGuardar", "confirmarGuardar", "cancelarGuardar", "estadoGuardado", "avisoHistorial",
            "contadorMediciones", "botonVerEvolucion", "botonNuevaMedicion", "evolucion", "estadoHistorial", "comparador",
            "tipoComparacion", "explicacionCambio", "listaHistorial", "borrarHistorial"].forEach(id => { el[id] = q(id); });
        el.tituloResultados = q("titulo-resultados"); el.tituloCintura = q("titulo-cintura");
        el.tituloGuardar = q("titulo-guardar"); el.tituloEvolucion = q("titulo-evolucion");
        return Object.values(el).every(Boolean);
    }

    function setFieldError(field, message) {
        const input = el[field], error = el[`error${field[0].toUpperCase()}${field.slice(1)}`];
        if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
        if (error) error.textContent = message || "";
    }

    function validateQuick() {
        const values = { sex: el.sexo.value === "hombre" ? "male" : el.sexo.value === "mujer" ? "female" : "", ageYears: number(el.edad.value), heightCm: number(el.altura.value), weightKg: number(el.peso.value) };
        const rules = [
            ["sexo", values.sex, value => value === "male" || value === "female", "Selecciona una opción válida."],
            ["edad", values.ageYears, value => Number.isInteger(value) && value >= 18 && value <= 80, "Introduce una edad entera entre 18 y 80 años."],
            ["altura", values.heightCm, value => Number.isFinite(value) && value >= 120 && value <= 230, "Introduce una altura entre 120 y 230 cm."],
            ["peso", values.weightKg, value => Number.isFinite(value) && value >= 30 && value <= 300, "Introduce un peso entre 30 y 300 kg."]
        ];
        let firstInvalid = null;
        rules.forEach(([field, value, valid, message]) => {
            const ok = valid(value); setFieldError(field, ok ? "" : message); if (!ok && !firstInvalid) firstInvalid = el[field];
        });
        if (firstInvalid) { firstInvalid.focus(); return null; }
        return values;
    }

    function calculateQuick(event) {
        event.preventDefault();
        const input = validateQuick();
        if (!input) { el.estadoCalculadora.textContent = "Revisa los campos indicados."; return; }
        try {
            const result = science.calculateCunBae(input);
            state.input = input; state.cun = result; state.rfm = null; state.waistCm = null; state.saved = false;
            el.resultadoPrincipal.textContent = result.displayBodyFatPercent;
            el.resultadoMasaGrasa.textContent = format(result.fatMassKg, 1);
            el.resultadoMasaLibre.textContent = format(result.fatFreeMassKg, 1);
            el.resultadoImc.textContent = format(result.bmi, 1);
            el.cunComparado.textContent = result.displayBodyFatPercent;
            el.estadoCalculadora.textContent = "Estimación calculada.";
            el.botonGuardar.disabled = false;
            hide(el.panelGuardar); hide(el.panelCintura); hide(el.resultadoRfm); show(el.resultados); show(el.botonReiniciar);
            if (input.ageYears >= 20) { show(el.botonMostrarCintura); hide(el.avisoRfmEdad); }
            else { hide(el.botonMostrarCintura); show(el.avisoRfmEdad); }
            el.resultados.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
            el.tituloResultados.focus({ preventScroll: true });
        } catch (_) {
            el.estadoCalculadora.textContent = "No ha sido posible calcular con estos datos. Revisa los valores.";
        }
    }

    function updateWaistDifference() {
        const first = number(el.cinturaUno.value), secondRaw = el.cinturaDos.value.trim(), second = number(secondRaw);
        el.usarCinturaDos.disabled = !secondRaw;
        if (!secondRaw && el.usarCinturaDos.checked) el.usarCinturaUno.checked = true;
        el.diferenciaLecturas.textContent = Number.isFinite(first) && Number.isFinite(second)
            ? `Diferencia entre lecturas: ${format(Math.abs(first - second), 1)} cm. Elige cuál usar; no las promediamos ni aplicamos un umbral clínico.`
            : secondRaw
                ? "Completa ambas lecturas con valores válidos para compararlas."
                : "RFM usará la primera lectura. Puedes repetirla para comprobar tu técnica y elegir explícitamente cuál usar; nunca se promedian.";
    }

    function calculateWaist(event) {
        event.preventDefault();
        if (!state.cun || !state.input) return;
        const first = number(el.cinturaUno.value), secondRaw = el.cinturaDos.value.trim(), second = number(secondRaw);
        const firstInvalid = !Number.isFinite(first) || first < 40 || first > 200;
        const secondInvalid = Boolean(secondRaw) && (!Number.isFinite(second) || second < 40 || second > 200);
        if (firstInvalid || secondInvalid) {
            el.errorCintura.textContent = "Introduce lecturas entre 40 y 200 cm.";
            (firstInvalid ? el.cinturaUno : el.cinturaDos).focus();
            return;
        }
        const waistChoice = el.usarCinturaDos.checked ? "second" : "first";
        if (waistChoice === "second" && !Number.isFinite(second)) {
            el.errorCintura.textContent = "Añade una segunda lectura válida o selecciona la primera.";
            el.cinturaDos.focus();
            return;
        }
        const waistCm = waistChoice === "second" ? second : first;
        try {
            const result = science.calculateRfm({ ...state.input, waistCm });
            state.rfm = result; state.waistCm = waistCm; state.saved = false;
            el.errorCintura.textContent = ""; el.rfmComparado.textContent = result.displayBodyFatPercent;
            el.explicacionMetodos.textContent = `CUN-BAE utiliza peso/IMC, edad y sexo; RFM utiliza altura, cintura y sexo. La diferencia de ${format(Math.abs(state.cun.bodyFatPercent - result.bodyFatPercent), 1)} puntos es una discrepancia entre estimaciones, no un intervalo ni una razón para promediarlas.`;
            show(el.resultadoRfm); el.resultadoRfm.focus();
        } catch (error) {
            el.errorCintura.textContent = error && error.code === "OUTSIDE_METHOD_POPULATION"
                ? "RFM se validó desde los 20 años; no se calculará este contraste."
                : "La combinación de altura y cintura no permite una estimación válida.";
        }
    }

    function makeId(suffix) {
        const base = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
        return `${base}_${suffix}`;
    }

    function buildCurrentRecords() {
        const measuredAt = new Date().toISOString();
        const observed = { ...state.input, waistCm: state.waistCm === null ? undefined : state.waistCm };
        const records = [tracking.createMeasurement({ id: makeId("cun"), measuredAt, methodId: "cun-bae", observed })];
        if (state.rfm) records.push(tracking.createMeasurement({ id: makeId("rfm"), measuredAt, methodId: "rfm", observed }));
        return records;
    }

    function requestSave() {
        if (!state.cun || state.saved) return;
        show(el.panelGuardar); el.tituloGuardar.focus();
    }

    function confirmSave() {
        let records;
        try { records = buildCurrentRecords(); } catch (_) { el.estadoGuardado.textContent = "No se ha podido preparar la medición."; return; }
        const result = historyStore.add(records);
        if (result.status === "OK") {
            state.saved = true; el.botonGuardar.disabled = true; el.estadoGuardado.textContent = "Medición guardada en este navegador.";
            loadHistory(); renderHistory(); show(el.evolucion); updateHistoryNotice();
            el.tituloEvolucion.focus();
        } else {
            const messages = {
                UNAVAILABLE: "Este navegador no permite guardar el historial. La calculadora sigue funcionando.",
                QUOTA_EXCEEDED: "No hay espacio disponible para guardar. La calculadora sigue funcionando.",
                CORRUPT_DOCUMENT: "El historial existente está dañado y no se sobrescribirá.",
                DOCUMENT_TOO_LARGE: "El historial local es demasiado grande y no se sobrescribirá.",
                TOO_MANY_RECORDS: "El historial local contiene demasiados registros y no se sobrescribirá.",
                READ_ERROR: "No se ha podido leer el historial; no se ha guardado nada.",
                WRITE_ERROR: "El navegador ha bloqueado la escritura del historial."
            };
            el.estadoGuardado.textContent = messages[result.status] || "No se ha podido guardar la medición.";
        }
    }

    function loadHistory() {
        const result = historyStore.read(); state.records = result.records || []; state.storageStatus = result.status;
        if (result.status === "PARTIAL") el.estadoHistorial.textContent = `Se ignoraron ${result.invalidRecords} registros inválidos; los datos válidos siguen disponibles.`;
        else if (result.status === "CORRUPT_DOCUMENT") el.estadoHistorial.textContent = "El historial local está dañado. La calculadora sigue disponible y no lo sobrescribiremos.";
        else if (["UNAVAILABLE", "READ_ERROR", "DOCUMENT_TOO_LARGE", "TOO_MANY_RECORDS"].includes(result.status)) el.estadoHistorial.textContent = "El historial no está disponible en este navegador. La calculadora sigue funcionando.";
        else el.estadoHistorial.textContent = "Tus mediciones están guardadas únicamente en este navegador y dispositivo.";
    }

    function updateHistoryNotice() {
        const count = tracking.groupByMeasuredAt(state.records).length;
        if (count) { el.contadorMediciones.textContent = `Tienes ${count} ${count === 1 ? "medición guardada" : "mediciones guardadas"}`; show(el.avisoHistorial); }
        else if (["CORRUPT_DOCUMENT", "READ_ERROR", "UNAVAILABLE", "DOCUMENT_TOO_LARGE", "TOO_MANY_RECORDS"].includes(state.storageStatus)) {
            el.contadorMediciones.textContent = "El historial local no está disponible"; show(el.avisoHistorial);
        }
        else hide(el.avisoHistorial);
    }

    function groupMethod(group, id) { return group.measurements.find(item => item.method.id === id) || null; }
    function renderHistory() {
        const groups = tracking.groupByMeasuredAt(state.records).reverse();
        el.listaHistorial.textContent = "";
        groups.forEach(group => {
            const cun = groupMethod(group, "cun-bae"), rfm = groupMethod(group, "rfm"), observed = cun?.observed || rfm?.observed || {};
            const waistCm = Number.isFinite(observed.waistCm) ? observed.waistCm : rfm?.observed.waistCm;
            const article = document.createElement("article"); article.className = "tarjeta medicion-historial";
            article.innerHTML = `<div class="medicion-fecha"><strong>Medición</strong><time datetime="${group.measuredAt}">${new Date(group.measuredAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</time></div>
                <div class="medicion-dato"><span>Peso observado</span><strong>${format(observed.weightKg, 1)} kg</strong></div>
                <div class="medicion-dato"><span>Cintura observada</span><strong>${Number.isFinite(waistCm) ? `${format(waistCm, 1)} cm` : "No medida"}</strong></div>
                <div class="medicion-dato"><span>CUN-BAE estimado</span><strong>${cun ? `≈ ${Math.round(cun.estimated.bodyFatPercent)} %` : "No disponible"}</strong></div>
                <div class="medicion-dato"><span>RFM estimado</span><strong>${rfm ? `≈ ${Math.round(rfm.estimated.bodyFatPercent)} %` : "No disponible"}</strong></div>
                <div class="medicion-acciones"><button type="button" class="boton-eliminar" data-measured-at="${group.measuredAt}" aria-label="Eliminar medición del ${new Date(group.measuredAt).toLocaleDateString("es-ES")}">Eliminar</button></div>`;
            el.listaHistorial.appendChild(article);
        });
        el.listaHistorial.querySelectorAll("[data-measured-at]").forEach(button => button.addEventListener("click", () => removeMeasurement(button.dataset.measuredAt)));
        if (groups.length > 1) { show(el.comparador); renderComparison(); } else hide(el.comparador);
        const canClearInvalidDocument = ["PARTIAL", "CORRUPT_DOCUMENT", "DOCUMENT_TOO_LARGE", "TOO_MANY_RECORDS"].includes(state.storageStatus);
        el.borrarHistorial.disabled = !groups.length && !canClearInvalidDocument;
    }

    function changeLine(label, value, unit, decimals) { return `<li><strong>${label}:</strong> ${signed(value, unit, decimals)}</li>`; }
    function methodLine(label, comparison) {
        if (!comparison.available) return `<li><strong>${label}:</strong> no está disponible en ambas mediciones.</li>`;
        if (!comparison.comparable) {
            const reasons = {
                DIFFERENT_METHOD_OR_VERSION: "utiliza una versión científica o de motor diferente",
                EQUATION_VARIANT_CHANGED: "cambió el sexo usado por la ecuación y, con ello, sus coeficientes",
                INVALID_RECORD: "alguno de los registros no es válido"
            };
            return `<li><strong>${label}:</strong> ${reasons[comparison.reason] || "las mediciones no son equivalentes"}; no se calcula un delta.</li>`;
        }
        const rounding = comparison.rounding;
        const visible = `≈ ${rounding.earlierDisplay} % → ≈ ${rounding.laterDisplay} %`;
        if (rounding.relation === "NO_CHANGE") return `<li><strong>${label}:</strong> ${visible}; sin cambio matemático interno.</li>`;
        if (rounding.relation === "HIDDEN_INTERNAL_CHANGE") return `<li><strong>${label}:</strong> ${visible}; el valor interno cambió ${comparison.direction === "up" ? "al alza" : "a la baja"}, pero el entero mostrado permanece igual.</li>`;
        if (rounding.relation === "VISIBLE_ROUNDING_BOUNDARY") return `<li><strong>${label}:</strong> ${visible}; el cambio interno es inferior a 1 punto y el salto visible procede de cruzar la frontera de redondeo, no de un umbral clínico.</li>`;
        return `<li><strong>${label}:</strong> ${visible}; cambio matemático ${signed(roundSymmetrically(comparison.deltaPercentagePoints), " puntos aproximadamente", 0)}.</li>`;
    }
    function renderComparison() {
        const groups = tracking.groupByMeasuredAt(state.records);
        if (groups.length < 2) return;
        const later = groups[groups.length - 1];
        const earlier = el.tipoComparacion.value === "first" ? groups[0] : groups[groups.length - 2];
        const result = interpreter.interpretChange(earlier, later);
        const days = Math.max(0, Math.round(result.elapsedMs / 86400000));
        el.explicacionCambio.innerHTML = `<h4>${result.headline}</h4><p>Han transcurrido ${days} días entre las mediciones seleccionadas.</p>
            <div class="explicacion-bloques">
                <section><h4>Lo que has medido</h4><ul>${changeLine("Peso", result.observed.weightKg, " kg", 1)}${changeLine("Cintura", result.observed.waistCm, " cm", 1)}</ul></section>
                <section><h4>Lo que estiman los métodos</h4><ul>${methodLine("CUN-BAE", result.estimates.cunBae)}${methodLine("RFM", result.estimates.rfm)}</ul></section>
                <section><h4>Por qué pueden cambiar diferente</h4><p>${result.explanation}</p></section>
                <section><h4>Comparabilidad</h4><p>${result.structurallyComparable ? "Los deltas mostrados conservan método, versión, motor y variante de ecuación. Son comparaciones matemáticas, no mediciones de cambio corporal real." : "Falta una medición equivalente o cambió el método, la versión, el motor o la variante de ecuación; no se muestran deltas incompatibles."}</p></section>
                <section><h4>Qué podemos decir</h4><p>${result.canSay}</p></section>
                <section class="explicacion-alerta"><h4>Qué NO podemos concluir</h4><p>${result.cannotSay}</p></section>
            </div>`;
    }

    function removeMeasurement(measuredAt) {
        if (!window.confirm("¿Eliminar esta medición de este navegador?")) return;
        const result = historyStore.removeAt(measuredAt);
        if (result.status === "OK") {
            loadHistory(); renderHistory(); updateHistoryNotice();
            el.estadoHistorial.textContent = "Medición eliminada de este navegador.";
            const nextAction = el.listaHistorial.querySelector(".boton-eliminar");
            (nextAction || el.tituloEvolucion).focus();
        }
        else el.estadoHistorial.textContent = "No se ha podido eliminar la medición.";
    }

    function clearHistory() {
        if (!window.confirm("¿Borrar todo el historial de este navegador? Esta acción no se puede deshacer.")) return;
        const result = historyStore.clear();
        if (result.status === "OK") { state.records = []; state.storageStatus = "EMPTY"; renderHistory(); updateHistoryNotice(); el.estadoHistorial.textContent = "Se ha borrado todo el historial local."; el.tituloEvolucion.focus(); }
        else el.estadoHistorial.textContent = "No se ha podido borrar el historial.";
    }

    function resetCalculator() {
        el.formularioHerramienta.reset(); el.formularioCintura.reset();
        ["sexo", "edad", "altura", "peso"].forEach(field => setFieldError(field, ""));
        state.input = null; state.cun = null; state.rfm = null; state.waistCm = null; state.saved = false;
        hide(el.resultados); hide(el.panelCintura); hide(el.panelGuardar); hide(el.resultadoRfm); hide(el.botonReiniciar); hide(el.avisoRfmEdad);
        el.estadoCalculadora.textContent = ""; el.estadoGuardado.textContent = ""; el.errorCintura.textContent = ""; el.botonGuardar.disabled = false;
        updateWaistDifference();
        el.sexo.focus();
    }

    function bindEvents() {
        el.formularioHerramienta.addEventListener("submit", calculateQuick);
        el.formularioHerramienta.addEventListener("input", () => {
            if (!state.cun) return;
            state.input = null; state.cun = null; state.rfm = null; state.waistCm = null; state.saved = false;
            hide(el.resultados); hide(el.panelCintura); hide(el.panelGuardar); hide(el.resultadoRfm);
            el.estadoCalculadora.textContent = "Los datos han cambiado. Vuelve a calcular para actualizar el resultado.";
        });
        el.botonReiniciar.addEventListener("click", resetCalculator);
        el.botonMostrarCintura.addEventListener("click", () => { show(el.panelCintura); el.tituloCintura.focus(); });
        el.formularioCintura.addEventListener("submit", calculateWaist);
        el.cinturaUno.addEventListener("input", updateWaistDifference); el.cinturaDos.addEventListener("input", updateWaistDifference);
        el.cerrarCintura.addEventListener("click", () => { hide(el.panelCintura); el.botonMostrarCintura.focus(); });
        el.botonGuardar.addEventListener("click", requestSave); el.confirmarGuardar.addEventListener("click", confirmSave);
        el.cancelarGuardar.addEventListener("click", () => { hide(el.panelGuardar); el.botonGuardar.focus(); });
        el.botonVerEvolucion.addEventListener("click", () => { show(el.evolucion); renderHistory(); el.evolucion.scrollIntoView({ behavior: preferredScrollBehavior() }); el.tituloEvolucion.focus({ preventScroll: true }); });
        el.botonNuevaMedicion.addEventListener("click", () => { resetCalculator(); q("calculadora").scrollIntoView({ behavior: preferredScrollBehavior() }); });
        el.tipoComparacion.addEventListener("change", renderComparison); el.borrarHistorial.addEventListener("click", clearHistory);
    }

    function init() {
        if (!collectElements()) { console.error("Faltan elementos de la interfaz PRO."); return; }
        historyStore = storeFactory.createStore(safeStorage()); bindEvents(); loadHistory(); updateHistoryNotice(); renderHistory();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
