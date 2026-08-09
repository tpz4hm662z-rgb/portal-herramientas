/* Configuración de identidad y comportamiento compartido. */
"use strict";
const CONFIG = Object.freeze({
  herramienta: Object.freeze({ nombre: "Calculadora de Cantidad de Leche y Tomas del Bebé PRO", nombreCorto: "Leche y tomas del bebé", proyecto: "calculadora-cantidad-leche-tomas-bebe", categoria: "Salud y familia", icono: "🍼", version: "1.0", fechaActualizacion: "4 de agosto de 2026", fechaISO: "2026-08-04", marca: "Imoancy", url: "https://imoancy.com/herramientas/calculadora-de-cantidad-de-leche-y-tomas-del-bebe/", urlPortal: "https://imoancy.com/" }),
  comportamiento: Object.freeze({ scrollSuave: true }),
  campos: Object.freeze({}),
  mensajes: Object.freeze({ errorGeneral: "Revisa los campos señalados antes de continuar." }),
  selectores: Object.freeze({ formulario: "#formularioHerramienta", botonCalcular: "#botonCalcular", botonReiniciar: "#botonReiniciar", seccionResultados: "#resultados" }),
  accesibilidad: Object.freeze({ enfocarPrimerError: true }),
  desarrollo: Object.freeze({ debug: false })
});
