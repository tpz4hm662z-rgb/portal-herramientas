/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Renderizador de la Timeline Inteligente.
===================================================== */

"use strict";

const RenderizadorTimelinePosparto = (() => {
    function renderTimeline(timeline) {
        renderHitos(timeline.hitos);
        renderEtapaActual(timeline.actual);
        renderSiguienteHito(timeline.siguiente);
        document.querySelector("#timelineRecuerdaTexto").textContent = timeline.recuerda;
    }

    function renderHitos(hitos) {
        const lista = document.querySelector("#timelineHitos");
        lista.replaceChildren(...hitos.map(hito => {
            const item = elemento("li", "timeline-hito");
            item.dataset.estado = hito.estado;
            if (hito.estado === "actual") item.setAttribute("aria-current", "step");
            const cabecera = elemento("div", "timeline-hito-cabecera");
            const icono = elemento("span", "timeline-hito-icono", hito.icono);
            icono.setAttribute("aria-hidden", "true");
            cabecera.append(icono, elemento("span", "timeline-hito-estado", hito.estadoVisual));
            const cambios = elemento("ul", "timeline-cambios");
            cambios.append(...hito.cambiosHabituales.map(cambio => elemento("li", "", cambio)));
            const prioridad = elemento("div", "timeline-prioridad");
            prioridad.append(
                elemento("strong", "", `${hito.prioridadPrincipal.icono} ${hito.prioridadPrincipal.titulo}`),
                elemento("p", "", hito.prioridadPrincipal.texto)
            );
            item.append(cabecera, elemento("small", "timeline-hito-etiqueta", hito.etiqueta), elemento("h3", "", hito.titulo), elemento("p", "", hito.descripcion), cambios, prioridad);
            return item;
        }));
    }

    function renderEtapaActual(actual) {
        document.querySelector("#timelineActualTitulo").textContent = actual.titulo;
        const lista = document.querySelector("#timelineActualContenido");
        const apartados = [
            ["Cambios físicos", actual.cambiosFisicos],
            ["Cambios hormonales", actual.cambiosHormonales],
            ["Actividad", actual.actividad],
            ["Recuperación general", actual.recuperacionGeneral]
        ];
        lista.replaceChildren(...apartados.map(([titulo, texto]) => {
            const item = elemento("li");
            item.append(elemento("strong", "", titulo), elemento("p", "", texto));
            return item;
        }));
    }

    function renderSiguienteHito(siguiente) {
        const tarjeta = document.querySelector("#timelineSiguiente");
        tarjeta.hidden = !siguiente;
        if (!siguiente) return;
        document.querySelector("#timelineSiguienteIcono").textContent = siguiente.icono;
        document.querySelector("#timelineSiguienteTitulo").textContent = siguiente.titulo;
        document.querySelector("#timelineSiguienteTexto").textContent = siguiente.texto;
    }

    function elemento(etiqueta, clase = "", texto = "") {
        const nodo = document.createElement(etiqueta);
        if (clase) nodo.className = clase;
        if (texto) nodo.textContent = texto;
        return nodo;
    }

    return Object.freeze({ renderTimeline });
})();
