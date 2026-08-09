/* =====================================================
   HERRAMIENTAS360 TEMPLATE
   config.js
   Versión 3.0 Stable
   © 2026 José Carlos Núñez Florido

   Centro de configuración de la
   Calculadora de Porcentaje de Grasa Ideal PRO.

   IMPORTANTE:
   Este archivo debe cargarse antes que core.js y script.js.
   No contiene lógica de cálculo.
===================================================== */

"use strict";

const CONFIG = {

    /* =================================================
       IDENTIDAD DE LA HERRAMIENTA
    ================================================= */

    herramienta: {

        nombre:
            "Calculadora de Porcentaje de Grasa Ideal PRO",

        nombreCorto:
            "Grasa Ideal PRO",

        proyecto:
            "calculadora-porcentaje-grasa-ideal",

        categoria:
            "Salud y composición corporal",

        icono:
            "📐",

        version:
            "1.0",

        fechaActualizacion:
            "29 de julio de 2026",

        fechaISO:
            "2026-07-29",

        autor:
            "José Carlos Núñez Florido",

        marca:
            "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-porcentaje-grasa-ideal/",

        urlPortal:
            "https://imoancy.com/"

    },


    /* =================================================
       SEO INTERNO

       Referencia centralizada para futuras funciones
       de compartir, exportar o generar metadatos.
       Los metadatos públicos se encuentran en index.html.
    ================================================= */

    seo: {

        titulo:
            "Calculadora de Porcentaje de Grasa Ideal PRO Gratis | Imoancy",

        descripcion:
            "Calcula gratis tu porcentaje de grasa corporal ideal según sexo, edad y objetivo. Compara tu nivel actual y obtén un rango saludable, masa grasa, masa magra y recomendaciones personalizadas.",

        descripcionCorta:
            "Descubre tu rango de grasa corporal ideal y analiza tu composición corporal con referencias adaptadas a tu perfil.",

        palabrasClave: [
            "calculadora porcentaje grasa ideal",
            "grasa corporal ideal",
            "porcentaje de grasa saludable",
            "calcular grasa corporal",
            "masa grasa",
            "masa magra",
            "composición corporal"
        ],

        canonical:
            "https://imoancy.com/herramientas/calculadora-porcentaje-grasa-ideal/",

        imagenSocial:
            "https://avatars.githubusercontent.com/tpz4hm662z-rgb",

        idioma:
            "es",

        locale:
            "es_ES"

    },


    /* =================================================
       FORMATO GENERAL
    ================================================= */

    formato: {

        locale:
            "es-ES",

        moneda:
            "EUR",

        decimales:
            1,

        decimalesPorcentaje:
            1,

        usarSeparadorMiles:
            true,

        mostrarCerosFinales:
            true

    },


    /* =================================================
       COMPORTAMIENTO
    ================================================= */

    comportamiento: {

        scrollResultados:
            true,

        scrollSuave:
            true,

        enfocarPrimerError:
            true,

        ocultarResultadosAlEditar:
            false,

        limpiarErroresAlEditar:
            true,

        mostrarBotonReiniciar:
            true,

        bloquearBotonDuranteCalculo:
            true,

        tiempoBloqueoBoton:
            300

    },


    /* =================================================
       CAMPOS DEL FORMULARIO

       Los selectores coinciden con los IDs de index.html.

       grasaActual es un dato numérico opcional. Se declara
       como texto para que el core v3.0 admita el valor vacío
       sin modificar su infraestructura reutilizable.
       script.js podrá convertirlo mediante convertirANumero
       cuando se implemente la lógica específica.
    ================================================= */

    campos: {

        sexo: {

            nombre:
                "Sexo biológico",

            selector:
                "#sexo",

            selectorError:
                "#errorSexo",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesPermitidas: [
                "hombre",
                "mujer"
            ],

            mensajes: {

                obligatorio:
                    "Selecciona tu sexo biológico.",

                invalido:
                    "Selecciona una opción válida."

            }

        },


        edad: {

            nombre:
                "Edad",

            selector:
                "#edad",

            selectorError:
                "#errorEdad",

            tipo:
                "numero",

            obligatorio:
                true,

            minimo:
                18,

            maximo:
                79,

            permitirCero:
                false,

            mensajes: {

                obligatorio:
                    "Introduce tu edad.",

                invalido:
                    "Introduce una edad válida.",

                minimo:
                    "La calculadora está diseñada para personas de 18 años o más.",

                maximo:
                    "Introduce una edad igual o inferior a 79 años."

            }

        },


        altura: {

            nombre:
                "Altura",

            selector:
                "#altura",

            selectorError:
                "#errorAltura",

            tipo:
                "numero",

            obligatorio:
                true,

            minimo:
                120,

            maximo:
                230,

            permitirCero:
                false,

            unidad:
                "cm",

            mensajes: {

                obligatorio:
                    "Introduce tu altura.",

                invalido:
                    "Introduce una altura válida.",

                minimo:
                    "La altura mínima admitida es 120 cm.",

                maximo:
                    "La altura máxima admitida es 230 cm."

            }

        },


        peso: {

            nombre:
                "Peso actual",

            selector:
                "#peso",

            selectorError:
                "#errorPeso",

            tipo:
                "numero",

            obligatorio:
                true,

            minimo:
                30,

            maximo:
                300,

            permitirCero:
                false,

            unidad:
                "kg",

            mensajes: {

                obligatorio:
                    "Introduce tu peso actual.",

                invalido:
                    "Introduce un peso válido.",

                minimo:
                    "El peso mínimo admitido es 30 kg.",

                maximo:
                    "El peso máximo admitido es 300 kg."

            }

        },


        grasaActual: {

            nombre:
                "Porcentaje de grasa corporal actual",

            selector:
                "#grasaActual",

            selectorError:
                "#errorGrasaActual",

            tipo:
                "texto",

            subtipo:
                "numeroOpcional",

            obligatorio:
                false,

            minimo:
                2,

            maximo:
                70,

            permitirCero:
                false,

            unidad:
                "%",

            mensajes: {

                obligatorio:
                    "",

                invalido:
                    "Introduce un porcentaje de grasa válido.",

                minimo:
                    "El porcentaje mínimo admitido es 2 %.",

                maximo:
                    "El porcentaje máximo admitido es 70 %."

            }

        },


        actividad: {

            nombre:
                "Nivel de actividad habitual",

            selector:
                "#actividad",

            selectorError:
                "#errorActividad",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesPermitidas: [
                "sedentaria",
                "ligera",
                "moderada",
                "alta",
                "deportista"
            ],

            mensajes: {

                obligatorio:
                    "Selecciona tu nivel de actividad habitual.",

                invalido:
                    "Selecciona un nivel de actividad válido."

            }

        },


        objetivo: {

            nombre:
                "Objetivo principal",

            selector:
                "#objetivo",

            selectorError:
                "#errorObjetivo",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesPermitidas: [
                "salud",
                "perder-grasa",
                "recomposicion",
                "rendimiento"
            ],

            mensajes: {

                obligatorio:
                    "Selecciona tu objetivo principal.",

                invalido:
                    "Selecciona un objetivo válido."

            }

        }

    },


    /* =================================================
       RESULTADO PRINCIPAL
    ================================================= */

    resultadoPrincipal: {

        selectorValor:
            "#resultadoPrincipal",

        selectorUnidad:
            "#unidadResultadoPrincipal",

        selectorDescripcion:
            "#descripcionResultadoPrincipal",

        titulo:
            "Valor ideal de referencia",

        unidad:
            "%",

        icono:
            "🎯",

        decimales:
            1,

        formato:
            "numero",

        descripcion:
            "Valor central orientativo dentro de tu rango personalizado de grasa corporal."

    },


    /* =================================================
       RESULTADOS SECUNDARIOS
    ================================================= */

    resultadosSecundarios: [

        {

            clave:
                "rangoIdeal",

            selectorValor:
                "#resultadoRangoIdeal",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Rango ideal estimado",

            unidad:
                "%",

            icono:
                "📊",

            decimales:
                1,

            formato:
                "texto",

            descripcion:
                "Intervalo de referencia adaptado al perfil de la persona."

        },


        {

            clave:
                "masaGrasa",

            selectorValor:
                "#resultadoMasaGrasa",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Masa grasa actual",

            unidad:
                "kg",

            icono:
                "⚖️",

            decimales:
                1,

            formato:
                "numero",

            descripcion:
                "Peso estimado correspondiente al tejido graso."

        },


        {

            clave:
                "masaMagra",

            selectorValor:
                "#resultadoMasaMagra",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Masa libre de grasa",

            unidad:
                "kg",

            icono:
                "💪",

            decimales:
                1,

            formato:
                "numero",

            descripcion:
                "Estimación conjunta de músculo, huesos, órganos y agua."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Este es tu análisis orientativo de composición corporal según los datos introducidos.",

        comparacion:
            "Introduce tu porcentaje de grasa actual para compararlo con el rango ideal estimado.",

        interpretacion:
            "Tu resultado debe interpretarse como una referencia general y junto con tu evolución, hábitos, bienestar y contexto personal.",

        aviso:
            "Los resultados son orientativos y no sustituyen una valoración médica, nutricional o deportiva individual."

    },


    /* =================================================
       RECOMENDACIONES

       script.js podrá reemplazarlas según el resultado.
    ================================================= */

    recomendaciones: [

        "Prioriza cambios graduales y sostenibles en lugar de objetivos extremos.",

        "Compara mediciones obtenidas con el mismo método y en condiciones similares.",

        "Combina alimentación adecuada, entrenamiento de fuerza, actividad diaria y descanso.",

        "Consulta a un profesional sanitario o de la nutrición si necesitas una valoración individual."

    ],


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa los campos marcados antes de calcular tu resultado.",

        errorCalculo:
            "No se ha podido calcular tu porcentaje de grasa ideal.",

        formularioIncompleto:
            "Completa correctamente los datos obligatorios.",

        sinResultados:
            "Todavía no hay un análisis disponible.",

        reinicioCorrecto:
            "La calculadora se ha reiniciado correctamente.",

        copiando:
            "Copiando tu análisis...",

        copiado:
            "El resultado se ha copiado al portapapeles.",

        errorCopiar:
            "No se ha podido copiar el resultado.",

        compartido:
            "El resultado se ha compartido correctamente.",

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

        comparacionResultado:
            "#comparacionResultado",

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
                "Calcular mi porcentaje ideal",

            textoProcesando:
                "Calculando tu resultado...",

            desactivarDuranteCalculo:
                true

        },

        reiniciar: {

            texto:
                "Reiniciar calculadora"

        }

    },


    /* =================================================
       FUNCIONES OPCIONALES

       Preparadas para futuras versiones.
    ================================================= */

    funciones: {

        copiarResultado:
            false,

        compartirResultado:
            false,

        exportarPDF:
            false,

        imprimirResultado:
            false,

        guardarLocalmente:
            false,

        recuperarUltimoCalculo:
            false,

        analiticaEventos:
            false

    },


    /* =================================================
       ALMACENAMIENTO LOCAL
    ================================================= */

    almacenamiento: {

        prefijo:
            "h360",

        clave:
            "calculadora-porcentaje-grasa-ideal",

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
    ================================================= */

    desarrollo: {

        debug:
            false,

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
   desarrollo de la herramienta.
===================================================== */

Object.freeze(CONFIG);
