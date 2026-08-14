"use strict";
(function(root){
 const t=root.ImoancyBodyFatTracking;let passed=0,failures=[];
 function test(n,f){try{f();passed++}catch(e){failures.push("schema · "+n+": "+e.message)}}function ok(x){if(!x)throw Error("assertion failed")}function eq(a,b){if(a!==b)throw Error(a+" !== "+b)}
 function rec(id,date,method,extra){return t.createMeasurement({id:id,measuredAt:date,methodId:method,observed:Object.assign({sex:"female",ageYears:35,heightCm:165,weightKg:65},extra||{})})}
 test("registro serializado sigue válido",()=>{const x=JSON.parse(JSON.stringify(rec("schema_001","2026-01-01T10:00:00Z","cun-bae")));ok(t.validateMeasurement(x))});
 test("detecta resultado manipulado",()=>{const x=JSON.parse(JSON.stringify(rec("schema_002","2026-01-01T10:00:00Z","cun-bae")));x.estimated.bodyFatPercent+=1;ok(!t.validateMeasurement(x))});
 test("conserva versión anterior estructuralmente válida",()=>{const x=JSON.parse(JSON.stringify(rec("schema_003","2026-01-01T10:00:00Z","cun-bae")));x.method.version="anterior";ok(t.validateMeasurement(x))});
 test("agrupa dos métodos por instante",()=>{const d="2026-01-01T10:00:00Z",g=t.groupByMeasuredAt([rec("schema_004",d,"cun-bae",{waistCm:75}),rec("schema_005",d,"rfm",{waistCm:75})]);eq(g.length,1);eq(g[0].measurements.length,2)});
 test("ordena cronológicamente",()=>{const g=t.groupByMeasuredAt([rec("schema_006","2026-02-01T10:00:00Z","cun-bae"),rec("schema_007","2026-01-01T10:00:00Z","cun-bae")]);eq(g[0].measuredAt,"2026-01-01T10:00:00.000Z")});
 test("ignora registro corrupto al agrupar",()=>eq(t.groupByMeasuredAt([{},rec("schema_008","2026-01-01T10:00:00Z","cun-bae")]).length,1));
 test("protocolo RFM exacto se conserva",()=>ok(rec("schema_009","2026-01-01T10:00:00Z","rfm",{waistCm:75}).protocol.waist.indexOf("ilion derecho")>=0));
 (root.ImoancyBodyFatPhase2Suites||(root.ImoancyBodyFatPhase2Suites=[])).push({passed:passed,failed:failures.length,failures:failures});
})(globalThis);
