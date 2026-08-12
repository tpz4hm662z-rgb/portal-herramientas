(function (root, factory) {
    "use strict";
    const api = factory(root.FiniquitoCore);
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.FiniquitoUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Core) {
    "use strict";

    const CAUSAS = Object.freeze({
        BAJA_VOLUNTARIA: "Baja voluntaria", FIN_CONTRATO_TEMPORAL_INDEMNIZABLE: "Fin de contrato temporal",
        FIN_CONTRATO_FORMATIVO: "Fin de contrato formativo", FIN_CONTRATO_SUSTITUCION: "Fin de contrato de sustitución",
        DESPIDO_OBJETIVO: "Despido objetivo", DESPIDO_DISCIPLINARIO_PROCEDENTE: "Despido disciplinario procedente",
        DESPIDO_IMPROCEDENTE: "Despido improcedente", NULIDAD: "Otro supuesto"
    });
    const PARTIDAS = Object.freeze({ salarioPendiente: "Salario pendiente", pagasExtra: "Pagas extraordinarias", vacaciones: "Vacaciones pendientes", variables: "Variables y otros conceptos", componentesSalarialesPendientes: "Componentes salariales pendientes", ajustes: "Otros ajustes", preaviso: "Ajuste por preaviso", indemnizacion: "Indemnización" });
    const CAUSAS_HUMANAS = Object.freeze({
        VARIABLE_PERIODO_REFERENCIA_AUSENTE: "Falta el período representativo de una variable salarial.",
        VACACIONES_COBERTURA_INCOMPLETA: "Los períodos de vacaciones no cubren toda la relación laboral.",
        VACACIONES_DERECHO_PERIODO_NO_DECLARADO: "Falta declarar el derecho completo de algún período vacacional.",
        PROYECCION_NO_VERIFICABLE: "No puede determinarse de forma fiable el período posterior de vacaciones.",
        COMPONENTE_PENDIENTE_SIN_IMPORTE: "Hay un componente pendiente sin importe indicado.",
        VARIABLE_POSIBLE_DUPLICIDAD: "Una variable podría estar incluida también en el salario habitual.",
        PAGA_POSIBLE_DUPLICIDAD: "Hay dos pagas equivalentes sin identidad diferenciada.",
        INDEMNIZACION_NO_DETERMINADA: "La indemnización necesita revisión o información adicional.",
        PREAVISO_NO_DETERMINADO: "El ajuste por preaviso no está completamente determinado.",
        BASE_SALARIAL_NO_DETERMINADA: "La base salarial necesita información adicional.",
        PAGAS_NO_DETERMINADAS: "Las pagas extraordinarias necesitan información adicional.",
        VACACIONES_NO_DETERMINADAS: "Las vacaciones necesitan información adicional."
    });
    const ENUMS = Object.freeze({
        causa: new Set(["BAJA_VOLUNTARIA", "TEMPORAL", "DESPIDO_OBJETIVO", "DESPIDO_DISCIPLINARIO_PROCEDENTE", "DESPIDO_IMPROCEDENTE", "OTRO"]),
        temporal: new Set(["INDEMNIZABLE", "FORMATIVO", "SUSTITUCION", "ESPECIFICA"]),
        tipoSalario: new Set(["MENSUAL", "ANUAL"]), prorrata: new Set(["si", "no", "nose"]), extras: new Set(["si", "no", "nose"]),
        siNoNose: new Set(["si", "no", "nose"]), vacaciones: new Set(["NATURALES", "LABORABLES"]), ciclo: new Set(["NATURAL", "JULIO", "PERSONALIZADO"]),
        partePreaviso: new Set(["PERSONA_TRABAJADORA", "EMPRESA"]), tratamientoPreaviso: new Set(["DEDUCCION", "ABONO", "SIN_AJUSTE"]), fuentePreaviso: new Set(["CONVENIO", "CONTRATO", "NORMA"]),
        decisionComponente: new Set(["si", "no", "nose"])
    });

    function numero(value) { return value === "" || value === null || value === undefined ? null : Number(value); }
    function entero(value) { const n = numero(value); return Number.isInteger(n) ? n : null; }
    function texto(value) { return typeof value === "string" ? value.trim() : ""; }
    function numeroRequerido(value, campo, etiqueta, errores, opciones) {
        const n = numero(value), min = opciones && opciones.min, max = opciones && opciones.max, enteroExigido = opciones && opciones.entero;
        if (n === null || !Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max) || (enteroExigido && !Number.isInteger(n))) {
            errores.push({ campo, mensaje: `${etiqueta}: introduce un número${enteroExigido ? " entero" : ""} válido${min !== undefined ? ` igual o superior a ${min}` : ""}.` });
            return null;
        }
        return n;
    }
    function enumRequerido(value, conjunto, campo, mensaje, errores) { if (!conjunto.has(value)) { errores.push({ campo, mensaje }); return false; } return true; }
    function dinero(value) { return Number.isFinite(value) ? value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" : "—"; }
    function escapar(value) { return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c])); }
    function iso(anio, mes, dia) { return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`; }
    function anioDe(fecha) { return Number(String(fecha).slice(0, 4)); }
    function mesDe(fecha) { return Number(String(fecha).slice(5, 7)); }

    function crearCiclos(inicio, fin, tipo, derecho, personalizado) {
        if (!inicio || !fin) return [];
        if (tipo === "PERSONALIZADO") {
            if (!personalizado || !personalizado.inicio || !personalizado.fin || personalizado.derecho === null) return [];
            return [{ inicio: personalizado.inicio, fin: personalizado.fin, diasDerechoPeriodoCompleto: personalizado.derecho }];
        }
        const ciclos = [];
        if (tipo === "JULIO") {
            let y = mesDe(inicio) >= 7 ? anioDe(inicio) : anioDe(inicio) - 1;
            while (iso(y, 7, 1) <= fin) { ciclos.push({ inicio: iso(y, 7, 1), fin: iso(y + 1, 6, 30), diasDerechoPeriodoCompleto: derecho }); y += 1; }
        } else {
            for (let y = anioDe(inicio); y <= anioDe(fin); y += 1) ciclos.push({ inicio: iso(y, 1, 1), fin: iso(y, 12, 31), diasDerechoPeriodoCompleto: derecho });
        }
        return ciclos;
    }

    function resolverCausa(datos, errores) {
        if (!enumRequerido(datos.causa, ENUMS.causa, "causa", "Selecciona un motivo de salida válido.", errores)) return { causa: "NULIDAD" };
        if (datos.causa !== "TEMPORAL") {
            if (datos.causa === "OTRO") return { causa: "NULIDAD" };
            const extincion = { causa: datos.causa };
            if (datos.causa === "DESPIDO_IMPROCEDENTE") extincion.improcedenciaReconocidaOSimulada = datos.confirmarImprocedencia === true;
            return extincion;
        }
        if (!enumRequerido(datos.tipoTemporal, ENUMS.temporal, "tipoTemporal", "Selecciona expresamente el tipo de contrato temporal.", errores)) return { causa: "NULIDAD" };
        if (datos.tipoTemporal === "FORMATIVO") return { causa: "FIN_CONTRATO_FORMATIVO" };
        if (datos.tipoTemporal === "SUSTITUCION") return { causa: "FIN_CONTRATO_SUSTITUCION" };
        return { causa: "FIN_CONTRATO_TEMPORAL_INDEMNIZABLE", normativaEspecifica: datos.tipoTemporal === "ESPECIFICA" };
    }

    function construirSalario(datos, errores) {
        const tipo = datos.tipoSalario;
        enumRequerido(tipo, ENUMS.tipoSalario, "tipoSalario", "Indica si el salario es mensual o anual.", errores);
        const salario = { tipo, bruto: numeroRequerido(datos.salarioBruto, "salarioBruto", "Salario bruto", errores, { min: 0.01 }) };
        if (tipo === "MENSUAL") {
            salario.numeroPagas = numeroRequerido(datos.numeroPagas, datos.campoNumeroPagas || "numeroPagasOtro", "Número de pagas", errores, { min: 1, max: 24, entero: true });
            if (!ENUMS.prorrata.has(datos.extrasProrrateadas) || datos.extrasProrrateadas === "nose") errores.push({ campo: "extrasProrrateadas", mensaje: "Necesitamos que confirmes si las extras están prorrateadas." });
            else salario.extrasProrrateadas = datos.extrasProrrateadas === "si";
            if (datos.extrasProrrateadas === "no") {
                const extras = Math.max(0, (salario.numeroPagas || 0) - 12);
                if (extras > 0) {
                    if (!ENUMS.extras.has(datos.tipoCuantiasExtras) || datos.tipoCuantiasExtras === "nose") errores.push({ campo: "tipoCuantiasExtras", mensaje: "Confirma si las pagas extra tienen el mismo importe o indica sus cuantías." });
                    else if (datos.tipoCuantiasExtras === "si") salario.cuantiasPagasExtraReguladoras = Array.from({ length: extras }, () => salario.bruto);
                    else salario.cuantiasPagasExtraReguladoras = Array.from({ length: extras }, (_, i) => numeroRequerido((datos.cuantiasExtras || [])[i], `cuantiaExtra${i}`, `Paga extra ${i + 1}`, errores, { min: 0 }));
                }
            }
        }
        if (Array.isArray(datos.componentes) && datos.componentes.length) salario.componentes = datos.componentes.map((c, i) => {
            const numeroConcepto=i+1, campoIncluido=c.campoIncluido||`compIncluido${numeroConcepto}`,campoRegulador=c.campoRegulador||`compRegulador${numeroConcepto}`,campoPendiente=c.campoPendiente||`compPendienteDecision${numeroConcepto}`;
            const importeAnual=numeroRequerido(c.importeAnual,c.campoAnual||`compAnual${numeroConcepto}`,`Importe anual del concepto ${numeroConcepto}`,errores,{min:0});
            if (!ENUMS.decisionComponente.has(c.incluidoEnBruto) || c.incluidoEnBruto === "nose") errores.push({campo:campoIncluido,mensaje:`Concepto ${numeroConcepto}: confirma si ya está incluido en el salario bruto.`});
            if (!ENUMS.decisionComponente.has(c.regulador) || c.regulador === "nose") errores.push({campo:campoRegulador,mensaje:`Concepto ${numeroConcepto}: confirma si forma parte del salario habitual o regulador.`});
            if (!ENUMS.decisionComponente.has(c.pendiente) || c.pendiente === "nose") errores.push({campo:campoPendiente,mensaje:`Concepto ${numeroConcepto}: confirma si existe una cantidad pendiente de cobrar.`});
            const item = { id: texto(c.id) || `componente-${numeroConcepto}`, importeAnual, incluidoEnBruto: c.incluidoEnBruto === "si", computableIndemnizacion: c.regulador === "si", variable: c.variable === true, pendientePago: c.pendiente === "si" };
            if (item.variable && c.periodoInicio && c.periodoFin) item.periodoReferencia = { inicio: c.periodoInicio, fin: c.periodoFin };
            if (item.pendientePago) item.importePendiente = numeroRequerido(c.importePendiente,c.campoImportePendiente||`compImportePendiente${numeroConcepto}`,`Importe pendiente del concepto ${numeroConcepto}`,errores,{min:0});
            return item;
        });
        return salario;
    }

    function construirEntrada(datos) {
        const errores = [];
        const salario = construirSalario(datos, errores);
        const extincion = resolverCausa(datos, errores);
        let ultimoPeriodo;
        if (datos.debenSalario === "no") ultimoPeriodo = { estrategia: "IMPORTE_EXPLICITO", importe: 0 };
        else if (datos.debenSalario === "si") ultimoPeriodo = { estrategia: "IMPORTE_EXPLICITO", importe: numeroRequerido(datos.importeSalarioPendiente, "importeSalarioPendiente", "Salario pendiente", errores, { min: 0 }) };
        else if (datos.debenSalario !== "nose") errores.push({ campo: "debenSalario", mensaje: "Indica si te deben salario del último período." });

        let pagasExtra;
        if (datos.pagasPendientes === "no") {
            if (salario.tipo === "MENSUAL" && salario.extrasProrrateadas === true) pagasExtra = { prorrateadas: true };
            else pagasExtra = { prorrateadas: false, pagas: [{ id: "saldo-pagas-confirmado-cero", nombre: "Saldo de pagas confirmado sin pendiente", cuantiaPeriodoCompleto: 0, periodoInicio: datos.fechaInicio, periodoFin: datos.fechaFin, yaPercibido: 0 }] };
        } else if (datos.pagasPendientes === "si") {
            if (!Array.isArray(datos.pagas) || !datos.pagas.length) errores.push({ campo: "anadirPaga", mensaje: "Añade al menos una paga pendiente." });
            pagasExtra = { prorrateadas: false, pagas: (datos.pagas || []).map((p, i) => ({ id: texto(p.id) || `paga-${i + 1}`, nombre: texto(p.nombre) || `Paga ${i + 1}`, cuantiaPeriodoCompleto: numeroRequerido(p.cuantia, p.campoCuantia || `pagaCuantia${i + 1}`, `Importe de la paga ${i + 1}`, errores, { min: 0 }), periodoInicio: p.inicio, periodoFin: p.fin, yaPercibido: numeroRequerido(p.yaPercibido, p.campoCobrado || `pagaCobrado${i + 1}`, `Importe ya cobrado de la paga ${i + 1}`, errores, { min: 0 }) })) };
            (datos.pagas || []).forEach((p, i) => { if (!p.inicio) errores.push({ campo: p.campoInicio || `pagaInicio${i + 1}`, mensaje: `Indica el inicio del devengo de la paga ${i + 1}.` }); if (!p.fin) errores.push({ campo: p.campoFin || `pagaFin${i + 1}`, mensaje: `Indica el final del devengo de la paga ${i + 1}.` }); });
        } else if (datos.pagasPendientes !== "nose") errores.push({ campo: "pagasPendientes", mensaje: "Indica si tienes pagas extra pendientes." });

        enumRequerido(datos.regimenVacaciones, ENUMS.vacaciones, "regimenVacaciones", "Selecciona el tipo de días de vacaciones.", errores);
        enumRequerido(datos.cicloVacaciones, ENUMS.ciclo, "cicloVacaciones", "Selecciona un período de devengo vacacional válido.", errores);
        const regimen = datos.regimenVacaciones, derecho = numeroRequerido(datos.diasAnuales, "diasAnuales", "Días anuales de vacaciones", errores, { min: regimen === "NATURALES" ? 30 : 0.01 });
        const disfrutados = numeroRequerido(datos.diasDisfrutados, "diasDisfrutados", "Días de vacaciones disfrutados", errores, { min: 0 });
        const trasladados = numeroRequerido(datos.diasTrasladados, "diasTrasladados", "Días trasladados", errores, { min: 0 });
        if (datos.cicloVacaciones === "PERSONALIZADO") { if (!datos.cicloInicio) errores.push({ campo: "cicloInicio", mensaje: "Indica el inicio del ciclo personalizado." }); if (!datos.cicloFin) errores.push({ campo: "cicloFin", mensaje: "Indica el fin del ciclo personalizado." }); numeroRequerido(datos.derechoCiclo, "derechoCiclo", "Derecho del ciclo personalizado", errores, { min: 0 }); }
        const vacaciones = { regimen, diasAnuales: derecho, disfrutados, trasladados, periodosDevengo: crearCiclos(datos.fechaInicio, datos.fechaFin, datos.cicloVacaciones, derecho, { inicio: datos.cicloInicio, fin: datos.cicloFin, derecho: numero(datos.derechoCiclo) }) };
        const valorDia = numero(datos.valorDiaVacaciones); if (valorDia !== null) vacaciones.valorDiaExplicito = valorDia;

        let preaviso;
        if (datos.usarPreaviso === "no") preaviso = { aplicar: false };
        else if (datos.usarPreaviso === "si") {
            enumRequerido(datos.partePreaviso, ENUMS.partePreaviso, "partePreaviso", "Selecciona quién tenía la obligación de preaviso.", errores);
            enumRequerido(datos.tratamientoPreaviso, ENUMS.tratamientoPreaviso, "tratamientoPreaviso", "Selecciona el tratamiento económico del preaviso.", errores);
            enumRequerido(datos.tipoFuentePreaviso, ENUMS.fuentePreaviso, "tipoFuentePreaviso", "Selecciona la fuente de la obligación de preaviso.", errores);
            const referencia = texto(datos.referenciaPreaviso); if (!referencia) errores.push({ campo: "referenciaPreaviso", mensaje: "Indica la referencia concreta de la obligación de preaviso." });
            preaviso = { aplicar: true, causaExtincion: extincion.causa, parteObligada: datos.partePreaviso, diasExigibles: numeroRequerido(datos.diasExigibles, "diasExigibles", "Días exigidos", errores, { min: 0 }), diasDados: numeroRequerido(datos.diasDados, "diasDados", "Días dados", errores, { min: 0 }), importeDia: numeroRequerido(datos.importeDiaPreaviso, "importeDiaPreaviso", "Importe diario de preaviso", errores, { min: 0 }), tipoFuente: datos.tipoFuentePreaviso, referenciaFuente: referencia, tratamientoEconomico: datos.tratamientoPreaviso };
        } else if (datos.usarPreaviso !== "nose") errores.push({ campo: "usarPreaviso", mensaje: "Indica si quieres incluir un ajuste por preaviso." });
        const entrada = { fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin, salario, ultimoPeriodo, pagasExtra, vacaciones, variables: datos.variables || [], ajustes: datos.ajustes || [], preaviso, extincion };
        return { entrada, errores };
    }

    function calcular(datos, core) {
        const motor = core || Core;
        const construido = construirEntrada(datos);
        if (construido.errores.length || !motor) return { resultado: null, entrada: construido.entrada, erroresUI: construido.errores.length ? construido.errores : [{ campo: null, mensaje: "El motor de cálculo no está disponible." }] };
        let resultado = motor.calcular(construido.entrada);
        const vac = resultado.finiquito && resultado.finiquito.vacaciones;
        if (datos.proyectarVacaciones === true && resultado.status !== "INVALID" && vac && vac.pendientes > 0 && Number.isInteger(vac.pendientes) && construido.entrada.vacaciones.regimen === "NATURALES") {
            construido.entrada.vacaciones.proyeccion = { reglaExplicita: true, diasProyectables: vac.pendientes, unidadOrigen: "NATURALES", unidadDestino: "NATURALES", referencia: "Saldo natural entero calculado por el motor y confirmado para proyección visual" };
            resultado = motor.calcular(construido.entrada);
        }
        return { resultado, entrada: construido.entrada, erroresUI: [] };
    }

    function compararEmpresa(total, ofrecido) {
        const empresa = numero(ofrecido);
        if (!Number.isFinite(total) || empresa === null || !Number.isFinite(empresa)) return null;
        return { calculado: total, empresa, diferencia: total - empresa };
    }
    function causaHumana(causa) { return CAUSAS_HUMANAS[causa.codigo] || causa.motivo || "Falta información para completar esta partida."; }

    function datosTraza(traza) {
        if (!traza) return "";
        const entradas = traza.entradas || {};
        const valores = Object.keys(entradas).filter(k => ["string", "number", "boolean"].includes(typeof entradas[k])).slice(0, 6).map(k => `<span><strong>${escapar(k)}:</strong> ${escapar(entradas[k])}</span>`).join(" · ");
        const hipotesis = (traza.hipotesis || []).map(h => `<p>Hipótesis: ${escapar(h)}</p>`).join("");
        return `<div class="traza"><p><strong>Fórmula:</strong> ${escapar(traza.formula)}</p>${valores ? `<p>${valores}</p>` : ""}${hipotesis}${traza.referencia ? `<p><strong>Regla:</strong> ${escapar(traza.referencia)}</p>` : ""}<p><strong>Redondeo:</strong> ${escapar(traza.redondeo)}</p></div>`;
    }

    function renderResultado(resultado, ofrecido, datos) {
        if (!resultado) return "";
        if (resultado.status === "INVALID") return `<div class="resultado-invalid"><span class="estado-chip estado-unsupported">Revisa los datos</span><h2>No podemos calcular todavía</h2><p>Corrige los siguientes datos antes de mostrar importes:</p><ul>${(resultado.errores || []).map(e => `<li>${escapar(e)}</li>`).join("")}</ul></div>`;
        const parcial = resultado.status !== "OK";
        const chip = resultado.status === "CONDITIONAL" ? "Estimación incompleta" : resultado.status === "UNSUPPORTED" ? "Necesita revisión adicional" : "Estimación completa";
        const clase = resultado.status === "OK" ? "estado-ok" : resultado.status === "CONDITIONAL" ? "estado-condicional" : "estado-unsupported";
        const trazas = resultado.trazabilidad || [];
        const filas = resultado.total.partidas.map(p => {
            const traza = trazas.find(t => t.id === p.id || t.id.startsWith(`${p.id}.`) || (p.id === "pagasExtra" && t.id.startsWith("pagaExtra")) || (p.id === "vacaciones" && t.id === "vacacionesPendientes") || (p.id === "componentesSalarialesPendientes" && t.id.startsWith("componentePendiente")) || (p.id === "indemnizacion" && t.id.startsWith("indemnizacion")));
            return `<div class="fila-desglose"><div class="fila-principal"><span>${escapar(PARTIDAS[p.id] || p.id)}</span><strong>${dinero(p.importe)}</strong></div>${traza ? `<details><summary>¿Cómo se calcula?</summary>${datosTraza(traza)}</details>` : ""}</div>`;
        }).join("");
        const causas = (resultado.total.causasParcialidad || []).map(c => `<li>${escapar(causaHumana(c))}${c.id ? ` <small>(${escapar(c.id)})</small>` : ""}</li>`).join("");
        const comparacion = compararEmpresa(resultado.total.importeCalculado, ofrecido);
        const periodo = resultado.finiquito.vacaciones.periodoPosteriorEstimado;
        const periodoHtml = periodo && periodo.inicio && periodo.fin ? `<div class="comparacion"><strong>Período estimado de vacaciones retribuidas no disfrutadas</strong><p>${escapar(periodo.inicio)} — ${escapar(periodo.fin)}</p><small>Puede tener efectos en cotización y desempleo. Esta calculadora no reconoce el derecho a prestación.</small></div>` : periodo && periodo.unidadDestino === "LABORABLES" && periodo.diasProyectables ? `<div class="comparacion"><strong>${escapar(periodo.diasProyectables)} días laborables pendientes</strong><p>No podemos fijar una fecha final fiable sin el calendario laboral aplicable.</p></div>` : "";
        const fechaInforme = new Date().toLocaleDateString("es-ES");
        const meta = datos ? `<section class="solo-impresion informe-meta"><h3>Datos principales</h3><p><strong>Fecha del cálculo:</strong> ${escapar(fechaInforme)}</p><p><strong>Relación laboral:</strong> ${escapar(datos.fechaInicio)} — ${escapar(datos.fechaFin)}</p><p><strong>Motivo:</strong> ${escapar(CAUSAS[resultado.indemnizacion.causa] || CAUSAS.NULIDAD)}</p><p><strong>Salario declarado:</strong> ${dinero(numero(datos.salarioBruto))} ${datos.tipoSalario === "MENSUAL" ? "mensuales" : "anuales"}</p></section>` : "";
        const notasImpresion = `<section class="solo-impresion informe-meta"><h3>Hipótesis y advertencias</h3>${(resultado.hipotesis || []).map(h => `<p>${escapar(h)}</p>`).join("")}${(resultado.advertencias || []).map(a => `<p>${escapar(a)}</p>`).join("") || "<p>Sin advertencias adicionales.</p>"}</section>`;
        const principal = parcial ? `<h2 class="resultado-titulo">Importe calculado hasta ahora</h2><p class="resultado-total">${dinero(resultado.total.importeCalculado).replace(" €", "")} <small>€ brutos</small></p><div class="resultado-separado"><div class="mini-total"><span>Finiquito parcial</span><strong>${dinero(resultado.finiquito.importe)}</strong></div><div class="mini-total"><span>Indemnización parcial</span><strong>${dinero(resultado.indemnizacion.importe)}</strong></div></div>` : `<h2 class="resultado-titulo">Finiquito estimado</h2><p class="resultado-total">${dinero(resultado.finiquito.importe).replace(" €", "")} <small>€ brutos</small></p><div class="resultado-separado"><div class="mini-total"><span>Indemnización</span><strong>${dinero(resultado.indemnizacion.importe)}</strong></div><div class="mini-total"><span>Total económico estimado</span><strong>${dinero(resultado.total.importeCalculado)}</strong></div></div>`;
        const comparacionHtml = comparacion ? `<section class="comparacion"><strong>${parcial ? "Comparación con una estimación parcial" : "Comparación con la cifra de la empresa"}</strong><p>Imoancy${parcial ? " (importe parcial)" : ""}: ${dinero(comparacion.calculado)} · Empresa: ${dinero(comparacion.empresa)}</p><p><strong>Diferencia respecto a tu estimación: ${dinero(comparacion.diferencia)}</strong></p><small>${parcial ? "La estimación de Imoancy está incompleta, por lo que esta diferencia no debe interpretarse como definitiva. " : ""}Una diferencia no implica necesariamente que la liquidación empresarial sea incorrecta; puede haber conceptos o reglas no incluidos.</small></section>` : "";
        return `${meta}<span class="estado-chip ${clase}">${escapar(chip)}</span>${principal}${causas ? `<section class="causas"><h3>${resultado.status === "UNSUPPORTED" ? "Este supuesto necesita revisión adicional" : "Faltan algunos datos"}</h3><ul>${causas}</ul></section>` : ""}${periodoHtml}<section class="desglose"><h3>Desglose</h3>${filas}</section>${comparacionHtml}${notasImpresion}<div class="acciones-resultado"><button class="boton-pdf" id="descargarPDF" type="button">Descargar resumen en PDF</button></div><p class="nota-legal">Estimación orientativa y bruta. Revisa convenio, contrato y documentación empresarial. Todo el cálculo se ha realizado localmente.</p>`;
    }

    function iniciar(doc) {
        const d = doc || (typeof document !== "undefined" ? document : null); if (!d || !Core) return;
        const form = d.getElementById("formFiniquito"), resultadoEl = d.getElementById("resultado"), resumen = d.getElementById("resumenErrores");
        let indicePaga = 0, indiceComponente = 0;
        const q = id => d.getElementById(id), radio = name => { const el = form.querySelector(`[name="${name}"]:checked`); return el ? el.value : ""; };
        let ultimoRegimen = radio("regimenVacaciones");
        const detallesIniciales = Array.from(form.querySelectorAll("details")).map(detalle => ({ detalle, abierto: detalle.open }));
        const mostrar = (id, visible) => { const el = q(id); if (el) el.hidden = !visible; };
        function actualizarComponentes(){form.querySelectorAll(".componente-ui").forEach(el=>{const pendiente=el.querySelector(".comp-pendiente:checked"),incluido=el.querySelector(".comp-incluido:checked"),regulador=el.querySelector(".comp-regulador:checked"),grupo=el.querySelector(".comp-pendiente-grupo"),informativo=el.querySelector(".comp-informativo");grupo.hidden=!pendiente||pendiente.value!=="si";informativo.hidden=!(incluido&&incluido.value==="no"&&regulador&&regulador.value==="no"&&pendiente&&pendiente.value==="no");});}
        function actualizar() {
            const causa = q("causa").value, mensual = radio("tipoSalario") === "MENSUAL", extrasNo = radio("extrasProrrateadas") === "no", regimenActual=radio("regimenVacaciones");
            if(ultimoRegimen&&regimenActual&&ultimoRegimen!==regimenActual)q("diasAnuales").value="";
            ultimoRegimen=regimenActual;
            q("ayuda-vacaciones").textContent=regimenActual==="LABORABLES"?"Introduce los días laborables anuales que establece tu convenio o contrato.":"Como referencia general, el mínimo legal es 30 días naturales; tu convenio puede mejorarlo.";
            if (causa !== "TEMPORAL") q("tipoTemporal").value = "";
            if (causa !== "DESPIDO_IMPROCEDENTE") q("confirmarImprocedencia").checked = false;
            mostrar("grupoTemporal", causa === "TEMPORAL"); mostrar("grupoImprocedente", causa === "DESPIDO_IMPROCEDENTE"); mostrar("datosMensuales", mensual); mostrar("grupoPagasOtro", q("numeroPagas").value === "otro"); mostrar("grupoCuantiasExtras", mensual && extrasNo && entero(q("numeroPagas").value === "otro" ? q("numeroPagasOtro").value : q("numeroPagas").value) > 12); mostrar("cuantiasExtras", radio("tipoCuantiasExtras") === "no"); mostrar("grupoSalarioPendiente", q("debenSalario").value === "si"); mostrar("grupoPagasPendientes", q("pagasPendientes").value === "si"); mostrar("cicloPersonalizado", q("cicloVacaciones").value === "PERSONALIZADO"); mostrar("datosPreaviso", radio("usarPreaviso") === "si");
            if (mensual && extrasNo) crearInputsExtras();
            actualizarComponentes();
        }
        function crearInputsExtras() {
            const n = q("numeroPagas").value === "otro" ? entero(q("numeroPagasOtro").value) : entero(q("numeroPagas").value), total = Math.max(0, (n || 12) - 12), box = q("cuantiasExtras");
            const actuales = Array.from(box.querySelectorAll("input")).map(i => i.value); box.innerHTML = "";
            for (let i = 0; i < total; i += 1) box.insertAdjacentHTML("beforeend", `<div class="campo"><label for="cuantiaExtra${i}">Paga extra ${i + 1}</label><div class="control-unidad"><input id="cuantiaExtra${i}" class="cuantia-extra" type="number" min="0" step="0.01" value="${escapar(actuales[i] || "")}"><span>€</span></div></div>`);
        }
        function anadirPaga() { indicePaga += 1; const n=indicePaga; q("listaPagas").insertAdjacentHTML("beforeend", `<article class="item-repetible paga-ui"><button class="eliminar-item" type="button" aria-label="Eliminar paga">×</button><h3>Paga pendiente</h3><div class="grid-campos"><div class="campo"><label for="pagaNombre${n}">Nombre</label><input id="pagaNombre${n}" class="paga-nombre" value="${n === 1 ? "Paga de verano" : "Paga de Navidad"}"></div><div class="campo"><label for="pagaCuantia${n}">Importe total</label><input id="pagaCuantia${n}" class="paga-cuantia" type="number" min="0" step="0.01"></div><div class="campo"><label for="pagaInicio${n}">Inicio del devengo</label><input id="pagaInicio${n}" class="paga-inicio" type="date"></div><div class="campo"><label for="pagaFin${n}">Fin del devengo</label><input id="pagaFin${n}" class="paga-fin" type="date"></div><div class="campo"><label for="pagaCobrado${n}">Cobrado ya</label><input id="pagaCobrado${n}" class="paga-cobrado" type="number" min="0" step="0.01" aria-describedby="ayuda-pagaCobrado${n}"><small id="ayuda-pagaCobrado${n}">Introduce 0 si no has cobrado nada todavía.</small></div></div></article>`); }
        function anadirComponente() { indiceComponente += 1; const n=indiceComponente; q("listaComponentes").insertAdjacentHTML("beforeend", `<article class="item-repetible componente-ui"><button class="eliminar-item" type="button" aria-label="Eliminar concepto">×</button><h3>Concepto salarial</h3><div class="grid-campos"><div class="campo"><label for="compId${n}">Nombre o identificador</label><input id="compId${n}" class="comp-id" value="concepto-${n}"></div><div class="campo"><label for="compAnual${n}">Importe anual</label><input id="compAnual${n}" class="comp-anual" type="number" min="0" step="0.01"></div><fieldset class="campo campo-ancho"><legend>¿Este concepto ya está incluido en el salario bruto indicado?</legend><div class="opciones-linea"><label><input id="compIncluido${n}" class="comp-incluido" type="radio" name="compIncluido${n}" value="si"><span>Sí</span></label><label><input class="comp-incluido" type="radio" name="compIncluido${n}" value="no"><span>No</span></label><label><input class="comp-incluido" type="radio" name="compIncluido${n}" value="nose"><span>No lo sé</span></label></div></fieldset><fieldset class="campo campo-ancho"><legend>¿Debe formar parte de tu salario habitual o regulador?</legend><div class="opciones-linea"><label><input id="compRegulador${n}" class="comp-regulador" type="radio" name="compRegulador${n}" value="si"><span>Sí</span></label><label><input class="comp-regulador" type="radio" name="compRegulador${n}" value="no"><span>No</span></label><label><input class="comp-regulador" type="radio" name="compRegulador${n}" value="nose"><span>No lo sé</span></label></div></fieldset><label class="check campo-ancho"><input class="comp-variable" type="checkbox"><span>Es una comisión, bonus o variable</span></label><div class="campo"><label for="compPeriodoInicio${n}">Inicio del período representativo</label><input id="compPeriodoInicio${n}" class="comp-periodo-inicio" type="date"></div><div class="campo"><label for="compPeriodoFin${n}">Fin del período representativo</label><input id="compPeriodoFin${n}" class="comp-periodo-fin" type="date"></div><fieldset class="campo campo-ancho"><legend>¿Además tienes alguna cantidad de este concepto pendiente de cobrar?</legend><div class="opciones-linea"><label><input id="compPendienteDecision${n}" class="comp-pendiente" type="radio" name="compPendiente${n}" value="si"><span>Sí</span></label><label><input class="comp-pendiente" type="radio" name="compPendiente${n}" value="no"><span>No</span></label><label><input class="comp-pendiente" type="radio" name="compPendiente${n}" value="nose"><span>No lo sé</span></label></div></fieldset><div class="campo comp-pendiente-grupo" hidden><label for="compImportePendiente${n}">Importe pendiente</label><input id="compImportePendiente${n}" class="comp-importe-pendiente" type="number" min="0" step="0.01"><small>Introduce 0 únicamente si el saldo pendiente confirmado es cero.</small></div><p class="campo-ancho ayuda-bloque comp-informativo" hidden>Este concepto se conservará como informativo y no afectará al cálculo.</p></div></article>`); }
        function leer() {
            const paginas = Array.from(d.querySelectorAll(".paga-ui")).map((el, i) => { const cuantia=el.querySelector(".paga-cuantia"),inicio=el.querySelector(".paga-inicio"),fin=el.querySelector(".paga-fin"),cobrado=el.querySelector(".paga-cobrado");return { id: `paga-ui-${i + 1}`, nombre: el.querySelector(".paga-nombre").value, cuantia: cuantia.value, inicio: inicio.value, fin: fin.value, yaPercibido: cobrado.value, campoCuantia:cuantia.id,campoInicio:inicio.id,campoFin:fin.id,campoCobrado:cobrado.id }; });
            const componentes = Array.from(d.querySelectorAll(".componente-ui")).map(el => {const id=el.querySelector(".comp-id"),anual=el.querySelector(".comp-anual"),incluido=el.querySelector(".comp-incluido:checked"),regulador=el.querySelector(".comp-regulador:checked"),pendiente=el.querySelector(".comp-pendiente:checked"),importePendiente=el.querySelector(".comp-importe-pendiente");return { id:id.value, importeAnual:anual.value, regulador:regulador?regulador.value:"", incluidoEnBruto:incluido?incluido.value:"", variable:el.querySelector(".comp-variable").checked, periodoInicio:el.querySelector(".comp-periodo-inicio").value, periodoFin:el.querySelector(".comp-periodo-fin").value, pendiente:pendiente?pendiente.value:"", importePendiente:importePendiente.value,campoAnual:anual.id,campoIncluido:el.querySelector(".comp-incluido").id,campoRegulador:el.querySelector(".comp-regulador").id,campoPendiente:el.querySelector(".comp-pendiente").id,campoImportePendiente:importePendiente.id }; });
            return { fechaInicio:q("fechaInicio").value,fechaFin:q("fechaFin").value,causa:q("causa").value,tipoTemporal:q("tipoTemporal").value,confirmarImprocedencia:q("confirmarImprocedencia").checked,salarioBruto:q("salarioBruto").value,tipoSalario:radio("tipoSalario"),numeroPagas:q("numeroPagas").value==="otro"?q("numeroPagasOtro").value:q("numeroPagas").value,campoNumeroPagas:q("numeroPagas").value==="otro"?"numeroPagasOtro":"numeroPagas",extrasProrrateadas:radio("extrasProrrateadas"),tipoCuantiasExtras:radio("tipoCuantiasExtras"),cuantiasExtras:Array.from(d.querySelectorAll(".cuantia-extra")).map(i=>i.value),componentes,debenSalario:q("debenSalario").value,importeSalarioPendiente:q("importeSalarioPendiente").value,pagasPendientes:q("pagasPendientes").value,pagas:paginas,regimenVacaciones:radio("regimenVacaciones"),diasAnuales:q("diasAnuales").value,diasDisfrutados:q("diasDisfrutados").value,diasTrasladados:q("diasTrasladados").value,valorDiaVacaciones:q("valorDiaVacaciones").value,cicloVacaciones:q("cicloVacaciones").value,cicloInicio:q("cicloInicio").value,cicloFin:q("cicloFin").value,derechoCiclo:q("derechoCiclo").value,proyectarVacaciones:q("proyectarVacaciones").checked,usarPreaviso:radio("usarPreaviso"),partePreaviso:q("partePreaviso").value,tratamientoPreaviso:q("tratamientoPreaviso").value,diasExigibles:q("diasExigibles").value,diasDados:q("diasDados").value,importeDiaPreaviso:q("importeDiaPreaviso").value,tipoFuentePreaviso:q("tipoFuentePreaviso").value,referenciaPreaviso:q("referenciaPreaviso").value,importeEmpresa:q("importeEmpresa").value,variables:[],ajustes:[] };
        }
        function limpiarErrores(){resumen.hidden=true;resumen.innerHTML="";d.querySelectorAll(".error-campo").forEach(e=>e.textContent="");d.querySelectorAll("[data-error-descrito]").forEach(input=>{const id=input.dataset.errorDescrito,ids=(input.getAttribute("aria-describedby")||"").split(/\s+/).filter(x=>x&&x!==id);if(ids.length)input.setAttribute("aria-describedby",ids.join(" "));else input.removeAttribute("aria-describedby");delete input.dataset.errorDescrito;});d.querySelectorAll(".error-generado").forEach(e=>e.remove());d.querySelectorAll("[aria-invalid=true]").forEach(e=>e.removeAttribute("aria-invalid"));}
        function mostrarErrores(errores){limpiarErrores();resumen.innerHTML=`<strong>Revisa estos datos:</strong><ul>${errores.map(e=>`<li>${escapar(e.mensaje||e)}</li>`).join("")}</ul>`;resumen.hidden=false;let primero=null;errores.forEach((e,i)=>{if(!e.campo)return;const input=q(e.campo)||form.querySelector(`[name="${e.campo}"]`),existente=q(`error-${e.campo}`);if(existente)existente.textContent=e.mensaje;if(input){if(!primero)primero=input;input.setAttribute("aria-invalid","true");if(!existente){const aviso=d.createElement("span"),contenedor=input.closest(".campo")||input.parentElement;aviso.id=`error-dinamico-${e.campo}-${i}`;aviso.className="error-campo error-generado";aviso.textContent=e.mensaje;if(contenedor)contenedor.appendChild(aviso);input.dataset.errorDescrito=aviso.id;input.setAttribute("aria-describedby",`${input.getAttribute("aria-describedby")||""} ${aviso.id}`.trim());}}});(primero||resumen).focus();}
        function campoDesdeError(mensaje){const textoError=String(mensaje),reglas=[["fechaInicio","fechaInicio"],["fechaFin","fechaFin"],["salario.bruto","salarioBruto"],["salario.numeroPagas","numeroPagasOtro"],["ultimoPeriodo.importe","importeSalarioPendiente"],["vacaciones.diasAnuales","diasAnuales"],["vacaciones.disfrutados","diasDisfrutados"],["vacaciones.trasladados","diasTrasladados"],["vacaciones.valorDiaExplicito","valorDiaVacaciones"],["vacaciones.periodosDevengo","cicloInicio"],["preaviso.diasExigibles","diasExigibles"],["preaviso.diasDados","diasDados"],["preaviso.importeDia","importeDiaPreaviso"],["preaviso.referenciaFuente","referenciaPreaviso"]],encontrada=reglas.find(r=>textoError.startsWith(r[0]));if(encontrada)return encontrada[1];let m=textoError.match(/^pagasExtra\.pagas\[(\d+)\](?:\.([A-Za-z]+))?/);if(m){const item=form.querySelectorAll(".paga-ui")[Number(m[1])];if(!item)return null;const clase=m[2]==="cuantiaPeriodoCompleto"?".paga-cuantia":m[2]==="yaPercibido"?".paga-cobrado":".paga-inicio";return item.querySelector(clase).id;}m=textoError.match(/^salario\.componentes\[(\d+)\](?:\.([A-Za-z]+))?/);if(m){const item=form.querySelectorAll(".componente-ui")[Number(m[1])];if(!item)return null;const clase=m[2]==="importeAnual"?".comp-anual":m[2]==="importePendiente"?".comp-importe-pendiente":m[2]==="periodoReferencia"?".comp-periodo-inicio":".comp-id";return item.querySelector(clase).id;}return null;}
        form.addEventListener("change", actualizar);form.addEventListener("input", e=>{if(e.target.id==="numeroPagasOtro")crearInputsExtras();});q("anadirPaga").addEventListener("click",anadirPaga);q("anadirComponente").addEventListener("click",anadirComponente);
        form.addEventListener("click",e=>{if(e.target.classList.contains("eliminar-item"))e.target.closest(".item-repetible").remove();});
        function invalidarResultado(){resultadoEl.className="panel-resultado";resultadoEl.innerHTML='<div class="resultado-vacio"><span aria-hidden="true">!</span><h2>Corrige los datos indicados para volver a calcular</h2><p>El resultado anterior se ha retirado para evitar confusiones.</p></div>';}
        form.addEventListener("submit",e=>{e.preventDefault();invalidarResultado();limpiarErrores();const datos=leer();const erroresBasicos=[];if(!datos.fechaInicio)erroresBasicos.push({campo:"fechaInicio",mensaje:"Indica la fecha de inicio."});if(!datos.fechaFin)erroresBasicos.push({campo:"fechaFin",mensaje:"Indica la fecha de fin."});if(!datos.causa)erroresBasicos.push({campo:"causa",mensaje:"Selecciona el motivo de salida."});if(!(numero(datos.salarioBruto)>0))erroresBasicos.push({campo:"salarioBruto",mensaje:"Introduce un salario bruto válido."});if(erroresBasicos.length){mostrarErrores(erroresBasicos);return;}const calculo=calcular(datos,Core);if(calculo.erroresUI.length){mostrarErrores(calculo.erroresUI);return;}if(calculo.resultado.status==="INVALID")mostrarErrores((calculo.resultado.errores||[]).map(mensaje=>({campo:campoDesdeError(mensaje),mensaje})));resultadoEl.innerHTML=renderResultado(calculo.resultado,datos.importeEmpresa,datos);resultadoEl.classList.toggle("resultado-invalid",calculo.resultado.status==="INVALID");resultadoEl.focus();const pdf=q("descargarPDF");if(pdf)pdf.addEventListener("click",()=>{const detalles=Array.from(resultadoEl.querySelectorAll("details")),estados=detalles.map(detalle=>detalle.open),restaurar=()=>detalles.forEach((detalle,i)=>{detalle.open=estados[i];});window.addEventListener("afterprint",restaurar,{once:true});detalles.forEach(detalle=>{detalle.open=true;});window.print();});});
        form.addEventListener("reset",()=>setTimeout(()=>{indicePaga=0;indiceComponente=0;ultimoRegimen="NATURALES";q("listaPagas").innerHTML="";q("listaComponentes").innerHTML="";detallesIniciales.forEach(item=>{item.detalle.open=item.abierto;});resultadoEl.className="panel-resultado";resultadoEl.innerHTML='<div class="resultado-vacio"><span aria-hidden="true">€</span><h2>Tu estimación aparecerá aquí</h2><p>Verás el finiquito, la indemnización y cualquier dato que falte por completar.</p></div>';limpiarErrores();actualizar();},0));
        actualizar();
    }

    const api = Object.freeze({ construirEntrada, crearCiclos, calcular, compararEmpresa, causaHumana, renderResultado, dinero, iniciar, CAUSAS, PARTIDAS, ENUMS });
    if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => iniciar(document)); else iniciar(document); }
    return api;
});
