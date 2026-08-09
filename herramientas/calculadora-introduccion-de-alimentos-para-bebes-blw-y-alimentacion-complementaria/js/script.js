/* Herramientas360 Template v3.1 Stable · Lógica específica */
"use strict";

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    const fecha = $("#fechaNacimiento");
    fecha.max = fechaISOLocal(new Date());
    $("#prematuro").addEventListener("change", actualizarCampoPrematuridad);
    formulario.addEventListener("submit", procesarFormulario);
    $(CONFIG.selectores.botonReiniciar).addEventListener("click", reiniciarHerramienta);
    $$(".faq details").forEach(prepararPreguntaFrecuente);
}

function actualizarCampoPrematuridad() {
    const esPrematuro = $("#prematuro").value === "si";
    const contenedor = $("#campoEdadGestacional");
    const campo = $("#edadGestacional");
    contenedor.classList.toggle("oculto", !esPrematuro);
    contenedor.hidden = !esPrematuro;
    campo.required = esPrematuro;
    campo.disabled = !esPrematuro;
    if (!esPrematuro) { campo.value = ""; limpiarError("#errorEdadGestacional"); }
}

function procesarFormulario(evento) {
    evento.preventDefault();
    limpiarTodosLosErrores();
    establecerEstadoCalculando(true);
    const datos = leerYValidarDatos();
    if (!datos) { establecerEstadoCalculando(false); return; }
    const resultado = calcular(datos);
    pintarResultados(resultado);
    pintarDetallesPersonalizados(resultado);
    establecerEstadoCalculando(false);
}

function leerYValidarDatos() {
    const fechaValor = $("#fechaNacimiento").value;
    const prematuro = $("#prematuro").value;
    const semanas = Number($("#edadGestacional").value);
    const metodo = $("#metodo").value;
    let primerError = null;
    const hoy = inicioDia(new Date());
    const nacimiento = fechaDesdeInput(fechaValor);

    function error(selectorCampo, selectorError, mensaje) {
        mostrarError(selectorError, mensaje, selectorCampo);
        if (!primerError) primerError = $(selectorCampo);
    }
    if (!fechaValor) error("#fechaNacimiento", "#errorFechaNacimiento", "Introduce la fecha de nacimiento.");
    else if (!nacimiento || nacimiento > hoy) error("#fechaNacimiento", "#errorFechaNacimiento", "La fecha no puede ser futura.");
    else if (diferenciaMeses(nacimiento, hoy) > 36) error("#fechaNacimiento", "#errorFechaNacimiento", "La herramienta está pensada para bebés de hasta 36 meses.");
    if (!prematuro) error("#prematuro", "#errorPrematuro", "Indica si el bebé nació prematuro.");
    if (prematuro === "si" && (!Number.isInteger(semanas) || semanas < 22 || semanas > 36)) error("#edadGestacional", "#errorEdadGestacional", "Introduce entre 22 y 36 semanas completas.");
    if (!metodo) error("#metodo", "#errorMetodo", "Selecciona un método preferido.");
    if (primerError) { primerError.focus(); return null; }
    return { nacimiento, esPrematuro: prematuro === "si", semanas, metodo };
}

function calcular(datos, fechaActual = new Date()) {
    const hoy = inicioDia(fechaActual);
    const diasCronologicos = diferenciaDiasCalendario(datos.nacimiento, hoy);
    const diasCorreccion = datos.esPrematuro ? (40 - datos.semanas) * 7 : 0;
    const diasValoracion = diasCronologicos - diasCorreccion;
    const mesesValoracion = diasValoracion / 30.4375;
    let etapa = "temprana";
    let situacion = "Puede que todavía sea pronto";
    if (mesesValoracion >= 5 && mesesValoracion < 6) { etapa = "proxima"; situacion = "Se aproxima el momento"; }
    if (mesesValoracion >= 6) { etapa = "habitual"; situacion = "Podría encontrarse en una etapa habitual para iniciar alimentación complementaria"; }
    const nombresMetodo = { tradicional: "Alimentación tradicional", blw: "Baby Led Weaning (BLW)", ambos: "Ambos métodos" };
    const edadCronologica = formatearEdad(diasCronologicos);
    const edadCorregida = datos.esPrematuro
        ? formatearEdadCorregida(diasValoracion)
        : "No corresponde";
    const edadUsada = datos.esPrematuro ? "edad corregida" : "edad cronológica";
    return {
        principal: situacion,
        secundarios: { cronologica: edadCronologica, corregida: edadCorregida, metodo: nombresMetodo[datos.metodo] },
        resumen: `La orientación se basa en la ${edadUsada}. Cada bebé tiene su propio ritmo.`,
        descripcion: "La decisión debe individualizarse por el pediatra o el equipo sanitario que sigue al bebé.",
        interpretacion: datos.esPrematuro
            ? `Para valorar el inicio se suele considerar la edad corregida (${edadCorregida}), además del desarrollo y las señales de preparación; no solo la edad cronológica.`
            : "Para valorar el inicio se consideran la edad, el desarrollo y las señales de preparación. La edad por sí sola no determina que el bebé esté preparado.",
        recomendaciones: recomendacionesPorEtapa(etapa, datos.metodo), etapa, metodo: datos.metodo,
        edadUsada, mesesValoracion
    };
}

function recomendacionesPorEtapa(etapa, metodo) {
    const comun = etapa === "temprana"
        ? ["La leche materna o la fórmula infantil indicada sigue siendo el alimento principal.", "Observa las señales de preparación sin apresurar el proceso.", "No inicies alimentos sólidos por este resultado: coméntalo con el equipo sanitario."]
        : etapa === "proxima"
            ? ["La leche continúa siendo el alimento principal.", "Observa conjuntamente el control de cabeza, la postura, la coordinación y el interés por la comida.", "Comenta con el pediatra cuándo y cómo comenzar."]
            : ["Pueden ofrecerse progresivamente alimentos variados con una textura y presentación seguras.", "Avanza hacia una mayor variedad y nuevas texturas según las habilidades del bebé.", "La leche materna o la fórmula infantil indicada continúa teniendo un papel principal durante el primer año."];
    return [...comun, recomendacionMetodo(metodo, etapa)];
}

function recomendacionMetodo(metodo, etapa) {
    if (metodo === "blw") {
        return etapa === "temprana"
            ? "El BLW se valora más adelante, cuando exista estabilidad postural y coordinación suficientes."
            : "En BLW, prioriza alimentos blandos en formatos seguros, postura erguida y supervisión continua.";
    }
    if (metodo === "ambos") {
        return etapa === "temprana"
            ? "Más adelante pueden combinarse cuchara y alimentos para manipular, sin imponer un único enfoque."
            : "Puedes combinar cuchara y alimentos para manipular, adaptando cada textura y respetando hambre y saciedad.";
    }
    return etapa === "temprana"
        ? "La alimentación con cuchara se valorará más adelante con texturas adaptadas y respuesta a las señales del bebé."
        : "Con cuchara, progresa desde texturas adaptadas hacia preparaciones menos homogéneas según sus habilidades.";
}

function pintarDetallesPersonalizados(resultado) {
    establecerTexto("#criterioEdad", resultado.edadUsada === "edad corregida" ? "Usar como referencia: edad corregida" : "Usar como referencia: edad cronológica");
    const textos = resultado.etapa === "temprana"
        ? ["Ahora: leche como alimento principal y observación de señales.", "Próximamente: valorar la preparación junto al equipo sanitario.", "Más adelante: ampliar alimentos y texturas de forma progresiva."]
        : resultado.etapa === "proxima"
            ? ["Ahora: observar señales de preparación.", "Próximamente: iniciar solo cuando esté preparado y con orientación sanitaria.", "Más adelante: aumentar variedad y avanzar en texturas seguras."]
            : ["Ahora: inicio o progresión con alimentos y texturas seguras.", "Próximamente: ampliar variedad e introducir alérgenos progresivamente.", "Más adelante: avanzar en autonomía y texturas según el desarrollo."];
    $$("#lineaPersonalizada .linea-texto").forEach((elemento, indice) => { elemento.textContent = textos[indice]; });
}

function reiniciarHerramienta() {
    reiniciarHerramientaBase();
    actualizarCampoPrematuridad();
    $(CONFIG.selectores.seccionResultados).hidden = true;
}

function prepararPreguntaFrecuente(detalle, indice) {
    const resumen = $("summary", detalle);
    const respuesta = $("p", detalle);
    if (!resumen || !respuesta) return;
    const idRespuesta = `respuesta-faq-${indice + 1}`;
    respuesta.id = idRespuesta;
    resumen.setAttribute("aria-controls", idRespuesta);
    resumen.setAttribute("aria-expanded", String(detalle.open));
    detalle.addEventListener("toggle", () => {
        resumen.setAttribute("aria-expanded", String(detalle.open));
    });
}

function fechaDesdeInput(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
}
function fechaISOLocal(fecha) { return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`; }
function inicioDia(fecha) { return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()); }
function diferenciaMeses(inicio, fin) { return (fin.getFullYear() - inicio.getFullYear()) * 12 + fin.getMonth() - inicio.getMonth(); }
function diferenciaDiasCalendario(inicio, fin) {
    const inicioUTC = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const finUTC = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return Math.floor((finUTC - inicioUTC) / 86400000);
}
function formatearEdad(totalDias) {
    if (totalDias < 0) totalDias = 0;
    const meses = Math.floor(totalDias / 30.4375);
    const dias = Math.max(0, Math.round(totalDias - meses * 30.4375));
    if (meses === 0) return `${dias} ${dias === 1 ? "día" : "días"}`;
    return `${meses} ${meses === 1 ? "mes" : "meses"}${dias ? ` y ${dias} ${dias === 1 ? "día" : "días"}` : ""}`;
}

function formatearEdadCorregida(totalDias) {
    if (totalDias >= 0) return formatearEdad(totalDias);
    const diasRestantes = Math.abs(totalDias);
    const semanas = Math.floor(diasRestantes / 7);
    const dias = diasRestantes % 7;
    const partes = [];
    if (semanas) partes.push(`${semanas} ${semanas === 1 ? "semana" : "semanas"}`);
    if (dias) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
    return `Aún no ha alcanzado la fecha prevista de parto; faltan ${partes.join(" y ")}`;
}
