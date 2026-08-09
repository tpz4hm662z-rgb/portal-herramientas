/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Renderizador de señales de alerta y consulta.
===================================================== */

"use strict";

const RenderizadorAlertasPosparto = (() => {
    function renderAlertas(alertas) {
        renderNivel("#alertasHabituales", alertas.habituales);
        renderNivel("#alertasConsultar", alertas.consultar);
        renderUrgencias(alertas.urgentes);
        document.querySelector("#alertasPedirAyudaTexto").textContent = alertas.pedirAyuda;
        document.querySelector("#alertasRecuerdaTexto").textContent = alertas.recuerda;
    }

    function renderNivel(selector, items) {
        const lista = document.querySelector(selector);
        lista.replaceChildren(...items.map(item => {
            const elementoLista = elemento("li", "alerta-item");
            const icono = elemento("span", "alerta-item-icono", item.icono);
            icono.setAttribute("aria-hidden", "true");
            const texto = elemento("div");
            texto.append(elemento("h4", "", item.titulo), elemento("p", "", item.texto));
            elementoLista.append(icono, texto);
            return elementoLista;
        }));
    }

    function renderUrgencias(items) {
        const lista = document.querySelector("#alertasUrgentes");
        lista.replaceChildren(...items.map(item => elemento("li", "", item)));
    }

    function elemento(etiqueta, clase = "", texto = "") {
        const nodo = document.createElement(etiqueta);
        if (clase) nodo.className = clase;
        if (texto) nodo.textContent = texto;
        return nodo;
    }

    return Object.freeze({ renderAlertas });
})();
