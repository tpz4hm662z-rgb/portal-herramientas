/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Renderizador del Plan Personalizado de Recuperación.
===================================================== */

"use strict";

const RenderizadorPlanRecuperacion = (() => {
    function renderPlanRecuperacion(plan) {
        renderPrioridadAlta(plan.prioridades.alta);
        renderPrioridadMedia(plan.prioridades.media);
        renderPrioridadBaja(plan.prioridades.baja);
        renderConsejos(plan);
        renderObjetivos(plan.objetivos);
        renderConsejoPersonalizado(plan.consejo);
    }

    function renderPrioridadAlta(items) { renderPrioridades("#planPrioridadAlta", items, "alta"); }
    function renderPrioridadMedia(items) { renderPrioridades("#planPrioridadMedia", items, "media"); }
    function renderPrioridadBaja(items) { renderPrioridades("#planPrioridadBaja", items, "baja"); }

    function renderPrioridades(selector, items, nivel) {
        const seccion = document.querySelector(selector);
        seccion.hidden = items.length === 0;
        const contenedor = seccion.querySelector(".plan-prioridades-grid");
        contenedor.replaceChildren(...items.map(item => {
            const tarjeta = elemento("article", `plan-prioridad plan-prioridad-${nivel}`);
            const icono = elemento("span", "plan-prioridad-icono", item.icono);
            icono.setAttribute("aria-hidden", "true");
            tarjeta.append(icono, elemento("h4", "", item.titulo), elemento("p", "", item.explicacion), elemento("small", "", item.motivo));
            return tarjeta;
        }));
    }

    function renderConsejos(plan) {
        const contenedor = document.querySelector("#planConsejos");
        const claves = ["movimiento", "alimentacion", "descanso", "hidratacion", "bienestarEmocional", "revisiones"];
        contenedor.replaceChildren(...claves.map(clave => renderBloqueConsejo(plan[clave])));
    }

    function renderBloqueConsejo(bloque) {
        const tarjeta = elemento("article", "tarjeta plan-consejo");
        const icono = elemento("span", "plan-consejo-icono", bloque.icono);
        icono.setAttribute("aria-hidden", "true");
        const lista = elemento("ul", "plan-consejo-puntos");
        lista.append(...bloque.puntos.map(punto => elemento("li", "", punto)));
        tarjeta.append(icono, elemento("h3", "", bloque.titulo), elemento("p", "", bloque.texto), lista);
        return tarjeta;
    }

    function renderObjetivos(objetivos) {
        const lista = document.querySelector("#listaObjetivosPlan");
        lista.replaceChildren(...objetivos.map(objetivo => elemento("li", "", objetivo)));
    }

    function renderConsejoPersonalizado(consejo) {
        document.querySelector("#textoConsejoPersonalizado").textContent = consejo;
    }

    function elemento(etiqueta, clase = "", texto = "") {
        const nodo = document.createElement(etiqueta);
        if (clase) nodo.className = clase;
        if (texto) nodo.textContent = texto;
        return nodo;
    }

    return Object.freeze({ renderPlanRecuperacion, renderPrioridadAlta, renderPrioridadMedia, renderPrioridadBaja, renderObjetivos, renderConsejos });
})();
