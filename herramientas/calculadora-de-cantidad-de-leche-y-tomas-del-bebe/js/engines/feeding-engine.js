/** Clasifica y normaliza la entrada; no calcula cantidades ni accede al DOM. */
import { TIPOS_NACIMIENTO } from "../data/constants.js";
import { FEEDING_TYPES } from "../data/feeding-types.js";
import { completarResultado, crearResultadoVacio } from "../utils/result-contract.js";
import { validarEntrada } from "../utils/validators.js";

export function feedingEngine(entrada = {}) {
  const validacion = validarEntrada(entrada);
  if (!validacion.valido) return completarResultado(crearResultadoVacio(), { validacion: { valido: false, errores: validacion.errores } });
  const datos = validacion.datos;
  const tipo = FEEDING_TYPES[datos.alimentacion];
  return completarResultado(crearResultadoVacio(), {
    validacion: { valido: true, errores: [] },
    tipo: tipo.alcance,
    edad: datos.edad,
    peso: datos.peso,
    prematuro: datos.nacimiento === TIPOS_NACIMIENTO.PREMATURO,
    alimentacion: { tipo: datos.alimentacion, complementaria: datos.complementaria, inicioComplementariaMeses: datos.inicioComplementariaMeses },
    numeroTomas: datos.tomas
  });
}
