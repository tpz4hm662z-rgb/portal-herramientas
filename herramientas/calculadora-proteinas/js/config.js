/* =====================================================
   CALCULADORA DE PROTEÍNAS DIARIAS
   config.js
   Versión 1.0
   Imoancy Template v3.0
   © 2026 José Carlos Núñez Florido

   Centro de configuración específico de la herramienta.

   IMPORTANTE:
   Este archivo debe cargarse antes que core.js y script.js.
===================================================== */

"use strict";


const CONFIG = {

    /* =================================================
       IDENTIDAD DE LA HERRAMIENTA
    ================================================= */

    herramienta: {

        nombre:
            "Calculadora de Proteínas Diarias",

        nombreCorto:
            "Proteínas Diarias",

        proyecto:
            "calculadora-proteinas",

        categoria:
            "Salud y nutrición",

        icono:
            "🥩",

        version:
            "1.0",

        fechaActualizacion:
            "18 de julio de 2026",

        fechaISO:
            "2026-07-18",

        autor:
            "José Carlos Núñez Florido",

        marca:
            "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-proteinas/",

        urlPortal:
            "https://imoancy.com/"

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
            0,

        decimalesPorcentaje:
            2,

        usarSeparadorMiles:
            true,

        mostrarCerosFinales:
            false

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
    ================================================= */

    campos: {

        peso: {

            nombre:
                "Peso",

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

            mensajes: {

                obligatorio:
                    "Introduce tu peso.",

                invalido:
                    "Introduce un peso válido.",

                minimo:
                    "El peso debe ser igual o superior a 30 kg.",

                maximo:
                    "El peso debe ser igual o inferior a 300 kg."

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
                100,

            permitirCero:
                false,

            mensajes: {

                obligatorio:
                    "Introduce tu edad.",

                invalido:
                    "Introduce una edad válida.",

                minimo:
                    "Esta calculadora está diseñada para personas adultas.",

                maximo:
                    "La edad debe ser igual o inferior a 100 años."

            }

        },


        sexo: {

            nombre:
                "Sexo",

            selector:
                "#sexo",

            selectorError:
                "#errorSexo",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesValidas: [

                "hombre",

                "mujer"

            ],

            mensajes: {

                obligatorio:
                    "Selecciona una opción.",

                invalido:
                    "La opción seleccionada no es válida."

            }

        },


        actividad: {

            nombre:
                "Nivel de actividad física",

            selector:
                "#actividad",

            selectorError:
                "#errorActividad",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesValidas: [

                "sedentaria",

                "ligera",

                "moderada",

                "alta",

                "muy-alta"

            ],

            mensajes: {

                obligatorio:
                    "Selecciona tu nivel de actividad física.",

                invalido:
                    "El nivel de actividad seleccionado no es válido."

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

            opcionesValidas: [

                "salud",

                "perder-grasa",

                "ganar-musculo",

                "resistencia"

            ],

            mensajes: {

                obligatorio:
                    "Selecciona tu objetivo principal.",

                invalido:
                    "El objetivo seleccionado no es válido."

            }

        },


        comidas: {

            nombre:
                "Comidas diarias",

            selector:
                "#comidas",

            selectorError:
                "#errorComidas",

            tipo:
                "select",

            obligatorio:
                true,

            opcionesValidas: [

                "3",

                "4",

                "5",

                "6"

            ],

            mensajes: {

                obligatorio:
                    "Selecciona cuántas comidas realizas al día.",

                invalido:
                    "El número de comidas seleccionado no es válido."

            }

        }

    },


    /* =================================================
       FACTORES DE PROTEÍNA

       Los valores representan gramos de proteína
       por kilogramo de peso corporal y día.
    ================================================= */

    factoresProteina: {

        salud: {

            sedentaria:
                0.83,

            ligera:
                1.00,

            moderada:
                1.10,

            alta:
                1.20,

            "muy-alta":
                1.30

        },


        "perder-grasa": {

            sedentaria:
                1.40,

            ligera:
                1.50,

            moderada:
                1.60,

            alta:
                1.70,

            "muy-alta":
                1.80

        },


        "ganar-musculo": {

            sedentaria:
                1.60,

            ligera:
                1.70,

            moderada:
                1.80,

            alta:
                2.00,

            "muy-alta":
                2.20

        },


        resistencia: {

            sedentaria:
                1.20,

            ligera:
                1.30,

            moderada:
                1.40,

            alta:
                1.60,

            "muy-alta":
                1.80

        }

    },


    /* =================================================
       REFERENCIAS DEL CÁLCULO
    ================================================= */

    referencias: {

        factorMinimoAdultos:
            0.83,

        incrementoRangoSuperior:
            0.20,

        edadMinima:
            18,

        edadMaxima:
            100,

        pesoMinimo:
            30,

        pesoMaximo:
            300

    },


    /* =================================================
       NOMBRES LEGIBLES
    ================================================= */

    nombres: {

        objetivos: {

            salud:
                "mantener una alimentación saludable",

            "perder-grasa":
                "perder grasa conservando masa muscular",

            "ganar-musculo":
                "ganar masa muscular",

            resistencia:
                "mejorar el rendimiento y la recuperación"

        },


        actividades: {

            sedentaria:
                "sedentaria",

            ligera:
                "ligera",

            moderada:
                "moderada",

            alta:
                "alta",

            "muy-alta":
                "muy alta"

        },


        sexos: {

            hombre:
                "hombre",

            mujer:
                "mujer"

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
            "Proteína diaria recomendada",

        unidad:
            "g/día",

        icono:
            "🎯",

        decimales:
            0,

        formato:
            "numero",

        descripcion:
            "Estimación central de proteínas según tu peso, actividad física y objetivo."

    },


    /* =================================================
       RESULTADOS SECUNDARIOS
    ================================================= */

    resultadosSecundarios: [

        {

            clave:
                "referenciaMinima",

            selectorValor:
                "#resultadoSecundarioUno",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Referencia mínima",

            unidad:
                "g/día",

            icono:
                "📌",

            decimales:
                0,

            formato:
                "numero",

            descripcion:
                "Referencia general calculada con 0,83 gramos por kilogramo de peso."

        },


        {

            clave:
                "proteinaPorComida",

            selectorValor:
                "#resultadoSecundarioDos",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Proteína por comida",

            unidad:
                "g",

            icono:
                "🍽️",

            decimales:
                0,

            formato:
                "numero",

            descripcion:
                "Reparto aproximado según el número de comidas seleccionado."

        },


        {

            clave:
                "rangoSuperior",

            selectorValor:
                "#resultadoSecundarioTres",

            selectorTitulo:
                null,

            selectorUnidad:
                null,

            titulo:
                "Rango superior orientativo",

            unidad:
                "g/día",

            icono:
                "📈",

            decimales:
                0,

            formato:
                "numero",

            descripcion:
                "Límite superior orientativo del rango calculado."

        }

    ],


    /* =================================================
       EQUIVALENCIAS ALIMENTARIAS

       Cantidades aproximadas de proteína.
    ================================================= */

    equivalencias: {

        pollo: {

            nombre:
                "Pechuga de pollo cocinada",

            icono:
                "🍗",

            proteinaPor100:
                31,

            unidad:
                "g"

        },


        huevos: {

            nombre:
                "Huevos medianos",

            icono:
                "🥚",

            proteinaPorUnidad:
                6.3,

            unidad:
                "unidades"

        },


        lentejas: {

            nombre:
                "Lentejas cocidas",

            icono:
                "🌱",

            proteinaPor100:
                9,

            unidad:
                "g"

        },


        yogur: {

            nombre:
                "Yogur alto en proteína",

            icono:
                "🥣",

            proteinaPor100:
                10,

            unidad:
                "g"

        }

    },


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Estos son tus requerimientos diarios orientativos de proteína.",

        descripcionPrincipal:
            "La estimación se calcula utilizando tu peso, actividad física y objetivo principal.",

        reparto:
            "Aquí aparecerá una propuesta para repartir la proteína entre tus comidas.",

        equivalencias:
            "Estas equivalencias sirven para visualizar el resultado y no recomiendan consumir toda la proteína mediante un solo alimento.",

        interpretacion:
            "Aquí aparecerá una explicación personalizada del resultado.",

        aviso:
            "Los resultados son orientativos y no sustituyen la valoración de un dietista-nutricionista o profesional sanitario."

    },


    /* =================================================
       INTERPRETACIONES POR OBJETIVO
    ================================================= */

    interpretaciones: {

        salud:
            "Esta cantidad está orientada al mantenimiento general del organismo y aumenta progresivamente cuando existe más actividad física.",

        "perder-grasa":
            "Una ingesta proteica superior a la referencia mínima puede ayudar a conservar masa muscular y mejorar la saciedad durante una pérdida de grasa.",

        "ganar-musculo":
            "Para favorecer el desarrollo muscular, combina una ingesta adecuada de proteínas con entrenamiento de fuerza progresivo, suficiente energía y descanso.",

        resistencia:
            "En actividades de resistencia, la proteína contribuye a la reparación y recuperación de los tejidos después del ejercicio."

    },


    /* =================================================
       RECOMENDACIONES GENERALES
    ================================================= */

    recomendaciones: [

        "Distribuye la proteína entre varias comidas en lugar de concentrarla toda en una sola.",

        "Combina distintas fuentes de proteína y mantén una alimentación variada.",

        "No es necesario alcanzar exactamente la misma cantidad todos los días.",

        "Prioriza alimentos nutritivos antes de depender de suplementos.",

        "Consulta a un profesional si tienes una enfermedad renal, hepática, metabólica o alguna necesidad clínica especial."

    ],


    /* =================================================
       RECOMENDACIONES POR OBJETIVO
    ================================================= */

    recomendacionesPorObjetivo: {

        salud: [

            "Mantén una alimentación equilibrada que incluya frutas, verduras, cereales integrales y grasas saludables.",

            "Utiliza el resultado como una referencia flexible dentro de una dieta variada."

        ],


        "perder-grasa": [

            "Evita déficits calóricos extremos, ya que pueden perjudicar el rendimiento y aumentar la pérdida de masa muscular.",

            "Combina la alimentación con entrenamiento de fuerza para favorecer la conservación muscular."

        ],


        "ganar-musculo": [

            "Acompaña la alimentación con entrenamiento de fuerza progresivo.",

            "Asegúrate de consumir suficiente energía total y descansar adecuadamente."

        ],


        resistencia: [

            "Mantén una ingesta adecuada de hidratos de carbono para sostener el entrenamiento.",

            "Presta atención a la hidratación y a la recuperación después del ejercicio."

        ]

    },


    /* =================================================
       RECOMENDACIONES POR EDAD
    ================================================= */

    recomendacionesEdad: {

        edadAvanzada:
            65,

        mensaje:
            "En edades avanzadas puede ser especialmente útil repartir la proteína durante el día y solicitar una valoración profesional personalizada."

    },


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa los campos marcados antes de continuar.",

        errorCalculo:
            "No se ha podido calcular la proteína diaria.",

        formularioIncompleto:
            "Completa correctamente todos los campos.",

        sinResultados:
            "No hay resultados disponibles.",

        reinicioCorrecto:
            "La calculadora se ha reiniciado correctamente.",

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

        descripcionResultadoPrincipal:
            "#descripcionResultadoPrincipal",

        repartoComidas:
            "#repartoComidas",

        listaEquivalencias:
            "#listaEquivalencias",

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
                "Calcular proteínas",

            textoProcesando:
                "Calculando...",

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
            "calculadora-proteinas",

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
===================================================== */

Object.freeze(CONFIG);