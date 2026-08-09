import { crearElemento, vaciar } from "../utils/render-helpers.js";
export function renderSources(fuentes, destino) {
  vaciar(destino); const lista=crearElemento("ul","","fuentes-lista");
  fuentes.forEach((fuente)=>{const item=crearElemento("li");const enlace=crearElemento("a",fuente.nombre);enlace.href=fuente.url;enlace.target="_blank";enlace.rel="noopener noreferrer";item.append(enlace,crearElemento("span",fuente.titulo));lista.append(item);});
  destino.append(lista); return fuentes.length;
}
