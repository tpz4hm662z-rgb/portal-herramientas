import { LIMITES_INTERFAZ, TIPOS_ALIMENTACION, TIPOS_NACIMIENTO, UNIDADES_EDAD } from "../data/constants.js";

export function tieneValor(valor) { return valor !== null && valor !== undefined && String(valor).trim() !== ""; }
export function esNumeroFinito(valor) { return tieneValor(valor) && Number.isFinite(Number(valor)); }
export function convertirEdadADias(valor, unidad) {
  if (!esNumeroFinito(valor) || Number(valor) < 0) return null;
  const factores = { [UNIDADES_EDAD.DIAS]: 1, [UNIDADES_EDAD.SEMANAS]: 7, [UNIDADES_EDAD.MESES]: 365 / 12 };
  return factores[unidad] ? Math.round(Number(valor) * factores[unidad]) : null;
}

export function validarEntrada(entrada = {}) {
  const errores = [];
  const edadDias = convertirEdadADias(entrada.edad, entrada.unidadEdad);
  const peso = Number(entrada.peso);
  const tomas = tieneValor(entrada.tomas) ? Number(entrada.tomas) : null;
  const alimentaciones = Object.values(TIPOS_ALIMENTACION);
  const nacimientos = Object.values(TIPOS_NACIMIENTO);

  if (edadDias === null) errores.push({ campo: "edad", codigo: "EDAD_INVALIDA" });
  else if (edadDias < LIMITES_INTERFAZ.EDAD_MINIMA_DIAS || edadDias > LIMITES_INTERFAZ.EDAD_MAXIMA_DIAS) errores.push({ campo: "edad", codigo: "EDAD_FUERA_RANGO" });
  if (!esNumeroFinito(entrada.peso) || peso <= 0) errores.push({ campo: "peso", codigo: "PESO_INVALIDO" });
  else if (peso < LIMITES_INTERFAZ.PESO_MINIMO || peso > LIMITES_INTERFAZ.PESO_MAXIMO) errores.push({ campo: "peso", codigo: "PESO_FUERA_RANGO" });
  if (!alimentaciones.includes(entrada.alimentacion)) errores.push({ campo: "alimentacion", codigo: "ALIMENTACION_INVALIDA" });
  if (!nacimientos.includes(entrada.nacimiento)) errores.push({ campo: "nacimiento", codigo: "NACIMIENTO_INVALIDO" });
  if (alimentaciones.includes(entrada.alimentacion) && (tomas === null || !Number.isInteger(tomas) || tomas < LIMITES_INTERFAZ.TOMAS_MINIMAS || tomas > LIMITES_INTERFAZ.TOMAS_MAXIMAS)) errores.push({ campo: "tomas", codigo: "TOMAS_INVALIDAS" });
  if (!["si", "no", true, false].includes(entrada.complementaria)) errores.push({ campo: "complementaria", codigo: "COMPLEMENTARIA_INVALIDA" });

  const complementaria = entrada.complementaria === "si" || entrada.complementaria === true;
  const inicio = complementaria && tieneValor(entrada.inicioComplementaria) ? Number(entrada.inicioComplementaria) : null;
  if (complementaria && (inicio === null || !Number.isFinite(inicio) || inicio <= 0 || inicio > 12)) errores.push({ campo: "inicioComplementaria", codigo: "INICIO_COMPLEMENTARIA_INVALIDO" });
  else if (complementaria && edadDias !== null && convertirEdadADias(inicio, UNIDADES_EDAD.MESES) > edadDias) errores.push({ campo: "inicioComplementaria", codigo: "INICIO_COMPLEMENTARIA_POSTERIOR" });

  return { valido: errores.length === 0, errores, datos: { edad: { valor: Number(entrada.edad), unidad: entrada.unidadEdad, dias: edadDias }, peso, nacimiento: entrada.nacimiento, alimentacion: entrada.alimentacion, tomas, complementaria, inicioComplementariaMeses: inicio } };
}
