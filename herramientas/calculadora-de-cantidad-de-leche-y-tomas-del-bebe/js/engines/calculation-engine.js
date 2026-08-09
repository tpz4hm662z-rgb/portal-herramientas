/** Calcula intervalos usando exclusivamente feeding-ranges.js; no interpreta ni renderiza. */
import { FEEDING_RANGES } from "../data/feeding-ranges.js";
import { TIPOS_ALIMENTACION } from "../data/constants.js";
import { completarResultado } from "../utils/result-contract.js";

function buscarRango(edadDias) { return FEEDING_RANGES.find((rango) => edadDias >= rango.desdeDias && edadDias <= rango.hastaDias) ?? null; }
function intervalo(minimo, maximo, unidad = "ml") { return { minimo: Math.round(minimo), maximo: Math.round(maximo), unidad }; }

function calcularDiario(rango, peso) {
  if (rango.metodo === "por_peso") return intervalo(peso * rango.mlKgDia.minimo, peso * rango.mlKgDia.maximo);
  if (rango.metodo === "por_toma") return intervalo(rango.porToma.minimo * rango.tomas.minimo, rango.porToma.maximo * rango.tomas.maximo);
  return intervalo(rango.diario.minimo, rango.diario.maximo);
}

function calcularPorToma(rangoDiario, rango, tomasUsuario) {
  if (rango.porToma) return intervalo(rango.porToma.minimo, rango.porToma.maximo);
  const divisorMinimo = tomasUsuario ?? rango.tomas.maximo;
  const divisorMaximo = tomasUsuario ?? rango.tomas.minimo;
  return intervalo(rangoDiario.minimo / divisorMinimo, rangoDiario.maximo / divisorMaximo);
}

export function calculationEngine(resultado) {
  if (!resultado?.validacion?.valido) return completarResultado(resultado);
  if (resultado.prematuro) return completarResultado(resultado, { tipo: "prematuro_valoracion_individual", rangoDiario: null, rangoPorToma: null });
  if (resultado.alimentacion.tipo === TIPOS_ALIMENTACION.MATERNA) return completarResultado(resultado, { tipo: "volumen_toma_directa_no_estimable", rangoDiario: null, rangoPorToma: null });

  const rango = buscarRango(resultado.edad.dias);
  if (!rango) return completarResultado(resultado, { validacion: { valido: false, errores: [{ campo: "edad", codigo: "SIN_RANGO_DISPONIBLE" }] } });
  const rangoDiario = calcularDiario(rango, resultado.peso);
  const permitePorToma = [TIPOS_ALIMENTACION.FORMULA, TIPOS_ALIMENTACION.EXTRAIDA].includes(resultado.alimentacion.tipo);
  const tipo = resultado.alimentacion.tipo === TIPOS_ALIMENTACION.MIXTA ? "referencia_global_mixta" : resultado.tipo;

  return completarResultado(resultado, {
    tipo,
    numeroTomas: resultado.numeroTomas ? intervalo(resultado.numeroTomas, resultado.numeroTomas, "tomas/día") : intervalo(rango.tomas.minimo, rango.tomas.maximo, "tomas/día"),
    rangoDiario: { ...rangoDiario, alcance: resultado.alimentacion.tipo === TIPOS_ALIMENTACION.EXTRAIDA ? "ofrecido_en_recipiente" : tipo, fuente: rango.fuente },
    rangoPorToma: permitePorToma ? { ...calcularPorToma(rangoDiario, rango, resultado.numeroTomas), alcance: resultado.alimentacion.tipo === TIPOS_ALIMENTACION.EXTRAIDA ? "ofrecido_en_recipiente" : "orientativo", fuente: rango.fuente } : null
  });
}
