/* Suite portable: navegador/JXA. Cargar config.js y core.js antes. */
(function (root) {
    "use strict";
    const e = root.InflationEngine;
    const tests = [];
    const test = (name, fn) => tests.push({ name, fn });
    const assert = (condition, message) => { if (!condition) throw new Error(message || "assertion failed"); };
    const equal = (actual, expected) => assert(Object.is(actual, expected), `${actual} !== ${expected}`);
    const close = (actual, expected, tolerance) => {
        const limit = (tolerance || 1e-12) * Math.max(1, Math.abs(expected));
        assert(Math.abs(actual - expected) <= limit, `${actual} != ${expected}`);
    };
    const valid = result => equal(result.status, e.STATUS.OK);
    const invalid = (result, field) => {
        equal(result.status, e.STATUS.INVALID_INPUT);
        assert(result.errors.some(error => error.field === field), `missing error for ${field}`);
    };

    test("inflación acumulada simple 10% dos años", () => close(e.calculateCumulativeInflation({inflationRate:.1,years:2}).cumulativeInflation,.21));
    test("factor compuesto 3% diez años", () => close(e.calculateCumulativeInflation({inflationRate:.03,years:10}).inflationFactor,1.03**10));
    test("periodo decimal", () => close(e.calculateCumulativeInflation({inflationRate:.04,years:2.5}).inflationFactor,1.04**2.5));
    test("periodo cero produce identidad", () => { const r=e.calculateCumulativeInflation({inflationRate:9,years:0}); equal(r.inflationFactor,1); equal(r.cumulativeInflation,0); });
    test("inflación cero produce identidad", () => { const r=e.calculateCumulativeInflation({inflationRate:0,years:50}); equal(r.inflationFactor,1); equal(r.priceStatus,e.PRICE_STATUS.NO_PRICE_CHANGE); });
    test("deflación válida", () => { const r=e.calculateCumulativeInflation({inflationRate:-.1,years:2}); close(r.inflationFactor,.81); equal(r.priceStatus,e.PRICE_STATUS.DEFLATION); });
    test("tasa positiva clasifica inflación", () => equal(e.calculateCumulativeInflation({inflationRate:.01,years:1}).priceStatus,e.PRICE_STATUS.INFLATION));
    test("tasa minúscula se clasifica sin cambio", () => equal(e.calculateCumulativeInflation({inflationRate:1e-14,years:1}).priceStatus,e.PRICE_STATUS.NO_PRICE_CHANGE));

    test("equivalente futuro", () => close(e.calculatePurchasingPower({amount:1000,inflationRate:.05,years:2}).futureEquivalent,1102.5));
    test("valor real", () => close(e.calculateRealValue({amount:1000,inflationRate:.05,years:2}).realValue,1000/1.1025));
    test("pérdida de poder con inflación", () => equal(e.calculatePurchasingPower({amount:100,inflationRate:.1,years:1}).purchasingPowerStatus,e.POWER_STATUS.LOST));
    test("ganancia de poder con deflación", () => equal(e.calculatePurchasingPower({amount:100,inflationRate:-.1,years:1}).purchasingPowerStatus,e.POWER_STATUS.GAINED));
    test("poder inalterado con inflación cero", () => equal(e.calculatePurchasingPower({amount:100,inflationRate:0,years:7}).purchasingPowerStatus,e.POWER_STATUS.UNCHANGED));
    test("importe cero es válido", () => { const r=e.calculatePurchasingPower({amount:0,inflationRate:.03,years:4}); valid(r); equal(r.futureEquivalent,0); equal(r.realValue,0); });
    test("periodo cero conserva importe", () => { const r=e.calculatePurchasingPower({amount:123,inflationRate:-.9,years:0}); equal(r.futureEquivalent,123); equal(r.realValue,123); });
    test("cambio de poder exacto", () => close(e.calculateRealValue({amount:500,inflationRate:.1,years:1}).purchasingPowerChange,1/1.1-1));
    test("función real no expone equivalente futuro redundante", () => assert(!Object.prototype.hasOwnProperty.call(e.calculateRealValue({amount:1,inflationRate:0,years:0}),"futureEquivalent")));

    test("comparación nominal", () => close(e.compareWithInflation({initialAmount:100,finalAmount:110,cumulativeInflation:.05}).nominalChange,.1));
    test("Fisher exacto sobre inflación acumulada", () => close(e.compareWithInflation({initialAmount:100,finalAmount:110,cumulativeInflation:.05}).realChange,1.1/1.05-1));
    test("por encima de inflación", () => equal(e.compareWithInflation({initialAmount:100,finalAmount:110,cumulativeInflation:.05}).comparisonStatus,e.COMPARISON_STATUS.ABOVE));
    test("por debajo de inflación", () => equal(e.compareWithInflation({initialAmount:100,finalAmount:102,cumulativeInflation:.05}).comparisonStatus,e.COMPARISON_STATUS.BELOW));
    test("iguala inflación", () => equal(e.compareWithInflation({initialAmount:100,finalAmount:105,cumulativeInflation:.05}).comparisonStatus,e.COMPARISON_STATUS.MATCHES));
    test("comparación acepta anual y años", () => close(e.compareWithInflation({initialAmount:100,finalAmount:121,inflationRate:.1,years:2}).realChange,0));
    test("comparación acepta deflación acumulada", () => { const r=e.compareWithInflation({initialAmount:100,finalAmount:95,cumulativeInflation:-.1}); valid(r); assert(r.realChange>0); });
    test("valor final cero es pérdida real total", () => equal(e.compareWithInflation({initialAmount:100,finalAmount:0,cumulativeInflation:.2}).realChange,-1));
    test("inflación cero conserva cambio nominal", () => { const r=e.compareWithInflation({initialAmount:100,finalAmount:80,cumulativeInflation:0}); close(r.realChange,r.nominalChange); });

    test("dispatcher poder", () => valid(e.calculateInflationImpact(e.MODE.PURCHASING_POWER,{amount:1,inflationRate:0,years:0})));
    test("dispatcher real", () => valid(e.calculateInflationImpact(e.MODE.REAL_VALUE,{amount:1,inflationRate:0,years:0})));
    test("dispatcher comparación", () => valid(e.calculateInflationImpact(e.MODE.COMPARE_WITH_INFLATION,{initialAmount:1,finalAmount:1,cumulativeInflation:0})));
    test("dispatcher rechaza modo desconocido", () => invalid(e.calculateInflationImpact("UNKNOWN",{}),"mode"));

    [undefined,null,""].forEach(value => test(`inflationRate ausente ${String(value)}`, () => invalid(e.calculateCumulativeInflation({inflationRate:value,years:1}),"inflationRate")));
    [NaN,Infinity,-Infinity,"2",true,{},[]].forEach(value => test(`inflationRate tipo inválido ${String(value)}`, () => invalid(e.calculateCumulativeInflation({inflationRate:value,years:1}),"inflationRate")));
    test("inflación -100% se rechaza", () => invalid(e.calculateCumulativeInflation({inflationRate:-1,years:1}),"inflationRate"));
    test("inflación inferior a -100% se rechaza", () => invalid(e.calculateCumulativeInflation({inflationRate:-1.01,years:1}),"inflationRate"));
    test("inflación rozando -100% es válida", () => valid(e.calculateCumulativeInflation({inflationRate:-.999999,years:1})));
    [undefined,null,"",NaN,Infinity,"1",false].forEach(value => test(`years inválido ${String(value)}`, () => invalid(e.calculateCumulativeInflation({inflationRate:0,years:value}),"years")));
    test("años negativos se rechazan", () => invalid(e.calculateCumulativeInflation({inflationRate:0,years:-.1}),"years"));
    [undefined,null,"",NaN,Infinity,-1,"1",false].forEach(value => test(`amount inválido ${String(value)}`, () => invalid(e.calculatePurchasingPower({amount:value,inflationRate:0,years:1}),"amount")));
    test("initialAmount cero se rechaza", () => invalid(e.compareWithInflation({initialAmount:0,finalAmount:1,cumulativeInflation:0}),"initialAmount"));
    test("finalAmount negativo se rechaza", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:-1,cumulativeInflation:0}),"finalAmount"));
    test("comparación sin inflación se rechaza", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:1}),"inflation"));
    test("comparación rechaza fuentes ambiguas", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:1,cumulativeInflation:0,inflationRate:0,years:1}),"inflation"));
    test("comparación rechaza anual sin años", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:1,inflationRate:.02}),"years"));
    test("comparación rechaza años sin anual", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:1,years:2}),"inflationRate"));
    test("acumulada -100% se rechaza", () => invalid(e.compareWithInflation({initialAmount:1,finalAmount:1,cumulativeInflation:-1}),"cumulativeInflation"));
    test("input null se rechaza", () => invalid(e.calculatePurchasingPower(null),"input"));
    test("input array se rechaza", () => invalid(e.compareWithInflation([]),"input"));

    test("overflow de factor es controlado", () => invalid(e.calculateCumulativeInflation({inflationRate:Number.MAX_VALUE,years:2}),"result"));
    test("subdesbordamiento de factor es controlado", () => invalid(e.calculateCumulativeInflation({inflationRate:-.9999999999999999,years:1000}),"result"));
    test("overflow monetario es controlado", () => invalid(e.calculatePurchasingPower({amount:Number.MAX_VALUE,inflationRate:1,years:1}),"result"));
    test("importe enorme con identidad permanece finito", () => { const r=e.calculatePurchasingPower({amount:Number.MAX_VALUE,inflationRate:0,years:999}); valid(r); equal(r.realValue,Number.MAX_VALUE); });
    test("importe subnormal permanece finito", () => valid(e.calculatePurchasingPower({amount:Number.MIN_VALUE,inflationRate:0,years:1})));
    test("resultado exitoso nunca contiene NaN o Infinity", () => { const r=e.calculatePurchasingPower({amount:1e200,inflationRate:.02,years:20}); Object.keys(r).forEach(k=>{ if(typeof r[k]==="number") assert(Number.isFinite(r[k])); }); });

    test("identidad futuro dividido por factor", () => { const r=e.calculatePurchasingPower({amount:777,inflationRate:.037,years:12.5}); close(r.futureEquivalent/r.inflationFactor,777); });
    test("identidad real por factor", () => { const r=e.calculateRealValue({amount:777,inflationRate:-.02,years:3.25}); close(r.realValue*r.inflationFactor,777); });
    test("composición temporal", () => { const a=e.calculateCumulativeInflation({inflationRate:.07,years:2.5}); const b=e.calculateCumulativeInflation({inflationRate:.07,years:4}); const c=e.calculateCumulativeInflation({inflationRate:.07,years:6.5}); close(a.inflationFactor*b.inflationFactor,c.inflationFactor); });
    test("Fisher recompone nominal", () => { const r=e.compareWithInflation({initialAmount:80,finalAmount:137,cumulativeInflation:.234}); close((1+r.realChange)*(1+r.cumulativeInflation)-1,r.nominalChange); });
    test("anual compuesto equivale a acumulada", () => { const a=e.compareWithInflation({initialAmount:100,finalAmount:130,inflationRate:.04,years:5}); const b=e.compareWithInflation({initialAmount:100,finalAmount:130,cumulativeInflation:1.04**5-1}); close(a.realChange,b.realChange); });
    test("las funciones no mutan entradas", () => { const input={amount:100,inflationRate:.03,years:2}; const before=JSON.stringify(input); e.calculatePurchasingPower(input); equal(JSON.stringify(input),before); });
    test("comparación no muta entrada", () => { const input={initialAmount:1,finalAmount:2,cumulativeInflation:.1}; const before=JSON.stringify(input); e.compareWithInflation(input); equal(JSON.stringify(input),before); });
    test("resultados y errores están congelados", () => { assert(Object.isFrozen(e.calculateRealValue({amount:1,inflationRate:0,years:0}))); const r=e.calculateRealValue({}); assert(Object.isFrozen(r)); assert(Object.isFrozen(r.errors)); assert(Object.isFrozen(r.errors[0])); });
    test("API y catálogos están congelados", () => { assert(Object.isFrozen(e)); assert(Object.isFrozen(e.MODE)); assert(Object.isFrozen(e.CONFIG)); });

    // Auditoría adversarial de congelación: referencias y propiedades no
    // cubiertas por la suite base de 83 comprobaciones.
    test("referencias adicionales de capitalización", () => {
        for (const [rate,years,expected] of [[.02,30,1.8113615841033538],[-.02,10,.8170728068875467],[-.5,1,.5],[-.99,1,.01],[.08,.5,1.0392304845413265],[.04,25.25,2.692103900654577]]) {
            close(e.calculateCumulativeInflation({inflationRate:rate,years}).inflationFactor,expected,2e-15);
        }
    });
    test("referencias salariales Fisher", () => {
        close(e.compareWithInflation({initialAmount:1500,finalAmount:1750,cumulativeInflation:.25}).realChange,-1/15);
        equal(e.compareWithInflation({initialAmount:100,finalAmount:110,cumulativeInflation:.1}).comparisonStatus,e.COMPARISON_STATUS.MATCHES);
        equal(e.compareWithInflation({initialAmount:100,finalAmount:105,cumulativeInflation:.1}).comparisonStatus,e.COMPARISON_STATUS.BELOW);
        equal(e.compareWithInflation({initialAmount:100,finalAmount:115,cumulativeInflation:.1}).comparisonStatus,e.COMPARISON_STATUS.ABOVE);
    });
    test("matriz inversa bidireccional de 120 casos", () => {
        const relative = (actual, expected) => assert(Math.abs(actual-expected) <= 2e-13*Math.max(Math.abs(actual),Math.abs(expected),Number.MIN_VALUE), `${actual} != ${expected}`);
        const amounts=[1e-100,.01,1,1e100], rates=[-.99,-.5,-.02,0,.03,2], periods=[.01,.5,1.25,10.75,25.25];
        for (const amount of amounts) for (const inflationRate of rates) for (const years of periods) {
            const forward=e.calculatePurchasingPower({amount,inflationRate,years}); valid(forward);
            const backward=e.calculateRealValue({amount:forward.futureEquivalent,inflationRate,years}); valid(backward); relative(backward.realValue,amount);
            const real=e.calculateRealValue({amount,inflationRate,years}); valid(real);
            const restored=e.calculatePurchasingPower({amount:real.realValue,inflationRate,years}); valid(restored); relative(restored.futureEquivalent,amount);
        }
    });
    test("escalera de deflación extrema conserva factor positivo", () => {
        for (const rate of [-.9,-.99,-.999,-.9999,-.99999999,-.9999999999999999]) {
            const r=e.calculateCumulativeInflation({inflationRate:rate,years:1}); valid(r); assert(r.inflationFactor>0); assert(Number.isFinite(r.inflationFactor));
        }
    });
    test("deflación extrema con exponentes fraccionarios", () => {
        for (const rate of [-.9,-.99,-.99999999]) for (const years of [.01,.1,.5,1.25,10.75,25.25]) {
            const r=e.calculateCumulativeInflation({inflationRate:rate,years}); valid(r); assert(r.inflationFactor>0); close(r.inflationFactor,Math.pow(1+rate,years),2e-14);
        }
    });
    test("menos cero se trata como cero válido", () => {
        valid(e.calculatePurchasingPower({amount:-0,inflationRate:-0,years:-0}));
        equal(e.calculateCumulativeInflation({inflationRate:-0,years:-0}).priceStatus,e.PRICE_STATUS.NO_PRICE_CHANGE);
    });
    test("años máximos con tasa cero mantienen identidad", () => {
        const r=e.calculatePurchasingPower({amount:7,inflationRate:0,years:Number.MAX_VALUE}); valid(r); equal(r.futureEquivalent,7); equal(r.realValue,7);
    });
    test("cero por factor desbordado nunca produce éxito corrupto", () => invalid(e.calculatePurchasingPower({amount:0,inflationRate:Number.MAX_VALUE,years:Number.MAX_VALUE}),"result"));
    test("transición de tolerancia MATCHES es simétrica", () => {
        const at=e.compareWithInflation({initialAmount:1,finalAmount:1+5e-13,cumulativeInflation:0}); equal(at.comparisonStatus,e.COMPARISON_STATUS.MATCHES);
        const above=e.compareWithInflation({initialAmount:1,finalAmount:1+2e-12,cumulativeInflation:0}); equal(above.comparisonStatus,e.COMPARISON_STATUS.ABOVE);
        const below=e.compareWithInflation({initialAmount:1,finalAmount:1-2e-12,cumulativeInflation:0}); equal(below.comparisonStatus,e.COMPARISON_STATUS.BELOW);
    });
    test("Fisher con nominal cero e inflación positiva pierde", () => assert(e.compareWithInflation({initialAmount:1,finalAmount:1,cumulativeInflation:.1}).realChange<0));
    test("Fisher con nominal cero y deflación gana", () => assert(e.compareWithInflation({initialAmount:1,finalAmount:1,cumulativeInflation:-.1}).realChange>0));
    test("Fisher coincide directamente con cociente de factores", () => {
        const r=e.compareWithInflation({initialAmount:123,finalAmount:177,cumulativeInflation:.37}); close(1+r.realChange,(177/123)/1.37);
    });
    test("llamadas repetidas son deterministas y sin estado", () => {
        const input={initialAmount:1500,finalAmount:1750,inflationRate:.03,years:7.5};
        const first=JSON.stringify(e.compareWithInflation(input));
        for(let i=0;i<20;i+=1) equal(JSON.stringify(e.compareWithInflation(input)),first);
    });

    let passed = 0;
    const failures = [];
    tests.forEach(item => {
        try { item.fn(); passed += 1; }
        catch (error) { failures.push(`${item.name}: ${error.message}`); }
    });
    const report = { total: tests.length, passed, failed: failures.length, failures };
    root.InflationEngineTestReport = report;
    if (typeof console !== "undefined" && console.log) console.log(JSON.stringify(report));
    if (failures.length) throw new Error(failures.join("\n"));
}(typeof globalThis !== "undefined" ? globalThis : this));
InflationEngineTestReport;
