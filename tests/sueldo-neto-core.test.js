(function (root) {
  "use strict";
  var core = typeof module === "object" && module.exports
    ? require("../herramientas/calculadora-sueldo-neto/js/core.js")
    : root.ImoancySueldoCore;
  var passed = 0, failed = 0, results = [];
  function test(name, fn) {
    try { fn(); passed += 1; results.push({ ok: true, name: name }); }
    catch (e) { failed += 1; results.push({ ok: false, name: name, error: e.message }); }
  }
  function equal(actual, expected, message) {
    if (actual !== expected) throw new Error((message || "valores distintos") + ": esperado " + expected + ", recibido " + actual);
  }
  function close(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) > tolerance) throw new Error((message || "fuera de tolerancia") + ": esperado " + expected + ", recibido " + actual);
  }
  function base(overrides) {
    var value = {
      salarioBaseAnual: 30000, complementosSalarialesAnuales: 0,
      horasExtraOrdinariasAnuales: 0, horasExtraFuerzaMayorAnuales: 0,
      numeroPagas: 12, pagExtraProrrateada: true, grupoCotizacion: 7,
      tipoContratoCotizacion: "indefinido", tipoContratoIrpf: "general",
      anioNacimiento: 1990, situacionFamiliar: 3, discapacidad: "ninguna",
      descendientes: [], ascendientes: [], tiempoCompleto: true
    };
    Object.keys(overrides || {}).forEach(function (k) { value[k] = overrides[k]; });
    return value;
  }

  test("golden AEAT 30.000, situacion 3", function () {
    var r = core.calculate(base()); equal(r.ok, true); equal(r.irpf.baseRetencion, 26050); equal(r.irpf.tipoRetencion, 16.42); equal(r.irpf.importeAnual, 4926);
  });
  test("golden AEAT exento 15.000", function () {
    var r = core.calculate(base({ salarioBaseAnual: 15000 })); close(r.irpf.baseRetencion, 4586.97, 0.000001); equal(r.irpf.tipoRetencion, 0); equal(r.irpf.importeAnual, 0);
  });
  test("golden AEAT 60.000", function () {
    var r = core.calculate(base({ salarioBaseAnual: 60000 })); equal(r.irpf.baseRetencion, 54100); equal(r.irpf.tipoRetencion, 24.44); equal(r.irpf.importeAnual, 14664);
  });
  test("golden AEAT 90.000 con solidaridad", function () {
    var r = core.calculate(base({ salarioBaseAnual: 90000 })); close(r.seguridadSocial.cuotas.total, 4038.16, 0.01); equal(r.irpf.baseRetencion, 83961.84); equal(r.irpf.tipoRetencion, 30.69); equal(r.irpf.importeAnual, 27621);
  });
  test("golden AEAT descendiente compartido", function () {
    var r = core.calculate(base({ descendientes: [{ anioNacimiento: 2022 }] })); equal(r.irpf.tipoRetencion, 15.66); equal(r.irpf.importeAnual, 4698);
  });
  test("golden AEAT monoparental computo entero", function () {
    var r = core.calculate(base({ situacionFamiliar: 1, descendientes: [{ anioNacimiento: 2022, computoEntero: true }] })); equal(r.irpf.tipoRetencion, 14.90); equal(r.irpf.importeAnual, 4470);
  });
  test("12 y 14 pagas conservan el neto anual", function () {
    var a = core.calculate(base());
    var b = core.calculate(base({ numeroPagas: 14, pagExtraProrrateada: false }));
    close(a.resumen.netoAnual, b.resumen.netoAnual, 0.000001); equal(b.pagas.pagasExtra, 2);
    close(b.pagas.netoPagaOrdinaria * 12 + b.pagas.netoPagaExtra * 2, b.resumen.netoAnual, 0.01);
  });
  test("temporal cambia solo desempleo", function () {
    var a = core.calculate(base()), b = core.calculate(base({ tipoContratoCotizacion: "temporal" }));
    close(b.seguridadSocial.cuotas.total - a.seguridadSocial.cuotas.total, 15, 0.000001);
  });
  test("horas extra usan tipos separados", function () {
    var r = core.calculate(base({ horasExtraOrdinariasAnuales: 1000, horasExtraFuerzaMayorAnuales: 1000 }));
    equal(r.seguridadSocial.cuotas.horasExtraOrdinarias, 47); equal(r.seguridadSocial.cuotas.horasExtraFuerzaMayor, 20);
    equal(r.seguridadSocial.baseProfesionalAnual, 32000);
    close(r.seguridadSocial.cuotas.desempleo, 496, 0.000001);
    close(r.seguridadSocial.cuotas.formacionProfesional, 32, 0.000001);
  });
  test("base minima por grupo", function () {
    var r = core.calculate(base({ salarioBaseAnual: 12000, grupoCotizacion: 1 })); equal(r.seguridadSocial.baseMensual, 1989.30); equal(r.seguridadSocial.baseMinimaAplicada, true);
  });
  test("base maxima y tres tramos de solidaridad", function () {
    var r = core.calculate(base({ salarioBaseAnual: 120000 })); equal(r.seguridadSocial.baseMensual, 5101.20); equal(r.seguridadSocial.solidaridad.length, 3); equal(r.seguridadSocial.baseMaximaAplicada, true);
  });
  test("errores estructurados", function () {
    var r = core.calculate(base({ salarioBaseAnual: NaN, numeroPagas: 13, pagExtraProrrateada: false }));
    equal(r.ok, false); equal(r.errors.some(function (e) { return e.codigo === "NAN"; }), true); equal(r.errors.some(function (e) { return e.codigo === "UNSUPPORTED"; }), true);
  });
  test("rechaza parcial y conceptos excluidos", function () {
    var r = core.calculate(base({ tiempoCompleto: false, dietas: 100 })); equal(r.ok, false); equal(r.errors.filter(function (e) { return e.codigo === "UNSUPPORTED"; }).length, 2);
  });
  test("regularizacion reservada pero no calculada", function () {
    var r = core.calculate(base({ regularizacion: { causa: 1 } })); equal(r.ok, false); equal(r.errors[0].campo, "regularizacion");
  });

  var report = { passed: passed, failed: failed, results: results };
  if (typeof module === "object" && module.exports) {
    if (failed) { console.error(JSON.stringify(report, null, 2)); process.exitCode = 1; }
    else console.log("Sueldo Neto Core: " + passed + " pruebas superadas");
    module.exports = report;
  } else {
    root.ImoancySueldoTestReport = report;
    if (root.document) root.document.getElementById("test-output").textContent = JSON.stringify(report, null, 2);
  }
}(typeof globalThis !== "undefined" ? globalThis : this));
