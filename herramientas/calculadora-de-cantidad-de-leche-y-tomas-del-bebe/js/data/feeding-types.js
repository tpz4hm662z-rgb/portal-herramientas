import { TIPOS_ALIMENTACION } from "./constants.js";

/** Metadatos de clasificación; no contienen cantidades. */
export const FEEDING_TYPES = Object.freeze({
  [TIPOS_ALIMENTACION.FORMULA]: Object.freeze({ cuantificable: true, alcance: "formula", permitePorToma: true }),
  [TIPOS_ALIMENTACION.MATERNA]: Object.freeze({ cuantificable: false, alcance: "toma_directa", permitePorToma: false }),
  [TIPOS_ALIMENTACION.MIXTA]: Object.freeze({ cuantificable: true, alcance: "referencia_global", permitePorToma: false }),
  [TIPOS_ALIMENTACION.EXTRAIDA]: Object.freeze({ cuantificable: true, alcance: "recipiente", permitePorToma: true })
});
