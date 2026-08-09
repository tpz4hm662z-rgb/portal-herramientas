/* ==========================================================
   Herramientas360
   CORE.JS
   Funciones reutilizables
   Versión 1.0
========================================================== */

"use strict";

/* ==========================================================
   SELECTORES
========================================================== */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* ==========================================================
   CONVERSIÓN DE NÚMEROS
========================================================== */

function numero(valor) {

    return Number(valor);

}


/* ==========================================================
   REDONDEAR
========================================================== */

function redondear(valor, decimales = 0) {

    return Number(valor.toFixed(decimales));

}


/* ==========================================================
   FORMATEAR NÚMEROS
========================================================== */

function formatearNumero(valor) {

    return new Intl.NumberFormat("es-ES").format(valor);

}


/* ==========================================================
   VALIDAR RANGO
========================================================== */

function dentroDeRango(valor, minimo, maximo) {

    return valor >= minimo && valor <= maximo;

}


/* ==========================================================
   MOSTRAR ELEMENTO
========================================================== */

function mostrar(elemento) {

    elemento.classList.remove("hidden");

}


/* ==========================================================
   OCULTAR ELEMENTO
========================================================== */

function ocultar(elemento) {

    elemento.classList.add("hidden");

}


/* ==========================================================
   SCROLL SUAVE
========================================================== */

function scrollHasta(elemento) {

    if (!UI.scrollResultado) return;

    elemento.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


/* ==========================================================
   ESPERA
========================================================== */

function esperar(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}


/* ==========================================================
   ANIMACIÓN DE CÁLCULO
========================================================== */

async function animacionCalculo() {

    if (!UI.mostrarAnimacion) return;

    const texto = $("#estado-calculo");

    if (!texto) return;

    texto.textContent = MENSAJES.paso1;

    await esperar(300);

    texto.textContent = MENSAJES.paso2;

    await esperar(300);

    texto.textContent = MENSAJES.paso3;

    await esperar(300);

    texto.textContent = MENSAJES.paso4;

}


/* ==========================================================
   MOSTRAR ERROR
========================================================== */

function mostrarError(mensaje) {

    alert(mensaje);

}


/* ==========================================================
   LIMPIAR RESULTADOS
========================================================== */

function limpiarResultados() {

    const resultado = $("#resultados");

    if (resultado) {

        resultado.hidden = true;

    }

}

/* ==========================================================
   REINICIAR FORMULARIO
========================================================== */

function reiniciarFormulario() {

    const formulario = $("#form-calorias");

    formulario.reset();

    limpiarResultados();

}

/* ==========================================================
   COPIAR TEXTO
========================================================== */

async function copiarTexto(texto) {

    try {

        await navigator.clipboard.writeText(texto);

        return true;

    }

    catch {

        return false;

    }

}


/* ==========================================================
   FECHA ACTUAL
========================================================== */

function obtenerAnioActual() {

    return new Date().getFullYear();

}