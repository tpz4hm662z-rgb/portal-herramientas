(function (root, factory) {
    "use strict";
    const config = factory();
    if (typeof module === "object" && module.exports) module.exports = config;
    if (root) root.CONFIG = config;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    return Object.freeze({
        herramienta: Object.freeze({
            nombre: "Calculadora FIRE PRO",
            version: "1.0",
            url: "https://imoancy.com/herramientas/calculadora-fire/"
        }),
        dominio: Object.freeze({
            tasaRetiradaPredeterminada: 0.04,
            inflacionAnualPredeterminada: 0,
            horizonteMaximoMeses: 1200,
            horizontePredeterminadoMeses: 1200,
            momentoAportacionPredeterminado: "final"
        })
    });
}));
