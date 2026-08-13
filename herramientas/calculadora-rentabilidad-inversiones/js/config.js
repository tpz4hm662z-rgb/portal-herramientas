(function (root, factory) {
    "use strict";
    const config = factory();
    if (typeof module === "object" && module.exports) module.exports = config;
    if (root) root.CONFIG = config;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    return Object.freeze({
        herramienta: Object.freeze({
            nombre: "Rentabilidad de Inversiones PRO",
            versionMotor: "1.0-fase-1",
            url: "https://imoancy.com/herramientas/calculadora-rentabilidad-inversiones/"
        }),
        matematicas: Object.freeze({
            // Convencion Excel XIRR/XNPV: ano financiero fijo de 365 dias.
            diasPorAno: 365,
            milisegundosPorDia: 86400000,
            toleranciaXirrValor: 1e-10,
            toleranciaXirrTasa: 1e-16,
            toleranciaDeduplicacionRaices: 1e-5,
            iteracionesNewtonMaximas: 50,
            semillasNewton: Object.freeze([0.1, 0, -0.5, 1, 10, 100]),
            iteracionesBiseccionMaximas: 200,
            // 65.536 muestras distinguen, dentro del rango completo, raíces
            // anuales conocidas separadas por un punto porcentual (10 %/11 %).
            muestrasBusquedaXirr: 65536,
            tasaXirrMinima: -0.999999999999,
            tasaXirrMaxima: 1000000,
            umbralCeroRelativo: 1e-12,
            umbralPeriodoMuyCortoDias: 30
        })
    });
}));
