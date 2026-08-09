import { crearElemento, vaciar } from "../utils/render-helpers.js";
export function renderRelated(relacionadas, destino) {
  vaciar(destino);
  relacionadas.forEach((item)=>{const enlace=crearElemento("a","","relacionada-tarjeta");enlace.href=item.url;enlace.append(crearElemento("span",item.icono),crearElemento("strong",item.titulo),crearElemento("small",item.descripcion));destino.append(enlace);});
  return relacionadas.length;
}
