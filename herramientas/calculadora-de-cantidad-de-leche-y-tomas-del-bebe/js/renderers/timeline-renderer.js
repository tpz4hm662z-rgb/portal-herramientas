/** Presenta el timeline editorial y destaca exclusivamente la etapa calculada. */
import { obtenerContenido } from "../content/content-provider.js";
import { crearElemento, mostrar, vaciar } from "../utils/render-helpers.js";
export function crearTimelineRenderer(destino) {
  return function renderTimeline(resultado) {
    vaciar(destino);
    const etapaActual = resultado?.timeline?.etapa;
    const etapas = obtenerContenido().timelineCompleto;
    mostrar(destino, Boolean(etapaActual && etapas.length));
    if (!etapaActual) return;
    const titulo=crearElemento("h3", "Evolución aproximada durante el primer año");titulo.id="titulo-timeline";
    destino.append(titulo, crearElemento("p", "Cada bebé sigue su propio ritmo. Esta línea temporal ofrece contexto general, no objetivos rígidos.", "texto-ayuda"));
    const lista = crearElemento("ol", "", "timeline-premium");
    etapas.forEach((etapa) => {
      const actual = etapa.etapa === etapaActual;
      const item = crearElemento("li", "", `timeline-item${actual ? " timeline-actual" : ""}`);
      if (actual) item.setAttribute("aria-current", "step");
      item.append(crearElemento("span", etapa.icono, "timeline-icono"), crearElemento("small", etapa.etiqueta, "timeline-etiqueta"), crearElemento("h4", etapa.titulo), crearElemento("p", etapa.texto));
      lista.append(item);
    });
    destino.append(lista);
  };
}
