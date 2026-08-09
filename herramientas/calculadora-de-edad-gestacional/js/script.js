/* =====================================================
   CALCULADORA DE EDAD GESTACIONAL PRO — LÓGICA
===================================================== */
"use strict";

const MS_DIA = 86400000;
const DIAS_GESTACION = 280;
const DIAS_MAXIMOS = 301;
let ultimoResultado = null;

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    const botonReiniciar = $(CONFIG.selectores.botonReiniciar);
    const metodo = $("#metodo");
    const fecha = $("#fecha");

    formulario.addEventListener("submit", procesarFormulario);
    botonReiniciar.addEventListener("click", reiniciarHerramienta);
    metodo.addEventListener("change", actualizarMetodo);
    fecha.addEventListener("input", limpiarResultadoEspecifico);
    actualizarLimitesFecha();
    actualizarMetodo();
}

function hoyLocal() {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

function fechaDesdeISO(valor) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!partes) return null;
    const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    if (fecha.getFullYear() !== Number(partes[1]) ||
        fecha.getMonth() !== Number(partes[2]) - 1 ||
        fecha.getDate() !== Number(partes[3])) return null;
    return fecha;
}

function fechaAISO(fecha) {
    const relleno = numero => String(numero).padStart(2, "0");
    return `${fecha.getFullYear()}-${relleno(fecha.getMonth() + 1)}-${relleno(fecha.getDate())}`;
}

function sumarDias(fecha, dias) {
    const copia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function diferenciaDias(inicio, fin) {
    const utcInicio = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const utcFin = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return Math.round((utcFin - utcInicio) / MS_DIA);
}

function formatearFecha(fecha) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric", month: "long", year: "numeric"
    }).format(fecha);
}

function actualizarLimitesFecha() {
    const hoy = hoyLocal();
    $("#fecha").max = fechaAISO(hoy);
}

function actualizarMetodo() {
    const esFpp = $("#metodo").value === "fpp";
    $("#etiquetaFecha").textContent = esFpp ? "Fecha probable de parto (FPP)" : "Fecha de la última regla (FUR)";
    $("#ayudaFecha").textContent = esFpp
        ? "Indica la FPP que te hayan facilitado; puede estar hasta 40 semanas por delante."
        : "Indica el primer día de tu última menstruación.";
    $("#fecha").max = fechaAISO(esFpp ? sumarDias(hoyLocal(), DIAS_GESTACION) : hoyLocal());
    $("#fecha").value = "";
    limpiarResultadoEspecifico();
}

function limpiarResultadoEspecifico() {
    ultimoResultado = null;
    ocultarResultados();
    $("#progresoGestacional").value = 0;
    $("#progresoTexto").textContent = "0 %";
    $("#desarrolloDinamico").textContent = "";
}

function validarFechaGestacional(metodo, valor) {
    limpiarError("#errorFecha");
    const fechaEntrada = fechaDesdeISO(valor);
    const hoy = hoyLocal();

    if (!fechaEntrada) return { valido: false, mensaje: "Introduce una fecha real y válida." };
    if (metodo === "fur" && fechaEntrada > hoy) {
        return { valido: false, mensaje: "La FUR no puede estar en el futuro." };
    }

    const fur = metodo === "fur" ? fechaEntrada : sumarDias(fechaEntrada, -DIAS_GESTACION);
    const dias = diferenciaDias(fur, hoy);
    if (dias < 0) return { valido: false, mensaje: "La fecha produce un embarazo negativo." };
    if (dias > DIAS_MAXIMOS) return { valido: false, mensaje: "La edad gestacional no puede superar las 43 semanas." };
    return { valido: true, fechaEntrada, fur, dias };
}

function procesarFormulario(evento) {
    evento.preventDefault();
    establecerEstadoCalculando(true);
    const validacionBase = validarFormulario();
    if (!validacionBase.valido) {
        establecerEstadoCalculando(false);
        return;
    }
    const validacionFecha = validarFechaGestacional(validacionBase.valores.metodo, validacionBase.valores.fecha);
    if (!validacionFecha.valido) {
        mostrarError("#errorFecha", validacionFecha.mensaje);
        enfocarElemento($("#fecha"));
        establecerEstadoCalculando(false);
        return;
    }
    const resultado = calcular({ metodo: validacionBase.valores.metodo, ...validacionFecha });
    ultimoResultado = resultado;
    pintarResultados(resultado);
    pintarContenidoGestacional(resultado);
    establecerEstadoCalculando(false);
}

function obtenerTrimestre(dias) {
    if (dias < 14 * 7) return "Primer trimestre";
    if (dias < 28 * 7) return "Segundo trimestre";
    return "Tercer trimestre";
}

function proximoCambioTrimestre(fur, dias) {
    if (dias < 14 * 7) return formatearFecha(sumarDias(fur, 14 * 7));
    if (dias < 28 * 7) return formatearFecha(sumarDias(fur, 28 * 7));
    return "Ya estás en el tercer trimestre";
}

function obtenerFase(semanas) {
    if (semanas < 5) return "Inicio del embarazo";
    if (semanas < 14) return "Desarrollo temprano";
    if (semanas < 28) return "Segundo trimestre";
    if (semanas < 37) return "Último trimestre";
    return "Embarazo a término";
}

function obtenerDesarrollo(semanas) {
    if (semanas < 12) return "En esta fase temprana se forman estructuras básicas. Son habituales el cansancio y cambios digestivos.";
    if (semanas < 20) return "El crecimiento continúa y algunas personas empiezan a percibir movimientos. Pueden aparecer cambios visibles en el abdomen.";
    if (semanas < 28) return "El bebé sigue madurando y sus movimientos suelen hacerse más reconocibles. El cuerpo continúa adaptándose al embarazo.";
    if (semanas < 36) return "Aumentan el crecimiento y la maduración. Pueden ser habituales la presión abdominal y un mayor cansancio.";
    return "El embarazo se acerca al término y el bebé continúa preparándose para el nacimiento. Es frecuente notar más peso y presión pélvica.";
}

function obtenerRecomendaciones(semanas) {
    const consejos = semanas < 14
        ? ["Comenta con tu equipo sanitario la suplementación y las primeras revisiones.", "Descansa y mantén una alimentación variada adaptada a tus necesidades."]
        : semanas < 28
            ? ["Sigue el calendario de controles prenatales indicado.", "Mantén actividad física apropiada si tu profesional sanitario la recomienda."]
            : ["Prepara las próximas revisiones y consulta las señales por las que deberías pedir valoración.", "Organiza con antelación lo necesario para el nacimiento."];
    consejos.push("No sustituye el seguimiento de profesionales sanitarios.");
    return consejos;
}

function calcular(datos) {
    const semanas = Math.floor(datos.dias / 7);
    const diasAdicionales = datos.dias % 7;
    const fpp = sumarDias(datos.fur, DIAS_GESTACION);
    const concepcion = sumarDias(datos.fur, 14);
    const restantes = Math.max(0, diferenciaDias(hoyLocal(), fpp));
    const proximaSemana = sumarDias(datos.fur, (semanas + 1) * 7);
    const porcentaje = Math.min(100, Math.max(0, Math.round((datos.dias / DIAS_GESTACION) * 100)));
    const fase = obtenerFase(semanas);

    return {
        principal: `${semanas} semanas + ${diasAdicionales} días`,
        secundarios: {
            diaGestacional: `Día ${datos.dias + 1}`,
            trimestre: obtenerTrimestre(datos.dias),
            fechaParto: formatearFecha(fpp),
            tiempoRestante: restantes > 0 ? `Faltan ${restantes} días` : "Fecha estimada alcanzada",
            concepcion: `${formatearFecha(concepcion)} (estimada)`,
            proximaSemana: formatearFecha(proximaSemana),
            proximoTrimestre: proximoCambioTrimestre(datos.fur, datos.dias)
        },
        resumen: `Estimación basada en ${datos.metodo === "fur" ? "la fecha de última regla" : "la fecha probable de parto"}.`,
        descripcion: `${fase}. Semana completa ${semanas}, día adicional ${diasAdicionales}.`,
        interpretacion: `${fase}. ${obtenerDesarrollo(semanas)} La evolución del embarazo puede variar entre personas.`,
        recomendaciones: obtenerRecomendaciones(semanas),
        semanas,
        porcentaje,
        desarrollo: obtenerDesarrollo(semanas)
    };
}

function pintarContenidoGestacional(resultado) {
    $("#progresoGestacional").value = resultado.porcentaje;
    $("#progresoTexto").textContent = `${resultado.porcentaje} %`;
    $("#progresoSemana").textContent = `Semana ${resultado.semanas}`;
    $("#desarrolloDinamico").textContent = `Semana ${resultado.semanas}: ${resultado.desarrollo} La evolución del embarazo puede variar entre personas.`;
}

function reiniciarHerramienta() {
    reiniciarHerramientaBase();
    ultimoResultado = null;
    $("#metodo").value = "fur";
    actualizarMetodo();
    establecerTexto("#interpretacionResultado", CONFIG.textosResultado.interpretacion);
    $$(".resultado-tarjeta span[id]").forEach(elemento => { elemento.textContent = "—"; });
}
