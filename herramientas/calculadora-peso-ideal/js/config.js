/* =====================================================
   HERRAMIENTAS360
   Calculadora de Peso Ideal PRO
   config.js
   Versión 1.0
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

        nombre: "Calculadora de Peso Ideal PRO",

        nombreCorto: "Peso Ideal",

        proyecto: "calculadora-peso-ideal",

        categoria: "Salud",

        icono: "⚖️",

        version: "1.0",

        fechaActualizacion: "24 de julio de 2026",

        fechaISO: "2026-07-24",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url:
            "https://imoancy.com/herramientas/calculadora-peso-ideal/",

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

        limpiarErroresAlEditar: true,

        mostrarBotonReiniciar: true,

        bloquearBotonDuranteCalculo: true,

        tiempoBloqueoBoton: 300

    },


    /* =================================================
       CAMPOS DEL FORMULARIO
    ================================================= */

    campos: {

        sexo: {

            nombre: "Sexo",

            selector: "#sexo",

            selectorError: "#errorSexo",

            tipo: "select",

            obligatorio: true,

            opcionesValidas: ["hombre", "mujer"],

            mensajes: {

                obligatorio:
                    "Selecciona tu sexo.",

                invalido:
                    "Selecciona una opción de sexo válida."

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
                    "Introduce una edad válida.",

                minimo:
                    "La calculadora está diseñada para personas adultas de 18 años o más.",

                maximo:
                    "Introduce una edad igual o inferior a 100 años."

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
                    "Introduce tu altura en centímetros.",

                invalido:
                    "Introduce una altura válida.",

                minimo:
                    "La altura mínima admitida es de 120 cm.",

                maximo:
                    "La altura máxima admitida es de 230 cm."

            }

        },


        complexion: {

            nombre: "Complexión corporal",

            selector: "#complexion",

            selectorError: "#errorComplexion",

            tipo: "select",

            obligatorio: true,

            opcionesValidas: ["pequena", "media", "grande"],

            mensajes: {

                obligatorio:
                    "Selecciona tu complexión corporal.",

                invalido:
                    "Selecciona una complexión corporal válida."

            }

        }

    },


    /* =================================================
       PARÁMETROS DEL CÁLCULO

       Las fórmulas Devine, Robinson, Miller y Hamwi se
       calculan a partir de la altura expresada en pulgadas.
       Los valores base corresponden a una altura de 5 pies
       (60 pulgadas). El script.js utilizará estos parámetros.
    ================================================= */

    calculo: {

        centimetrosPorPulgada: 2.54,

        pulgadasBase: 60,

        alturaBaseCentimetros: 152.4,

        pesoMinimoTecnico: 30,

        pesoMaximoTecnico: 250,

        ajusteComplexion: {

            pequena: 0.90,

            media: 1.00,

            grande: 1.10

        },

        formulas: {

            devine: {

                nombre: "Fórmula de Devine",

                hombre: {

                    base: 50.0,

                    incrementoPorPulgada: 2.3

                },

                mujer: {

                    base: 45.5,

                    incrementoPorPulgada: 2.3

                }

            },

            robinson: {

                nombre: "Fórmula de Robinson",

                hombre: {

                    base: 52.0,

                    incrementoPorPulgada: 1.9

                },

                mujer: {

                    base: 49.0,

                    incrementoPorPulgada: 1.7

                }

            },

            miller: {

                nombre: "Fórmula de Miller",

                hombre: {

                    base: 56.2,

                    incrementoPorPulgada: 1.41

                },

                mujer: {

                    base: 53.1,

                    incrementoPorPulgada: 1.36

                }

            },

            hamwi: {

                nombre: "Fórmula de Hamwi",

                hombre: {

                    base: 48.0,

                    incrementoPorPulgada: 2.7

                },

                mujer: {

                    base: 45.5,

                    incrementoPorPulgada: 2.2

                }

            }

        },

        rangoSaludable: {

            imcMinimo: 18.5,

            imcMaximo: 24.9

        },

        edad: {

            aplicarAjuste: false,

            nota:
                "La edad se solicita para contextualizar el resultado, pero no altera directamente las fórmulas clínicas clásicas de peso ideal."

        }

    },


    /* =================================================
       RESULTADO PRINCIPAL
    ================================================= */

    resultadoPrincipal: {

        clave: "pesoIdealPromedio",

        selectorValor: "#resultadoPrincipal",

        selectorUnidad: "#kgResultadoPrincipal",

        selectorDescripcion:
            "#descripcionResultadoPrincipal",

        titulo: "Peso ideal estimado",

        unidad: "kg",

        icono: "⚖️",

        decimales: 1,

        formato: "numero",

        descripcion:
            "Estimación central obtenida al combinar varias fórmulas de referencia y ajustar el resultado según tu complexión corporal."

    },


    /* =================================================
       RESULTADOS SECUNDARIOS
    ================================================= */

    resultadosSecundarios: [

        {

            clave: "formulaDevine",

            selectorValor:
                "#resultadoSecundarioUno",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Fórmula de Devine",

            unidad: "kg",

            icono: "📏",

            decimales: 1,

            formato: "numero",

            descripcion:
                "Estimación basada en la fórmula de Devine, una referencia clásica utilizada para calcular el peso corporal ideal según sexo y altura."

        },


        {

            clave: "formulaRobinson",

            selectorValor:
                "#resultadoSecundarioDos",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Fórmula de Robinson",

            unidad: "kg",

            icono: "📊",

            decimales: 1,

            formato: "numero",

            descripcion:
                "Estimación obtenida con la fórmula de Robinson, que emplea coeficientes diferentes para hombres y mujeres."

        },


        {

            clave: "rangoSaludable",

            selectorValor:
                "#resultadoSecundarioTres",

            selectorTitulo: null,

            selectorUnidad: null,

            titulo:
                "Rango orientativo saludable",

            unidad: "kg",

            icono: "✅",

            decimales: 1,

            formato: "texto",

            descripcion:
                "Intervalo de peso orientativo calculado a partir del rango de IMC adulto considerado saludable."

        }

    ],


    /* =================================================
       TEXTOS DE RESULTADOS
    ================================================= */

    textosResultado: {

        resumen:
            "Tu peso ideal estimado se encuentra alrededor de {pesoIdeal} kg, con un rango saludable orientativo de {rangoMinimo} a {rangoMaximo} kg.",

        interpretacion:
            "El peso ideal no es una cifra exacta ni universal. Debe interpretarse como una referencia aproximada, ya que la composición corporal, la masa muscular, la estructura ósea, el estado de salud y otros factores personales pueden modificar el peso más adecuado para cada persona.",

        aviso:
            "Los resultados son orientativos y no sustituyen una valoración médica, nutricional ni antropométrica profesional."

    },


    /* =================================================
       INTERPRETACIONES DINÁMICAS
    ================================================= */

    interpretaciones: {

        general:
            "Las distintas fórmulas pueden ofrecer cifras ligeramente diferentes. Por eso la herramienta muestra una estimación central y varias referencias complementarias.",

        complexionPequena:
            "La complexión pequeña reduce ligeramente la estimación central para reflejar una estructura corporal más ligera.",

        complexionMedia:
            "La complexión media mantiene la estimación central sin ajustes adicionales.",

        complexionGrande:
            "La complexión grande aumenta ligeramente la estimación central para reflejar una estructura corporal más robusta.",

        masaMuscular:
            "Una persona con mucha masa muscular puede encontrarse por encima del rango calculado y mantener una composición corporal saludable.",

        edad:
            "Con el paso de los años pueden cambiar la masa muscular, la distribución de grasa y las necesidades de salud, aunque las fórmulas clásicas no incluyen un ajuste directo por edad."

    },


    /* =================================================
       RECOMENDACIONES

       script.js podrá seleccionar o reemplazar estas
       recomendaciones según el resultado obtenido.
    ================================================= */

    recomendaciones: [

        "Utiliza el resultado como una referencia aproximada y no como una obligación estética.",

        "Valora también tu perímetro de cintura, composición corporal, fuerza, energía y estado general de salud.",

        "Si deseas perder o ganar peso, hazlo progresivamente mediante alimentación equilibrada, actividad física y descanso suficiente.",

        "Evita dietas extremas o cambios bruscos basados únicamente en una cifra de peso.",

        "Consulta con un profesional sanitario si tienes una enfermedad, tomas medicación, presentas síntomas o necesitas un objetivo personalizado."

    ],


    /* =================================================
       RECOMENDACIONES POR PERFIL
    ================================================= */

    recomendacionesPorPerfil: {

        complexionPequena: [

            "En personas de estructura ligera, pequeños cambios de peso pueden representar una diferencia proporcional importante.",

            "Prioriza la conservación de masa muscular mediante ejercicio de fuerza y una ingesta adecuada de proteínas."

        ],

        complexionMedia: [

            "Compara el resultado con tu evolución histórica y con indicadores adicionales de salud.",

            "Mantén hábitos sostenibles antes que perseguir una cifra exacta."

        ],

        complexionGrande: [

            "Una estructura ósea robusta puede justificar un peso superior al promedio sin implicar necesariamente exceso de grasa.",

            "La composición corporal ofrece más información que el peso aislado."

        ],

        deportista: [

            "Las fórmulas de peso ideal pueden infravalorar el peso adecuado de personas con mucha masa muscular.",

            "En deportistas conviene utilizar mediciones de composición corporal y rendimiento."

        ]

    },


    /* =================================================
       MENSAJES GENERALES
    ================================================= */

    mensajes: {

        errorGeneral:
            "Revisa los campos marcados antes de continuar.",

        errorCalculo:
            "No se ha podido calcular tu peso ideal. Revisa los datos e inténtalo de nuevo.",

        formularioIncompleto:
            "Completa correctamente todos los campos.",

        sinResultados:
            "No hay resultados disponibles.",

        resultadoFueraRango:
            "El resultado obtenido está fuera del rango técnico previsto. Comprueba los datos introducidos.",

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

        resultadoPrincipal:
            "#resultadoPrincipal",

        unidadResultadoPrincipal:
            "#kgResultadoPrincipal",

        descripcionResultadoPrincipal:
            "#descripcionResultadoPrincipal",

        resultadoSecundarioUno:
            "#resultadoSecundarioUno",

        resultadoSecundarioDos:
            "#resultadoSecundarioDos",

        resultadoSecundarioTres:
            "#resultadoSecundarioTres",

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
                "Calcular peso ideal",

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
            "calculadora-peso-ideal",

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
            true,

        mensajeResultado:
            "Cálculo completado. Ya puedes consultar tu peso ideal estimado y los resultados complementarios."

    },


    /* =================================================
       SEO Y DATOS ESTRUCTURADOS

       Información disponible para futuras mejoras del
       script o para sincronizar metadatos dinámicamente.
    ================================================= */

    seo: {

        titulo:
            "Calculadora de Peso Ideal PRO Gratis | Imoancy",

        descripcion:
            "Calcula gratis tu peso ideal según sexo, edad, altura y complexión. Compara varias fórmulas y consulta un rango de peso saludable orientativo.",

        palabrasClave: [

            "calculadora de peso ideal",

            "peso ideal",

            "cuánto debo pesar",

            "rango de peso saludable",

            "fórmula de Devine",

            "fórmula de Robinson",

            "calculadora de salud"

        ],

        canonical:
            "https://imoancy.com/herramientas/calculadora-peso-ideal/",

        idioma:
            "es",

        pais:
            "ES"

    },


    /* =================================================
       AVISOS DE SALUD
    ================================================= */

    salud: {

        uso:
            "educativo y orientativo",

        publico:
            "personas adultas",

        noAptoPara: [

            "menores de 18 años",

            "embarazo",

            "situaciones clínicas que alteren significativamente el peso o la composición corporal",

            "diagnóstico de trastornos de la conducta alimentaria"

        ],

        avisoProfesional:
            "Para establecer un objetivo individual de peso o composición corporal, consulta con un médico, dietista-nutricionista u otro profesional sanitario cualificado."

    },


    /* =================================================
       DESARROLLO

       debug debe permanecer en false al publicar.
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

   Evita la reasignación accidental del objeto principal.
   Los objetos internos permanecen disponibles para la
   lógica específica de la herramienta.
===================================================== */

Object.freeze(CONFIG);