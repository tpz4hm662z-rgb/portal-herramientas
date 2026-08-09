/** Controlador de interfaz. No contiene fórmulas, rangos ni interpretación. */
import { obtenerContenido } from "./content/content-provider.js";
import { babyFeedingEngine } from "./engines/baby-feeding-engine.js";
import { crearAlertsRenderer } from "./renderers/alerts-renderer.js";
import { crearResultRenderer } from "./renderers/result-renderer.js";
import { crearTimelineRenderer } from "./renderers/timeline-renderer.js";
import { renderFaq } from "./renderers/faq-renderer.js";
import { renderRelated } from "./renderers/related-renderer.js";
import { renderSources } from "./renderers/sources-renderer.js";
import { renderTransparency, renderTrust } from "./renderers/editorial-renderer.js";
import { mostrar, vaciar } from "./utils/render-helpers.js";
import { crearFaqSchema, serializarSchema } from "./utils/schema-builders.js";
import { crearStorageManager } from "./storage/storage-manager.js";
import { crearHistoryManager } from "./storage/history-manager.js";
import { crearHistoryRenderer, alternarResumenHistorial } from "./renderers/history-renderer.js";
import { formatearEstado, formatearRangoMl } from "./utils/formatters.js";
import { compartir } from "./services/share-service.js";
import { imprimir } from "./services/print-service.js";
import { registrarEvento } from "./services/analytics.js";
import { registrarServiceWorker } from "./services/offline.js";
import { logger } from "./utils/logger.js";

const SELECTORES_ERROR = Object.freeze({ edad: "#errorEdad", peso: "#errorPeso", nacimiento: "#errorNacimiento", alimentacion: "#errorAlimentacion", tomas: "#errorTomas", complementaria: "#errorComplementaria", inicioComplementaria: "#errorInicioComplementaria" });
const SELECTORES_CAMPO = Object.freeze({ edad: "#edad", peso: "#peso", nacimiento: '[name="nacimiento"]', alimentacion: '[name="alimentacion"]', tomas: "#tomas", complementaria: '[name="complementaria"]', inicioComplementaria: "#inicioComplementaria" });
let interfaz;

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
  interfaz = obtenerInterfaz();
  interfaz.renderResult = crearResultRenderer(interfaz.destinos);
  interfaz.renderAlerts = crearAlertsRenderer(interfaz.destinos.alertas);
  interfaz.renderTimeline = crearTimelineRenderer(interfaz.destinos.timeline);
  interfaz.storageManager = crearStorageManager({prefijo:"h360-leche-bebe"});
  interfaz.historyManager = crearHistoryManager(interfaz.storageManager);
  interfaz.historyAvailable = interfaz.historyManager.disponible();
  interfaz.renderHistory = crearHistoryRenderer(interfaz.historial.panel,{onVer:verResumenHistorial,onEliminar:eliminarRegistroHistorial});
  interfaz.botonReiniciar.classList.remove("oculto");
  interfaz.botonReiniciar.removeAttribute("hidden");
  interfaz.formulario.addEventListener("change", gestionarCambio);
  interfaz.formulario.addEventListener("input", limpiarErrorEvento);
  interfaz.formulario.addEventListener("submit", procesarFormulario);
  interfaz.formulario.addEventListener("reset", () => requestAnimationFrame(restablecerInterfaz));
  interfaz.botonImprimir.addEventListener("click", imprimirInforme);
  interfaz.botonCompartir.addEventListener("click", compartirHerramienta);
  interfaz.historial.borrar.addEventListener("click", borrarHistorialCompleto);
  document.querySelector("#peso").max = "20";
  document.querySelector("#inicioComplementaria").max = "12";
  actualizarLimiteEdad();
  renderizarContenidoEditorial();
  actualizarHistorial();
  registrarServiceWorker().then((estado)=>logger.debug(estado.ok?"Service Worker registrado":"Service Worker no disponible"));
  ocultarInforme();
}

function obtenerInterfaz() {
  return {
    formulario: document.querySelector("#formularioHerramienta"),
    boton: document.querySelector("#botonCalcular"),
    botonReiniciar: document.querySelector("#botonReiniciar"),
    estado: document.querySelector("#estadoFormulario"),
    informe: document.querySelector("#resultados"),
    tituloInforme: document.querySelector("#titulo-resultados"),
    botonImprimir: document.querySelector("#botonImprimir"),
    botonCompartir: document.querySelector("#botonCompartir"),
    estadoAcciones: document.querySelector("#estadoAcciones"),
    fechaImpresion: document.querySelector("#fechaImpresion"),
    historial: { panel: document.querySelector("#panelHistorial"), borrar: document.querySelector("#botonBorrarHistorial"), estado: document.querySelector("#estadoHistorial") },
    editorial: { metodologia: document.querySelector("#contenidoMetodologia"), confianza: document.querySelector("#contenidoConfianza"), faq: document.querySelector("#listaFaq"), fuentes: document.querySelector("#listaFuentes"), relacionadas: document.querySelector("#listaRelacionadas") },
    destinos: { principal: document.querySelector("#resultadoPrincipal"), diario: document.querySelector("#cantidadDiaria"), porToma: document.querySelector("#cantidadToma"), patron: document.querySelector("#valoracionPatron"), interpretacion: document.querySelector("#interpretacionPersonalizada"), senales: document.querySelector("#senalesBuenaAlimentacion"), alertas: document.querySelector("#senalesConsultar"), timeline: document.querySelector("#timeline") }
  };
}

function crearRegistroHistorial(resultado) {
  const rango=formatearRangoMl(resultado.rangoDiario);
  const estado=formatearEstado(resultado.interpretacion.estado);
  return {fecha:new Date().toISOString(),edad:{valor:resultado.edad.valor,unidad:resultado.edad.unidad,dias:resultado.edad.dias},peso:resultado.peso,alimentacion:resultado.alimentacion.tipo,prematuro:resultado.prematuro,complementaria:resultado.alimentacion.complementaria,resumen:rango?`${rango} al día`:estado?.titulo??"Orientación sin estimación de volumen",estado:estado?.titulo??resultado.interpretacion.estado};
}

function actualizarHistorial(registros=interfaz.historyManager.listar()) {
  interfaz.renderHistory(registros);
  interfaz.historial.borrar.disabled=registros.length===0;
  if(!interfaz.historyAvailable)interfaz.historial.estado.textContent="El almacenamiento local no está disponible; la calculadora seguirá funcionando sin historial.";
}

function verResumenHistorial(fecha){if(alternarResumenHistorial(interfaz.historial.panel,fecha))registrarEvento("view_history");}
function eliminarRegistroHistorial(fecha){const estado=interfaz.historyManager.eliminar(fecha);actualizarHistorial(estado.registros);interfaz.historial.estado.textContent=estado.eliminado?"Registro eliminado.":"No se ha podido actualizar el historial.";}
function borrarHistorialCompleto(){if(!window.confirm("¿Quieres borrar todos los informes guardados en este dispositivo?"))return;const estado=interfaz.historyManager.limpiar();actualizarHistorial(estado.registros);interfaz.historial.estado.textContent=estado.eliminado?"Historial borrado completamente.":"No se ha podido borrar el historial.";if(estado.eliminado)registrarEvento("clear_history");}

function imprimirInforme(){const ahora=new Date();interfaz.fechaImpresion.dateTime=ahora.toISOString();interfaz.fechaImpresion.textContent=`Generado el ${ahora.toLocaleString("es-ES")}`;if(imprimir()){interfaz.estadoAcciones.textContent="Vista de impresión preparada.";registrarEvento("print_report");}}
async function compartirHerramienta(){const estado=await compartir();if(estado.ok){interfaz.estadoAcciones.textContent=estado.metodo==="clipboard"?"Enlace copiado al portapapeles.":"Herramienta compartida.";registrarEvento("share_report");}else if(estado.metodo!=="cancelado")interfaz.estadoAcciones.textContent="No se ha podido compartir automáticamente. Puedes copiar la dirección del navegador.";}

function renderizarContenidoEditorial() {
  const contenido = obtenerContenido();
  renderTransparency(contenido.transparencia, interfaz.editorial.metodologia);
  renderTrust(contenido.confianza, interfaz.editorial.confianza);
  renderFaq(contenido.faq, interfaz.editorial.faq);
  renderSources(contenido.fuentes, interfaz.editorial.fuentes);
  renderRelated(contenido.relacionadas, interfaz.editorial.relacionadas);
  document.querySelector("#schemaFaq")?.remove();
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.id = "schemaFaq";
  schema.textContent = serializarSchema(crearFaqSchema(contenido.faq));
  document.head.append(schema);
}

function gestionarCambio(evento) {
  limpiarErrorEvento(evento);
  const { name, value } = evento.target;
  if (name === "nacimiento") alternarElemento("#avisoPrematuro", value === "prematuro");
  if (name === "alimentacion") mostrarRutina(value);
  if (name === "complementaria") alternarInicioComplementaria(value === "si");
  if (name === "unidadEdad") actualizarLimiteEdad();
}

function mostrarRutina(tipo) {
  const textos = { formula: "Completa la rutina habitual de alimentación con fórmula.", materna: "Completa la rutina habitual de lactancia materna.", mixta: "Completa la rutina habitual de lactancia mixta.", extraida: "Completa la rutina habitual de leche materna extraída." };
  alternarElemento("#rutinaActual", true);
  document.querySelector("#descripcionRutina").textContent = textos[tipo] ?? "";
}

function alternarInicioComplementaria(visible) {
  alternarElemento("#grupoInicioComplementaria", visible);
  if (!visible) document.querySelector("#inicioComplementaria").value = "";
}

function alternarElemento(selector, visible) { mostrar(document.querySelector(selector), visible); }

function actualizarLimiteEdad() {
  const limites = { dias: 365, semanas: 52, meses: 12 };
  document.querySelector("#edad").max = String(limites[document.querySelector("#unidadEdad").value]);
}

function numeroSeguro(valor) {
  if (valor === null || String(valor).trim() === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function radioSeleccionado(nombre) { return interfaz.formulario.elements[nombre]?.value || null; }

function recopilarDatosFormulario() {
  const alimentacion = radioSeleccionado("alimentacion");
  const complementariaValor = alimentacion ? radioSeleccionado("complementaria") : null;
  const complementaria = complementariaValor === "si" ? true : complementariaValor === "no" ? false : null;
  return {
    edad: numeroSeguro(document.querySelector("#edad").value),
    unidadEdad: document.querySelector("#unidadEdad").value || null,
    peso: numeroSeguro(document.querySelector("#peso").value),
    nacimiento: radioSeleccionado("nacimiento"),
    alimentacion,
    tomas: alimentacion ? numeroSeguro(document.querySelector("#tomas").value) : null,
    complementaria,
    inicioComplementaria: complementaria === true ? numeroSeguro(document.querySelector("#inicioComplementaria").value) : null
  };
}

function procesarFormulario(evento) {
  evento.preventDefault();
  limpiarErrores();
  establecerCarga(true);
  requestAnimationFrame(() => setTimeout(() => {
    try {
      const resultado = babyFeedingEngine(recopilarDatosFormulario());
      if (!resultado.validacion.valido) { presentarErrores(resultado.validacion.errores); return; }
      const renderizado = interfaz.renderResult(resultado);
      if (!renderizado) { ocultarInforme(); interfaz.estado.textContent = "No se ha podido mostrar el informe. Puedes revisar los datos e intentarlo de nuevo."; return; }
      interfaz.renderAlerts(resultado);
      interfaz.renderTimeline(resultado);
      if(interfaz.historyAvailable){const historial=interfaz.historyManager.agregar(crearRegistroHistorial(resultado));if(historial.guardado||historial.duplicado)actualizarHistorial(historial.registros);else{actualizarHistorial();interfaz.historial.estado.textContent="El informe se generó, pero no se pudo guardar en el historial.";}}
      registrarEvento("generate_report");
      mostrarInforme();
    } catch (error) {
      logger.error("No se pudo generar el informe.");
      ocultarInforme();
      interfaz.estado.textContent = "No se ha podido generar el informe. Revisa los datos e inténtalo de nuevo.";
    } finally { establecerCarga(false); }
  }, 0));
}

function presentarErrores(errores) {
  ocultarInforme();
  const contenido = obtenerContenido().errores;
  errores.forEach((error) => {
    const campo = document.querySelector(SELECTORES_CAMPO[error.campo]);
    const salida = document.querySelector(SELECTORES_ERROR[error.campo]);
    if (campo) campo.setAttribute("aria-invalid", "true");
    if (salida) salida.textContent = contenido[error.codigo] ?? "Revisa este campo.";
  });
  interfaz.estado.textContent = errores.length === 1 ? "Hay 1 campo que necesita revisión." : `Hay ${errores.length} campos que necesitan revisión.`;
  document.querySelector(SELECTORES_CAMPO[errores[0]?.campo])?.focus({ preventScroll: true });
}

function limpiarErrorEvento(evento) {
  const nombre = evento.target.name;
  const campoClave = nombre === "unidadEdad" ? "edad" : nombre;
  document.querySelectorAll(SELECTORES_CAMPO[campoClave] ?? "[data-campo-inexistente]").forEach((campo) => campo.removeAttribute("aria-invalid"));
  const salida = document.querySelector(SELECTORES_ERROR[campoClave]);
  if (salida) salida.textContent = "";
  interfaz.estado.textContent = "";
}

function limpiarErrores() {
  interfaz.formulario.querySelectorAll("[aria-invalid]").forEach((campo) => campo.removeAttribute("aria-invalid"));
  interfaz.formulario.querySelectorAll(".mensaje-error").forEach((error) => { error.textContent = ""; });
  interfaz.estado.textContent = "";
}

function mostrarInforme() {
  mostrar(interfaz.informe, true);
  interfaz.tituloInforme.tabIndex = -1;
  interfaz.estado.textContent = "Informe personalizado generado correctamente.";
  interfaz.tituloInforme.focus({ preventScroll: true });
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) interfaz.informe.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ocultarInforme() { mostrar(interfaz.informe, false); }

function establecerCarga(cargando) {
  interfaz.boton.disabled = cargando;
  interfaz.boton.textContent = cargando ? "Generando informe…" : "Generar informe personalizado";
  interfaz.formulario.setAttribute("aria-busy", String(cargando));
}

function restablecerInterfaz() {
  limpiarErrores();
  ["#avisoPrematuro", "#rutinaActual", "#grupoInicioComplementaria"].forEach((selector) => alternarElemento(selector, false));
  document.querySelector("#descripcionRutina").textContent = "";
  Object.values(interfaz.destinos).forEach(vaciar);
  ocultarInforme();
  establecerCarga(false);
  actualizarLimiteEdad();
  interfaz.estado.textContent = "Formulario restablecido.";
  interfaz.estadoAcciones.textContent="";
  registrarEvento("reset_form");
  document.querySelector("#edad").focus({ preventScroll: true });
}
