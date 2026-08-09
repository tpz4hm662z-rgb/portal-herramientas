"use strict";

const DIAS_EMBARAZO = 280;
const MS_DIA = 86400000;

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    formulario.addEventListener("submit", procesarFormulario);
    $("#botonReiniciar").addEventListener("click", reiniciarCalculadora);
    $$('input[name="metodo"]').forEach(radio => radio.addEventListener("change", cambiarMetodo));
    actualizarLimites();
    actualizarMetodo();
}

function actualizarLimites() {
    const hoy = formatearISO(normalizarFecha(new Date()));
    $("#fum").max = hoy;
    $("#fum").min = formatearISO(sumarDias(normalizarFecha(new Date()), -294));
    $("#fpp").min = formatearISO(sumarDias(normalizarFecha(new Date()), -14));
    $("#fpp").max = formatearISO(sumarDias(normalizarFecha(new Date()), DIAS_EMBARAZO));
}

function actualizarMetodo() {
    const metodo = $('input[name="metodo"]:checked')?.value || "fum";
    const usaFum = metodo === "fum";
    $("#grupoFum").classList.toggle("oculto", !usaFum);
    $("#grupoFpp").classList.toggle("oculto", usaFum);
    $("#fum").required = usaFum;
    $("#fpp").required = !usaFum;
    $("#fum").disabled = !usaFum;
    $("#fpp").disabled = usaFum;
    limpiarTodosLosErrores();
}

function cambiarMetodo() {
    $("#fum").value = "";
    $("#fpp").value = "";
    ocultarResultados();
    ocultarElemento($("#botonReiniciar"));
    actualizarMetodo();
    const metodo = $('input[name="metodo"]:checked')?.value || "fum";
    (metodo === "fum" ? $("#fum") : $("#fpp")).focus();
}

function procesarFormulario(evento) {
    evento.preventDefault();
    limpiarTodosLosErrores();
    establecerEstadoCalculando(true);
    const metodo = $('input[name="metodo"]:checked')?.value || "";
    const validacion = validarFechaActiva(metodo);
    if (!validacion.valido) {
        establecerEstadoCalculando(false);
        validacion.campo.focus();
        return;
    }
    const resultado = calcular({ metodo, fecha: validacion.fecha });
    pintarResultados(resultado);
    pintarProgreso(resultado.detalle);
    establecerEstadoCalculando(false);
}

function validarFechaActiva(metodo) {
    const campo = metodo === "fpp" ? $("#fpp") : $("#fum");
    const error = metodo === "fpp" ? "#errorFpp" : "#errorFum";
    if (!campo.value) return invalidar(campo, error, metodo === "fpp" ? "Introduce la fecha probable de parto." : "Introduce la fecha de tu última menstruación.");
    const fecha = fechaLocalDesdeCampo(campo.value);
    if (!fecha) return invalidar(campo, error, "Introduce una fecha válida.");
    const hoy = normalizarFecha(new Date());
    const fum = metodo === "fum" ? fecha : sumarDias(fecha, -DIAS_EMBARAZO);
    const edad = diferenciaDias(fum, hoy);
    if (metodo === "fum" && fecha > hoy) return invalidar(campo, error, "La fecha de última menstruación no puede ser posterior a hoy.");
    if (edad < 0) return invalidar(campo, error, "La fecha indicada sitúa el inicio del embarazo en el futuro. Revísala.");
    if (edad > 294) return invalidar(campo, error, "La estimación supera las 42 semanas. Revisa la fecha o consulta con un profesional sanitario.");
    if (metodo === "fpp" && diferenciaDias(hoy, fecha) > DIAS_EMBARAZO) return invalidar(campo, error, "La fecha probable de parto está demasiado alejada. Revisa el dato.");
    return { valido: true, fecha };
}

function invalidar(campo, selectorError, mensaje) {
    mostrarError(selectorError, mensaje);
    return { valido: false, campo };
}

function calcular(datos) {
    const hoy = normalizarFecha(new Date());
    const fum = datos.metodo === "fum" ? datos.fecha : sumarDias(datos.fecha, -DIAS_EMBARAZO);
    const fpp = datos.metodo === "fpp" ? datos.fecha : sumarDias(datos.fecha, DIAS_EMBARAZO);
    const concepcion = sumarDias(fum, 14);
    const diasTranscurridos = Math.max(0, diferenciaDias(fum, hoy));
    const semanas = Math.floor(diasTranscurridos / 7);
    const dias = diasTranscurridos % 7;
    const diferenciaFpp = diferenciaDias(hoy, fpp);
    const porcentaje = Math.min(100, Math.max(0, Math.round((diasTranscurridos / DIAS_EMBARAZO) * 100)));
    const trimestre = obtenerTrimestre(diasTranscurridos);
    const edadTexto = `${semanas} ${semanas === 1 ? "semana" : "semanas"} y ${dias} ${dias === 1 ? "día" : "días"}`;
    const tiempoFpp = diferenciaFpp >= 0
        ? (diferenciaFpp === 0 ? "La fecha probable de parto es hoy." : `Faltan aproximadamente ${diferenciaFpp} días.`)
        : `La fecha probable de parto fue hace ${Math.abs(diferenciaFpp)} ${Math.abs(diferenciaFpp) === 1 ? "día" : "días"}.`;
    const resumen = `Estás de ${edadTexto}, en el ${trimestre.toLowerCase()}. Tu fecha probable de parto es el ${formatearFecha(fpp)} y ${diferenciaFpp > 0 ? `faltan aproximadamente ${diferenciaFpp} días` : diferenciaFpp === 0 ? "esa fecha es hoy" : `esa fecha fue hace ${Math.abs(diferenciaFpp)} días`}.`;
    const preconcepcion = hoy < concepcion
        ? "La estimación se encuentra dentro de las dos primeras semanas gestacionales; la concepción se estima más adelante y no equivale a la edad fetal."
        : "La edad gestacional se cuenta desde la última menstruación y suele ser unas dos semanas mayor que la edad fetal.";
    return {
        principal: formatearFecha(fpp),
        secundarios: {
            edadGestacional: edadTexto,
            trimestre,
            concepcion: formatearFecha(concepcion),
            fum: `${formatearFecha(fum)}${datos.metodo === "fpp" ? " (estimada)" : ""}`,
            diasRestantes: tiempoFpp,
            porcentaje: `${porcentaje} %`
        },
        resumen,
        descripcion: `Han transcurrido ${diasTranscurridos} días desde la fecha de última menstruación ${datos.metodo === "fpp" ? "estimada" : "indicada"}.`,
        interpretacion: preconcepcion,
        recomendaciones: CONFIG.recomendaciones,
        detalle: { porcentaje, semanas, diasRestantes: Math.max(0, diferenciaFpp), trimestre }
    };
}

function pintarProgreso(detalle) {
    const barra = $("#barraProgreso");
    barra.style.width = `${detalle.porcentaje}%`;
    barra.parentElement.setAttribute("aria-valuenow", String(detalle.porcentaje));
    $("#porcentajeProgreso").textContent = `${detalle.porcentaje} %`;
    const semanasRestantes = Math.max(0, Math.ceil(detalle.diasRestantes / 7));
    $("#textoProgreso").textContent = `${detalle.semanas} semanas transcurridas · ${semanasRestantes} semanas aproximadas restantes`;
    $$(".trimestre-item").forEach(item => {
        const actual = item.dataset.trimestre === detalle.trimestre;
        item.classList.toggle("actual", actual);
        if (actual) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
}

function reiniciarCalculadora() {
    reiniciarHerramientaBase();
    $("#metodoFum").checked = true;
    actualizarMetodo();
}

function fechaLocalDesdeCampo(valor) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!partes) return null;
    const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    return fecha.getFullYear() === Number(partes[1]) && fecha.getMonth() === Number(partes[2]) - 1 && fecha.getDate() === Number(partes[3]) ? normalizarFecha(fecha) : null;
}

function normalizarFecha(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarDias(fecha, dias) {
    const resultado = normalizarFecha(fecha);
    resultado.setDate(resultado.getDate() + dias);
    return normalizarFecha(resultado);
}

function diferenciaDias(inicio, fin) {
    const utcInicio = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const utcFin = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return Math.round((utcFin - utcInicio) / MS_DIA);
}

function formatearFecha(fecha) {
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(fecha);
}

function formatearISO(fecha) {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function obtenerTrimestre(dias) {
    if (dias < 98) return "Primer trimestre";
    if (dias < 196) return "Segundo trimestre";
    return "Tercer trimestre";
}
