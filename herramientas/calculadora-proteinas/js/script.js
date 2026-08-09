/* =====================================================
   CALCULADORA DE PROTEÍNAS DIARIAS
   script.js
   Versión 1.0
   Herramientas360 Template v3.0
   © 2026 José Carlos Núñez Florido

   Lógica específica de la herramienta.

   ORDEN DE CARGA:
   1. config.js
   2. core.js
   3. script.js
===================================================== */

"use strict";


/* =====================================================
   1. INICIALIZACIÓN DE LA HERRAMIENTA
===================================================== */

function iniciarHerramienta() {

    const formulario = $(
        CONFIG?.selectores?.formulario
    );

    const botonReiniciar = $(
        CONFIG?.selectores?.botonReiniciar
    );


    if (!formulario) {

        console.error(
            "[Herramientas360] No se encontró el formulario."
        );

        return;

    }


    formulario.addEventListener(
        "submit",
        procesarFormulario
    );


    if (botonReiniciar) {

        botonReiniciar.addEventListener(
            "click",
            reiniciarCalculadoraProteinas
        );

    }


    debugLog(
        "Script específico de proteínas cargado correctamente."
    );

}


/* =====================================================
   2. PROCESAR FORMULARIO
===================================================== */

function procesarFormulario(evento) {

    evento.preventDefault();


    establecerEstadoCalculando(true);


    try {

        const validacion = validarFormulario();


        if (!validacion.valido) {

            mostrarErrorGeneral(
                CONFIG?.mensajes?.formularioIncompleto
            );

            return;

        }


        const resultado = calcularProteinas(
            validacion.valores
        );


        pintarResultados(resultado);

        pintarContenidoProteinas(resultado);


        if (
            CONFIG?.desarrollo?.registrarCalculos
        ) {

            debugLog(
                "Resultado del cálculo:",
                resultado
            );

        }

    } catch (error) {

        console.error(
            "[Herramientas360] No se ha podido calcular la proteína diaria.",
            error
        );

    } finally {

        establecerEstadoCalculando(false);

    }

}


/* =====================================================
   3. MOTOR DE CÁLCULO
===================================================== */

function calcularProteinas(datos) {

    const peso = convertirANumero(
        datos.peso
    );

    const edad = convertirANumero(
        datos.edad
    );

    const comidas = convertirANumero(
        datos.comidas
    );

    const sexo = datos.sexo;

    const actividad = datos.actividad;

    const objetivo = datos.objetivo;


    comprobarDatosCalculo({

        peso,

        edad,

        comidas,

        sexo,

        actividad,

        objetivo

    });


    const factor = obtenerFactorProteina(
        objetivo,
        actividad
    );


    const factorSuperior =
        factor +
        CONFIG.referencias.incrementoRangoSuperior;


    const proteinaDiaria = redondearNumero(
        peso * factor,
        0
    );


    const referenciaMinima = redondearNumero(
        peso *
        CONFIG.referencias.factorMinimoAdultos,
        0
    );


    const rangoSuperior = redondearNumero(
        peso * factorSuperior,
        0
    );


    const proteinaPorComida = redondearNumero(
        proteinaDiaria / comidas,
        0
    );


    const resumen = crearResumenResultado({

        peso,

        actividad,

        objetivo,

        proteinaDiaria

    });


    const descripcion =
        crearDescripcionResultado({

            proteinaDiaria,

            factor,

            rangoSuperior

        });


    const reparto =
        crearRepartoComidas({

            proteinaDiaria,

            comidas,

            proteinaPorComida

        });


    const equivalencias =
        calcularEquivalenciasAlimentarias(
            proteinaDiaria
        );


    const interpretacion =
        crearInterpretacionResultado({

            proteinaDiaria,

            referenciaMinima,

            rangoSuperior,

            factor,

            actividad,

            objetivo

        });


    const recomendaciones =
        crearRecomendacionesPersonalizadas({

            edad,

            sexo,

            actividad,

            objetivo,

            comidas,

            proteinaDiaria

        });


    return {

        principal:
            proteinaDiaria,

        secundarios: {

            referenciaMinima,

            proteinaPorComida,

            rangoSuperior

        },

        resumen,

        descripcion,

        interpretacion,

        recomendaciones,

        reparto,

        equivalencias,

        datosCalculo: {

            peso,

            edad,

            sexo,

            actividad,

            objetivo,

            comidas,

            factor,

            factorSuperior,

            proteinaDiaria,

            referenciaMinima,

            rangoSuperior,

            proteinaPorComida

        }

    };

}


/* =====================================================
   4. COMPROBAR DATOS DEL CÁLCULO
===================================================== */

function comprobarDatosCalculo(datos) {

    if (
        datos.peso === null ||
        datos.edad === null ||
        datos.comidas === null
    ) {

        throw new Error(
            "Los datos numéricos no son válidos."
        );

    }


    if (
        !datos.sexo ||
        !datos.actividad ||
        !datos.objetivo
    ) {

        throw new Error(
            "Faltan opciones obligatorias."
        );

    }

}


/* =====================================================
   5. OBTENER FACTOR DE PROTEÍNA
===================================================== */

function obtenerFactorProteina(
    objetivo,
    actividad
) {

    const factoresObjetivo =
        CONFIG?.factoresProteina?.[objetivo];


    if (!factoresObjetivo) {

        throw new Error(
            `Objetivo no reconocido: ${objetivo}`
        );

    }


    const factor =
        factoresObjetivo[actividad];


    if (!Number.isFinite(factor)) {

        throw new Error(
            `Actividad no reconocida: ${actividad}`
        );

    }


    return factor;

}


/* =====================================================
   6. RESUMEN DEL RESULTADO
===================================================== */

function crearResumenResultado(datos) {

    const actividad =
        obtenerNombreActividad(
            datos.actividad
        );

    const objetivo =
        obtenerNombreObjetivo(
            datos.objetivo
        );


    return (
        `Para un peso de ` +
        `${formatearNumero(datos.peso, 0)} kg, ` +
        `una actividad ${actividad} ` +
        `y el objetivo de ${objetivo}, ` +
        `la estimación es de ` +
        `${formatearNumero(datos.proteinaDiaria, 0)} gramos ` +
        `de proteína al día.`
    );

}


/* =====================================================
   7. DESCRIPCIÓN PRINCIPAL
===================================================== */

function crearDescripcionResultado(datos) {

    return (
        `El resultado se ha calculado utilizando un factor de ` +
        `${formatearNumero(datos.factor, 2)} gramos de proteína ` +
        `por kilogramo de peso corporal. ` +
        `Tu rango orientativo se sitúa aproximadamente entre ` +
        `${formatearNumero(datos.proteinaDiaria, 0)} y ` +
        `${formatearNumero(datos.rangoSuperior, 0)} gramos al día.`
    );

}


/* =====================================================
   8. REPARTO ENTRE COMIDAS
===================================================== */

function crearRepartoComidas(datos) {

    const textoComidas =
        datos.comidas === 1
            ? "comida"
            : "comidas";


    return (
        `Si distribuyes los ` +
        `${formatearNumero(datos.proteinaDiaria, 0)} gramos diarios ` +
        `entre ${datos.comidas} ${textoComidas}, ` +
        `obtendrías una media aproximada de ` +
        `${formatearNumero(datos.proteinaPorComida, 0)} gramos ` +
        `por comida. No es necesario que el reparto sea exacto.`
    );

}


/* =====================================================
   9. EQUIVALENCIAS ALIMENTARIAS
===================================================== */

function calcularEquivalenciasAlimentarias(
    proteinaDiaria
) {

    const equivalencias =
        CONFIG?.equivalencias || {};


    const resultados = [];


    const pollo = equivalencias.pollo;

    if (
        pollo &&
        Number.isFinite(
            pollo.proteinaPor100
        )
    ) {

        const cantidad = redondearNumero(

            proteinaDiaria /
            pollo.proteinaPor100 *
            100,

            0

        );


        resultados.push(

            `${pollo.icono || "🍗"} ` +
            `${formatearNumero(cantidad, 0)} g de ` +
            `${pollo.nombre.toLowerCase()}`

        );

    }


    const huevos = equivalencias.huevos;

    if (
        huevos &&
        Number.isFinite(
            huevos.proteinaPorUnidad
        )
    ) {

        const cantidad = redondearNumero(

            proteinaDiaria /
            huevos.proteinaPorUnidad,

            0

        );


        resultados.push(

            `${huevos.icono || "🥚"} ` +
            `${formatearNumero(cantidad, 0)} ` +
            `${huevos.nombre.toLowerCase()}`

        );

    }


    const lentejas = equivalencias.lentejas;

    if (
        lentejas &&
        Number.isFinite(
            lentejas.proteinaPor100
        )
    ) {

        const cantidad = redondearNumero(

            proteinaDiaria /
            lentejas.proteinaPor100 *
            100,

            0

        );


        resultados.push(

            `${lentejas.icono || "🌱"} ` +
            `${formatearNumero(cantidad, 0)} g de ` +
            `${lentejas.nombre.toLowerCase()}`

        );

    }


    const yogur = equivalencias.yogur;

    if (
        yogur &&
        Number.isFinite(
            yogur.proteinaPor100
        )
    ) {

        const cantidad = redondearNumero(

            proteinaDiaria /
            yogur.proteinaPor100 *
            100,

            0

        );


        resultados.push(

            `${yogur.icono || "🥣"} ` +
            `${formatearNumero(cantidad, 0)} g de ` +
            `${yogur.nombre.toLowerCase()}`

        );

    }


    return resultados;

}


/* =====================================================
   10. INTERPRETACIÓN DEL RESULTADO
===================================================== */

function crearInterpretacionResultado(
    datos
) {

    const textoObjetivo =
        CONFIG?.interpretaciones?.[
            datos.objetivo
        ] || "";


    const actividad =
        obtenerNombreActividad(
            datos.actividad
        );


    return (
        `Tu resultado central es de ` +
        `${formatearNumero(datos.proteinaDiaria, 0)} gramos diarios, ` +
        `mientras que la referencia mínima general sería de ` +
        `${formatearNumero(datos.referenciaMinima, 0)} gramos. ` +
        `La estimación utiliza un factor de ` +
        `${formatearNumero(datos.factor, 2)} g/kg ` +
        `para una actividad ${actividad}. ` +
        `${textoObjetivo}`
    );

}


/* =====================================================
   11. RECOMENDACIONES PERSONALIZADAS
===================================================== */

function crearRecomendacionesPersonalizadas(
    datos
) {

    const recomendaciones = [];


    const generales =
        CONFIG?.recomendaciones || [];


    generales.forEach(
        recomendacion => {

            agregarRecomendacionUnica(
                recomendaciones,
                recomendacion
            );

        }
    );


    const porObjetivo =
        CONFIG?.recomendacionesPorObjetivo?.[
            datos.objetivo
        ] || [];


    porObjetivo.forEach(
        recomendacion => {

            agregarRecomendacionUnica(
                recomendaciones,
                recomendacion
            );

        }
    );


    if (
        datos.edad >=
        CONFIG.recomendacionesEdad.edadAvanzada
    ) {

        agregarRecomendacionUnica(

            recomendaciones,

            CONFIG.recomendacionesEdad.mensaje

        );

    }


    if (
        datos.actividad === "alta" ||
        datos.actividad === "muy-alta"
    ) {

        agregarRecomendacionUnica(

            recomendaciones,

            "En niveles altos de actividad física, presta especial atención a la recuperación, la hidratación y el descanso."

        );

    }


    if (
        datos.objetivo === "ganar-musculo"
    ) {

        agregarRecomendacionUnica(

            recomendaciones,

            "Para ganar masa muscular también necesitas suficiente energía total; aumentar solo la proteína no garantiza el crecimiento muscular."

        );

    }


    if (
        datos.objetivo === "perder-grasa"
    ) {

        agregarRecomendacionUnica(

            recomendaciones,

            "Durante una etapa de pérdida de grasa, intenta mantener un déficit energético moderado y entrenamiento de fuerza."

        );

    }


    if (
        datos.comidas <= 3
    ) {

        agregarRecomendacionUnica(

            recomendaciones,

            "Al realizar pocas comidas, procura que cada una contenga una fuente significativa de proteína."

        );

    }


    return recomendaciones;

}


/* =====================================================
   12. EVITAR RECOMENDACIONES DUPLICADAS
===================================================== */

function agregarRecomendacionUnica(
    lista,
    recomendacion
) {

    if (
        estaVacio(recomendacion)
    ) {

        return;

    }


    if (
        !lista.includes(recomendacion)
    ) {

        lista.push(recomendacion);

    }

}


/* =====================================================
   13. NOMBRES LEGIBLES
===================================================== */

function obtenerNombreActividad(
    actividad
) {

    return (
        CONFIG?.nombres?.actividades?.[
            actividad
        ] ||
        actividad
    );

}


function obtenerNombreObjetivo(
    objetivo
) {

    return (
        CONFIG?.nombres?.objetivos?.[
            objetivo
        ] ||
        objetivo
    );

}


/* =====================================================
   14. PINTAR CONTENIDO ESPECÍFICO
===================================================== */

function pintarContenidoProteinas(
    resultado
) {

    pintarTextoProteinas(

        CONFIG?.selectores?.repartoComidas,

        resultado.reparto

    );


    pintarListaProteinas(

        CONFIG?.selectores?.listaEquivalencias,

        resultado.equivalencias

    );

}


/* =====================================================
   15. PINTAR TEXTO ESPECÍFICO
===================================================== */

function pintarTextoProteinas(
    selector,
    texto
) {

    if (!selector) return;


    const elemento = $(selector);


    if (!elemento) {

        debugAdvertencia(
            `No se encontró el elemento ${selector}.`
        );

        return;

    }


    elemento.textContent =
        texto || "";

}


/* =====================================================
   16. PINTAR LISTA DE EQUIVALENCIAS
===================================================== */

function pintarListaProteinas(
    selector,
    elementos
) {

    if (!selector) return;


    const lista = $(selector);


    if (!lista) {

        debugAdvertencia(
            `No se encontró la lista ${selector}.`
        );

        return;

    }


    lista.innerHTML = "";


    if (
        !Array.isArray(elementos) ||
        elementos.length === 0
    ) {

        const elementoLista =
            document.createElement("li");


        elementoLista.textContent =
            "No hay equivalencias disponibles.";


        lista.appendChild(
            elementoLista
        );


        return;

    }


    elementos.forEach(
        texto => {

            const elementoLista =
                document.createElement("li");


            elementoLista.textContent =
                String(texto);


            lista.appendChild(
                elementoLista
            );

        }
    );

}


/* =====================================================
   17. REINICIAR CALCULADORA
===================================================== */

function reiniciarCalculadoraProteinas(
    evento
) {

    if (evento) {

        evento.preventDefault();

    }


    reiniciarHerramientaBase();


    restaurarContenidoInicialProteinas();

}


/* =====================================================
   18. RESTAURAR CONTENIDO INICIAL
===================================================== */

function restaurarContenidoInicialProteinas() {

    pintarTextoProteinas(

        CONFIG?.selectores?.repartoComidas,

        CONFIG?.textosResultado?.reparto || ""

    );


    const listaEquivalencias = $(

        CONFIG?.selectores?.listaEquivalencias

    );


    if (listaEquivalencias) {

        listaEquivalencias.innerHTML = "";


        const elementoLista =
            document.createElement("li");


        elementoLista.textContent =
            "Introduce tus datos para consultar las equivalencias alimentarias.";


        listaEquivalencias.appendChild(
            elementoLista
        );

    }

}


/* =====================================================
   19. INICIO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarHerramienta
);