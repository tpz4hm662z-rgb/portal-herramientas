"use strict";

/*
 * Motor financiero puro de la Calculadora de Ahorro PRO.
 * Convenciones: la rentabilidad es anual efectiva y se convierte mediante
 * (1 + r)^(1/12) - 1. Las aportaciones se realizan al final de cada mes.
 * No se redondea durante el cálculo; el redondeo corresponde a presentación.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.AhorroEngine = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const STATUS = Object.freeze({
        OK: "ok", ALCANZADO: "objetivo_alcanzado", SUPERADO: "objetivo_superado",
        INALCANZABLE: "inalcanzable", INVALIDO: "entrada_invalida", DEFICIT: "deficit"
    });
    const MAX_MESES = 12000;

    function resultadoInvalido(errores) { return { estado: STATUS.INVALIDO, errores }; }
    function validarNumero(nombre, valor, opciones) {
        const opts = opciones || {};
        const errores = [];
        if (typeof valor !== "number" || !Number.isFinite(valor)) errores.push({ campo: nombre, codigo: "no_numerico" });
        else if (opts.min !== undefined && valor < opts.min) errores.push({ campo: nombre, codigo: "fuera_de_rango", minimo: opts.min });
        else if (opts.entero && !Number.isInteger(valor)) errores.push({ campo: nombre, codigo: "debe_ser_entero" });
        return errores;
    }
    function validarTasa(nombre, tasa) { return validarNumero(nombre, tasa, { min: -0.999999999 }); }
    function tasaOpcional(datos) { return datos.rentabilidadAnual === undefined ? 0 : datos.rentabilidadAnual; }
    function tasaMensualDesdeAnual(tasaAnual) { return Math.pow(1 + tasaAnual, 1 / 12) - 1; }
    function estadoObjetivo(objetivo, capitalInicial) {
        if (capitalInicial > objetivo) return STATUS.SUPERADO;
        if (capitalInicial === objetivo) return STATUS.ALCANZADO;
        return null;
    }
    function factorAnualidad(tasa, periodos) {
        if (tasa === 0) return periodos;
        return Math.expm1(periodos * Math.log1p(tasa)) / tasa;
    }
    function aportacionNecesaria(datos) {
        const errores = [].concat(
            validarNumero("objetivo", datos.objetivo, { min: 0 }),
            validarNumero("capitalInicial", datos.capitalInicial, { min: 0 }),
            validarNumero("periodos", datos.periodos, { min: 0, entero: true }),
            validarTasa("rentabilidadAnual", tasaOpcional(datos))
        );
        if (errores.length) return resultadoInvalido(errores);
        const especial = estadoObjetivo(datos.objetivo, datos.capitalInicial);
        if (especial) return { estado: especial, aportacionPeriodica: 0 };
        if (datos.periodos === 0) return { estado: STATUS.INALCANZABLE, motivo: "sin_periodos" };
        const tasa = tasaMensualDesdeAnual(tasaOpcional(datos));
        const capitalFuturo = datos.capitalInicial * Math.pow(1 + tasa, datos.periodos);
        if (capitalFuturo >= datos.objetivo) return { estado: STATUS.OK, aportacionPeriodica: 0, capitalInicialProyectado: capitalFuturo };
        const aportacion = (datos.objetivo - capitalFuturo) / factorAnualidad(tasa, datos.periodos);
        if (!Number.isFinite(aportacion)) return { estado: STATUS.INALCANZABLE, motivo: "resultado_no_finito" };
        return { estado: STATUS.OK, aportacionPeriodica: Math.max(0, aportacion), capitalInicialProyectado: capitalFuturo };
    }
    function proyectarCapital(datos) {
        const errores = [].concat(
            validarNumero("capitalInicial", datos.capitalInicial, { min: 0 }),
            validarNumero("aportacionPeriodica", datos.aportacionPeriodica, { min: 0 }),
            validarNumero("periodos", datos.periodos, { min: 0, entero: true }),
            validarTasa("rentabilidadAnual", tasaOpcional(datos))
        );
        if (errores.length) return resultadoInvalido(errores);
        const tasa = tasaMensualDesdeAnual(tasaOpcional(datos));
        const crecimiento = Math.pow(1 + tasa, datos.periodos);
        const capitalFinal = datos.capitalInicial * crecimiento + datos.aportacionPeriodica * factorAnualidad(tasa, datos.periodos);
        if (!Number.isFinite(capitalFinal)) return { estado: STATUS.INALCANZABLE, motivo: "resultado_no_finito" };
        const aportacionesTotales = datos.aportacionPeriodica * datos.periodos;
        return { estado: STATUS.OK, capitalFinal, aportacionesTotales, rendimientoAcumulado: capitalFinal - datos.capitalInicial - aportacionesTotales };
    }
    function periodosNecesarios(datos) {
        const errores = [].concat(
            validarNumero("objetivo", datos.objetivo, { min: 0 }),
            validarNumero("capitalInicial", datos.capitalInicial, { min: 0 }),
            validarNumero("aportacionPeriodica", datos.aportacionPeriodica, { min: 0 }),
            validarTasa("rentabilidadAnual", tasaOpcional(datos))
        );
        if (errores.length) return resultadoInvalido(errores);
        const especial = estadoObjetivo(datos.objetivo, datos.capitalInicial);
        if (especial) return { estado: especial, periodos: 0, anos: 0, mesesRestantes: 0 };
        const tasa = tasaMensualDesdeAnual(tasaOpcional(datos));
        if (datos.aportacionPeriodica === 0 && tasa <= 0) return { estado: STATUS.INALCANZABLE, motivo: "sin_crecimiento" };
        for (let mes = 1; mes <= (datos.maximoPeriodos || MAX_MESES); mes += 1) {
            const proyeccion = proyectarCapital({ capitalInicial: datos.capitalInicial, aportacionPeriodica: datos.aportacionPeriodica, periodos: mes, rentabilidadAnual: tasaOpcional(datos) });
            if (proyeccion.estado === STATUS.OK && proyeccion.capitalFinal >= datos.objetivo) return { estado: STATUS.OK, periodos: mes, anos: Math.floor(mes / 12), mesesRestantes: mes % 12, capitalFinal: proyeccion.capitalFinal };
        }
        return { estado: STATUS.INALCANZABLE, motivo: "limite_de_periodos" };
    }
    function ajustarInflacion(valorActual, inflacionAnual, anos) {
        const errores = [].concat(validarNumero("valorActual", valorActual, { min: 0 }), validarTasa("inflacionAnual", inflacionAnual), validarNumero("anos", anos, { min: 0 }));
        if (errores.length) return resultadoInvalido(errores);
        const objetivoNominal = valorActual * Math.pow(1 + inflacionAnual, anos);
        return Number.isFinite(objetivoNominal) ? { estado: STATUS.OK, objetivoNominal } : { estado: STATUS.INALCANZABLE, motivo: "resultado_no_finito" };
    }
    function capacidadAhorro(datos) {
        const valores = ["ingresosNetos", "gastosFijos", "gastosVariables", "otrosGastos"];
        const errores = valores.reduce((acc, campo) => acc.concat(validarNumero(campo, datos[campo] === undefined && campo === "otrosGastos" ? 0 : datos[campo], { min: 0 })), []);
        if (errores.length) return resultadoInvalido(errores);
        const otros = datos.otrosGastos || 0;
        const gastosTotales = datos.gastosFijos + datos.gastosVariables + otros;
        const ahorroMensual = datos.ingresosNetos - gastosTotales;
        return { estado: ahorroMensual < 0 ? STATUS.DEFICIT : STATUS.OK, gastosTotales, ahorroMensual, porcentajeGastos: datos.ingresosNetos === 0 ? null : gastosTotales / datos.ingresosNetos, tasaAhorro: datos.ingresosNetos === 0 ? null : ahorroMensual / datos.ingresosNetos, ahorroAnual: ahorroMensual * 12 };
    }
    function metricasDerivadas(datos) {
        const restante = Math.max(0, datos.objetivo - datos.capitalInicial);
        const progreso = datos.objetivo === 0 ? 1 : datos.capitalInicial / datos.objetivo;
        const anual = datos.ahorroMensual * 12;
        return { restante, progreso, ahorroMensual: datos.ahorroMensual, equivalenteSemanal: anual / 52, equivalenteDiario: anual / 365, ahorroAnual: anual };
    }
    function generarEscenarios(aportacionBase, multiplicadores) {
        const config = multiplicadores || { tranquilo: 0.8, objetivo: 1, acelerado: 1.2 };
        const errores = validarNumero("aportacionBase", aportacionBase, { min: 0 });
        if (errores.length) return resultadoInvalido(errores);
        return { estado: STATUS.OK, escenarios: Object.keys(config).map(nombre => ({ nombre, multiplicador: config[nombre], aportacionPeriodica: aportacionBase * config[nombre] })) };
    }
    function generarProyeccion(datos) {
        const validacion = proyectarCapital(datos);
        if (validacion.estado !== STATUS.OK) return validacion;
        const tasa = tasaMensualDesdeAnual(tasaOpcional(datos));
        const serie = [];
        let capital = datos.capitalInicial;
        for (let mes = 1; mes <= datos.periodos; mes += 1) {
            const inicial = capital;
            const rendimiento = inicial * tasa;
            capital = inicial + rendimiento + datos.aportacionPeriodica;
            serie.push({ mes, capitalInicial: inicial, aportacion: datos.aportacionPeriodica, rendimientoEstimado: rendimiento, capitalFinal: capital });
        }
        return { estado: STATUS.OK, serie, capitalFinal: capital };
    }
    function fechaObjetivo(fechaInicio, meses) {
        if (!(fechaInicio instanceof Date) || Number.isNaN(fechaInicio.getTime()) || !Number.isInteger(meses) || meses < 0) return resultadoInvalido([{ campo: "fecha", codigo: "entrada_invalida" }]);
        const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + meses, 1);
        return { estado: STATUS.OK, fecha };
    }
    return Object.freeze({ STATUS, validarNumero, tasaMensualDesdeAnual, aportacionNecesaria, periodosNecesarios, proyectarCapital, ajustarInflacion, capacidadAhorro, metricasDerivadas, generarEscenarios, generarProyeccion, fechaObjetivo });
}));
