"use strict";
(async function () {
    const hostFrame=document.getElementById("tool"), frame=hostFrame||{contentDocument:document,contentWindow:window,style:{}}, results=[], wait=ms=>new Promise(r=>setTimeout(r,ms));
    const d=frame.contentDocument,w=frame.contentWindow,q=id=>d.getElementById(id);
    function test(name,condition,detail){results.push({name,pass:Boolean(condition),detail:condition?"":detail||"false"});}
    function radio(name,value){const x=d.querySelector(`[name="${name}"][value="${value}"]`);x.checked=true;x.dispatchEvent(new Event("change",{bubbles:true}));}
    function value(id,v){const x=q(id);x.value=v;x.dispatchEvent(new Event("input",{bubbles:true}));return x;}
    function submit(){q("formIndemnizacion").requestSubmit();}
    function fill(type,start,end,amount,mode){radio("terminationType",type);value("startDate",start);value("endDate",end);radio("salaryMode",mode||"ANNUAL");value("salaryAmount",amount);if((mode||"ANNUAL")==="MONTHLY")radio("extrasProrated","YES");}
    function text(){return q("resultPanel").textContent.replace(/\s+/g," ");}
    function reset(){q("formIndemnizacion").reset();return wait(10);}

    test("motor y normativa cargados",Boolean(w.ImoancyIndemnizacionCore&&w.ImoancyIndemnizacionNormativa2026));
    test("estado inicial neutral",!d.querySelector('[name="terminationType"]:checked')&&q("salaryAmount").value===""&&q("startDate").value==="");
    fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","36500","ANNUAL");submit();
    test("improcedente básico conectado",/3\.575,00/.test(text())&&/1 año y 1 mes/.test(text()),text());
    value("salaryAmount","36000");test("edición retira resultado obsoleto",/Tu estimación aparecerá/.test(text()),text());
    value("salaryAmount","36500");submit();test("submit repetido estable",/3\.575,00/.test(text()));

    await reset();fill("UNFAIR_DISMISSAL","2010-01-01","2011-01-01","36500","ANNUAL");submit();test("improcedente pre-2012",/4\.875,00/.test(text())&&/cambio legal de 2012/.test(text()),text());
    await reset();fill("UNFAIR_DISMISSAL","2011-02-12","2013-02-12","36500","ANNUAL");submit();test("transición 45\/33 visible",/8\.075,00/.test(text())&&/Periodo anterior/.test(text())&&/Periodo desde/.test(text()),text());
    await reset();fill("UNFAIR_DISMISSAL","2012-02-12","2040-01-01","36500","ANNUAL");submit();test("tope 720 explicado",/72\.000,00/.test(text())&&/Se ha aplicado el límite/.test(text()),text());
    await reset();fill("UNFAIR_DISMISSAL","1992-02-12","2020-02-12","36500","ANNUAL");submit();test("pre >720 excluye post",/90\.000,00/.test(text())&&/periodo posterior no aumenta/.test(text()),text());
    await reset();fill("UNFAIR_DISMISSAL","1970-01-01","2020-01-01","36500","ANNUAL");submit();test("tope 1260",/126\.000,00/.test(text()),text());
    await reset();fill("OBJECTIVE_DISMISSAL","2020-01-01","2021-01-01","36500","ANNUAL");submit();test("objetivo básico y prudente",/2\.166,67/.test(text())&&/se considera procedente/.test(text()),text());
    await reset();fill("OBJECTIVE_DISMISSAL","2000-01-01","2025-01-01","36500","ANNUAL");submit();test("objetivo tope 360",/36\.000,00/.test(text())&&/Se ha aplicado el límite/.test(text()),text());
    await reset();fill("COLLECTIVE_DISMISSAL_BASE","2020-01-01","2021-01-01","36500","ANNUAL");submit();test("colectivo muestra mínimo siempre",/2\.166,67/.test(text())&&/Mínimo legal base/.test(text()),text());

    const modes=[];
    await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","36500","ANNUAL");submit();modes.push(text().match(/[\d.]+,\d{2}\s*€/)[0]);
    await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","3041.666667","MONTHLY");submit();modes.push(text().match(/[\d.]+,\d{2}\s*€/)[0]);
    await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","100","DAILY");submit();modes.push(text().match(/[\d.]+,\d{2}\s*€/)[0]);
    test("anual mensual y diario equivalentes",new Set(modes).size===1,modes.join(" | "));
    await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","1000","MONTHLY");radio("extrasProrated","NO");q("addExtra").click();value(d.querySelector(".extra-row input").id,"1000");q("addExtra").click();value(d.querySelectorAll(".extra-row input")[1].id,"500");submit();test("mensual más extras explícitas",/13\.500,00/.test(text())&&/1\.322,26/.test(text()),text());
    d.querySelector(".eliminar-extra").click();test("eliminar extra conserva IDs y fila restante",d.querySelectorAll(".extra-row").length===1);

    await reset();radio("terminationType","TEMPORARY_CONTRACT_EXPIRY");submit();test("temporal informativo sin cero",/análisis más específico/.test(text())&&!/0,00/.test(text()),text());
    await reset();radio("terminationType","NOT_SURE");submit();test("no estoy seguro no calcula",/elegir una hipótesis/.test(text())&&!/estimada\s+[\d]/i.test(text()),text());
    await reset();submit();test("errores accesibles",!q("resumenErrores").hidden&&d.activeElement===d.querySelector('[name="terminationType"]')&&d.activeElement.getAttribute("aria-invalid")==="true");
    value("salaryAmount","<img src=x onerror=alert(1)>");test("payload XSS permanece valor de input",!d.querySelector("#resultPanel img")&&q("salaryAmount").value.indexOf("<img")===0);
    for(const input of ["1800,50","1800.50"]){await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01",input,"MONTHLY");submit();test("decimal aceptado "+input,/21\.606,00/.test(text()),text());}
    for(const input of ["1.800.50","1,800,50","1e3","0","-2"]){await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01",input,"ANNUAL");submit();test("importe ambiguo rechazado "+input,!q("resumenErrores").hidden);}
    await reset();fill("UNFAIR_DISMISSAL","2020-01-01","2021-01-01","36500","ANNUAL");submit();radio("terminationType","OBJECTIVE_DISMISSAL");submit();test("cambio rápido elimina estado anterior",/2\.166,67/.test(text())&&!/3\.575,00/.test(text()),text());
    await reset();test("reset limpia todo",q("salaryAmount").value===""&&!d.querySelector('[name="terminationType"]:checked')&&/Tu estimación aparecerá/.test(text())&&q("extrasList").children.length===0);

    const firstSegment=d.querySelector('.segmentado input');firstSegment.focus();const visual=w.getComputedStyle(firstSegment.nextElementSibling);test("foco visible en segmentado",visual.outlineStyle!=="none"&&parseFloat(visual.outlineWidth)>=2,visual.outlineStyle+visual.outlineWidth);
    const overflows=[];if(hostFrame){for(const width of [320,375,390,768,1024,1440]){frame.style.width=width+"px";await wait(30);const root=d.documentElement;if(root.scrollWidth>root.clientWidth+1)overflows.push(width+":"+root.scrollWidth+"/"+root.clientWidth);}}test("responsive sin overflow en viewport ejecutado",d.documentElement.scrollWidth<=d.documentElement.clientWidth+1,`${d.documentElement.scrollWidth}/${d.documentElement.clientWidth}`);
    await reset();fill("UNFAIR_DISMISSAL","2011-02-12","2013-02-12","36500","ANNUAL");submit();test("botón y CSS de impresión presentes",Boolean(d.querySelector(".boton-imprimir"))&&Array.from(d.styleSheets).some(s=>{try{return Array.from(s.cssRules).some(r=>r.media&&r.media.mediaText==="print")}catch(e){return false}}));
    const gaCalls=w.dataLayer.filter(x=>x&&x[0]==="event"&&(x[1]==="indemnity_calculated"||x[1]==="indemnity_reset"));test("GA4 solo usa dimensiones permitidas",gaCalls.every(x=>Object.keys(x[2]).sort().join(",")==="salary_input_mode,termination_type,tool_name"),JSON.stringify(gaCalls));

    const pass=results.filter(x=>x.pass).length,fail=results.length-pass;document.getElementById("output").textContent=results.map(x=>(x.pass?"PASS ":"FAIL ")+x.name+(x.detail?" — "+x.detail:"")).join("\n")+`\nTOTAL ${results.length} PASS ${pass} FAIL ${fail}`;document.body.dataset.testsComplete="true";document.body.dataset.testsFailed=String(fail);
}()).catch(function(error){const output=document.getElementById("output");if(output)output.textContent="TEST ERROR: "+error.message+"\n"+(error.stack||"");document.body.dataset.testsComplete="true";document.body.dataset.testsFailed="1";});
