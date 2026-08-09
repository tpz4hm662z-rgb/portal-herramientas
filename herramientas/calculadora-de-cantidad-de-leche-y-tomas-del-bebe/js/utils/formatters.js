/** Formateadores seguros de presentación. No calculan rangos. */
import { obtenerContenido } from "../content/content-provider.js";

export function formatearNumero(valor, locale = "es-ES", opciones = {}) { return Number.isFinite(Number(valor)) ? Number(valor).toLocaleString(locale, opciones) : ""; }
export function formatearRangoMl(rango) { return rango && Number.isFinite(rango.minimo) && Number.isFinite(rango.maximo) ? `Entre ${formatearNumero(rango.minimo)} y ${formatearNumero(rango.maximo)} ml` : ""; }
export function formatearEdad(edad) {
  if (!edad || !Number.isFinite(edad.valor)) return "";
  const singular = { dias: "día", semanas: "semana", meses: "mes" };
  const plural = { dias: "días", semanas: "semanas", meses: "meses" };
  return `${formatearNumero(edad.valor)} ${edad.valor === 1 ? singular[edad.unidad] : plural[edad.unidad]}`;
}
export function formatearPeso(peso) { return Number.isFinite(peso) ? `${formatearNumero(peso, "es-ES", { maximumFractionDigits: 2 })} kg` : ""; }
export function formatearTomas(tomas) {
  if (!tomas) return "";
  if (Number.isFinite(tomas)) return `${formatearNumero(tomas)} ${tomas === 1 ? "toma" : "tomas"} al día`;
  const valor = tomas.minimo === tomas.maximo ? formatearNumero(tomas.minimo) : `${formatearNumero(tomas.minimo)}–${formatearNumero(tomas.maximo)}`;
  return `${valor} ${tomas.maximo === 1 ? "toma" : "tomas"} al día`;
}
export function formatearAlimentacion(tipo) { return obtenerContenido().alimentacion[tipo] ?? ""; }
export function formatearEstado(estado) { return obtenerContenido().estados[estado] ?? null; }
