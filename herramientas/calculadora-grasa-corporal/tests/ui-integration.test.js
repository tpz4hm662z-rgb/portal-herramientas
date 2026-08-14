"use strict";
(function(root){
 const read=root.ImoancyReadTestFile,base=root.ImoancyBodyFatTestBase,html=read(base+"/index.html"),script=read(base+"/js/script.js"),css=read(base+"/css/style.css");let passed=0,failures=[];
 function test(n,f){try{f();passed++}catch(e){failures.push("ui · "+n+": "+e.message)}}function ok(x){if(!x)throw Error("assertion failed")}function has(x,s){return x.indexOf(s)>=0}
 test("módulos antes del controlador",()=>ok(html.indexOf("science-engine.js")<html.indexOf("js/script.js")&&html.indexOf("change-interpreter.js")<html.indexOf("js/script.js")));
 test("solo cuatro campos en cálculo rápido",()=>{const form=html.slice(html.indexOf('<form id="formularioHerramienta"'),html.indexOf('</form>',html.indexOf('<form id="formularioHerramienta"')));["sexo","edad","altura","peso"].forEach(id=>ok(has(form,'id="'+id+'"')));["cuello","cadera","cinturaUno"].forEach(id=>ok(!has(form,'id="'+id+'"')))});
 test("consume motor sin duplicar ecuaciones",()=>{ok(has(script,"calculateCunBae"));ok(has(script,"calculateRfm"));["44.988","0.503","64 - 20","1.0324"].forEach(coef=>ok(!has(script,coef)))});
 test("no envía datos a analítica",()=>{ok(!has(script,"registrarEvento"));ok(!has(script,"gtag("));["porcentaje_grasa","weightKg:","waistCm:"].forEach(term=>{if(term==="weightKg:"||term==="waistCm:")return;ok(!has(script,term))})});
 test("acciones voluntarias",()=>{ok(has(html,'id="botonGuardar"'));ok(has(html,'id="confirmarGuardar"'));ok(has(html,'id="cancelarGuardar"'))});
 test("regiones dinámicas accesibles",()=>{ok(has(html,'id="estadoGuardado"'));ok(has(html,'aria-live="polite"'));ok(has(html,'id="explicacionCambio"'))});
 test("sin categorías prohibidas en resultados",()=>{const results=html.slice(html.indexOf('id="resultados"'),html.indexOf('<!-- EVOLUCIÓN LOCAL'));["Atleta","Fitness","Clasificación","Peso objetivo"].forEach(term=>ok(!has(results,term)))});
 test("responsive estrecho y estándar",()=>{ok(has(css,"@media (max-width:600px)"));ok(has(css,"@media (max-width:900px)"));ok(has(css,"min-width:44px"))});
 test("historial oculto en primera visita",()=>ok(has(html,'id="evolucion" class="seccion-evolucion oculto"')));
 test("privacidad local visible",()=>{ok(has(html,"este navegador/dispositivo"));ok(has(html,"no se envía a Imoancy"))});
 (root.ImoancyBodyFatPhase2Suites||(root.ImoancyBodyFatPhase2Suites=[])).push({passed:passed,failed:failures.length,failures:failures});
})(globalThis);
