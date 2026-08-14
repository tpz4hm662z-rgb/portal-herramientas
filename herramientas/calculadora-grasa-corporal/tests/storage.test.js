"use strict";
(function(root){
 const t=root.ImoancyBodyFatTracking,F=root.ImoancyBodyFatHistoryStore;let passed=0,failures=[];
 function test(n,f){try{f();passed++}catch(e){failures.push("storage · "+n+": "+e.message)}}function ok(x){if(!x)throw Error("assertion failed")}function eq(a,b){if(a!==b)throw Error(a+" !== "+b)}
 function Memory(){this.data={}}Memory.prototype.getItem=function(k){return Object.prototype.hasOwnProperty.call(this.data,k)?this.data[k]:null};Memory.prototype.setItem=function(k,v){this.data[k]=String(v)};Memory.prototype.removeItem=function(k){delete this.data[k]};
 function rec(id,date){return t.createMeasurement({id:id,measuredAt:date,methodId:"cun-bae",observed:{sex:"male",ageYears:30,heightCm:175,weightKg:70}})}
 test("sin almacenamiento",()=>eq(F.createStore(null).read().status,"UNAVAILABLE"));
 test("primera visita vacía",()=>eq(F.createStore(new Memory()).read().status,"EMPTY"));
 test("guardar y recargar",()=>{const m=new Memory(),s=F.createStore(m);eq(s.add([rec("store_001","2026-01-01T10:00:00Z")]).status,"OK");eq(F.createStore(m).read().records.length,1)});
 test("no duplica registro razonable",()=>{const m=new Memory(),s=F.createStore(m),r=rec("store_002","2026-01-01T10:00:00Z");s.add([r]);s.add([r]);eq(s.read().records.length,1)});
 test("ordena fechas desordenadas",()=>{const m=new Memory(),s=F.createStore(m);s.add([rec("store_003","2026-02-01T10:00:00Z"),rec("store_004","2026-01-01T10:00:00Z")]);eq(s.read().records[0].id,"store_004")});
 test("elimina grupo temporal",()=>{const m=new Memory(),s=F.createStore(m),d="2026-01-01T10:00:00Z";s.add([rec("store_005",d)]);eq(s.removeAt(new Date(d).toISOString()).status,"OK");eq(s.read().records.length,0)});
 test("borra todo",()=>{const m=new Memory(),s=F.createStore(m);s.add([rec("store_006","2026-01-01T10:00:00Z")]);eq(s.clear().status,"OK");eq(s.read().status,"EMPTY")});
 test("JSON corrupto",()=>{const m=new Memory();m.data[F.STORAGE_KEY]="{";eq(F.createStore(m).read().status,"CORRUPT_DOCUMENT")});
 test("documento de otra versión",()=>{const m=new Memory();m.data[F.STORAGE_KEY]=JSON.stringify({schemaVersion:99,records:[]});eq(F.createStore(m).read().status,"CORRUPT_DOCUMENT")});
 test("registro corrupto se aísla",()=>{const m=new Memory();m.data[F.STORAGE_KEY]=JSON.stringify({schemaVersion:1,records:[rec("store_007","2026-01-01T10:00:00Z"),{}]});const r=F.createStore(m).read();eq(r.status,"PARTIAL");eq(r.records.length,1);eq(r.invalidRecords,1)});
 test("versión científica anterior se conserva",()=>{const m=new Memory(),r=JSON.parse(JSON.stringify(rec("store_old","2026-01-01T10:00:00Z")));r.method.version="legacy";m.data[F.STORAGE_KEY]=JSON.stringify({schemaVersion:1,records:[r]});eq(F.createStore(m).read().records.length,1)});
 test("cuota llena no rompe",()=>{const m=new Memory();m.setItem=function(){const e=Error("full");e.name="QuotaExceededError";throw e};eq(F.createStore(m).add([rec("store_008","2026-01-01T10:00:00Z")]).status,"QUOTA_EXCEEDED")});
 test("lectura bloqueada no rompe",()=>{const m=new Memory();m.getItem=function(){throw Error("blocked")};eq(F.createStore(m).read().status,"READ_ERROR")});
 test("rechaza entrada no validada",()=>eq(F.createStore(new Memory()).add([{}]).status,"INVALID_RECORDS"));
 test("respeta límite",()=>{const m=new Memory(),records=[];for(let i=0;i<1002;i++){records.push(rec("limit_"+String(i).padStart(4,"0"),new Date(Date.UTC(2020,0,1,0,0,i)).toISOString()))}const s=F.createStore(m);eq(s.write(records).records.length,t.MAX_RECORDS);eq(s.read().records.length,t.MAX_RECORDS)});
 (root.ImoancyBodyFatPhase2Suites||(root.ImoancyBodyFatPhase2Suites=[])).push({passed:passed,failed:failures.length,failures:failures});
})(globalThis);
