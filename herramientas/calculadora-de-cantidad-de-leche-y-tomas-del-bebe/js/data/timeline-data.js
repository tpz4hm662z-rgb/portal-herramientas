import { ETAPAS_EDAD } from "./constants.js";

/** Límites de etapas consumidos por timeline-engine; todavía sin contenido editorial. */
export const TIMELINE_DATA = Object.freeze([
  Object.freeze({ hastaDias: 6, etapa: ETAPAS_EDAD.RECIEN_NACIDO }),
  Object.freeze({ hastaDias: 29, etapa: ETAPAS_EDAD.PRIMER_MES }),
  Object.freeze({ hastaDias: 89, etapa: ETAPAS_EDAD.UNO_TRES_MESES }),
  Object.freeze({ hastaDias: 179, etapa: ETAPAS_EDAD.TRES_SEIS_MESES }),
  Object.freeze({ hastaDias: 269, etapa: ETAPAS_EDAD.SEIS_NUEVE_MESES }),
  Object.freeze({ hastaDias: 364, etapa: ETAPAS_EDAD.NUEVE_DOCE_MESES }),
  Object.freeze({ hastaDias: 365, etapa: ETAPAS_EDAD.DOCE_MESES })
]);
