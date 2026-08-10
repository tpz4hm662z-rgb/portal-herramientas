"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de Ahorro",
        proyecto: "calculadora-ahorro",
        categoria: "Finanzas",
        autor: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-ahorro/",
        urlPortal: "https://imoancy.com/"
    },
    escenarios: Object.freeze({
        tranquilo: 0.8,
        objetivo: 1,
        acelerado: 1.2
    }),
    calculo: Object.freeze({
        periodosPorAno: 12,
        maximoMeses: 12000,
        tolerancia: 1e-10
    })
};

if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
