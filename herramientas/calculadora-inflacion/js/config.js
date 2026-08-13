(function (root, factory) {
    "use strict";
    const config = factory();
    if (typeof module === "object" && module.exports) module.exports = config;
    if (root) root.CONFIG = config;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    return Object.freeze({
        herramienta: Object.freeze({
            nombre: "Calculadora de Inflación PRO",
            versionMotor: "1.0-fase-1",
            url: "https://imoancy.com/herramientas/calculadora-inflacion/"
        }),
        matematicas: Object.freeze({
            // Umbral relativo exclusivo para clasificar resultados casi nulos.
            // No interviene en las fórmulas ni redondea resultados.
            umbralCeroRelativo: 1e-12,
            tasaInflacionMinimaExclusiva: -1
        })
    });
}));
