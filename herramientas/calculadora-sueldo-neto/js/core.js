(function (root, factory) {
  var normativa = typeof module === "object" && module.exports
    ? require("./normativa-2026.js") : root.ImoancySueldoNormativa2026;
  var api = factory(normativa);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ImoancySueldoCore = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (N) {
  "use strict";

  function error(codigo, campo, mensaje, valor) {
    return { codigo: codigo, campo: campo, mensaje: mensaje, valor: valor };
  }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function trunc2(n) { return Math.trunc(n * 100 + (n >= 0 ? 1e-9 : -1e-9)) / 100; }
  function finiteNumber(errors, input, key, opts) {
    var value = input[key];
    if (value === undefined || value === null || value === "") {
      if (opts.required) errors.push(error("MISSING", key, "Campo obligatorio", value));
      return opts.defaultValue;
    }
    if (typeof value !== "number") { errors.push(error("WRONG_TYPE", key, "Debe ser un numero", value)); return opts.defaultValue; }
    if (!Number.isFinite(value)) { errors.push(error(Number.isNaN(value) ? "NAN" : "INFINITE", key, "Debe ser finito", value)); return opts.defaultValue; }
    if (value < 0) errors.push(error("NEGATIVE", key, "No puede ser negativo", value));
    if (opts.positive && value === 0) errors.push(error("ZERO", key, "Debe ser mayor que cero", value));
    if (opts.integer && !Number.isInteger(value)) errors.push(error("NOT_INTEGER", key, "Debe ser entero", value));
    if (opts.min !== undefined && value < opts.min || opts.max !== undefined && value > opts.max) errors.push(error("OUT_OF_RANGE", key, "Fuera de limites", value));
    return value === 0 ? 0 : value;
  }
  function enumValue(errors, input, key, values, fallback) {
    var value = input[key];
    if (value === undefined) { errors.push(error("MISSING", key, "Campo obligatorio", value)); return fallback; }
    if (values.indexOf(value) < 0) { errors.push(error("UNSUPPORTED", key, "Valor no soportado", value)); return fallback; }
    return value;
  }
  function validate(input) {
    var errors = [];
    if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, errors: [error("WRONG_TYPE", "$", "La entrada debe ser un objeto", input)] };
    var out = {};
    out.salarioBaseAnual = finiteNumber(errors, input, "salarioBaseAnual", { required: true, positive: true, defaultValue: 0 });
    out.complementosSalarialesAnuales = finiteNumber(errors, input, "complementosSalarialesAnuales", { defaultValue: 0 });
    out.horasExtraOrdinariasAnuales = finiteNumber(errors, input, "horasExtraOrdinariasAnuales", { defaultValue: 0 });
    out.horasExtraFuerzaMayorAnuales = finiteNumber(errors, input, "horasExtraFuerzaMayorAnuales", { defaultValue: 0 });
    out.numeroPagas = finiteNumber(errors, input, "numeroPagas", { required: true, integer: true, min: 12, max: 14, defaultValue: 12 });
    if ([12, 14].indexOf(out.numeroPagas) < 0) errors.push(error("UNSUPPORTED", "numeroPagas", "Solo se admiten 12 o 14 pagas", out.numeroPagas));
    out.pagExtraProrrateada = input.pagExtraProrrateada;
    if (typeof out.pagExtraProrrateada !== "boolean") errors.push(error("WRONG_TYPE", "pagExtraProrrateada", "Debe ser booleano", out.pagExtraProrrateada));
    if ((out.numeroPagas === 12) !== (out.pagExtraProrrateada === true)) errors.push(error("INCOHERENT", "pagExtraProrrateada", "12 pagas exige prorrata y 14 pagas exige pagas separadas", out.pagExtraProrrateada));
    out.grupoCotizacion = finiteNumber(errors, input, "grupoCotizacion", { required: true, integer: true, min: 1, max: 11, defaultValue: 7 });
    out.tipoContratoCotizacion = enumValue(errors, input, "tipoContratoCotizacion", ["indefinido", "temporal"], "indefinido");
    out.tipoContratoIrpf = enumValue(errors, input, "tipoContratoIrpf", ["general", "inferiorAnio", "especial"], "general");
    out.anioNacimiento = finiteNumber(errors, input, "anioNacimiento", { required: true, integer: true, min: 1906, max: 2026, defaultValue: 1990 });
    out.situacionFamiliar = finiteNumber(errors, input, "situacionFamiliar", { required: true, integer: true, min: 1, max: 3, defaultValue: 3 });
    out.discapacidad = enumValue(errors, input, "discapacidad", ["ninguna", "33a64", "65omas"], "ninguna");
    out.movilidadReducida = input.movilidadReducida === true;
    out.movilidadGeografica = input.movilidadGeografica === true;
    out.prestamoVivienda = input.prestamoVivienda === true;
    out.pensionCompensatoriaAnual = finiteNumber(errors, input, "pensionCompensatoriaAnual", { defaultValue: 0 });
    out.anualidadesAlimentosAnuales = finiteNumber(errors, input, "anualidadesAlimentosAnuales", { defaultValue: 0 });
    out.descendientes = input.descendientes === undefined ? [] : input.descendientes;
    out.ascendientes = input.ascendientes === undefined ? [] : input.ascendientes;
    if (!Array.isArray(out.descendientes)) errors.push(error("WRONG_TYPE", "descendientes", "Debe ser un array", out.descendientes));
    if (!Array.isArray(out.ascendientes)) errors.push(error("WRONG_TYPE", "ascendientes", "Debe ser un array", out.ascendientes));
    if (Array.isArray(out.descendientes) && out.descendientes.length > 16) errors.push(error("OUT_OF_RANGE", "descendientes", "Maximo 16", out.descendientes.length));
    if (Array.isArray(out.ascendientes) && out.ascendientes.length > 6) errors.push(error("OUT_OF_RANGE", "ascendientes", "Maximo 6", out.ascendientes.length));
    if (Array.isArray(out.descendientes)) out.descendientes.forEach(function (x, i) {
      var prefix = "descendientes[" + i + "]";
      if (!x || typeof x !== "object" || Array.isArray(x)) { errors.push(error("WRONG_TYPE", prefix, "Debe ser un objeto", x)); return; }
      if (!Number.isInteger(x.anioNacimiento)) errors.push(error("NOT_INTEGER", prefix + ".anioNacimiento", "Ano obligatorio y entero", x.anioNacimiento));
      else if (x.anioNacimiento < 1906 || x.anioNacimiento > 2026) errors.push(error("OUT_OF_RANGE", prefix + ".anioNacimiento", "Fuera de limites", x.anioNacimiento));
      if ([undefined, "ninguna", "33a64", "65omas"].indexOf(x.discapacidad) < 0) errors.push(error("UNSUPPORTED", prefix + ".discapacidad", "Valor no soportado", x.discapacidad));
      if (x.movilidadReducida === true && x.discapacidad !== "33a64") errors.push(error("INCOHERENT", prefix + ".movilidadReducida", "Solo procede con discapacidad del 33 al 64%", true));
      if (Number.isInteger(x.anioNacimiento) && 2026 - x.anioNacimiento >= 25 && (x.discapacidad === undefined || x.discapacidad === "ninguna")) errors.push(error("INCOHERENT", prefix, "Descendiente de 25 o mas anos sin discapacidad no computable", x));
    });
    if (Array.isArray(out.ascendientes)) out.ascendientes.forEach(function (x, i) {
      var prefix = "ascendientes[" + i + "]";
      if (!x || typeof x !== "object" || Array.isArray(x)) { errors.push(error("WRONG_TYPE", prefix, "Debe ser un objeto", x)); return; }
      if (!Number.isInteger(x.anioNacimiento)) errors.push(error("NOT_INTEGER", prefix + ".anioNacimiento", "Ano obligatorio y entero", x.anioNacimiento));
      if (x.convivencia !== undefined && (!Number.isInteger(x.convivencia) || x.convivencia < 1 || x.convivencia > 9)) errors.push(error("OUT_OF_RANGE", prefix + ".convivencia", "Debe ser entero entre 1 y 9", x.convivencia));
      if ([undefined, "ninguna", "33a64", "65omas"].indexOf(x.discapacidad) < 0) errors.push(error("UNSUPPORTED", prefix + ".discapacidad", "Valor no soportado", x.discapacidad));
      if (Number.isInteger(x.anioNacimiento) && 2026 - x.anioNacimiento < 65 && (x.discapacidad === undefined || x.discapacidad === "ninguna")) errors.push(error("INCOHERENT", prefix, "Ascendiente menor de 65 anos sin discapacidad no computable", x));
    });
    if (out.movilidadReducida && out.discapacidad !== "33a64") errors.push(error("INCOHERENT", "movilidadReducida", "Solo procede con discapacidad del 33 al 64%", true));
    if (out.situacionFamiliar === 1 && (!Array.isArray(out.descendientes) || out.descendientes.length === 0)) errors.push(error("INCOHERENT", "situacionFamiliar", "La situacion 1 exige descendientes", 1));
    if (input.regularizacion !== undefined) errors.push(error("UNSUPPORTED", "regularizacion", "Estructura reservada; calculo diferido hasta validacion normativa independiente", input.regularizacion));
    if (input.tiempoCompleto !== true) errors.push(error("UNSUPPORTED", "tiempoCompleto", "Esta version solo admite tiempo completo", input.tiempoCompleto));
    ["dietas", "indemnizaciones", "atrasos", "retribucionEspecie", "incapacidadTemporal"].forEach(function (key) {
      if (input[key] !== undefined) errors.push(error("UNSUPPORTED", key, "Concepto excluido del perimetro", input[key]));
    });
    return { ok: errors.length === 0, errors: errors, value: out };
  }

  function remuneration(d) {
    var ordinaria = d.salarioBaseAnual + d.complementosSalarialesAnuales;
    var extras = d.horasExtraOrdinariasAnuales + d.horasExtraFuerzaMayorAnuales;
    return { ordinariaAnual: ordinaria, horasExtraAnuales: extras, totalAnual: ordinaria + extras, ordinariaMensualCotizable: ordinaria / 12 };
  }
  function solidarity(monthly) {
    var total = 0, detail = [];
    N.seguridadSocial.solidaridadMensual.forEach(function (tier) {
      var amount = Math.max(0, Math.min(monthly, tier.hasta) - tier.desde);
      var quota = amount * tier.tipoTrabajador;
      detail.push({ baseMensual: amount, tipo: tier.tipoTrabajador, cuotaAnual: quota * 12 });
      total += quota * 12;
    });
    return { total: total, tramos: detail };
  }
  function monthlySolidarity(monthly) {
    var total = 0, detail = [];
    N.seguridadSocial.solidaridadMensual.forEach(function (tier) {
      var amount = Math.max(0, Math.min(monthly, tier.hasta) - tier.desde);
      var quota = amount * tier.tipoTrabajador;
      detail.push({ base: amount, tipo: tier.tipoTrabajador, cuota: quota });
      total += quota;
    });
    return { total: total, tramos: detail };
  }
  function socialSecurity(d, r) {
    var ss = N.seguridadSocial, min = ss.basesMensuales.minimasPorGrupo[d.grupoCotizacion];
    var baseMonthly = Math.min(ss.basesMensuales.maxima, Math.max(min, r.ordinariaMensualCotizable));
    var baseAnnual = baseMonthly * 12;
    var professionalMonthlyBeforeLimits = r.ordinariaMensualCotizable + r.horasExtraAnuales / 12;
    var professionalBaseMonthly = Math.min(ss.basesMensuales.maxima, Math.max(min, professionalMonthlyBeforeLimits));
    var professionalBaseAnnual = professionalBaseMonthly * 12;
    var rates = ss.tiposTrabajador;
    var s = solidarity(r.ordinariaMensualCotizable);
    var parts = {
      contingenciasComunes: baseAnnual * rates.contingenciasComunes,
      desempleo: professionalBaseAnnual * rates.desempleo[d.tipoContratoCotizacion],
      formacionProfesional: professionalBaseAnnual * rates.formacionProfesional,
      mei: baseAnnual * rates.mei,
      solidaridad: s.total,
      horasExtraOrdinarias: d.horasExtraOrdinariasAnuales * rates.horasExtraordinarias.ordinarias,
      horasExtraFuerzaMayor: d.horasExtraFuerzaMayorAnuales * rates.horasExtraordinarias.fuerzaMayor
    };
    parts.total = Object.keys(parts).reduce(function (sum, k) { return sum + parts[k]; }, 0);
    return { baseMensual: baseMonthly, baseAnual: baseAnnual, baseProfesionalMensual: professionalBaseMonthly, baseProfesionalAnual: professionalBaseAnnual, baseMinimaAplicada: r.ordinariaMensualCotizable < min, baseMaximaAplicada: r.ordinariaMensualCotizable > ss.basesMensuales.maxima, cuotas: parts, solidaridad: s.tramos };
  }
  function scale(base) {
    var rows = N.irpf.escala, row = rows[0];
    for (var i = 1; i < rows.length && base >= rows[i].desde; i += 1) row = rows[i];
    return row.cuota + Math.max(0, base - row.desde) * row.tipo;
  }
  function disabilityMinimum(kind, reduced) {
    if (kind === "65omas") return N.irpf.minimoDiscapacidad.grado65 + N.irpf.minimoDiscapacidad.asistencia;
    if (kind === "33a64") return N.irpf.minimoDiscapacidad.grado33a64 + (reduced ? N.irpf.minimoDiscapacidad.asistencia : 0);
    return 0;
  }
  function family(d) {
    var descendants = d.descendientes.map(function (x, idx) {
      var share = x.computoEntero === true ? 1 : 0.5;
      var age = 2026 - x.anioNacimiento;
      return { order: idx, share: share, age: age, disability: x.discapacidad || "ninguna", reduced: x.movilidadReducida === true, adoptionYear: x.anioAdopcion };
    });
    var desc = 0;
    descendants.forEach(function (x) {
      var orderValue = N.irpf.minimoDescendientes.porOrden[Math.min(x.order, 3)];
      desc += orderValue * x.share;
      if (x.age < 3 || (x.adoptionYear && x.adoptionYear > 2023)) desc += N.irpf.minimoDescendientes.menor3 * x.share;
      desc += disabilityMinimum(x.disability, x.reduced) * x.share;
    });
    var asc = 0;
    d.ascendientes.forEach(function (x) {
      var divisor = x.convivencia || 1, age = 2026 - x.anioNacimiento;
      if (age >= 65 || (x.discapacidad || "ninguna") !== "ninguna") asc += N.irpf.minimoAscendientes.mayor64 / divisor;
      if (age >= 75) asc += N.irpf.minimoAscendientes.mayor74 / divisor;
      asc += disabilityMinimum(x.discapacidad || "ninguna", x.movilidadReducida === true) / divisor;
    });
    var age = 2026 - d.anioNacimiento;
    var taxpayer = N.irpf.minimoContribuyente.general + (age >= 65 ? N.irpf.minimoContribuyente.mayor64 : 0) + (age >= 75 ? N.irpf.minimoContribuyente.mayor74 : 0) + disabilityMinimum(d.discapacidad, d.movilidadReducida);
    return { contribuyente: taxpayer, descendientes: round2(desc), ascendientes: round2(asc), total: taxpayer + round2(desc) + round2(asc), numeroDescendientes: descendants.length };
  }
  function withholding(d, r, ss) {
    // COTIZACIONES es un importe monetario de entrada AEAT: se comunica a centimos.
    var p = N.irpf, retrib = r.totalAnual, cot = round2(ss.cuotas.total);
    var other = p.gastosGenerales + (d.movilidadGeografica ? p.incrementoMovilidad : 0);
    if (d.discapacidad === "65omas" || (d.discapacidad === "33a64" && d.movilidadReducida)) other += p.incrementoDiscapacidad.grado65;
    else if (d.discapacidad === "33a64") other += p.incrementoDiscapacidad.grado33a64;
    other = Math.max(0, Math.min(other, retrib - cot));
    var rnt = Math.max(0, retrib - cot), red20 = 0, red = p.reduccionTrabajo;
    if (rnt <= red.limite1) red20 = red.cuantia1;
    else if (rnt <= red.limite2) red20 = red.cuantia1 - red.pendiente1 * (rnt - red.limite1);
    else if (rnt < red.limite3) red20 = red.cuantia2 - red.pendiente2 * (rnt - red.limite2);
    red20 = round2(Math.max(0, red20));
    var reducedNet = Math.max(0, rnt - other - red20);
    var fam = family(d), reductions = d.pensionCompensatoriaAnual;
    if (fam.numeroDescendientes > 2) reductions += p.reduccionesAdicionales.masDeDosDescendientes;
    var base = Math.max(0, reducedNet - reductions);
    var index = Math.min(fam.numeroDescendientes, 2), exemptLimit = p.limitesExcluyentes[d.situacionFamiliar][index];
    var exempt = exemptLimit !== null && retrib <= exemptLimit;
    var quota1, quota2, quota;
    if (d.anualidadesAlimentosAnuales > 0 && base > d.anualidadesAlimentosAnuales) {
      quota1 = scale(base - d.anualidadesAlimentosAnuales) + scale(d.anualidadesAlimentosAnuales);
      quota2 = scale(fam.total + 1980);
    } else { quota1 = scale(base); quota2 = scale(fam.total); }
    quota = exempt ? 0 : Math.max(0, quota1 - quota2);
    if (!exempt && retrib <= p.limiteCuotaBajasRetribuciones.hastaRetribucion && exemptLimit !== null) quota = Math.min(quota, (retrib - exemptLimit) * p.limiteCuotaBajasRetribuciones.tipo);
    var mortgageReduction = d.prestamoVivienda && retrib < p.vivienda.limiteRetribucion ? trunc2(retrib * p.vivienda.porcentaje) : 0;
    var difference = Math.max(0, quota - mortgageReduction);
    var rate = exempt ? 0 : trunc2(difference / retrib * 100);
    rate = Math.max(rate, p.minimoTipoContrato[d.tipoContratoIrpf]);
    var amount = round2(retrib * rate / 100);
    return { retribuciones: retrib, cotizacionesDeducibles: cot, otrosGastos: other, rendimientoNeto: rnt, reduccionRendimientosTrabajo: red20, rendimientoNetoReducido: reducedNet, minimoPersonalFamiliar: fam, baseRetencion: base, cuota1: quota1, cuota2: quota2, cuotaAntesMinoracion: quota, limiteExcluyente: exemptLimit, exento: exempt, minoracionVivienda: mortgageReduction, tipoRetencion: rate, importeAnual: amount };
  }
  function pays(d, r, ss, irpf) {
    var rate = irpf.tipoRetencion / 100, overtimeMonthly = r.horasExtraAnuales / 12;
    var ssMonthly = ss.cuotas.total / 12;
    if (d.numeroPagas === 12) {
      var gross12 = r.ordinariaAnual / 12 + overtimeMonthly;
      return { modalidad: "12 pagas con extras prorrateadas", pagasOrdinarias: 12, pagasExtra: 0, brutoPagaOrdinaria: gross12, netoPagaOrdinaria: gross12 * (1 - rate) - ssMonthly, brutoPagaExtra: 0, netoPagaExtra: 0 };
    }
    var grossUnit = r.ordinariaAnual / 14, regularGross = grossUnit + overtimeMonthly;
    return { modalidad: "14 pagas; cotizacion distribuida en 12 mensualidades", pagasOrdinarias: 12, pagasExtra: 2, brutoPagaOrdinaria: regularGross, netoPagaOrdinaria: regularGross * (1 - rate) - ssMonthly, brutoPagaExtra: grossUnit, netoPagaExtra: grossUnit * (1 - rate) };
  }
  function calculate(input) {
    var checked = validate(input);
    if (!checked.ok) return { ok: false, errors: checked.errors };
    var d = checked.value, r = remuneration(d), ss = socialSecurity(d, r), irpf = withholding(d, r, ss);
    var annualNet = r.totalAnual - ss.cuotas.total - irpf.importeAnual;
    return { ok: true, ejercicio: 2026, ambito: N.ambito, entradaNormalizada: d, remuneracion: r, seguridadSocial: ss, irpf: irpf, pagas: pays(d, r, ss, irpf), resumen: { brutoAnual: r.totalAnual, seguridadSocialAnual: ss.cuotas.total, irpfAnual: irpf.importeAnual, netoAnual: annualNet, netoMensualPromedio12: annualNet / 12 }, advertencias: ["Estimacion anual: no contempla regularizaciones ni incidencias mensuales.", "En 14 pagas la retencion de Seguridad Social se distribuye en las 12 nominas ordinarias."], auditoria: { versionNormativa: "2026.1", redondeo: N.redondeo, regularizacion: { estado: "disenada-no-soportada", motivo: "Pendiente de contraste independiente completo con AEAT" } } };
  }
  function validateMonthly(input) {
    var errors = [];
    if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, errors: [error("WRONG_TYPE", "$", "La entrada debe ser un objeto", input)] };
    var out = {};
    out.remuneracionOrdinariaMes = finiteNumber(errors, input, "remuneracionOrdinariaMes", { required: true, positive: true, defaultValue: 0 });
    out.prorrataPagasExtraMes = finiteNumber(errors, input, "prorrataPagasExtraMes", { required: true, defaultValue: 0 });
    out.complementosSalarialesMes = finiteNumber(errors, input, "complementosSalarialesMes", { defaultValue: 0 });
    out.horasExtraOrdinariasMes = finiteNumber(errors, input, "horasExtraOrdinariasMes", { defaultValue: 0 });
    out.horasExtraFuerzaMayorMes = finiteNumber(errors, input, "horasExtraFuerzaMayorMes", { defaultValue: 0 });
    out.numeroPagas = finiteNumber(errors, input, "numeroPagas", { required: true, integer: true, min: 12, max: 14, defaultValue: 12 });
    if ([12, 14].indexOf(out.numeroPagas) < 0) errors.push(error("UNSUPPORTED", "numeroPagas", "Solo se admiten 12 o 14 pagas", out.numeroPagas));
    if (out.numeroPagas === 12 && out.prorrataPagasExtraMes !== 0) errors.push(error("INCOHERENT", "prorrataPagasExtraMes", "En 12 pagas la prorrata ya forma parte de la remuneracion mensual y debe ser cero", out.prorrataPagasExtraMes));
    if (out.numeroPagas === 14 && out.prorrataPagasExtraMes <= 0) errors.push(error("INCOHERENT", "prorrataPagasExtraMes", "En 14 pagas debe indicarse la prorrata mensual de extras incluida en la base", out.prorrataPagasExtraMes));
    out.grupoCotizacion = finiteNumber(errors, input, "grupoCotizacion", { required: true, integer: true, min: 1, max: 11, defaultValue: 7 });
    out.tipoContratoCotizacion = enumValue(errors, input, "tipoContratoCotizacion", ["indefinido", "temporal"], "indefinido");
    if (input.tiempoCompleto !== true) errors.push(error("UNSUPPORTED", "tiempoCompleto", "Esta version solo admite tiempo completo y mes completo", input.tiempoCompleto));
    Object.keys(input).forEach(function (key) {
      if (["remuneracionOrdinariaMes", "prorrataPagasExtraMes", "complementosSalarialesMes", "horasExtraOrdinariasMes", "horasExtraFuerzaMayorMes", "numeroPagas", "grupoCotizacion", "tipoContratoCotizacion", "tiempoCompleto"].indexOf(key) < 0) {
        errors.push(error("UNSUPPORTED", key, "Campo ajeno al contrato mensual", input[key]));
      }
    });
    return { ok: errors.length === 0, errors: errors, value: out };
  }
  function calculateMonthlyContribution(input) {
    var checked = validateMonthly(input);
    if (!checked.ok) return { ok: false, errors: checked.errors };
    var d = checked.value, ss = N.seguridadSocial, rates = ss.tiposTrabajador;
    var computable = d.remuneracionOrdinariaMes + d.prorrataPagasExtraMes + d.complementosSalarialesMes;
    var grossPaid = d.remuneracionOrdinariaMes + d.complementosSalarialesMes + d.horasExtraOrdinariasMes + d.horasExtraFuerzaMayorMes;
    if (!Number.isFinite(computable) || !Number.isFinite(grossPaid)) return { ok: false, errors: [error("OUT_OF_RANGE", "$", "La suma de importes excede el rango numerico seguro", null)] };
    var minimum = ss.basesMensuales.minimasPorGrupo[d.grupoCotizacion];
    var applied = Math.min(ss.basesMensuales.maxima, Math.max(minimum, computable));
    var professionalBeforeLimits = computable + d.horasExtraOrdinariasMes + d.horasExtraFuerzaMayorMes;
    var professionalApplied = Math.min(ss.basesMensuales.maxima, Math.max(minimum, professionalBeforeLimits));
    var solidarityResult = monthlySolidarity(computable);
    var parts = {
      contingenciasComunes: applied * rates.contingenciasComunes,
      desempleo: professionalApplied * rates.desempleo[d.tipoContratoCotizacion],
      formacionProfesional: professionalApplied * rates.formacionProfesional,
      mei: applied * rates.mei,
      solidaridad: solidarityResult.total,
      horasExtraOrdinarias: d.horasExtraOrdinariasMes * rates.horasExtraordinarias.ordinarias,
      horasExtraFuerzaMayor: d.horasExtraFuerzaMayorMes * rates.horasExtraordinarias.fuerzaMayor
    };
    parts.total = Object.keys(parts).reduce(function (sum, key) { return sum + parts[key]; }, 0);
    Object.keys(parts).forEach(function (key) { if (Object.is(parts[key], -0)) parts[key] = 0; });
    return {
      ok: true,
      ejercicio: 2026,
      ambito: N.ambito + ", mes completo",
      entradaNormalizada: d,
      remuneracion: {
        ordinariaCobrada: d.remuneracionOrdinariaMes,
        prorrataPagasExtraBase: d.prorrataPagasExtraMes,
        complementosSalariales: d.complementosSalarialesMes,
        computableBase: computable,
        horasExtraOrdinarias: d.horasExtraOrdinariasMes,
        horasExtraFuerzaMayor: d.horasExtraFuerzaMayorMes,
        brutoCobradoMes: grossPaid
      },
      base: {
        antesDeLimites: computable,
        profesionalAntesDeLimites: professionalBeforeLimits,
        minima: minimum,
        maxima: ss.basesMensuales.maxima,
        aplicada: applied,
        profesionalAplicada: professionalApplied,
        minimaAplicada: computable < minimum,
        maximaAplicada: computable > ss.basesMensuales.maxima
      },
      cuotas: parts,
      solidaridad: { tramos: solidarityResult.tramos, total: solidarityResult.total },
      comparacion: { brutoMes: grossPaid, cotizacionesTrabajador: parts.total },
      advertencias: ["Calcula solo cotizaciones del trabajador del mes indicado.", "No calcula ni regulariza la retencion mensual de IRPF."]
    };
  }
  return Object.freeze({ calculate: calculate, validate: validate, calculateMonthlyContribution: calculateMonthlyContribution, validateMonthly: validateMonthly, round2: round2, trunc2: trunc2, scale: scale });
}));
