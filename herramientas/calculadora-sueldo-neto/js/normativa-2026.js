(function (root, factory) {
  var value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.ImoancySueldoNormativa2026 = value;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  return Object.freeze({
    ejercicio: 2026,
    ambito: "Regimen General, trabajador por cuenta ajena a tiempo completo, territorio comun",
    seguridadSocial: Object.freeze({
      tiposTrabajador: Object.freeze({
        contingenciasComunes: 0.047,
        desempleo: Object.freeze({ indefinido: 0.0155, temporal: 0.016 }),
        formacionProfesional: 0.001,
        mei: 0.0015,
        horasExtraordinarias: Object.freeze({ ordinarias: 0.047, fuerzaMayor: 0.02 })
      }),
      basesMensuales: Object.freeze({
        minimasPorGrupo: Object.freeze({
          1: 1989.30, 2: 1649.70, 3: 1435.20, 4: 1424.40, 5: 1424.40,
          6: 1424.40, 7: 1424.40, 8: 1424.40, 9: 1424.40, 10: 1424.40, 11: 1424.40
        }),
        maxima: 5101.20
      }),
      solidaridadMensual: Object.freeze([
        Object.freeze({ desde: 5101.20, hasta: 5611.32, tipoTrabajador: 0.0019 }),
        Object.freeze({ desde: 5611.32, hasta: 7651.80, tipoTrabajador: 0.0021 }),
        Object.freeze({ desde: 7651.80, hasta: Infinity, tipoTrabajador: 0.0024 })
      ])
    }),
    irpf: Object.freeze({
      gastosGenerales: 2000,
      incrementoMovilidad: 2000,
      incrementoDiscapacidad: Object.freeze({ grado33a64: 3500, grado65: 7750 }),
      reduccionTrabajo: Object.freeze({
        limite1: 14852, limite2: 17673.52, limite3: 19747.50,
        cuantia1: 7302, pendiente1: 1.75, cuantia2: 2364.34, pendiente2: 1.14
      }),
      minimoContribuyente: Object.freeze({ general: 5550, mayor64: 1150, mayor74: 1400 }),
      minimoDescendientes: Object.freeze({ porOrden: [2400, 2700, 4000, 4500], menor3: 2800 }),
      minimoAscendientes: Object.freeze({ mayor64: 1150, mayor74: 1400 }),
      minimoDiscapacidad: Object.freeze({ grado33a64: 3000, grado65: 9000, asistencia: 3000 }),
      reduccionesAdicionales: Object.freeze({ pensionista: 600, masDeDosDescendientes: 600, desempleado: 1200 }),
      limitesExcluyentes: Object.freeze({
        1: Object.freeze([null, 17644, 18694]),
        2: Object.freeze([17197, 18130, 19262]),
        3: Object.freeze([15876, 16342, 16867])
      }),
      escala: Object.freeze([
        Object.freeze({ desde: 0, cuota: 0, tipo: 0.19 }),
        Object.freeze({ desde: 12450, cuota: 2365.50, tipo: 0.24 }),
        Object.freeze({ desde: 20200, cuota: 4225.50, tipo: 0.30 }),
        Object.freeze({ desde: 35200, cuota: 8725.50, tipo: 0.37 }),
        Object.freeze({ desde: 60000, cuota: 17901.50, tipo: 0.45 }),
        Object.freeze({ desde: 300000, cuota: 125901.50, tipo: 0.47 })
      ]),
      limiteCuotaBajasRetribuciones: Object.freeze({ hastaRetribucion: 35200, tipo: 0.43 }),
      minimoTipoContrato: Object.freeze({ general: 0, inferiorAnio: 2, especial: 15 }),
      vivienda: Object.freeze({ limiteRetribucion: 33007.20, porcentaje: 0.02 })
    }),
    redondeo: Object.freeze({
      monetarioFinal: "half-up a 2 decimales; 0,005 se redondea a 0,01",
      tipoRetencion: "truncado a 2 decimales",
      precisionIntermedia: "sin redondeo salvo cuando el algoritmo AEAT ordena REDONDEAR1"
    }),
    fuentes: Object.freeze([
      "https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/ALGORITMO_2026.pdf",
      "https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296",
      "https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/10721/10957/9932/4327?changeLanguage=es"
    ])
  });
}));
