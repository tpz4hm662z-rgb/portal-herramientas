/** Presenta el nivel de alerta ya clasificado, sin reglas clínicas. */
import { obtenerContenido } from "../content/content-provider.js";
import { crearElemento, mostrar, vaciar } from "../utils/render-helpers.js";
export function crearAlertsRenderer(destino) {
  return function renderAlerts(resultado) {
    vaciar(destino);
    const contenido = obtenerContenido().alertas[resultado?.alertas?.nivel];
    const mostrarBloque = Boolean(contenido) && resultado.alertas.nivel !== "sin_alertas";
    mostrar(destino, mostrarBloque);
    if (mostrarBloque) destino.append(crearElemento("span", `${contenido.icono} ${contenido.tipo}`, "etiqueta-nivel"), crearElemento("h3", contenido.titulo), crearElemento("p", contenido.texto));
  };
}
