(async function () {
    "use strict";
    const resultados = [], marco = document.getElementById("calculadora"), esperar = ms => new Promise(r => setTimeout(r, ms));
    function test(nombre, ok, detalle) { resultados.push({ nombre, ok: Boolean(ok), error: ok ? "" : (detalle || "condición falsa") }); }
    function q(id) { return marco.contentDocument.getElementById(id); }
    function radio(nombre, valor) { const el=marco.contentDocument.querySelector(`[name="${nombre}"][value="${valor}"]`);el.checked=true;el.dispatchEvent(new Event("change",{bubbles:true}));return el; }
    function radioEn(contenedor, clase, valor) { const el=contenedor.querySelector(`${clase}[value="${valor}"]`);el.checked=true;el.dispatchEvent(new Event("change",{bubbles:true}));return el; }
    function valor(id, value) { const el=q(id);el.value=value;el.dispatchEvent(new Event("change",{bubbles:true}));return el; }
    function completarOK() {
        valor("fechaInicio","2025-01-01");valor("fechaFin","2025-12-31");valor("causa","BAJA_VOLUNTARIA");valor("salarioBruto","36500");radio("tipoSalario","ANUAL");valor("debenSalario","no");valor("pagasPendientes","no");valor("diasDisfrutados","30");valor("diasTrasladados","0");valor("valorDiaVacaciones","0");radio("usarPreaviso","no");
    }
    await new Promise(resolve => marco.addEventListener("load", resolve, { once:true }));
    test("DOM inicial vacaciones neutral", q("diasDisfrutados").value === "");
    test("DOM inicial temporal neutral", q("tipoTemporal").value === "");
    test("DOM inicial extras neutral", !marco.contentDocument.querySelector('[name="tipoCuantiasExtras"]:checked'));
    test("DOM inicial preaviso neutral", !marco.contentDocument.querySelector('[name="usarPreaviso"]:checked'));
    test("DOM inicial vacaciones naturales muestra referencia 30", radio("regimenVacaciones","NATURALES") && q("diasAnuales").value === "30");
    radio("regimenVacaciones","LABORABLES");
    test("natural a laboral vacía el derecho heredado", q("diasAnuales").value === "" && /días laborables anuales/.test(q("ayuda-vacaciones").textContent));
    valor("diasAnuales","22");radio("regimenVacaciones","NATURALES");
    test("laboral a natural no reinterpreta 22", q("diasAnuales").value === "" && /mínimo legal es 30 días naturales/.test(q("ayuda-vacaciones").textContent));
    q("reiniciar").click();await esperar(20);

    completarOK();q("formFiniquito").requestSubmit();await esperar(0);
    test("DOM produce resultado OK completo", /Estimación completa/.test(q("resultado").textContent));
    valor("salarioBruto","");q("formFiniquito").requestSubmit();await esperar(0);
    test("OK a error retira resultado anterior", /resultado anterior se ha retirado/i.test(q("resultado").textContent) && !/Estimación completa/.test(q("resultado").textContent));
    test("error UI enfoca campo concreto", marco.contentDocument.activeElement === q("salarioBruto"));

    valor("causa","TEMPORAL");valor("tipoTemporal","INDEMNIZABLE");valor("causa","BAJA_VOLUNTARIA");valor("causa","TEMPORAL");
    test("subtipo temporal no sobrevive al cambio", q("tipoTemporal").value === "");

    valor("pagasPendientes","si");q("anadirPaga").click();q("anadirPaga").click();marco.contentDocument.querySelector(".eliminar-item").click();
    test("eliminar paga retira exactamente un elemento", marco.contentDocument.querySelectorAll(".paga-ui").length === 1);

    q("salarioBruto").value="";q("formFiniquito").requestSubmit();await esperar(0);const descripcionAntes=q("salarioBruto").getAttribute("aria-describedby")||"";valor("salarioBruto","36500");q("formFiniquito").requestSubmit();await esperar(0);const descripcionDespues=q("salarioBruto").getAttribute("aria-describedby")||"";
    test("limpieza conserva ayuda y retira error dinámico", !/error-dinamico/.test(descripcionDespues) && descripcionDespues.indexOf("error-salarioBruto") >= 0, `${descripcionAntes} -> ${descripcionDespues}`);

    q("reiniciar").click();await esperar(20);
    completarOK();q("anadirComponente").closest("details").open=true;q("anadirComponente").click();const componente=q("listaComponentes").querySelector(".componente-ui");valor("compAnual1","12000");q("formFiniquito").requestSubmit();await esperar(0);
    test("componente DOM nace sin clasificación y no permite OK", !componente.querySelector(".comp-incluido:checked") && !componente.querySelector(".comp-regulador:checked") && !componente.querySelector(".comp-pendiente:checked") && !/Estimación completa/.test(q("resultado").textContent));
    test("componente sin clasificar asocia error y foco", marco.contentDocument.activeElement===q("compIncluido1") && q("compIncluido1").getAttribute("aria-invalid")==="true" && /error-dinamico/.test(q("compIncluido1").getAttribute("aria-describedby")||""),`foco=${marco.contentDocument.activeElement&&marco.contentDocument.activeElement.id} invalid=${q("compIncluido1").getAttribute("aria-invalid")} described=${q("compIncluido1").getAttribute("aria-describedby")}`);
    radioEn(componente,".comp-incluido","no");radioEn(componente,".comp-regulador","si");radioEn(componente,".comp-pendiente","no");q("formFiniquito").requestSubmit();await esperar(0);
    test("componente adicional computable explícito permite OK", /Estimación completa/.test(q("resultado").textContent));
    radioEn(componente,".comp-regulador","nose");q("formFiniquito").requestSubmit();await esperar(0);
    test("componente OK a No lo sé retira resultado", !/Estimación completa/.test(q("resultado").textContent) && /resultado anterior se ha retirado/i.test(q("resultado").textContent));
    radioEn(componente,".comp-regulador","no");radioEn(componente,".comp-pendiente","si");
    test("pendiente Sí muestra importe requerido", !componente.querySelector(".comp-pendiente-grupo").hidden);
    valor("compImportePendiente1","3000");radioEn(componente,".comp-pendiente","no");
    test("pendiente No oculta e ignora el importe residual", componente.querySelector(".comp-pendiente-grupo").hidden);
    q("anadirComponente").click();const ids=Array.from(q("listaComponentes").querySelectorAll(".comp-id")).map(el=>el.id);componente.querySelector(".eliminar-item").click();q("anadirComponente").click();const idsTras=Array.from(q("listaComponentes").querySelectorAll(".comp-id")).map(el=>el.id);
    test("componentes eliminados y recreados conservan IDs únicos", new Set(ids.concat(idsTras)).size>=3 && q("listaComponentes").querySelectorAll(".componente-ui").length===2);
    q("reiniciar").click();await esperar(20);
    completarOK();valor("pagasPendientes","si");q("anadirPaga").click();valor("pagaCuantia1","1200");valor("pagaInicio1","2025-01-01");valor("pagaFin1","2025-12-31");q("formFiniquito").requestSubmit();await esperar(0);
    test("error dinámico de paga queda asociado y enfocado", marco.contentDocument.activeElement===q("pagaCobrado1") && q("pagaCobrado1").getAttribute("aria-invalid")==="true" && /error-dinamico/.test(q("pagaCobrado1").getAttribute("aria-describedby")||""));
    marco.contentDocument.querySelectorAll("form details").forEach(detalle=>{detalle.open=true;});q("reiniciar").click();await esperar(20);
    test("reset real restaura estados neutrales", q("diasDisfrutados").value === "" && q("diasTrasladados").value === "" && q("tipoTemporal").value === "" && q("numeroPagas").value === "" && !marco.contentDocument.querySelector('[name="tipoCuantiasExtras"]:checked') && !marco.contentDocument.querySelector('[name="usarPreaviso"]:checked') && marco.contentDocument.querySelectorAll(".paga-ui,.componente-ui").length === 0);
    test("reset real limpia resultado y errores", /Tu estimación aparecerá aquí/.test(q("resultado").textContent) && q("resumenErrores").hidden);
    test("reset real restaura details iniciales", Array.from(marco.contentDocument.querySelectorAll("form details")).every(detalle=>!detalle.open));
    test("reset restaura referencia natural 30", q("diasAnuales").value==="30" && marco.contentDocument.querySelector('[name="regimenVacaciones"]:checked').value==="NATURALES");

    const primerRadio=marco.contentDocument.querySelector('.segmentado input');primerRadio.focus();const visual=primerRadio.nextElementSibling,estilo=marco.contentWindow.getComputedStyle(visual);
    test("radio segmentado muestra foco visible", estilo.outlineStyle !== "none" && parseFloat(estilo.outlineWidth) >= 2, `${estilo.outlineStyle} ${estilo.outlineWidth}`);

    completarOK();q("formFiniquito").requestSubmit();await esperar(0);const detalle=q("resultado").querySelector("details");detalle.open=false;marco.contentWindow.print=()=>marco.contentWindow.dispatchEvent(new Event("afterprint"));q("descargarPDF").click();
    test("impresión restaura details", detalle.open === false);

    const anchos=[320,375,768,1024,1440],desbordes=[];
    for (const ancho of anchos) { marco.style.width=`${ancho}px`;await esperar(20);const doc=marco.contentDocument.documentElement;if(doc.scrollWidth>doc.clientWidth+1){const ofensores=Array.from(marco.contentDocument.querySelectorAll("body *")).map(el=>({el,r:el.getBoundingClientRect()})).filter(x=>x.r.right>doc.clientWidth+1).sort((a,b)=>b.r.right-a.r.right).slice(0,2).map(x=>`${x.el.tagName.toLowerCase()}.${x.el.className||x.el.id}:${Math.round(x.r.right)}`);desbordes.push(`${ancho}:${doc.scrollWidth}/${doc.clientWidth} [${ofensores.join("|")}]`);} }
    test("responsive sin scroll horizontal en cinco anchos", desbordes.length===0, desbordes.join(", "));

    const pass=resultados.filter(x=>x.ok).length,resumen={total:resultados.length,pass,fail:resultados.length-pass,resultados};globalThis.FiniquitoBrowserTestResults=resumen;
    document.getElementById("salida").textContent=resultados.map(x=>(x.ok?"PASS ":"FAIL ")+x.nombre+(x.error?" — "+x.error:"")).join("\n")+`\nTOTAL ${resumen.total} PASS ${pass} FAIL ${resumen.fail}`;
    document.body.dataset.testsFailed=String(resumen.fail);document.body.dataset.testsComplete="true";
})();
