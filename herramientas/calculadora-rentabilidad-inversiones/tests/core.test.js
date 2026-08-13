"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const e = require("../js/core.js");
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const base = changes => Object.assign({ initialInvestment: 1000, finalValue: 1100, startDate: "2024-01-01", endDate: "2025-01-01" }, changes);

test("ganancia normal", () => { const r=e.calculateInvestmentReturn(base()); assert.equal(r.status,e.STATUS.GAIN); assert.equal(r.profit,100); });
test("pérdida económica válida", () => { const r=e.calculateInvestmentReturn(base({finalValue:800})); assert.equal(r.status,e.STATUS.LOSS); close(r.totalReturn,-.2); });
test("break-even", () => assert.equal(e.calculateInvestmentReturn(base({finalValue:1000})).status,e.STATUS.BREAK_EVEN));
test("valor final cero y ROI -100%", () => { const r=e.calculateInvestmentReturn(base({finalValue:0})); assert.equal(r.totalReturn,-1); assert.equal(r.multiple,0); assert.equal(r.cagr,null); });
test("ROI +100%", () => assert.equal(e.calculateInvestmentReturn(base({finalValue:2000})).totalReturn,1));
test("CAGR un año civil bisiesto usa 366/365", () => close(e.calculateInvestmentReturn(base()).cagr,1.1**(365/366)-1));
test("CAGR varios años", () => close(e.calculateInvestmentReturn(base({finalValue:1210,startDate:"2021-01-01",endDate:"2023-01-01"})).cagr,.1));
test("fechas no exactamente anuales", () => { const r=e.calculateInvestmentReturn(base({endDate:"2024-07-01"})); close(r.durationDays,182); close(r.cagr,1.1**(365/182)-1); });
test("periodo inferior a año", () => assert.ok(e.calculateInvestmentReturn(base({endDate:"2024-07-01"})).cagr>.1));
test("ingresos forman beneficio bruto", () => { const r=e.calculateInvestmentReturn(base({income:50})); assert.equal(r.grossProfit,150); close(r.grossReturn,.15); });
test("costes forman beneficio neto", () => { const r=e.calculateInvestmentReturn(base({income:50,costs:20})); assert.equal(r.netProfit,130); close(r.netReturn,.13); });
test("costes mayores que beneficio", () => assert.equal(e.calculateInvestmentReturn(base({costs:200})).status,e.STATUS.LOSS));
test("bruta positiva y neta negativa", () => { const r=e.calculateInvestmentReturn(base({income:10,costs:150})); assert.ok(r.grossReturn>0); assert.ok(r.netReturn<0); });
test("inflación cero conserva nominal", () => { const r=e.calculateInvestmentReturn(base({inflationRate:0})); close(r.realAnnualReturn,r.cagr); });
test("rentabilidad real Fisher positiva", () => { const r=e.calculateInvestmentReturn(base({inflationRate:.02})); close(r.realAnnualReturn,(1+r.cagr)/1.02-1); assert.ok(r.realAnnualReturn>0); });
test("rentabilidad real negativa", () => assert.ok(e.calculateInvestmentReturn(base({finalValue:950,inflationRate:.02})).realAnnualReturn<0));
test("nominal inferior a inflación", () => assert.ok(e.calculateInvestmentReturn(base({finalValue:1010,inflationRate:.05})).realAnnualReturn<0));
test("multiplicador usa solo valor terminal", () => assert.equal(e.calculateInvestmentReturn(base({income:500})).multiple,1.1));

test("XNPV dos flujos a 10%", () => close(e.xnpv(.1,[{date:"2021-01-01",amount:-1000},{date:"2022-01-01",amount:1100}]),0,1e-10));
test("XIRR dos flujos", () => close(e.calculateXirr([{date:"2021-01-01",amount:-1000},{date:"2022-01-01",amount:1100}]).xirr,.1,1e-9));
test("XIRR referencia conceptual Excel con fechas irregulares", () => {
  const flows=[{date:"2008-01-01",amount:-10000},{date:"2008-03-01",amount:2750},{date:"2008-10-30",amount:4250},{date:"2009-02-15",amount:3250},{date:"2009-04-01",amount:2750}];
  close(e.calculateXirr(flows).xirr,.373362535,1e-8);
});
test("aportación intermedia", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:-1000},{date:"2020-07-01",amount:-200},{date:"2021-01-01",amount:1400}]).status,e.XIRR_STATUS.OK));
test("retirada intermedia", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:-1000},{date:"2020-07-01",amount:100},{date:"2021-01-01",amount:1000}]).status,e.XIRR_STATUS.OK));
test("dividendo y fechas irregulares", () => assert.equal(e.calculateXirr([{date:"2020-01-10",amount:-1000},{date:"2020-05-23",amount:30},{date:"2021-02-17",amount:1100}]).status,e.XIRR_STATUS.OK));
test("inversión abierta: valoración terminal virtual", () => assert.equal(e.calculateXirr([{date:"2023-01-01",amount:-10000},{date:"2024-01-01",amount:-2000},{date:"2026-08-13",amount:15400}]).status,e.XIRR_STATUS.OK));
test("flujos desordenados producen misma XIRR", () => { const a=[{date:"2020-01-01",amount:-1000},{date:"2021-01-01",amount:1100}]; close(e.calculateXirr(a.slice().reverse()).xirr,e.calculateXirr(a).xirr); });
test("flujos de igual fecha se combinan", () => { const n=e.normalizeCashFlows([{date:"2020-01-01",amount:-1000},{date:"2020-01-01",amount:-100},{date:"2021-01-01",amount:1210}]); assert.equal(n.cashFlows.length,2); assert.equal(n.cashFlows[0].amount,-1100); });
test("solo positivos no tiene XIRR", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:1},{date:"2021-01-01",amount:2}]).status,e.XIRR_STATUS.NOT_FOUND));
test("solo negativos no tiene XIRR", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:-1},{date:"2021-01-01",amount:-2}]).status,e.XIRR_STATUS.NOT_FOUND));
test("XIRR inexistente", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:-100},{date:"2021-01-01",amount:10},{date:"2022-01-01",amount:-100}]).status,e.XIRR_STATUS.NOT_FOUND));
test("múltiples XIRR se declaran sin elegir raíz", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-100},{date:"2022-01-01",amount:230},{date:"2023-01-01",amount:-132}]); assert.equal(r.status,e.XIRR_STATUS.MULTIPLE); assert.equal(r.xirr,null); close(r.roots[0],.1,1e-7); close(r.roots[1],.2,1e-7); });
test("raíces próximas de 10 % y 11 % no se colapsan ni se omiten", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-100},{date:"2022-01-01",amount:221},{date:"2023-01-01",amount:-122.1}]); assert.equal(r.status,e.XIRR_STATUS.MULTIPLE); assert.equal(r.xirr,null); close(r.roots[0],.1,1e-7); close(r.roots[1],.11,1e-7); });
test("cash flows desactiva CAGR y usa XIRR", () => { const r=e.calculateInvestmentReturn(base({cashFlows:[{date:"2021-01-01",amount:-1000},{date:"2022-01-01",amount:1100}]})); assert.equal(r.cagr,null); close(r.xirr,.1); });

for (const [name, changes, field] of [
 ["NaN",{initialInvestment:NaN},"initialInvestment"], ["Infinity",{finalValue:Infinity},"finalValue"], ["inversión vacía",{initialInvestment:""},"initialInvestment"],
 ["fecha inválida",{startDate:"2024-02-30"},"startDate"], ["fecha final igual",{endDate:"2024-01-01"},"endDate"], ["fecha final anterior",{endDate:"2023-01-01"},"endDate"],
 ["inversión cero",{initialInvestment:0},"initialInvestment"], ["coste negativo",{costs:-1},"costs"], ["ingreso negativo",{income:-1},"income"],
 ["inflación -100%",{inflationRate:-1},"inflationRate"]
]) test(`validación: ${name}`,()=>{ const r=e.calculateInvestmentReturn(base(changes)); assert.equal(r.status,e.STATUS.INVALID_INPUT); assert.ok(r.errors.some(x=>x.field===field)); });
test("cero se distingue de ausencia en opcionales", () => { const r=e.calculateInvestmentReturn(base({income:0,costs:0,inflationRate:0})); assert.notEqual(r.status,e.STATUS.INVALID_INPUT); });
test("vacío explícito no equivale a cero en opcionales", () => assert.equal(e.calculateInvestmentReturn(base({income:""})).errors[0].code,"missing"));
test("null explícito no equivale a cero en opcionales", () => assert.equal(e.calculateInvestmentReturn(base({costs:null})).errors[0].code,"missing"));
test("valor final ausente se rechaza", () => { const x=base(); delete x.finalValue; assert.equal(e.calculateInvestmentReturn(x).errors[0].code,"missing"); });
test("flujo con cantidad vacía no equivale a cero", () => assert.ok(e.normalizeCashFlows([{date:"2020-01-01",amount:""},{date:"2021-01-01",amount:1}]).errors));

test("valores grandes finitos", () => { const r=e.calculateInvestmentReturn(base({initialInvestment:1e200,finalValue:1.1e200})); assert.notEqual(r.status,e.STATUS.INVALID_INPUT); assert.ok(Object.values(r).filter(x=>typeof x==="number").every(Number.isFinite)); });
test("valores monetarios pequeños", () => close(e.calculateInvestmentReturn(base({initialInvestment:.01,finalValue:.011})).totalReturn,.1));
test("resultado próximo a cero es break-even", () => assert.equal(e.calculateInvestmentReturn(base({finalValue:1000+1e-10})).status,e.STATUS.BREAK_EVEN));
test("año bisiesto cuenta días civiles", () => assert.equal(e.calculateInvestmentReturn(base({startDate:"2024-02-28",endDate:"2024-03-01"})).durationDays,2));
test("DST no altera duración", () => assert.equal(e.calculateInvestmentReturn(base({startDate:"2024-03-30",endDate:"2024-04-01"})).durationDays,2));
test("un día calcula y advierte", () => { const r=e.calculateInvestmentReturn(base({endDate:"2024-01-02"})); assert.ok(Number.isFinite(r.cagr)); assert.deepEqual(r.warnings,[e.WARNING.VERY_SHORT_PERIOD]); });
test("cercana a -100% XIRR", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-1000},{date:"2022-01-01",amount:.001}]); assert.equal(r.status,e.XIRR_STATUS.OK); close(r.xirr,-.999999,1e-8); });
test("XIRR extraordinariamente alta dentro del límite", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-1},{date:"2022-01-01",amount:100001}]); assert.equal(r.status,e.XIRR_STATUS.OK); close(r.xirr,100000,1e-6); });
test("flujos diminutos", () => close(e.calculateXirr([{date:"2021-01-01",amount:-1e-100},{date:"2022-01-01",amount:1.1e-100}]).xirr,.1,1e-8));
test("flujos enormes no desbordan", () => close(e.calculateXirr([{date:"2021-01-01",amount:-1e300},{date:"2022-01-01",amount:1.1e300}]).xirr,.1,1e-8));
test("movimientos que se cancelan en misma fecha se toleran", () => assert.equal(e.calculateXirr([{date:"2020-01-01",amount:-100},{date:"2020-06-01",amount:50},{date:"2020-06-01",amount:-50},{date:"2021-01-01",amount:110}]).status,e.XIRR_STATUS.OK));
test("todas las salidas financieras válidas son finitas o null", () => { const r=e.calculateInvestmentReturn(base({finalValue:0,inflationRate:0})); ["profit","grossProfit","netProfit","totalReturn","grossReturn","netReturn","multiple","durationDays","durationYears"].forEach(k=>assert.ok(Number.isFinite(r[k]))); assert.equal(r.cagr,null); });

test("inflación negativa válida aplica Fisher", () => { const r=e.calculateInvestmentReturn(base({inflationRate:-.02})); close(r.realAnnualReturn,(1+r.cagr)/.98-1); });
test("inflación próxima a -100 % permanece finita", () => assert.ok(Number.isFinite(e.calculateInvestmentReturn(base({inflationRate:-.999999})).realAnnualReturn)));
test("valor terminal positivo mínimo no genera NaN", () => { const r=e.calculateInvestmentReturn(base({finalValue:Number.MIN_VALUE})); assert.ok(r.cagr===null || Number.isFinite(r.cagr)); });
test("Number.MAX_VALUE en identidad estable permanece finito", () => { const r=e.calculateInvestmentReturn(base({initialInvestment:Number.MAX_VALUE,finalValue:Number.MAX_VALUE})); assert.equal(r.status,e.STATUS.BREAK_EVEN); assert.equal(r.multiple,1); });
test("overflow económico se convierte en INVALID_INPUT", () => assert.equal(e.calculateInvestmentReturn(base({initialInvestment:1,finalValue:Number.MAX_VALUE,income:Number.MAX_VALUE})).status,e.STATUS.INVALID_INPUT));
test("raíz tangencial conocida no se inventa ni duplica", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-100},{date:"2022-01-01",amount:200},{date:"2023-01-01",amount:-100}]); assert.equal(r.status,e.XIRR_STATUS.OK); close(r.xirr,0,1e-8); });
test("tres raíces conocidas devuelven MULTIPLE_XIRR", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-100},{date:"2022-01-01",amount:600},{date:"2023-01-01",amount:-1100},{date:"2024-01-01",amount:600}]); assert.equal(r.status,e.XIRR_STATUS.MULTIPLE); assert.equal(r.roots.length,3); close(r.roots[0],0,1e-7); close(r.roots[1],1,1e-7); close(r.roots[2],2,1e-7); });
test("raíz fuera del máximo fiable devuelve NOT_FOUND", () => assert.equal(e.calculateXirr([{date:"2021-01-01",amount:-1},{date:"2022-01-01",amount:2000000}]).status,e.XIRR_STATUS.NOT_FOUND));
test("XNPV rechaza tasa -100 %, NaN e Infinity", () => { const f=[{date:"2021-01-01",amount:-1},{date:"2022-01-01",amount:2}]; assert.equal(e.xnpv(-1,f),null); assert.equal(e.xnpv(NaN,f),null); assert.equal(e.xnpv(Infinity,f),null); });
test("tipos numéricos string, espacio, booleano y objeto se rechazan", () => { for (const value of ["0"," ",true,{}]) assert.equal(e.calculateInvestmentReturn(base({income:value})).status,e.STATUS.INVALID_INPUT); });
test("-Infinity se rechaza", () => assert.equal(e.calculateInvestmentReturn(base({costs:-Infinity})).status,e.STATUS.INVALID_INPUT));
test("input array, null y undefined se rechaza", () => { for (const value of [[],null,undefined]) assert.equal(e.calculateInvestmentReturn(value).status,e.STATUS.INVALID_INPUT); });
test("cashFlows vacío, null y no-array se rechazan", () => { for (const value of [[],null,{}]) assert.ok(e.normalizeCashFlows(value).errors); });
test("flujo incompleto o de tipo incorrecto se rechaza", () => { assert.ok(e.normalizeCashFlows([{date:"2021-01-01",amount:-1},{date:"2022-01-01"}]).errors); assert.ok(e.normalizeCashFlows([{date:"2021-01-01",amount:-1},[]]).errors); });
test("formatos con hora, zona o sin ceros se rechazan", () => { for (const date of ["2021-1-01","2021-01-01T00:00:00Z","01/01/2021"]) assert.equal(e.calculateInvestmentReturn(base({startDate:date})).status,e.STATUS.INVALID_INPUT); });
test("normalizeCashFlows no muta ni reordena la entrada", () => { const input=[{date:"2022-01-01",amount:110},{date:"2021-01-01",amount:-100}], before=JSON.stringify(input); e.normalizeCashFlows(input); assert.equal(JSON.stringify(input),before); });
test("calculateXirr no muta flujos", () => { const input=[{date:"2022-01-01",amount:110},{date:"2021-01-01",amount:-100}], before=JSON.stringify(input); e.calculateXirr(input); assert.equal(JSON.stringify(input),before); });
test("calculateInvestmentReturn no muta objeto ni flujos", () => { const input=base({cashFlows:[{date:"2022-01-01",amount:110},{date:"2021-01-01",amount:-100}]}); const before=JSON.stringify(input); e.calculateInvestmentReturn(input); assert.equal(JSON.stringify(input),before); });
test("muchos movimientos repetidos se agregan sin mutar", () => { const input=[{date:"2021-01-01",amount:-100},{date:"2021-01-01",amount:-50},{date:"2022-01-01",amount:165},{date:"2022-01-01",amount:0}]; const r=e.normalizeCashFlows(input); assert.equal(r.cashFlows.length,2); assert.equal(r.cashFlows[0].amount,-150); assert.equal(r.cashFlows[1].amount,165); });
test("periodo XIRR de un día converge", () => { const r=e.calculateXirr([{date:"2021-01-01",amount:-100},{date:"2021-01-02",amount:100.01}]); assert.equal(r.status,e.XIRR_STATUS.OK); assert.ok(Number.isFinite(r.xirr)); });

// Referencias independientes obtenidas con bisección Python sobre la fórmula
// Actual/365 (sin reutilizar código ni tolerancias del motor Imoancy).
for (const [name, flows, expected] of [
 ["simple",[["2021-01-01",-1000],["2022-01-01",1100]],.1],
 ["aportaciones",[["2020-01-01",-1000],["2020-07-01",-200],["2021-01-01",1400]],.181880733732155],
 ["retirada",[["2020-01-01",-1000],["2020-07-01",100],["2021-01-01",1000]],.104853208738785],
 ["dividendo",[["2020-01-10",-1000],["2020-05-23",30],["2021-02-17",1100]],.119070533477868],
 ["irregular Excel",[["2008-01-01",-10000],["2008-03-01",2750],["2008-10-30",4250],["2009-02-15",3250],["2009-04-01",2750]],.373362533518831],
 ["atraviesa bisiesto",[["2019-07-01",-1000],["2020-03-01",-250],["2021-07-01",1500]],.102267246143483],
 ["negativa",[["2021-01-01",-1000],["2022-01-01",900]],-.1],
 ["elevada",[["2021-01-01",-100],["2022-01-01",1000]],9]
]) test(`referencia independiente XIRR: ${name}`, () => close(e.calculateXirr(flows.map(([date,amount])=>({date,amount}))).xirr,expected,1e-8));
