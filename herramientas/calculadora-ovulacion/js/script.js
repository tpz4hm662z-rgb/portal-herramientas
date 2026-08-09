/* =====================================================
   IMOANCY TEMPLATE
   script.js
   Versión 3.0 Stable
   © 2026 José Carlos Núñez Florido

   Aquí SOLO existe la lógica propia de la herramienta.
   Todo lo demás pertenece a core.js.
===================================================== */

"use strict";


/* =====================================================
   INICIALIZACIÓN
===================================================== */

document.addEventListener("DOMContentLoaded", iniciarHerramienta);


function iniciarHerramienta() {

    const formulario = $(CONFIG.selectores.formulario);
    const botonReiniciar = $(CONFIG.selectores.botonReiniciar);
    const campoFecha = $("#ultimaMenstruacion");

    campoFecha.max = obtenerFechaLocalISO(new Date());

    formulario.addEventListener("submit", procesarFormulario);
    botonReiniciar.addEventListener("click", reiniciarHerramienta);

    prepararLimpiezaResultadosAlEditar();

}


/* =====================================================
   PROCESAR FORMULARIO
===================================================== */

function procesarFormulario(evento) {

    evento.preventDefault();

    establecerEstadoCalculando(true);

    const validacion = validarFormulario();
    const fechaValida = validarFechaMenstruacion(
        validacion.valores.ultimaMenstruacion
    );
    const enterosValidos = validarCamposEnteros(validacion.valores);

    if (!validacion.valido || !fechaValida || !enterosValidos) {

        establecerEstadoCalculando(false);

        return;

    }

    const resultado = calcular(validacion.valores);

    pintarResultados(resultado);
    pintarResultadosAmpliados(resultado.detalles);

    establecerEstadoCalculando(false);

}


/* =====================================================
   LIMPIEZA DE RESULTADOS AL EDITAR
===================================================== */

function prepararLimpiezaResultadosAlEditar() {

    Object.values(CONFIG.campos).forEach(campo => {

        const elemento = $(campo.selector);

        if (!elemento) return;

        const evento = campo.tipo === "select"
            ? "change"
            : "input";

        elemento.addEventListener(evento, limpiarResultadosAnteriores);

    });

}


function limpiarResultadosAnteriores() {

    ocultarResultados();

    establecerTexto("#resultadoPrincipal", "—");
    establecerTexto("#unidadResultadoPrincipal", "");
    establecerTexto("#resultadoSecundarioUno", "—");
    establecerTexto("#resultadoSecundarioDos", "—");
    establecerTexto("#resultadoSecundarioTres", "—");
    establecerTexto(
        "#resumenResultado",
        CONFIG.textosResultado.resumen
    );
    establecerTexto(
        "#descripcionResultadoPrincipal",
        CONFIG.resultadoPrincipal.descripcion
    );
    establecerTexto(
        "#interpretacionResultado",
        CONFIG.textosResultado.interpretacion
    );

    pintarRecomendaciones(CONFIG.recomendaciones);

    [
        "#diasParaOvular",
        "#cicloCalculado",
        "#faseLutea",
        "#tiempoProximoCiclo",
        "#menstruacionIndicada",
        "#hito1Fecha",
        "#hito2Fecha",
        "#hito3Fecha",
        "#hito4Fecha"
    ].forEach(selector => establecerTexto(selector, "—"));

}


/* =====================================================
   VALIDACIONES ESPECÍFICAS
===================================================== */

function validarFechaMenstruacion(valor) {

    const fecha = crearFechaLocal(valor);
    const hoy = inicioDelDia(new Date());
    const campo = $("#ultimaMenstruacion");

    if (!fecha) {

        mostrarError(
            CONFIG.campos.ultimaMenstruacion.selectorError,
            CONFIG.campos.ultimaMenstruacion.mensajes.invalido
        );

        enfocarElemento(campo);

        return false;

    }

    if (fecha.getTime() > hoy.getTime()) {

        mostrarError(
            CONFIG.campos.ultimaMenstruacion.selectorError,
            CONFIG.campos.ultimaMenstruacion.mensajes.futura
        );

        enfocarElemento(campo);

        return false;

    }

    return true;

}


function validarCamposEnteros(datos) {

    const claves = ["duracionCiclo"];
    let valido = true;

    claves.forEach(clave => {

        const valor = datos[clave];

        if (valor !== null && !Number.isInteger(valor)) {

            const campo = CONFIG.campos[clave];

            mostrarError(
                campo.selectorError,
                campo.mensajes.invalido
            );

            valido = false;

        }

    });

    if (datos.duracionMenstruacion !== "") {

        const duracion = convertirANumero(datos.duracionMenstruacion);
        const campo = CONFIG.campos.duracionMenstruacion;

        datos.duracionMenstruacion = duracion;

        if (
            duracion === null ||
            !Number.isInteger(duracion) ||
            duracion < 2 ||
            duracion > 10
        ) {

            const mensaje = duracion !== null && duracion < 2
                ? campo.mensajes.minimo
                : duracion !== null && duracion > 10
                    ? campo.mensajes.maximo
                    : campo.mensajes.invalido;

            mostrarError(campo.selectorError, mensaje);
            valido = false;

        }

    } else {

        datos.duracionMenstruacion = null;

    }

    return valido;

}


/* =====================================================
   LÓGICA DE LA HERRAMIENTA
===================================================== */

function calcular(datos) {

    const inicioCiclo = crearFechaLocal(datos.ultimaMenstruacion);
    const duracionCiclo = datos.duracionCiclo;
    const duracionMenstruacion = datos.duracionMenstruacion || null;
    const faseLutea = 14;

    const proximaMenstruacion = sumarDias(inicioCiclo, duracionCiclo);
    const ovulacion = sumarDias(proximaMenstruacion, -faseLutea);
    const inicioFertil = sumarDias(ovulacion, -5);
    const finFertil = ovulacion;
    const maximaFertilidadInicio = sumarDias(ovulacion, -1);
    const hoy = inicioDelDia(new Date());
    const diasParaOvular = diferenciaDias(hoy, ovulacion);
    const diasProximoCiclo = diferenciaDias(hoy, proximaMenstruacion);

    return {

        principal: formatearFecha(ovulacion),

        secundarios: {

            maximaFertilidad:
                `${formatearFechaCorta(maximaFertilidadInicio)} y ${formatearFechaCorta(ovulacion)}`,

            ventanaFertil:
                `${formatearFechaCorta(inicioFertil)} – ${formatearFechaCorta(finFertil)}`,

            proximaMenstruacion:
                formatearFecha(proximaMenstruacion)

        },

        resumen: construirResumen(
            ovulacion,
            inicioFertil,
            finFertil,
            diasParaOvular
        ),

        descripcion:
            "La ovulación se estima 14 días antes del inicio del siguiente ciclo.",

        interpretacion: construirInterpretacion(
            diasParaOvular,
            inicioFertil,
            finFertil,
            hoy
        ),

        recomendaciones: construirRecomendaciones(diasParaOvular),

        detalles: {

            diasParaOvular,
            duracionCiclo,
            faseLutea,
            diasProximoCiclo,
            duracionMenstruacion,
            inicioCiclo,
            inicioFertil,
            ovulacion,
            proximaMenstruacion

        }

    };

}


/* =====================================================
   RESULTADOS AMPLIADOS
===================================================== */

function pintarResultadosAmpliados(detalles) {

    establecerTexto(
        "#diasParaOvular",
        formatearCuentaAtras(detalles.diasParaOvular, "ovular")
    );

    establecerTexto("#cicloCalculado", `${detalles.duracionCiclo} días`);
    establecerTexto("#faseLutea", `${detalles.faseLutea} días`);

    establecerTexto(
        "#tiempoProximoCiclo",
        formatearCuentaAtras(detalles.diasProximoCiclo, "el próximo ciclo")
    );

    establecerTexto(
        "#menstruacionIndicada",
        detalles.duracionMenstruacion
            ? `${detalles.duracionMenstruacion} días`
            : "No indicada"
    );

    const calendario = [
        ["Inicio del ciclo", detalles.inicioCiclo],
        ["Inicio de ventana fértil", detalles.inicioFertil],
        ["Ovulación estimada", detalles.ovulacion],
        ["Próximo ciclo", detalles.proximaMenstruacion]
    ];

    calendario.forEach(([etiqueta, fecha], indice) => {

        establecerTexto(`#hito${indice + 1}Etiqueta`, etiqueta);
        establecerTexto(`#hito${indice + 1}Fecha`, formatearFechaCorta(fecha));

    });

}


/* =====================================================
   TEXTOS PERSONALIZADOS
===================================================== */

function construirResumen(ovulacion, inicioFertil, finFertil, dias) {

    const estado = dias > 0
        ? `Faltan aproximadamente ${dias} días para ovular.`
        : dias === 0
            ? "Hoy coincide con tu ovulación estimada."
            : "La ovulación estimada de este ciclo ya habría pasado.";

    return `${estado} Tu ventana fértil orientativa va del ${formatearFecha(inicioFertil)} al ${formatearFecha(finFertil)}, con ovulación estimada el ${formatearFecha(ovulacion)}.`;

}


function construirInterpretacion(dias, inicioFertil, finFertil, hoy) {

    if (
        hoy.getTime() >= inicioFertil.getTime() &&
        hoy.getTime() <= finFertil.getTime()
    ) {

        return "Según esta estimación, hoy estás dentro de tu ventana fértil. La probabilidad suele aumentar al acercarse la ovulación, pero el calendario por sí solo no puede confirmarla.";

    }

    if (dias > 0) {

        return "Tu ventana fértil estimada todavía no ha terminado o está próxima. Considera estas fechas como una guía y combina el calendario con señales corporales si buscas mayor precisión.";

    }

    return "La ventana fértil estimada de este ciclo ya habría finalizado. Puedes usar la fecha del próximo ciclo para planificar un nuevo cálculo.";

}


function construirRecomendaciones(dias) {

    const recomendaciones = [
        "Usa la media de varios ciclos completos, especialmente si su duración cambia de un mes a otro.",
        "El moco cervical, la temperatura basal y los test de LH pueden aportar información adicional.",
        "Esta estimación no debe utilizarse como método anticonceptivo."
    ];

    if (dias < -14) {

        recomendaciones.push(
            "Si tu menstruación esperada no ha llegado, valora realizar una prueba de embarazo o consultar con un profesional."
        );

    } else {

        recomendaciones.push(
            "Consulta con un profesional si presentas dolor intenso, sangrado inusual o ciclos persistentemente irregulares."
        );

    }

    return recomendaciones;

}


/* =====================================================
   UTILIDADES DE FECHA
===================================================== */

function crearFechaLocal(valor) {

    if (typeof valor !== "string") return null;

    const partes = valor.split("-").map(Number);

    if (
        partes.length !== 3 ||
        partes.some(parte => !Number.isInteger(parte))
    ) {

        return null;

    }

    const [anio, mes, dia] = partes;
    const fecha = new Date(anio, mes - 1, dia);

    if (
        fecha.getFullYear() !== anio ||
        fecha.getMonth() !== mes - 1 ||
        fecha.getDate() !== dia
    ) {

        return null;

    }

    return inicioDelDia(fecha);

}


function sumarDias(fecha, dias) {

    const resultado = new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate()
    );

    resultado.setDate(resultado.getDate() + dias);

    return resultado;

}


function inicioDelDia(fecha) {

    return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate()
    );

}


function diferenciaDias(desde, hasta) {

    const unDia = 24 * 60 * 60 * 1000;
    const inicioUTC = Date.UTC(
        desde.getFullYear(),
        desde.getMonth(),
        desde.getDate()
    );
    const finUTC = Date.UTC(
        hasta.getFullYear(),
        hasta.getMonth(),
        hasta.getDate()
    );

    return Math.round((finUTC - inicioUTC) / unDia);

}


function formatearFecha(fecha) {

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(fecha);

}


function formatearFechaCorta(fecha) {

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short"
    }).format(fecha);

}


function obtenerFechaLocalISO(fecha) {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;

}


function formatearCuentaAtras(dias, evento) {

    if (dias > 1) return `${dias} días`;
    if (dias === 1) return "1 día";
    if (dias === 0) return `Hoy es la fecha estimada para ${evento}`;

    return `Hace ${Math.abs(dias)} días`;

}


/* =====================================================
   REINICIO ESPECÍFICO
===================================================== */

function reiniciarHerramienta() {

    reiniciarHerramientaBase();
    limpiarResultadosAnteriores();

}
