/** Selecciona categorías y señales contextuales; los textos viven fuera del motor. */
import { NIVELES_ALERTA, TIPOS_ALIMENTACION } from "../data/constants.js";
import { completarResultado } from "../utils/result-contract.js";

export function recommendationEngine(resultado) {
  if (!resultado?.validacion?.valido) return completarResultado(resultado, { recomendaciones: ["observacion"], senales: [] });
  const recomendaciones = new Set(["alimentacion", "observacion", "seguimiento"]);
  const senales = new Set(["crecimiento", "comportamiento"]);
  if (resultado.alimentacion.tipo !== TIPOS_ALIMENTACION.MATERNA) recomendaciones.add("hidratacion");
  if (resultado.alimentacion.tipo === TIPOS_ALIMENTACION.MATERNA) senales.add("alimentacion_pecho");
  else senales.add("alimentacion_recipiente");
  senales.add("hidratacion");
  if (resultado.prematuro || [NIVELES_ALERTA.CONSULTAR, NIVELES_ALERTA.PRIORITARIA, NIVELES_ALERTA.URGENTE].includes(resultado.alertas.nivel)) recomendaciones.add("profesional_sanitario");
  return completarResultado(resultado, { recomendaciones: [...recomendaciones], senales: [...senales] });
}
