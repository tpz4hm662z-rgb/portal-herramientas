/* =====================================================
   HERRAMIENTAS360 TEMPLATE
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

        nombre: "Calculadora de Ovulación PRO",

        nombreCorto: "Ovulación PRO",

        proyecto: "calculadora-ovulacion",

        categoria: "Salud femenina",

        icono: "🌸",

        version: "1.0",

        fechaActualizacion: "30 de julio de 2026",

        fechaISO: "2026-07-30",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-ovulacion/",

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
    ================================================= */

    campos: {

        ultimaMenstruacion: {

            nombre: "Primer día de la última menstruación",

            selector: "#ultimaMenstruacion",

            selectorError: "#errorUltimaMenstruacion",

            tipo: "texto",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Indica el primer día de tu última menstruación.",

                invalido:
                    "Introduce una fecha válida.",

                futura:
                    "La fecha no puede ser posterior a hoy."

            }

        },


        duracionCiclo: {

            nombre: "Duración media del ciclo",

            selector: "#duracionCiclo",

            selectorError: "#errorDuracionCiclo",

            tipo: "numero",

            obligatorio: true,

            minimo: 21,

            maximo: 45,

            permitirCero: false,

            mensajes: {

                obligatorio:
                    "Introduce la duración media de tu ciclo.",

                invalido:
                    "Introduce un número entero válido.",

                minimo:
                    "La duración del ciclo debe ser de al menos 21 días.",

                maximo:
                    "La duración del ciclo no puede superar los 45 días."

            }

        },


        duracionMenstruacion: {

            nombre: "Duración habitual de la menstruación",

            selector: "#duracionMenstruacion",

            selectorError: "#errorDuracionMenstruacion",

            tipo: "texto",

            obligatorio: false,

            mensajes: {

                obligatorio: "",

                invalido:
                    "Introduce un número entero válido.",

                minimo:
                    "La menstruación debe durar al menos 2 días.",

                maximo:
                    "La menstruación no puede superar los 10 días."

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

        titulo: "Ovulación estimada",

        unidad: "",

        icono: "🌼",

        decimales: 0,

        formato: "texto",

        descripcion:
            "Fecha orientativa calculada a partir de la duración media de tu ciclo."

    },


    /* =================================================
       RESULTADOS SECUNDARIOS
    ================================================= */

    resultadosSecundarios: [

        {

            clave: "maximaFertilidad",

            selectorValor: "#resultadoSecundarioUno",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo: "Máxima fertilidad",

            unidad: "",

            icono: "✨",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Los dos días con mayor probabilidad estimada."

        },


        {

            clave: "ventanaFertil",

            selectorValor: "#resultadoSecundarioDos",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo: "Ventana fértil",

            unidad: "",

            icono: "🗓️",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Comprende los cinco días previos y el día de ovulación."

        },


        {

            clave: "proximaMenstruacion",

            selectorValor: "#resultadoSecundarioTres",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo: "Próxima menstruación",

            unidad: "",

            icono: "🔄",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Inicio estimado del siguiente ciclo."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Tu estimación personalizada aparecerá aquí.",

        interpretacion:
            "Estas fechas son orientativas y resultan más útiles cuando tus ciclos son regulares.",

        aviso:
            "El calendario no confirma la ovulación ni sirve como método anticonceptivo."

    },


    /* =================================================
       RECOMENDACIONES
    ================================================= */

    recomendaciones: [

        "Registra varios ciclos para obtener una duración media más representativa.",

        "Observa señales como el moco cervical o utiliza test de ovulación si necesitas mayor precisión.",

        "Consulta con un profesional sanitario si tus ciclos son muy irregulares o tienes dudas sobre tu salud reproductiva."

    ],


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa los campos marcados antes de continuar.",

        errorCalculo:
            "No se ha podido realizar el cálculo.",

        formularioIncompleto:
            "Completa correctamente todos los campos obligatorios.",

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

        formulario: "#formularioHerramienta",

        botonCalcular: "#botonCalcular",

        botonReiniciar: "#botonReiniciar",

        seccionResultados: "#resultados",

        resumenResultado: "#resumenResultado",

        interpretacionResultado: "#interpretacionResultado",

        listaRecomendaciones: "#listaRecomendaciones"

    },


    /* =================================================
       BOTONES
    ================================================= */

    botones: {

        calcular: {

            textoNormal: "Calcular mis días fértiles",

            textoProcesando: "Calculando...",

            desactivarDuranteCalculo: true

        },

        reiniciar: {

            texto: "Reiniciar herramienta"

        }

    },


    /* =================================================
       FUNCIONES OPCIONALES
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

        prefijo: "h360",

        clave: "calculadora-ovulacion",

        guardarFormulario: false,

        guardarResultado: false

    },


    /* =================================================
       ACCESIBILIDAD
    ================================================= */

    accesibilidad: {

        anunciarResultados: true,

        anunciarErrores: true,

        enfocarResultados: true,

        enfocarPrimerError: true

    },


    /* =================================================
       DESARROLLO
    ================================================= */

    desarrollo: {

        debug: false,

        mostrarConfiguracion: false,

        registrarCalculos: false

    }

};


/* =====================================================
   PROTECCIÓN DE CONFIGURACIÓN
===================================================== */

Object.freeze(CONFIG);
