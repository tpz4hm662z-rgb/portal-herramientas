/*
 * FIRE PRO v1.0 - motor financiero puro.
 *
 * Todas las tasas se reciben como decimales y son tasas anuales efectivas.
 * La proyeccion principal usa euros reales de hoy: gastos y aportaciones son
 * constantes en poder adquisitivo. Esto supone que la aportacion nominal futura
 * evoluciona con la inflacion. La rentabilidad real se obtiene mediante Fisher.
 *
 * Ruptura intencionada con el motor heredado: no se divide la tasa anual entre
 * doce y la aportacion predeterminada ocurre al final, no al inicio del mes.
 */
(function (root, factory) {
    "use strict";
    const engine = factory();
    if (typeof module === "object" && module.exports) module.exports = engine;
    if (root) root.FireEngine = engine;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const STATUS = Object.freeze({
        ALREADY_FIRE: "already_fire",
        REACHED: "reached",
        NOT_REACHED: "not_reached",
        INVALID: "invalid",
        COAST_REACHED: "coast_reached",
        COAST_NOT_REACHED: "coast_not_reached"
    });
    const MOMENTO_APORTACION = Object.freeze({ INICIO: "inicio", FINAL: "final" });
    const CONSTANTES = Object.freeze({
        MESES_POR_ANO: 12,
        TASA_RETIRADA_PREDETERMINADA: 0.04,
        INFLACION_PREDETERMINADA: 0,
        HORIZONTE_MAXIMO_MESES: 1200,
        HORIZONTE_PREDETERMINADO_MESES: 1200,
        MOMENTO_APORTACION_PREDETERMINADO: MOMENTO_APORTACION.FINAL
    });

    const esFinito = valor => typeof valor === "number" && Number.isFinite(valor);
    const error = (campo, codigo) => Object.freeze({ campo, codigo });
    const invalido = errores => Object.freeze({ estado: STATUS.INVALID, errores: Object.freeze(errores) });

    function validarNumero(errores, campo, valor, opciones) {
        if (valor === undefined || valor === null) {
            errores.push(error(campo, "ausente"));
        } else if (!esFinito(valor)) {
            errores.push(error(campo, "invalido"));
        } else if (opciones.entero && !Number.isInteger(valor)) {
            errores.push(error(campo, "debe_ser_entero"));
        } else if (opciones.minimoExclusivo !== undefined && valor <= opciones.minimoExclusivo) {
            errores.push(error(campo, valor === 0 ? "cero_no_permitido" : "fuera_de_rango"));
        } else if (opciones.minimo !== undefined && valor < opciones.minimo) {
            errores.push(error(campo, "negativo"));
        } else if (opciones.maximo !== undefined && valor > opciones.maximo) {
            errores.push(error(campo, "fuera_de_rango"));
        }
    }

    function calcularObjetivoFire(gastoMensual, tasaRetirada = CONSTANTES.TASA_RETIRADA_PREDETERMINADA) {
        const errores = [];
        validarNumero(errores, "gastoMensual", gastoMensual, { minimoExclusivo: 0 });
        validarNumero(errores, "tasaRetirada", tasaRetirada, { minimoExclusivo: 0 });
        if (errores.length) return invalido(errores);
        const gastoAnual = gastoMensual * CONSTANTES.MESES_POR_ANO;
        const objetivoFire = gastoAnual / tasaRetirada;
        if (!esFinito(gastoAnual) || !esFinito(objetivoFire) || objetivoFire <= 0) {
            return invalido([error("objetivoFire", "resultado_no_finito")]);
        }
        return Object.freeze({ estado: "ok", gastoMensual, gastoAnual, tasaRetirada, objetivoFire });
    }

    function tasaMensualDesdeAnual(tasaAnual) {
        if (!esFinito(tasaAnual) || tasaAnual <= -1) return null;
        const tasaMensual = Math.pow(1 + tasaAnual, 1 / CONSTANTES.MESES_POR_ANO) - 1;
        return esFinito(tasaMensual) ? tasaMensual : null;
    }

    function calcularRentabilidadReal(rentabilidadNominalAnual, inflacionAnual = 0) {
        const errores = [];
        validarNumero(errores, "rentabilidadNominalAnual", rentabilidadNominalAnual, { minimo: 0 });
        validarNumero(errores, "inflacionAnual", inflacionAnual, { minimo: 0 });
        if (errores.length) return invalido(errores);
        const rentabilidadRealAnual = (1 + rentabilidadNominalAnual) / (1 + inflacionAnual) - 1;
        const rentabilidadRealMensual = tasaMensualDesdeAnual(rentabilidadRealAnual);
        if (!esFinito(rentabilidadRealAnual) || rentabilidadRealMensual === null) {
            return invalido([error("rentabilidadRealAnual", "resultado_no_finito")]);
        }
        return Object.freeze({
            estado: "ok",
            rentabilidadNominalAnual,
            inflacionAnual,
            rentabilidadRealAnual,
            rentabilidadRealMensual
        });
    }

    function validarProyeccion(datos) {
        if (!datos || typeof datos !== "object" || Array.isArray(datos)) return [error("datos", "ausente")];
        const errores = [];
        validarNumero(errores, "patrimonioInicial", datos.patrimonioInicial, { minimo: 0 });
        validarNumero(errores, "aportacionMensual", datos.aportacionMensual, { minimo: 0 });
        validarNumero(errores, "gastoMensual", datos.gastoMensual, { minimoExclusivo: 0 });
        validarNumero(errores, "rentabilidadNominalAnual", datos.rentabilidadNominalAnual, { minimo: 0 });
        validarNumero(errores, "inflacionAnual", datos.inflacionAnual, { minimo: 0 });
        validarNumero(errores, "tasaRetirada", datos.tasaRetirada, { minimoExclusivo: 0 });
        validarNumero(errores, "horizonteMeses", datos.horizonteMeses, {
            minimo: 0, maximo: CONSTANTES.HORIZONTE_MAXIMO_MESES, entero: true
        });
        if (datos.edadActual !== undefined) validarNumero(errores, "edadActual", datos.edadActual, { minimo: 0 });
        if (datos.momentoAportacion !== MOMENTO_APORTACION.INICIO && datos.momentoAportacion !== MOMENTO_APORTACION.FINAL) {
            errores.push(error("momentoAportacion", "valor_desconocido"));
        }
        return errores;
    }

    function conPredeterminados(datos) {
        return Object.assign({
            inflacionAnual: CONSTANTES.INFLACION_PREDETERMINADA,
            tasaRetirada: CONSTANTES.TASA_RETIRADA_PREDETERMINADA,
            horizonteMeses: CONSTANTES.HORIZONTE_PREDETERMINADO_MESES,
            momentoAportacion: CONSTANTES.MOMENTO_APORTACION_PREDETERMINADO
        }, datos || {});
    }

    function crearPuntoSerie(mes, patrimonio, aportaciones, crecimiento, objetivo) {
        return Object.freeze({
            ano: Math.ceil(mes / CONSTANTES.MESES_POR_ANO),
            mesAcumulado: mes,
            patrimonioReal: patrimonio,
            aportacionesAcumuladas: aportaciones,
            crecimientoRealAcumulado: crecimiento,
            porcentajeObjetivo: patrimonio / objetivo
        });
    }

    function proyectarFire(entrada) {
        const datos = conPredeterminados(entrada);
        const errores = validarProyeccion(datos);
        if (errores.length) return invalido(errores);

        const objetivo = calcularObjetivoFire(datos.gastoMensual, datos.tasaRetirada);
        const tasas = calcularRentabilidadReal(datos.rentabilidadNominalAnual, datos.inflacionAnual);
        if (objetivo.estado === STATUS.INVALID) return objetivo;
        if (tasas.estado === STATUS.INVALID) return tasas;

        let patrimonio = datos.patrimonioInicial;
        let aportaciones = 0;
        let meses = 0;
        let estado = patrimonio >= objetivo.objetivoFire ? STATUS.ALREADY_FIRE : STATUS.NOT_REACHED;
        const serieAnual = [];

        while (estado === STATUS.NOT_REACHED && meses < datos.horizonteMeses) {
            if (datos.momentoAportacion === MOMENTO_APORTACION.INICIO) patrimonio += datos.aportacionMensual;
            patrimonio *= 1 + tasas.rentabilidadRealMensual;
            if (datos.momentoAportacion === MOMENTO_APORTACION.FINAL) patrimonio += datos.aportacionMensual;
            aportaciones += datos.aportacionMensual;
            meses += 1;

            const crecimiento = patrimonio - datos.patrimonioInicial - aportaciones;
            if (![patrimonio, aportaciones, crecimiento].every(esFinito)) {
                return invalido([error("proyeccion", "resultado_no_finito")]);
            }
            if (meses % CONSTANTES.MESES_POR_ANO === 0) {
                serieAnual.push(crearPuntoSerie(meses, patrimonio, aportaciones, crecimiento, objetivo.objetivoFire));
            }
            if (patrimonio >= objetivo.objetivoFire) estado = STATUS.REACHED;
        }

        const crecimientoRealAcumulado = patrimonio - datos.patrimonioInicial - aportaciones;
        if (meses > 0 && meses % CONSTANTES.MESES_POR_ANO !== 0) {
            serieAnual.push(crearPuntoSerie(meses, patrimonio, aportaciones, crecimientoRealAcumulado, objetivo.objetivoFire));
        }
        const alcanzado = estado === STATUS.ALREADY_FIRE || estado === STATUS.REACHED;
        const anosCompletos = Math.floor(meses / CONSTANTES.MESES_POR_ANO);
        const mesesRestantes = meses % CONSTANTES.MESES_POR_ANO;
        const edadFireAproximada = alcanzado && datos.edadActual !== undefined
            ? datos.edadActual + meses / CONSTANTES.MESES_POR_ANO
            : null;
        const resultado = {
            estado,
            objetivoFire: objetivo.objetivoFire,
            gastoMensual: datos.gastoMensual,
            gastoAnual: objetivo.gastoAnual,
            tasaRetirada: datos.tasaRetirada,
            patrimonioInicial: datos.patrimonioInicial,
            patrimonioFinal: patrimonio,
            aportacionMensual: datos.aportacionMensual,
            aportacionesAcumuladas: aportaciones,
            crecimientoRealAcumulado,
            mesesHastaFire: alcanzado ? meses : null,
            mesesSimulados: meses,
            anosHastaFire: alcanzado ? meses / CONSTANTES.MESES_POR_ANO : null,
            anosCompletos: alcanzado ? anosCompletos : null,
            mesesRestantes: alcanzado ? mesesRestantes : null,
            edadActual: datos.edadActual === undefined ? null : datos.edadActual,
            edadFireAproximada,
            porcentajeObjetivo: patrimonio / objetivo.objetivoFire,
            rentabilidadNominalAnual: datos.rentabilidadNominalAnual,
            inflacionAnual: datos.inflacionAnual,
            rentabilidadRealAnual: tasas.rentabilidadRealAnual,
            rentabilidadRealMensual: tasas.rentabilidadRealMensual,
            horizonteMeses: datos.horizonteMeses,
            momentoAportacion: datos.momentoAportacion,
            serieAnual: Object.freeze(serieAnual)
        };
        if (Object.values(resultado).some(valor => typeof valor === "number" && !Number.isFinite(valor))) {
            return invalido([error("resultado", "resultado_no_finito")]);
        }
        return Object.freeze(resultado);
    }

    function calcularCoastFire(entrada) {
        if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return invalido([error("datos", "ausente")]);
        const errores = [];
        validarNumero(errores, "objetivoFire", entrada.objetivoFire, { minimoExclusivo: 0 });
        // Una rentabilidad real puede ser negativa cuando la inflacion supera la
        // rentabilidad nominal; solo -100% o menos rompe la capitalizacion.
        validarNumero(errores, "rentabilidadRealAnual", entrada.rentabilidadRealAnual, { minimoExclusivo: -1 });
        validarNumero(errores, "mesesHastaObjetivo", entrada.mesesHastaObjetivo, {
            minimo: 0, maximo: CONSTANTES.HORIZONTE_MAXIMO_MESES, entero: true
        });
        validarNumero(errores, "patrimonioActual", entrada.patrimonioActual, { minimo: 0 });
        if (errores.length) return invalido(errores);
        const tasaMensual = tasaMensualDesdeAnual(entrada.rentabilidadRealAnual);
        const capitalCoastNecesarioHoy = entrada.objetivoFire / Math.pow(1 + tasaMensual, entrada.mesesHastaObjetivo);
        if (!esFinito(capitalCoastNecesarioHoy) || capitalCoastNecesarioHoy <= 0) {
            return invalido([error("capitalCoastNecesarioHoy", "resultado_no_finito")]);
        }
        const diferencia = entrada.patrimonioActual - capitalCoastNecesarioHoy;
        return Object.freeze({
            estado: diferencia >= 0 ? STATUS.COAST_REACHED : STATUS.COAST_NOT_REACHED,
            objetivoFire: entrada.objetivoFire,
            rentabilidadRealAnual: entrada.rentabilidadRealAnual,
            rentabilidadRealMensual: tasaMensual,
            mesesHastaObjetivo: entrada.mesesHastaObjetivo,
            capitalCoastNecesarioHoy,
            patrimonioActual: entrada.patrimonioActual,
            diferencia,
            porcentajeAlcanzado: entrada.patrimonioActual / capitalCoastNecesarioHoy
        });
    }

    function ejecutarEscenarios(configuraciones) {
        if (!Array.isArray(configuraciones)) return invalido([error("configuraciones", "invalido")]);
        return Object.freeze(configuraciones.map(configuracion => proyectarFire(Object.assign({}, configuracion))));
    }

    function diferenciaMeses(base, variante) {
        if (base.mesesHastaFire === null || variante.mesesHastaFire === null) return null;
        return base.mesesHastaFire - variante.mesesHastaFire;
    }

    function compararSensibilidad(configuracionBase, variaciones) {
        if (!Array.isArray(variaciones)) return invalido([error("variaciones", "invalido")]);
        const baseEntrada = Object.assign({}, configuracionBase);
        const base = proyectarFire(baseEntrada);
        if (base.estado === STATUS.INVALID) return base;
        const comparaciones = variaciones.map(variacion => {
            const entrada = Object.assign({}, baseEntrada, variacion);
            const resultado = proyectarFire(entrada);
            if (resultado.estado === STATUS.INVALID) return Object.freeze({ resultado });
            return Object.freeze({
                resultado,
                diferenciaMeses: diferenciaMeses(base, resultado),
                diferenciaObjetivoFire: resultado.objetivoFire - base.objetivoFire,
                diferenciaPatrimonioFinal: resultado.patrimonioFinal - base.patrimonioFinal
            });
        });
        return Object.freeze({ estado: "ok", base, comparaciones: Object.freeze(comparaciones) });
    }

    return Object.freeze({
        STATUS,
        MOMENTO_APORTACION,
        CONSTANTES,
        calcularObjetivoFire,
        tasaMensualDesdeAnual,
        calcularRentabilidadReal,
        proyectarFire,
        calcularCoastFire,
        ejecutarEscenarios,
        compararSensibilidad
    });
}));
