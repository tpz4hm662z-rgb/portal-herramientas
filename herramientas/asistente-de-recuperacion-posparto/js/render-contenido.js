/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Renderizador de contenidos personalizados.
   No genera textos ni accede al formulario.
===================================================== */

"use strict";

const RenderizadorContenidoPosparto = (() => {
    const CLAVES_INICIALES = Object.freeze([
        "cambiosFisicos", "abdomen", "utero", "hormonas"
    ]);
    const CLAVES_COMPLEMENTARIAS = Object.freeze([
        "sueloPelvico", "peso", "piel", "cabello", "energia", "digestivo"
    ]);

    function renderContenido(contenido) {
        renderGrupo("#contenidoPospartoInicial", CLAVES_INICIALES, contenido, {
            cambiosFisicos: renderCambiosFisicos,
            abdomen: renderAbdomen,
            utero: renderUtero,
            hormonas: renderHormonas
        });
        renderGrupo("#contenidoPospartoComplementario", CLAVES_COMPLEMENTARIAS, contenido, {
            sueloPelvico: renderSueloPelvico,
            peso: renderPeso,
            piel: renderPiel,
            cabello: renderCabello,
            energia: renderEnergia,
            digestivo: renderDigestivo
        });
    }

    function renderGrupo(selector, claves, contenido, renderizadores) {
        const contenedor = document.querySelector(selector);
        const apartados = claves
            .map(clave => contenido[clave])
            .filter(Boolean)
            .sort((a, b) => b.ordenPrioridad - a.ordenPrioridad);
        contenedor.replaceChildren(...apartados.map(apartado => (
            renderizadores[apartado.clave](apartado)
        )));
    }

    function renderCambiosFisicos(apartado) { return renderApartado(apartado); }
    function renderAbdomen(apartado) { return renderApartado(apartado); }
    function renderUtero(apartado) { return renderApartado(apartado); }
    function renderHormonas(apartado) { return renderApartado(apartado); }
    function renderSueloPelvico(apartado) { return renderApartado(apartado, true); }
    function renderPeso(apartado) { return renderApartado(apartado, true); }
    function renderPiel(apartado) { return renderApartado(apartado, true); }
    function renderCabello(apartado) { return renderApartado(apartado, true); }
    function renderEnergia(apartado) { return renderApartado(apartado, true); }
    function renderDigestivo(apartado) { return renderApartado(apartado, true); }

    function renderApartado(apartado, mostrarEvolucion = false) {
        const tarjeta = crearElemento("article", "tarjeta contenido-inteligente");
        tarjeta.id = `contenido-${apartado.clave}`;
        tarjeta.dataset.prioridad = apartado.prioridad;
        tarjeta.dataset.color = apartado.color;

        const cabecera = crearElemento("header", "contenido-inteligente-cabecera");
        const icono = crearElemento("span", "contenido-inteligente-icono", apartado.icono);
        icono.setAttribute("aria-hidden", "true");
        const titulos = crearElemento("div");
        if (mostrarEvolucion) titulos.append(
            crearElemento("span", "contenido-etiqueta-tipo", apartado.etiquetaSuperior)
        );
        titulos.append(
            crearElemento("span", "contenido-nivel", apartado.nivelInformativo),
            crearElemento("h3", "", apartado.titulo)
        );
        cabecera.append(icono, titulos);

        const lista = crearElemento("ul", "contenido-puntos");
        lista.append(...apartado.puntosClave.slice(0, 5).map(punto => crearElemento("li", "", punto)));

        const elementos = [
            cabecera,
            crearElemento("p", "contenido-resumen", apartado.resumen),
            crearElemento("p", "contenido-explicacion", apartado.explicacion),
            lista,
            crearCaja("contenido-importante", "Información importante", apartado.informacionImportante)
        ];
        if (mostrarEvolucion) elementos.push(
            crearCaja("contenido-evolucion", "Qué puedes esperar en las próximas semanas", apartado.proximasSemanas)
        );
        elementos.push(crearCaja("contenido-sabias", "¿Sabías que...?", apartado.sabiasQue));
        tarjeta.append(...elementos);
        return tarjeta;
    }

    function crearCaja(clase, titulo, texto) {
        const caja = crearElemento("aside", clase);
        caja.append(crearElemento("h4", "", titulo), crearElemento("p", "", texto));
        return caja;
    }

    function crearElemento(etiqueta, clase = "", texto = "") {
        const elemento = document.createElement(etiqueta);
        if (clase) elemento.className = clase;
        if (texto) elemento.textContent = texto;
        return elemento;
    }

    return Object.freeze({
        renderContenido, renderCambiosFisicos, renderAbdomen, renderUtero, renderHormonas,
        renderSueloPelvico, renderPeso, renderPiel, renderCabello, renderEnergia, renderDigestivo
    });
})();
