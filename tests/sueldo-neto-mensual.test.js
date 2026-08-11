(function (root) {
  "use strict";
  var core = typeof module === "object" && module.exports
    ? require("../herramientas/calculadora-sueldo-neto/js/core.js")
    : root.ImoancySueldoCore;
  var passed = 0, failed = 0, results = [];
  function test(name, fn) { try { fn(); passed += 1; results.push({ ok: true, name: name }); } catch (e) { failed += 1; results.push({ ok: false, name: name, error: e.message }); } }
  function equal(a, b, message) { if (a !== b) throw new Error((message || "distinto") + ": esperado " + b + ", recibido " + a); }
  function close(a, b, tolerance, message) { if (Math.abs(a - b) > tolerance) throw new Error((message || "fuera de tolerancia") + ": esperado " + b + ", recibido " + a); }
  function valid(overrides) {
    var input = { remuneracionOrdinariaMes: 2500, prorrataPagasExtraMes: 0, complementosSalarialesMes: 0, horasExtraOrdinariasMes: 0, horasExtraFuerzaMayorMes: 0, numeroPagas: 12, grupoCotizacion: 7, tipoContratoCotizacion: "indefinido", tiempoCompleto: true };
    Object.keys(overrides || {}).forEach(function (key) { input[key] = overrides[key]; }); return input;
  }
  function calc(overrides) { return core.calculateMonthlyContribution(valid(overrides)); }
  function totalOfComponents(r) { return r.cuotas.contingenciasComunes + r.cuotas.desempleo + r.cuotas.formacionProfesional + r.cuotas.mei + r.cuotas.solidaridad + r.cuotas.horasExtraOrdinarias + r.cuotas.horasExtraFuerzaMayor; }

  test("funcion mensual publica", function () { equal(typeof core.calculateMonthlyContribution, "function"); });
  test("mes sin variables", function () { var r = calc(); equal(r.ok, true); equal(r.base.aplicada, 2500); equal(r.cuotas.solidaridad, 0); equal(r.cuotas.horasExtraOrdinarias, 0); });
  test("complemento se aplica al mismo mes", function () { var r = calc({ complementosSalarialesMes: 500 }); equal(r.base.antesDeLimites, 3000); equal(r.remuneracion.brutoCobradoMes, 3000); });
  test("varios complementos llegan agregados", function () { var r = calc({ complementosSalarialesMes: 750 }); equal(r.base.antesDeLimites, 3250); });
  test("14 pagas incorpora prorrata solo en base", function () { var r = calc({ remuneracionOrdinariaMes: 2000, numeroPagas: 14, prorrataPagasExtraMes: 333.33 }); equal(r.base.antesDeLimites, 2333.33); equal(r.remuneracion.brutoCobradoMes, 2000); });
  test("12 pagas rechaza doble prorrata", function () { var r = calc({ prorrataPagasExtraMes: 100 }); equal(r.ok, false); equal(r.errors[0].codigo, "INCOHERENT"); });
  test("14 pagas exige prorrata", function () { var r = calc({ numeroPagas: 14, prorrataPagasExtraMes: 0 }); equal(r.ok, false); });
  test("bajo base minima", function () { var r = calc({ remuneracionOrdinariaMes: 1000 }); equal(r.base.aplicada, 1424.40); equal(r.base.minimaAplicada, true); });
  test("exactamente base minima", function () { var r = calc({ remuneracionOrdinariaMes: 1424.40 }); equal(r.base.aplicada, 1424.40); equal(r.base.minimaAplicada, false); });
  test("sobre base minima", function () { var r = calc({ remuneracionOrdinariaMes: 1424.41 }); equal(r.base.aplicada, 1424.41); });
  test("grupo 1 usa su minimo", function () { var r = calc({ remuneracionOrdinariaMes: 1500, grupoCotizacion: 1 }); equal(r.base.aplicada, 1989.30); });
  test("centimo bajo base maxima", function () { var r = calc({ remuneracionOrdinariaMes: 5101.19 }); equal(r.base.aplicada, 5101.19); equal(r.cuotas.solidaridad, 0); });
  test("exactamente base maxima", function () { var r = calc({ remuneracionOrdinariaMes: 5101.20 }); equal(r.base.aplicada, 5101.20); equal(r.cuotas.solidaridad, 0); });
  test("centimo sobre base maxima", function () { var r = calc({ remuneracionOrdinariaMes: 5101.21 }); equal(r.base.aplicada, 5101.20); close(r.cuotas.solidaridad, 0.01 * 0.0019, 1e-12); });
  test("claramente sobre base maxima", function () { var r = calc({ remuneracionOrdinariaMes: 8000 }); equal(r.base.aplicada, 5101.20); equal(r.base.maximaAplicada, true); close(r.solidaridad.tramos[2].base, 348.20, 1e-9); });
  [[5611.31, 510.11, 0, 0], [5611.32, 510.12, 0, 0], [5611.33, 510.12, 0.01, 0], [7651.79, 510.12, 2040.47, 0], [7651.80, 510.12, 2040.48, 0], [7651.81, 510.12, 2040.48, 0.01]].forEach(function (item) {
    test("frontera solidaridad " + item[0].toFixed(2), function () {
      var r = calc({ remuneracionOrdinariaMes: item[0] }); equal(r.ok, true); equal(r.solidaridad.tramos.length, 3);
      close(r.solidaridad.tramos[0].base, item[1], 1e-9); close(r.solidaridad.tramos[1].base, item[2], 1e-9); close(r.solidaridad.tramos[2].base, item[3], 1e-9);
      equal(r.solidaridad.tramos.every(function (tier) { return tier.base >= 0 && tier.cuota >= 0; }), true);
    });
  });
  test("solo tramo 1", function () { var r = calc({ remuneracionOrdinariaMes: 5400 }); close(r.solidaridad.tramos[0].base, 298.80, 1e-9); equal(r.solidaridad.tramos[1].base, 0); });
  test("tramos 1 y 2", function () { var r = calc({ remuneracionOrdinariaMes: 7000 }); close(r.solidaridad.tramos[0].base, 510.12, 1e-9); close(r.solidaridad.tramos[1].base, 1388.68, 1e-9); equal(r.solidaridad.tramos[2].base, 0); });
  test("los tres tramos", function () { var r = calc({ remuneracionOrdinariaMes: 10000 }); equal(r.solidaridad.tramos[2].base, 2348.20); });
  test("horas extra ordinarias", function () { var r = calc({ horasExtraOrdinariasMes: 200 }); equal(r.cuotas.horasExtraOrdinarias, 9.4); equal(r.base.antesDeLimites, 2500); equal(r.base.profesionalAplicada, 2700); equal(r.cuotas.desempleo, 41.85); equal(r.cuotas.formacionProfesional, 2.7); equal(r.cuotas.contingenciasComunes, 117.5); equal(r.cuotas.mei, 3.75); });
  test("horas extra fuerza mayor", function () { var r = calc({ horasExtraFuerzaMayorMes: 200 }); equal(r.cuotas.horasExtraFuerzaMayor, 4); equal(r.base.antesDeLimites, 2500); equal(r.base.profesionalAplicada, 2700); equal(r.cuotas.desempleo, 41.85); equal(r.cuotas.formacionProfesional, 2.7); });
  test("ambas horas extra", function () { var r = calc({ horasExtraOrdinariasMes: 100, horasExtraFuerzaMayorMes: 100 }); equal(r.cuotas.horasExtraOrdinarias, 4.7); equal(r.cuotas.horasExtraFuerzaMayor, 2); });
  test("horas extra elevadas finitas", function () { var r = calc({ horasExtraOrdinariasMes: 1000000000, horasExtraFuerzaMayorMes: 1000000000 }); equal(Number.isFinite(r.cuotas.total), true); });
  test("contrato temporal cambia desempleo", function () { var a = calc(), b = calc({ tipoContratoCotizacion: "temporal" }); close(b.cuotas.desempleo - a.cuotas.desempleo, 1.25, 1e-12); });
  test("MEI separado", function () { var r = calc(); equal(r.cuotas.mei, 3.75); });
  test("total es suma exacta", function () { var r = calc({ remuneracionOrdinariaMes: 9000, horasExtraOrdinariasMes: 123, horasExtraFuerzaMayorMes: 45 }); equal(r.cuotas.total, totalOfComponents(r)); });
  test("prueba diferencial 1200 en un mes vs 100 por mes", function () {
    var baseline = calc({ remuneracionOrdinariaMes: 4500 });
    var concentrated = calc({ remuneracionOrdinariaMes: 4500, complementosSalarialesMes: 1200 });
    var distributed = calc({ remuneracionOrdinariaMes: 4500, complementosSalarialesMes: 100 });
    var annualConcentrated = concentrated.cuotas.total + baseline.cuotas.total * 11;
    var annualDistributed = distributed.cuotas.total * 12;
    equal(concentrated.cuotas.solidaridad > 0, true); equal(distributed.cuotas.solidaridad, 0); equal(annualConcentrated === annualDistributed, false);
  });
  test("aumentar complemento no reduce bruto", function () { var a = calc({ complementosSalarialesMes: 1 }), b = calc({ complementosSalarialesMes: 2 }); equal(b.remuneracion.brutoCobradoMes >= a.remuneracion.brutoCobradoMes, true); });
  test("cero permitido en variables", function () { equal(calc({ complementosSalarialesMes: 0 }).ok, true); });
  test("remuneracion ordinaria cero rechazada", function () { var r = calc({ remuneracionOrdinariaMes: 0 }); equal(r.ok, false); equal(r.errors.some(function (e) { return e.codigo === "ZERO"; }), true); });
  test("menos cero se normaliza", function () { var r = calc({ complementosSalarialesMes: -0, horasExtraOrdinariasMes: -0 }); equal(Object.is(r.entradaNormalizada.complementosSalarialesMes, -0), false); equal(Object.is(r.cuotas.horasExtraOrdinarias, -0), false); });
  test("negativo rechazado", function () { equal(calc({ complementosSalarialesMes: -1 }).ok, false); });
  test("NaN rechazado", function () { var r = calc({ complementosSalarialesMes: NaN }); equal(r.ok, false); equal(r.errors[0].codigo, "NAN"); });
  test("Infinity rechazado", function () { var r = calc({ complementosSalarialesMes: Infinity }); equal(r.ok, false); equal(r.errors[0].codigo, "INFINITE"); });
  test("desbordamiento extremo rechazado", function () { var r = calc({ remuneracionOrdinariaMes: Number.MAX_VALUE, complementosSalarialesMes: Number.MAX_VALUE }); equal(r.ok, false); equal(r.errors[0].codigo, "OUT_OF_RANGE"); });
  test("grupo invalido", function () { equal(calc({ grupoCotizacion: 12 }).ok, false); });
  test("contrato invalido", function () { equal(calc({ tipoContratoCotizacion: "becario" }).ok, false); });
  test("TIN no contamina el dominio", function () { var r = core.calculateMonthlyContribution(Object.assign(valid(), { tin: 3 })); equal(r.ok, false); equal(r.errors[0].codigo, "UNSUPPORTED"); });
  test("no acepta campos anuales y evita doble contabilizacion", function () { var r = core.calculateMonthlyContribution(Object.assign(valid(), { complementosSalarialesAnuales: 1200 })); equal(r.ok, false); });
  test("no muta inputs", function () { var input = valid({ complementosSalarialesMes: 300 }), before = JSON.stringify(input); core.calculateMonthlyContribution(input); equal(JSON.stringify(input), before); });
  test("resultados siempre finitos y no negativos", function () { var r = calc({ remuneracionOrdinariaMes: 1e12, horasExtraOrdinariasMes: 1e10 }); Object.keys(r.cuotas).forEach(function (key) { equal(Number.isFinite(r.cuotas[key]) && r.cuotas[key] >= 0, true, key); }); });

  var report = { passed: passed, failed: failed, results: results };
  if (typeof module === "object" && module.exports) {
    if (failed) { console.error(JSON.stringify(report, null, 2)); process.exitCode = 1; } else console.log("Sueldo Neto mensual: " + passed + " pruebas superadas"); module.exports = report;
  } else { root.ImoancySueldoMensualTestReport = report; if (root.document) root.document.getElementById("monthly-test-output").textContent = JSON.stringify(report, null, 2); }
}(typeof globalThis !== "undefined" ? globalThis : this));
