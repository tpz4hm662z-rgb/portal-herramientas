/* Configuración central de la herramienta · Imoancy v3.0 */
"use strict";

const CONFIG = Object.freeze({
    herramienta: Object.freeze({
        url: "https://imoancy.com/herramientas/calculadora-de-percentiles-de-peso-y-talla-infantil/"
    }),
    locale: "es-ES",
    campos: Object.freeze({
        edad: Object.freeze({ minimo: 0, maximo: 60 }),
        peso: Object.freeze({ minimo: 1, maximo: 40 }),
        talla: Object.freeze({ minimo: 30, maximo: 130 })
    }),
    limitesOms: Object.freeze({
        pesoEdad: Object.freeze({ minimo: -6, maximo: 5 }),
        tallaEdad: Object.freeze({ minimo: -6, maximo: 6 })
    })
});
