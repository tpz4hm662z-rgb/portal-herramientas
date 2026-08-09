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

        nombre: "Calculadora de Porcentaje de Masa Muscular Pro",

        nombreCorto: "Masa Muscular Pro",

        proyecto: "calculadora-porcentaje-masa-muscular",

        categoria: "Salud y composición corporal",

        icono: "💪",

        version: "1.0.0",

        fechaActualizacion: "29 de julio de 2026",

        fechaISO: "2026-07-29",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-porcentaje-masa-muscular/",

        urlPortal:
            "https://imoancy.com/"

    },


    /* =================================================
       FORMATO GENERAL
    ================================================= */

    formato: {

        locale: "es-ES",

        moneda: "EUR",

        decimales: 1,

        decimalesPorcentaje: 1,

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

        ocultarResultadosAlEditar: false,

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

        sexo: {

            nombre: "Sexo",

            selector: "#sexo",

            selectorError: "#errorSexo",

            tipo: "select",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Selecciona tu sexo.",

                invalido:
                    "El sexo seleccionado no es válido."

            }

        },


        edad: {

            nombre: "Edad",

            selector: "#edad",

            selectorError: "#errorEdad",

            tipo: "numero",

            obligatorio: true,

            minimo: 18,

            maximo: 100,

            permitirCero: false,

            mensajes: {

                obligatorio:
                    "Introduce tu edad.",

                invalido:
                    "Introduce un número válido.",

                minimo:
                    "La edad mínima permitida es 18 años.",

                maximo:
                    "La edad máxima permitida es 100 años."

            }

        },


        altura: {

            nombre: "Altura",

            selector: "#altura",

            selectorError: "#errorAltura",

            tipo: "numero",

            obligatorio: true,

            minimo: 120,

            maximo: 230,

            permitirCero: false,

            mensajes: {

                obligatorio:
                    "Introduce tu altura.",

                invalido:
                    "Introduce una altura válida.",

                minimo:
                    "La altura mínima permitida es 120 cm.",

                maximo:
                    "La altura máxima permitida es 230 cm."

            }

        },


        peso: {

            nombre: "Peso",

            selector: "#peso",

            selectorError: "#errorPeso",

            tipo: "numero",

            obligatorio: true,

            minimo: 30,

            maximo: 300,

            permitirCero: false,

            mensajes: {

                obligatorio:
                    "Introduce tu peso.",

                invalido:
                    "Introduce un peso válido.",

                minimo:
                    "El peso mínimo permitido es 30 kg.",

                maximo:
                    "El peso máximo permitido es 300 kg."

            }

        },


        nivelActividad: {

            nombre: "Nivel de actividad física",

            selector: "#nivelActividad",

            selectorError: "#errorNivelActividad",

            tipo: "select",

            obligatorio: true,

            mensajes: {

                obligatorio:
                    "Selecciona tu nivel de actividad física.",

                invalido:
                    "El nivel de actividad seleccionado no es válido."

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

        titulo: "Porcentaje estimado de masa muscular",

        unidad: "%",

        icono: "💪",

        decimales: 1,

        formato: "porcentaje",

        descripcion:
            "Porcentaje aproximado de tu peso corporal correspondiente a masa muscular."

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

            clave: "clasificacion",

            selectorValor:
                "#resultadoSecundarioUno",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Clasificación",

            unidad: "nivel",

            icono: "📊",

            decimales: 0,

            formato: "texto",

            descripcion:
                "Categoría orientativa según el porcentaje estimado."

        },


        {

            clave: "masaMuscularKg",

            selectorValor:
                "#resultadoSecundarioDos",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Masa muscular estimada",

            unidad: "kg",

            icono: "📈",

            decimales: 1,

            formato: "numero",

            descripcion:
                "Cantidad aproximada de masa muscular en kilogramos."

        },


        {

            clave: "rangoOrientativo",

            selectorValor:
                "#resultadoSecundarioTres",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Rango orientativo",

            unidad: "%",

            icono: "✅",

            decimales: 1,

            formato: "porcentaje",

            descripcion:
                "Referencia porcentual asociada a tu perfil."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Consulta la estimación de tu masa muscular y una orientación personalizada basada en los datos introducidos.",

        interpretacion:
            "Aquí aparecerá una explicación clara de tu porcentaje estimado, clasificación y masa muscular en kilogramos.",

        aviso:
            "Los resultados son estimaciones orientativas y no sustituyen una valoración profesional."

    },


    /* =================================================
       RECOMENDACIONES

       script.js podrá reemplazar estas recomendaciones
       según el resultado obtenido.
    ================================================= */

    recomendaciones: [

        "Comprueba que la edad, la altura, el peso y el nivel de actividad introducidos sean correctos.",

        "Observa la evolución de tus mediciones en condiciones similares, en lugar de valorar una cifra aislada.",

        "Consulta a profesionales de la salud, la nutrición o el deporte si necesitas una valoración individual."

    ],


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa los campos marcados antes de continuar.",

        errorCalculo:
            "No se ha podido estimar el porcentaje de masa muscular.",

        formularioIncompleto:
            "Completa correctamente todos los campos.",

        sinResultados:
            "No hay una estimación de masa muscular disponible.",

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
                "Calcular masa muscular",

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
            "calculadora-porcentaje-masa-muscular",

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

        debug: true,

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
