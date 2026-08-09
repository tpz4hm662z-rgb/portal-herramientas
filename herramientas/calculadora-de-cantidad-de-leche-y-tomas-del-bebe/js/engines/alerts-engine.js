/** Clasifica alertas sin generar mensajes clínicos ni visuales. */
import { LIMITES_CANTIDAD } from "../data/feeding-ranges.js";
import { NIVELES_ALERTA } from "../data/constants.js";
import { completarResultado } from "../utils/result-contract.js";

export function clasificarNivelAlerta(indicadores = {}) {
  if (indicadores.urgente) return NIVELES_ALERTA.URGENTE;
  if (indicadores.valoracionPrioritaria) return NIVELES_ALERTA.PRIORITARIA;
  if (indicadores.consultar) return NIVELES_ALERTA.CONSULTAR;
  if (indicadores.orientacion) return NIVELES_ALERTA.ORIENTACION;
  return NIVELES_ALERTA.SIN_ALERTAS;
}

export function alertsEngine(resultado) {
  if (!resultado?.validacion?.valido) return completarResultado(resultado, { alertas: { nivel: clasificarNivelAlerta({ orientacion: true }), categorias: ["datos_invalidos"] } });
  if (resultado.prematuro) return completarResultado(resultado, { alertas: { nivel: clasificarNivelAlerta({ consultar: true }), categorias: ["prematuridad", "valoracion_individual"] } });
  if (resultado.rangoDiario?.maximo > LIMITES_CANTIDAD.MAXIMO_DIARIO_REFERENCIA) return completarResultado(resultado, { alertas: { nivel: clasificarNivelAlerta({ consultar: true }), categorias: ["rango_diario_elevado", "seguimiento"] } });
  return completarResultado(resultado, { alertas: { nivel: NIVELES_ALERTA.SIN_ALERTAS, categorias: [] } });
}
