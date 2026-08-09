/**
 * Rangos orientativos para bebés nacidos a término y sanos.
 * Los motores seleccionan estos datos, pero nunca contienen cifras clínicas.
 * Las cantidades son intervalos deliberados y se expresan en ml.
 */
export const FEEDING_RANGES = Object.freeze([
  Object.freeze({ id: "primeros-dias", desdeDias: 0, hastaDias: 6, metodo: "por_toma", porToma: Object.freeze({ minimo: 30, maximo: 60 }), tomas: Object.freeze({ minimo: 8, maximo: 12 }), fuente: "AAP_CDC_PRIMEROS_DIAS" }),
  Object.freeze({ id: "primera-semana-a-seis-meses", desdeDias: 7, hastaDias: 179, metodo: "por_peso", mlKgDia: Object.freeze({ minimo: 150, maximo: 200 }), tomas: Object.freeze({ minimo: 6, maximo: 8 }), fuente: "NHS_150_200_ML_KG" }),
  Object.freeze({ id: "alrededor-seis-meses", desdeDias: 180, hastaDias: 209, metodo: "diario", diario: Object.freeze({ minimo: 840, maximo: 960 }), tomas: Object.freeze({ minimo: 3, maximo: 5 }), fuente: "NHS_ALREDEDOR_6_MESES" }),
  Object.freeze({ id: "siete-a-nueve-meses", desdeDias: 210, hastaDias: 299, metodo: "diario", diario: Object.freeze({ minimo: 500, maximo: 700 }), tomas: Object.freeze({ minimo: 3, maximo: 5 }), fuente: "NHS_7_9_MESES" }),
  Object.freeze({ id: "diez-a-doce-meses", desdeDias: 300, hastaDias: 365, metodo: "diario", diario: Object.freeze({ minimo: 350, maximo: 500 }), tomas: Object.freeze({ minimo: 2, maximo: 4 }), fuente: "NHS_10_12_MESES" })
]);

export const LIMITES_CANTIDAD = Object.freeze({ MAXIMO_DIARIO_REFERENCIA: 960 });
