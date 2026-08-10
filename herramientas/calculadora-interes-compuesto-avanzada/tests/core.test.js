(function () {
    "use strict";
    const e = InteresCompuestoEngine, S = e.STATUS, pruebas = [];
    const test = (nombre, fn) => pruebas.push({ nombre, fn });
    const ok = (v, m) => { if (!v) throw new Error(m || "condición falsa"); };
    const igual = (a, b) => ok(Object.is(a, b), `${a} !== ${b}`);
    const cerca = (a, b, t = 1e-7) => ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);
    const base = (extra = {}) => Object.assign({ capitalInicial: 10000, aportacionPeriodica: 0, plazoAnos: 10, rentabilidadAnual: 0, frecuenciaAportacion: "mensual", frecuenciaCapitalizacion: "mensual", momentoAportacion: "final" }, extra);
    const sim = extra => e.simular(base(extra));

    test("A: 10.000, 0%, 10 años", () => cerca(sim({}).capitalFinal, 10000));
    test("B: 10.000, 5%, 10 años", () => cerca(sim({ rentabilidadAnual: .05 }).capitalFinal, 10000 * 1.05 ** 10));
    test("C: 100 mensuales, 0%, 10 años", () => { const r = sim({ capitalInicial: 0, aportacionPeriodica: 100 }); cerca(r.capitalFinal, 12000); cerca(r.dineroTotalAportado, 12000); cerca(r.rendimientoAcumulado, 0); });
    test("D: 10.000 + 100 mensuales, 0%", () => cerca(sim({ aportacionPeriodica: 100 }).capitalFinal, 22000));
    test("E: -10% efectivo un año", () => cerca(sim({ rentabilidadAnual: -.1, plazoAnos: 1 }).capitalFinal, 9000));
    test("F: 100% efectivo un año", () => cerca(sim({ rentabilidadAnual: 1, plazoAnos: 1 }).capitalFinal, 20000));

    ["mensual", "trimestral", "semestral", "anual"].forEach(f => test(`capitalización ${f} conserva 5% efectivo`, () => cerca(sim({ rentabilidadAnual: .05, plazoAnos: 1, frecuenciaCapitalizacion: f }).capitalFinal, 10500)));
    ["mensual", "trimestral", "semestral", "anual"].forEach(f => test(`aportación ${f} cuenta eventos exactos a 0%`, () => { const r = sim({ capitalInicial: 0, aportacionPeriodica: 100, plazoAnos: 2, frecuenciaAportacion: f }); cerca(r.capitalFinal, 100 * 24 / e.FRECUENCIAS[f]); cerca(r.aportacionesAcumuladas, r.capitalFinal); }));
    test("principio supera final con tasa positiva", () => ok(sim({ aportacionPeriodica: 100, rentabilidadAnual: .05, momentoAportacion: "principio" }).capitalFinal > sim({ aportacionPeriodica: 100, rentabilidadAnual: .05 }).capitalFinal));
    test("principio iguala final con tasa cero", () => cerca(sim({ aportacionPeriodica: 100, momentoAportacion: "principio" }).capitalFinal, sim({ aportacionPeriodica: 100 }).capitalFinal));
    test("frecuencias de aportación y capitalización son independientes", () => { const r = sim({ aportacionPeriodica: 100, rentabilidadAnual: .05, frecuenciaAportacion: "trimestral", frecuenciaCapitalizacion: "mensual", plazoAnos: 1 }); igual(r.serie.filter(x => x.aportacion > 0).length, 4); igual(r.serie.filter(x => x.cierreCapitalizacion).length, 12); });
    test("mensual + capitalización anual marca 12 aportaciones y 1 cierre", () => { const r = sim({ aportacionPeriodica: 100, frecuenciaCapitalizacion: "anual", plazoAnos: 1 }); igual(r.serie.filter(x => x.aportacion).length, 12); igual(r.serie.filter(x => x.cierreCapitalizacion).length, 1); });

    test("inflación cero conserva nominal", () => cerca(e.calcularInflacion(100000, 0, 20).capitalReal, 100000));
    test("inflación positiva usa descuento compuesto independiente", () => cerca(e.calcularInflacion(100000, .02, 10).capitalReal, 100000 / 1.02 ** 10));
    test("inflación positiva reduce poder adquisitivo", () => { const r = sim({ inflacionAnual: .02 }); ok(r.capitalReal < r.capitalFinal); });
    test("inflación negativa razonable aumenta poder adquisitivo", () => { const r = e.calcularInflacion(100000, -.02, 10); ok(r.capitalReal > r.capitalNominal); });
    test("costes cero coincide con escenario sin costes", () => { const a = sim({ rentabilidadAnual: .05 }), b = sim({ rentabilidadAnual: .05, costesAnuales: 0 }); cerca(a.capitalFinal, b.capitalFinal); cerca(b.impactoCostes, 0); });
    test("costes positivos reducen capital", () => { const r = sim({ rentabilidadAnual: .07, costesAnuales: .01 }); ok(r.capitalFinal <= r.capitalSinCostes); });
    test("impacto costes es diferencia contrafactual", () => { const r = sim({ aportacionPeriodica: 100, rentabilidadAnual: .07, costesAnuales: .01 }); cerca(r.impactoCostes, r.capitalSinCostes - r.capitalFinal); });

    test("interés simple 10.000 al 5% diez años", () => cerca(e.calcularInteresSimple(base({ rentabilidadAnual: .05 })).capitalFinal, 15000));
    test("comparación simple-compuesto independiente", () => { const r = e.compararIntereses(base({ rentabilidadAnual: .05 })); cerca(r.capitalFinalSimple, 15000); cerca(r.capitalFinalCompuesto, 10000 * 1.05 ** 10); cerca(r.diferenciaAbsoluta, 10000 * 1.05 ** 10 - 15000); });
    test("simple con aportaciones usa tiempo restante", () => { const r = e.calcularInteresSimple(base({ capitalInicial: 0, aportacionPeriodica: 1200, frecuenciaAportacion: "anual", plazoAnos: 2, rentabilidadAnual: .1 })); cerca(r.capitalFinal, 1200 * 1.1 + 1200); });
    test("duplicación exacta usa logaritmos", () => cerca(e.calcularDuplicacion(.05).tiempoExactoAnos, Math.log(2) / Math.log(1.05)));
    test("regla del 72 es aproximación separada", () => cerca(e.calcularDuplicacion(.05).regla72Anos, 14.4));
    test("duplicación a 0% no alcanzable", () => igual(e.calcularDuplicacion(0).estado, S.DUPLICACION_NO_ALCANZABLE));
    test("duplicación con tasa negativa no alcanzable", () => igual(e.calcularDuplicacion(-.1).estado, S.DUPLICACION_NO_ALCANZABLE));

    test("hitos sólo dentro del horizonte", () => { const h = sim({ plazoAnos: 10, rentabilidadAnual: .05 }).hitos.capitalPorAno.map(x => x.ano); igual(h.join(","), "1,5,10"); });
    test("hito de año fraccionario final queda resumido", () => { const r = sim({ plazoAnos: 1.5 }); igual(r.resumenAnual.length, 2); igual(r.resumenAnual[1].ano, 2); });
    test("rendimiento supera aportaciones identifica primer año", () => { const h = sim({ capitalInicial: 100000, aportacionPeriodica: 10, rentabilidadAnual: .05, plazoAnos: 2 }).hitos.rendimientoSuperaAportaciones; igual(h.estado, S.OK); igual(h.ano, 1); });
    test("hito no alcanzado es semántico", () => igual(sim({ aportacionPeriodica: 100, rentabilidadAnual: 0 }).hitos.rendimientoSuperaAportaciones.estado, S.HITO_NO_ALCANZADO));

    test("invariante 1: más capital no reduce final", () => ok(sim({ capitalInicial: 20000, rentabilidadAnual: .05 }).capitalFinal >= sim({ capitalInicial: 10000, rentabilidadAnual: .05 }).capitalFinal));
    test("invariante 2: más aportación no reduce final", () => ok(sim({ aportacionPeriodica: 200, rentabilidadAnual: .05 }).capitalFinal >= sim({ aportacionPeriodica: 100, rentabilidadAnual: .05 }).capitalFinal));
    test("invariante 3: más rentabilidad no reduce final", () => ok(sim({ rentabilidadAnual: .07 }).capitalFinal >= sim({ rentabilidadAnual: .03 }).capitalFinal));
    test("invariante 4: más plazo no reduce final", () => ok(sim({ plazoAnos: 20, aportacionPeriodica: 100, rentabilidadAnual: .05 }).capitalFinal >= sim({ plazoAnos: 10, aportacionPeriodica: 100, rentabilidadAnual: .05 }).capitalFinal));
    test("invariante 5: real no supera nominal con inflación positiva", () => { const r = sim({ inflacionAnual: .03 }); ok(r.capitalReal <= r.capitalFinal); });
    test("invariante 6: costes no superan escenario sin costes", () => { const r = sim({ costesAnuales: .02, rentabilidadAnual: .05 }); ok(r.capitalFinal <= r.capitalSinCostes); });
    test("invariante 7: aportación anticipada no rinde menos", () => ok(sim({ aportacionPeriodica: 100, rentabilidadAnual: .05, momentoAportacion: "principio" }).capitalFinal >= sim({ aportacionPeriodica: 100, rentabilidadAnual: .05 }).capitalFinal));
    test("invariante 8: a 0% final = aportado", () => { const r = sim({ aportacionPeriodica: 123 }); cerca(r.capitalFinal, r.dineroTotalAportado); });
    test("invariante 9: aportado + rendimiento = final", () => { const r = sim({ aportacionPeriodica: 123, rentabilidadAnual: .043 }); cerca(r.dineroTotalAportado + r.rendimientoAcumulado, r.capitalFinal); });
    test("invariante 10: serie y principal terminan iguales", () => { const r = sim({ aportacionPeriodica: 123, rentabilidadAnual: .043 }); cerca(r.serie.at(-1).capitalFinal, r.capitalFinal); });

    test("rechaza capital negativo", () => igual(sim({ capitalInicial: -1 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza aportación negativa", () => igual(sim({ aportacionPeriodica: -1 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza plazo cero", () => igual(sim({ plazoAnos: 0 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza plazo negativo", () => igual(sim({ plazoAnos: -1 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza plazo mayor al máximo", () => igual(sim({ plazoAnos: e.LIMITES.maximoAnos + 1 }).estado, S.ENTRADA_INVALIDA));
    test("admite plazo máximo", () => igual(sim({ capitalInicial: 0, plazoAnos: e.LIMITES.maximoAnos }).estado, S.OK));
    test("rechaza fracción inferior a un mes", () => igual(sim({ plazoAnos: 1.01 }).estado, S.ENTRADA_INVALIDA));
    test("admite medio año", () => igual(sim({ plazoAnos: .5 }).serie.length, 6));
    test("rechaza tasa no numérica", () => igual(sim({ rentabilidadAnual: "5" }).estado, S.ENTRADA_INVALIDA));
    test("rechaza NaN", () => igual(sim({ rentabilidadAnual: NaN }).estado, S.ENTRADA_INVALIDA));
    test("rechaza Infinity", () => igual(sim({ capitalInicial: Infinity }).estado, S.ENTRADA_INVALIDA));
    test("rechaza costes negativos", () => igual(sim({ costesAnuales: -.01 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza costes absurdos", () => igual(sim({ costesAnuales: 1 }).estado, S.ENTRADA_INVALIDA));
    test("rechaza inflación no numérica", () => igual(sim({ inflacionAnual: "2" }).estado, S.ENTRADA_INVALIDA));
    test("rechaza frecuencia de aportación desconocida", () => igual(sim({ frecuenciaAportacion: "semanal" }).estado, S.ENTRADA_INVALIDA));
    test("rechaza frecuencia de capitalización desconocida", () => igual(sim({ frecuenciaCapitalizacion: "diaria" }).estado, S.ENTRADA_INVALIDA));
    test("rechaza momento desconocido", () => igual(sim({ momentoAportacion: "medio" }).estado, S.ENTRADA_INVALIDA));
    test("rechaza importe sobre límite", () => igual(sim({ capitalInicial: e.LIMITES.maximoImporte + 1 }).estado, S.ENTRADA_INVALIDA));
    test("cero absoluto permanece cero", () => cerca(sim({ capitalInicial: 0, aportacionPeriodica: 0, rentabilidadAnual: 0 }).capitalFinal, 0));
    test("cantidad muy pequeña permanece finita", () => ok(Number.isFinite(sim({ capitalInicial: 1e-9, plazoAnos: 1, rentabilidadAnual: .05 }).capitalFinal)));
    test("cantidad grande admitida permanece finita", () => ok(Number.isFinite(sim({ capitalInicial: 1e12, plazoAnos: 1, rentabilidadAnual: .05 }).capitalFinal)));
    test("tasa elevada admitida permanece finita", () => ok(Number.isFinite(sim({ capitalInicial: 1, plazoAnos: 2, rentabilidadAnual: 10 }).capitalFinal)));
    test("tasa equivalente mensual recompone tasa anual", () => cerca((1 + e.tasaEquivalente(.05, 12)) ** 12 - 1, .05));
    test("tasa equivalente rechaza -100%", () => igual(e.tasaEquivalente(-1, 12), null));
    test("fórmula cerrada de anualidad ordinaria", () => { const r = sim({ capitalInicial: 0, aportacionPeriodica: 100, rentabilidadAnual: .05, plazoAnos: 10 }); const m = 1.05 ** (1 / 12) - 1; cerca(r.capitalFinal, 100 * ((1 + m) ** 120 - 1) / m); });
    test("resumen suma aportaciones anuales", () => { const r = sim({ aportacionPeriodica: 100, plazoAnos: 2 }); cerca(r.resumenAnual[0].aportaciones, 1200); cerca(r.resumenAnual[1].aportaciones, 1200); });
    test("resumen termina como serie", () => { const r = sim({ aportacionPeriodica: 100, plazoAnos: 1.5 }); cerca(r.resumenAnual.at(-1).capitalFinal, r.serie.at(-1).capitalFinal); });
    test("escenarios respetan delta configurable", () => { const r = e.generarEscenarios(base({ rentabilidadAnual: .05 }), .01); cerca(r.escenarios[0].rentabilidadAnual, .04); cerca(r.escenarios[1].rentabilidadAnual, .05); cerca(r.escenarios[2].rentabilidadAnual, .06); });
    test("escenarios están ordenados con flujos no negativos", () => { const x = e.generarEscenarios(base({ aportacionPeriodica: 100, rentabilidadAnual: .05 }), .01).escenarios; ok(x[0].capitalFinal <= x[1].capitalFinal && x[1].capitalFinal <= x[2].capitalFinal); });
    test("campos opcionales sólo aparecen al activarse", () => { const r = sim({}); ok(!("capitalReal" in r)); ok(!("capitalSinCostes" in r)); ok(!("comparacionInteresSimple" in r)); ok(!("escenarios" in r)); });
    test("comparación y escenarios pueden activarse", () => { const r = sim({ incluirComparacion: true, incluirEscenarios: true, rentabilidadAnual: .05 }); igual(r.comparacionInteresSimple.estado, S.OK); igual(r.escenarios.length, 3); });

    let pasados = 0; const fallos = [];
    pruebas.forEach(p => { try { p.fn(); pasados += 1; } catch (err) { fallos.push(`${p.nombre}: ${err.message}`); } });
    const texto = `TOTAL: ${pruebas.length}\nSUPERADOS: ${pasados}\nFALLIDOS: ${fallos.length}${fallos.length ? `\n\n${fallos.join("\n")}` : ""}`;
    const salida = document.getElementById("salida"); salida.textContent = texto; salida.dataset.total = pruebas.length; salida.dataset.pasados = pasados; salida.dataset.fallidos = fallos.length;
}());
