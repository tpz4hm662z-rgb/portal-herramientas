/* =====================================================
   IMOANCY
   Calculadora de Grasa Corporal PRO
   script.js
   Versión 1.0
   © 2026 José Carlos Núñez Florido

   ORDEN OBLIGATORIO:
   1. config.js
   2. core.js
   3. script.js
===================================================== */

"use strict";


/* =====================================================
   1. INICIALIZACIÓN
===================================================== */

alCargarDocumento(iniciarCalculadora);


function iniciarCalculadora() {

    if (!comprobarConfiguracion()) return;

    const elementos = obtenerElementos();

    const elementosObligatorios = {

        formulario: elementos.formulario,
        sexo: elementos.sexo,
        edad: elementos.edad,
        altura: elementos.altura,
        peso: elementos.peso,
        cuello: elementos.cuello,
        cintura: elementos.cintura,
        cadera: elementos.cadera,
        campoCadera: elementos.campoCadera,
        botonCalcular: elementos.botonCalcular,
        botonReiniciar: elementos.botonReiniciar,
        seccionResultados: elementos.seccionResultados,
        resumenResultado: elementos.resumenResultado,
        resultadoPrincipal: elementos.resultadoPrincipal,
        unidadResultadoPrincipal: elementos.unidadResultadoPrincipal,
        descripcionResultadoPrincipal:
            elementos.descripcionResultadoPrincipal,
        resultadoSecundarioUno:
            elementos.resultadoSecundarioUno,
        resultadoSecundarioDos:
            elementos.resultadoSecundarioDos,
        resultadoSecundarioTres:
            elementos.resultadoSecundarioTres,
        interpretacionResultado:
            elementos.interpretacionResultado,
        listaRecomendaciones:
            elementos.listaRecomendaciones

    };

    if (!comprobarElementos(elementosObligatorios)) return;

    configurarEstadoInicial(elementos);

    activarEventos(elementos);

    activarLimpiezaErrores(
        elementos.formulario
    );

}


/* =====================================================
   2. ELEMENTOS DEL DOCUMENTO
===================================================== */

function obtenerElementos() {

    return {

        formulario:
            $(CONFIG.selectores.formulario),

        sexo:
            $(CONFIG.selectores.sexo),

        edad:
            $(CONFIG.selectores.edad),

        altura:
            $(CONFIG.selectores.altura),

        peso:
            $(CONFIG.selectores.peso),

        cuello:
            $(CONFIG.selectores.cuello),

        cintura:
            $(CONFIG.selectores.cintura),

        cadera:
            $(CONFIG.selectores.cadera),

        campoCadera:
            $(CONFIG.selectores.campoCadera),

        botonCalcular:
            $(CONFIG.selectores.botonCalcular),

        botonReiniciar:
            $(CONFIG.selectores.botonReiniciar),

        seccionResultados:
            $(CONFIG.selectores.seccionResultados),

        resumenResultado:
            $(CONFIG.selectores.resumenResultado),

        resultadoPrincipal:
            $(CONFIG.selectores.resultadoPrincipal),

        unidadResultadoPrincipal:
            $(CONFIG.selectores.unidadResultadoPrincipal),

        descripcionResultadoPrincipal:
            $(CONFIG.selectores.descripcionResultadoPrincipal),

        resultadoSecundarioUno:
            $(CONFIG.selectores.resultadoSecundarioUno),

        resultadoSecundarioDos:
            $(CONFIG.selectores.resultadoSecundarioDos),

        resultadoSecundarioTres:
            $(CONFIG.selectores.resultadoSecundarioTres),

        interpretacionResultado:
            $(CONFIG.selectores.interpretacionResultado),

        listaRecomendaciones:
            $(CONFIG.selectores.listaRecomendaciones)

    };

}


/* =====================================================
   3. ESTADO INICIAL
===================================================== */

function configurarEstadoInicial(elementos) {

    actualizarCampoCadera(elementos);

    ocultarResultados(
        elementos.seccionResultados
    );

    ocultarBotonReiniciar(
        elementos.botonReiniciar
    );

    actualizarBoton(
        elementos.botonCalcular,
        {

            texto:
                CONFIG.mensajes.botonCalcular,

            desactivado: false,

            cargando: false

        }
    );

}


/* =====================================================
   4. EVENTOS
===================================================== */

function activarEventos(elementos) {

    elementos.formulario.addEventListener(
        "submit",
        (evento) => {

            evento.preventDefault();

            ejecutarSeguro(

                () => procesarFormulario(elementos),

                () => gestionarErrorCalculo(elementos)

            );

        }
    );


    elementos.sexo.addEventListener(
        "change",
        () => {

            actualizarCampoCadera(elementos);

            limpiarErrorCampo(
                elementos.sexo
            );

            limpiarErrorCampo(
                elementos.cadera
            );

        }
    );


    elementos.botonReiniciar.addEventListener(
        "click",
        () => {

            reiniciarCalculadora(elementos);

        }
    );

}


/* =====================================================
   5. CAMPO CADERA
===================================================== */

function actualizarCampoCadera(elementos) {

    const sexo = obtenerValorCampo(
        elementos.sexo
    );

    const mostrarCadera =
        sexo === "mujer" &&
        CONFIG.interfaz
            .mostrarCaderaSoloMujer;

    alternarElemento(

        elementos.campoCadera,

        mostrarCadera,

        CONFIG.interfaz.claseOculto

    );

    establecerCampoObligatorio(

        elementos.cadera,

        mostrarCadera

    );

    desactivarCampo(

        elementos.cadera,

        !mostrarCadera

    );

    if (!mostrarCadera) {

        limpiarCampo(
            elementos.cadera
        );

        limpiarErrorCampo(
            elementos.cadera
        );

    }

}


/* =====================================================
   6. PROCESAMIENTO PRINCIPAL
===================================================== */

function procesarFormulario(elementos) {

    establecerEstadoCalculando(
        elementos,
        true
    );

    limpiarErroresFormulario(
        elementos.formulario
    );

    const validacion =
        validarDatosFormulario();

    if (!validacion.valido) {

        establecerEstadoCalculando(
            elementos,
            false
        );

        gestionarFormularioInvalido(
            elementos,
            validacion
        );

        return;

    }

    const resultado =
        calcularComposicionCorporal(
            validacion.datos
        );

    pintarResultados(
        elementos,
        resultado
    );

    mostrarResultados(
        elementos.seccionResultados
    );

    mostrarBotonReiniciar(
        elementos.botonReiniciar
    );

    establecerEstadoCalculando(
        elementos,
        false
    );

    registrarCalculo(resultado);

    anunciarResultado(resultado);

    if (
        CONFIG.interfaz
            .desplazarResultados
    ) {

        desplazarAElemento(

            elementos.seccionResultados,

            {

                behavior:
                    CONFIG.interfaz
                        .comportamientoScroll,

                block:
                    CONFIG.interfaz
                        .bloqueScroll

            }

        );

    }

}


/* =====================================================
   7. VALIDACIÓN DEL FORMULARIO
===================================================== */

function validarDatosFormulario() {

    const sexo =
        obtenerValorCampo(
            CONFIG.campos.sexo.id
        );

    const resultado =
        validarCamposConfigurados(

            CONFIG.campos,

            { sexo }

        );

    if (!resultado.valido) {

        return {

            valido: false,

            datos: resultado.datos,

            primerCampoInvalido:
                resultado.primerCampoInvalido

        };

    }

    const datos = resultado.datos;

    if (
        datos.sexo === "hombre" &&
        datos.cintura <= datos.cuello
    ) {

        const campoCintura =
            obtenerCampo(
                CONFIG.campos.cintura.id
            );

        mostrarErrorCampo(

            campoCintura,

            CONFIG.mensajes
                .combinacionInvalidaHombre

        );

        return {

            valido: false,

            datos,

            primerCampoInvalido:
                campoCintura

        };

    }

    if (
        datos.sexo === "mujer" &&
        (
            datos.cintura +
            datos.cadera
        ) <= datos.cuello
    ) {

        const campoCadera =
            obtenerCampo(
                CONFIG.campos.cadera.id
            );

        mostrarErrorCampo(

            campoCadera,

            CONFIG.mensajes
                .combinacionInvalidaMujer

        );

        return {

            valido: false,

            datos,

            primerCampoInvalido:
                campoCadera

        };

    }

    return {

        valido: true,

        datos,

        primerCampoInvalido: null

    };

}


/* =====================================================
   8. FORMULAS US NAVY
===================================================== */

function calcularComposicionCorporal(datos) {

    const porcentajeCalculado =
        datos.sexo === "hombre"

            ? calcularPorcentajeHombre(
                datos
            )

            : calcularPorcentajeMujer(
                datos
            );

    if (
        !Number.isFinite(
            porcentajeCalculado
        )
    ) {

        throw new Error(
            CONFIG.mensajes.errorCalculo
        );

    }

    if (
        porcentajeCalculado <
            CONFIG.calculo
                .porcentajeMinimo ||
        porcentajeCalculado >
            CONFIG.calculo
                .porcentajeMaximo
    ) {

        throw new Error(
            CONFIG.mensajes
                .resultadoFueraRango
        );

    }

    const porcentajeGrasa =
        redondear(

            porcentajeCalculado,

            CONFIG.calculo
                .decimalesPorcentaje

        );

    const masaGrasa =
        redondear(

            calcularPorcentaje(
                datos.peso,
                porcentajeGrasa
            ),

            CONFIG.calculo
                .decimalesMasa

        );

    const masaMagra =
        redondear(

            datos.peso -
                masaGrasa,

            CONFIG.calculo
                .decimalesMasa

        );

    const clasificacion =
        buscarClasificacion(

            datos.sexo,

            porcentajeGrasa

        );

    const recomendaciones =
        generarRecomendaciones(
            clasificacion
        );

    return {

        datos,

        porcentajeGrasa,

        masaGrasa,

        masaMagra,

        clasificacion,

        recomendaciones

    };

}


function calcularPorcentajeHombre(datos) {

    const diferencia =
        datos.cintura -
        datos.cuello;

    return (

        495 / (

            1.0324 -

            0.19077 *
                Math.log10(diferencia) +

            0.15456 *
                Math.log10(datos.altura)

        )

    ) - 450;

}


function calcularPorcentajeMujer(datos) {

    const sumaMedidas =
        datos.cintura +
        datos.cadera -
        datos.cuello;

    return (

        495 / (

            1.29579 -

            0.35004 *
                Math.log10(sumaMedidas) +

            0.22100 *
                Math.log10(datos.altura)

        )

    ) - 450;

}


/* =====================================================
   9. CLASIFICACIÓN
===================================================== */

function buscarClasificacion(
    sexo,
    porcentajeGrasa
) {

    const clasificaciones =
        sexo === "hombre"

            ? CONFIG
                .clasificacionesHombre

            : CONFIG
                .clasificacionesMujer;

    const clasificacion =
        obtenerClasificacion(

            porcentajeGrasa,

            clasificaciones

        );

    if (!clasificacion) {

        throw new Error(
            CONFIG.mensajes
                .resultadoFueraRango
        );

    }

    return clasificacion;

}


/* =====================================================
   10. RECOMENDACIONES
===================================================== */

function generarRecomendaciones(
    clasificacion
) {

    return combinarRecomendaciones(

        clasificacion
            .recomendaciones || [],

        CONFIG
            .recomendacionesGenerales || [],

        6

    );

}


/* =====================================================
   11. PINTAR RESULTADOS
===================================================== */

function pintarResultados(
    elementos,
    resultado
) {

    establecerTexto(

        elementos.resultadoPrincipal,

        formatearNumero(

            resultado.porcentajeGrasa,

            CONFIG.calculo
                .decimalesPorcentaje

        )

    );

    establecerTexto(

        elementos
            .unidadResultadoPrincipal,

        CONFIG.calculo
            .unidadResultado

    );

    establecerTexto(

        elementos
            .descripcionResultadoPrincipal,

        resultado.clasificacion
            .descripcion

    );

    establecerTexto(

        elementos
            .resultadoSecundarioUno,

        formatearNumero(

            resultado.masaGrasa,

            CONFIG.calculo
                .decimalesMasa

        )

    );

    establecerTexto(

        elementos
            .resultadoSecundarioDos,

        formatearNumero(

            resultado.masaMagra,

            CONFIG.calculo
                .decimalesMasa

        )

    );

    establecerTexto(

        elementos
            .resultadoSecundarioTres,

        resultado.clasificacion
            .nombre

    );

    establecerTexto(

        elementos
            .interpretacionResultado,

        resultado.clasificacion
            .interpretacion

    );

    renderizarLista(

        elementos
            .listaRecomendaciones,

        resultado.recomendaciones

    );

    establecerTexto(

        elementos.resumenResultado,

        crearResumenResultado(
            resultado
        )

    );

}


/* =====================================================
   12. RESUMEN PERSONALIZADO
===================================================== */

function crearResumenResultado(
    resultado
) {

    const datos =
        resultado.datos;

    const sexoTexto =
        datos.sexo === "hombre"
            ? "hombre"
            : "mujer";

    return (

        `Estimación para ${sexoTexto} ` +

        `de ${formatearNumero(
            datos.edad,
            0
        )} años, ` +

        `${formatearNumero(
            datos.altura,
            1
        )} cm de altura y ` +

        `${formatearNumero(
            datos.peso,
            1
        )} kg de peso: ` +

        `${formatearNumero(
            resultado.porcentajeGrasa,
            CONFIG.calculo
                .decimalesPorcentaje
        )} % de grasa corporal. ` +

        CONFIG.mensajes
            .resumenResultado

    );

}


/* =====================================================
   13. FORMULARIO INVÁLIDO
===================================================== */

function gestionarFormularioInvalido(
    elementos,
    validacion
) {

    if (
        CONFIG.interfaz
            .enfocarPrimerError
    ) {

        if (
            validacion
                .primerCampoInvalido
        ) {

            validacion
                .primerCampoInvalido
                .focus({
                    preventScroll: true
                });

            validacion
                .primerCampoInvalido
                .scrollIntoView({

                    behavior:
                        CONFIG.interfaz
                            .comportamientoScroll,

                    block: "center"

                });

        } else {

            enfocarPrimerError(
                elementos.formulario
            );

        }

    }

    if (
        CONFIG.accesibilidad
            .anunciarErrores
    ) {

        anunciarMensaje(

            CONFIG.mensajes
                .formularioInvalido,

            "assertive"

        );

    }

}


/* =====================================================
   14. ESTADO DEL BOTÓN
===================================================== */

function establecerEstadoCalculando(
    elementos,
    calculando
) {

    actualizarBoton(

        elementos.botonCalcular,

        {

            texto:
                calculando

                    ? CONFIG.mensajes
                        .calculando

                    : CONFIG.mensajes
                        .botonCalcular,

            desactivado:
                calculando,

            cargando:
                calculando

        }

    );

}


/* =====================================================
   15. ANALÍTICA
===================================================== */

function registrarCalculo(resultado) {

    registrarEvento(

        CONFIG.analitica
            .eventoCalculo,

        {

            sexo:
                resultado.datos.sexo,

            clasificacion:
                resultado
                    .clasificacion
                    .nombre,

            porcentaje_grasa:
                resultado
                    .porcentajeGrasa

        }

    );

}


/* =====================================================
   16. ACCESIBILIDAD
===================================================== */

function anunciarResultado(resultado) {

    if (
        !CONFIG.accesibilidad
            .anunciarResultado
    ) {

        return;

    }

    anunciarMensaje(

        `Resultado calculado: ` +

        `${formatearNumero(
            resultado.porcentajeGrasa,
            CONFIG.calculo
                .decimalesPorcentaje
        )} por ciento de grasa corporal. ` +

        `Clasificación: ` +

        `${resultado
            .clasificacion
            .nombre}.`,

        "polite"

    );

}


/* =====================================================
   17. REINICIAR CALCULADORA
===================================================== */

function reiniciarCalculadora(elementos) {

    reiniciarFormulario(
        elementos.formulario
    );

    limpiarResultados(elementos);

    actualizarCampoCadera(elementos);

    ocultarResultados(
        elementos.seccionResultados
    );

    ocultarBotonReiniciar(
        elementos.botonReiniciar
    );

    establecerEstadoCalculando(
        elementos,
        false
    );

    if (
        CONFIG.interfaz
            .reiniciarSexo
    ) {

        elementos.sexo.focus();

    }

    registrarEvento(

        CONFIG.analitica
            .eventoReinicio

    );

    anunciarMensaje(

        CONFIG.mensajes
            .resultadoReiniciado,

        "polite"

    );

    desplazarAElemento(

        elementos.formulario,

        {

            behavior:
                CONFIG.interfaz
                    .comportamientoScroll,

            block: "start"

        }

    );

}


/* =====================================================
   18. LIMPIAR RESULTADOS
===================================================== */

function limpiarResultados(elementos) {

    establecerTexto(
        elementos.resumenResultado,
        CONFIG.mensajes
            .resumenResultado
    );

    establecerTexto(
        elementos.resultadoPrincipal,
        "0"
    );

    establecerTexto(
        elementos.unidadResultadoPrincipal,
        CONFIG.calculo
            .unidadResultado
    );

    establecerTexto(
        elementos
            .descripcionResultadoPrincipal,
        "Aquí aparecerá tu clasificación orientativa."
    );

    establecerTexto(
        elementos.resultadoSecundarioUno,
        "0"
    );

    establecerTexto(
        elementos.resultadoSecundarioDos,
        "0"
    );

    establecerTexto(
        elementos.resultadoSecundarioTres,
        "-"
    );

    establecerTexto(
        elementos.interpretacionResultado,
        ""
    );

    renderizarLista(
        elementos.listaRecomendaciones,
        []
    );

}


/* =====================================================
   19. ERROR GENERAL DE CÁLCULO
===================================================== */

function gestionarErrorCalculo(elementos) {

    establecerEstadoCalculando(
        elementos,
        false
    );

    anunciarMensaje(

        CONFIG.mensajes
            .errorCalculo,

        "assertive"

    );

    console.error(
        CONFIG.mensajes
            .errorCalculo
    );

}


/* =====================================================
   20. INFORMACIÓN DEL SCRIPT
===================================================== */

const H360_SCRIPT_GRASA = Object.freeze({

    nombre:
        "Calculadora de Grasa Corporal PRO",

    version: "1.0",

    metodo:
        CONFIG.calculo.metodo,

    cargado: true

});


console.info(

    `${H360_SCRIPT_GRASA.nombre} · ` +

    `${H360_SCRIPT_GRASA.version} · ` +

    `${H360_SCRIPT_GRASA.metodo}`

);
