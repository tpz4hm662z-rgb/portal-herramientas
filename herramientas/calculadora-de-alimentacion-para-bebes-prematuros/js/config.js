/* Configuración de la Calculadora de Alimentación para Bebés Prematuros PRO */
"use strict";

const CONFIG = Object.freeze({
    herramienta: {
        nombre: "Calculadora de Alimentación para Bebés Prematuros PRO",
        nombreCorto: "Alimentación prematuros",
        proyecto: "Calculadora-de-alimentacion-para-bebes-prematuros",
        categoria: "Salud infantil",
        icono: "🍼",
        version: "1.0",
        fechaActualizacion: "2 de agosto de 2026",
        fechaISO: "2026-08-02",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-de-alimentacion-para-bebes-prematuros/",
        urlPortal: "https://imoancy.com/"
    },
    comportamiento: { scrollResultados: true, scrollSuave: true },
    selectores: {
        formulario: "#formularioHerramienta",
        botonCalcular: "#botonCalcular",
        botonReiniciar: "#botonReiniciar",
        seccionResultados: "#resultados"
    },
    mensajes: { errorGeneral: "Revisa los campos marcados antes de continuar." },
    desarrollo: { debug: false }
});
