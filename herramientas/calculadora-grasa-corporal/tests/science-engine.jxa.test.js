"use strict";
(function (root) {
    const s = root.ImoancyBodyFatScience, t = root.ImoancyBodyFatTracking;
    let passed = 0, failures = [];
    function test(name, fn) { try { fn(); passed++; } catch (e) { failures.push(name + ": " + e.message); } }
    function ok(x) { if (!x) throw Error("assertion failed"); }
    function eq(a,b) { if (a !== b) throw Error(a + " !== " + b); }
    function close(a,b) { if (Math.abs(a-b) > 1e-10) throw Error(a + " != " + b); }
    function throwsCode(fn, code) { try { fn(); } catch(e) { if (e.code === code) return; throw e; } throw Error("no lanzó " + code); }
    function cun(i) { const b=i.weightKg/((i.heightCm/100)**2), x=i.sex==="female"?1:0, b2=b*b; return -44.988+.503*i.ageYears+10.689*x+3.172*b-.026*b2+.181*b*x-.02*b*i.ageYears-.005*b2*x+.00021*b2*i.ageYears; }
    function rec(id,date,methodId,observed) { return t.createMeasurement({id:id,measuredAt:date,methodId:methodId,observed:observed}); }

    [
      {sex:"male",ageYears:40,heightCm:180,weightKg:80},
      {sex:"female",ageYears:35,heightCm:165,weightKg:65},
      {sex:"male",ageYears:18,heightCm:200,weightKg:60},
      {sex:"female",ageYears:80,heightCm:150,weightKg:130}
    ].forEach((i,n)=>test("CUN independiente "+n,()=>{const r=s.calculateCunBae(i);close(r.bodyFatPercent,cun(i));close(r.fatMassKg+r.fatFreeMassKg,i.weightKg)}));
    test("dispatch",()=>eq(s.calculate("cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:70}).methodId,"cun-bae"));
    test("RFM hombre",()=>close(s.calculateRfm({sex:"male",ageYears:30,heightCm:180,waistCm:90}).bodyFatPercent,24));
    test("RFM mujer",()=>close(s.calculateRfm({sex:"female",ageYears:30,heightCm:180,waistCm:90}).bodyFatPercent,36));
    test("RFM masas",()=>{const r=s.calculateRfm({sex:"male",ageYears:30,heightCm:180,waistCm:90,weightKg:75});close(r.fatMassKg+r.fatFreeMassKg,75)});
    test("redondeo",()=>{eq(s.roundForDisplay(18.73),19);eq(s.roundForDisplay(18.49),18)});
    test("determinismo",()=>{const i={sex:"female",ageYears:45,heightCm:170,weightKg:72};eq(JSON.stringify(s.calculateCunBae(i)),JSON.stringify(s.calculateCunBae(i)))});
    [[0,"OUT_OF_RANGE"],[-1,"OUT_OF_RANGE"],[NaN,"INVALID_NUMBER"],[Infinity,"INVALID_NUMBER"],[null,"INVALID_NUMBER"],["70","INVALID_NUMBER"],["","INVALID_NUMBER"]].forEach((x,n)=>test("peso hostil "+n,()=>throwsCode(()=>s.calculateCunBae({sex:"male",ageYears:30,heightCm:175,weightKg:x[0]}),x[1])));
    test("edad decimal",()=>throwsCode(()=>s.calculateCunBae({sex:"male",ageYears:30.5,heightCm:175,weightKg:70}),"NOT_INTEGER"));
    test("sexo",()=>throwsCode(()=>s.calculateCunBae({sex:"x",ageYears:30,heightCm:175,weightKg:70}),"INVALID_SEX"));
    test("método",()=>throwsCode(()=>s.calculate("navy",{}),"UNKNOWN_METHOD"));
    test("CUN >80",()=>throwsCode(()=>s.calculateCunBae({sex:"male",ageYears:81,heightCm:175,weightKg:70}),"OUTSIDE_METHOD_POPULATION"));
    test("RFM <20",()=>throwsCode(()=>s.calculateRfm({sex:"male",ageYears:19,heightCm:175,waistCm:80}),"OUTSIDE_METHOD_POPULATION"));
    test("BMI imposible",()=>throwsCode(()=>s.calculateCunBae({sex:"male",ageYears:30,heightCm:120,weightKg:300}),"OUT_OF_RANGE"));
    test("cintura imposible",()=>throwsCode(()=>s.calculateRfm({sex:"female",ageYears:30,heightCm:150,waistCm:150}),"IMPLAUSIBLE_COMBINATION"));
    test("sin IC ficticio",()=>eq(s.calculateCunBae({sex:"male",ageYears:30,heightCm:175,weightKg:70}).uncertainty.individualIntervalAvailable,false));
    test("registro versionado",()=>{const r=rec("measure_001","2026-01-01T10:00:00Z","cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:70});eq(r.schemaVersion,1);eq(r.method.engineVersion,"1.0.0")});
    test("delta compatible",()=>{const a=rec("measure_001","2026-01-01T10:00:00Z","cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:70}),b=rec("measure_002","2026-02-01T10:00:00Z","cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:69}),c=t.compareMeasurements(a,b);ok(c.compatibleForEstimatedTrend);eq(c.observedDelta.weightKg,-1);eq(c.interpretation,null)});
    test("métodos incompatibles",()=>{const a=rec("measure_001","2026-01-01T10:00:00Z","cun-bae",{sex:"female",ageYears:30,heightCm:165,weightKg:65}),b=rec("measure_002","2026-02-01T10:00:00Z","rfm",{sex:"female",ageYears:30,heightCm:165,waistCm:75,weightKg:65}),c=t.compareMeasurements(a,b);eq(c.compatibleForEstimatedTrend,false);eq(c.estimatedDelta,null)});
    test("registro corrupto",()=>{try{rec("x","bad","cun-bae",{});}catch(e){return;}throw Error("aceptado")});
    test("orden inverso",()=>{const a=rec("measure_001","2026-02-01T10:00:00Z","cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:70}),b=rec("measure_002","2026-01-01T10:00:00Z","cun-bae",{sex:"male",ageYears:30,heightCm:175,weightKg:70});try{t.compareMeasurements(a,b)}catch(e){return}throw Error("aceptado")});
    root.ImoancyBodyFatTestResult={passed:passed,failed:failures.length,failures:failures};
})(typeof globalThis!=="undefined"?globalThis:this);
