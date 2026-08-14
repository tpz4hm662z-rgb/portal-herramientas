"use strict";
(function(root){
 const t=root.ImoancyBodyFatTracking;let passed=0,failures=[];
 function test(n,f){try{f();passed++}catch(e){failures.push("comparability · "+n+": "+e.message)}}function ok(x){if(!x)throw Error("assertion failed")}function eq(a,b){if(a!==b)throw Error(a+" !== "+b)}
 function rec(id,date,method,weight,waist){return t.createMeasurement({id:id,measuredAt:date,methodId:method,observed:{sex:"female",ageYears:35,heightCm:165,weightKg:weight,waistCm:waist}})}
 test("mismo método y versión",()=>ok(t.compareMeasurements(rec("comp_001","2026-01-01T00:00:00Z","cun-bae",65),rec("comp_002","2026-02-01T00:00:00Z","cun-bae",64)).compatibleForEstimatedTrend));
 test("métodos distintos incompatibles",()=>{const r=t.compareMeasurements(rec("comp_003","2026-01-01T00:00:00Z","cun-bae",65,75),rec("comp_004","2026-02-01T00:00:00Z","rfm",64,74));eq(r.compatibleForEstimatedTrend,false);eq(r.estimatedDelta,null)});
 test("versión distinta no produce delta",()=>{const a=rec("comp_005","2026-01-01T00:00:00Z","cun-bae",65),b=JSON.parse(JSON.stringify(rec("comp_006","2026-02-01T00:00:00Z","cun-bae",64)));b.method.version="future";const r=t.compareMeasurements(a,b);eq(r.compatibleForEstimatedTrend,false);eq(r.estimatedDelta,null)});
 test("cintura ausente da delta observado nulo",()=>eq(t.compareMeasurements(rec("comp_007","2026-01-01T00:00:00Z","cun-bae",65),rec("comp_008","2026-02-01T00:00:00Z","cun-bae",64)).observedDelta.waistCm,null));
 test("peso igual es cero",()=>eq(t.compareMeasurements(rec("comp_009","2026-01-01T00:00:00Z","cun-bae",65),rec("comp_010","2026-02-01T00:00:00Z","cun-bae",65)).observedDelta.weightKg,0));
 test("fecha igual se rechaza",()=>{try{t.compareMeasurements(rec("comp_011","2026-01-01T00:00:00Z","cun-bae",65),rec("comp_012","2026-01-01T00:00:00Z","cun-bae",64))}catch(e){return}throw Error("aceptada")});
 test("orden inverso se rechaza",()=>{try{t.compareMeasurements(rec("comp_013","2026-02-01T00:00:00Z","cun-bae",65),rec("comp_014","2026-01-01T00:00:00Z","cun-bae",64))}catch(e){return}throw Error("aceptado")});
 (root.ImoancyBodyFatPhase2Suites||(root.ImoancyBodyFatPhase2Suites=[])).push({passed:passed,failed:failures.length,failures:failures});
})(globalThis);
