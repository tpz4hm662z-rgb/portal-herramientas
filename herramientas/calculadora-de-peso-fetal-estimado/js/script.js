/* =====================================================
   CALCULADORA DE PESO FETAL ESTIMADO PRO
   Imoancy · Herramienta nº31

   Motor específico. No almacena datos clínicos: no existe
   una interfaz de historial que permita consultarlos o borrarlos.
===================================================== */

"use strict";

(function calculadoraPesoFetal() {

    const CAMPOS = Object.freeze({
        semanas: Object.freeze({ selector: "#datoUno", error: "#errorDatoUno", nombre: "semanas de gestación", entero: true }),
        dias: Object.freeze({ selector: "#datoDos", error: "#errorDatoDos", nombre: "días adicionales", entero: true }),
        bpd: Object.freeze({ selector: "#bpd", error: "#errorBpd", nombre: "BPD" }),
        hc: Object.freeze({ selector: "#hc", error: "#errorHc", nombre: "HC" }),
        ac: Object.freeze({ selector: "#ac", error: "#errorAc", nombre: "AC" }),
        fl: Object.freeze({ selector: "#fl", error: "#errorFl", nombre: "FL" })
    });

    const SELECTORES = Object.freeze({
        formulario: "#formularioHerramienta",
        formula: "#opcion",
        errorFormula: "#errorOpcion",
        estadoFormulario: "#estadoFormulario",
        estadoCompartir: "#estadoCompartir",
        resultados: "#resultados",
        botonCalcular: "#botonCalcular",
        botonReiniciar: "#botonReiniciar",
        botonCompartir: "#botonCompartir"
    });

    const MENSAJE_CONTEXTO = "Un percentil aislado no establece un diagnóstico. La valoración del crecimiento fetal requiere revisar la evolución, la calidad de las mediciones y el contexto clínico con el equipo obstétrico.";

    /* INTERGROWTH-21st standards for Hadlock's estimation of fetal weight.
       Fuente: Stirnemann J, Salomon LJ, Papageorghiou AT. Ultrasound Obstet
       Gynecol. 2020;56(6):946-948. DOI: 10.1002/uog.22000.
       Tabla S2, consultada el 2026-08-03. Unidades: gramos; edad gestacional
       en semanas exactas. Intervalo publicado: 18+0 a 41+0 semanas.
       Se incluyen exclusivamente P3, P10, P50, P90 y P97. Los días entre
       semanas se resuelven mediante interpolación lineal; no se extrapola. */
    const INTERGROWTH_HADLOCK = Object.freeze({
        18: Object.freeze({ p3: 184, p10: 193, p50: 216, p90: 244, p97: 260 }),
        19: Object.freeze({ p3: 224, p10: 235, p50: 263, p90: 297, p97: 316 }),
        20: Object.freeze({ p3: 271, p10: 284, p50: 318, p90: 359, p97: 381 }),
        21: Object.freeze({ p3: 324, p10: 341, p50: 381, p90: 430, p97: 457 }),
        22: Object.freeze({ p3: 385, p10: 405, p50: 454, p90: 513, p97: 544 }),
        23: Object.freeze({ p3: 453, p10: 478, p50: 537, p90: 607, p97: 645 }),
        24: Object.freeze({ p3: 530, p10: 559, p50: 630, p90: 714, p97: 758 }),
        25: Object.freeze({ p3: 616, p10: 650, p50: 734, p90: 834, p97: 887 }),
        26: Object.freeze({ p3: 710, p10: 751, p50: 851, p90: 968, p97: 1030 }),
        27: Object.freeze({ p3: 813, p10: 862, p50: 979, p90: 1116, p97: 1189 }),
        28: Object.freeze({ p3: 925, p10: 982, p50: 1119, p90: 1279, p97: 1364 }),
        29: Object.freeze({ p3: 1046, p10: 1113, p50: 1272, p90: 1457, p97: 1554 }),
        30: Object.freeze({ p3: 1175, p10: 1252, p50: 1435, p90: 1649, p97: 1760 }),
        31: Object.freeze({ p3: 1312, p10: 1400, p50: 1610, p90: 1854, p97: 1981 }),
        32: Object.freeze({ p3: 1455, p10: 1556, p50: 1795, p90: 2072, p97: 2216 }),
        33: Object.freeze({ p3: 1604, p10: 1718, p50: 1988, p90: 2300, p97: 2462 }),
        34: Object.freeze({ p3: 1757, p10: 1885, p50: 2189, p90: 2538, p97: 2719 }),
        35: Object.freeze({ p3: 1913, p10: 2056, p50: 2394, p90: 2782, p97: 2983 }),
        36: Object.freeze({ p3: 2070, p10: 2228, p50: 2602, p90: 3031, p97: 3251 }),
        37: Object.freeze({ p3: 2226, p10: 2400, p50: 2811, p90: 3280, p97: 3522 }),
        38: Object.freeze({ p3: 2379, p10: 2569, p50: 3017, p90: 3527, p97: 3789 }),
        39: Object.freeze({ p3: 2527, p10: 2733, p50: 3217, p90: 3768, p97: 4051 }),
        40: Object.freeze({ p3: 2667, p10: 2888, p50: 3409, p90: 3999, p97: 4302 }),
        41: Object.freeze({ p3: 2798, p10: 3034, p50: 3588, p90: 4217, p97: 4538 })
    });

    /* Las ecuaciones LMS proceden de la Tabla S1 de la misma publicación.
       Se conservan para obtener el percentil dentro del intervalo publicado;
       la tabla anterior define y hace auditables los límites visualizados. */
    const FORMULAS = Object.freeze({
        "hadlock-3": Object.freeze({
            id: "hadlock-3",
            nombre: "Fórmula Hadlock HC–AC–FL",
            campos: Object.freeze(["hc", "ac", "fl"]),
            prioridad: 100,
            calcular(datos) {
                const hc = datos.hc / 10;
                const ac = datos.ac / 10;
                const fl = datos.fl / 10;
                return 10 ** (1.326 + (0.0107 * hc) + (0.0438 * ac)
                    + (0.158 * fl) - (0.00326 * ac * fl));
            }
        })
    });

    let ultimoResultado = null;

    document.addEventListener("DOMContentLoaded", iniciarHerramienta, { once: true });

    function iniciarHerramienta() {
        const formulario = buscar(SELECTORES.formulario);
        if (!formulario) return;

        desactivarHistorialLocal();

        formulario.addEventListener("submit", procesarFormulario);
        buscar(SELECTORES.botonReiniciar)?.addEventListener("click", reiniciarFormulario);
        buscar(SELECTORES.botonCompartir)?.addEventListener("click", compartirResultado);

        Object.values(CAMPOS).forEach(campo => {
            const control = buscar(campo.selector);
            control?.addEventListener("input", () => gestionarEdicion(campo));
            control?.addEventListener("blur", () => validarCampo(campo));
        });

        buscar(SELECTORES.formula)?.addEventListener("change", () => {
            limpiarErrorSelector(SELECTORES.errorFormula, buscar(SELECTORES.formula));
            gestionarEdicion();
        });
    }

    function procesarFormulario(evento) {
        evento.preventDefault();
        establecerCalculando(true);
        anunciarFormulario("");

        try {
            const datos = obtenerDatos();
            const validacion = validarFormulario(datos);
            if (!validacion.valido) {
                anunciarFormulario(`Revisa el formulario. ${pluralizarErrores(validacion.errores.length)}`);
                enfocarPrimerError(validacion.primerCampo);
                return;
            }

            const formula = seleccionarFormula(datos);
            const pesoExacto = calcularPeso(datos, formula);
            const percentil = calcularPercentil(pesoExacto, datos.edadGestacional);
            const interpretacion = generarInterpretacion(percentil);
            const resultado = construirResultado(datos, formula, pesoExacto, percentil, interpretacion);

            actualizarResultados(resultado);
            ultimoResultado = resultado;
            anunciarFormulario("");
        } catch (error) {
            anunciarFormulario(error instanceof Error ? error.message : "No se ha podido completar el cálculo.");
        } finally {
            establecerCalculando(false);
        }
    }

    function obtenerDatos() {
        const valores = {};
        Object.entries(CAMPOS).forEach(([clave, campo]) => {
            valores[clave] = leerNumero(buscar(campo.selector));
        });
        return Object.freeze({
            ...valores,
            edadGestacional: Number.isFinite(valores.semanas) && Number.isFinite(valores.dias)
                ? valores.semanas + (valores.dias / 7)
                : Number.NaN,
            formulaSolicitada: buscar(SELECTORES.formula)?.value || "automatico"
        });
    }

    function leerNumero(control) {
        if (!control || control.value.trim() === "") return null;
        if (control.validity?.badInput) return Number.NaN;
        return Number.isFinite(control.valueAsNumber) ? control.valueAsNumber : Number.NaN;
    }

    function validarFormulario(datos = obtenerDatos()) {
        limpiarErroresFormulario();
        const errores = [];
        let primerCampo = null;

        Object.entries(CAMPOS).forEach(([clave, campo]) => {
            const resultado = validarCampo(campo, datos[clave]);
            if (resultado.valido) return;
            errores.push(resultado.mensaje);
            primerCampo ||= resultado.control;
        });

        const formulaValida = datos.formulaSolicitada === "automatico"
            || Object.prototype.hasOwnProperty.call(FORMULAS, datos.formulaSolicitada);
        if (!formulaValida) {
            const control = buscar(SELECTORES.formula);
            const mensaje = "Selecciona una fórmula de estimación válida.";
            mostrarErrorSelector(SELECTORES.errorFormula, control, mensaje);
            errores.push(mensaje);
            primerCampo ||= control;
        }

        return Object.freeze({ valido: errores.length === 0, valores: datos, errores: Object.freeze(errores), primerCampo });
    }

    function validarCampo(campo, valorLeido) {
        const control = buscar(campo.selector);
        const valor = arguments.length > 1 ? valorLeido : leerNumero(control);
        const minimo = Number(control?.min);
        const maximo = Number(control?.max);
        let mensaje = "";

        if (valor === null) mensaje = `Introduce ${campo.nombre}.`;
        else if (!Number.isFinite(valor)) mensaje = `Introduce un número válido para ${campo.nombre}.`;
        else if (valor < 0) mensaje = `${capitalizar(campo.nombre)} no puede tener un valor negativo.`;
        else if (campo.entero && !Number.isInteger(valor)) mensaje = `${capitalizar(campo.nombre)} debe indicarse con un número entero.`;
        else if ((Number.isFinite(minimo) && valor < minimo) || (Number.isFinite(maximo) && valor > maximo)) {
            mensaje = `${capitalizar(campo.nombre)} debe estar entre ${minimo} y ${maximo}.`;
        }

        if (mensaje) mostrarErrorCampo(campo, mensaje);
        else limpiarErrorCampo(campo);
        return Object.freeze({ valido: !mensaje, valor, mensaje, control });
    }

    function seleccionarFormula(datos) {
        const disponibles = Object.values(FORMULAS)
            .filter(formula => formula.campos.every(campo => Number.isFinite(datos[campo])))
            .sort((a, b) => b.prioridad - a.prioridad);
        const solicitada = FORMULAS[datos.formulaSolicitada];
        if (solicitada && solicitada.campos.every(campo => Number.isFinite(datos[campo]))) return solicitada;
        if (!disponibles.length) throw new Error("No hay una fórmula compatible con las medidas disponibles.");
        return disponibles[0];
    }

    function calcularPeso(datos, formula = seleccionarFormula(datos)) {
        const peso = formula.calcular(datos);
        if (!Number.isFinite(peso) || peso <= 0) throw new Error("No se ha podido calcular el peso con las medidas introducidas.");
        return peso;
    }

    function calcularPercentil(peso, edadGestacional) {
        if (edadGestacional < 18 || edadGestacional > 41) {
            return Object.freeze({
                disponible: false,
                etiqueta: "No disponible",
                mensaje: "Percentil no disponible para esta edad gestacional con el estándar utilizado."
            });
        }

        const curvas = interpolarCurvas(edadGestacional);
        const parametros = obtenerParametrosLms(edadGestacional);
        const y = Math.log(peso);
        const z = Math.abs(parametros.lambda) < 1e-12
            ? Math.log(y / parametros.mu) / parametros.sigma
            : (((y / parametros.mu) ** parametros.lambda) - 1)
                / (parametros.sigma * parametros.lambda);
        const valor = limitar(distribucionNormalAcumulada(z) * 100, 0.1, 99.9);
        const etiqueta = peso < curvas.p3 ? "<3" : peso > curvas.p97 ? ">97" : formatearDecimal(valor, 1);

        return Object.freeze({ disponible: true, valor, etiqueta, z, curvas });
    }

    function interpolarCurvas(edadGestacional) {
        const inferior = Math.floor(edadGestacional);
        const superior = Math.min(41, inferior + 1);
        const proporcion = edadGestacional - inferior;
        const resultado = {};
        ["p3", "p10", "p50", "p90", "p97"].forEach(clave => {
            resultado[clave] = INTERGROWTH_HADLOCK[inferior][clave]
                + proporcion * (INTERGROWTH_HADLOCK[superior][clave] - INTERGROWTH_HADLOCK[inferior][clave]);
        });
        return Object.freeze(resultado);
    }

    function obtenerParametrosLms(edadGestacional) {
        const escala = edadGestacional / 10;
        return Object.freeze({
            lambda: 9.43643 + (9.41579 * escala ** -2) - (83.54220 * Math.log(escala) * escala ** -2),
            mu: -2.42272 + (1.86478 * edadGestacional ** 0.5) - (1.93299e-5 * edadGestacional ** 3),
            sigma: 0.0193557 + (0.0310716 * escala ** -2) - (0.0657587 * Math.log(escala) * escala ** -2)
        });
    }

    function distribucionNormalAcumulada(z) {
        const signo = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);
        const t = 1 / (1 + (0.3275911 * x));
        const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
            - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x ** 2));
        return 0.5 * (1 + signo * erf);
    }

    function generarInterpretacion(percentil) {
        if (!percentil.disponible) return Object.freeze({ nivel: "sin-percentil", titulo: percentil.mensaje, texto: MENSAJE_CONTEXTO });
        let titulo;
        if (percentil.valor < 3) titulo = "El peso estimado se sitúa por debajo del percentil 3 del estándar seleccionado.";
        else if (percentil.valor < 10) titulo = "El peso estimado se sitúa entre los percentiles 3 y 10.";
        else if (percentil.valor <= 90) titulo = "El peso estimado se sitúa entre los percentiles 10 y 90.";
        else if (percentil.valor <= 97) titulo = "El peso estimado se sitúa entre los percentiles 90 y 97.";
        else titulo = "El peso estimado se sitúa por encima del percentil 97.";
        return Object.freeze({ nivel: "orientativo", titulo, texto: MENSAJE_CONTEXTO });
    }

    function construirResultado(datos, formula, pesoExacto, percentil, interpretacion) {
        return Object.freeze({
            fecha: new Date(), datos, formula: Object.freeze({ id: formula.id, nombre: formula.nombre }),
            pesoExacto, peso: Math.round(pesoExacto), kilogramos: pesoExacto / 1000,
            percentil, interpretacion
        });
    }

    function actualizarResultados(resultado) {
        const edad = formatearEdad(resultado.datos.semanas, resultado.datos.dias);
        const percentilTexto = resultado.percentil.disponible ? resultado.percentil.etiqueta : "No disponible";
        const rango = resultado.percentil.disponible
            ? `${formatearEntero(resultado.percentil.curvas.p10)}–${formatearEntero(resultado.percentil.curvas.p90)} g`
            : "No disponible";
        const fecha = resultado.fecha.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" });

        escribir("#resultadoPrincipal", formatearEntero(resultado.peso));
        escribir("#unidadResultadoPrincipal", "g");
        escribir("#resultadoSecundarioUno", formatearDecimal(resultado.kilogramos, 3));
        escribir("#unidadResultadoSecundarioUno", "kg");
        escribir("#resultadoSecundarioDos", percentilTexto);
        escribir("#unidadResultadoSecundarioDos", resultado.percentil.disponible ? "percentil" : "");
        escribir("#resultadoSecundarioTres", rango);
        escribir("#unidadResultadoSecundarioTres", "");
        escribir("#resumenResultado", `Peso fetal estimado de ${formatearEntero(resultado.peso)} g (${formatearDecimal(resultado.kilogramos, 3)} kg) para ${edad}. Percentil: ${percentilTexto}.`);
        escribir("#descripcionResultadoPrincipal", `Cálculo del ${fecha}. Medidas: BPD ${formatearDecimal(resultado.datos.bpd, 1)} mm, HC ${formatearDecimal(resultado.datos.hc, 1)} mm, AC ${formatearDecimal(resultado.datos.ac, 1)} mm y FL ${formatearDecimal(resultado.datos.fl, 1)} mm.`);
        escribir("#interpretacionResultado", `${resultado.interpretacion.titulo} ${resultado.interpretacion.texto}`);
        escribir("#formulaUtilizada", `Fórmula utilizada: ${resultado.formula.nombre}. BPD no interviene en el cálculo.`);
        escribir("#rangoEsperado", resultado.percentil.disponible
            ? `Rango central P10–P90 INTERGROWTH-21st: ${rango} para ${edad}.`
            : resultado.percentil.mensaje);
        escribir("#avisoResultado", "Resultado orientativo: el peso ecográfico tiene margen de error y no sustituye la valoración obstétrica.");

        actualizarBarraPercentil(resultado.percentil);
        actualizarIndicadores(resultado);
        mostrarResultadosYEnfocar();
        mostrar(buscar(SELECTORES.botonCompartir));
        escribir(SELECTORES.estadoCompartir, "");
    }

    function actualizarBarraPercentil(percentil) {
        const barra = buscar("#barraPercentil");
        const indicador = buscar("#indicadorPercentil");
        if (!percentil.disponible) {
            if (barra) {
                ["aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"]
                    .forEach(atributo => barra.removeAttribute(atributo));
                barra.setAttribute("role", "img");
                barra.setAttribute("aria-label", percentil.mensaje);
            }
            if (indicador) indicador.hidden = true;
            escribir("#leyendaPercentil", `${percentil.mensaje} El estándar cubre de 18+0 a 41+0 semanas.`);
            return;
        }
        const posicion = limitar(percentil.valor, 0, 100);
        if (barra) {
            barra.setAttribute("role", "progressbar");
            barra.setAttribute("aria-valuemin", "0");
            barra.setAttribute("aria-valuemax", "100");
            barra.setAttribute("aria-valuenow", posicion.toFixed(1));
            barra.setAttribute("aria-valuetext", `Percentil ${percentil.etiqueta}. Zonas: inferior a P3, P3 a P10, P10 a P90, P90 a P97 y superior a P97.`);
        }
        if (indicador) {
            indicador.hidden = false;
            indicador.style.left = `${posicion}%`;
            indicador.dataset.percentil = percentil.etiqueta;
        }
        escribir("#leyendaPercentil", `Percentil ${percentil.etiqueta}. Referencias: P3, P10, P50, P90 y P97 del estándar INTERGROWTH-21st para Hadlock.`);
    }

    function actualizarIndicadores(resultado) {
        escribir("#indicadorPeso", `Peso estimado: ${formatearEntero(resultado.peso)} g`);
        escribir("#indicadorRango", resultado.percentil.disponible ? `Percentil INTERGROWTH-21st: ${resultado.percentil.etiqueta}` : resultado.percentil.mensaje);
        escribir("#indicadorDatos", "Fórmula Hadlock HC–AC–FL; BPD informativo");
    }

    async function compartirResultado() {
        if (!ultimoResultado) return;
        const r = ultimoResultado;
        const percentil = r.percentil.disponible ? r.percentil.etiqueta : "no disponible para esta edad gestacional";
        const texto = `Peso fetal estimado: ${formatearEntero(r.peso)} g (${formatearDecimal(r.kilogramos, 3)} kg). Percentil INTERGROWTH-21st: ${percentil}. Estimación orientativa; no es un diagnóstico.`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "Calculadora de Peso Fetal Estimado PRO", text: texto, url: location.href });
                escribir(SELECTORES.estadoCompartir, "Resultado compartido correctamente.");
                return;
            }
            const copiado = typeof copiarTexto === "function" ? await copiarTexto(texto) : await copiarAlPortapapeles(texto);
            escribir(SELECTORES.estadoCompartir, copiado ? "Resumen copiado al portapapeles." : "No se ha podido copiar el resumen.");
        } catch (error) {
            escribir(SELECTORES.estadoCompartir, error?.name === "AbortError" ? "Compartición cancelada." : "No se ha podido compartir el resultado.");
        }
    }

    async function copiarAlPortapapeles(texto) {
        try { await navigator.clipboard.writeText(texto); return true; } catch (error) { return false; }
    }

    function desactivarHistorialLocal() {
        try {
            localStorage.removeItem("h360-peso-fetal-estimado-historial-v1");
            localStorage.removeItem("h360_peso_fetal_historial_v1");
        } catch (error) {
            anunciarFormulario("El almacenamiento local no está disponible. La herramienta no guardará datos del cálculo.");
        }
    }

    function gestionarEdicion(campo) {
        if (campo) limpiarErrorCampo(campo);
        anunciarFormulario(""); escribir(SELECTORES.estadoCompartir, "");
        if (ultimoResultado) ocultarResultadosPropios();
        ultimoResultado = null;
        ocultar(buscar(SELECTORES.botonCompartir));
        actualizarVisibilidadReinicio();
    }

    function actualizarVisibilidadReinicio() {
        const hayDatos = Object.values(CAMPOS).some(campo => Boolean(buscar(campo.selector)?.value.trim()));
        const formulaModificada = buscar(SELECTORES.formula)?.value !== "hadlock-3";
        if (hayDatos || formulaModificada) mostrar(buscar(SELECTORES.botonReiniciar));
        else ocultar(buscar(SELECTORES.botonReiniciar));
    }

    function reiniciarFormulario() {
        const formulario = buscar(SELECTORES.formulario);
        if (!formulario) return;
        formulario.reset(); limpiarErroresFormulario(); anunciarFormulario(""); escribir(SELECTORES.estadoCompartir, "");
        ocultarResultadosPropios(); ocultar(buscar(SELECTORES.botonReiniciar)); ocultar(buscar(SELECTORES.botonCompartir));
        restablecerResultados(); ultimoResultado = null;
        const resultados = buscar(SELECTORES.resultados);
        resultados?.removeAttribute("tabindex"); resultados?.setAttribute("aria-busy", "false");
        window.requestAnimationFrame(() => buscar(CAMPOS.semanas.selector)?.focus());
    }

    function restablecerResultados() {
        escribir("#resultadoPrincipal", "—"); escribir("#resultadoSecundarioUno", "—");
        escribir("#resultadoSecundarioDos", "—"); escribir("#resultadoSecundarioTres", "—");
        escribir("#resumenResultado", "El resumen del cálculo aparecerá aquí.");
        escribir("#interpretacionResultado", "La interpretación orientativa aparecerá aquí.");
        escribir("#formulaUtilizada", "La fórmula utilizada se mostrará después de calcular.");
        escribir("#rangoEsperado", "El rango de referencia se mostrará cuando esté disponible.");
        escribir("#avisoResultado", "Los avisos aparecerán junto al resultado.");
        escribir("#leyendaPercentil", "La posición del resultado aparecerá aquí.");
        escribir("#indicadorPeso", "Sin calcular"); escribir("#indicadorRango", "Sin calcular"); escribir("#indicadorDatos", "Sin calcular");
        const barra = buscar("#barraPercentil");
        if (barra) {
            ["aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"].forEach(atributo => barra.removeAttribute(atributo));
            barra.setAttribute("role", "img"); barra.setAttribute("aria-label", "Barra de percentil antes del cálculo");
        }
        const indicador = buscar("#indicadorPercentil");
        if (indicador) { indicador.hidden = false; indicador.style.removeProperty("left"); delete indicador.dataset.percentil; }
    }

    function mostrarResultadosYEnfocar() {
        const resultados = buscar(SELECTORES.resultados);
        if (!resultados) return;
        resultados.classList.remove("oculto"); resultados.setAttribute("aria-busy", "false"); resultados.setAttribute("tabindex", "-1");
        mostrar(buscar(SELECTORES.botonReiniciar));
        resultados.focus({ preventScroll: true }); resultados.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function ocultarResultadosPropios() { buscar(SELECTORES.resultados)?.classList.add("oculto"); }

    function establecerCalculando(calculando) {
        const boton = buscar(SELECTORES.botonCalcular); if (!boton) return;
        boton.disabled = calculando; boton.setAttribute("aria-disabled", String(calculando));
        boton.textContent = calculando ? "Calculando..." : "Calcular peso fetal";
        buscar(SELECTORES.resultados)?.setAttribute("aria-busy", String(calculando));
    }

    function mostrarErrorCampo(campo, mensaje) { mostrarErrorSelector(campo.error, buscar(campo.selector), mensaje); }
    function mostrarErrorSelector(selectorError, control, mensaje) { escribir(selectorError, mensaje); control?.setAttribute("aria-invalid", "true"); }
    function limpiarErrorCampo(campo) { limpiarErrorSelector(campo.error, buscar(campo.selector)); }
    function limpiarErrorSelector(selectorError, control) { escribir(selectorError, ""); control?.removeAttribute("aria-invalid"); }
    function limpiarErroresFormulario() {
        Object.values(CAMPOS).forEach(limpiarErrorCampo);
        limpiarErrorSelector(SELECTORES.errorFormula, buscar(SELECTORES.formula));
    }
    function enfocarPrimerError(control) { control?.focus({ preventScroll: true }); control?.scrollIntoView({ behavior: "smooth", block: "center" }); }
    function anunciarFormulario(mensaje) { const estado = buscar(SELECTORES.estadoFormulario); if (estado) estado.textContent = mensaje; }

    function buscar(selector) { return document.querySelector(selector); }
    function escribir(selector, valor) { const elemento = buscar(selector); if (elemento) elemento.textContent = String(valor ?? ""); }
    function mostrar(elemento) { elemento?.classList.remove("oculto"); }
    function ocultar(elemento) { elemento?.classList.add("oculto"); }
    function limitar(numero, minimo, maximo) { return Math.min(Math.max(numero, minimo), maximo); }
    function formatearEntero(numero) { return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(numero); }
    function formatearDecimal(numero, decimales) { return new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(numero); }
    function formatearEdad(semanas, dias) { return `${semanas} semanas y ${dias} ${dias === 1 ? "día" : "días"}`; }
    function capitalizar(texto) { return texto.charAt(0).toUpperCase() + texto.slice(1); }
    function pluralizarErrores(cantidad) { return cantidad === 1 ? "Hay 1 campo con errores." : `Hay ${cantidad} campos con errores.`; }

}());
