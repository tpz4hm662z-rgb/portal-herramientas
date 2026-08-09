/* =====================================================
   IMOANCY TEMPLATE
   script.js
   Versión 3.0 Stable
   © 2026 José Carlos Núñez Florido

   Aquí SOLO debe existir la lógica propia de
   la herramienta.

   Todo lo demás pertenece a core.js
===================================================== */

"use strict";


/* =====================================================
   INICIALIZACIÓN
===================================================== */

document.addEventListener("DOMContentLoaded", iniciarHerramienta);


function iniciarHerramienta() {

    const formulario = $(CONFIG.selectores.formulario);

    const botonReiniciar = $(CONFIG.selectores.botonReiniciar);

    formulario.addEventListener("submit", procesarFormulario);

    botonReiniciar.addEventListener("click", reiniciarHerramientaBase);

}


/* =====================================================
   PROCESAR FORMULARIO
===================================================== */

function procesarFormulario(evento) {

    evento.preventDefault();

    establecerEstadoCalculando(true);

    const validacion = validarFormulario();

    if (!validacion.valido) {

        establecerEstadoCalculando(false);

        return;

    }

    const datos = validacion.valores;

    try {

        const resultado = calcular(datos);

        pintarResultados(resultado);

        pintarPorcentajesSinUnidadDuplicada(resultado);

    } catch (error) {

        debugError(
            "Error al preparar los resultados de masa muscular.",
            error
        );

        mostrarErrorGeneral(
            CONFIG.mensajes.errorCalculo
        );

    } finally {

        establecerEstadoCalculando(false);

    }

}


/* =====================================================
   AJUSTE DE PRESENTACIÓN DE PORCENTAJES
===================================================== */

function pintarPorcentajesSinUnidadDuplicada(resultado) {

    establecerTexto(
        CONFIG.resultadoPrincipal.selectorValor,
        formatearNumero(
            resultado.principal,
            CONFIG.resultadoPrincipal.decimales
        )
    );

    const configuracionRango =
        CONFIG.resultadosSecundarios.find(
            configuracion =>
                configuracion.clave ===
                "rangoOrientativo"
        );

    if (!configuracionRango) return;

    establecerTexto(
        configuracionRango.selectorValor,
        resultado.secundarios.rangoOrientativo
    );

}


/* =====================================================
   LÓGICA DE LA HERRAMIENTA

   ESTA ES LA ÚNICA FUNCIÓN QUE CAMBIARÁ
   EN CADA NUEVA CALCULADORA.
===================================================== */

function calcular(datos) {

    /*
       ESTIMACIÓN ANTROPOMÉTRICA ORIENTATIVA

       No equivale a una medición clínica ni sustituye
       métodos instrumentales de composición corporal.
    */

    const {
        sexo,
        edad,
        altura,
        peso,
        nivelActividad
    } = datos;

    debugLog(
        "Datos recibidos por la Calculadora de Porcentaje de Masa Muscular Pro:",
        {
            sexo,
            edad,
            altura,
            peso,
            nivelActividad
        }
    );

    const estimacion =
        calcularEstimacionMasaMuscular({
            sexo,
            edad,
            altura,
            peso,
            nivelActividad
        });

    const {
        porcentajeMasaMuscular,
        masaMuscularKg
    } = estimacion;

    const rangos = obtenerRangosOrientativos(
        sexo,
        edad
    );

    const clasificacion = clasificarPorcentaje(
        porcentajeMasaMuscular,
        rangos
    );

    const rangoOrientativo =
        formatearRangoOrientativo(rangos);

    const interpretacion =
        crearInterpretacion({
            porcentajeMasaMuscular,
            masaMuscularKg,
            clasificacion,
            rangoOrientativo,
            edad,
            nivelActividad
        });

    const recomendaciones =
        crearRecomendaciones({
            clasificacion,
            edad,
            nivelActividad
        });

    return {

        principal:
            porcentajeMasaMuscular,

        secundarios: {

            clasificacion:
                clasificacion,

            masaMuscularKg:
                masaMuscularKg,

            rangoOrientativo:
                rangoOrientativo

        },

        resumen:
            "Estimación orientativa de masa muscular basada en los datos introducidos. No es una medición clínica.",

        descripcion:
            "Porcentaje estimado mediante un modelo antropométrico; puede diferir de una medición instrumental.",

        interpretacion:
            interpretacion,

        recomendaciones

    };

}


/* =====================================================
   ALGORITMO DE ESTIMACIÓN

   Función aislada para poder sustituir el modelo
   antropométrico sin modificar el resto del flujo.
===================================================== */

function calcularEstimacionMasaMuscular(datos) {

    const {
        sexo,
        edad,
        altura,
        peso
    } = datos;

    const valoresNumericos = [
        edad,
        altura,
        peso
    ];

    const sexoValido =
        sexo === "mujer" ||
        sexo === "hombre";

    if (
        !sexoValido ||
        !valoresNumericos.every(Number.isFinite) ||
        peso <= 0 ||
        altura <= 0 ||
        edad <= 0
    ) {

        throw new Error(
            "No se puede generar la estimación con los datos recibidos."
        );

    }

    const alturaMetros = altura / 100;

    const factorSexo =
        sexo === "hombre" ? 1 : 0;

    /*
       Modelo antropométrico de Lee et al.
       Se usa el coeficiente étnico neutro (0) porque
       el formulario no solicita ese dato.
    */

    const masaMuscularCalculada =
        (0.244 * peso) +
        (7.8 * alturaMetros) +
        (6.6 * factorSexo) -
        (0.098 * edad) -
        3.3;

    const masaMuscularLimitada =
        limitarNumero(
            masaMuscularCalculada,
            0,
            peso
        );

    const masaMuscularKg = redondearNumero(
        masaMuscularLimitada,
        1
    );

    const porcentajeMasaMuscular =
        redondearNumero(
            limitarNumero(
                (masaMuscularLimitada / peso) * 100,
                0,
                100
            ),
            1
        );

    if (
        !Number.isFinite(masaMuscularKg) ||
        !Number.isFinite(porcentajeMasaMuscular)
    ) {

        throw new Error(
            "La estimación no ha generado valores numéricos válidos."
        );

    }

    return {
        porcentajeMasaMuscular,
        masaMuscularKg
    };

}


/* =====================================================
   RANGOS Y CLASIFICACIÓN ORIENTATIVA
===================================================== */

function obtenerRangosOrientativos(sexo, edad) {

    const grupoEdad =
        edad <= 39
            ? "18-39"
            : edad <= 59
                ? "40-59"
                : "60-80";

    const rangos = {

        mujer: {

            "18-39": {
                minimo: 24.3,
                maximo: 30.3,
                alto: 35.3
            },

            "40-59": {
                minimo: 24.1,
                maximo: 30.1,
                alto: 35.1
            },

            "60-80": {
                minimo: 23.9,
                maximo: 29.9,
                alto: 34.9
            }

        },

        hombre: {

            "18-39": {
                minimo: 33.3,
                maximo: 39.3,
                alto: 44.0
            },

            "40-59": {
                minimo: 33.1,
                maximo: 39.1,
                alto: 43.8
            },

            "60-80": {
                minimo: 32.9,
                maximo: 38.9,
                alto: 43.6
            }

        }

    };

    return rangos[sexo][grupoEdad];

}


function clasificarPorcentaje(
    porcentaje,
    rangos
) {

    if (porcentaje < rangos.minimo) {

        return "Bajo";

    }

    if (porcentaje <= rangos.maximo) {

        return "En rango orientativo";

    }

    if (porcentaje <= rangos.alto) {

        return "Alto";

    }

    return "Muy alto";

}


function formatearRangoOrientativo(rangos) {

    const minimo =
        formatearNumero(rangos.minimo, 1);

    const maximo =
        formatearNumero(rangos.maximo, 1);

    return `${minimo}–${maximo}`;

}


/* =====================================================
   INTERPRETACIÓN PERSONALIZADA
===================================================== */

function crearInterpretacion(datos) {

    const textosClasificacion = {

        "Bajo":
            "El valor queda por debajo del rango orientativo usado como referencia.",

        "En rango orientativo":
            "El valor se encuentra dentro del rango orientativo usado como referencia.",

        "Alto":
            "El valor queda por encima del rango orientativo y dentro de la categoría alta.",

        "Muy alto":
            "El valor se sitúa en la categoría muy alta de la referencia utilizada."

    };

    const actividad =
        obtenerTextoActividad(
            datos.nivelActividad
        );

    const avisoEdad =
        datos.edad > 80
            ? " Para edades superiores a 80 años se utiliza solo como aproximación el último rango disponible."
            : "";

    return (
        `Esta estimación orientativa sitúa tu masa muscular en ` +
        `${formatearNumero(datos.porcentajeMasaMuscular, 1)} % ` +
        `(${formatearNumero(datos.masaMuscularKg, 1)} kg). ` +
        `${textosClasificacion[datos.clasificacion]} ` +
        `El rango de referencia es ${datos.rangoOrientativo} % y ` +
        `el nivel de actividad indicado es ${actividad}. ` +
        `No es una medición clínica y puede diferir de métodos instrumentales.` +
        avisoEdad
    );

}


function obtenerTextoActividad(nivelActividad) {

    const textos = {

        sedentario:
            "sedentario",

        ligero:
            "ligero",

        moderado:
            "moderado",

        alto:
            "alto",

        "muy-alto":
            "muy alto"

    };

    return textos[nivelActividad] || "no especificado";

}


/* =====================================================
   RECOMENDACIONES PERSONALIZADAS
===================================================== */

function crearRecomendaciones(datos) {

    const recomendaciones = [];

    if (datos.clasificacion === "Bajo") {

        recomendaciones.push(
            "Si deseas mejorar tu masa muscular, considera un programa progresivo de fuerza adaptado a tu experiencia."
        );

    } else if (
        datos.clasificacion === "Alto" ||
        datos.clasificacion === "Muy alto"
    ) {

        recomendaciones.push(
            "Prioriza un progreso equilibrado: una cifra más alta no implica por sí sola mejor salud o rendimiento."
        );

    } else {

        recomendaciones.push(
            "Mantén hábitos sostenibles de fuerza, alimentación y recuperación para favorecer la conservación muscular."
        );

    }

    const recomendacionesActividad = {

        sedentario:
            "Empieza la actividad de forma gradual y valora orientación profesional antes de aumentar la intensidad.",

        ligero:
            "Puedes incorporar trabajo de fuerza progresivo y dejar tiempo suficiente para la recuperación.",

        moderado:
            "Mantén una progresión razonable y revisa periódicamente la técnica, la carga y el descanso.",

        alto:
            "Con un nivel de actividad alto, presta especial atención a la recuperación, el sueño y la distribución de cargas.",

        "muy-alto":
            "Con entrenamiento diario, planifica descansos y evita aumentar volumen o intensidad sin una recuperación adecuada."

    };

    recomendaciones.push(
        recomendacionesActividad[
            datos.nivelActividad
        ]
    );

    if (datos.edad >= 60) {

        recomendaciones.push(
            "A partir de los 60 años conviene priorizar técnica, progresión gradual y asesoramiento profesional cuando sea necesario."
        );

    } else {

        recomendaciones.push(
            "Repite la estimación en condiciones similares y observa la tendencia, no una cifra aislada."
        );

    }

    recomendaciones.push(
        "Esta orientación no sustituye una valoración médica, nutricional o deportiva individual."
    );

    return recomendaciones.filter(Boolean);

}
