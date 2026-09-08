'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),c=require('../js/core.js');
const direct=['madre_padre','hijo','hermano','abuelo','nieto'];
const affinity=['suegro','hermano_conyuge','conyuge_hermano','yerno','abuelo_conyuge','nieto_conyuge','conyuge_nieto','hijo_conyuge','conyuge_progenitor'];
const partner=['padre_pareja','hijo_pareja','hermano_pareja','abuelo_pareja','nieto_pareja'];
function complete(rel,motivo='hospitalizacion',extra={}){
 const base={motivo,grupo:c.relations[rel][1],relacion:rel,...extra};
 let s={};while(c.inspect(s).question){const q=c.inspect(s).question;const defaults={ingreso:'actual',reposo:'si',vigente:'si',desplazamiento:'no',convive:'no',cuidado:'si',continuidad:'reposo',iniciado:'si'};s=c.answer(s,q.key,base[q.key]||defaults[q.key]);}return s;
}
for(const rel of ['conyuge','pareja_hecho',...direct,...affinity]){
 for(const motive of ['hospitalizacion','grave','operacion','fallecimiento'])test(rel+' / '+motive,()=>{
  const r=c.evaluate(complete(rel,motive));assert.equal(r.kind,'result');assert.equal(r.status,'determinable');assert.equal(r.days,motive==='fallecimiento'?2:5);assert.ok(r.convenio.includes('convenio'));
 });
}
for(const rel of partner){test(rel+' cuidado incluido sin convivencia',()=>{const s=complete(rel);assert.equal(c.evaluate(s).days,5);assert.ok(!('convive' in s));});test(rel+' fallecimiento fuera',()=>assert.equal(c.evaluate(complete(rel,'fallecimiento')).status,'fuera'));}
for(const rel of ['sobrino','tio','primo','conviviente']){
 test(rel+' sin convivencia fuera',()=>assert.equal(c.evaluate(complete(rel)).status,'fuera'));
 test(rel+' vía conviviente',()=>assert.equal(c.evaluate(complete(rel,'hospitalizacion',{convive:'si',cuidado:'si'})).days,5));
 test(rel+' convivencia sin cuidado fuera',()=>assert.equal(c.evaluate(complete(rel,'hospitalizacion',{convive:'si',cuidado:'no'})).status,'fuera'));
 test(rel+' fallecimiento sin extensión por convivir',()=>assert.equal(c.evaluate(complete(rel,'fallecimiento')).status,'fuera'));
}
test('operación sin reposo no pregunta parentesco',()=>{const s={motivo:'operacion',reposo:'no'};assert.equal(c.evaluate(s).status,'fuera');assert.equal(c.inspect(s).question,null);});
test('reposo desconocido condicionado',()=>assert.equal(c.evaluate(complete('hijo','operacion',{reposo:'duda'})).status,'condicionada'));
for(const rel of ['otra','pareja_sin_acreditar','otro_pareja'])test(rel+' vínculo desconocido',()=>{assert.equal(c.evaluate(complete(rel)).status,'condicionada');assert.equal(c.evaluate(complete(rel,'fallecimiento')).status,'condicionada');assert.equal(c.evaluate(complete(rel,'hospitalizacion',{convive:'si'})).days,5);});
for(const [d,expected] of [['si',4],['no',2],['duda',null]])test('fallecimiento desplazamiento '+d,()=>{const r=c.evaluate(complete('hermano','fallecimiento',{desplazamiento:d}));assert.equal(r.days,expected);assert.equal(r.status,d==='duda'?'condicionada':'determinable');});
for(const started of ['si','no','duda'])test('alta y reposo, iniciado '+started,()=>{const r=c.evaluate(complete('madre_padre','hospitalizacion',{ingreso:'alta',iniciado:started}));assert.equal(r.status,started==='si'?'determinable':'condicionada');assert.equal(r.days,started==='si'?5:null);assert.ok(r.sources.includes('continuidad'));});
for(const continuidad of ['cuidados','recuperada','duda'])test('alta '+continuidad+' condicionada',()=>{const s=complete('madre_padre','hospitalizacion',{ingreso:'alta',continuidad});assert.ok(!('iniciado' in s));assert.equal(c.evaluate(s).status,'condicionada');});
for(const field of ['convive','cuidado'])test('desconocimiento '+field,()=>assert.equal(c.evaluate(complete('conviviente','grave',{convive:'si',[field]:'duda'})).status,'condicionada'));
for(const motivo of ['grave','operacion'])for(const vigente of ['no','duda'])test(motivo+' persistencia '+vigente,()=>assert.equal(c.evaluate(complete('hijo',motivo,{vigente})).status,'condicionada'));
for(const bad of [null,[],42,{motivo:'inventado'},{relacion:'hijo'},{motivo:'fallecimiento',reposo:'si'},{motivo:'operacion',reposo:'no',grupo:'directa'},{motivo:'hospitalizacion',grupo:'directa',relacion:'suegro'}, {motivo:'hospitalizacion',grupo:'directa',relacion:'hijo',ingreso:'actual',iniciado:'si'}])test('rechaza '+JSON.stringify(bad),()=>assert.equal(c.evaluate(bad).kind,'invalid'));
test('incompleto no es dictamen jurídico',()=>{assert.equal(c.evaluate({}).kind,'incomplete');assert.equal(c.evaluate({motivo:'grave'}).kind,'incomplete');});
test('cambiar motivo borra todo lo dependiente',()=>assert.deepEqual(c.rewind(complete('suegro'),'motivo'),{}));
test('cambiar familia borra alta y reposo derivados',()=>assert.deepEqual(c.rewind(complete('suegro','hospitalizacion',{ingreso:'alta'}),'grupo'),{motivo:'hospitalizacion'}));
test('reset nuevo objeto, sin mutación',()=>{const s=complete('hijo');const before=JSON.stringify(s);c.evaluate(s);c.rewind(s,'motivo');assert.deepEqual(c.reset(),{});assert.equal(JSON.stringify(s),before);});
test('no permite contestar fuera de orden',()=>assert.throws(()=>c.answer({},'relacion','hijo')));
test('recorrido exhaustivo: toda rama termina, fuentes y convenio; replay y cambios coherentes',()=>{
 let terminals=0,conditioned=0;const seen=new Set();
 function visit(s){const i=c.inspect(s);assert.ok(!i.error);if(i.question){seen.add(i.question.key);for(const [v] of i.question.options)visit(c.answer(s,i.question.key,v));return;}
 const r=c.evaluate(s);terminals++;if(r.status==='condicionada')conditioned++;
 assert.equal(r.kind,'result');assert.ok(['determinable','condicionada','fuera'].includes(r.status));assert.ok(r.convenio.includes('puede mejorar'));assert.ok(r.checklist.length>=2);assert.ok(r.sources.includes('et'));
 if(r.status!=='determinable')assert.equal(r.days,null);else assert.ok([2,4,5].includes(r.days));
 for(const step of i.path){const prev=c.rewind(s,step.key);assert.equal(c.inspect(prev).question.key,step.key);}
 }
 visit({});assert.ok(terminals>500);assert.ok(conditioned>100);console.log('Recorridos completos:',terminals,'condicionados:',conditioned,'preguntas:',seen.size);
});
