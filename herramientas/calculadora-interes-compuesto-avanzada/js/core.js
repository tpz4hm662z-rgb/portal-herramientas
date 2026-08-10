(function (root, factory) {
    "use strict";
    const api = factory(typeof CONFIG !== "undefined" ? CONFIG : (typeof require === "function" ? require("./config.js") : null));
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.InteresCompuestoEngine = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (config) {
    "use strict";

    const STATUS = Object.freeze({
        OK: "ok", ENTRADA_INVALIDA: "entrada_invalida", RESULTADO_NO_FINITO: "resultado_no_finito",
        DUPLICACION_NO_ALCANZABLE: "duplicacion_no_alcanzable", HITO_NO_ALCANZADO: "hito_no_alcanzado"
    });
    const MESES = Object.freeze({ mensual: 1, trimestral: 3, semestral: 6, anual: 12 });
    const MOMENTOS = Object.freeze(["principio", "final"]);
    const LIMITES = Object.freeze(Object.assign({}, config.calculo));
    const error = (campo, motivo) => ({ estado: STATUS.ENTRADA_INVALIDA, errores: [{ campo, motivo }] });
    const finito = valor => typeof valor === "number" && Number.isFinite(valor);

    /* La entrada es siempre una tasa anual efectiva hipotética (no TIN). */
    function tasaEquivalente(tasaAnual, periodosPorAno) {
        if (!finito(tasaAnual) || tasaAnual <= -1 || !Number.isInteger(periodosPorAno) || periodosPorAno <= 0) return null;
        const tasa = Math.pow(1 + tasaAnual, 1 / periodosPorAno) - 1;
        return Number.isFinite(tasa) ? tasa : null;
    }

    function validar(datos) {
        if (!datos || typeof datos !== "object") return error("datos", "objeto_requerido");
        const requeridos = ["capitalInicial", "aportacionPeriodica", "plazoAnos", "rentabilidadAnual"];
        for (const campo of requeridos) if (!finito(datos[campo])) return error(campo, "numero_finito_requerido");
        if (datos.capitalInicial < 0 || datos.capitalInicial > LIMITES.maximoImporte) return error("capitalInicial", "fuera_de_limites");
        if (datos.aportacionPeriodica < 0 || datos.aportacionPeriodica > LIMITES.maximoImporte) return error("aportacionPeriodica", "fuera_de_limites");
        if (datos.plazoAnos <= 0 || datos.plazoAnos > LIMITES.maximoAnos || !Number.isInteger(datos.plazoAnos * 12)) return error("plazoAnos", "debe_representar_meses_completos");
        if (datos.rentabilidadAnual < LIMITES.rentabilidadMinima || datos.rentabilidadAnual > LIMITES.rentabilidadMaxima) return error("rentabilidadAnual", "fuera_de_limites");
        const inflacion = datos.inflacionAnual === undefined ? 0 : datos.inflacionAnual;
        const costes = datos.costesAnuales === undefined ? 0 : datos.costesAnuales;
        if (!finito(inflacion) || inflacion < LIMITES.inflacionMinima || inflacion > LIMITES.inflacionMaxima) return error("inflacionAnual", "fuera_de_limites");
        if (!finito(costes) || costes < 0 || costes > LIMITES.costesMaximos) return error("costesAnuales", "fuera_de_limites");
        if (!MESES[datos.frecuenciaAportacion || "mensual"]) return error("frecuenciaAportacion", "frecuencia_no_admitida");
        if (!MESES[datos.frecuenciaCapitalizacion || "mensual"]) return error("frecuenciaCapitalizacion", "frecuencia_no_admitida");
        if (!MOMENTOS.includes(datos.momentoAportacion || "final")) return error("momentoAportacion", "momento_no_admitido");
        return { estado: STATUS.OK };
    }

    function proyectar(datos, costesAnuales) {
        const meses = datos.plazoAnos * 12;
        const cadaAportacion = MESES[datos.frecuenciaAportacion || "mensual"];
        const cadaCapitalizacion = MESES[datos.frecuenciaCapitalizacion || "mensual"];
        const momento = datos.momentoAportacion || "final";
        const tasaBrutaMes = tasaEquivalente(datos.rentabilidadAnual, 12);
        const tasaCosteMes = tasaEquivalente(costesAnuales || 0, 12);
        let capital = datos.capitalInicial;
        let aportacionesAcumuladas = 0;
        const serie = [];
        for (let mes = 1; mes <= meses; mes += 1) {
            const inicial = capital;
            const tocaAportar = momento === "principio" ? (mes - 1) % cadaAportacion === 0 : mes % cadaAportacion === 0;
            const aportacion = tocaAportar ? datos.aportacionPeriodica : 0;
            if (momento === "principio") capital += aportacion;
            const rendimientoBruto = capital * tasaBrutaMes;
            capital += rendimientoBruto;
            const impactoCostes = capital * tasaCosteMes;
            capital -= impactoCostes;
            if (momento === "final") capital += aportacion;
            aportacionesAcumuladas += aportacion;
            if (![capital, rendimientoBruto, impactoCostes].every(Number.isFinite)) return { estado: STATUS.RESULTADO_NO_FINITO };
            serie.push({
                periodo: mes, ano: Math.ceil(mes / 12), mesDelAno: ((mes - 1) % 12) + 1,
                capitalInicial: inicial, aportacion, rendimientoBruto, impactoCostes,
                capitalFinal: capital, aportadoAcumulado: datos.capitalInicial + aportacionesAcumuladas,
                rendimientoAcumulado: capital - datos.capitalInicial - aportacionesAcumuladas,
                cierreCapitalizacion: mes % cadaCapitalizacion === 0
            });
        }
        return { estado: STATUS.OK, capitalFinal: capital, aportacionesAcumuladas, serie };
    }

    function resumirAnualmente(serie) {
        const resumen = [];
        for (let i = 0; i < serie.length; i += 12) {
            const bloque = serie.slice(i, i + 12), ultimo = bloque[bloque.length - 1];
            resumen.push({ ano: resumen.length + 1, capitalInicial: bloque[0].capitalInicial,
                aportaciones: bloque.reduce((s, x) => s + x.aportacion, 0),
                rendimientoEstimado: bloque.reduce((s, x) => s + x.rendimientoBruto, 0),
                impactoCostes: bloque.reduce((s, x) => s + x.impactoCostes, 0), capitalFinal: ultimo.capitalFinal,
                aportadoAcumulado: ultimo.aportadoAcumulado, rendimientoAcumulado: ultimo.rendimientoAcumulado });
        }
        return resumen;
    }

    function calcularInflacion(capitalNominal, inflacionAnual, plazoAnos) {
        if (![capitalNominal, inflacionAnual, plazoAnos].every(finito) || capitalNominal < 0 || inflacionAnual <= -1 || plazoAnos < 0) return error("inflacion", "entrada_invalida");
        const capitalReal = capitalNominal / Math.pow(1 + inflacionAnual, plazoAnos);
        if (!Number.isFinite(capitalReal)) return { estado: STATUS.RESULTADO_NO_FINITO };
        return { estado: STATUS.OK, capitalNominal, capitalReal, impactoInflacion: capitalNominal - capitalReal };
    }

    /* Interés simple: cada flujo gana r*t desde su fecha de entrada hasta el horizonte. */
    function calcularInteresSimple(datos) {
        const valido = validar(Object.assign({}, datos, { costesAnuales: 0, inflacionAnual: 0 }));
        if (valido.estado !== STATUS.OK) return valido;
        const meses = datos.plazoAnos * 12, cada = MESES[datos.frecuenciaAportacion || "mensual"], momento = datos.momentoAportacion || "final";
        let capitalFinal = datos.capitalInicial * (1 + datos.rentabilidadAnual * datos.plazoAnos), aportacionesAcumuladas = 0;
        for (let mes = 1; mes <= meses; mes += 1) {
            const toca = momento === "principio" ? (mes - 1) % cada === 0 : mes % cada === 0;
            if (toca) { const restante = momento === "principio" ? (meses - mes + 1) / 12 : (meses - mes) / 12; capitalFinal += datos.aportacionPeriodica * (1 + datos.rentabilidadAnual * restante); aportacionesAcumuladas += datos.aportacionPeriodica; }
        }
        return Number.isFinite(capitalFinal) ? { estado: STATUS.OK, capitalFinal, aportacionesAcumuladas, rendimientoAcumulado: capitalFinal - datos.capitalInicial - aportacionesAcumuladas } : { estado: STATUS.RESULTADO_NO_FINITO };
    }

    function compararIntereses(datos) {
        const simple = calcularInteresSimple(datos), compuesto = simular(Object.assign({}, datos, { incluirComparacion: false, incluirEscenarios: false }));
        if (simple.estado !== STATUS.OK) return simple;
        if (compuesto.estado !== STATUS.OK) return compuesto;
        const diferenciaAbsoluta = compuesto.capitalFinal - simple.capitalFinal;
        return { estado: STATUS.OK, capitalFinalSimple: simple.capitalFinal, capitalFinalCompuesto: compuesto.capitalFinal,
            diferenciaAbsoluta, diferenciaPorcentual: simple.capitalFinal !== 0 ? diferenciaAbsoluta / Math.abs(simple.capitalFinal) : null };
    }

    function calcularDuplicacion(rentabilidadAnual) {
        if (!finito(rentabilidadAnual) || rentabilidadAnual <= 0) return { estado: STATUS.DUPLICACION_NO_ALCANZABLE, tiempoExactoAnos: null, regla72Anos: null, diferenciaAnos: null };
        const exacto = Math.log(2) / Math.log1p(rentabilidadAnual), regla = 72 / (rentabilidadAnual * 100);
        if (![exacto, regla].every(Number.isFinite)) return { estado: STATUS.RESULTADO_NO_FINITO };
        return { estado: STATUS.OK, tiempoExactoAnos: exacto, regla72Anos: regla, diferenciaAnos: regla - exacto };
    }

    function obtenerHitos(resumen, anosHito) {
        const solicitados = anosHito || [1, 5, 10, 20];
        const capitalPorAno = solicitados.filter(ano => Number.isInteger(ano) && ano > 0 && ano <= resumen.length).map(ano => ({ ano, capital: resumen[ano - 1].capitalFinal }));
        const cruce = resumen.find(x => x.rendimientoEstimado > x.aportaciones);
        return { estado: STATUS.OK, capitalPorAno, rendimientoSuperaAportaciones: cruce ? { estado: STATUS.OK, ano: cruce.ano } : { estado: STATUS.HITO_NO_ALCANZADO, ano: null } };
    }

    function generarEscenarios(datos, delta) {
        const d = delta === undefined ? config.escenarios.deltaRentabilidad : delta;
        if (!finito(d) || d < 0) return error("delta", "fuera_de_limites");
        const tasas = [Math.max(LIMITES.rentabilidadMinima, datos.rentabilidadAnual - d), datos.rentabilidadAnual, Math.min(LIMITES.rentabilidadMaxima, datos.rentabilidadAnual + d)];
        const nombres = ["bajo", "central", "alto"];
        return { estado: STATUS.OK, escenarios: tasas.map((tasa, i) => { const r = simular(Object.assign({}, datos, { rentabilidadAnual: tasa, incluirEscenarios: false, incluirComparacion: false })); return { nombre: nombres[i], rentabilidadAnual: tasa, estado: r.estado, capitalFinal: r.capitalFinal }; }) };
    }

    function simular(datos) {
        const valido = validar(datos);
        if (valido.estado !== STATUS.OK) return valido;
        const costes = datos.costesAnuales || 0;
        const conCostes = proyectar(datos, costes);
        if (conCostes.estado !== STATUS.OK) return conCostes;
        const resumenAnual = resumirAnualmente(conCostes.serie);
        const resultado = { estado: STATUS.OK, capitalInicial: datos.capitalInicial, aportacionesAcumuladas: conCostes.aportacionesAcumuladas,
            dineroTotalAportado: datos.capitalInicial + conCostes.aportacionesAcumuladas, capitalFinal: conCostes.capitalFinal,
            rendimientoAcumulado: conCostes.capitalFinal - datos.capitalInicial - conCostes.aportacionesAcumuladas,
            rentabilidadAnualHipotetica: datos.rentabilidadAnual, plazo: datos.plazoAnos,
            frecuenciaAportacion: datos.frecuenciaAportacion || "mensual", frecuenciaCapitalizacion: datos.frecuenciaCapitalizacion || "mensual",
            momentoAportacion: datos.momentoAportacion || "final", serie: conCostes.serie, resumenAnual };
        if (datos.inflacionAnual !== undefined) Object.assign(resultado, calcularInflacion(resultado.capitalFinal, datos.inflacionAnual, datos.plazoAnos));
        if (datos.costesAnuales !== undefined) { const sin = proyectar(datos, 0); resultado.capitalSinCostes = sin.capitalFinal; resultado.impactoCostes = sin.capitalFinal - resultado.capitalFinal; }
        resultado.hitos = obtenerHitos(resumenAnual, datos.anosHito);
        resultado.tiempoDuplicacion = calcularDuplicacion(datos.rentabilidadAnual);
        if (datos.incluirComparacion) resultado.comparacionInteresSimple = compararIntereses(datos);
        if (datos.incluirEscenarios) resultado.escenarios = generarEscenarios(datos, datos.deltaEscenarios).escenarios;
        return resultado;
    }

    return Object.freeze({ STATUS, FRECUENCIAS: MESES, LIMITES, tasaEquivalente, validar, simular, resumirAnualmente,
        calcularInflacion, calcularInteresSimple, compararIntereses, calcularDuplicacion, obtenerHitos, generarEscenarios });
}));
