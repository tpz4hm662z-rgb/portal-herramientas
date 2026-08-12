(function () {
    "use strict";
    const UI = globalThis.FiniquitoUI, resultados = [];
    function test(nombre, fn) { try { fn(); resultados.push({ nombre, ok: true }); } catch (e) { resultados.push({ nombre, ok: false, error: e.message }); } }
    function eq(a, b, m) { if (a !== b) throw new Error(`${m || "valor"}: ${a} !== ${b}`); }
    function ok(v, m) { if (!v) throw new Error(m || "condición falsa"); }
    function incluyeErrores(c, campo) { ok(c.resultado === null, `${campo}: no debe calcular`); ok(c.erroresUI.some(e => e.campo === campo), `${campo}: falta error`); }
    function base(extra) { return Object.assign({ fechaInicio:"2025-01-01",fechaFin:"2025-12-31",causa:"BAJA_VOLUNTARIA",tipoTemporal:"",confirmarImprocedencia:false,salarioBruto:"36500",tipoSalario:"ANUAL",numeroPagas:"14",extrasProrrateadas:"",tipoCuantiasExtras:"",cuantiasExtras:[],componentes:[],debenSalario:"no",importeSalarioPendiente:"",pagasPendientes:"no",pagas:[],regimenVacaciones:"NATURALES",diasAnuales:"30",diasDisfrutados:"30",diasTrasladados:"0",valorDiaVacaciones:"0",cicloVacaciones:"NATURAL",cicloInicio:"",cicloFin:"",derechoCiclo:"",proyectarVacaciones:true,usarPreaviso:"no",variables:[],ajustes:[],importeEmpresa:"" }, extra || {}); }
    function paga(cobrado) { return { id:"verano",nombre:"Verano",cuantia:"1200",inicio:"2025-01-01",fin:"2025-12-31",yaPercibido:cobrado }; }

    test("API disponible",()=>ok(UI&&UI.construirEntrada&&UI.calcular&&UI.renderResultado&&UI.ENUMS));
    test("mapeo básico anual",()=>{const x=UI.construirEntrada(base()).entrada;eq(x.salario.tipo,"ANUAL");eq(x.vacaciones.periodosDevengo[0].diasDerechoPeriodoCompleto,30);eq(x.preaviso.aplicar,false);});
    test("baja voluntaria OK",()=>{const r=UI.calcular(base()).resultado;eq(r.status,"OK");eq(r.indemnizacion.importe,0);});
    test("vacaciones sin confirmar no calcula",()=>incluyeErrores(UI.calcular(base({diasDisfrutados:""})),"diasDisfrutados"));
    test("vacaciones cero explícito válido",()=>{const r=UI.calcular(base({diasDisfrutados:"0",valorDiaVacaciones:"100"})).resultado;eq(r.status,"OK");eq(r.finiquito.vacaciones.importe,3000);});
    test("vacaciones 30 explícito válido",()=>eq(UI.calcular(base({diasDisfrutados:"30"})).resultado.status,"OK"));
    test("vacaciones 30 a vacío no conserva valor",()=>incluyeErrores(UI.calcular(base({diasDisfrutados:""})),"diasDisfrutados"));
    test("temporal sin subtipo no calcula",()=>incluyeErrores(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:""})),"tipoTemporal"));
    test("temporal indemnizable explícito",()=>eq(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:"INDEMNIZABLE"})).resultado.indemnizacion.causa,"FIN_CONTRATO_TEMPORAL_INDEMNIZABLE"));
    test("temporal formativo",()=>eq(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:"FORMATIVO"})).resultado.indemnizacion.causa,"FIN_CONTRATO_FORMATIVO"));
    test("temporal sustitución",()=>eq(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:"SUSTITUCION"})).resultado.indemnizacion.causa,"FIN_CONTRATO_SUSTITUCION"));
    test("temporal específico unsupported",()=>eq(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:"ESPECIFICA"})).resultado.status,"UNSUPPORTED"));
    test("temporal manipulado no calcula",()=>incluyeErrores(UI.calcular(base({causa:"TEMPORAL",tipoTemporal:"BORRADO"})),"tipoTemporal"));
    test("subtipo temporal oculto no influye",()=>eq(UI.calcular(base({causa:"BAJA_VOLUNTARIA",tipoTemporal:"INDEMNIZABLE"})).resultado.indemnizacion.causa,"BAJA_VOLUNTARIA"));
    test("salario sin tipo no calcula",()=>incluyeErrores(UI.calcular(base({tipoSalario:""})),"tipoSalario"));
    test("mensual 12 prorrateadas",()=>{const r=UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"12",extrasProrrateadas:"si"})).resultado;eq(r.basesSalariales.anual.importe,24000);});
    test("mensual 14 sin decidir extras no calcula",()=>incluyeErrores(UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:""})),"tipoCuantiasExtras"));
    test("mensual 14 extras iguales confirmadas",()=>{const r=UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"si"})).resultado;eq(r.basesSalariales.anual.importe,28000);});
    test("extras desiguales completas",()=>{const r=UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"no",cuantiasExtras:["1500","1800"]})).resultado;eq(r.basesSalariales.anual.importe,27300);});
    test("extra segunda vacía no calcula",()=>incluyeErrores(UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"no",cuantiasExtras:["1500",""]})),"cuantiaExtra1"));
    test("extra primera vacía no calcula",()=>incluyeErrores(UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"no",cuantiasExtras:["","1800"]})),"cuantiaExtra0"));
    test("extra cero explícito válido",()=>{const r=UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"no",cuantiasExtras:["1500","0"]})).resultado;eq(r.basesSalariales.anual.importe,25500);});
    test("extra NaN no calcula",()=>incluyeErrores(UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"no",cuantiasExtras:["NaN","1800"]})),"cuantiaExtra0"));
    test("extras no lo sé no calcula",()=>incluyeErrores(UI.calcular(base({salarioBruto:"2000",tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"nose"})),"tipoCuantiasExtras"));
    test("prorrata desconocida no calcula",()=>incluyeErrores(UI.calcular(base({tipoSalario:"MENSUAL",extrasProrrateadas:"nose"})),"extrasProrrateadas"));
    test("numeroPagas decimal rechazado",()=>incluyeErrores(UI.calcular(base({tipoSalario:"MENSUAL",numeroPagas:"13.9",extrasProrrateadas:"no",tipoCuantiasExtras:"si"})),"numeroPagasOtro"));
    test("causa manipulada rechazada",()=>incluyeErrores(UI.calcular(base({causa:"DESPIDO_INVENTADO"})),"causa"));
    test("objetivo",()=>eq(UI.calcular(base({causa:"DESPIDO_OBJETIVO"})).resultado.indemnizacion.importe,2000));
    test("improcedente sin confirmación condiciona",()=>eq(UI.calcular(base({causa:"DESPIDO_IMPROCEDENTE",confirmarImprocedencia:false})).resultado.status,"CONDITIONAL"));
    test("improcedente confirmado",()=>eq(UI.calcular(base({causa:"DESPIDO_IMPROCEDENTE",confirmarImprocedencia:true})).resultado.indemnizacion.status,"OK"));
    test("otro caso unsupported",()=>eq(UI.calcular(base({causa:"OTRO"})).resultado.status,"UNSUPPORTED"));
    test("salario desconocido condiciona",()=>eq(UI.calcular(base({debenSalario:"nose"})).resultado.status,"CONDITIONAL"));
    test("salario pendiente vacío no calcula",()=>incluyeErrores(UI.calcular(base({debenSalario:"si",importeSalarioPendiente:""})),"importeSalarioPendiente"));
    test("pagas sin respuesta no calcula",()=>incluyeErrores(UI.calcular(base({pagasPendientes:""})),"pagasPendientes"));
    test("pagas desconocidas condicionan",()=>eq(UI.calcular(base({pagasPendientes:"nose"})).resultado.status,"CONDITIONAL"));
    test("no pendiente no falsea prorrata",()=>{const x=UI.construirEntrada(base({tipoSalario:"MENSUAL",numeroPagas:"14",extrasProrrateadas:"no",tipoCuantiasExtras:"si",pagasPendientes:"no"})).entrada;eq(x.salario.extrasProrrateadas,false);eq(x.pagasExtra.prorrateadas,false);eq(x.pagasExtra.pagas[0].cuantiaPeriodoCompleto,0);});
    test("paga cobrado vacío no calcula",()=>incluyeErrores(UI.calcular(base({pagasPendientes:"si",pagas:[paga("")]})),"pagaCobrado1"));
    test("paga cobrado cero",()=>eq(UI.calcular(base({pagasPendientes:"si",pagas:[paga("0")]})).resultado.finiquito.pagasExtra.importe,1200));
    test("paga cobrado parcial",()=>eq(UI.calcular(base({pagasPendientes:"si",pagas:[paga("500")]})).resultado.finiquito.pagasExtra.importe,700));
    test("paga cobrado total",()=>eq(UI.calcular(base({pagasPendientes:"si",pagas:[paga("1200")]})).resultado.finiquito.pagasExtra.importe,0));
    test("paga cobrado superior condiciona",()=>eq(UI.calcular(base({pagasPendientes:"si",pagas:[paga("1300")]})).resultado.status,"CONDITIONAL"));
    test("vacaciones año natural varios ciclos",()=>eq(UI.crearCiclos("2025-01-01","2027-12-31","NATURAL",30).length,3));
    test("vacaciones julio-junio",()=>{const c=UI.crearCiclos("2025-08-01","2026-07-15","JULIO",30);eq(c.length,2);eq(c[0].inicio,"2025-07-01");});
    test("vacaciones laborables sin calendario",()=>{const r=UI.calcular(base({regimenVacaciones:"LABORABLES",diasAnuales:"22",diasDisfrutados:"0",valorDiaVacaciones:"100"})).resultado;eq(r.finiquito.vacaciones.periodoPosteriorEstimado.inicio,null);});
    test("componente sin clasificación no calcula",()=>{const c=UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"",regulador:"",variable:false,pendiente:"",importePendiente:""}]}));eq(c.resultado,null);ok(c.erroresUI.filter(e=>/^comp/.test(e.campo)).length>=3);});
    test("componente incluido y computable no duplica",()=>{const r=UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"si",regulador:"si",variable:false,pendiente:"no"}]})).resultado;eq(r.basesSalariales.anual.importe,36500);});
    test("componente adicional y computable suma base",()=>{const r=UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"no",regulador:"si",variable:false,pendiente:"no"}]})).resultado;eq(r.basesSalariales.anual.importe,48500);});
    test("componente no computable pero pendiente",()=>{const r=UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"si",regulador:"no",variable:false,pendiente:"si",importePendiente:"3000"}]})).resultado;eq(r.basesSalariales.anual.importe,36500);eq(r.finiquito.componentesPendientes.importe,3000);});
    test("componente computable y pendiente sin doble conteo",()=>{const r=UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"no",regulador:"si",variable:false,pendiente:"si",importePendiente:"3000"}]})).resultado;eq(r.basesSalariales.anual.importe,48500);eq(r.finiquito.componentesPendientes.importe,3000);eq(r.total.importeCalculado,3000);});
    test("componente todas No es informativo",()=>{const r=UI.calcular(base({componentes:[{id:"nota",importeAnual:"12000",incluidoEnBruto:"no",regulador:"no",variable:false,pendiente:"no"}]})).resultado;eq(r.status,"OK");eq(r.basesSalariales.anual.importe,36500);});
    test("componente No lo sé no calcula",()=>incluyeErrores(UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"nose",regulador:"si",variable:false,pendiente:"no"}]})),"compIncluido1"));
    test("componente pendiente vacío no calcula",()=>incluyeErrores(UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"si",regulador:"no",variable:false,pendiente:"si",importePendiente:""}]})),"compImportePendiente1"));
    test("componente enum manipulado no calcula",()=>incluyeErrores(UI.calcular(base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"true",regulador:"si",variable:false,pendiente:"no"}]})),"compIncluido1"));
    test("componente OK a desconocido invalida",()=>{const valido=base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"no",regulador:"si",variable:false,pendiente:"no"}]}),incierto=base({componentes:[{id:"bonus",importeAnual:"12000",incluidoEnBruto:"no",regulador:"nose",variable:false,pendiente:"no"}]});eq(UI.calcular(valido).resultado.status,"OK");incluyeErrores(UI.calcular(incierto),"compRegulador1");});
    test("preaviso sin respuesta no calcula",()=>incluyeErrores(UI.calcular(base({usarPreaviso:""})),"usarPreaviso"));
    test("preaviso no sé condiciona",()=>eq(UI.calcular(base({usarPreaviso:"nose"})).resultado.status,"CONDITIONAL"));
    test("preaviso no explícito",()=>eq(UI.construirEntrada(base({usarPreaviso:"no"})).entrada.preaviso.aplicar,false));
    test("preaviso descuento",()=>{const r=UI.calcular(base({usarPreaviso:"si",partePreaviso:"PERSONA_TRABAJADORA",tratamientoPreaviso:"DEDUCCION",diasExigibles:"15",diasDados:"10",importeDiaPreaviso:"100",tipoFuentePreaviso:"CONVENIO",referenciaPreaviso:"Convenio X"})).resultado;eq(r.finiquito.preaviso.importe,-500);});
    test("preaviso enum manipulado no calcula",()=>incluyeErrores(UI.calcular(base({usarPreaviso:"si",partePreaviso:"OTRA",tratamientoPreaviso:"DEDUCCION",diasExigibles:"15",diasDados:"10",importeDiaPreaviso:"100",tipoFuentePreaviso:"CONVENIO",referenciaPreaviso:"X"})),"partePreaviso"));
    test("INVALID no renderiza cifra",()=>{const r=UI.calcular(base({fechaInicio:"2025-12-31",fechaFin:"2025-01-01"})).resultado,h=UI.renderResultado(r,"");eq(r.status,"INVALID");ok(!/NaN|Infinity|undefined/.test(h));ok(/No podemos calcular/.test(h));});
    test("render conditional",()=>{const r=UI.calcular(base({debenSalario:"nose"})).resultado,h=UI.renderResultado(r,"");ok(/Estimación incompleta/.test(h));ok(/Importe calculado hasta ahora/.test(h));});
    test("render unsupported conserva parcial",()=>{const r=UI.calcular(base({causa:"OTRO"})).resultado,h=UI.renderResultado(r,"");ok(/Necesita revisión adicional/.test(h));ok(/Desglose/.test(h));});
    test("comparación OK",()=>ok(/Comparación con la cifra de la empresa/.test(UI.renderResultado(UI.calcular(base()).resultado,"1200"))));
    test("comparación conditional avisa parcialidad",()=>{const h=UI.renderResultado(UI.calcular(base({debenSalario:"nose"})).resultado,"1200");ok(/Comparación con una estimación parcial/.test(h));ok(/no debe interpretarse como definitiva/.test(h));});
    test("comparación unsupported avisa parcialidad",()=>ok(/Comparación con una estimación parcial/.test(UI.renderResultado(UI.calcular(base({causa:"OTRO"})).resultado,"1200"))));
    test("jerarquía OK comienza por finiquito",()=>{const h=UI.renderResultado(UI.calcular(base()).resultado,"");ok(h.indexOf("Finiquito estimado")<h.indexOf("Total económico estimado"));});
    test("escape de imagen maliciosa",()=>{const r={status:"INVALID",errores:['<img src=x onerror=alert(1)>']},h=UI.renderResultado(r,"");ok(/&lt;img/.test(h));ok(!/<img/.test(h));});
    test("escape de script malicioso",()=>{const r={status:"INVALID",errores:['<script>alert(1)</script>']},h=UI.renderResultado(r,"");ok(/&lt;script&gt;/.test(h));ok(!/<script>/.test(h));});
    test("nombre dinámico con imagen se renderiza como texto",()=>{const datos=base({componentes:[{id:'<img src=x onerror=alert(1)>',importeAnual:"100",incluidoEnBruto:"si",regulador:"si",variable:true,pendiente:"no"}]});const h=UI.renderResultado(UI.calcular(datos).resultado,"");ok(/&lt;img/.test(h));ok(!/<img/.test(h));});
    test("nombre dinámico con script se renderiza como texto",()=>{const datos=base({componentes:[{id:'<script>alert(1)</script>',importeAnual:"100",incluidoEnBruto:"si",regulador:"si",variable:true,pendiente:"no"}]});const h=UI.renderResultado(UI.calcular(datos).resultado,"");ok(/&lt;script&gt;/.test(h));ok(!/<script>/.test(h));});
    test("formato nunca muestra no finitos",()=>{eq(UI.dinero(NaN),"—");eq(UI.dinero(Infinity),"—");});
    test("mapeo determinista y sin mutación",()=>{const x=base(),antes=JSON.stringify(x);eq(JSON.stringify(UI.construirEntrada(x)),JSON.stringify(UI.construirEntrada(x)));eq(JSON.stringify(x),antes);});
    test("informe parcial conserva estado",()=>{const datos=base({debenSalario:"nose"}),h=UI.renderResultado(UI.calcular(datos).resultado,"",datos);ok(/Estimación incompleta/.test(h));ok(/Hipótesis y advertencias/.test(h));});

    const pass=resultados.filter(r=>r.ok).length,fail=resultados.length-pass,resumen={total:resultados.length,pass,fail,resultados};
    globalThis.FiniquitoUITestResults=resumen;
})();
