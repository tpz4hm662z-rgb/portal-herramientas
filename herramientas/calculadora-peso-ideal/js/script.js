/* =====================================================
   HERRAMIENTAS360
   Calculadora de Peso Ideal PRO
   script.js
   Versión 1.0
   © 2026 José Carlos Núñez Florido

   Lógica específica de la herramienta.

   ORDEN OBLIGATORIO DE CARGA:
   1. config.js
   2. core.js
   3. script.js
===================================================== */

"use strict";


/* =====================================================
   1. INICIALIZACIÓN
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarCalculadoraPesoIdeal
);


function iniciarCalculadoraPesoIdeal() {

    const formulario = $(CONFIG.selectores.formulario);

    const botonReiniciar = $(
        CONFIG.selectores.botonReiniciar
    );

    if (!formulario) {

        debugError(
            "No se ha encontrado el formulario de la Calculadora de Peso Ideal."
        );

        return;

    }

    formulario.addEventListener(
        "submit",
        procesarFormularioPesoIdeal
    );

    if (botonReiniciar) {

        botonReiniciar.addEventListener(
            "click",
            reiniciarCalculadoraPesoIdeal
        );

    }

}


/* =====================================================
   2. PROCESAMIENTO DEL FORMULARIO
===================================================== */

function procesarFormularioPesoIdeal(evento) {

    evento.preventDefault();

    establecerEstadoCalculando(true);

    try {

        const validacion = validarFormulario();

        if (!validacion.valido) {

            mostrarErrorGeneral(
                CONFIG.mensajes.formularioIncompleto
            );

            return;

        }

        const datos = normalizarDatosPesoIdeal(
            validacion.valores
        );

        if (!validarOpcionesPesoIdeal(datos)) {

            mostrarErrorGeneral(
                CONFIG.mensajes.formularioIncompleto
            );

            return;

        }

        const resultado = calcularPesoIdeal(datos);

        if (!resultado) {

            mostrarErrorGeneral(
                CONFIG.mensajes.errorCalculo
            );

            return;

        }

        pintarResultadosPesoIdeal(resultado);

        registrarCalculoPesoIdeal(datos, resultado);

    } catch (error) {

        debugError(
            "Error al calcular el peso ideal.",
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
   3. NORMALIZACIÓN Y VALIDACIÓN ESPECÍFICA
===================================================== */

function normalizarDatosPesoIdeal(datos = {}) {

    return {

        sexo: String(datos.sexo || "")
            .trim()
            .toLowerCase(),

        edad: convertirANumero(datos.edad),

        altura: convertirANumero(datos.altura),

        complexion: String(datos.complexion || "")
            .trim()
            .toLowerCase()

    };

}


function validarOpcionesPesoIdeal(datos) {

    let valido = true;

    const campoSexo = CONFIG.campos.sexo;

    const campoComplexion = CONFIG.campos.complexion;

    if (
        !campoSexo.opcionesValidas.includes(datos.sexo)
    ) {

        mostrarError(
            campoSexo.selectorError,
            campoSexo.mensajes.invalido
        );

        valido = false;

    }

    if (
        !campoComplexion.opcionesValidas.includes(
            datos.complexion
        )
    ) {

        mostrarError(
            campoComplexion.selectorError,
            campoComplexion.mensajes.invalido
        );

        valido = false;

    }

    return valido;

}


/* =====================================================
   4. MOTOR PRINCIPAL DE CÁLCULO
===================================================== */

function calcularPesoIdeal(datos) {

    const parametros = CONFIG.calculo;

    const alturaMetros = datos.altura / 100;

    const alturaPulgadas =
        datos.altura / parametros.centimetrosPorPulgada;

    const diferenciaPulgadas =
        alturaPulgadas - parametros.pulgadasBase;

    const factorComplexion =
        parametros.ajusteComplexion[datos.complexion];

    const formulasSinAjustar = {

        devine: calcularFormulaClasica(
            "devine",
            datos.sexo,
            diferenciaPulgadas
        ),

        robinson: calcularFormulaClasica(
            "robinson",
            datos.sexo,
            diferenciaPulgadas
        ),

        miller: calcularFormulaClasica(
            "miller",
            datos.sexo,
            diferenciaPulgadas
        ),

        hamwi: calcularFormulaClasica(
            "hamwi",
            datos.sexo,
            diferenciaPulgadas
        )

    };

    const formulasAjustadas = ajustarFormulasPorComplexion(
        formulasSinAjustar,
        factorComplexion
    );

    const valoresFormulas = Object.values(
        formulasAjustadas
    );

    const pesoIdealPromedio = promedio(
        valoresFormulas
    );

    const formulaMasBaja = Math.min(
        ...valoresFormulas
    );

    const formulaMasAlta = Math.max(
        ...valoresFormulas
    );

    const rangoSaludable = calcularRangoSaludable(
        alturaMetros
    );

    const resultado = {

        principal: redondearNumero(
            pesoIdealPromedio,
            1
        ),

        pesoIdealPromedio: redondearNumero(
            pesoIdealPromedio,
            1
        ),

        rangoMinimo: redondearNumero(
            rangoSaludable.minimo,
            1
        ),

        rangoMaximo: redondearNumero(
            rangoSaludable.maximo,
            1
        ),

        formulaMasBaja: redondearNumero(
            formulaMasBaja,
            1
        ),

        formulaMasAlta: redondearNumero(
            formulaMasAlta,
            1
        ),

        formulas: redondearObjetoNumerico(
            formulasAjustadas,
            1
        ),

        formulasSinAjustar: redondearObjetoNumerico(
            formulasSinAjustar,
            1
        ),

        factorComplexion,

        resumen: construirResumenPesoIdeal(
            pesoIdealPromedio,
            rangoSaludable
        ),

        descripcion: construirDescripcionPesoIdeal(
            datos
        ),

        interpretacion: construirInterpretacionPesoIdeal(
            datos,
            pesoIdealPromedio,
            rangoSaludable,
            formulaMasBaja,
            formulaMasAlta
        ),

        recomendaciones: construirRecomendacionesPesoIdeal(
            datos
        )

    };

    return resultadoEsValido(resultado)
        ? resultado
        : null;

}


/* =====================================================
   5. FÓRMULAS DE PESO IDEAL
===================================================== */

function calcularFormulaClasica(
    nombreFormula,
    sexo,
    diferenciaPulgadas
) {

    const formula =
        CONFIG.calculo.formulas[nombreFormula];

    const parametrosSexo = formula?.[sexo];

    if (!parametrosSexo) {

        throw new Error(
            `No existen parámetros para ${nombreFormula} y ${sexo}.`
        );

    }

    return parametrosSexo.base +
        (
            parametrosSexo.incrementoPorPulgada *
            diferenciaPulgadas
        );

}


function ajustarFormulasPorComplexion(
    formulas,
    factorComplexion
) {

    return Object.fromEntries(

        Object.entries(formulas).map(
            ([nombre, valor]) => [
                nombre,
                valor * factorComplexion
            ]
        )

    );

}


function calcularRangoSaludable(alturaMetros) {

    const imcMinimo =
        CONFIG.calculo.rangoSaludable.imcMinimo;

    const imcMaximo =
        CONFIG.calculo.rangoSaludable.imcMaximo;

    const alturaCuadrado = alturaMetros ** 2;

    return {

        minimo: imcMinimo * alturaCuadrado,

        maximo: imcMaximo * alturaCuadrado

    };

}


/* =====================================================
   6. UTILIDADES DE CÁLCULO
===================================================== */

function promedio(valores = []) {

    const numerosValidos = valores.filter(
        Number.isFinite
    );

    if (numerosValidos.length === 0) {

        return NaN;

    }

    const suma = numerosValidos.reduce(
        (acumulado, valor) => acumulado + valor,
        0
    );

    return suma / numerosValidos.length;

}


function redondearObjetoNumerico(
    objeto = {},
    decimales = 1
) {

    return Object.fromEntries(

        Object.entries(objeto).map(
            ([clave, valor]) => [
                clave,
                redondearNumero(valor, decimales)
            ]
        )

    );

}


function resultadoEsValido(resultado) {

    const minimoTecnico =
        CONFIG.calculo.pesoMinimoTecnico;

    const maximoTecnico =
        CONFIG.calculo.pesoMaximoTecnico;

    const valoresObligatorios = [
        resultado.pesoIdealPromedio,
        resultado.rangoMinimo,
        resultado.rangoMaximo,
        resultado.formulaMasBaja,
        resultado.formulaMasAlta
    ];

    if (!valoresObligatorios.every(Number.isFinite)) {

        return false;

    }

    return (
        resultado.pesoIdealPromedio > 0 &&
        resultado.pesoIdealPromedio <= maximoTecnico &&
        resultado.rangoMinimo > 0 &&
        resultado.rangoMaximo > resultado.rangoMinimo
    );

}


/* =====================================================
   7. TEXTOS DINÁMICOS
===================================================== */

function construirResumenPesoIdeal(
    pesoIdeal,
    rangoSaludable
) {

    return CONFIG.textosResultado.resumen
        .replace(
            "{pesoIdeal}",
            formatearNumero(pesoIdeal, 1)
        )
        .replace(
            "{rangoMinimo}",
            formatearNumero(rangoSaludable.minimo, 1)
        )
        .replace(
            "{rangoMaximo}",
            formatearNumero(rangoSaludable.maximo, 1)
        );

}


function construirDescripcionPesoIdeal(datos) {

    const nombreComplexion =
        obtenerNombreComplexion(datos.complexion);

    return (
        `Estimación central calculada mediante las fórmulas de ` +
        `Devine, Robinson, Miller y Hamwi, con un ajuste de ` +
        `complexión ${nombreComplexion}.`
    );

}


function construirInterpretacionPesoIdeal(
    datos,
    pesoIdeal,
    rangoSaludable,
    formulaMasBaja,
    formulaMasAlta
) {

    const textos = CONFIG.interpretaciones;

    const textoComplexion = {

        pequena: textos.complexionPequena,

        media: textos.complexionMedia,

        grande: textos.complexionGrande

    }[datos.complexion];

    const dispersion = formulaMasAlta - formulaMasBaja;

    const contextoFormulas = dispersion <= 3
        ? "Las fórmulas ofrecen resultados muy próximos entre sí."
        : dispersion <= 7
            ? "Las fórmulas presentan una diferencia moderada, algo normal al utilizar métodos distintos."
            : "Las fórmulas muestran una diferencia apreciable, por lo que conviene interpretar el promedio como una referencia amplia.";

    return (
        `Para tus datos, la estimación central es de ` +
        `${formatearNumero(pesoIdeal, 1)} kg. ` +
        `El rango saludable orientativo por IMC se sitúa entre ` +
        `${formatearNumero(rangoSaludable.minimo, 1)} y ` +
        `${formatearNumero(rangoSaludable.maximo, 1)} kg. ` +
        `${contextoFormulas} ${textoComplexion} ` +
        `${textos.edad} ${textos.masaMuscular}`
    );

}


function construirRecomendacionesPesoIdeal(datos) {

    const recomendaciones = [
        ...CONFIG.recomendaciones
    ];

    const recomendacionesPerfil =
        CONFIG.recomendacionesPorPerfil;

    const claveComplexion = {

        pequena: "complexionPequena",

        media: "complexionMedia",

        grande: "complexionGrande"

    }[datos.complexion];

    if (
        claveComplexion &&
        Array.isArray(
            recomendacionesPerfil[claveComplexion]
        )
    ) {

        recomendaciones.push(
            ...recomendacionesPerfil[claveComplexion]
        );

    }

    if (datos.edad >= 65) {

        recomendaciones.push(
            "A partir de los 65 años es especialmente importante valorar la fuerza, la masa muscular y el estado funcional, no solo el peso corporal."
        );

    }

    return recomendaciones;

}


function obtenerNombreComplexion(complexion) {

    return {

        pequena: "pequeña",

        media: "media",

        grande: "grande"

    }[complexion] || "media";

}


/* =====================================================
   8. PINTADO DE RESULTADOS

   El index definitivo presenta, en este orden:
   1. Rango saludable
   2. Fórmula más baja
   3. Fórmula más alta

   Este render específico garantiza que los valores coincidan
   con los títulos visibles del index.html.
===================================================== */

function pintarResultadosPesoIdeal(resultado) {

    establecerTexto(
        CONFIG.resultadoPrincipal.selectorValor,
        formatearNumero(resultado.pesoIdealPromedio, 1)
    );

    establecerTexto(
        CONFIG.resultadoPrincipal.selectorUnidad,
        CONFIG.resultadoPrincipal.unidad
    );

    establecerTexto(
        CONFIG.resultadoPrincipal.selectorDescripcion,
        resultado.descripcion
    );

    establecerTexto(
        CONFIG.selectores.resultadoSecundarioUno,
        `${formatearNumero(resultado.rangoMinimo, 1)} – ${formatearNumero(resultado.rangoMaximo, 1)}`
    );

    establecerTexto(
        CONFIG.selectores.resultadoSecundarioDos,
        formatearNumero(resultado.formulaMasBaja, 1)
    );

    establecerTexto(
        CONFIG.selectores.resultadoSecundarioTres,
        formatearNumero(resultado.formulaMasAlta, 1)
    );

    establecerTexto(
        CONFIG.selectores.resumenResultado,
        resultado.resumen
    );

    establecerTexto(
        CONFIG.selectores.interpretacionResultado,
        resultado.interpretacion
    );

    pintarRecomendaciones(
        resultado.recomendaciones
    );

    mostrarResultados();

    anunciarResultadoPesoIdeal(resultado);

}


/* =====================================================
   9. ACCESIBILIDAD
===================================================== */

function anunciarResultadoPesoIdeal(resultado) {

    if (!CONFIG.accesibilidad.anunciarResultados) {

        return;

    }

    const seccionResultados = $(
        CONFIG.selectores.seccionResultados
    );

    if (!seccionResultados) {

        return;

    }

    seccionResultados.setAttribute(
        "aria-label",
        `Peso ideal estimado: ${formatearNumero(resultado.pesoIdealPromedio, 1)} kilogramos.`
    );

}


/* =====================================================
   10. REINICIO
===================================================== */

function reiniciarCalculadoraPesoIdeal() {

    reiniciarHerramientaBase();

    const seccionResultados = $(
        CONFIG.selectores.seccionResultados
    );

    if (seccionResultados) {

        seccionResultados.removeAttribute(
            "aria-label"
        );

    }

}


/* =====================================================
   11. REGISTRO OPCIONAL DE DESARROLLO
===================================================== */

function registrarCalculoPesoIdeal(datos, resultado) {

    if (!CONFIG.desarrollo.registrarCalculos) {

        return;

    }

    debugLog(
        "Cálculo de peso ideal completado:",
        {
            datos,
            resultado
        }
    );

}