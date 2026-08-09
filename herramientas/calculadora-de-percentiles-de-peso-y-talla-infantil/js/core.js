/* Utilidades compartidas · Imoancy v3.0 */
"use strict";

function $(selector, contexto = document) {
    return contexto.querySelector(selector);
}

function convertirNumero(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === "") return null;
    const convertido = Number(String(valor).trim().replace(",", "."));
    return Number.isFinite(convertido) ? convertido : null;
}

function calcularZLms(medida, parametros) {
    const [l, m, s] = parametros;
    return Math.abs(l) < 1e-12
        ? Math.log(medida / m) / s
        : ((medida / m) ** l - 1) / (l * s);
}

// Aproximación de la CDF normal: error máximo inferior a 1,5×10⁻⁷.
function normalAcumulada(z) {
    const signo = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + signo * erf);
}

function formatoNumero(valor, decimales) {
    return new Intl.NumberFormat(CONFIG.locale, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(valor);
}

function movimientoReducido() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
