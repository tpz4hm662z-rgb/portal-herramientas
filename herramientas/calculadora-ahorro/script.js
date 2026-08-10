"use strict";

(function () {
    const engine = window.AhorroEngine;
    const estado = { modo: "objetivo", grafico: null, ultimoResultado: null };
    const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const porcentaje = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 1 });
    const fechaNatural = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));

    function numero(id) {
        const elemento = document.getElementById(id);
        return elemento.value.trim() === "" ? NaN : Number(elemento.value);
    }
    function dinero(valor) { return euro.format(valor); }
    function pct(valor) { return valor === null ? "No disponible" : porcentaje.format(valor); }
    function fechaEnMeses(meses) {
        const fecha = new Date();
        fecha.setDate(1);
        fecha.setMonth(fecha.getMonth() + meses);
        return fecha;
    }
    function duracion(meses) {
        const anos = Math.floor(meses / 12); const resto = meses % 12; const partes = [];
        if (anos) partes.push(`${anos} ${anos === 1 ? "año" : "años"}`);
        if (resto) partes.push(`${resto} ${resto === 1 ? "mes" : "meses"}`);
        return partes.length ? partes.join(" y ") : "0 meses";
    }
    function limpiarErrores(formulario) {
        formulario.querySelectorAll("[aria-invalid]").forEach(campo => campo.removeAttribute("aria-invalid"));
        formulario.querySelectorAll(".error-campo").forEach(error => { error.textContent = ""; });
    }
    function error(campoId, errorId, mensaje) {
        document.getElementById(campoId).setAttribute("aria-invalid", "true");
        document.getElementById(errorId).textContent = mensaje;
        return false;
    }
    function validarNoNegativo(campoId, errorId, etiqueta, obligatorio) {
        const valor = numero(campoId);
        if (!Number.isFinite(valor)) return obligatorio ? error(campoId, errorId, `Introduce ${etiqueta}.`) : true;
        if (valor < 0) return error(campoId, errorId, `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} no puede ser negativo.`);
        return true;
    }
    function activarModo(modo, enfocar) {
        estado.modo = modo;
        $$("[role=tab]").forEach(tab => {
            const activo = tab.dataset.modo === modo;
            tab.classList.toggle("activo", activo); tab.setAttribute("aria-selected", String(activo)); tab.tabIndex = activo ? 0 : -1;
            if (activo && enfocar) tab.focus();
        });
        $$("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== modo; });
        ocultarResultados();
    }
    function gestionarTecladoTabs(evento) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
        evento.preventDefault(); const tabs = $$("[role=tab]"); const actual = tabs.indexOf(evento.currentTarget);
        const indice = evento.key === "Home" ? 0 : evento.key === "End" ? tabs.length - 1 : (actual + (evento.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        activarModo(tabs[indice].dataset.modo, true);
    }
    function alternarInflacion(prefijo) {
        const activo = document.getElementById(`${prefijo}-ajustar-inflacion`).checked;
        document.getElementById(`${prefijo}-inflacion-grupo`).hidden = !activo;
    }
    function ocultarResultados() {
        $("#resultados").hidden = true; estado.ultimoResultado = null;
        if (estado.grafico) { estado.grafico.destroy(); estado.grafico = null; }
    }
    function mostrarResultadoPrincipal(etiqueta, titulo, detalle, clase) {
        const contenedor = $("#resultado-principal"); contenedor.className = `resultado-principal ${clase || ""}`;
        contenedor.innerHTML = `<p class="resultado-etiqueta">${etiqueta}</p><h2>${titulo}</h2>${detalle ? `<p>${detalle}</p>` : ""}`;
        $("#resultados").hidden = false;
    }
    function mostrarMetricas(items) {
        $("#metricas").innerHTML = items.filter(item => item.valor !== undefined && item.valor !== null).map(item => `<dl class="metrica"><dt>${item.etiqueta}</dt><dd>${item.valor}</dd></dl>`).join("");
    }
    function mostrarProgreso(capital, objetivo, estadoEspecial) {
        const progresoReal = objetivo === 0 ? 1 : capital / objetivo; const visual = Math.min(1, Math.max(0, progresoReal));
        const texto = estadoEspecial === engine.STATUS.SUPERADO ? "Tu ahorro actual supera el objetivo." : estadoEspecial === engine.STATUS.ALCANZADO ? "Ya has completado el objetivo." : `Ya has completado el ${pct(visual)} de tu objetivo.`;
        $("#progreso-contenedor").innerHTML = `<section class="progreso-bloque" aria-labelledby="progreso-titulo"><div class="progreso-cabecera"><p id="progreso-titulo"><strong>Progreso actual</strong></p><strong>${pct(visual)}</strong></div><div class="barra-progreso" role="progressbar" aria-label="Progreso del objetivo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(visual * 100)}"><span style="width:${visual * 100}%"></span></div><p>${texto}</p></section>`;
    }
    function limpiarBloquesAdicionales() { $("#progreso-contenedor").innerHTML = ""; $("#escenarios-contenedor").innerHTML = ""; $("#evolucion").hidden = true; $("#aviso-metodologico").hidden = true; $("#btnPDF").hidden = true; }
    function proyeccion(datos) { return engine.generarProyeccion(datos); }
    function resumirSerie(serie, capitalInicial) {
        if (!serie.length) return [];
        const paso = serie.length < 12 ? 1 : 12; const filas = [];
        for (let i = paso - 1; i < serie.length; i += paso) filas.push(serie[i]);
        if (filas[filas.length - 1] !== serie[serie.length - 1]) filas.push(serie[serie.length - 1]);
        return filas.map(fila => ({ periodo: paso === 1 ? `Mes ${fila.mes}` : `Año ${Math.ceil(fila.mes / 12)}`, aportado: capitalInicial + fila.aportacion * fila.mes, rendimiento: fila.capitalFinal - capitalInicial - fila.aportacion * fila.mes, capital: fila.capitalFinal }));
    }
    function mostrarEvolucion(datos) {
        const resultado = proyeccion(datos); if (resultado.estado !== engine.STATUS.OK || !resultado.serie.length) return;
        const serieGrafico = resultado.serie.length > 240 ? resultado.serie.filter((_, i) => (i + 1) % 12 === 0 || i === resultado.serie.length - 1) : resultado.serie;
        const etiquetas = serieGrafico.map(f => resultado.serie.length > 240 ? `${Math.ceil(f.mes / 12)} a.` : `${f.mes} m.`);
        const aportado = serieGrafico.map(f => datos.capitalInicial + f.aportacion * f.mes);
        const total = serieGrafico.map(f => f.capitalFinal);
        $("#evolucion").hidden = false;
        $("#resumen-grafico").textContent = `El capital estimado evoluciona desde ${dinero(datos.capitalInicial)} hasta ${dinero(resultado.capitalFinal)} en ${duracion(datos.periodos)}. Las aportaciones se realizan al final de cada mes.`;
        if (estado.grafico) estado.grafico.destroy();
        estado.grafico = new Chart($("#graficoAhorro"), { type: "line", data: { labels: etiquetas, datasets: [{ label: "Capital aportado", data: aportado, borderColor: "#94a3b8", backgroundColor: "transparent", borderDash: [5, 5], pointRadius: 0 }, { label: "Capital total estimado", data: total, borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.1)", fill: true, pointRadius: 0, tension: .18 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { tooltip: { callbacks: { label: contexto => `${contexto.dataset.label}: ${dinero(contexto.parsed.y)}` } } }, scales: { y: { ticks: { callback: valor => euro.format(valor).replace(",00", "") } } } } });
        const filas = resumirSerie(resultado.serie, datos.capitalInicial);
        $("#tabla-evolucion").innerHTML = `<table class="tabla-evolucion"><caption class="sr-only">Resumen de la evolución del ahorro</caption><thead><tr><th>Periodo</th><th>Aportado acumulado</th><th>Rendimiento estimado</th><th>Capital estimado</th></tr></thead><tbody>${filas.map(f => `<tr><td>${f.periodo}</td><td>${dinero(f.aportado)}</td><td>${dinero(f.rendimiento)}</td><td><strong>${dinero(f.capital)}</strong></td></tr>`).join("")}</tbody></table>`;
    }
    function mostrarEscenarios(aportacionBase, objetivo, capital, rentabilidad) {
        const escenarios = engine.generarEscenarios(aportacionBase, CONFIG.escenarios).escenarios;
        $("#escenarios-contenedor").innerHTML = `<section class="escenarios-bloque" aria-labelledby="escenarios-titulo"><p class="paso">Comparación</p><h2 id="escenarios-titulo">Tres escenarios calculados</h2><div class="escenarios-grid">${escenarios.map(item => { const plazo = engine.periodosNecesarios({ objetivo, capitalInicial: capital, aportacionPeriodica: item.aportacionPeriodica, rentabilidadAnual: rentabilidad }); const diferencia = item.aportacionPeriodica - aportacionBase; return `<article class="escenario ${item.nombre}"><h3>Plan ${item.nombre}</h3><p class="cantidad">${dinero(item.aportacionPeriodica)}/mes</p><p>${plazo.estado === engine.STATUS.OK ? `${duracion(plazo.periodos)} · ${fechaNatural.format(fechaEnMeses(plazo.periodos))}` : "Objetivo ya alcanzado"}</p><p>${diferencia === 0 ? "Escenario calculado para tu plazo" : `${diferencia > 0 ? "+" : "−"}${dinero(Math.abs(diferencia))}/mes frente al plan objetivo`}</p></article>`; }).join("")}</div></section>`;
    }
    function finalizarResultado(datosPDF, usaHipotesis) {
        estado.ultimoResultado = datosPDF; $("#btnPDF").hidden = false; $("#aviso-metodologico").hidden = !usaHipotesis;
        $("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function calcularObjetivo(evento) {
        evento.preventDefault(); const form = evento.currentTarget; limpiarErrores(form); let valido = true;
        const objetivoHoy = numero("objetivo-importe"), capital = numero("objetivo-capital"), anos = numero("objetivo-anos"), mesesExtra = numero("objetivo-meses"), rentabilidadPct = numero("objetivo-rentabilidad");
        if (!Number.isFinite(objetivoHoy) || objetivoHoy <= 0) valido = error("objetivo-importe", "error-objetivo-importe", "Introduce un objetivo superior a 0 €.") && valido;
        valido = validarNoNegativo("objetivo-capital", "error-objetivo-capital", "el ahorro inicial", true) && valido;
        if (![anos, mesesExtra].every(Number.isInteger) || anos < 0 || anos > 100 || mesesExtra < 0 || mesesExtra > 11 || anos * 12 + mesesExtra <= 0) { $("#error-objetivo-plazo").textContent = "El plazo debe estar entre 1 mes y 100 años, con un máximo de 11 meses adicionales."; valido = false; }
        if (!Number.isFinite(rentabilidadPct) || rentabilidadPct <= -100) valido = error("objetivo-rentabilidad", "error-objetivo-rentabilidad", "Introduce una rentabilidad superior a −100%.") && valido;
        if (!valido) { ocultarResultados(); return; }
        const periodos = anos * 12 + mesesExtra, rentabilidad = rentabilidadPct / 100, ajustar = $("#objetivo-ajustar-inflacion").checked, inflacionPct = numero("objetivo-inflacion");
        if (ajustar && (!Number.isFinite(inflacionPct) || inflacionPct <= -100)) { error("objetivo-inflacion", "error-objetivo-inflacion", "Introduce una inflación superior a −100%."); ocultarResultados(); return; }
        const ajusteInflacion = ajustar ? engine.ajustarInflacion(objetivoHoy, inflacionPct / 100, periodos / 12) : null;
        if (ajusteInflacion && ajusteInflacion.estado !== engine.STATUS.OK) { ocultarResultados(); limpiarBloquesAdicionales(); mostrarMetricas([]); mostrarResultadoPrincipal("Simulación no disponible", "No es posible calcular este escenario con esos valores.", "Prueba con cantidades, tasas o plazos menos extremos.", "especial"); return; }
        const objetivo = ajustar ? ajusteInflacion.objetivoNominal : objetivoHoy;
        const resultado = engine.aportacionNecesaria({ objetivo, capitalInicial: capital, periodos, rentabilidadAnual: rentabilidad }); limpiarBloquesAdicionales();
        if (resultado.estado === engine.STATUS.INALCANZABLE || resultado.estado === engine.STATUS.INVALIDO) { mostrarResultadoPrincipal("Simulación no disponible", "No es posible calcular este escenario con esos valores.", "Prueba con cantidades, tasas o plazos menos extremos.", "especial"); mostrarMetricas([]); return; }
        const especial = resultado.estado === engine.STATUS.ALCANZADO || resultado.estado === engine.STATUS.SUPERADO;
        if (especial) mostrarResultadoPrincipal("Objetivo completado", resultado.estado === engine.STATUS.SUPERADO ? "Tu ahorro actual ya supera el objetivo." : "Ya has alcanzado tu objetivo.", "No necesitas realizar aportaciones adicionales para este objetivo.", "especial");
        else mostrarResultadoPrincipal("Tu plan objetivo", `Necesitas ahorrar ${dinero(resultado.aportacionPeriodica)}/mes`, `Durante ${duracion(periodos)}, con aportaciones al final de cada mes.`);
        const pendiente = Math.max(0, objetivo - capital), anual = (resultado.aportacionPeriodica || 0) * 12;
        const proyectado = engine.proyectarCapital({ capitalInicial: capital, aportacionPeriodica: resultado.aportacionPeriodica || 0, periodos, rentabilidadAnual: rentabilidad });
        mostrarMetricas([{ etiqueta: ajustar ? "Objetivo en euros de hoy" : "Objetivo final", valor: dinero(objetivoHoy) }, ajustar ? { etiqueta: "Objetivo nominal ajustado", valor: dinero(objetivo) } : null, { etiqueta: "Capital inicial", valor: dinero(capital) }, { etiqueta: "Cantidad pendiente", valor: dinero(pendiente) }, { etiqueta: "Plazo", valor: duracion(periodos) }, { etiqueta: "Equivalente semanal", valor: dinero(anual / 52) }, { etiqueta: "Equivalente diario", valor: dinero(anual / 365) }, { etiqueta: "Aportaciones previstas", valor: dinero((resultado.aportacionPeriodica || 0) * periodos) }, rentabilidad !== 0 ? { etiqueta: "Rendimiento estimado", valor: dinero(proyectado.rendimientoAcumulado) } : null, { etiqueta: "Fecha estimada", valor: fechaNatural.format(fechaEnMeses(periodos)) }].filter(Boolean));
        mostrarProgreso(capital, objetivo, resultado.estado);
        if (!especial) { mostrarEscenarios(resultado.aportacionPeriodica, objetivo, capital, rentabilidad); mostrarEvolucion({ capitalInicial: capital, aportacionPeriodica: resultado.aportacionPeriodica, periodos, rentabilidadAnual: rentabilidad }); }
        finalizarResultado({ titulo: "Plan para alcanzar un objetivo", principal: especial ? "Objetivo completado" : `${dinero(resultado.aportacionPeriodica)}/mes`, lineas: [`Objetivo: ${dinero(objetivo)}`, `Capital inicial: ${dinero(capital)}`, `Plazo: ${duracion(periodos)}`, `Fecha estimada: ${fechaNatural.format(fechaEnMeses(periodos))}`] }, rentabilidad !== 0 || ajustar);
    }
    function plazoConInflacion(objetivoHoy, capital, aportacion, rentabilidad, inflacion) {
        if (capital > objetivoHoy) return { estado: engine.STATUS.SUPERADO, periodos: 0, capitalFinal: capital, objetivo: objetivoHoy };
        if (capital === objetivoHoy) return { estado: engine.STATUS.ALCANZADO, periodos: 0, capitalFinal: capital, objetivo: objetivoHoy };
        for (let mes = 1; mes <= CONFIG.calculo.maximoMeses; mes += 1) { const ajuste = engine.ajustarInflacion(objetivoHoy, inflacion, mes / 12); if (ajuste.estado !== engine.STATUS.OK) return { estado: engine.STATUS.INALCANZABLE }; const proyeccion = engine.proyectarCapital({ capitalInicial: capital, aportacionPeriodica: aportacion, periodos: mes, rentabilidadAnual: rentabilidad }); if (proyeccion.estado !== engine.STATUS.OK) return { estado: engine.STATUS.INALCANZABLE }; if (proyeccion.capitalFinal >= ajuste.objetivoNominal) return { estado: engine.STATUS.OK, periodos: mes, capitalFinal: proyeccion.capitalFinal, objetivo: ajuste.objetivoNominal }; }
        return { estado: engine.STATUS.INALCANZABLE };
    }
    function calcularPlazo(evento) {
        evento.preventDefault(); const form = evento.currentTarget; limpiarErrores(form); let valido = true;
        const objetivoHoy = numero("plazo-objetivo"), capital = numero("plazo-capital"), aportacion = numero("plazo-aportacion"), rentabilidadPct = numero("plazo-rentabilidad");
        if (!Number.isFinite(objetivoHoy) || objetivoHoy <= 0) valido = error("plazo-objetivo", "error-plazo-objetivo", "Introduce un objetivo superior a 0 €.") && valido;
        valido = validarNoNegativo("plazo-capital", "error-plazo-capital", "el ahorro actual", true) && valido; valido = validarNoNegativo("plazo-aportacion", "error-plazo-aportacion", "la aportación mensual", true) && valido;
        if (!Number.isFinite(rentabilidadPct) || rentabilidadPct <= -100) valido = error("plazo-rentabilidad", "error-plazo-rentabilidad", "Introduce una rentabilidad superior a −100%.") && valido;
        if (!valido) { ocultarResultados(); return; }
        const rentabilidad = rentabilidadPct / 100, ajustar = $("#plazo-ajustar-inflacion").checked, inflacionPct = numero("plazo-inflacion"); if (ajustar && (!Number.isFinite(inflacionPct) || inflacionPct <= -100)) { error("plazo-inflacion", "error-plazo-inflacion", "Introduce una inflación superior a −100%."); ocultarResultados(); return; }
        let resultado = ajustar ? plazoConInflacion(objetivoHoy, capital, aportacion, rentabilidad, inflacionPct / 100) : engine.periodosNecesarios({ objetivo: objetivoHoy, capitalInicial: capital, aportacionPeriodica: aportacion, rentabilidadAnual: rentabilidad }); limpiarBloquesAdicionales();
        const especial = resultado.estado === engine.STATUS.ALCANZADO || resultado.estado === engine.STATUS.SUPERADO;
        if (resultado.estado === engine.STATUS.INALCANZABLE) { mostrarResultadoPrincipal("Objetivo inalcanzable", "Con estas condiciones no es posible alcanzar el objetivo.", "Sería necesario aportar dinero, aumentar el capital inicial o cambiar alguna hipótesis de la simulación.", "especial"); mostrarMetricas([]); finalizarResultado({ titulo: "Simulación de plazo", principal: "Objetivo inalcanzable", lineas: [] }, rentabilidad !== 0 || ajustar); return; }
        if (especial) mostrarResultadoPrincipal("Objetivo completado", resultado.estado === engine.STATUS.SUPERADO ? "Tu ahorro actual ya supera el objetivo." : "Ya has alcanzado tu objetivo.", "El plazo necesario es de 0 meses.", "especial"); else mostrarResultadoPrincipal("Fecha estimada", `Alcanzarías tu objetivo en ${duracion(resultado.periodos)}`, fechaNatural.format(fechaEnMeses(resultado.periodos)));
        const objetivoFinal = resultado.objetivo || objetivoHoy; const proyectado = engine.proyectarCapital({ capitalInicial: capital, aportacionPeriodica: aportacion, periodos: resultado.periodos || 0, rentabilidadAnual: rentabilidad });
        mostrarMetricas([{ etiqueta: ajustar ? "Objetivo en euros de hoy" : "Objetivo", valor: dinero(objetivoHoy) }, ajustar ? { etiqueta: "Objetivo nominal estimado", valor: dinero(objetivoFinal) } : null, { etiqueta: "Capital inicial", valor: dinero(capital) }, { etiqueta: "Aportación mensual", valor: dinero(aportacion) }, { etiqueta: "Total aportado", valor: dinero(aportacion * (resultado.periodos || 0)) }, rentabilidad !== 0 ? { etiqueta: "Rendimiento estimado", valor: dinero(proyectado.rendimientoAcumulado) } : null, { etiqueta: "Fecha estimada", valor: fechaNatural.format(fechaEnMeses(resultado.periodos || 0)) }].filter(Boolean)); mostrarProgreso(capital, objetivoFinal, resultado.estado);
        if (!especial && resultado.periodos) mostrarEvolucion({ capitalInicial: capital, aportacionPeriodica: aportacion, periodos: resultado.periodos, rentabilidadAnual: rentabilidad });
        finalizarResultado({ titulo: "Plazo estimado para el objetivo", principal: especial ? "Objetivo completado" : duracion(resultado.periodos), lineas: [`Objetivo: ${dinero(objetivoFinal)}`, `Capital inicial: ${dinero(capital)}`, `Aportación mensual: ${dinero(aportacion)}`, `Fecha estimada: ${fechaNatural.format(fechaEnMeses(resultado.periodos || 0))}`] }, rentabilidad !== 0 || ajustar);
    }
    function calcularCapacidad(evento) {
        evento.preventDefault(); const form = evento.currentTarget; limpiarErrores(form); let valido = true;
        [["capacidad-ingresos","error-capacidad-ingresos","los ingresos netos",true],["capacidad-fijos","error-capacidad-fijos","los gastos fijos",true],["capacidad-variables","error-capacidad-variables","los gastos variables",true],["capacidad-otros","error-capacidad-otros","otros gastos",false]].forEach(item => { valido = validarNoNegativo(item[0], item[1], item[2], item[3]) && valido; }); if (!valido) { ocultarResultados(); return; }
        const ingresos = numero("capacidad-ingresos"); const otros = $("#capacidad-otros").value.trim() === "" ? 0 : numero("capacidad-otros"); const resultado = engine.capacidadAhorro({ ingresosNetos: ingresos, gastosFijos: numero("capacidad-fijos"), gastosVariables: numero("capacidad-variables"), otrosGastos: otros }); limpiarBloquesAdicionales();
        const deficit = resultado.estado === engine.STATUS.DEFICIT; mostrarResultadoPrincipal(deficit ? "Balance mensual" : "Tu capacidad de ahorro", deficit ? `Tus gastos superan tus ingresos en ${dinero(Math.abs(resultado.ahorroMensual))}/mes` : `Puedes ahorrar ${dinero(resultado.ahorroMensual)}/mes`, deficit ? "Es un resultado financiero válido, no un error de cálculo." : `Eso equivale a ${dinero(resultado.ahorroAnual)} al año.`, deficit ? "deficit" : "");
        mostrarMetricas([{ etiqueta: "Ingresos mensuales", valor: dinero(ingresos) }, { etiqueta: "Gastos totales", valor: dinero(resultado.gastosTotales) }, { etiqueta: "Ahorro disponible", valor: `${dinero(resultado.ahorroMensual)}/mes` }, { etiqueta: "Porcentaje destinado a gastos", valor: pct(resultado.porcentajeGastos) }, { etiqueta: "Tasa de ahorro", valor: pct(resultado.tasaAhorro) }, { etiqueta: "Ahorro anual potencial", valor: dinero(resultado.ahorroAnual) }]);
        if (resultado.ahorroMensual > 0) $("#resultado-principal").insertAdjacentHTML("beforeend", `<button class="transferir" id="transferir-ahorro" type="button">Usar este ahorro para calcular un objetivo</button>`);
        finalizarResultado({ titulo: "Capacidad mensual de ahorro", principal: `${dinero(resultado.ahorroMensual)}/mes`, lineas: [`Ingresos: ${dinero(ingresos)}`, `Gastos: ${dinero(resultado.gastosTotales)}`, `Tasa de ahorro: ${pct(resultado.tasaAhorro)}`, `Ahorro anual: ${dinero(resultado.ahorroAnual)}`] }, false);
        const transferir = $("#transferir-ahorro"); if (transferir) transferir.addEventListener("click", () => { $("#plazo-aportacion").value = resultado.ahorroMensual.toFixed(2); activarModo("plazo", false); $("#plazo-objetivo").focus(); });
    }
    function limpiarModo(evento) { const formulario = evento.currentTarget; setTimeout(() => { limpiarErrores(formulario); ocultarResultados(); if (estado.modo !== "capacidad") alternarInflacion(estado.modo); }, 0); }
    function generarPDF() {
        if (!estado.ultimoResultado || !window.jspdf) return; const doc = new window.jspdf.jsPDF(); const datos = estado.ultimoResultado;
        doc.setFontSize(20); doc.text("Calculadora de Ahorro PRO", 20, 22); doc.setFontSize(11); doc.text(`Resumen generado localmente el ${new Date().toLocaleDateString("es-ES")}`, 20, 32); doc.line(20, 38, 190, 38); doc.setFontSize(15); doc.text(doc.splitTextToSize(datos.titulo, 170), 20, 53); doc.setFontSize(18); doc.text(doc.splitTextToSize(datos.principal, 170), 20, 67); doc.setFontSize(11); let y = 86; datos.lineas.forEach(linea => { const lineas = doc.splitTextToSize(linea, 170); if (y + lineas.length * 7 > 260) { doc.addPage(); y = 24; } doc.text(lineas, 20, y); y += lineas.length * 7 + 3; }); doc.setFontSize(9); doc.text(doc.splitTextToSize("Simulación informativa basada en los datos introducidos. No constituye asesoramiento financiero.", 170), 20, 275); doc.save("plan-ahorro-pro.pdf");
    }
    function iniciar() {
        $$("[role=tab]").forEach(tab => { tab.addEventListener("click", () => activarModo(tab.dataset.modo, false)); tab.addEventListener("keydown", gestionarTecladoTabs); });
        $("#objetivo-ajustar-inflacion").addEventListener("change", () => alternarInflacion("objetivo")); $("#plazo-ajustar-inflacion").addEventListener("change", () => alternarInflacion("plazo"));
        $("#form-objetivo").addEventListener("submit", calcularObjetivo); $("#form-plazo").addEventListener("submit", calcularPlazo); $("#form-capacidad").addEventListener("submit", calcularCapacidad);
        $$("form").forEach(form => form.addEventListener("reset", limpiarModo)); $("#btnPDF").addEventListener("click", generarPDF);
    }
    window.AhorroUI = Object.freeze({ activarModo, dinero, pct, duracion });
    iniciar();
}());
