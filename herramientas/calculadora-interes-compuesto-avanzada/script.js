"use strict";

let graficoInteres = null;
const engine = InteresCompuestoEngine;
const formulario = document.getElementById("formulario-calculadora");
const resultadoContenedor = document.getElementById("resultado");
const valoresIniciales = Object.freeze({ capitalInicial: "10000", aportacionMensual: "300", anos: "20", rentabilidadAnual: "5", frecuenciaAportacion: "mensual", momentoAportacion: "final", inflacionAnual: "2", costesAnuales: "1" });
const nombresFrecuencia = Object.freeze({ mensual: ["mensual", "mes"], trimestral: ["trimestral", "trimestre"], semestral: ["semestral", "semestre"], anual: ["anual", "año"] });
const formatoDinero = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatoPorcentaje = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const formatoNumero = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function dinero(valor) { return formatoDinero.format(Math.abs(valor) < 0.005 ? 0 : valor); }
function porcentaje(valor) { return `${formatoPorcentaje.format(valor)} %`; }
function elemento(id) { return document.getElementById(id); }
function destruirGrafico() { if (graficoInteres) { graficoInteres.destroy(); graficoInteres = null; } }
function ocultarResultados() { destruirGrafico(); resultadoContenedor.hidden = true; resultadoContenedor.innerHTML = ""; }

function limpiarErrores() {
    elemento("error-general").hidden = true;
    elemento("error-general").textContent = "";
    document.querySelectorAll(".error-campo").forEach(nodo => { nodo.textContent = ""; });
    document.querySelectorAll(".campo.tiene-error").forEach(nodo => nodo.classList.remove("tiene-error"));
    formulario.querySelectorAll("[aria-invalid]").forEach(nodo => nodo.removeAttribute("aria-invalid"));
}

function marcarError(idInput, idError, mensaje) {
    const input = elemento(idInput), errorNodo = elemento(idError);
    input.setAttribute("aria-invalid", "true");
    input.closest(".campo").classList.add("tiene-error");
    errorNodo.textContent = mensaje;
}

function leerNumero(id) {
    const texto = elemento(id).value.trim();
    return texto === "" ? NaN : Number(texto);
}

function datosFormulario() {
    const datos = {
        capitalInicial: leerNumero("capitalInicial"), aportacionPeriodica: leerNumero("aportacionMensual"),
        plazoAnos: leerNumero("anos"), rentabilidadAnual: leerNumero("rentabilidadAnual") / 100,
        frecuenciaAportacion: elemento("frecuenciaAportacion").value, frecuenciaCapitalizacion: "mensual",
        momentoAportacion: elemento("momentoAportacion").value
    };
    if (elemento("activarInflacion").checked) datos.inflacionAnual = leerNumero("inflacionAnual") / 100;
    if (elemento("activarCostes").checked) datos.costesAnuales = leerNumero("costesAnuales") / 100;
    return datos;
}

function validarFormulario(datos) {
    limpiarErrores();
    const errores = [];
    if (!Number.isFinite(datos.capitalInicial) || datos.capitalInicial < 0 || datos.capitalInicial > engine.LIMITES.maximoImporte) errores.push(["capitalInicial", "error-capital", "Introduce un capital inicial entre 0 € y el máximo permitido."]);
    if (!Number.isFinite(datos.aportacionPeriodica) || datos.aportacionPeriodica < 0 || datos.aportacionPeriodica > engine.LIMITES.maximoImporte) errores.push(["aportacionMensual", "error-aportacion", "Introduce una aportación válida. Puede ser 0 €."]);
    if (!Number.isInteger(datos.plazoAnos) || datos.plazoAnos < 1 || datos.plazoAnos > engine.LIMITES.maximoAnos) errores.push(["anos", "error-plazo", "Introduce un plazo entre 1 y 100 años completos."]);
    if (!Number.isFinite(datos.rentabilidadAnual) || datos.rentabilidadAnual < engine.LIMITES.rentabilidadMinima || datos.rentabilidadAnual > engine.LIMITES.rentabilidadMaxima) errores.push(["rentabilidadAnual", "error-rentabilidad", "Revisa la rentabilidad: debe estar entre −99 % y 1.000 %."]);
    if ("inflacionAnual" in datos && (!Number.isFinite(datos.inflacionAnual) || datos.inflacionAnual < engine.LIMITES.inflacionMinima || datos.inflacionAnual > engine.LIMITES.inflacionMaxima)) errores.push(["inflacionAnual", "error-inflacion", "Revisa la inflación indicada."]);
    if ("costesAnuales" in datos && (!Number.isFinite(datos.costesAnuales) || datos.costesAnuales < 0 || datos.costesAnuales > engine.LIMITES.costesMaximos)) errores.push(["costesAnuales", "error-costes", "Introduce unos costes entre 0 % y 99 %."]);
    errores.forEach(error => marcarError(...error));
    if (errores.length) {
        const general = elemento("error-general"); general.textContent = "Revisa los campos indicados antes de calcular."; general.hidden = false;
        elemento(errores[0][0]).focus();
    }
    return errores.length === 0;
}

function textoRendimiento(valor) {
    if (Math.abs(valor) < .005) return "En esta simulación no existe crecimiento por rendimiento.";
    return valor > 0 ? `El rendimiento acumulado estimado aporta ${dinero(valor)} al capital final.` : `La variación estimada por rendimiento es de ${dinero(valor)}.`;
}

function plantillaMetricas(r) {
    const proporcion = r.capitalFinal > 0 && r.rendimientoAcumulado > 0 ? r.rendimientoAcumulado / r.capitalFinal * 100 : null;
    return `<section class="resultado-principal" aria-labelledby="capital-final-titulo">
      <p class="resultado-eyebrow">02 · Resultado</p><h2 id="capital-final-titulo">Capital final estimado</h2>
      <p class="capital-final">${dinero(r.capitalFinal)}</p><p class="resultado-principal__nota">Según los datos e hipótesis introducidos.</p>
      <div class="metricas-grid">
        <div class="metrica"><span>Capital inicial</span><strong>${dinero(r.capitalInicial)}</strong></div>
        <div class="metrica"><span>Aportaciones</span><strong>${dinero(r.aportacionesAcumuladas)}</strong></div>
        <div class="metrica"><span>Total aportado</span><strong>${dinero(r.dineroTotalAportado)}</strong></div>
        <div class="metrica"><span>Rendimiento estimado</span><strong>${dinero(r.rendimientoAcumulado)}</strong></div>
      </div>
      ${proporcion === null ? "" : `<p class="insight-rendimiento">El <strong>${porcentaje(proporcion)}</strong> del capital final corresponde al rendimiento acumulado estimado.</p>`}
    </section>`;
}

function plantillaGrafico(r) {
    return `<section class="panel-resultado" aria-labelledby="grafico-titulo"><header><h2 id="grafico-titulo">Cómo evoluciona tu capital</h2><p>Aportado acumulado frente al capital nominal estimado.</p></header>
      <div class="grafico-marco"><canvas id="grafico" role="img" aria-describedby="resumen-grafico"></canvas></div>
      <p id="resumen-grafico" class="alternativa-grafico">Durante el periodo simulado has aportado ${dinero(r.dineroTotalAportado)} y el capital final estimado es ${dinero(r.capitalFinal)}. ${textoRendimiento(r.rendimientoAcumulado)}</p></section>`;
}

function plantillaComparacion(comparacion, tasa, opcionesActivas) {
    const diferencia = comparacion.diferenciaAbsoluta;
    return `<section class="panel-resultado" aria-labelledby="comparacion-titulo"><header><h2 id="comparacion-titulo">Interés simple vs. interés compuesto</h2><p>En el interés simple, los rendimientos no se reinvierten. En el compuesto, pueden generar nuevos rendimientos.</p></header>
      <div class="comparacion-grid"><div class="dato-comparacion"><span>Interés simple</span><strong>${dinero(comparacion.capitalFinalSimple)}</strong></div><div class="dato-comparacion destacado"><span>Interés compuesto</span><strong>${dinero(comparacion.capitalFinalCompuesto)}</strong></div><div class="dato-comparacion"><span>Diferencia por capitalización</span><strong>${diferencia > 0 ? "+" : ""}${dinero(diferencia)}</strong></div></div>
      ${tasa === 0 ? `<p class="nota-metodo">Con una rentabilidad del 0 %, ambos métodos coinciden porque no existe crecimiento por capitalización.</p>` : ""}${opcionesActivas ? `<p class="nota-metodo">Para aislar el efecto de la capitalización, esta comparación no aplica inflación ni costes.</p>` : ""}</section>`;
}

function plantillaHitos(r) {
    const hitos = r.hitos.capitalPorAno.map(h => `<div class="hito"><span>Año ${h.ano}</span><strong>${dinero(h.capital)}</strong></div>`).join("");
    const cruce = r.hitos.rendimientoSuperaAportaciones;
    return `<section class="panel-resultado" aria-labelledby="hitos-titulo"><header><h2 id="hitos-titulo">Tu evolución</h2><p>Hitos que existen dentro del plazo elegido.</p></header><div class="hitos-grid">${hitos}</div>
      ${cruce.estado === engine.STATUS.OK ? `<p class="hito-rendimiento">En esta simulación, el rendimiento anual estimado supera por primera vez las aportaciones de ese año en el <strong>año ${cruce.ano}</strong>.</p>` : ""}</section>`;
}

function plantillaInflacion(r) {
    if (!("capitalReal" in r)) return "";
    return `<section class="panel-resultado" aria-labelledby="inflacion-titulo"><header><h2 id="inflacion-titulo">Efecto estimado de la inflación</h2><p>Una aproximación del poder adquisitivo, no una salida directa de dinero.</p></header><div class="detalle-grid"><div class="dato-detalle"><span>Capital nominal</span><strong>${dinero(r.capitalFinal)}</strong></div><div class="dato-detalle"><span>Euros de hoy</span><strong>${dinero(r.capitalReal)}</strong></div><div class="dato-detalle"><span>Impacto en poder adquisitivo</span><strong>${dinero(r.impactoInflacion)}</strong></div></div></section>`;
}

function plantillaCostes(r) {
    if (!("capitalSinCostes" in r)) return "";
    return `<section class="panel-resultado" aria-labelledby="costes-titulo"><header><h2 id="costes-titulo">Impacto estimado de los costes</h2><p>Incluye los costes aplicados y el crecimiento que ese capital podría haber generado.</p></header><div class="detalle-grid"><div class="dato-detalle"><span>Sin costes</span><strong>${dinero(r.capitalSinCostes)}</strong></div><div class="dato-detalle"><span>Con costes</span><strong>${dinero(r.capitalFinal)}</strong></div><div class="dato-detalle"><span>Impacto acumulado</span><strong>${dinero(r.impactoCostes)}</strong></div></div></section>`;
}

function plantillaDuplicacion(r) {
    const d = r.tiempoDuplicacion;
    if (r.capitalInicial <= 0 || d.estado !== engine.STATUS.OK) return "";
    return `<section class="panel-resultado" aria-labelledby="duplicacion-titulo"><header><h2 id="duplicacion-titulo">¿Cuánto tarda en duplicarse un capital?</h2><p>Este cálculo educativo supone un capital sin nuevas aportaciones.</p></header><div class="duplicacion-grid"><div class="dato-detalle"><span>Tiempo matemático estimado</span><strong>${formatoNumero.format(d.tiempoExactoAnos)} años</strong></div><div class="dato-detalle"><span>Regla del 72</span><strong>≈ ${formatoNumero.format(d.regla72Anos)} años</strong></div></div><p class="nota-metodo">La Regla del 72 es una aproximación educativa.</p></section>`;
}

function plantillaTabla(r) {
    const filas = r.resumenAnual.map(f => `<tr><td>Año ${f.ano}</td><td>${dinero(f.aportadoAcumulado)}</td><td>${dinero(f.rendimientoAcumulado)}</td><td>${dinero(f.capitalFinal)}</td></tr>`).join("");
    return `<section class="panel-resultado" aria-labelledby="tabla-titulo"><header><h2 id="tabla-titulo">Resumen anual</h2><p>Los valores proceden de la misma proyección utilizada en el resultado y el gráfico.</p></header><div class="tabla-scroll" tabindex="0" aria-label="Tabla de evolución anual, desplazable horizontalmente"><table class="tabla-anual"><thead><tr><th>Año</th><th>Aportado acumulado</th><th>Rendimiento acumulado</th><th>Capital estimado</th></tr></thead><tbody>${filas}</tbody></table></div></section>`;
}

function renderizar(r, comparacion) {
    resultadoContenedor.innerHTML = plantillaMetricas(r) + plantillaGrafico(r) + plantillaComparacion(comparacion, r.rentabilidadAnualHipotetica, "capitalReal" in r || "capitalSinCostes" in r) + plantillaHitos(r) + plantillaInflacion(r) + plantillaCostes(r) + plantillaDuplicacion(r) + plantillaTabla(r) + `<aside class="aviso-metodologico"><strong>Simulación orientativa.</strong> Los resultados dependen de hipótesis constantes y no representan una promesa de rentabilidad ni asesoramiento financiero.</aside>`;
    resultadoContenedor.hidden = false;
    mostrarGrafico(r);
    resultadoContenedor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarGrafico(r) {
    destruirGrafico();
    const puntos = r.resumenAnual;
    const ctx = elemento("grafico").getContext("2d");
    graficoInteres = new Chart(ctx, { type: "line", data: { labels: puntos.map(p => `Año ${p.ano}`), datasets: [
        { label: "Aportado acumulado", data: puntos.map(p => p.aportadoAcumulado), borderColor: "#08a8b8", backgroundColor: "rgba(8,168,184,.08)", borderWidth: 2, pointRadius: puntos.length > 30 ? 0 : 2, fill: true, tension: .22 },
        { label: "Capital estimado", data: puntos.map(p => p.capitalFinal), borderColor: "#2457d6", backgroundColor: "rgba(36,87,214,.09)", borderWidth: 3, pointRadius: puntos.length > 30 ? 0 : 2, fill: true, tension: .22 }
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: contexto => `${contexto.dataset.label}: ${dinero(contexto.parsed.y)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: valor => formatoDinero.format(valor) } } } } });
}

function calcularInteresCompuesto(evento) {
    if (evento) evento.preventDefault();
    ocultarResultados();
    const datos = datosFormulario();
    if (!validarFormulario(datos)) return;
    const r = engine.simular(datos);
    if (r.estado !== engine.STATUS.OK) {
        const general = elemento("error-general"); general.textContent = r.estado === engine.STATUS.RESULTADO_NO_FINITO ? "El resultado es demasiado grande. Reduce el plazo, los importes o la rentabilidad." : "No se ha podido realizar la simulación. Revisa los datos."; general.hidden = false; return;
    }
    const datosComparables = Object.assign({}, datos); delete datosComparables.inflacionAnual; delete datosComparables.costesAnuales;
    const comparacion = engine.compararIntereses(datosComparables);
    renderizar(r, comparacion);
}

function actualizarFrecuencia() {
    const [adjetivo, periodo] = nombresFrecuencia[elemento("frecuenciaAportacion").value];
    elemento("etiqueta-aportacion").textContent = `Aportación ${adjetivo}`;
    elemento("ayuda-aportacion").textContent = `El dinero que añades cada ${periodo}.`;
}

function actualizarCondicional(checkboxId, contenedorId) { elemento(contenedorId).hidden = !elemento(checkboxId).checked; }

function reiniciar() {
    Object.entries(valoresIniciales).forEach(([id, valor]) => { elemento(id).value = valor; });
    elemento("activarInflacion").checked = false; elemento("activarCostes").checked = false;
    actualizarCondicional("activarInflacion", "campo-inflacion"); actualizarCondicional("activarCostes", "campo-costes");
    elemento("opciones-avanzadas").open = false; actualizarFrecuencia(); limpiarErrores(); ocultarResultados(); elemento("capitalInicial").focus();
}

formulario.addEventListener("submit", calcularInteresCompuesto);
elemento("boton-limpiar").addEventListener("click", reiniciar);
elemento("frecuenciaAportacion").addEventListener("change", actualizarFrecuencia);
elemento("activarInflacion").addEventListener("change", () => actualizarCondicional("activarInflacion", "campo-inflacion"));
elemento("activarCostes").addEventListener("change", () => actualizarCondicional("activarCostes", "campo-costes"));
