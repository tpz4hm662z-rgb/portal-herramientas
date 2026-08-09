/* =====================================================
   HERRAMIENTAS360
   Calculadora de Grasa Corporal PRO
   config.js
   Versión 1.0
   © 2026 José Carlos Núñez Florido

   Centro de configuración de la herramienta.

   ORDEN OBLIGATORIO:
   1. config.js
   2. core.js
   3. script.js
===================================================== */

"use strict";


const CONFIG = {

    /* =================================================
       1. IDENTIDAD DE LA HERRAMIENTA
    ================================================= */

    herramienta: {

        nombre: "Calculadora de Grasa Corporal PRO",

        nombreCorto: "Grasa Corporal",

        proyecto: "Imoancy",

        categoria: "Salud y bienestar",

        icono: "📏",

        version: "1.0",

        fechaActualizacion: "21 de julio de 2026",

        fechaISO: "2026-07-21",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url: "https://imoancy.com/herramientas/calculadora-grasa-corporal/",

        portal: "https://imoancy.com/"

    },


    /* =================================================
       2. MÉTODO DE CÁLCULO
    ================================================= */

    calculo: {

        metodo: "US Navy",

        descripcion:
            "Estimación antropométrica del porcentaje de grasa corporal mediante el método US Navy.",

        unidadMedidas: "cm",

        unidadPeso: "kg",

        unidadResultado: "%",

        decimalesPorcentaje: 1,

        decimalesMasa: 1,

        porcentajeMinimo: 2,

        porcentajeMaximo: 75

    },


    /* =================================================
       3. SELECTORES DEL DOCUMENTO
    ================================================= */

    selectores: {

        formulario: "#formularioHerramienta",

        sexo: "#sexo",

        edad: "#edad",

        altura: "#altura",

        peso: "#peso",

        cuello: "#cuello",

        cintura: "#cintura",

        cadera: "#cadera",

        campoCadera: "#campoCadera",

        botonCalcular: "#botonCalcular",

        botonReiniciar: "#botonReiniciar",

        seccionResultados: "#resultados",

        resumenResultado: "#resumenResultado",

        resultadoPrincipal: "#resultadoPrincipal",

        unidadResultadoPrincipal: "#unidadResultadoPrincipal",

        descripcionResultadoPrincipal:
            "#descripcionResultadoPrincipal",

        resultadoSecundarioUno:
            "#resultadoSecundarioUno",

        resultadoSecundarioDos:
            "#resultadoSecundarioDos",

        resultadoSecundarioTres:
            "#resultadoSecundarioTres",

        interpretacionResultado:
            "#interpretacionResultado",

        listaRecomendaciones:
            "#listaRecomendaciones"

    },


    /* =================================================
       4. CAMPOS DEL FORMULARIO
    ================================================= */

    campos: {

        sexo: {

            id: "sexo",

            nombre: "sexo",

            etiqueta: "Sexo utilizado por la fórmula",

            tipo: "select",

            obligatorio: true,

            mensajeVacio:
                "Selecciona una opción para continuar.",

            opcionesValidas: [
                "hombre",
                "mujer"
            ]

        },


        edad: {

            id: "edad",

            nombre: "edad",

            etiqueta: "Edad",

            tipo: "numero",

            obligatorio: true,

            minimo: 18,

            maximo: 100,

            decimales: 0,

            mensajeVacio:
                "Introduce tu edad.",

            mensajeInvalido:
                "Introduce una edad válida.",

            mensajeRango:
                "La edad debe estar entre 18 y 100 años."

        },


        altura: {

            id: "altura",

            nombre: "altura",

            etiqueta: "Altura",

            tipo: "numero",

            obligatorio: true,

            minimo: 120,

            maximo: 230,

            decimales: 1,

            unidad: "cm",

            mensajeVacio:
                "Introduce tu altura.",

            mensajeInvalido:
                "Introduce una altura válida.",

            mensajeRango:
                "La altura debe estar entre 120 y 230 cm."

        },


        peso: {

            id: "peso",

            nombre: "peso",

            etiqueta: "Peso",

            tipo: "numero",

            obligatorio: true,

            minimo: 30,

            maximo: 350,

            decimales: 1,

            unidad: "kg",

            mensajeVacio:
                "Introduce tu peso.",

            mensajeInvalido:
                "Introduce un peso válido.",

            mensajeRango:
                "El peso debe estar entre 30 y 350 kg."

        },


        cuello: {

            id: "cuello",

            nombre: "cuello",

            etiqueta: "Contorno del cuello",

            tipo: "numero",

            obligatorio: true,

            minimo: 20,

            maximo: 70,

            decimales: 1,

            unidad: "cm",

            mensajeVacio:
                "Introduce el contorno de tu cuello.",

            mensajeInvalido:
                "Introduce una medida de cuello válida.",

            mensajeRango:
                "El cuello debe medir entre 20 y 70 cm."

        },


        cintura: {

            id: "cintura",

            nombre: "cintura",

            etiqueta: "Contorno de la cintura",

            tipo: "numero",

            obligatorio: true,

            minimo: 40,

            maximo: 220,

            decimales: 1,

            unidad: "cm",

            mensajeVacio:
                "Introduce el contorno de tu cintura.",

            mensajeInvalido:
                "Introduce una medida de cintura válida.",

            mensajeRango:
                "La cintura debe medir entre 40 y 220 cm."

        },


        cadera: {

            id: "cadera",

            nombre: "cadera",

            etiqueta: "Contorno de la cadera",

            tipo: "numero",

            obligatorio: false,

            obligatorioPara: "mujer",

            minimo: 50,

            maximo: 220,

            decimales: 1,

            unidad: "cm",

            mensajeVacio:
                "Introduce el contorno de tu cadera.",

            mensajeInvalido:
                "Introduce una medida de cadera válida.",

            mensajeRango:
                "La cadera debe medir entre 50 y 220 cm."

        }

    },


    /* =================================================
       5. MENSAJES GENERALES
    ================================================= */

    mensajes: {

        formularioInvalido:
            "Revisa los campos marcados antes de calcular.",

        calculando:
            "Calculando...",

        botonCalcular:
            "Calcular grasa corporal",

        botonReiniciar:
            "Reiniciar herramienta",

        errorCalculo:
            "No ha sido posible realizar el cálculo. Revisa las medidas introducidas.",

        combinacionInvalidaHombre:
            "La cintura debe ser mayor que el cuello para poder aplicar la fórmula.",

        combinacionInvalidaMujer:
            "La suma de cintura y cadera debe ser mayor que el cuello para poder aplicar la fórmula.",

        resultadoFueraRango:
            "Las medidas introducidas generan un resultado fuera del rango habitual. Comprueba que estén escritas correctamente.",

        resumenResultado:
            "Estos resultados son orientativos y se han calculado mediante el método US Navy.",

        resultadoReiniciado:
            "La herramienta se ha reiniciado correctamente."

    },


    /* =================================================
       6. CLASIFICACIONES PARA HOMBRES
    ================================================= */

    clasificacionesHombre: [

        {

            minimo: 0,

            maximo: 5.9,

            nombre: "Grasa esencial",

            descripcion:
                "El resultado se encuentra en un nivel extremadamente bajo de grasa corporal.",

            interpretacion:
                "Este porcentaje se aproxima a los niveles mínimos necesarios para las funciones fisiológicas. Mantener valores tan bajos puede no ser adecuado para la mayoría de las personas y debería valorarse con un profesional.",

            recomendaciones: [

                "No intentes reducir más el porcentaje de grasa sin supervisión profesional.",

                "Asegura una alimentación suficiente en energía, proteínas y micronutrientes.",

                "Consulta a un profesional sanitario o de nutrición si presentas cansancio, mareos o pérdida de rendimiento."

            ]

        },


        {

            minimo: 6,

            maximo: 13.9,

            nombre: "Nivel atlético",

            descripcion:
                "El resultado se encuentra dentro de un nivel habitualmente asociado a perfiles atléticos.",

            interpretacion:
                "Es un porcentaje de grasa corporal relativamente bajo. Puede observarse en deportistas o personas muy definidas, aunque no es necesario para disfrutar de una buena salud.",

            recomendaciones: [

                "Prioriza el mantenimiento de la masa muscular mediante entrenamiento de fuerza.",

                "Evita déficits calóricos excesivos o prolongados.",

                "Controla tu energía, recuperación y rendimiento físico."

            ]

        },


        {

            minimo: 14,

            maximo: 17.9,

            nombre: "Buena condición física",

            descripcion:
                "El resultado se encuentra dentro de un nivel asociado a una buena condición física.",

            interpretacion:
                "Este intervalo suele reflejar una composición corporal relativamente definida y compatible con un estilo de vida activo.",

            recomendaciones: [

                "Mantén una alimentación equilibrada adaptada a tu actividad.",

                "Combina entrenamiento de fuerza con actividad cardiovascular.",

                "Utiliza futuras mediciones para observar la tendencia y no pequeñas variaciones."

            ]

        },


        {

            minimo: 18,

            maximo: 24.9,

            nombre: "Promedio saludable",

            descripcion:
                "El resultado se encuentra dentro de un intervalo habitual en la población adulta.",

            interpretacion:
                "El porcentaje estimado se sitúa en una franja general considerada habitual. La salud no depende únicamente de esta cifra, sino también de factores como la actividad física, la alimentación y los marcadores clínicos.",

            recomendaciones: [

                "Mantén una rutina regular de actividad física.",

                "Prioriza alimentos poco procesados, proteínas suficientes, verduras y fruta.",

                "Controla la evolución utilizando siempre el mismo método de medición."

            ]

        },


        {

            minimo: 25,

            maximo: 29.9,

            nombre: "Nivel elevado",

            descripcion:
                "El resultado se encuentra por encima del intervalo promedio de referencia.",

            interpretacion:
                "La estimación indica una proporción de grasa corporal elevada. Esto no constituye un diagnóstico, pero puede resultar útil revisar hábitos y otros indicadores de salud.",

            recomendaciones: [

                "Busca una pérdida de grasa gradual, evitando dietas extremas.",

                "Incluye entrenamiento de fuerza para ayudar a conservar la masa muscular.",

                "Consulta a un profesional si tienes enfermedades, síntomas o dudas sobre tu estado de salud."

            ]

        },


        {

            minimo: 30,

            maximo: 100,

            nombre: "Nivel muy elevado",

            descripcion:
                "El resultado se encuentra en un nivel de grasa corporal muy elevado.",

            interpretacion:
                "La estimación sugiere una cantidad considerable de grasa corporal. Conviene valorar el resultado junto con la cintura, la condición física y otros indicadores clínicos.",

            recomendaciones: [

                "Plantea cambios progresivos que puedas mantener a largo plazo.",

                "Combina alimentación equilibrada, actividad diaria y entrenamiento adaptado.",

                "Solicita orientación sanitaria o nutricional para recibir una valoración individual."

            ]

        }

    ],


    /* =================================================
       7. CLASIFICACIONES PARA MUJERES
    ================================================= */

    clasificacionesMujer: [

        {

            minimo: 0,

            maximo: 13.9,

            nombre: "Grasa esencial",

            descripcion:
                "El resultado se encuentra en un nivel extremadamente bajo de grasa corporal.",

            interpretacion:
                "Este porcentaje se aproxima a los niveles mínimos necesarios para las funciones fisiológicas. Mantener valores tan bajos puede afectar a la energía, la recuperación y la función hormonal.",

            recomendaciones: [

                "No intentes reducir más el porcentaje de grasa sin supervisión profesional.",

                "Asegura una ingesta suficiente de energía, grasas saludables y micronutrientes.",

                "Consulta a un profesional sanitario ante alteraciones menstruales, cansancio o pérdida de rendimiento."

            ]

        },


        {

            minimo: 14,

            maximo: 20.9,

            nombre: "Nivel atlético",

            descripcion:
                "El resultado se encuentra dentro de un nivel habitualmente asociado a perfiles atléticos.",

            interpretacion:
                "Es un porcentaje relativamente bajo que puede observarse en deportistas o mujeres con una composición corporal muy definida.",

            recomendaciones: [

                "Mantén una alimentación suficiente para favorecer la recuperación.",

                "Prioriza el entrenamiento de fuerza y el descanso.",

                "Evita mantener déficits calóricos agresivos durante periodos prolongados."

            ]

        },


        {

            minimo: 21,

            maximo: 24.9,

            nombre: "Buena condición física",

            descripcion:
                "El resultado se encuentra dentro de un nivel asociado a una buena condición física.",

            interpretacion:
                "Este intervalo suele reflejar una composición corporal activa y relativamente definida, aunque existen diferencias individuales importantes.",

            recomendaciones: [

                "Continúa con una rutina equilibrada de fuerza y actividad cardiovascular.",

                "Mantén una alimentación variada con suficiente proteína.",

                "Evalúa los cambios mediante tendencias de varias semanas."

            ]

        },


        {

            minimo: 25,

            maximo: 31.9,

            nombre: "Promedio saludable",

            descripcion:
                "El resultado se encuentra dentro de un intervalo habitual en la población adulta.",

            interpretacion:
                "El porcentaje estimado se sitúa en una franja general considerada habitual. Debe interpretarse junto con la actividad, los hábitos y otros indicadores de salud.",

            recomendaciones: [

                "Mantén una rutina regular de actividad física.",

                "Prioriza alimentos poco procesados, verduras, fruta y proteínas suficientes.",

                "Repite las medidas en condiciones similares para evaluar la evolución."

            ]

        },


        {

            minimo: 32,

            maximo: 37.9,

            nombre: "Nivel elevado",

            descripcion:
                "El resultado se encuentra por encima del intervalo promedio de referencia.",

            interpretacion:
                "La estimación indica una proporción de grasa corporal elevada. No constituye un diagnóstico, pero puede ser útil revisar hábitos y otros indicadores de salud.",

            recomendaciones: [

                "Busca una reducción gradual y sostenible de la grasa corporal.",

                "Incluye ejercicios de fuerza para conservar la masa muscular.",

                "Solicita asesoramiento profesional si tienes enfermedades, síntomas o dudas."

            ]

        },


        {

            minimo: 38,

            maximo: 100,

            nombre: "Nivel muy elevado",

            descripcion:
                "El resultado se encuentra en un nivel de grasa corporal muy elevado.",

            interpretacion:
                "La estimación sugiere una cantidad considerable de grasa corporal. Es recomendable valorar el resultado junto con otros indicadores médicos y de estilo de vida.",

            recomendaciones: [

                "Plantea cambios progresivos y realistas que puedas mantener.",

                "Aumenta la actividad diaria de acuerdo con tu condición física.",

                "Consulta con un profesional sanitario o de nutrición para una valoración personalizada."

            ]

        }

    ],


    /* =================================================
       8. RECOMENDACIONES GENERALES
    ================================================= */

    recomendacionesGenerales: [

        "Repite las mediciones en condiciones similares y utilizando los mismos puntos anatómicos.",

        "No interpretes pequeñas variaciones como cambios reales de grasa corporal.",

        "Valora la tendencia durante varias semanas en lugar de un único resultado.",

        "La masa magra no representa únicamente músculo; también incluye agua, huesos y órganos.",

        "Esta herramienta no sustituye una valoración médica, nutricional o deportiva profesional."

    ],


    /* =================================================
       9. COMPORTAMIENTO DE LA INTERFAZ
    ================================================= */

    interfaz: {

        claseOculto: "oculto",

        claseError: "campo-error",

        atributoInvalido: "aria-invalid",

        desplazarResultados: true,

        comportamientoScroll: "smooth",

        bloqueScroll: "start",

        enfocarPrimerError: true,

        limpiarErroresAlEscribir: true,

        mostrarCaderaSoloMujer: true,

        reiniciarSexo: true

    },


    /* =================================================
       10. ANALÍTICA
    ================================================= */

    analitica: {

        activa: true,

        eventoCalculo:
            "calculo_grasa_corporal",

        eventoReinicio:
            "reinicio_grasa_corporal",

        categoria:
            "Calculadoras de salud",

        herramienta:
            "Calculadora de Grasa Corporal PRO"

    },


    /* =================================================
       11. ACCESIBILIDAD
    ================================================= */

    accesibilidad: {

        anunciarErrores: true,

        anunciarResultado: true,

        enfocarResultados: false,

        mensajeResultado:
            "El cálculo de grasa corporal se ha completado correctamente."

    }

};


/* =====================================================
   EVITAR MODIFICACIONES ACCIDENTALES
===================================================== */

Object.freeze(CONFIG.herramienta);

Object.freeze(CONFIG.calculo);

Object.freeze(CONFIG.selectores);

Object.freeze(CONFIG.mensajes);

Object.freeze(CONFIG.interfaz);

Object.freeze(CONFIG.analitica);

Object.freeze(CONFIG.accesibilidad);

Object.freeze(CONFIG);