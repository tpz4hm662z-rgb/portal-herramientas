(function () {
    "use strict";
    const e = FireEngine, S = e.STATUS, pruebas = [];
    const test = (nombre, fn) => pruebas.push({ nombre, fn });
    const ok = (valor, mensaje) => { if (!valor) throw new Error(mensaje || "condicion falsa"); };
    const igual = (actual, esperado) => { if (!Object.is(actual, esperado)) throw new Error(`${actual} !== ${esperado}`); };
    const cerca = (actual, esperado, tolerancia = 1e-9) => {
        if (Math.abs(actual - esperado) > tolerancia * Math.max(1, Math.abs(esperado))) throw new Error(`${actual} != ${esperado}`);
    };
    const base = (cambios = {}) => Object.assign({
        patrimonioInicial: 5000,
        aportacionMensual: 500,
        gastoMensual: 1200,
        rentabilidadNominalAnual: 0.07,
        inflacionAnual: 0.02,
        tasaRetirada: 0.04,
        horizonteMeses: 1200,
        momentoAportacion: "final"
    }, cambios);

    test("objetivo: 1.200 al 4% son 360.000", () => cerca(e.calcularObjetivoFire(1200, .04).objetivoFire, 360000));
    test("objetivo: tasa 3%", () => cerca(e.calcularObjetivoFire(1200, .03).objetivoFire, 480000));
    test("objetivo: tasa 3,5%", () => cerca(e.calcularObjetivoFire(1200, .035).objetivoFire, 14400 / .035));
    test("objetivo: tasa 4%", () => cerca(e.calcularObjetivoFire(1200).objetivoFire, 360000));
    test("objetivo: conserva gasto anual", () => igual(e.calcularObjetivoFire(1200).gastoAnual, 14400));
    test("objetivo: gasto cero invalido", () => igual(e.calcularObjetivoFire(0).estado, S.INVALID));
    test("objetivo: gasto negativo invalido", () => igual(e.calcularObjetivoFire(-1).estado, S.INVALID));
    test("objetivo: tasa cero invalida", () => igual(e.calcularObjetivoFire(100, 0).estado, S.INVALID));
    test("objetivo: ausente se distingue", () => igual(e.calcularObjetivoFire(undefined).errores[0].codigo, "ausente"));
    test("objetivo: Infinity invalido", () => igual(e.calcularObjetivoFire(Infinity).estado, S.INVALID));

    test("tasas: 7% recompone 7%", () => { const m = e.tasaMensualDesdeAnual(.07); cerca((1 + m) ** 12 - 1, .07); });
    test("tasas: anual cero produce mensual cero", () => igual(e.tasaMensualDesdeAnual(0), 0));
    test("tasas: -100% se rechaza", () => igual(e.tasaMensualDesdeAnual(-1), null));
    test("tasas: inflacion cero conserva nominal", () => cerca(e.calcularRentabilidadReal(.07, 0).rentabilidadRealAnual, .07));
    test("tasas: nominal cero permitido", () => igual(e.calcularRentabilidadReal(0, 0).rentabilidadRealAnual, 0));
    test("tasas: Fisher exacta", () => cerca(e.calcularRentabilidadReal(.07, .02).rentabilidadRealAnual, 1.07 / 1.02 - 1));
    test("tasas: nominal igual a inflacion da real cero", () => cerca(e.calcularRentabilidadReal(.03, .03).rentabilidadRealAnual, 0));
    test("tasas: inflacion superior produce real negativa finita", () => ok(e.calcularRentabilidadReal(.01, .03).rentabilidadRealAnual < 0));
    test("tasas: NaN invalido", () => igual(e.calcularRentabilidadReal(NaN, 0).estado, S.INVALID));
    test("tasas: Infinity invalido", () => igual(e.calcularRentabilidadReal(.07, Infinity).estado, S.INVALID));

    test("proyeccion: patrimonio cero permitido", () => ok(e.proyectarFire(base({ patrimonioInicial: 0 })).estado !== S.INVALID));
    test("proyeccion: aportacion cero permitida", () => ok(e.proyectarFire(base({ aportacionMensual: 0 })).estado !== S.INVALID));
    test("proyeccion: rentabilidad cero permitida", () => ok(e.proyectarFire(base({ rentabilidadNominalAnual: 0, inflacionAnual: 0 })).estado !== S.INVALID));
    test("proyeccion: inflacion cero permitida", () => ok(e.proyectarFire(base({ inflacionAnual: 0 })).estado !== S.INVALID));
    test("proyeccion: aportacion final", () => cerca(e.proyectarFire(base({ patrimonioInicial: 100, aportacionMensual: 10, gastoMensual: 1000, rentabilidadNominalAnual: .12, inflacionAnual: 0, horizonteMeses: 1 })).patrimonioFinal, 100 * (1 + e.tasaMensualDesdeAnual(.12)) + 10));
    test("proyeccion: aportacion inicio", () => cerca(e.proyectarFire(base({ patrimonioInicial: 100, aportacionMensual: 10, gastoMensual: 1000, rentabilidadNominalAnual: .12, inflacionAnual: 0, horizonteMeses: 1, momentoAportacion: "inicio" })).patrimonioFinal, 110 * (1 + e.tasaMensualDesdeAnual(.12))));
    test("proyeccion: final es predeterminado", () => igual(e.proyectarFire(Object.assign({}, base(), { momentoAportacion: undefined })).estado, S.INVALID));
    test("proyeccion: already_fire", () => { const r = e.proyectarFire(base({ patrimonioInicial: 360000 })); igual(r.estado, S.ALREADY_FIRE); igual(r.mesesHastaFire, 0); });
    test("proyeccion: reached", () => { const r = e.proyectarFire(base({ patrimonioInicial: 0, aportacionMensual: 1000, gastoMensual: 100, rentabilidadNominalAnual: 0, inflacionAnual: 0 })); igual(r.estado, S.REACHED); igual(r.mesesHastaFire, 30); });
    test("proyeccion: not_reached", () => { const r = e.proyectarFire(base({ patrimonioInicial: 0, aportacionMensual: 1, horizonteMeses: 12 })); igual(r.estado, S.NOT_REACHED); igual(r.mesesHastaFire, null); igual(r.mesesSimulados, 12); });
    test("proyeccion: horizonte cero no finge exito", () => igual(e.proyectarFire(base({ patrimonioInicial: 0, horizonteMeses: 0 })).estado, S.NOT_REACHED));
    test("proyeccion: horizonte superior al maximo invalido", () => igual(e.proyectarFire(base({ horizonteMeses: 1201 })).estado, S.INVALID));
    test("proyeccion: horizonte fraccionario invalido", () => igual(e.proyectarFire(base({ horizonteMeses: 1.5 })).estado, S.INVALID));
    test("proyeccion: decimales validos", () => ok(Number.isFinite(e.proyectarFire(base({ patrimonioInicial: 12.34, aportacionMensual: 56.78 })).patrimonioFinal)));
    test("proyeccion: numero grande valido y finito", () => ok(Number.isFinite(e.proyectarFire(base({ patrimonioInicial: 1e12 })).patrimonioFinal)));
    test("proyeccion: desbordamiento se convierte en invalid", () => igual(e.proyectarFire(base({ patrimonioInicial: 1e308, gastoMensual: 1e308, tasaRetirada: .00001, rentabilidadNominalAnual: 1e308 })).estado, S.INVALID));
    test("proyeccion: NaN invalido", () => igual(e.proyectarFire(base({ aportacionMensual: NaN })).estado, S.INVALID));
    test("proyeccion: Infinity invalido", () => igual(e.proyectarFire(base({ patrimonioInicial: Infinity })).estado, S.INVALID));
    test("proyeccion: patrimonio negativo invalido", () => igual(e.proyectarFire(base({ patrimonioInicial: -1 })).estado, S.INVALID));
    test("proyeccion: aportacion negativa invalida", () => igual(e.proyectarFire(base({ aportacionMensual: -1 })).estado, S.INVALID));
    test("proyeccion: rentabilidad negativa invalida", () => igual(e.proyectarFire(base({ rentabilidadNominalAnual: -.01 })).estado, S.INVALID));
    test("proyeccion: momento desconocido invalido", () => igual(e.proyectarFire(base({ momentoAportacion: "medio" })).estado, S.INVALID));

    test("desglose: aportaciones acumuladas", () => cerca(e.proyectarFire(base({ patrimonioInicial: 0, aportacionMensual: 100, horizonteMeses: 10 })).aportacionesAcumuladas, 1000));
    test("desglose: identidad patrimonio", () => { const r = e.proyectarFire(base({ horizonteMeses: 24 })); cerca(r.patrimonioInicial + r.aportacionesAcumuladas + r.crecimientoRealAcumulado, r.patrimonioFinal); });
    test("desglose: porcentaje objetivo finito", () => ok(Number.isFinite(e.proyectarFire(base()).porcentajeObjetivo)));
    test("desglose: anos y meses", () => { const r = e.proyectarFire(base({ patrimonioInicial: 0, aportacionMensual: 1000, gastoMensual: 100, rentabilidadNominalAnual: 0, inflacionAnual: 0 })); igual(r.anosCompletos, 2); igual(r.mesesRestantes, 6); });
    test("desglose: edad FIRE sin fecha global", () => cerca(e.proyectarFire(base({ patrimonioInicial: 0, aportacionMensual: 1000, gastoMensual: 100, rentabilidadNominalAnual: 0, inflacionAnual: 0, edadActual: 30 })).edadFireAproximada, 32.5));
    test("serie: registra anos y cierre parcial", () => { const s = e.proyectarFire(base({ horizonteMeses: 14 })).serieAnual; igual(s.length, 2); igual(s[0].mesAcumulado, 12); igual(s[1].mesAcumulado, 14); });
    test("serie: ultimo punto cuadra con resultado", () => { const r = e.proyectarFire(base({ horizonteMeses: 14 })); cerca(r.serieAnual.at(-1).patrimonioReal, r.patrimonioFinal); });

    test("coast: rentabilidad positiva descuenta", () => ok(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: .05, mesesHastaObjetivo: 240, patrimonioActual: 0 }).capitalCoastNecesarioHoy < 360000));
    test("coast: rentabilidad cero", () => cerca(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: 0, mesesHastaObjetivo: 240, patrimonioActual: 0 }).capitalCoastNecesarioHoy, 360000));
    test("coast: rentabilidad real negativa valida", () => ok(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: -.01, mesesHastaObjetivo: 120, patrimonioActual: 0 }).capitalCoastNecesarioHoy > 360000));
    test("coast: horizonte cero", () => cerca(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: .05, mesesHastaObjetivo: 0, patrimonioActual: 0 }).capitalCoastNecesarioHoy, 360000));
    test("coast: ya alcanzado", () => igual(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: .05, mesesHastaObjetivo: 240, patrimonioActual: 200000 }).estado, S.COAST_REACHED));
    test("coast: no alcanzado", () => igual(e.calcularCoastFire({ objetivoFire: 360000, rentabilidadRealAnual: .05, mesesHastaObjetivo: 240, patrimonioActual: 1 }).estado, S.COAST_NOT_REACHED));
    test("coast: invalido", () => igual(e.calcularCoastFire({ objetivoFire: Infinity, rentabilidadRealAnual: 0, mesesHastaObjetivo: 0, patrimonioActual: 0 }).estado, S.INVALID));

    test("escenarios: ejecucion independiente", () => { const r = e.ejecutarEscenarios([base({ aportacionMensual: 100 }), base({ aportacionMensual: 1000 })]); ok(r[0].patrimonioFinal !== r[1].patrimonioFinal); });
    test("escenarios: no muta entrada", () => { const x = base(), copia = JSON.stringify(x); e.ejecutarEscenarios([x]); igual(JSON.stringify(x), copia); });
    test("sensibilidad: mas aportacion no retrasa", () => { const r = e.compararSensibilidad(base(), [{ aportacionMensual: 700 }]); ok(r.comparaciones[0].diferenciaMeses >= 0); });
    test("sensibilidad: menor gasto no aumenta objetivo", () => { const r = e.compararSensibilidad(base(), [{ gastoMensual: 1000 }]); ok(r.comparaciones[0].diferenciaObjetivoFire <= 0); });
    test("sensibilidad: mayor rentabilidad no retrasa", () => { const r = e.compararSensibilidad(base(), [{ rentabilidadNominalAnual: .09 }]); ok(r.comparaciones[0].diferenciaMeses >= 0); });

    test("invariante: objetivo positivo", () => ok(e.calcularObjetivoFire(.01, .99).objetivoFire > 0));
    test("invariante: reached implica objetivo alcanzado", () => { const r = e.proyectarFire(base()); if (r.estado === S.REACHED) ok(r.patrimonioFinal >= r.objetivoFire); });
    test("invariante: not_reached termina horizonte", () => { const r = e.proyectarFire(base({ horizonteMeses: 1 })); igual(r.estado, S.NOT_REACHED); igual(r.mesesSimulados, 1); ok(r.patrimonioFinal < r.objetivoFire); });
    test("invariante: mas patrimonio no retrasa", () => { const a = e.proyectarFire(base({ patrimonioInicial: 0 })); const b = e.proyectarFire(base({ patrimonioInicial: 50000 })); ok(b.mesesHastaFire <= a.mesesHastaFire); });
    test("caso heredado: nueva convencion difiere conscientemente de 273", () => { const r = e.proyectarFire(base({ inflacionAnual: 0 })); ok(r.mesesHastaFire !== 273); igual(r.momentoAportacion, "final"); });

    let pasados = 0; const fallos = [];
    pruebas.forEach(prueba => { try { prueba.fn(); pasados += 1; } catch (err) { fallos.push(`${prueba.nombre}: ${err.message}`); } });
    const salida = document.getElementById("salida");
    salida.textContent = `TOTAL: ${pruebas.length}\nSUPERADOS: ${pasados}\nFALLIDOS: ${fallos.length}${fallos.length ? `\n\n${fallos.join("\n")}` : ""}`;
    salida.dataset.total = String(pruebas.length);
    salida.dataset.pasados = String(pasados);
    salida.dataset.fallidos = String(fallos.length);
    document.body.dataset.estado = fallos.length ? "fallo" : "ok";
}());
