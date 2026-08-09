/** Orquestador puro del pipeline. Entrada: formulario serializado. Salida: contrato completo. No conoce el DOM. */
import { feedingEngine } from "./feeding-engine.js";
import { calculationEngine } from "./calculation-engine.js";
import { interpretationEngine } from "./interpretation-engine.js";
import { alertsEngine } from "./alerts-engine.js";
import { recommendationEngine } from "./recommendation-engine.js";
import { timelineEngine } from "./timeline-engine.js";

export function babyFeedingEngine(entrada = {}) {
  let resultado = feedingEngine(entrada);
  resultado = calculationEngine(resultado);
  resultado = interpretationEngine(resultado);
  resultado = alertsEngine(resultado);
  resultado = recommendationEngine(resultado);
  return timelineEngine(resultado);
}
