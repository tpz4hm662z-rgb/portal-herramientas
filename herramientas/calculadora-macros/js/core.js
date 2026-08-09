/* ==========================================================
   Imoancy
   CORE.JS
   Funciones reutilizables
   Versión 3.0
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

    elemento.hidden = false;

}


/* ==========================================================
   OCULTAR ELEMENTO
========================================================== */

function ocultar(elemento) {

    elemento.hidden = true;

}


/* ==========================================================
   TOGGLE ELEMENTO
========================================================== */

function alternar(elemento) {

    elemento.hidden = !elemento.hidden;

}


/* ==========================================================
   SCROLL SUAVE
========================================================== */

function scrollA(elemento) {

    elemento.scrollIntoView({

        behavior: "smooth",
        block: "start"

    });

}


/* ==========================================================
   ANIMACIÓN FADE
========================================================== */

function aparecer(elemento) {

    elemento.animate([

        {

            opacity: 0,
            transform: "translateY(20px)"

        },

        {

            opacity: 1,
            transform: "translateY(0)"

        }

    ], {

        duration: CONFIG.general.animacion,
        easing: "ease"

    });

}


/* ==========================================================
   LIMPIAR FORMULARIO
========================================================== */

function limpiarFormulario(formulario) {

    formulario.reset();

}


/* ==========================================================
   OBTENER VALOR
========================================================== */

function obtenerValor(id) {

    return numero($("#" + id).value);

}


/* ==========================================================
   OBTENER TEXTO
========================================================== */

function obtenerTexto(id) {

    return $("#" + id).value;

}


/* ==========================================================
   ASIGNAR TEXTO
========================================================== */

function asignarTexto(id, texto) {

    $("#" + id).textContent = texto;

}


/* ==========================================================
   ASIGNAR HTML
========================================================== */

function asignarHTML(id, html) {

    $("#" + id).innerHTML = html;

}


/* ==========================================================
   ASIGNAR VALOR
========================================================== */

function asignarValor(id, valor) {

    $("#" + id).value = valor;

}


/* ==========================================================
   PORCENTAJE
========================================================== */

function porcentaje(valor, total) {

    if (total === 0) return 0;

    return (valor / total) * 100;

}


/* ==========================================================
   ESPERAR
========================================================== */

function esperar(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}