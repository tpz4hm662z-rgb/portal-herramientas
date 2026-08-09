/**
 * Selecciona la estructura editorial apropiada para el resultado normalizado.
 * No contiene textos: devuelve claves consumidas por content-provider y validadas
 * por las pruebas de interpretación e integración.
 */
import { TIPOS_ALIMENTACION } from "../data/constants.js";
import { completarResultado } from "../utils/result-contract.js";

const CONFIGURACION = Object.freeze({
  [TIPOS_ALIMENTACION.FORMULA]: Object.freeze({ estado: "orientacion_disponible", claveContenido: "formula", explicacion: ["intervalo_orientativo", "variacion_diaria", "alimentacion_responsiva"], limitaciones: ["sin_cifra_exacta", "sin_necesidad_individual"] }),
  [TIPOS_ALIMENTACION.MATERNA]: Object.freeze({ estado: "volumen_no_estimable", claveContenido: "materna", explicacion: ["transferencia_no_medible", "observacion_integral", "alimentacion_responsiva"], limitaciones: ["sin_transferencia_pecho", "sin_seguimiento_crecimiento"] }),
  [TIPOS_ALIMENTACION.MIXTA]: Object.freeze({ estado: "referencia_global_prudente", claveContenido: "mixta", explicacion: ["referencia_global", "transferencia_no_medible", "variacion_diaria"], limitaciones: ["sin_calculo_complemento", "sin_transferencia_pecho"] }),
  [TIPOS_ALIMENTACION.EXTRAIDA]: Object.freeze({ estado: "orientacion_disponible", claveContenido: "extraida", explicacion: ["volumen_ofrecido", "ofrecido_no_ingerido", "variacion_diaria"], limitaciones: ["sin_equivalencia_pecho", "sin_necesidad_individual"] })
});

export function interpretationEngine(resultado) {
  if (!resultado?.validacion?.valido) return completarResultado(resultado, { interpretacion: { estado: "entrada_invalida", tipo: null, nivel: "bloqueado", claveContenido: "entrada_invalida", clavesExplicacion: [], clavesLimitacion: [], requiereAviso: true, requiereTimeline: false, requiereAlertas: false, contextoComplementaria: false } });
  const configuracion = CONFIGURACION[resultado.alimentacion.tipo];
  const prematuro = resultado.prematuro;
  return completarResultado(resultado, { interpretacion: {
    estado: prematuro ? "requiere_valoracion_individual" : configuracion.estado,
    tipo: resultado.alimentacion.tipo,
    nivel: prematuro ? "consultar" : "orientativo",
    claveContenido: prematuro ? "prematuro" : configuracion.claveContenido,
    clavesExplicacion: prematuro ? ["valoracion_individual", "edad_corregida", "seguimiento_clinico"] : [...configuracion.explicacion],
    clavesLimitacion: prematuro ? ["sin_plan_neonatal", "sin_necesidad_individual"] : [...configuracion.limitaciones],
    requiereAviso: prematuro || resultado.alimentacion.tipo !== TIPOS_ALIMENTACION.FORMULA,
    requiereTimeline: true,
    requiereAlertas: true,
    contextoComplementaria: resultado.alimentacion.complementaria
  } });
}
