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

        nombre: "Calculadora de Macros",

        nombreCorto: "Macros",

        proyecto: "calculadora-macros",

        categoria: "Salud",

        icono: "🥗",

        version: "1.0",

        fechaActualizacion: "21 de julio de 2026",

        fechaISO: "2026-07-21",

        autor: "José Carlos Núñez Florido",

        marca: "Imoancy",

        url: "https://imoancy.com/herramientas/calculadora-macros/"

    },



    /* =================================================
       SEO
    ================================================= */

    seo: {

        title: "Calculadora de Macros Gratis | Proteínas, Grasas y Carbohidratos | Imoancy",

        description: "Calcula tus macronutrientes diarios según tu peso, edad, altura, sexo, actividad física y objetivo. Obtén tus proteínas, grasas, carbohidratos y calorías de forma gratuita.",

        keywords: [

            "calculadora macros",
            "macronutrientes",
            "proteínas diarias",
            "carbohidratos diarios",
            "grasas diarias",
            "calcular macros",
            "macros fitness",
            "calculadora nutrición"

        ]

    },



    /* =================================================
       CONFIGURACIÓN GENERAL
    ================================================= */

    general: {

        edadMin: 15,
        edadMax: 100,

        pesoMin: 35,
        pesoMax: 250,

        alturaMin: 130,
        alturaMax: 230,

        decimales: 1,

        animacion: 600

    },



    /* =================================================
       FACTORES DE ACTIVIDAD
    ================================================= */

    actividad: {

        sedentario: 1.20,

        ligero: 1.375,

        moderado: 1.55,

        intenso: 1.725,

        atleta: 1.90

    },



    /* =================================================
       OBJETIVOS CALÓRICOS
    ================================================= */

    objetivos: {

        perder: -500,

        mantener: 0,

        ganar: 300

    },



    /* =================================================
       PROTEÍNAS (g/kg)
    ================================================= */

    proteinas: {

        perder: 2.0,

        mantener: 1.8,

        ganar: 2.0

    },



    /* =================================================
       GRASAS (g/kg)
    ================================================= */

    grasas: {

        perder: 0.8,

        mantener: 0.9,

        ganar: 1.0

    },



    /* =================================================
       VALORES ENERGÉTICOS
    ================================================= */

    calorias: {

        proteina: 4,

        carbohidrato: 4,

        grasa: 9

    }

};