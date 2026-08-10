"use strict";

const CONFIG = {
    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-interes-compuesto-avanzada/"
    },
    calculo: {
        mesesPorAno: 12,
        maximoAnos: 100,
        maximoImporte: 1e12,
        rentabilidadMinima: -0.99,
        rentabilidadMaxima: 10,
        inflacionMinima: -0.99,
        inflacionMaxima: 10,
        costesMaximos: 0.99,
        tolerancia: 1e-8
    },
    escenarios: {
        deltaRentabilidad: 0.02
    }
};

if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
