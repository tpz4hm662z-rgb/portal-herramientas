/** Renderizador principal. Consume el contrato; no calcula ni interpreta. */
import { obtenerContenido } from "../content/content-provider.js";
import { esResultadoValido } from "../utils/result-contract.js";
import { formatearAlimentacion, formatearEdad, formatearEstado, formatearPeso, formatearRangoMl, formatearTomas } from "../utils/formatters.js";
import { crearElemento, mostrar, vaciar } from "../utils/render-helpers.js";
import { logger } from "../utils/logger.js";

function añadirLinea(lista, etiqueta, valor) {
  if (!valor) return;
  const item = crearElemento("li", "", "perfil-dato");
  item.append(crearElemento("strong", `${etiqueta}: `), document.createTextNode(valor));
  lista.append(item);
}

function renderProfile(resultado, destino) {
  vaciar(destino);
  destino.append(crearElemento("h3", "Resumen del perfil"));
  const lista = crearElemento("ul", "", "informe-perfil");
  añadirLinea(lista, "Edad", formatearEdad(resultado.edad));
  añadirLinea(lista, "Peso", formatearPeso(resultado.peso));
  añadirLinea(lista, "Alimentación", formatearAlimentacion(resultado.alimentacion.tipo));
  añadirLinea(lista, "Nacimiento", resultado.prematuro ? "Prematuro" : "A término");
  añadirLinea(lista, "Rutina", formatearTomas(resultado.numeroTomas));
  if (resultado.alimentacion.complementaria) añadirLinea(lista, "Alimentación complementaria", "Iniciada");
  destino.append(lista);
}

function renderRange(destino, titulo, rango, nota = "") {
  vaciar(destino);
  const disponible = Boolean(formatearRangoMl(rango));
  mostrar(destino, disponible);
  if (!disponible) return;
  destino.append(crearElemento("h3", titulo), crearElemento("p", formatearRangoMl(rango), "dato-destacado"));
  if (nota) destino.append(crearElemento("p", nota, "texto-ayuda"));
}

function renderPatternStatus(resultado, destino) {
  vaciar(destino);
  const estado = formatearEstado(resultado.interpretacion.estado);
  mostrar(destino, Boolean(estado));
  if (!estado) return;
  destino.className = `resultado-tarjeta estado-patron estado-${estado.variante}`;
  destino.setAttribute("aria-label", `${estado.titulo}. ${estado.texto}`);
  destino.append(crearElemento("span", estado.icono, "estado-icono"), crearElemento("h3", estado.titulo), crearElemento("p", estado.texto));
}

function renderInterpretation(resultado, destino) {
  vaciar(destino);
  const contenido = obtenerContenido();
  const introduccion = contenido.introducciones[resultado.interpretacion.claveContenido] ?? "";
  const puntos = resultado.interpretacion.clavesExplicacion.map((clave) => contenido.explicaciones[clave]).filter(Boolean);
  mostrar(destino, Boolean(introduccion));
  destino.append(crearElemento("h3", "¿Qué significa este resultado?"), crearElemento("p", `Nivel: ${resultado.interpretacion.nivel ?? "orientativo"}`, "etiqueta-nivel"), crearElemento("p", introduccion, "introduccion-informe"));
  if (puntos.length) {
    const lista = crearElemento("ul", "", "lista-informe");
    puntos.forEach((punto) => lista.append(crearElemento("li", punto)));
    destino.append(lista);
  }
  if (resultado.alimentacion.complementaria) destino.append(crearElemento("p", contenido.complementaria, "aviso-contextual"));
  const limitaciones = [...contenido.limitaciones.comunes, ...resultado.interpretacion.clavesLimitacion.map((clave) => contenido.limitaciones[clave]).filter(Boolean)];
  const bloqueLimitaciones = crearElemento("section", "", "limitaciones-informe");
  bloqueLimitaciones.append(crearElemento("h3", "Limitaciones del cálculo"));
  const listaLimitaciones = crearElemento("ul", "", "lista-informe");
  [...new Set(limitaciones)].forEach((texto) => listaLimitaciones.append(crearElemento("li", texto)));
  bloqueLimitaciones.append(listaLimitaciones);
  destino.append(bloqueLimitaciones);
}

function renderSignals(resultado, destino) {
  vaciar(destino);
  const contenido = obtenerContenido().senales;
  const disponibles = resultado.senales.map((clave) => contenido[clave]).filter(Boolean);
  mostrar(destino, disponibles.length > 0);
  if (!disponibles.length) return;
  destino.append(crearElemento("h3", "Señales de buena alimentación"));
  const grid = crearElemento("div", "", "senales-grid");
  disponibles.forEach((senal) => { const articulo = crearElemento("article", "", "senal-item"); articulo.append(crearElemento("small", senal.grupo, "senal-grupo"), crearElemento("h4", senal.titulo), crearElemento("p", senal.texto)); grid.append(articulo); });
  destino.append(grid);
}

function renderRecommendations(resultado, destino) {
  const contenido = obtenerContenido().recomendaciones;
  const disponibles = resultado.recomendaciones.map((clave) => contenido[clave]).filter(Boolean);
  if (!disponibles.length) return;
  const bloque = crearElemento("section", "", "recomendaciones-informe");
  bloque.append(crearElemento("h3", "Orientaciones generales"));
  const lista = crearElemento("ul", "", "lista-recomendaciones-informe");
  disponibles.forEach((item) => { const li = crearElemento("li"); li.append(crearElemento("strong", item.titulo), crearElemento("span", item.texto)); lista.append(li); });
  bloque.append(lista);
  destino.append(bloque);
}

export function crearResultRenderer(destinos) {
  return function renderResult(resultado) {
    if (!esResultadoValido(resultado)) { logger.error("Contrato de resultado incompleto."); return false; }
    renderProfile(resultado, destinos.principal);
    const extraida = resultado.alimentacion.tipo === "extraida";
    const mixta = resultado.alimentacion.tipo === "mixta";
    renderRange(destinos.diario, mixta ? "Referencia global orientativa" : extraida ? "Volumen diario ofrecido" : "Cantidad diaria orientativa", resultado.rangoDiario, mixta ? "No representa una cantidad de complemento recomendada." : extraida ? "Volumen ofrecido mediante recipiente; no necesariamente ingerido." : "Orientación, no una cantidad que deba terminar.");
    renderRange(destinos.porToma, extraida ? "Volumen ofrecido por toma" : "Cantidad aproximada por toma", resultado.rangoPorToma, extraida ? "No equivale automáticamente a una toma directa al pecho." : resultado.numeroTomas?.minimo === resultado.numeroTomas?.maximo ? `Estimación para ${resultado.numeroTomas.minimo} tomas.` : "");
    renderPatternStatus(resultado, destinos.patron);
    renderInterpretation(resultado, destinos.interpretacion);
    renderRecommendations(resultado, destinos.interpretacion);
    renderSignals(resultado, destinos.senales);
    return true;
  };
}
