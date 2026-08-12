(function (root, factory) {
    "use strict";
    const normativa = typeof module === "object" && module.exports
        ? require("./normativa-2026.js")
        : root.FiniquitoNormativa2026;
    const api = factory(normativa);
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.FiniquitoCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (NORMATIVA) {
    "use strict";

    const STATUS = Object.freeze({ OK: "OK", CONDITIONAL: "CONDITIONAL", UNSUPPORTED: "UNSUPPORTED", INVALID: "INVALID" });
    const CAUSAS_CERO = new Set(["BAJA_VOLUNTARIA", "DESPIDO_DISCIPLINARIO_PROCEDENTE"]);
    const TIPOS_CONCEPTO = new Set(["HORA_EXTRA", "COMISION", "BONUS", "INCENTIVO", "PLUS", "ATRASO", "SALARIAL", "EXTRASALARIAL", "OTRO"]);
    const EFECTOS = new Set(["SUMA", "RESTA"]);

    function esBisiesto(anio) { return anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0); }
    function diasMes(anio, mes) { return [31, esBisiesto(anio) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1] || 0; }
    function parseFechaCivil(texto) {
        const match = typeof texto === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
        if (!match) return null;
        const fecha = { anio: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]), iso: texto };
        if (fecha.anio < 1 || fecha.mes < 1 || fecha.mes > 12 || fecha.dia < 1 || fecha.dia > diasMes(fecha.anio, fecha.mes)) return null;
        return fecha;
    }
    function ordinal(fecha) {
        const y = fecha.anio - 1;
        let total = y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
        for (let m = 1; m < fecha.mes; m += 1) total += diasMes(fecha.anio, m);
        return total + fecha.dia;
    }
    function compararFechas(a, b) { return Math.sign(ordinal(a) - ordinal(b)); }
    function desdeOrdinal(numero) {
        let bajo = 1, alto = Math.max(1, Math.floor(numero / 365) + 2);
        while (ordinal({ anio: alto, mes: 1, dia: 1 }) <= numero) alto *= 2;
        while (bajo < alto) {
            const medio = Math.ceil((bajo + alto) / 2);
            if (ordinal({ anio: medio, mes: 1, dia: 1 }) <= numero) bajo = medio; else alto = medio - 1;
        }
        const anio = bajo;
        let restante = numero - ordinal({ anio, mes: 1, dia: 1 }) + 1, mes = 1;
        while (restante > diasMes(anio, mes)) { restante -= diasMes(anio, mes); mes += 1; }
        return { anio, mes, dia: restante, iso: `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(restante).padStart(2, "0")}` };
    }
    function sumarDias(fecha, dias) { return desdeOrdinal(ordinal(fecha) + dias); }
    function diasInclusivos(inicio, fin) { return ordinal(fin) - ordinal(inicio) + 1; }
    function proporcionAniosCiviles(inicio, fin) {
        let proporcion = 0;
        for (let anio = inicio.anio; anio <= fin.anio; anio += 1) {
            const tramoInicio = anio === inicio.anio ? inicio : parseFechaCivil(`${anio}-01-01`);
            const tramoFin = anio === fin.anio ? fin : parseFechaCivil(`${anio}-12-31`);
            proporcion += diasInclusivos(tramoInicio, tramoFin) / (esBisiesto(anio) ? 366 : 365);
        }
        return proporcion;
    }
    function mesesComputables(inicio, fin) {
        if (compararFechas(fin, inicio) < 0) return 0;
        let meses = (fin.anio - inicio.anio) * 12 + fin.mes - inicio.mes;
        const diaAniversario = Math.min(inicio.dia, diasMes(fin.anio, fin.mes));
        if (fin.dia < diaAniversario) meses -= 1;
        const aniversarioMes = sumarMeses(inicio, meses);
        const completos = Math.max(0, meses);
        return completos + (compararFechas(fin, aniversarioMes) >= 0 ? 1 : 0);
    }
    function sumarMeses(fecha, cantidad) {
        const indice = fecha.anio * 12 + fecha.mes - 1 + cantidad;
        const anio = Math.floor(indice / 12), mes = indice % 12 + 1;
        return { anio, mes, dia: Math.min(fecha.dia, diasMes(anio, mes)), iso: `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(Math.min(fecha.dia, diasMes(anio, mes))).padStart(2, "0")}` };
    }
    function aCentimos(numero) {
        if (!Number.isFinite(numero)) return NaN;
        const signo = numero < 0 ? -1 : 1;
        const partes = Math.abs(numero).toString().toLowerCase().split("e");
        const mantisa = partes[0], exponente = partes.length === 2 ? Number(partes[1]) : 0;
        const trozos = mantisa.split(".");
        let digitos = `${trozos[0]}${trozos[1] || ""}`;
        let posicionDecimal = trozos[0].length + exponente;
        if (posicionDecimal < 0) { digitos = `${"0".repeat(-posicionDecimal)}${digitos}`; posicionDecimal = 0; }
        const corteCentimos = posicionDecimal + 2;
        if (digitos.length <= corteCentimos) digitos += "0".repeat(corteCentimos + 1 - digitos.length);
        const base = Number(digitos.slice(0, corteCentimos) || "0");
        const centimos = base + (Number(digitos.charAt(corteCentimos) || "0") >= 5 ? 1 : 0);
        return signo * centimos;
    }
    function desdeCentimos(centimos) { return centimos / 100; }
    function redondearMoneda(numero) { return desdeCentimos(aCentimos(numero)); }
    function esFinito(value) { return typeof value === "number" && Number.isFinite(value); }
    function tiene(objeto, propiedad) { return Object.prototype.hasOwnProperty.call(objeto, propiedad); }
    function firmaEstructural(value) {
        if (Array.isArray(value)) return `[${value.map(firmaEstructural).join(",")}]`;
        if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${firmaEstructural(value[k])}`).join(",")}}`;
        return JSON.stringify(value);
    }
    function opcionalNumero(objeto, propiedad, defecto, ruta, errores, opciones) {
        if (!tiene(objeto, propiedad)) return defecto;
        validarNumero(objeto[propiedad], ruta, errores, opciones);
        return objeto[propiedad];
    }
    function traza(id, importe, formula, entradas, hipotesis, referencia, extra) {
        return Object.assign({ id, importe: redondearMoneda(importe), valorCalculo: importe, formula, entradas, hipotesis: hipotesis || [], referencia: referencia || null, redondeo: "HALF_UP decimal sobre la representación normalizada del Number; los totales suman céntimos mostrados" }, extra || {});
    }
    function estadoMaximo(estados) {
        const orden = { OK: 0, CONDITIONAL: 1, UNSUPPORTED: 2, INVALID: 3 };
        return estados.reduce((a, b) => orden[b] > orden[a] ? b : a, STATUS.OK);
    }
    function validarNumero(value, ruta, errores, opciones) {
        const opts = opciones || {};
        if (!esFinito(value)) { errores.push(`${ruta}: debe ser un número finito.`); return false; }
        if (opts.entero && !Number.isInteger(value)) errores.push(`${ruta}: debe ser entero.`);
        if (opts.min !== undefined && value < opts.min) errores.push(`${ruta}: no puede ser menor que ${opts.min}.`);
        if (opts.max !== undefined && value > opts.max) errores.push(`${ruta}: supera el máximo admitido de ${opts.max}.`);
        return errores.length === 0 || !errores[errores.length - 1].startsWith(`${ruta}:`);
    }
    function validarEntrada(input) {
        const errores = [], advertencias = [], limite = NORMATIVA.limitesEntrada;
        if (!input || typeof input !== "object" || Array.isArray(input)) return { errores: ["entrada: debe ser un objeto."], advertencias };
        const inicio = parseFechaCivil(input.fechaInicio), fin = parseFechaCivil(input.fechaFin);
        if (!inicio) errores.push("fechaInicio: fecha civil inválida (AAAA-MM-DD).");
        if (!fin) errores.push("fechaFin: fecha civil inválida (AAAA-MM-DD).");
        if (inicio && fin && compararFechas(fin, inicio) < 0) errores.push("fechaFin: no puede ser anterior a fechaInicio.");
        const s = input.salario;
        if (!s || typeof s !== "object") errores.push("salario: estructura obligatoria.");
        else {
            if (!new Set(["MENSUAL", "ANUAL"]).has(s.tipo)) errores.push("salario.tipo: debe ser MENSUAL o ANUAL.");
            validarNumero(s.bruto, "salario.bruto", errores, { min: 0.01, max: limite.importeAbsolutoMaximo });
            if (s.tipo === "MENSUAL") {
                validarNumero(s.numeroPagas, "salario.numeroPagas", errores, { entero: true, min: limite.numeroPagasMinimo, max: limite.numeroPagasMaximo });
                if (typeof s.extrasProrrateadas !== "boolean") errores.push("salario.extrasProrrateadas: debe ser booleano.");
            } else {
                if (tiene(s, "numeroPagas")) validarNumero(s.numeroPagas, "salario.numeroPagas", errores, { entero: true, min: limite.numeroPagasMinimo, max: limite.numeroPagasMaximo });
                if (tiene(s, "extrasProrrateadas") && typeof s.extrasProrrateadas !== "boolean") errores.push("salario.extrasProrrateadas: debe ser booleano si se aporta.");
            }
            ["complementosAnualesComputables", "variablesAnualesComputables"].forEach(k => {
                if (s[k] !== undefined) validarNumero(s[k], `salario.${k}`, errores, { min: 0, max: limite.importeAbsolutoMaximo });
            });
            if (tiene(s, "componentes") && !Array.isArray(s.componentes)) errores.push("salario.componentes: debe ser una lista.");
            if (Array.isArray(s.componentes) && s.componentes.length > limite.conceptosMaximo) errores.push("salario.componentes: demasiados componentes.");
            if (tiene(s, "cuantiasPagasExtraReguladoras") && !Array.isArray(s.cuantiasPagasExtraReguladoras)) errores.push("salario.cuantiasPagasExtraReguladoras: debe ser una lista.");
        }
        ["variables", "ajustes"].forEach(k => {
            if (input[k] !== undefined && !Array.isArray(input[k])) errores.push(`${k}: debe ser una lista.`);
            if (Array.isArray(input[k]) && input[k].length > limite.conceptosMaximo) errores.push(`${k}: demasiados conceptos.`);
        });
        return { errores, advertencias, inicio, fin };
    }
    function calcularBasesSalario(salario) {
        const errores = [], advertencias = [], hipotesis = [], componentesIncluidos = [], componentesPendientes = [], conceptosNoCalculados = [], causasParcialidad = [], ids = new Set();
        let status = STATUS.OK, anualBase = salario.bruto, formula = "retribución anual completa declarada";
        const componentes = Array.isArray(salario.componentes) ? salario.componentes : [];
        componentes.forEach((c, i) => {
            const ruta = `salario.componentes[${i}]`;
            if (!c || typeof c !== "object" || typeof c.id !== "string" || !c.id) { errores.push(`${ruta}.id: obligatorio.`); return; }
            if (ids.has(c.id)) { errores.push(`${ruta}.id: duplicado (${c.id}).`); return; }
            ids.add(c.id);
            validarNumero(c.importeAnual, `${ruta}.importeAnual`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            if (typeof c.incluidoEnBruto !== "boolean" || typeof c.computableIndemnizacion !== "boolean") errores.push(`${ruta}: incluidoEnBruto y computableIndemnizacion deben ser booleanos.`);
            if (tiene(c, "pendientePago") && typeof c.pendientePago !== "boolean") errores.push(`${ruta}.pendientePago: debe ser booleano.`);
            if (tiene(c, "variable") && typeof c.variable !== "boolean") errores.push(`${ruta}.variable: debe ser booleano.`);
            if (c.pendientePago === true) {
                if (!tiene(c, "importePendiente")) {
                    status = STATUS.CONDITIONAL;
                    advertencias.push(`${ruta}: pendientePago=true sin importePendiente; no se infiere desde importeAnual.`);
                    conceptosNoCalculados.push(`componentePendiente:${c.id}`);
                } else {
                    validarNumero(c.importePendiente, `${ruta}.importePendiente`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
                    if (esFinito(c.importePendiente) && c.importePendiente >= 0) componentesPendientes.push({ id: c.id, importe: c.importePendiente, nota: c.notaPendiente || null });
                }
            } else if (tiene(c, "importePendiente")) errores.push(`${ruta}.importePendiente: requiere pendientePago=true.`);
            if (c.computableIndemnizacion && c.variable === true) {
                if (!tiene(c, "periodoReferencia")) {
                    status = STATUS.CONDITIONAL;
                    advertencias.push(`${ruta}: variable computable sin período de referencia verificable.`);
                    causasParcialidad.push({ codigo: "VARIABLE_PERIODO_REFERENCIA_AUSENTE", concepto: ruta, id: c.id || null, nombre: c.nombre || null, campo: "periodoReferencia", motivo: "La variable computable no dispone de un período representativo." });
                }
                else if (!c.periodoReferencia || typeof c.periodoReferencia !== "object" || Array.isArray(c.periodoReferencia)) errores.push(`${ruta}.periodoReferencia: debe ser un objeto con inicio y fin.`);
                else {
                    const pri = parseFechaCivil(c.periodoReferencia.inicio), prf = parseFechaCivil(c.periodoReferencia.fin);
                    if (!pri || !prf) errores.push(`${ruta}.periodoReferencia: inicio y fin deben ser fechas civiles válidas.`);
                    else if (compararFechas(prf, pri) < 0) errores.push(`${ruta}.periodoReferencia: fin no puede ser anterior a inicio.`);
                }
            }
            if (c.computableIndemnizacion && !c.incluidoEnBruto && esFinito(c.importeAnual)) { anualBase += c.importeAnual; componentesIncluidos.push(c.id); }
            if (c.computableIndemnizacion && c.incluidoEnBruto) componentesIncluidos.push(`${c.id} (ya incluido)`);
        });
        if (salario.tipo === "MENSUAL") {
            if (salario.extrasProrrateadas) {
                anualBase = salario.bruto * 12;
                formula = "mensualidad con prorrata real × 12";
                hipotesis.push("El bruto mensual declarado incluye la prorrata real de extras.");
                if (Array.isArray(salario.cuantiasPagasExtraReguladoras) && salario.cuantiasPagasExtraReguladoras.length) errores.push("salario: no añada extras reguladoras si la mensualidad ya las prorratea.");
            } else if (Array.isArray(salario.cuantiasPagasExtraReguladoras) && salario.cuantiasPagasExtraReguladoras.length) {
                salario.cuantiasPagasExtraReguladoras.forEach((v, i) => validarNumero(v, `salario.cuantiasPagasExtraReguladoras[${i}]`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo }));
                anualBase = salario.bruto * 12 + salario.cuantiasPagasExtraReguladoras.reduce((s, v) => s + (esFinito(v) ? v : 0), 0);
                formula = "12 mensualidades ordinarias + cuantías reales de pagas extraordinarias reguladoras";
            } else {
                anualBase = salario.bruto * salario.numeroPagas;
                formula = "mensualidad × número de pagas (estimación condicionada)";
                hipotesis.push("Se estiman extras iguales a la mensualidad por no haberse aportado sus cuantías reales.");
                advertencias.push("La base salarial es estimada: faltan cuantías reales de pagas extraordinarias.");
                status = STATUS.CONDITIONAL;
            }
            componentes.forEach(c => { if (c && typeof c === "object" && c.computableIndemnizacion && !c.incluidoEnBruto && esFinito(c.importeAnual)) anualBase += c.importeAnual; });
        }
        const legadoComplementos = opcionalNumero(salario, "complementosAnualesComputables", 0, "salario.complementosAnualesComputables", errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
        const legadoVariables = opcionalNumero(salario, "variablesAnualesComputables", 0, "salario.variablesAnualesComputables", errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
        if (legadoComplementos || legadoVariables) {
            anualBase += legadoComplementos + legadoVariables;
            status = STATUS.CONDITIONAL;
            advertencias.push("Componentes salariales heredados sin identificador ni declaración de inclusión: revise posible duplicidad.");
        }
        const referencia = NORMATIVA.referencias.salarioRegulador.cita;
        const anual = traza("salarioAnualComputable", anualBase, formula, { bruto: salario.bruto, tipo: salario.tipo, componentesIncluidos, periodo: salario.periodoReferencia || "ANUAL_DECLARADO" }, hipotesis, referencia);
        const diarioIndemnizacion = traza("salarioDiarioIndemnizacion", anual.valorCalculo / 365, "salario anual computable ÷ 365", { salarioAnualComputable: anual.valorCalculo, componentesIncluidos, periodo: salario.periodoReferencia || "ANUAL_DECLARADO" }, hipotesis, referencia);
        const mensualRegulador = traza("salarioMensualRegulador", anual.valorCalculo / 12, "salario anual computable ÷ 12", { salarioAnualComputable: anual.valorCalculo, componentesIncluidos }, hipotesis, referencia);
        return { status: errores.length ? STATUS.INVALID : status, errores, advertencias, causasParcialidad, componentesIncluidos, componentesPendientes, conceptosNoCalculados, anual, diarioIndemnizacion, mensualRegulador };
    }
    function calcularSalarioPendiente(config, bases, fechaFin) {
        if (!config) return { status: STATUS.CONDITIONAL, importe: 0, advertencias: ["Salario pendiente no calculado: falta ultimoPeriodo."], trazabilidad: [] };
        const errores = [];
        if (!new Set(["IMPORTE_EXPLICITO", "DIARIO_365", "MES_CALENDARIO", "MENSUAL_30"]).has(config.estrategia)) errores.push("ultimoPeriodo.estrategia: no reconocida.");
        let importe = 0, formula = "", entradas = { ultimoPeriodo: config }, hipotesis = [];
        if (config.estrategia === "IMPORTE_EXPLICITO") {
            validarNumero(config.importe, "ultimoPeriodo.importe", errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            importe = config.importe; formula = "importe bruto pendiente proporcionado explícitamente";
        } else {
            validarNumero(config.diasPendientes, "ultimoPeriodo.diasPendientes", errores, { min: 0, max: 366 });
            if (config.estrategia === "DIARIO_365") { importe = bases.anual.valorCalculo / 365 * config.diasPendientes; formula = "salario anual computable ÷ 365 × días pendientes"; }
            if (config.estrategia === "MENSUAL_30") { importe = bases.mensualRegulador.valorCalculo / 30 * config.diasPendientes; formula = "salario mensual regulador ÷ 30 × días pendientes"; hipotesis.push("Se ha seleccionado expresamente el divisor convencional de 30 días."); }
            if (config.estrategia === "MES_CALENDARIO") {
                const totalMes = diasMes(fechaFin.anio, fechaFin.mes);
                if (config.diasPendientes > totalMes) errores.push("ultimoPeriodo.diasPendientes: supera los días del mes de extinción.");
                importe = bases.mensualRegulador.valorCalculo / totalMes * config.diasPendientes;
                formula = "salario mensual regulador ÷ días civiles del mes de extinción × días pendientes";
                entradas.diasMesExtincion = totalMes;
            }
        }
        if (errores.length) return { status: STATUS.INVALID, importe: 0, errores, advertencias: [], trazabilidad: [] };
        const item = traza("salarioPendiente", importe, formula, entradas, hipotesis, null);
        const avanzada = config.estrategia !== "IMPORTE_EXPLICITO";
        return { status: avanzada ? STATUS.CONDITIONAL : STATUS.OK, importe: item.importe, advertencias: avanzada ? [`${config.estrategia}: criterio matemático avanzado que debe corresponder al tipo real de retribución.`] : [], errores: [], trazabilidad: [item] };
    }
    function calcularPagasExtra(config, inicio, fin) {
        if (!config) return { status: STATUS.CONDITIONAL, importe: 0, advertencias: ["Pagas extraordinarias no calculadas: falta su configuración de convenio/contrato."], errores: [], trazabilidad: [] };
        if (typeof config.prorrateadas !== "boolean") return { status: STATUS.INVALID, importe: 0, advertencias: [], errores: ["pagasExtra.prorrateadas: debe ser booleano."], trazabilidad: [] };
        if (tiene(config, "pagas") && !Array.isArray(config.pagas)) return { status: STATUS.INVALID, importe: 0, advertencias: [], errores: ["pagasExtra.pagas: debe ser una lista si se aporta."], trazabilidad: [] };
        const declaradas = Array.isArray(config.pagas) ? config.pagas : [];
        const erroresDeclaradas = [], idsPagas = new Set(), firmasSinId = new Map(), posiblesDuplicadas = [];
        declaradas.forEach((paga, index) => {
            const ruta = `pagasExtra.pagas[${index}]`;
            if (!paga || typeof paga !== "object") { erroresDeclaradas.push(`${ruta}: debe ser objeto.`); return; }
            validarNumero(paga.cuantiaPeriodoCompleto, `${ruta}.cuantiaPeriodoCompleto`, erroresDeclaradas, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            opcionalNumero(paga, "yaPercibido", 0, `${ruta}.yaPercibido`, erroresDeclaradas, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            if (tiene(paga, "id")) {
                if (typeof paga.id !== "string" || !paga.id.trim()) erroresDeclaradas.push(`${ruta}.id: debe ser texto no vacío.`);
                else if (idsPagas.has(paga.id)) erroresDeclaradas.push(`${ruta}.id: duplicado (${paga.id}).`);
                else idsPagas.add(paga.id);
            } else {
                const extrasFirma = {};
                Object.keys(paga).filter(k => !new Set(["id", "nombre", "cuantiaPeriodoCompleto", "periodoInicio", "periodoFin", "yaPercibido", "periodicidad"]).has(k)).forEach(k => { extrasFirma[k] = paga[k]; });
                const firma = firmaEstructural({ nombre: paga.nombre || null, cuantiaPeriodoCompleto: paga.cuantiaPeriodoCompleto, periodoInicio: paga.periodoInicio, periodoFin: paga.periodoFin, yaPercibido: tiene(paga, "yaPercibido") ? paga.yaPercibido : 0, periodicidad: paga.periodicidad || "CONFIGURADA", extras: extrasFirma });
                if (firmasSinId.has(firma)) posiblesDuplicadas.push([firmasSinId.get(firma), index]);
                else firmasSinId.set(firma, index);
            }
            const pi = parseFechaCivil(paga.periodoInicio), pf = parseFechaCivil(paga.periodoFin);
            if (!pi || !pf || compararFechas(pf, pi) < 0) erroresDeclaradas.push(`${ruta}: período de devengo inválido.`);
        });
        if (erroresDeclaradas.length) return { status: STATUS.INVALID, importe: 0, advertencias: [], errores: erroresDeclaradas, trazabilidad: [] };
        if (config.prorrateadas === true) {
            const incompatible = declaradas.length > 0;
            return { status: incompatible ? STATUS.CONDITIONAL : STATUS.OK, importe: 0, advertencias: incompatible ? ["Pagas declaradas como prorrateadas y, a la vez, con ciclos pendientes: configuración incompatible; no se añade saldo."] : ["Pagas extraordinarias ya prorrateadas; saldo separado cero."], errores: [], causasParcialidad: incompatible ? [{ codigo: "PAGAS_PRORRATEADAS_CON_CICLOS", concepto: "pagasExtraordinarias", motivo: "Se declararon simultáneamente prorrata y ciclos separados." }] : [], trazabilidad: [traza("pagasExtraPendientes", 0, "pagas prorrateadas: saldo separado cero", { prorrateadas: true, pagasDeclaradas: declaradas.length }, [], NORMATIVA.referencias.pagasExtra.cita)] };
        }
        if (!Array.isArray(config.pagas) || config.pagas.length === 0) return { status: STATUS.CONDITIONAL, importe: 0, advertencias: ["Faltan cuantías y períodos explícitos de las pagas extraordinarias."], errores: [], trazabilidad: [] };
        const errores = [], advertencias = [], items = [];
        posiblesDuplicadas.forEach(indices => advertencias.push(`pagasExtra.pagas[${indices[1]}]: configuración idéntica a pagasExtra.pagas[${indices[0]}] sin id; confirme que no es una duplicación.`));
        config.pagas.forEach((paga, index) => {
            const ruta = `pagasExtra.pagas[${index}]`;
            validarNumero(paga.cuantiaPeriodoCompleto, `${ruta}.cuantiaPeriodoCompleto`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            const yaPercibido = opcionalNumero(paga, "yaPercibido", 0, `${ruta}.yaPercibido`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            const pi = parseFechaCivil(paga.periodoInicio), pf = parseFechaCivil(paga.periodoFin);
            if (!pi || !pf || compararFechas(pf, pi) < 0) { errores.push(`${ruta}: período de devengo inválido.`); return; }
            const solapeInicio = compararFechas(inicio, pi) > 0 ? inicio : pi;
            const solapeFin = compararFechas(fin, pf) < 0 ? fin : pf;
            const diasPeriodo = diasInclusivos(pi, pf);
            const diasDevengados = compararFechas(solapeFin, solapeInicio) < 0 ? 0 : diasInclusivos(solapeInicio, solapeFin);
            const generado = paga.cuantiaPeriodoCompleto * diasDevengados / diasPeriodo;
            const diferencia = generado - yaPercibido;
            const inconsistente = diferencia < -0.005;
            if (inconsistente) advertencias.push(`${ruta}: lo percibido supera lo devengado; no se genera deuda ni deducción automática.`);
            const pendiente = inconsistente ? 0 : Math.max(0, diferencia);
            items.push(traza(`pagaExtra.${paga.nombre || index + 1}`, pendiente, "máximo(0, devengado − percibido); un exceso cobrado queda condicionado", { cuantiaPeriodoCompleto: paga.cuantiaPeriodoCompleto, periodoInicio: paga.periodoInicio, periodoFin: paga.periodoFin, diasPeriodo, diasDevengados, yaPercibido }, [], NORMATIVA.referencias.pagasExtra.cita, { generado: redondearMoneda(generado), cobrado: redondearMoneda(yaPercibido), pendiente: redondearMoneda(pendiente), excesoPercibidoNoDeducido: inconsistente ? redondearMoneda(-diferencia) : 0, periodicidad: paga.periodicidad || "CONFIGURADA" }));
        });
        if (errores.length) return { status: STATUS.INVALID, importe: 0, errores, advertencias: [], trazabilidad: [] };
        const centimos = items.reduce((sum, item) => sum + aCentimos(item.importe), 0);
        return { status: advertencias.length ? STATUS.CONDITIONAL : STATUS.OK, importe: desdeCentimos(centimos), generado: desdeCentimos(items.reduce((s, i) => s + aCentimos(i.generado), 0)), cobrado: desdeCentimos(items.reduce((s, i) => s + aCentimos(i.cobrado), 0)), errores: [], advertencias, causasParcialidad: posiblesDuplicadas.map(indices => ({ codigo: "PAGA_POSIBLE_DUPLICIDAD", concepto: `pagasExtra.pagas[${indices[1]}]`, motivo: `Configuración idéntica a pagasExtra.pagas[${indices[0]}] sin identidad diferenciada.` })), trazabilidad: items };
    }
    function calcularVacaciones(config, inicio, fin, bases) {
        if (!config) return { status: STATUS.CONDITIONAL, importe: 0, advertencias: ["Vacaciones no calculadas: falta configuración y días disfrutados."], errores: [], trazabilidad: [] };
        const errores = [], advertencias = [], hipotesis = [];
        if (tiene(config, "periodosDevengo") && !Array.isArray(config.periodosDevengo)) return { status: STATUS.INVALID, importe: 0, advertencias: [], errores: ["vacaciones.periodosDevengo: debe ser una lista."], trazabilidad: [] };
        const regimen = tiene(config, "regimen") ? config.regimen : "NATURALES";
        if (!new Set(["NATURALES", "LABORABLES"]).has(regimen)) errores.push("vacaciones.regimen: debe ser NATURALES o LABORABLES.");
        let diasAnuales = config.diasAnuales;
        if (!tiene(config, "diasAnuales") && regimen === "NATURALES") diasAnuales = NORMATIVA.vacaciones.diasNaturalesMinimosAnuales;
        if (regimen === "LABORABLES" && !tiene(config, "diasAnuales")) return { status: STATUS.CONDITIONAL, importe: 0, advertencias: ["En régimen LABORABLES debe proporcionarse diasAnuales; no se convierte desde 30 naturales."], errores: [], trazabilidad: [] };
        validarNumero(diasAnuales, "vacaciones.diasAnuales", errores, { min: regimen === "NATURALES" ? 30 : 0.01, max: NORMATIVA.limitesEntrada.diasAnualesMaximo });
        validarNumero(config.disfrutados, "vacaciones.disfrutados", errores, { min: 0, max: NORMATIVA.limitesEntrada.diasAnualesMaximo * 100 });
        const trasladados = opcionalNumero(config, "trasladados", 0, "vacaciones.trasladados", errores, { min: 0, max: NORMATIVA.limitesEntrada.diasAnualesMaximo * 100 });
        const diasContrato = diasInclusivos(inicio, fin), periodosUsados = [];
        let generados = 0, formulaDevengo;
        let integridadPeriodos = { status: STATUS.CONDITIONAL, diasContrato, diasCubiertos: 0, huecos: [{ inicio: inicio.iso, fin: fin.iso, dias: diasContrato }], solapamientos: [] };
        if (Array.isArray(config.periodosDevengo) && config.periodosDevengo.length) {
            const periodosValidos = [];
            config.periodosDevengo.forEach((p, i) => {
                if (!p || typeof p !== "object") { errores.push(`vacaciones.periodosDevengo[${i}]: debe ser objeto.`); return; }
                const pi = parseFechaCivil(p.inicio), pf = parseFechaCivil(p.fin);
                if (!pi || !pf || compararFechas(pf, pi) < 0) { errores.push(`vacaciones.periodosDevengo[${i}]: período inválido.`); return; }
                let derechoExplicito = null;
                if (tiene(p, "diasDerechoPeriodoCompleto")) {
                    validarNumero(p.diasDerechoPeriodoCompleto, `vacaciones.periodosDevengo[${i}].diasDerechoPeriodoCompleto`, errores, { min: 0, max: NORMATIVA.limitesEntrada.diasAnualesMaximo * 100 });
                    if (esFinito(p.diasDerechoPeriodoCompleto) && p.diasDerechoPeriodoCompleto >= 0) derechoExplicito = p.diasDerechoPeriodoCompleto;
                } else {
                    advertencias.push(`vacaciones.periodosDevengo[${i}]: falta diasDerechoPeriodoCompleto; se usa una estimación por tasa anual /365.`);
                    hipotesis.push("Un ciclo sin derecho completo explícito se estima mediante la tasa anual declarada y queda condicionado.");
                }
                periodosValidos.push({ indice: i, inicio: pi, fin: pf, derechoExplicito });
            });
            const intervalos = periodosValidos.map(p => ({
                indice: p.indice,
                inicio: compararFechas(inicio, p.inicio) > 0 ? inicio : p.inicio,
                fin: compararFechas(fin, p.fin) < 0 ? fin : p.fin,
                cicloInicio: p.inicio,
                cicloFin: p.fin
            })).filter(p => compararFechas(p.fin, p.inicio) >= 0).sort((a, b) => ordinal(a.inicio) - ordinal(b.inicio) || ordinal(a.fin) - ordinal(b.fin));
            const solapamientos = [];
            for (let i = 1; i < intervalos.length; i += 1) {
                if (compararFechas(intervalos[i].inicio, intervalos[i - 1].fin) <= 0) {
                    solapamientos.push({ periodos: [intervalos[i - 1].indice, intervalos[i].indice], inicio: intervalos[i].inicio.iso, fin: (compararFechas(intervalos[i - 1].fin, intervalos[i].fin) < 0 ? intervalos[i - 1].fin : intervalos[i].fin).iso });
                }
            }
            if (solapamientos.length) errores.push("vacaciones.periodosDevengo: existen ciclos duplicados o solapados sobre el período laboral.");
            const huecos = [];
            let cursor = inicio;
            intervalos.forEach(p => {
                if (compararFechas(p.inicio, cursor) > 0) {
                    const finHueco = sumarDias(p.inicio, -1);
                    huecos.push({ inicio: cursor.iso, fin: finHueco.iso, dias: diasInclusivos(cursor, finHueco) });
                }
                const siguiente = sumarDias(p.fin, 1);
                if (compararFechas(siguiente, cursor) > 0) cursor = siguiente;
            });
            if (compararFechas(cursor, fin) <= 0) huecos.push({ inicio: cursor.iso, fin: fin.iso, dias: diasInclusivos(cursor, fin) });
            const diasHuecos = huecos.reduce((s, h) => s + h.dias, 0);
            integridadPeriodos = { status: solapamientos.length ? STATUS.INVALID : (huecos.length ? STATUS.CONDITIONAL : STATUS.OK), diasContrato, diasCubiertos: diasContrato - diasHuecos, huecos, solapamientos };
            if (huecos.length) advertencias.push("Los ciclos explícitos de vacaciones no cubren todo el período laboral; el saldo omite los huecos identificados.");
            periodosValidos.forEach(p => {
                const pi = p.inicio, pf = p.fin;
                const si = compararFechas(inicio, pi) > 0 ? inicio : pi, sf = compararFechas(fin, pf) < 0 ? fin : pf;
                const diasPeriodo = diasInclusivos(pi, pf), diasDevengados = compararFechas(sf, si) < 0 ? 0 : diasInclusivos(si, sf);
                const derechoPeriodo = p.derechoExplicito;
                const generadoPeriodo = derechoPeriodo === null ? diasAnuales * diasDevengados / 365 : derechoPeriodo * diasDevengados / diasPeriodo;
                generados += generadoPeriodo;
                periodosUsados.push({ indice: p.indice, inicio: pi.iso, fin: pf.iso, diasPeriodo, diasDevengados, diasDerechoPeriodoCompleto: derechoPeriodo, estrategia: derechoPeriodo === null ? "TASA_ANUAL_ESTIMADA_365" : "DERECHO_PERIODO_EXPLICITO", generado: Math.round(generadoPeriodo * 10000) / 10000 });
            });
            formulaDevengo = "por ciclo: derecho completo explícito × solape ÷ duración; si falta derecho, estimación condicionada mediante días anuales × solape ÷ 365";
        } else {
            generados = diasAnuales * diasContrato / 365;
            formulaDevengo = "estimación condicionada: días anuales × días reales de contrato ÷ 365";
            advertencias.push("Vacaciones estimadas sin período de devengo explícito; confirme el ciclo de convenio/contrato.");
            hipotesis.push("Estimación continua /365; no se fracciona artificialmente por años civiles.");
        }
        const pendientes = generados + trasladados - config.disfrutados;
        if (pendientes < 0) advertencias.push("Saldo vacacional negativo: puede representar disfrute anticipado; no genera deuda automática.");
        let valorDia, formulaValor;
        if (tiene(config, "valorDiaExplicito")) { validarNumero(config.valorDiaExplicito, "vacaciones.valorDiaExplicito", errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo }); valorDia = config.valorDiaExplicito; formulaValor = "valor diario bruto explícito"; }
        else if (regimen === "NATURALES") { valorDia = bases.anual.valorCalculo / 365; formulaValor = "salario anual computable ÷ 365"; hipotesis.push("La remuneración vacacional puede depender del convenio."); advertencias.push("Confirme la base de remuneración vacacional aplicable."); }
        else return { status: STATUS.CONDITIONAL, importe: 0, errores, advertencias: ["Para días LABORABLES debe proporcionarse valorDiaExplicito."], trazabilidad: [] };
        if (errores.length) {
            const auditoriaIntegridad = traza("integridadPeriodosVacaciones", 0, "validación de continuidad, cobertura, duplicación y solapamiento de ciclos", { periodosUsados, integridadPeriodos }, [], NORMATIVA.referencias.vacaciones.cita, { integridadPeriodos });
            return { status: STATUS.INVALID, importe: 0, errores, advertencias, trazabilidad: [auditoriaIntegridad], integridadPeriodos };
        }
        const importe = Math.max(0, pendientes) * valorDia;
        const saldoRedondeado = Math.round(pendientes);
        const saldoEntero = Math.abs(pendientes - saldoRedondeado) < 1e-9;
        let periodoPosteriorEstimado = { status: STATUS.CONDITIONAL, inicio: null, fin: null, diasProyectables: null, saldoMatematico: Math.round(pendientes * 10000) / 10000, unidadSaldo: regimen, unidadDestino: null, naturaleza: "NO_RECONOCE_PRESTACION" };
        if (pendientes <= 0) periodoPosteriorEstimado = { status: STATUS.OK, inicio: null, fin: null, diasProyectables: 0, naturaleza: "SIN_PERIODO" };
        else if (config.proyeccion && typeof config.proyeccion === "object" && !Array.isArray(config.proyeccion) && config.proyeccion.reglaExplicita === true && Number.isInteger(config.proyeccion.diasProyectables) && config.proyeccion.diasProyectables >= 0 && typeof config.proyeccion.referencia === "string" && config.proyeccion.referencia.trim()) {
            const d = config.proyeccion.diasProyectables;
            const unidades = new Set(["NATURALES", "LABORABLES"]);
            const unidadOrigen = config.proyeccion.unidadOrigen, unidadDestino = config.proyeccion.unidadDestino;
            const unidadesValidas = unidades.has(unidadOrigen) && unidades.has(unidadDestino) && unidadOrigen === regimen;
            const identidad = unidadesValidas && unidadOrigen === "NATURALES" && unidadDestino === "NATURALES" && saldoEntero && d === saldoRedondeado;
            const identidadLaborableSinCalendario = unidadesValidas && unidadOrigen === "LABORABLES" && unidadDestino === "LABORABLES" && saldoEntero && d === saldoRedondeado;
            const transformacionDocumentada = typeof config.proyeccion.tipoTransformacion === "string" && config.proyeccion.tipoTransformacion.trim() && typeof config.proyeccion.justificacion === "string" && config.proyeccion.justificacion.trim();
            if (identidadLaborableSinCalendario) {
                periodoPosteriorEstimado = { status: STATUS.CONDITIONAL, inicio: null, fin: null, diasProyectables: d, saldoMatematico: Math.round(pendientes * 10000) / 10000, unidadSaldo: regimen, unidadOrigen, unidadDestino, referencia: config.proyeccion.referencia, tipoTransformacion: "IDENTIDAD_CANTIDAD_LABORABLE", justificacion: "La cantidad laborable coincide, pero falta calendario laboral para determinar fechas.", naturaleza: "CANTIDAD_CONSERVADA_SIN_DERIVACION_CALENDARIO" };
                advertencias.push("Se conservan los días laborables proyectables, pero no se calculan fechas sin calendario laboral verificable.");
            } else if (identidad || (unidadesValidas && transformacionDocumentada)) {
                const calendarioDeterminado = unidadDestino === "NATURALES" && unidadesValidas;
                periodoPosteriorEstimado = { status: identidad ? STATUS.OK : STATUS.CONDITIONAL, inicio: calendarioDeterminado && d ? sumarDias(fin, 1).iso : null, fin: calendarioDeterminado && d ? sumarDias(fin, d).iso : null, diasProyectables: d, saldoMatematico: Math.round(pendientes * 10000) / 10000, unidadSaldo: regimen, unidadOrigen, unidadDestino, referencia: config.proyeccion.referencia, tipoTransformacion: identidad ? "IDENTIDAD_NATURALES" : config.proyeccion.tipoTransformacion, justificacion: identidad ? "El saldo matemático natural es entero y coincide exactamente con los días naturales proyectados." : config.proyeccion.justificacion, naturaleza: "DERIVACION_CALENDARIO_NO_RECONOCIMIENTO_DE_PRESTACION" };
                if (!identidad) advertencias.push("La proyección transforma el saldo matemático mediante una regla documentada; requiere revisión.");
            } else advertencias.push("Período posterior no proyectado: las unidades o los días no coinciden y falta una transformación estructurada verificable.");
        } else advertencias.push("Período posterior no proyectado: falta regla explícita, unidades y referencia para convertir el saldo en días enteros.");
        if (diasAnuales > NORMATIVA.limitesDominio.diasVacacionesAnualesOrdinariosMaximo) advertencias.push("Días anuales extraordinarios: confirme convenio/contrato.");
        const item = traza("vacacionesPendientes", importe, "máximo(0, generadas + trasladadas − disfrutadas) × valor diario", { diasAnuales, diasContrato, formulaDevengo, periodosUsados, integridadPeriodos, trasladados, disfrutados: config.disfrutados, valorDia, formulaValor }, hipotesis, NORMATIVA.referencias.vacaciones.cita, { generadas: Math.round(generados * 10000) / 10000, disfrutadas: config.disfrutados, trasladadas: trasladados, pendientes: Math.round(pendientes * 10000) / 10000, integridadPeriodos, periodoPosteriorEstimado });
        return { status: advertencias.length ? STATUS.CONDITIONAL : STATUS.OK, importe: item.importe, errores, advertencias, trazabilidad: [item], generadas: item.generadas, disfrutadas: item.disfrutadas, pendientes: item.pendientes, integridadPeriodos, periodoPosteriorEstimado };
    }
    function calcularConceptos(lista, grupo) {
        if (!lista) return { status: STATUS.OK, importe: 0, errores: [], advertencias: [], partidas: [], trazabilidad: [] };
        const errores = [], partidas = [];
        lista.forEach((c, index) => {
            const ruta = `${grupo}[${index}]`;
            if (!c || typeof c !== "object") { errores.push(`${ruta}: debe ser objeto.`); return; }
            if (typeof c.nombre !== "string" || !c.nombre.trim()) errores.push(`${ruta}.nombre: obligatorio.`);
            if (!TIPOS_CONCEPTO.has(c.tipo)) errores.push(`${ruta}.tipo: no reconocido.`);
            if (!EFECTOS.has(c.efecto)) errores.push(`${ruta}.efecto: debe ser SUMA o RESTA.`);
            validarNumero(c.importe, `${ruta}.importe`, errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
            if (esFinito(c.importe) && EFECTOS.has(c.efecto)) {
                const firmado = c.efecto === "RESTA" ? -c.importe : c.importe;
                partidas.push(traza(`${grupo}.${index}`, firmado, c.efecto === "RESTA" ? "− importe explícito" : "+ importe explícito", { nombre: c.nombre, importe: c.importe, tipo: c.tipo, efecto: c.efecto, nota: c.nota || null }, [], null));
            }
        });
        if (errores.length) return { status: STATUS.INVALID, importe: 0, errores, advertencias: [], partidas: [], trazabilidad: [] };
        return { status: STATUS.OK, importe: desdeCentimos(partidas.reduce((s, p) => s + aCentimos(p.importe), 0)), errores, advertencias: [], partidas, trazabilidad: partidas };
    }
    function calcularPreaviso(config, causaExtincion) {
        if (config === undefined) return { status: STATUS.CONDITIONAL, importe: 0, errores: [], advertencias: ["Preaviso no aplicado: falta configuración explícita; nunca se deduce automáticamente."], trazabilidad: [] };
        if (!config || typeof config !== "object" || Array.isArray(config)) return { status: STATUS.INVALID, importe: 0, errores: ["preaviso: debe ser un objeto."], advertencias: [], trazabilidad: [] };
        if (typeof config.aplicar !== "boolean") return { status: STATUS.INVALID, importe: 0, errores: ["preaviso.aplicar: debe ser booleano."], advertencias: [], trazabilidad: [] };
        if (config.aplicar === false) return { status: STATUS.OK, importe: 0, errores: [], advertencias: [], trazabilidad: [traza("preaviso", 0, "sin ajuste por indicación expresa", { aplicar: false }, [], null)] };
        const errores = [];
        validarNumero(config.diasExigibles, "preaviso.diasExigibles", errores, { min: 0, max: 366 });
        validarNumero(config.diasDados, "preaviso.diasDados", errores, { min: 0, max: 366 });
        validarNumero(config.importeDia, "preaviso.importeDia", errores, { min: 0, max: NORMATIVA.limitesEntrada.importeAbsolutoMaximo });
        if (!new Set(["EMPRESA", "PERSONA_TRABAJADORA"]).has(config.parteObligada)) errores.push("preaviso.parteObligada: no reconocida.");
        const tratamientos = new Set(["DEDUCCION", "ABONO", "SIN_AJUSTE"]);
        if (tiene(config, "tratamientoEconomico") && !tratamientos.has(config.tratamientoEconomico)) errores.push("preaviso.tratamientoEconomico: debe ser DEDUCCION, ABONO o SIN_AJUSTE.");
        if (!new Set(["NORMA", "CONVENIO", "CONTRATO"]).has(config.tipoFuente) || typeof config.referenciaFuente !== "string" || !config.referenciaFuente.trim()) return { status: STATUS.CONDITIONAL, importe: 0, errores, advertencias: ["Preaviso condicionado: falta tipo y referencia identificable de norma, convenio o contrato."], trazabilidad: [] };
        if (config.causaExtincion !== causaExtincion) return { status: STATUS.CONDITIONAL, importe: 0, errores, advertencias: ["Preaviso no aplicado: la causa configurada no coincide con la causa de extinción."], trazabilidad: [] };
        if (errores.length) return { status: STATUS.INVALID, importe: 0, errores, advertencias: [], trazabilidad: [] };
        if (!tiene(config, "tratamientoEconomico")) return { status: STATUS.CONDITIONAL, importe: 0, errores: [], advertencias: ["Preaviso no aplicado: falta tratamientoEconomico explícito (DEDUCCION, ABONO o SIN_AJUSTE)."], trazabilidad: [] };
        const diasIncumplidos = Math.max(0, config.diasExigibles - config.diasDados);
        const signo = config.tratamientoEconomico === "DEDUCCION" ? -1 : (config.tratamientoEconomico === "ABONO" ? 1 : 0);
        const item = traza("preaviso", signo * diasIncumplidos * config.importeDia, "(días exigibles − días dados, mínimo 0) × importe diario × signo económico explícito", { causaExtincion, diasExigibles: config.diasExigibles, diasDados: config.diasDados, diasIncumplidos, importeDia: config.importeDia, parteObligada: config.parteObligada, tipoFuente: config.tipoFuente, referenciaFuente: config.referenciaFuente, tratamientoEconomico: config.tratamientoEconomico }, [], config.referenciaFuente);
        return { status: STATUS.OK, importe: item.importe, errores, advertencias: [], trazabilidad: [item] };
    }
    function indemnizacionPorMeses(id, meses, diasAnio, bases, maxMensualidades, referencia) {
        const diasTeoricos = meses / 12 * diasAnio;
        const limiteDias = maxMensualidades * 30;
        const diasAplicados = Math.min(diasTeoricos, limiteDias);
        const importe = diasAplicados * bases.diarioIndemnizacion.valorCalculo;
        return traza(id, importe, "meses computables ÷ 12 × días por año × salario diario; sujeto a límite en mensualidades", { mesesComputables: meses, diasPorAnio: diasAnio, salarioDiario: bases.diarioIndemnizacion.valorCalculo, diasTeoricos, limiteDias, diasAplicados }, ["Toda fracción de mes se prorratea como mes completo."], referencia, { diasIndemnizatorios: diasAplicados, limiteAplicado: diasAplicados < diasTeoricos });
    }
    function calcularIndemnizacion(extincion, inicio, fin, bases) {
        if (!extincion || typeof extincion !== "object" || typeof extincion.causa !== "string") return { status: STATUS.CONDITIONAL, importe: 0, errores: [], advertencias: ["Indemnización no calculada: falta causa de extinción."], trazabilidad: [] };
        if (tiene(extincion, "improcedenciaReconocidaOSimulada") && typeof extincion.improcedenciaReconocidaOSimulada !== "boolean") return { status: STATUS.INVALID, importe: 0, errores: ["extincion.improcedenciaReconocidaOSimulada: debe ser booleano."], advertencias: [], trazabilidad: [] };
        if (tiene(extincion, "normativaEspecifica") && typeof extincion.normativaEspecifica !== "boolean") return { status: STATUS.INVALID, importe: 0, errores: ["extincion.normativaEspecifica: debe ser booleano."], advertencias: [], trazabilidad: [] };
        const causa = extincion.causa;
        if (NORMATIVA.causasNoSoportadas.includes(causa) || !NORMATIVA.causasSoportadas.includes(causa)) return { status: STATUS.UNSUPPORTED, importe: 0, causa, errores: [], advertencias: [`Causa ${causa}: no soportada automáticamente en Fase 1.`], trazabilidad: [] };
        if (CAUSAS_CERO.has(causa)) {
            const item = traza("indemnizacion", 0, "causa soportada sin indemnización automática", { causa }, [], causa === "BAJA_VOLUNTARIA" ? NORMATIVA.referencias.temporal.cita : null, { diasIndemnizatorios: 0, limiteAplicado: false });
            return { status: STATUS.OK, importe: 0, causa, mesesComputables: mesesComputables(inicio, fin), errores: [], advertencias: [], trazabilidad: [item] };
        }
        if (causa === "FIN_CONTRATO_FORMATIVO" || causa === "FIN_CONTRATO_SUSTITUCION") return { status: STATUS.OK, importe: 0, causa, errores: [], advertencias: ["No se aplican automáticamente los 12 días/año por exclusión del artículo 49.1.c; revise normativa específica o mejora aplicable."], trazabilidad: [traza("indemnizacion", 0, "exclusión del régimen automático de 12 días/año", { causa }, [], NORMATIVA.referencias.temporal.cita)] };
        if (causa === "DESPIDO_IMPROCEDENTE" && extincion.improcedenciaReconocidaOSimulada !== true) return { status: STATUS.CONDITIONAL, importe: 0, causa, errores: [], advertencias: ["La herramienta no declara improcedencia. Confirme reconocimiento/declaración o simulación expresa."], trazabilidad: [] };
        const meses = mesesComputables(inicio, fin);
        if (causa === "FIN_CONTRATO_TEMPORAL_INDEMNIZABLE") {
            if (extincion.normativaEspecifica === true) return { status: STATUS.UNSUPPORTED, importe: 0, causa, errores: [], advertencias: ["El contrato indica normativa específica: no se aplica automáticamente el régimen general."], trazabilidad: [] };
            const t = NORMATIVA.referencias.temporal;
            if (compararFechas(inicio, parseFechaCivil(t.anteriorA)) < 0) return { status: STATUS.UNSUPPORTED, importe: 0, causa, errores: [], advertencias: ["Contrato anterior al 04/03/2001: no se aplica automáticamente el régimen transitorio."], trazabilidad: [] };
            const escala = t.escalaPorFechaCelebracion.find(e => compararFechas(inicio, parseFechaCivil(e.desde)) >= 0 && (!e.hasta || compararFechas(inicio, parseFechaCivil(e.hasta)) <= 0));
            if (!escala) return { status: STATUS.UNSUPPORTED, importe: 0, causa, errores: [], advertencias: ["No se pudo determinar el módulo temporal aplicable."], trazabilidad: [] };
            const diasServicio = diasInclusivos(inicio, fin);
            const diasIndemnizatorios = diasServicio * escala.diasPorAnio / 365;
            const item = traza("indemnizacionTemporal", diasIndemnizatorios * bases.diarioIndemnizacion.valorCalculo, "salario diario × días reales de servicio × módulo histórico ÷ 365", { salarioDiario: bases.diarioIndemnizacion.valorCalculo, diasServicio, diasPorAnio: escala.diasPorAnio, fechaCelebracion: inicio.iso }, [], t.cita, { diasIndemnizatorios, limiteAplicado: false, metodo: t.metodo });
            return { status: STATUS.OK, importe: item.importe, causa, diasServicio, diasPorAnio: escala.diasPorAnio, diasIndemnizatorios, limiteAplicado: false, errores: [], advertencias: [], trazabilidad: [item] };
        }
        if (causa === "DESPIDO_OBJETIVO") {
            const item = indemnizacionPorMeses("indemnizacionObjetiva", meses, NORMATIVA.referencias.objetivo.diasPorAnio, bases, NORMATIVA.referencias.objetivo.maxMensualidades, NORMATIVA.referencias.objetivo.cita);
            return { status: STATUS.OK, importe: item.importe, causa, mesesComputables: meses, diasIndemnizatorios: item.diasIndemnizatorios, limiteAplicado: item.limiteAplicado, errores: [], advertencias: [], trazabilidad: [item] };
        }
        const corte = parseFechaCivil(NORMATIVA.referencias.improcedente.fechaCorte);
        if (compararFechas(inicio, corte) >= 0) {
            const item = indemnizacionPorMeses("indemnizacionImprocedente33", meses, NORMATIVA.referencias.improcedente.diasPorAnioPosterior, bases, NORMATIVA.referencias.improcedente.maxMensualidadesPosterior, NORMATIVA.referencias.improcedente.cita);
            return { status: STATUS.OK, importe: item.importe, causa, mesesComputables: meses, diasIndemnizatorios: item.diasIndemnizatorios, limiteAplicado: item.limiteAplicado, errores: [], advertencias: [], trazabilidad: [item] };
        }
        const finPrevio = compararFechas(fin, corte) < 0 ? fin : sumarDias(corte, -1);
        const meses45 = mesesComputables(inicio, finPrevio);
        const meses33 = compararFechas(fin, corte) >= 0 ? mesesComputables(corte, fin) : 0;
        const n = NORMATIVA.referencias.improcedente;
        const dias45 = meses45 / 12 * n.diasPorAnioAnterior, dias33 = meses33 / 12 * n.diasPorAnioPosterior;
        const maxDias = dias45 > n.limiteOrdinarioDias ? Math.min(dias45, n.limiteAbsolutoMensualidades * 30) : n.limiteOrdinarioDias;
        const diasAplicados = Math.min(dias45 + dias33, maxDias, n.limiteAbsolutoMensualidades * 30);
        const item = traza("indemnizacionImprocedenteTransitoria", diasAplicados * bases.diarioIndemnizacion.valorCalculo, "tramo anterior: meses/12×días pre-corte; tramo posterior: meses/12×días post-corte; suma sujeta a límites transitorios", { mesesTramo45: meses45, mesesTramo33: meses33, diasPorAnioAnterior: n.diasPorAnioAnterior, diasPorAnioPosterior: n.diasPorAnioPosterior, diasTramo45: dias45, diasTramo33: dias33, maxDias, diasAplicados, salarioDiario: bases.diarioIndemnizacion.valorCalculo }, ["Cada fracción de mes de cada tramo se computa como mes completo."], n.cita, { diasIndemnizatorios: diasAplicados, limiteAplicado: diasAplicados < dias45 + dias33 });
        return { status: STATUS.OK, importe: item.importe, causa, mesesComputables: meses45 + meses33, tramos: { meses45, meses33, dias45, dias33 }, diasIndemnizatorios: diasAplicados, limiteAplicado: item.limiteAplicado, errores: [], advertencias: [], trazabilidad: [item] };
    }
    function calcular(input) {
        const validacion = validarEntrada(input);
        if (validacion.errores.length) return { status: STATUS.INVALID, finiquito: null, indemnizacion: null, total: null, hipotesis: [], advertencias: validacion.advertencias, errores: validacion.errores, trazabilidad: [] };
        const bases = calcularBasesSalario(input.salario);
        const salarioPendiente = calcularSalarioPendiente(input.ultimoPeriodo, bases, validacion.fin);
        const pagasExtra = calcularPagasExtra(input.pagasExtra, validacion.inicio, validacion.fin);
        const vacaciones = calcularVacaciones(input.vacaciones, validacion.inicio, validacion.fin, bases);
        const variables = calcularConceptos(input.variables, "variables");
        const ajustes = calcularConceptos(input.ajustes, "ajustes");
        const partidasComponentesPendientes = (bases.componentesPendientes || []).map(c => traza(`componentePendiente.${c.id}`, c.importe, "importe pendiente explícito del componente salarial", { id: c.id, importePendiente: c.importe, nota: c.nota || null }, [], null));
        const componentesPendientes = { status: (bases.conceptosNoCalculados || []).length ? STATUS.CONDITIONAL : STATUS.OK, importe: desdeCentimos(partidasComponentesPendientes.reduce((s, p) => s + aCentimos(p.importe), 0)), errores: [], advertencias: (bases.conceptosNoCalculados || []).length ? ["Hay componentes salariales marcados como pendientes sin importePendiente explícito."] : [], partidas: partidasComponentesPendientes, trazabilidad: partidasComponentesPendientes };
        if (input.salario.tipo === "MENSUAL" && input.salario.extrasProrrateadas === true && input.pagasExtra && input.pagasExtra.prorrateadas === false) {
            pagasExtra.status = estadoMaximo([pagasExtra.status, STATUS.CONDITIONAL]);
            pagasExtra.advertencias.push("La mensualidad declara extras prorrateadas pero también hay pagas no prorrateadas pendientes; revise que correspondan a períodos distintos.");
        }
        const idsReguladores = new Set((Array.isArray(input.salario.componentes) ? input.salario.componentes : []).filter(c => c && c.computableIndemnizacion).map(c => c.id));
        const idsPendientes = new Set((bases.componentesPendientes || []).map(c => c.id));
        (input.variables || []).forEach((c, i) => {
            if (c && c.id && idsPendientes.has(c.id)) {
                variables.status = STATUS.INVALID;
                variables.errores.push(`variables[${i}]: el id ${c.id} ya tiene importePendiente en salario.componentes; se evita el doble cómputo.`);
            } else if (c && c.id && idsReguladores.has(c.id)) {
                variables.status = estadoMaximo([variables.status, STATUS.CONDITIONAL]);
                variables.advertencias.push(`variables[${i}]: el id ${c.id} también figura en salario regulador; confirme que este importe es saldo pendiente y no duplicación.`);
                if (!variables.causasParcialidad) variables.causasParcialidad = [];
                variables.causasParcialidad.push({ codigo: "VARIABLE_POSIBLE_DUPLICIDAD", concepto: `variables[${i}]`, motivo: `El id ${c.id} también participa en el salario regulador.` });
            }
        });
        const preaviso = calcularPreaviso(input.preaviso, input.extincion && input.extincion.causa);
        const indemnizacion = calcularIndemnizacion(input.extincion, validacion.inicio, validacion.fin, bases);
        const bloques = [bases, salarioPendiente, pagasExtra, vacaciones, componentesPendientes, variables, ajustes, preaviso, indemnizacion];
        const errores = bloques.flatMap(b => b.errores || []);
        if (errores.length) return { status: STATUS.INVALID, finiquito: null, indemnizacion: null, total: null, hipotesis: [], advertencias: bloques.flatMap(b => b.advertencias || []), errores, trazabilidad: [bases.anual, bases.diarioIndemnizacion, bases.mensualRegulador].concat(bloquesTrazas(bloques)) };
        const partidasFiniquito = [
            { id: "salarioPendiente", importe: salarioPendiente.importe }, { id: "pagasExtra", importe: pagasExtra.importe },
            { id: "vacaciones", importe: vacaciones.importe }, { id: "variables", importe: variables.importe },
            { id: "componentesSalarialesPendientes", importe: componentesPendientes.importe },
            { id: "ajustes", importe: ajustes.importe }, { id: "preaviso", importe: preaviso.importe }
        ];
        const finiquitoCentimos = partidasFiniquito.reduce((s, p) => s + aCentimos(p.importe), 0);
        const finiquitoImporte = desdeCentimos(finiquitoCentimos);
        const total = desdeCentimos(finiquitoCentimos + aCentimos(indemnizacion.importe));
        const advertencias = bloques.flatMap(b => b.advertencias || []);
        const hipotesis = [bases.anual, bases.diarioIndemnizacion, bases.mensualRegulador].concat(bloquesTrazas(bloques)).flatMap(t => t.hipotesis || []);
        const statusGlobal = estadoMaximo(bloques.map(b => b.status));
        const causasParcialidad = [];
        (bases.conceptosNoCalculados || []).forEach(concepto => causasParcialidad.push({ codigo: "COMPONENTE_PENDIENTE_SIN_IMPORTE", concepto, motivo: "El componente está marcado como pendiente pero no tiene importePendiente explícito." }));
        if (vacaciones.integridadPeriodos && vacaciones.integridadPeriodos.huecos && vacaciones.integridadPeriodos.huecos.length) causasParcialidad.push({ codigo: "VACACIONES_COBERTURA_INCOMPLETA", concepto: "vacaciones", motivo: "Los ciclos no cubren todo el intervalo contractual." });
        if (vacaciones.periodoPosteriorEstimado && vacaciones.periodoPosteriorEstimado.status === STATUS.CONDITIONAL) causasParcialidad.push({ codigo: "PROYECCION_NO_VERIFICABLE", concepto: "vacaciones.proyeccion", motivo: "La proyección temporal no puede verificarse o completarse con las unidades y reglas aportadas." });
        const trazaVacaciones = vacaciones.trazabilidad && vacaciones.trazabilidad.find(t => t.id === "vacacionesPendientes");
        if (trazaVacaciones && trazaVacaciones.entradas.periodosUsados.some(p => p.estrategia === "TASA_ANUAL_ESTIMADA_365")) causasParcialidad.push({ codigo: "VACACIONES_DERECHO_PERIODO_NO_DECLARADO", concepto: "vacaciones.periodosDevengo", motivo: "Al menos un ciclo carece de diasDerechoPeriodoCompleto y se ha estimado por tasa anual." });
        bloques.forEach(b => (b.causasParcialidad || []).forEach(c => causasParcialidad.push(c)));
        const definicionesBloque = [["BASE_SALARIAL_NO_DETERMINADA", "baseSalarial", bases], ["SALARIO_PENDIENTE_NO_DETERMINADO", "salarioPendiente", salarioPendiente], ["PAGAS_NO_DETERMINADAS", "pagasExtraordinarias", pagasExtra], ["VACACIONES_NO_DETERMINADAS", "vacaciones", vacaciones], ["COMPONENTES_PENDIENTES_NO_DETERMINADOS", "componentesSalarialesPendientes", componentesPendientes], ["VARIABLES_NO_DETERMINADAS", "variables", variables], ["AJUSTES_NO_DETERMINADOS", "ajustes", ajustes], ["PREAVISO_NO_DETERMINADO", "preaviso", preaviso], ["INDEMNIZACION_NO_DETERMINADA", "indemnizacion", indemnizacion]];
        definicionesBloque.forEach(([codigo, concepto, bloque]) => {
            if (bloque.status !== STATUS.OK && !causasParcialidad.some(c => c.concepto === concepto || (concepto === "vacaciones" && String(c.concepto).startsWith("vacaciones")))) causasParcialidad.push({ codigo, concepto, motivo: `El bloque terminó en estado ${bloque.status}.` });
        });
        const causasUnicas = Array.from(new Map(causasParcialidad.map(c => [firmaEstructural(c), c])).values());
        const faltan = (bases.conceptosNoCalculados || []).slice();
        [["baseSalarial", bases], ["salarioPendiente", salarioPendiente], ["pagasExtraordinarias", pagasExtra], ["vacaciones", vacaciones], ["preaviso", preaviso], ["indemnizacion", indemnizacion]].forEach(par => { if (par[1].status !== STATUS.OK) faltan.push(par[0]); });
        causasUnicas.forEach(c => faltan.push(c.concepto));
        const faltanUnicos = Array.from(new Set(faltan));
        return {
            status: statusGlobal,
            finiquito: { status: estadoMaximo([salarioPendiente.status, pagasExtra.status, vacaciones.status, componentesPendientes.status, variables.status, ajustes.status, preaviso.status]), importe: finiquitoImporte, partidas: partidasFiniquito, salarioPendiente, pagasExtra, vacaciones, componentesPendientes, variables, ajustes, preaviso },
            indemnizacion,
            total: { importeCalculado: total, esParcial: statusGlobal !== STATUS.OK, conceptosNoCalculados: faltanUnicos, causasParcialidad: causasUnicas, partidas: partidasFiniquito.concat([{ id: "indemnizacion", importe: indemnizacion.importe }]), formula: "suma en céntimos de las partidas enumeradas; no es definitivo si esParcial=true" },
            basesSalariales: bases,
            antiguedad: { diasCivilesInclusivos: diasInclusivos(validacion.inicio, validacion.fin), mesesComputables: mesesComputables(validacion.inicio, validacion.fin), criterio: "Intervalo civil inclusivo; toda fracción de mes indemnizatorio se computa como mes completo." },
            hipotesis: Array.from(new Set(hipotesis)), advertencias, errores: [],
            trazabilidad: [bases.anual, bases.diarioIndemnizacion, bases.mensualRegulador].concat(bloquesTrazas(bloques))
        };
    }
    function bloquesTrazas(bloques) { return bloques.flatMap(b => b.trazabilidad || []); }

    return Object.freeze({ STATUS, calcular, validarEntrada, calcularBasesSalario, calcularSalarioPendiente, calcularPagasExtra, calcularVacaciones, calcularIndemnizacion, calcularPreaviso, calcularConceptos, fechas: Object.freeze({ esBisiesto, diasMes, parseFechaCivil, ordinal, desdeOrdinal, sumarDias, diasInclusivos, mesesComputables, proporcionAniosCiviles }), dinero: Object.freeze({ aCentimos, desdeCentimos, redondearMoneda }), normativa: NORMATIVA });
});
