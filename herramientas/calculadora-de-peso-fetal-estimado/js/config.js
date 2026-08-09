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

        nombre: "Calculadora de Peso Fetal Estimado PRO",

        nombreCorto: "Peso Fetal Estimado",

        proyecto: "calculadora-de-peso-fetal-estimado",

        categoria: "Embarazo y bebés",

        icono: "👶",

        version: "1.1",

        fechaActualizacion: "3 de agosto de 2026",

        fechaISO: "2026-08-03",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-de-peso-fetal-estimado/",

        urlPortal:
            "https://imoancy.com/"

    },


    /* =================================================
       FORMATO GENERAL
    ================================================= */

    formato: {

        locale: "es-ES",

        moneda: "EUR",

        decimales: 2,

        decimalesPorcentaje: 2,

        usarSeparadorMiles: true,

        mostrarCerosFinales: true

    },


    /* =================================================
       COMPORTAMIENTO
    ================================================= */

    comportamiento: {

        scrollResultados: true,

        scrollSuave: true,

        enfocarPrimerError: true,

        ocultarResultadosAlEditar: false,

        limpiarErroresAlEditar: false,

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

        datoUno: {

            nombre: "Semanas de gestación",

            selector: "#datoUno",

            selectorError: "#errorDatoUno",

            tipo: "numero",

            obligatorio: true,

            minimo: 14,

            maximo: 42,

            permitirCero: false,

            mensajes: {

                obligatorio:
                    "Introduce las semanas de gestación.",

                invalido:
                    "Introduce un número válido.",

                minimo:
                    "Las semanas deben estar entre 14 y 42.",

                maximo:
                    "Las semanas deben estar entre 14 y 42."

            }

        },


        datoDos: {

            nombre: "Días adicionales",

            selector: "#datoDos",

            selectorError: "#errorDatoDos",

            tipo: "numero",

            obligatorio: true,

            minimo: 0,

            maximo: 6,

            permitirCero: true,

            mensajes: {

                obligatorio:
                    "Introduce los días adicionales.",

                invalido:
                    "Introduce un número válido.",

                minimo:
                    "Los días deben estar entre 0 y 6.",

                maximo:
                    "Los días deben estar entre 0 y 6."

            }

        },


        opcion: {

            nombre: "Fórmula de estimación",

            selector: "#opcion",

            selectorError: "#errorOpcion",

            tipo: "select",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Selecciona la fórmula de estimación.",

                invalido:
                    "La opción seleccionada no es válida."

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

        titulo: "Peso fetal estimado",

        unidad: "g",

        icono: "🎯",

        decimales: 0,

        formato: "numero",

        descripcion:
            "Estimación ecográfica orientativa calculada con HC, AC y FL."

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

            clave: "secundarioUno",

            selectorValor:
                "#resultadoSecundarioUno",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Peso en kilogramos",

            unidad: "kg",

            icono: "📊",

            decimales: 2,

            formato: "numero",

            descripcion:
                "Conversión del peso fetal estimado a kilogramos."

        },


        {

            clave: "secundarioDos",

            selectorValor:
                "#resultadoSecundarioDos",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Percentil INTERGROWTH-21st",

            unidad: "percentil",

            icono: "📈",

            decimales: 2,

            formato: "numero",

            descripcion:
                "Posición orientativa en el estándar para Hadlock."

        },


        {

            clave: "secundarioTres",

            selectorValor:
                "#resultadoSecundarioTres",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Rango P10–P90",

            unidad: "g",

            icono: "✅",

            decimales: 2,

            formato: "numero",

            descripcion:
                "Intervalo central del estándar para la edad gestacional."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Estimación del peso fetal calculada con la fórmula Hadlock HC–AC–FL.",

        interpretacion:
            "Un percentil aislado no establece un diagnóstico. Consulta la evolución y el contexto clínico con el equipo obstétrico.",

        aviso:
            "Los resultados son orientativos y dependen de los datos introducidos."

    },


    /* =================================================
       RECOMENDACIONES

       script.js podrá reemplazar estas recomendaciones
       según el resultado obtenido.
    ================================================= */

    recomendaciones: [

        "Comprueba que HC, AC y FL procedan del mismo informe ecográfico.",

        "Interpreta el resultado junto con la edad gestacional y la evolución previa.",

        "Consulta a un profesional cuando el resultado afecte a una decisión importante."

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
                "Calcular resultado",

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
            "h360_peso_fetal_historial_v1",

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
