/* =====================================================
   HERRAMIENTAS360 TEMPLATE
   script.js
   Versión 3.0 Stable
   © 2026 José Carlos Núñez Florido

   Lógica específica de la
   Calculadora de Porcentaje de Grasa Ideal PRO.

   Todo el motor reutilizable pertenece a core.js.
===================================================== */

"use strict";


/* =====================================================
   REFERENCIA DE RANGOS

   Rangos de porcentaje de grasa vinculados al intervalo
   de IMC considerado saludable, por sexo y grupo de edad.

   Fuente:
   Gallagher D, Heymsfield SB, Heo M, Jebb SA,
   Murgatroyd PR, Sakamoto Y.
   Healthy percentage body fat ranges: an approach for
   developing guidelines based on body mass index.
   Am J Clin Nutr. 2000;72(3):694-701.

   Tabla 4, estimaciones mediante modelo de 4 componentes.
   El límite superior es exclusivo: coincide con el punto
   a partir del cual el estudio relaciona el porcentaje
   de grasa con un IMC igual o superior a 25.

   La publicación ofrece grupos desde 20 años. Para 18 y
   19 años se utiliza el grupo adulto más próximo (20-39)
   y se informa de ello en la interpretación.
===================================================== */

const RANGOS_GRASA_SALUDABLE = {

    mujer: [

        {
            edadMinima: 18,
            edadMaxima: 39,
            minimo: 21,
            maximoExclusivo: 33,
            grupoReferencia: "20 a 39 años"
        },

        {
            edadMinima: 40,
            edadMaxima: 59,
            minimo: 23,
            maximoExclusivo: 34,
            grupoReferencia: "40 a 59 años"
        },

        {
            edadMinima: 60,
            edadMaxima: 79,
            minimo: 24,
            maximoExclusivo: 36,
            grupoReferencia: "60 a 79 años"
        }

    ],

    hombre: [

        {
            edadMinima: 18,
            edadMaxima: 39,
            minimo: 8,
            maximoExclusivo: 20,
            grupoReferencia: "20 a 39 años"
        },

        {
            edadMinima: 40,
            edadMaxima: 59,
            minimo: 11,
            maximoExclusivo: 22,
            grupoReferencia: "40 a 59 años"
        },

        {
            edadMinima: 60,
            edadMaxima: 79,
            minimo: 13,
            maximoExclusivo: 25,
            grupoReferencia: "60 a 79 años"
        }

    ]

};


/* =====================================================
   INICIALIZACIÓN
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarHerramienta
);


function iniciarHerramienta() {

    const formulario = $(
        CONFIG.selectores.formulario
    );

    const botonReiniciar = $(
        CONFIG.selectores.botonReiniciar
    );

    if (!formulario || !botonReiniciar) {

        debugError(
            "No se encontraron los elementos principales de la calculadora."
        );

        return;

    }

    formulario.addEventListener(
        "submit",
        procesarFormulario
    );

    botonReiniciar.addEventListener(
        "click",
        reiniciarHerramientaBase
    );

}


/* =====================================================
   PROCESAR FORMULARIO
===================================================== */

function procesarFormulario(evento) {

    evento.preventDefault();

    establecerEstadoCalculando(true);

    try {

        const validacion = validarFormulario();

        if (!validacion.valido) return;

        const datos = normalizarDatos(
            validacion.valores
        );

        if (!validarDatosEspecificos(datos)) return;

        const resultado = calcular(datos);

        if (!resultadoEsValido(resultado)) {

            throw new Error(
                "El cálculo ha generado un resultado no válido."
            );

        }

        pintarResultados(resultado);

        pintarComparacionResultado(
            resultado.comparacion
        );

        debugLog(
            "Cálculo completado:",
            resultado
        );

    } catch (error) {

        debugError(
            CONFIG.mensajes.errorCalculo,
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
   NORMALIZACIÓN DE DATOS
===================================================== */

function normalizarDatos(datos) {

    return {

        sexo:
            String(datos.sexo || "").trim(),

        edad:
            convertirANumero(datos.edad),

        altura:
            convertirANumero(datos.altura),

        peso:
            convertirANumero(datos.peso),

        grasaActual:
            convertirANumero(datos.grasaActual),

        actividad:
            String(datos.actividad || "").trim(),

        objetivo:
            String(datos.objetivo || "").trim()

    };

}


/* =====================================================
   VALIDACIÓN ESPECÍFICA

   core.js valida los campos obligatorios y sus límites.
   Aquí se cubren reglas que el motor v3.0 no contempla:

   - listas cerradas de opciones;
   - edad expresada como número entero;
   - número opcional con límites.
===================================================== */

function validarDatosEspecificos(datos) {

    let datosValidos = true;

    const clavesSelect = [
        "sexo",
        "actividad",
        "objetivo"
    ];

    clavesSelect.forEach(clave => {

        const campo = CONFIG.campos[clave];

        if (
            campo?.opcionesPermitidas &&
            !campo.opcionesPermitidas.includes(datos[clave])
        ) {

            mostrarError(
                campo.selectorError,
                campo.mensajes.invalido
            );

            datosValidos = false;

        }

    });


    if (!Number.isInteger(datos.edad)) {

        mostrarError(
            CONFIG.campos.edad.selectorError,
            "Introduce la edad en años completos."
        );

        datosValidos = false;

    }


    const valorGrasaOriginal = $(
        CONFIG.campos.grasaActual.selector
    )?.value;

    const grasaFueIntroducida =
        !estaVacio(valorGrasaOriginal);

    if (
        grasaFueIntroducida &&
        datos.grasaActual === null
    ) {

        mostrarError(
            CONFIG.campos.grasaActual.selectorError,
            CONFIG.campos.grasaActual.mensajes.invalido
        );

        datosValidos = false;

    }


    if (
        grasaFueIntroducida &&
        datos.grasaActual !== null &&
        datos.grasaActual < CONFIG.campos.grasaActual.minimo
    ) {

        mostrarError(
            CONFIG.campos.grasaActual.selectorError,
            CONFIG.campos.grasaActual.mensajes.minimo
        );

        datosValidos = false;

    }


    if (
        grasaFueIntroducida &&
        datos.grasaActual !== null &&
        datos.grasaActual > CONFIG.campos.grasaActual.maximo
    ) {

        mostrarError(
            CONFIG.campos.grasaActual.selectorError,
            CONFIG.campos.grasaActual.mensajes.maximo
        );

        datosValidos = false;

    }


    if (!datosValidos) {

        enfocarPrimerErrorEspecifico();

    }

    return datosValidos;

}


function enfocarPrimerErrorEspecifico() {

    const campoConError = Object.values(
        CONFIG.campos
    ).find(campo => {

        const elementoError = $(
            campo.selectorError
        );

        return (
            elementoError &&
            !estaVacio(elementoError.textContent)
        );

    });

    if (!campoConError) return;

    const elementoCampo = $(
        campoConError.selector
    );

    if (!elementoCampo) return;

    scrollAElemento(
        elementoCampo,
        {
            block: "center"
        }
    );

    enfocarElemento(elementoCampo);

}


/* =====================================================
   LÓGICA PRINCIPAL DE LA HERRAMIENTA
===================================================== */

function calcular(datos) {

    const rangoSaludable = obtenerRangoSaludable(
        datos.sexo,
        datos.edad
    );

    /*
       El rango ideal recomendado conserva exactamente los
       límites saludables de la referencia publicada.
       Actividad y objetivo no modifican valores clínicos.
    */

    const rangoIdeal = {

        minimo:
            rangoSaludable.minimo,

        maximoExclusivo:
            rangoSaludable.maximoExclusivo

    };

    /*
       El objetivo es el punto medio matemático del intervalo.
       Se presenta como referencia operativa, no como umbral
       clínico ni como porcentaje obligatorio.
    */

    const valorObjetivo = redondearNumero(
        (
            rangoIdeal.minimo +
            rangoIdeal.maximoExclusivo
        ) / 2,
        CONFIG.resultadoPrincipal.decimales
    );

    const tieneGrasaActual =
        datos.grasaActual !== null;

    const composicion = tieneGrasaActual
        ? calcularComposicionActual(
            datos.peso,
            datos.grasaActual
        )
        : crearComposicionNoDisponible();

    const diferenciaObjetivo = tieneGrasaActual
        ? redondearNumero(
            datos.grasaActual - valorObjetivo,
            CONFIG.formato.decimalesPorcentaje
        )
        : null;

    const pesoObjetivo = tieneGrasaActual
        ? calcularPesoObjetivo(
            composicion.masaMagra,
            valorObjetivo
        )
        : null;

    const estado = tieneGrasaActual
        ? clasificarPorcentaje(
            datos.grasaActual,
            rangoIdeal
        )
        : "sin-datos";

    const rangoFormateado =
        formatearRango(rangoIdeal);

    return {

        principal:
            valorObjetivo,

        secundarios: {

            rangoIdeal:
                rangoFormateado,

            masaGrasa:
                composicion.masaGrasa,

            masaMagra:
                composicion.masaMagra

        },

        rangoSaludable,

        rangoIdeal,

        valorObjetivo,

        diferenciaObjetivo,

        pesoObjetivo,

        estado,

        resumen:
            crearResumen(
                datos,
                rangoSaludable,
                rangoFormateado,
                estado
            ),

        descripcion:
            crearDescripcionObjetivo(
                valorObjetivo,
                rangoIdeal
            ),

        comparacion:
            crearComparacion(
                datos,
                rangoIdeal,
                valorObjetivo,
                diferenciaObjetivo,
                pesoObjetivo,
                estado
            ),

        interpretacion:
            crearInterpretacion(
                datos,
                rangoSaludable,
                rangoIdeal,
                estado
            ),

        recomendaciones:
            crearRecomendaciones(
                datos,
                estado
            )

    };

}


/* =====================================================
   RANGOS POR SEXO Y EDAD
===================================================== */

function obtenerRangoSaludable(sexo, edad) {

    const rangosSexo =
        RANGOS_GRASA_SALUDABLE[sexo];

    if (!rangosSexo) {

        throw new Error(
            "No existe una tabla para el sexo seleccionado."
        );

    }

    const rango = rangosSexo.find(item => {

        return (
            edad >= item.edadMinima &&
            edad <= item.edadMaxima
        );

    });

    if (!rango) {

        throw new Error(
            "No existe un rango para la edad introducida."
        );

    }

    return {

        minimo:
            rango.minimo,

        maximoExclusivo:
            rango.maximoExclusivo,

        grupoReferencia:
            rango.grupoReferencia

    };

}


/* =====================================================
   COMPOSICIÓN CORPORAL
===================================================== */

function calcularComposicionActual(
    peso,
    grasaActual
) {

    const masaGrasa = redondearNumero(
        peso * (grasaActual / 100),
        CONFIG.formato.decimales
    );

    const masaMagra = redondearNumero(
        peso - masaGrasa,
        CONFIG.formato.decimales
    );

    return {
        masaGrasa,
        masaMagra
    };

}


function crearComposicionNoDisponible() {

    return {
        masaGrasa: null,
        masaMagra: null
    };

}


function calcularPesoObjetivo(
    masaMagra,
    valorObjetivo
) {

    /*
       Estimación que mantiene constante la masa libre de
       grasa introducida:

       peso = masa libre de grasa / (1 - grasa objetivo)
    */

    const proporcionMagraObjetivo =
        1 - (valorObjetivo / 100);

    if (
        !Number.isFinite(masaMagra) ||
        proporcionMagraObjetivo <= 0
    ) {

        return null;

    }

    return redondearNumero(
        masaMagra / proporcionMagraObjetivo,
        CONFIG.formato.decimales
    );

}


/* =====================================================
   CLASIFICACIÓN
===================================================== */

function clasificarPorcentaje(
    grasaActual,
    rangoIdeal
) {

    if (grasaActual < rangoIdeal.minimo) {

        return "por-debajo";

    }

    if (
        grasaActual >=
        rangoIdeal.maximoExclusivo
    ) {

        return "por-encima";

    }

    return "dentro";

}


/* =====================================================
   TEXTOS PERSONALIZADOS
===================================================== */

function crearResumen(
    datos,
    rangoSaludable,
    rangoFormateado,
    estado
) {

    const perfil =
        `${obtenerEtiquetaSexo(datos.sexo)}, ` +
        `${formatearNumero(datos.edad, 0)} años, ` +
        `${formatearNumero(datos.altura, 1)} cm y ` +
        `${formatearNumero(datos.peso, 1)} kg`;

    const contextoEdad = datos.edad < 20
        ? " Se ha aplicado el grupo adulto de referencia más próximo, de 20 a 39 años."
        : "";

    if (estado === "sin-datos") {

        return (
            `Para el perfil indicado (${perfil}), el rango saludable ` +
            `e ideal de referencia es ${rangoFormateado} %. ` +
            "No se ha introducido un porcentaje actual, por lo que " +
            "la comparación y la composición corporal no están disponibles." +
            contextoEdad
        );

    }

    return (
        `Para el perfil indicado (${perfil}), el rango saludable ` +
        `e ideal de referencia es ${rangoFormateado} %. ` +
        `Tu porcentaje actual es ${formatearNumero(
            datos.grasaActual,
            CONFIG.formato.decimalesPorcentaje
        )} %.` +
        contextoEdad
    );

}


function crearDescripcionObjetivo(
    valorObjetivo,
    rangoIdeal
) {

    return (
        `${formatearNumero(
            valorObjetivo,
            CONFIG.resultadoPrincipal.decimales
        )} % es el punto medio matemático del intervalo ` +
        `${formatearRango(rangoIdeal)} %. Es una referencia ` +
        "operativa, no un objetivo clínico obligatorio."
    );

}


function crearComparacion(
    datos,
    rangoIdeal,
    valorObjetivo,
    diferenciaObjetivo,
    pesoObjetivo,
    estado
) {

    if (estado === "sin-datos") {

        return (
            "Datos insuficientes para comparar tu situación actual. " +
            "Introduce un porcentaje de grasa corporal actual para " +
            "calcular la diferencia, la masa grasa, la masa libre de " +
            "grasa y el peso estimado correspondiente al objetivo."
        );

    }

    const diferenciaAbsoluta =
        Math.abs(diferenciaObjetivo);

    let textoEstado;

    if (estado === "por-debajo") {

        const distanciaRango = redondearNumero(
            rangoIdeal.minimo - datos.grasaActual,
            CONFIG.formato.decimalesPorcentaje
        );

        textoEstado =
            `Tu medición está ${formatearNumero(
                distanciaRango,
                CONFIG.formato.decimalesPorcentaje
            )} puntos porcentuales por debajo del límite inferior del rango.`;

    } else if (estado === "por-encima") {

        const distanciaRango = redondearNumero(
            datos.grasaActual -
            rangoIdeal.maximoExclusivo,
            CONFIG.formato.decimalesPorcentaje
        );

        textoEstado =
            `Tu medición está ${formatearNumero(
                distanciaRango,
                CONFIG.formato.decimalesPorcentaje
            )} puntos porcentuales por encima del límite superior de referencia.`;

    } else {

        textoEstado =
            "Tu medición se encuentra dentro del rango saludable de referencia.";

    }

    const direccionObjetivo =
        diferenciaObjetivo > 0
            ? "por encima"
            : diferenciaObjetivo < 0
                ? "por debajo"
                : "en el mismo valor";

    const textoDiferencia =
        diferenciaObjetivo === 0
            ? ` Coincide con el valor objetivo de ${formatearNumero(
                valorObjetivo,
                1
            )} %.`
            : ` Está ${formatearNumero(
                diferenciaAbsoluta,
                1
            )} puntos porcentuales ${direccionObjetivo} del valor objetivo de ` +
            `${formatearNumero(valorObjetivo, 1)} %.`;

    const textoPeso = Number.isFinite(pesoObjetivo)
        ? ` Manteniendo constante la masa libre de grasa estimada, ` +
        `el peso correspondiente a ese objetivo sería aproximadamente ` +
        `${formatearNumero(pesoObjetivo, 1)} kg.`
        : "";

    return (
        textoEstado +
        textoDiferencia +
        textoPeso
    );

}


function crearInterpretacion(
    datos,
    rangoSaludable,
    rangoIdeal,
    estado
) {

    const actividad =
        obtenerEtiquetaActividad(datos.actividad);

    const objetivo =
        obtenerEtiquetaObjetivo(datos.objetivo);

    const base =
        `La referencia utilizada para ${obtenerEtiquetaSexo(
            datos.sexo
        ).toLowerCase()} en el grupo de ${rangoSaludable.grupoReferencia} ` +
        `es de ${formatearRango(rangoIdeal)} %. Tu nivel de actividad ` +
        `declarado es ${actividad} y tu objetivo es ${objetivo}. `;

    if (estado === "sin-datos") {

        return (
            base +
            "Sin una medición actual no es posible determinar tu posición " +
            "dentro del intervalo ni estimar tu masa grasa y masa libre de " +
            "grasa. Aun así, el rango mostrado puede utilizarse como referencia general."
        );

    }

    if (estado === "por-debajo") {

        return (
            base +
            "El porcentaje introducido queda por debajo de la referencia. " +
            "Un valor bajo no debe interpretarse automáticamente como mejor: " +
            "la grasa corporal cumple funciones fisiológicas esenciales. " +
            "Confirma la medición y solicita valoración profesional si el dato " +
            "es persistente, existe pérdida involuntaria o aparecen síntomas."
        );

    }

    if (estado === "por-encima") {

        return (
            base +
            "El porcentaje introducido queda por encima de la referencia. " +
            "Una medición aislada no constituye un diagnóstico. Valora la " +
            "tendencia obtenida con el mismo método y, si buscas reducir grasa, " +
            "plantea cambios graduales que ayuden a conservar la masa libre de grasa."
        );

    }

    return (
        base +
        "El porcentaje introducido se encuentra dentro del intervalo de " +
        "referencia. No es necesario perseguir exactamente el punto medio: " +
        "la estabilidad, el bienestar, el rendimiento y la evolución conjunta " +
        "son más informativos que una cifra aislada."
    );

}


function crearRecomendaciones(
    datos,
    estado
) {

    const recomendaciones = [

        "Repite las mediciones con el mismo método, a una hora similar y en condiciones comparables.",

        "Interpreta la tendencia junto con tu fuerza, energía, descanso, hábitos y bienestar general."

    ];


    if (estado === "sin-datos") {

        recomendaciones.push(
            "Añade una medición actual fiable si quieres estimar masa grasa, masa libre de grasa, diferencia y peso objetivo."
        );

    }


    if (estado === "por-debajo") {

        recomendaciones.push(
            "Evita intentar reducir más el porcentaje sin una evaluación profesional individual."
        );

        recomendaciones.push(
            "Consulta a un profesional si el valor bajo se acompaña de fatiga, alteraciones hormonales, pérdida involuntaria o menor rendimiento."
        );

    }


    if (estado === "por-encima") {

        recomendaciones.push(
            "Si deseas reducir grasa, prioriza un proceso gradual con alimentación suficiente, actividad diaria y entrenamiento de fuerza."
        );

        recomendaciones.push(
            "Evita usar el peso objetivo estimado como una prescripción exacta: presupone que la masa libre de grasa permanece constante."
        );

    }


    if (estado === "dentro") {

        recomendaciones.push(
            "Mantén hábitos sostenibles y evita perseguir el punto medio si tu salud, rendimiento y evolución son adecuados."
        );

    }


    if (
        datos.actividad === "sedentaria"
    ) {

        recomendaciones.push(
            "Aumenta progresivamente el movimiento diario de acuerdo con tu capacidad y situación de salud."
        );

    }


    if (
        datos.actividad === "deportista" ||
        datos.objetivo === "rendimiento"
    ) {

        recomendaciones.push(
            "Para objetivos de rendimiento, utiliza referencias específicas de tu disciplina y supervisión profesional."
        );

    }


    if (
        datos.objetivo === "perder-grasa" ||
        datos.objetivo === "recomposicion"
    ) {

        recomendaciones.push(
            "Evalúa también perímetros, rendimiento y evolución de la masa libre de grasa, no solo el porcentaje total."
        );

    }


    recomendaciones.push(
        "Consulta a un profesional sanitario o de la nutrición ante síntomas, enfermedad, embarazo, medicación o antecedentes de trastornos alimentarios."
    );

    return recomendaciones;

}


/* =====================================================
   PRESENTACIÓN ESPECÍFICA
===================================================== */

function pintarComparacionResultado(texto) {

    establecerTexto(
        CONFIG.selectores.comparacionResultado,
        texto || CONFIG.textosResultado.comparacion
    );

}


function formatearRango(rango) {

    return (
        `${formatearNumero(rango.minimo, 1)}–<` +
        `${formatearNumero(rango.maximoExclusivo, 1)}`
    );

}


function obtenerEtiquetaSexo(sexo) {

    const etiquetas = {
        mujer: "Mujer",
        hombre: "Hombre"
    };

    return etiquetas[sexo] || "Persona";

}


function obtenerEtiquetaActividad(actividad) {

    const etiquetas = {

        sedentaria:
            "sedentario",

        ligera:
            "ligero",

        moderada:
            "moderado",

        alta:
            "alto",

        deportista:
            "deportista"

    };

    return etiquetas[actividad] || "no especificado";

}


function obtenerEtiquetaObjetivo(objetivo) {

    const etiquetas = {

        salud:
            "mejorar o mantener la salud",

        "perder-grasa":
            "reducir grasa corporal",

        recomposicion:
            "mejorar la composición corporal",

        rendimiento:
            "mejorar el rendimiento deportivo"

    };

    return etiquetas[objetivo] || "no especificado";

}


/* =====================================================
   VERIFICACIÓN DEL RESULTADO
===================================================== */

function resultadoEsValido(resultado) {

    if (
        !resultado ||
        !Number.isFinite(resultado.principal)
    ) {

        return false;

    }

    if (
        !resultado.rangoIdeal ||
        !Number.isFinite(resultado.rangoIdeal.minimo) ||
        !Number.isFinite(
            resultado.rangoIdeal.maximoExclusivo
        ) ||
        resultado.rangoIdeal.minimo >=
        resultado.rangoIdeal.maximoExclusivo
    ) {

        return false;

    }

    const valoresOpcionales = [
        resultado.diferenciaObjetivo,
        resultado.pesoObjetivo,
        resultado.secundarios.masaGrasa,
        resultado.secundarios.masaMagra
    ];

    return valoresOpcionales.every(valor => {

        return (
            valor === null ||
            Number.isFinite(valor)
        );

    });

}
