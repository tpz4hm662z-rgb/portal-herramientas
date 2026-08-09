/* ==========================================================
   Imoancy
   Calculadora de Calorías
   Configuración Global
   Versión 1.0
========================================================== */

/* ==========================================================
   INFORMACIÓN DE LA APLICACIÓN
========================================================== */

const CONFIG = {

    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-calorias/"
    }

};

const APP = {

    nombre: "Calculadora de Calorías",

    version: "1.0",

    autor: "Imoancy"

};


/* ==========================================================
   FÓRMULA UTILIZADA
========================================================== */

const FORMULA = {

    nombre: "Mifflin-St Jeor"

};


/* ==========================================================
   FACTORES DE ACTIVIDAD
========================================================== */

const ACTIVIDAD = {

    sedentario: {
        nombre: "Sedentario",
        factor: 1.20
    },

    ligero: {
        nombre: "Actividad ligera",
        factor: 1.375
    },

    moderado: {
        nombre: "Actividad moderada",
        factor: 1.55
    },

    intenso: {
        nombre: "Actividad intensa",
        factor: 1.725
    },

    muyIntenso: {
        nombre: "Muy intensa",
        factor: 1.90
    }

};


/* ==========================================================
   OBJETIVOS
========================================================== */

const OBJETIVOS = {

    perder: {

        nombre: "Perder grasa",

        ajuste: -0.15

    },

    mantener: {

        nombre: "Mantener peso",

        ajuste: 0

    },

    ganar: {

        nombre: "Ganar músculo",

        ajuste: 0.10

    }

};


/* ==========================================================
   LÍMITES DE VALIDACIÓN
========================================================== */

const LIMITES = {

    edad: {

        min: 18,

        max: 100

    },

    peso: {

        min: 35,

        max: 300

    },

    altura: {

        min: 120,

        max: 230

    }

};


/* ==========================================================
   CONFIGURACIÓN VISUAL
========================================================== */

const UI = {

    animacionCalculo: 900,

    mostrarAnimacion: true,

    scrollResultado: true,

    scrollSuave: true

};


/* ==========================================================
   MENSAJES
========================================================== */

const MENSAJES = {

    inicio: "Preparando cálculo...",

    paso1: "Calculando metabolismo basal...",

    paso2: "Aplicando nivel de actividad...",

    paso3: "Calculando objetivo calórico...",

    paso4: "Preparando recomendaciones personalizadas...",

    errorCampos: "Completa todos los campos correctamente.",

    errorEdad: "La edad está fuera del rango permitido.",

    errorPeso: "El peso está fuera del rango permitido.",

    errorAltura: "La altura está fuera del rango permitido."

};


/* ==========================================================
   ICONOS
========================================================== */

const ICONOS = {

    calorias: "🔥",

    metabolismo: "⚡",

    actividad: "🏃",

    objetivo: "🎯",

    consejos: "💡"

};
