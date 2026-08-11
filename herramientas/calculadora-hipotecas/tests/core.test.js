"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/core.js");
const { STATUS, CONFIG } = engine;
const cerca = (actual, esperado, tolerancia = 1e-8) => assert.ok(Math.abs(actual - esperado) <= tolerancia, `${actual} != ${esperado}`);
const valido = resultado => assert.ok(resultado.status !== STATUS.INVALID, JSON.stringify(resultado.errors));

test("regresión: 200.000 €, TIN 3 %, 360 meses", () => {
    const r = engine.resumirPrestamo({ capital: 200000, tinAnual: 0.03, cuotas: 360 });
    cerca(r.cuotaMatematica, 843.2080674589118, 1e-9);
    cerca(r.totalMatematicoCuotas, 303554.90428520826, 1e-7);
    cerca(r.interesesTotales, 103554.90428520826, 1e-7);
});
test("TIN cero usa capital / cuotas", () => cerca(engine.calcularCuotaFrancesa({ capital: 200000, tinAnual: 0, cuotas: 360 }).cuota, 200000 / 360));
test("capital pequeño y plazo corto", () => cerca(engine.calcularCuotaFrancesa({ capital: 1, tinAnual: 0.03, cuotas: 1 }).cuota, 1.0025));
test("capital grande permitido queda finito", () => assert.ok(Number.isFinite(engine.resumirPrestamo({ capital: CONFIG.MAX_AMOUNT, tinAnual: 0.03, cuotas: 360 }).totalMatematicoCuotas)));
test("plazo largo permitido queda finito", () => assert.ok(Number.isFinite(engine.resumirPrestamo({ capital: 200000, tinAnual: 0.03, cuotas: CONFIG.MAX_MONTHS }).cuotaMatematica)));

test("validación distingue ausente", () => assert.equal(engine.calcularCuotaFrancesa({ tinAnual: 0.03, cuotas: 360 }).errors[0].code, "missing"));
test("validación distingue tipo incorrecto", () => assert.equal(engine.calcularCuotaFrancesa({ capital: "200000", tinAnual: 0.03, cuotas: 360 }).errors[0].code, "wrong_type"));
test("validación distingue NaN", () => assert.equal(engine.calcularCuotaFrancesa({ capital: NaN, tinAnual: 0.03, cuotas: 360 }).errors[0].code, "nan"));
test("validación distingue Infinity", () => assert.equal(engine.calcularCuotaFrancesa({ capital: Infinity, tinAnual: 0.03, cuotas: 360 }).errors[0].code, "infinite"));
test("capital negativo se rechaza", () => assert.equal(engine.calcularCuotaFrancesa({ capital: -1, tinAnual: 0.03, cuotas: 360 }).errors[0].code, "negative"));
test("capital cero se rechaza", () => assert.equal(engine.calcularCuotaFrancesa({ capital: 0, tinAnual: 0.03, cuotas: 360 }).errors[0].code, "zero_not_allowed"));
test("TIN cero es válido", () => assert.equal(engine.calcularCuotaFrancesa({ capital: 1, tinAnual: 0, cuotas: 1 }).status, STATUS.VALID));
test("límite de importe se aplica", () => assert.equal(engine.calcularCuotaFrancesa({ capital: CONFIG.MAX_AMOUNT + 1, tinAnual: 0.03, cuotas: 360 }).errors[0].code, "above_technical_limit"));
test("límite de TIN se aplica", () => assert.equal(engine.calcularCuotaFrancesa({ capital: 1, tinAnual: CONFIG.MAX_ANNUAL_TIN + 0.01, cuotas: 1 }).errors[0].code, "above_technical_limit"));
test("límite de plazo se aplica", () => assert.equal(engine.calcularCuotaFrancesa({ capital: 1, tinAnual: 0, cuotas: CONFIG.MAX_MONTHS + 1 }).errors[0].code, "above_technical_limit"));
test("cuotas fraccionarias se rechazan", () => assert.equal(engine.calcularCuotaFrancesa({ capital: 1, tinAnual: 0, cuotas: 12.5 }).errors[0].code, "not_integer"));

test("compra con entrada cero", () => cerca(engine.calcularCapitalCompra({ precioVivienda: 250000, entrada: 0 }).capitalHipotecario, 250000));
test("compra válida conserva la identidad precio", () => { const r = engine.calcularCapitalCompra({ precioVivienda: 250000, entrada: 50000 }); cerca(r.entrada + r.capitalHipotecario, r.precioVivienda); cerca(r.porcentajeFinanciado, 0.8); });
test("entrada próxima al precio es válida", () => cerca(engine.calcularCapitalCompra({ precioVivienda: 100, entrada: 99.99 }).capitalHipotecario, 0.01, 1e-12));
test("entrada igual al precio se rechaza", () => assert.equal(engine.calcularCapitalCompra({ precioVivienda: 100, entrada: 100 }).status, STATUS.INVALID));
test("entrada superior al precio se rechaza", () => assert.equal(engine.calcularCapitalCompra({ precioVivienda: 100, entrada: 101 }).status, STATUS.INVALID));

test("cuadro: primera cuota correcta", () => { const s = engine.cuadroAmortizacion({ capital: 200000, tinAnual: 0.03, cuotas: 360 }); cerca(s.filas[0].intereses, 500); cerca(s.filas[0].capitalAmortizado, s.cuotaMatematica - 500); });
test("cuadro: cuota intermedia conserva identidad", () => { const s = engine.cuadroAmortizacion({ capital: 200000, tinAnual: 0.03, cuotas: 360 }); const r = s.filas[179]; cerca(r.saldoInicial - r.capitalAmortizado, r.saldoFinal); cerca(r.intereses + r.capitalAmortizado, r.cuota); });
test("cuadro: última cuota extingue saldo", () => { const s = engine.cuadroAmortizacion({ capital: 200000, tinAnual: 0.03, cuotas: 360 }); assert.equal(s.filas.length, 360); cerca(s.filas[359].saldoFinal, 0); });
test("cuadro: invariantes agregados", () => { const s = engine.cuadroAmortizacion({ capital: 200000, tinAnual: 0.03, cuotas: 360 }); cerca(s.capitalAmortizadoTotal + s.saldoFinal, s.capitalInicial, 1e-6); cerca(s.capitalInicial + s.interesesTotales, s.filas.reduce((a, r) => a + r.cuota, 0), 1e-6); });
test("cuadro TIN cero no genera intereses", () => { const s = engine.cuadroAmortizacion({ capital: 1200, tinAnual: 0, cuotas: 12 }); assert.equal(s.interesesTotales, 0); assert.ok(s.filas.every(r => r.intereses === 0)); assert.equal(s.saldoFinal, 0); });

test("serie anual incluye periodo parcial", () => { const r = engine.serieAnual({ capital: 1300, tinAnual: 0.03, cuotas: 13 }); assert.equal(r.serie.length, 2); assert.equal(r.serie[1].cuotasTranscurridas, 13); assert.equal(r.serie[1].periodoParcial, true); cerca(r.serie[1].saldoPendiente, 0); });
test("estado inicial no amortiza", () => { const r = engine.estadoTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 0 }); assert.equal(r.saldoPendiente, 200000); assert.equal(r.cuotasRestantes, 360); });
test("estado tras 60 cuotas es coherente", () => { const r = engine.estadoTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 60 }); cerca(r.capitalAmortizado + r.saldoPendiente, 200000, 1e-6); assert.equal(r.cuotasRestantes, 300); });
test("estado final está extinguido", () => assert.equal(engine.estadoTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 360 }).status, STATUS.PAID_OFF));

test("comparación 20/25/30: cuota baja e intereses suben", () => { const r = engine.compararPlazos({ capital: 200000, tinAnual: 0.03, plazosMeses: [240, 300, 360] }); assert.equal(r.escenarios.length, 3); assert.ok(r.escenarios[0].cuota > r.escenarios[1].cuota); assert.ok(r.escenarios[1].cuota > r.escenarios[2].cuota); assert.ok(r.escenarios[0].interesesTotales < r.escenarios[2].interesesTotales); });
test("comparación admite colección personalizada y base", () => { const r = engine.compararPlazos({ capital: 100000, tinAnual: 0.02, plazosMeses: [60, 120], plazoBaseMeses: 120 }); assert.equal(r.escenarios.find(x => x.cuotas === 120).diferenciaCuotaVsBase, 0); });
test("comparación elimina duplicados", () => assert.equal(engine.compararPlazos({ capital: 1, tinAnual: 0, plazosMeses: [12, 12, 24] }).escenarios.length, 2));
test("comparación rechaza plazo inválido", () => assert.equal(engine.compararPlazos({ capital: 1, tinAnual: 0, plazosMeses: [12.5] }).status, STATUS.INVALID));

const prepago = { saldoPendiente: 180000, tinAnual: 0.03, cuotasRestantes: 300, importeAmortizacion: 20000 };
test("amortización parcial reduce cuota", () => { const r = engine.amortizarReduciendoCuota(prepago); valido(r); assert.ok(r.saldoNuevo < r.saldoAnterior); assert.ok(r.cuotaNueva < r.cuotaAnterior); assert.ok(r.ahorroBrutoIntereses > 0); });
test("amortización parcial reduce plazo", () => { const r = engine.amortizarReduciendoPlazo(prepago); valido(r); assert.ok(r.nuevasCuotas < prepago.cuotasRestantes); assert.ok(r.ultimaCuota <= r.cuotaReferencia); assert.ok(r.ahorroBrutoIntereses > 0); });
test("comparador devuelve ambas opciones sin recomendación", () => { const r = engine.compararAmortizacion(prepago); valido(r); assert.ok(r.reducirCuota); assert.ok(r.reducirPlazo); assert.equal("recomendacion" in r, false); });
test("amortización con TIN cero reduce cuota", () => { const r = engine.amortizarReduciendoCuota({ saldoPendiente: 12000, tinAnual: 0, cuotasRestantes: 12, importeAmortizacion: 1200 }); cerca(r.cuotaNueva, 900); assert.equal(r.ahorroBrutoIntereses, 0); });
test("amortización con TIN cero reduce plazo y ajusta última cuota", () => { const r = engine.amortizarReduciendoPlazo({ saldoPendiente: 12000, tinAnual: 0, cuotasRestantes: 12, importeAmortizacion: 1500 }); assert.equal(r.nuevasCuotas, 11); cerca(r.ultimaCuota, 500); });
test("amortización igual al saldo extingue", () => assert.equal(engine.compararAmortizacion({ saldoPendiente: 1000, tinAnual: 0.03, cuotasRestantes: 12, importeAmortizacion: 1000 }).status, STATUS.PAID_OFF));
test("amortización superior al saldo se rechaza", () => assert.equal(engine.compararAmortizacion({ saldoPendiente: 1000, tinAnual: 0.03, cuotasRestantes: 12, importeAmortizacion: 1001 }).errors[0].code, "exceeds_balance"));
test("amortización cero se rechaza", () => assert.equal(engine.compararAmortizacion({ saldoPendiente: 1000, tinAnual: 0.03, cuotasRestantes: 12, importeAmortizacion: 0 }).status, STATUS.INVALID));
test("comisión omitida equivale a cero", () => assert.equal(engine.amortizarReduciendoCuota(prepago).comision, 0));
test("comisión positiva reduce ahorro neto", () => { const r = engine.amortizarReduciendoCuota(Object.assign({}, prepago, { comision: 500 })); cerca(r.ahorroNeto, r.ahorroBrutoIntereses - 500); });
test("amortización tras 12 cuotas funciona", () => valido(engine.compararAmortizacionTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 12, importeAmortizacion: 10000 })));
test("amortización tras 60 cuotas funciona", () => valido(engine.compararAmortizacionTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 60, importeAmortizacion: 10000 })));
test("amortización tras 120 cuotas funciona", () => valido(engine.compararAmortizacionTrasCuotas({ capital: 200000, tinAnual: 0.03, cuotas: 360, cuotasTranscurridas: 120, importeAmortizacion: 10000 })));
test("préstamo extinguido no admite amortización", () => assert.equal(engine.compararAmortizacionTrasCuotas({ capital: 1200, tinAnual: 0, cuotas: 12, cuotasTranscurridas: 12, importeAmortizacion: 1 }).errors[0].code, "already_paid_off"));

const costes = [{ id: "externo-a", categoria: "compra", ambito: "purchase", importe: 3000 }, { id: "externo-b", categoria: "prestamo", ambito: "loan", importe: 500 }];
test("agregador mantiene compra y préstamo separados", () => { const r = engine.agregarCostesExternos(costes); assert.equal(r.costesCompraventa, 3000); assert.equal(r.costesPrestamo, 500); assert.equal(r.total, 3500); });
test("agregador acepta colección vacía", () => assert.equal(engine.agregarCostesExternos([]).total, 0));
test("agregador rechaza ids duplicados", () => assert.equal(engine.agregarCostesExternos([costes[0], costes[0]]).status, STATUS.INVALID));
test("agregador rechaza ámbito ambiguo", () => assert.equal(engine.agregarCostesExternos([{ id: "x", categoria: "x", ambito: "gastos", importe: 1 }]).status, STATUS.INVALID));
test("ahorros suficientes", () => { const r = engine.evaluarAhorros({ ahorrosDisponibles: 60000, entrada: 50000, costesCompraventa: 5000, costesPrestamo: 1000 }); assert.equal(r.status, STATUS.SUFFICIENT); assert.equal(r.superavit, 4000); assert.equal(r.deficit, 0); });
test("ahorros exactos", () => assert.equal(engine.evaluarAhorros({ ahorrosDisponibles: 56000, entrada: 50000, costesCompraventa: 5000, costesPrestamo: 1000 }).status, STATUS.EXACT));
test("ahorros insuficientes", () => { const r = engine.evaluarAhorros({ ahorrosDisponibles: 50000, entrada: 50000, costesCompraventa: 5000, costesPrestamo: 1000 }); assert.equal(r.status, STATUS.INSUFFICIENT); assert.equal(r.deficit, 6000); });
test("ahorros con costes cero", () => assert.equal(engine.evaluarAhorros({ ahorrosDisponibles: 50000, entrada: 50000, costesCompraventa: 0, costesPrestamo: 0 }).status, STATUS.EXACT));
test("esfuerzo mensual devuelve solo ratio matemático", () => cerca(engine.calcularEsfuerzoMensual({ cuota: 750, ingresosNetosMensuales: 2500 }).ratio, 0.3));

test("overflow de suma de costes se bloquea", () => { const items = [{ id: "a", categoria: "x", ambito: "purchase", importe: CONFIG.MAX_AMOUNT }, { id: "b", categoria: "x", ambito: "purchase", importe: CONFIG.MAX_AMOUNT }]; const r = engine.agregarCostesExternos(items); assert.ok(Number.isFinite(r.total)); });
test("todos los resultados del límite de TIN son finitos", () => { const r = engine.cuadroAmortizacion({ capital: CONFIG.MAX_AMOUNT, tinAnual: CONFIG.MAX_ANNUAL_TIN, cuotas: CONFIG.MAX_MONTHS }); valido(r); assert.ok(r.filas.every(x => [x.intereses, x.capitalAmortizado, x.cuota, x.saldoFinal].every(Number.isFinite))); });
test("una amortización válida nunca aumenta saldo", () => { const r = engine.compararAmortizacion(prepago); assert.ok(r.reducirCuota.saldoNuevo <= prepago.saldoPendiente); assert.ok(r.reducirPlazo.saldoNuevo <= prepago.saldoPendiente); });
