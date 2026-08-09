/** Determina solo la etapa por edad; no crea contenido ni representación visual. */
import { TIMELINE_DATA } from "../data/timeline-data.js";
import { completarResultado } from "../utils/result-contract.js";

function clasificarEtapa(dias) {
  return TIMELINE_DATA.find((tramo) => dias <= tramo.hastaDias)?.etapa ?? null;
}

export function timelineEngine(resultado) {
  const dias = resultado?.edad?.dias;
  return completarResultado(resultado, { timeline: { etapa: Number.isFinite(dias) ? clasificarEtapa(dias) : null } });
}
