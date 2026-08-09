/* =====================================================
   IMOANCY TEMPLATE
   config.js
   Versión 3.0
   © 2026 José Carlos Núñez Florido

   Centro de configuración de la herramienta.

   IMPORTANTE:
   Este archivo debe cargarse antes que core.js y script.js.
===================================================== */

"use strict";

const CONFIG = {

    /* =================================================
       IDENTIDAD DE LA HERRAMIENTA
    ================================================= */

    herramienta: {

        nombre: "Calculadora de Edad Gestacional PRO",

        nombreCorto: "Edad Gestacional PRO",

        proyecto: "calculadora-edad-gestacional",

        categoria: "Embarazo y Bebés",

        icono: "👶",

        version: "1.0",

        fechaActualizacion: "30 de julio de 2026",

        fechaISO: "2026-07-30",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-de-edad-gestacional/",

        urlPortal:
            "https://imoancy.com/"

    },


    /* =================================================
       FORMATO GENERAL
    ================================================= */

    formato: {

        locale: "es-ES",

        moneda: "EUR",

        decimales: 0,

        decimalesPorcentaje: 0,

        usarSeparadorMiles: true,

        mostrarCerosFinales: false

    },


    /* =================================================
       COMPORTAMIENTO
    ================================================= */

    comportamiento: {

        scrollResultados: true,

        scrollSuave: true,

        enfocarPrimerError: true,

        ocultarResultadosAlEditar: true,

        limpiarErroresAlEditar: true,

        mostrarBotonReiniciar: true,

        bloquearBotonDuranteCalculo: true,

        tiempoBloqueoBoton: 300

    },


    /* =================================================
       CAMPOS DEL FORMULARIO

       Cada campo contiene:

       selector:
       Selector del input o select.

       selectorError:
       Lugar donde se mostrará el error.

       tipo:
       "numero", "select" o "texto".

       obligatorio:
       Determina si debe completarse.

       minimo y maximo:
       Límites permitidos para campos numéricos.
    ================================================= */

    campos: {

        metodo: {

            nombre: "Método de cálculo",

            selector: "#metodo",

            selectorError: "#errorMetodo",

            tipo: "select",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Selecciona un método de cálculo.",

                invalido:
                    "Selecciona un método válido."

            }

        },


        fecha: {

            nombre: "Fecha",

            selector: "#fecha",

            selectorError: "#errorFecha",

            tipo: "texto",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Introduce la fecha solicitada.",

                invalido:
                    "Introduce una fecha válida."

            }

        }

    },


    /* =================================================
       RESULTADO PRINCIPAL
    ================================================= */

    resultadoPrincipal: {

        selectorValor: "#resultadoPrincipal",

        selectorUnidad: "#unidadResultadoPrincipal",

        selectorDescripcion:
            "#descripcionResultadoPrincipal",

        titulo: "Edad gestacional",

        unidad: "",

        icono: "👶",

        decimales: 0,

        formato: "texto",

        descripcion:
            "Estimación calculada a partir de la fecha indicada."

    },


    /* =================================================
       RESULTADOS SECUNDARIOS

       formato puede ser:

       "numero"
       "moneda"
       "porcentaje"
       "texto"
    ================================================= */

    resultadosSecundarios: [

        {

            clave: "diaGestacional",

            selectorValor:
                "#resultadoDia",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Día gestacional",

            unidad: "",

            icono: "📅",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Número ordinal del día de embarazo."

        },


        {

            clave: "trimestre",

            selectorValor:
                "#resultadoTrimestre",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Trimestre",

            unidad: "",

            icono: "📈",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Fase trimestral estimada."

        },


        {

            clave: "fechaParto",

            selectorValor:
                "#resultadoFpp",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Fecha estimada de parto",

            unidad: "",

            icono: "🗓️",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Fecha probable de parto orientativa."

        },


        {

            clave: "tiempoRestante",

            selectorValor:
                "#resultadoRestante",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Tiempo restante",

            unidad: "",

            icono: "⏳",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Días restantes hasta la FPP."

        },


        {

            clave: "concepcion",

            selectorValor:
                "#resultadoConcepcion",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Concepción aproximada",

            unidad: "",

            icono: "🌱",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Fecha estimada, no exacta."

        },


        {

            clave: "proximaSemana",

            selectorValor:
                "#resultadoProximaSemana",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Próximo cambio de semana",

            unidad: "",

            icono: "➡️",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Fecha del siguiente cambio semanal."

        },


        {

            clave: "proximoTrimestre",

            selectorValor:
                "#resultadoProximoTrimestre",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Próximo cambio de trimestre",

            unidad: "",

            icono: "🔄",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Fecha del siguiente trimestre."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Estimación del embarazo según la fecha indicada.",

        interpretacion:
            "Aquí aparecerá una interpretación orientativa de la fase del embarazo.",

        aviso:
            "Los resultados son orientativos y no sustituyen el seguimiento sanitario."

    },


    /* =================================================
       RECOMENDACIONES

       script.js podrá reemplazar estas recomendaciones
       según el resultado obtenido.
    ================================================= */

    recomendaciones: [

        "Comprueba que la fecha introducida sea correcta.",

        "La evolución del embarazo puede variar entre personas.",

        "No sustituye el seguimiento de profesionales sanitarios."

    ],


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa la fecha antes de continuar.",

        errorCalculo:
            "No se ha podido realizar el cálculo.",

        formularioIncompleto:
            "Completa correctamente todos los campos.",

        sinResultados:
            "No hay resultados disponibles.",

        reinicioCorrecto:
            "La herramienta se ha reiniciado correctamente.",

        copiando:
            "Copiando resultado...",

        copiado:
            "Resultado copiado al portapapeles.",

        errorCopiar:
            "No se ha podido copiar el resultado.",

        compartido:
            "Resultado compartido correctamente.",

        errorCompartir:
            "No se ha podido compartir el resultado."

    },


    /* =================================================
       SELECTORES GENERALES
    ================================================= */

    selectores: {

        formulario:
            "#formularioHerramienta",

        botonCalcular:
            "#botonCalcular",

        botonReiniciar:
            "#botonReiniciar",

        seccionResultados:
            "#resultados",

        resumenResultado:
            "#resumenResultado",

        interpretacionResultado:
            "#interpretacionResultado",

        listaRecomendaciones:
            "#listaRecomendaciones"

    },


    /* =================================================
       BOTONES
    ================================================= */

    botones: {

        calcular: {

            textoNormal:
                "Calcular edad gestacional",

            textoProcesando:
                "Calculando...",

            desactivarDuranteCalculo:
                true

        },

        reiniciar: {

            texto:
                "Reiniciar herramienta"

        }

    },


    /* =================================================
       FUNCIONES OPCIONALES

       Preparadas para futuras versiones.
    ================================================= */

    funciones: {

        copiarResultado: false,

        compartirResultado: false,

        exportarPDF: false,

        imprimirResultado: false,

        guardarLocalmente: false,

        recuperarUltimoCalculo: false,

        analiticaEventos: false

    },


    /* =================================================
       ALMACENAMIENTO LOCAL
    ================================================= */

    almacenamiento: {

        prefijo:
            "h360",

        clave:
            "calculadora-edad-gestacional",

        guardarFormulario:
            false,

        guardarResultado:
            false

    },


    /* =================================================
       ACCESIBILIDAD
    ================================================= */

    accesibilidad: {

        anunciarResultados:
            true,

        anunciarErrores:
            true,

        enfocarResultados:
            false,

        enfocarPrimerError:
            true

    },


    /* =================================================
       DESARROLLO

       Cambiar debug a false antes de publicar.
    ================================================= */

    desarrollo: {

        debug: false,

        mostrarConfiguracion:
            false,

        registrarCalculos:
            false

    }

};


/* =====================================================
   PROTECCIÓN DE CONFIGURACIÓN

   Evita modificaciones accidentales en el objeto principal.
   Los objetos internos permanecen editables durante el
   desarrollo de cada herramienta.
===================================================== */

Object.freeze(CONFIG);
