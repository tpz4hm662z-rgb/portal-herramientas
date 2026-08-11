(function () {
    "use strict";

    const engine = window.FireEngine;
    const config = window.CONFIG;
    const estado = { resultado: null, entrada: null };
    const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
    const euroPreciso = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const porcentaje = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 1 });
    const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
    const $ = selector => document.querySelector(selector);

    function valor(id) {
        const texto = document.getElementById(id).value.trim();
        if (texto === "") return null;
        const convertido = Number(texto);
        return Object.is(convertido, -0) ? 0 : convertido;
    }
    function dinero(cantidad, preciso) { return (preciso ? euroPreciso : euro).format(cantidad); }
    function pct(valor) { return porcentaje.format(valor); }
    function duracion(meses) {
        if (meses === null) return "No alcanzado";
        const anos = Math.floor(meses / 12), resto = meses % 12, partes = [];
        if (anos) partes.push(`${anos} ${anos === 1 ? "año" : "años"}`);
        if (resto) partes.push(`${resto} ${resto === 1 ? "mes" : "meses"}`);
        return partes.length ? partes.join(" y ") : "menos de un mes";
    }
    function limpiarErrores() {
        document.querySelectorAll("[aria-invalid]").forEach(campo => campo.removeAttribute("aria-invalid"));
        document.querySelectorAll(".error-campo").forEach(elemento => { elemento.textContent = ""; });
    }
    function mostrarError(id, mensaje) {
        const campo = document.getElementById(id), salida = document.getElementById(`error-${id}`);
        campo.setAttribute("aria-invalid", "true"); salida.textContent = mensaje;
    }
    function validarCampo(id, etiqueta, opciones) {
        const dato = valor(id);
        if (dato === null) { mostrarError(id, `Introduce ${etiqueta}.`); return false; }
        if (!Number.isFinite(dato)) { mostrarError(id, `${etiqueta} debe ser un número válido.`); return false; }
        if (opciones.mayorQueCero ? dato <= 0 : dato < 0) { mostrarError(id, opciones.mayorQueCero ? `${etiqueta} debe ser mayor que cero.` : `${etiqueta} no puede ser negativo.`); return false; }
        if (dato > opciones.maximo) { mostrarError(id, `${etiqueta} supera el máximo admitido de ${opciones.maximo}.`); return false; }
        return true;
    }
    function recogerEntrada() {
        limpiarErrores();
        const comprobaciones = [
            validarCampo("edadActual", "la edad actual", { maximo: 100 }),
            validarCampo("patrimonioActual", "el patrimonio actual", { maximo: 1e15 }),
            validarCampo("aportacionMensual", "la aportación mensual", { maximo: 1e9 }),
            validarCampo("gastosMensuales", "los gastos mensuales", { maximo: 1e9, mayorQueCero: true }),
            validarCampo("rentabilidadAnual", "la rentabilidad anual", { maximo: 100 }),
            validarCampo("inflacionAnual", "la inflación anual", { maximo: 100 }),
            validarCampo("tasaRetirada", "la tasa de retirada", { maximo: 100, mayorQueCero: true })
        ];
        if (comprobaciones.some(esValido => !esValido)) return null;
        return {
            edadActual: valor("edadActual"),
            patrimonioInicial: valor("patrimonioActual"),
            aportacionMensual: valor("aportacionMensual"),
            gastoMensual: valor("gastosMensuales"),
            rentabilidadNominalAnual: valor("rentabilidadAnual") / 100,
            inflacionAnual: valor("inflacionAnual") / 100,
            tasaRetirada: valor("tasaRetirada") / 100,
            horizonteMeses: config.dominio.horizontePredeterminadoMeses,
            momentoAportacion: $("#momentoAportacion").value
        };
    }
    function metrica(etiqueta, dato) { return `<dl class="metrica"><dt>${etiqueta}</dt><dd>${dato}</dd></dl>`; }
    function estadoAlcanzado(resultado) { return resultado.estado === engine.STATUS.REACHED || resultado.estado === engine.STATUS.ALREADY_FIRE; }

    function renderPrincipal(resultado) {
        const contenedor = $("#resultado-principal");
        contenedor.className = "resultado-principal";
        if (resultado.estado === engine.STATUS.REACHED) {
            contenedor.innerHTML = `<p class="paso">Tu estimación FIRE</p><h2 id="resultado-titulo">Podrías alcanzar tu independencia financiera aproximadamente a los ${numero.format(resultado.edadFireAproximada)} años</h2><p>${duracion(resultado.mesesHastaFire)} desde tu edad actual, bajo los supuestos introducidos.</p>`;
        } else if (resultado.estado === engine.STATUS.ALREADY_FIRE) {
            contenedor.classList.add("already");
            contenedor.innerHTML = `<p class="paso">Objetivo alcanzado</p><h2 id="resultado-titulo">Según estos supuestos, ya has alcanzado tu número FIRE.</h2><p>Es una estimación educativa: no afirma que puedas jubilarte con seguridad.</p>`;
        } else if (resultado.estado === engine.STATUS.NOT_REACHED) {
            contenedor.classList.add("not-reached");
            contenedor.innerHTML = `<p class="paso">Horizonte de cálculo</p><h2 id="resultado-titulo">Con estos supuestos no se alcanza el objetivo FIRE dentro del horizonte calculado.</h2><p>La proyección termina después de ${duracion(resultado.mesesSimulados)} sin inventar una edad FIRE.</p>`;
        }
    }
    function renderProgreso(resultado) {
        const progresoReal = resultado.patrimonioInicial / resultado.objetivoFire;
        const visual = Math.min(1, Math.max(0, progresoReal));
        $("#progreso-contenedor").innerHTML = `<section class="progreso-bloque" aria-labelledby="progreso-titulo"><div class="progreso-cabecera"><p id="progreso-titulo"><strong>Progreso actual hacia FIRE</strong></p><strong>${pct(progresoReal)}</strong></div><div class="barra-progreso" role="progressbar" aria-label="Progreso actual hacia el objetivo FIRE" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(visual * 100)}"><span style="width:${visual * 100}%"></span></div><p class="progreso-detalle">${progresoReal >= 1 ? `El indicador visual está completo; tu margen real es ${dinero(resultado.patrimonioInicial - resultado.objetivoFire)}.` : `${dinero(resultado.patrimonioInicial)} de ${dinero(resultado.objetivoFire)}.`}</p></section>`;
    }
    function renderMetricas(resultado) {
        let items;
        if (resultado.estado === engine.STATUS.ALREADY_FIRE) {
            items = [metrica("Patrimonio actual", dinero(resultado.patrimonioInicial)), metrica("Objetivo FIRE", dinero(resultado.objetivoFire)), metrica("Margen sobre el objetivo", dinero(resultado.patrimonioInicial - resultado.objetivoFire)), metrica("Tasa de retirada", pct(resultado.tasaRetirada))];
        } else if (resultado.estado === engine.STATUS.NOT_REACHED) {
            items = [metrica("Patrimonio final", dinero(resultado.patrimonioFinal)), metrica("Objetivo FIRE", dinero(resultado.objetivoFire)), metrica("Objetivo alcanzado", pct(resultado.porcentajeObjetivo)), metrica("Horizonte utilizado", duracion(resultado.mesesSimulados)), metrica("Gasto anual", dinero(resultado.gastoAnual)), metrica("Rentabilidad real", pct(resultado.rentabilidadRealAnual))];
        } else {
            items = [metrica("Capital FIRE necesario", dinero(resultado.objetivoFire)), metrica("Patrimonio proyectado", dinero(resultado.patrimonioFinal)), metrica("Progreso actual", pct(resultado.patrimonioInicial / resultado.objetivoFire)), metrica("Gasto anual utilizado", dinero(resultado.gastoAnual)), metrica("Tasa de retirada", pct(resultado.tasaRetirada)), metrica("Rentabilidad real estimada", pct(resultado.rentabilidadRealAnual))];
        }
        $("#metricas").innerHTML = items.join("");
    }

    function renderGrafico(resultado) {
        const bloque = $("#evolucion");
        if (resultado.estado === engine.STATUS.ALREADY_FIRE) { bloque.hidden = true; return; }
        bloque.hidden = false;
        const puntos = [{ mesAcumulado: 0, patrimonioReal: resultado.patrimonioInicial }].concat(resultado.serieAnual);
        const ancho = 800, alto = 340, izquierda = 72, derecha = 22, arriba = 25, abajo = 48;
        const maxMes = Math.max(1, resultado.mesesSimulados), maxValor = Math.max(resultado.objetivoFire, ...puntos.map(p => p.patrimonioReal), 1) * 1.06;
        const x = mes => izquierda + mes / maxMes * (ancho - izquierda - derecha);
        const y = importe => arriba + (1 - importe / maxValor) * (alto - arriba - abajo);
        const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(p.mesAcumulado).toFixed(1)},${y(p.patrimonioReal).toFixed(1)}`).join(" ");
        const area = `${linea} L${x(puntos.at(-1).mesAcumulado).toFixed(1)},${alto - abajo} L${izquierda},${alto - abajo} Z`;
        const rejilla = [0,.25,.5,.75,1].map(fraccion => { const importe = maxValor * fraccion, yy = y(importe); return `<line class="grid" x1="${izquierda}" y1="${yy}" x2="${ancho-derecha}" y2="${yy}"/><text x="${izquierda-10}" y="${yy+4}" text-anchor="end">${euro.format(importe).replace(/,00/,"")}</text>`; }).join("");
        const marcasX = [0,.25,.5,.75,1].map(fraccion => { const mes = Math.round(maxMes * fraccion); return `<text x="${x(mes)}" y="${alto-17}" text-anchor="middle">${Math.round(mes/12)} a.</text>`; }).join("");
        $("#grafico-fire").innerHTML = `<svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true" focusable="false"><defs><linearGradient id="areaFire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".23"/><stop offset="1" stop-color="#2563eb" stop-opacity=".02"/></linearGradient></defs>${rejilla}${marcasX}<path class="area" d="${area}"/><line class="objetivo" x1="${izquierda}" y1="${y(resultado.objetivoFire)}" x2="${ancho-derecha}" y2="${y(resultado.objetivoFire)}"/><path class="patrimonio" d="${linea}"/></svg>`;
        $("#grafico-descripcion").textContent = `La proyección parte de ${dinero(resultado.patrimonioInicial)} y termina en ${dinero(resultado.patrimonioFinal)} tras ${duracion(resultado.mesesSimulados)}. El objetivo FIRE es ${dinero(resultado.objetivoFire)}.`;
    }

    function textoEscenario(resultado) {
        if (resultado.estado === engine.STATUS.ALREADY_FIRE) return "Objetivo ya alcanzado";
        if (resultado.estado === engine.STATUS.REACHED) return `A los ${numero.format(resultado.edadFireAproximada)} años · ${duracion(resultado.mesesHastaFire)}`;
        return `No se alcanza en ${duracion(resultado.mesesSimulados)}`;
    }
    function renderEscenarios(entrada) {
        const tasas = [Math.max(0, entrada.rentabilidadNominalAnual - .02), entrada.rentabilidadNominalAnual, entrada.rentabilidadNominalAnual + .02];
        const nombres = ["Conservador", "Base", "Favorable"];
        const resultados = engine.ejecutarEscenarios(tasas.map(tasa => Object.assign({}, entrada, { rentabilidadNominalAnual: tasa })));
        $("#escenarios-grid").innerHTML = resultados.map((resultado, indice) => `<article class="escenario ${indice === 1 ? "base" : ""}"><h3>${nombres[indice]}</h3><p class="dato-destacado">${pct(tasas[indice])} nominal anual</p><p class="dato-secundario">${textoEscenario(resultado)}</p><p class="dato-secundario">Objetivo: ${dinero(resultado.objetivoFire)}</p><span class="estado-chip ${estadoAlcanzado(resultado) ? "" : "no"}">${estadoAlcanzado(resultado) ? "Objetivo alcanzado" : "No alcanzado"}</span></article>`).join("");
    }
    function descripcionAdelanto(base, variante) {
        if (base.estado === engine.STATUS.ALREADY_FIRE) return "El objetivo base ya está alcanzado";
        if (estadoAlcanzado(variante) && !estadoAlcanzado(base)) return `La variante sí alcanza FIRE en ${duracion(variante.mesesHastaFire)}`;
        if (!estadoAlcanzado(variante)) return "No alcanza FIRE dentro del horizonte";
        const diferencia = base.mesesHastaFire - variante.mesesHastaFire;
        if (diferencia > 0) return `${duracion(diferencia)} antes`;
        if (diferencia === 0) return "Sin cambio en meses completos";
        return `${duracion(Math.abs(diferencia))} después`;
    }
    function renderSensibilidad(entrada, resultadoBase) {
        const reduccion = Math.min(100, Math.max(0, entrada.gastoMensual - .01));
        const variaciones = [{ aportacionMensual: entrada.aportacionMensual + 100 }];
        const meta = [{ titulo: "+100 € de aportación mensual", detalle: "Aportación más alta" }];
        if (reduccion > 0) { variaciones.push({ gastoMensual: entrada.gastoMensual - reduccion }); meta.push({ titulo: `−${dinero(reduccion, true)} de gastos mensuales`, detalle: "Solo reduce el objetivo FIRE" }); }
        variaciones.push({ rentabilidadNominalAnual: entrada.rentabilidadNominalAnual + .01 }); meta.push({ titulo: "+1 punto de rentabilidad", detalle: "Sensibilidad matemática" });
        const comparacion = engine.compararSensibilidad(entrada, variaciones);
        $("#sensibilidad-grid").innerHTML = comparacion.comparaciones.map((item, indice) => `<article class="sensibilidad-item"><h3>${meta[indice].titulo}</h3><p class="dato-destacado">${descripcionAdelanto(resultadoBase, item.resultado)}</p><p class="dato-secundario">${meta[indice].detalle}</p></article>`).join("");
    }
    function renderTabla(resultado) {
        $("#tabla-evolucion").innerHTML = resultado.serieAnual.map(fila => `<tr><td>${fila.ano}</td><td>${numero.format(resultado.edadActual + fila.mesAcumulado / 12)}</td><td>${dinero(fila.patrimonioReal)}</td><td>${dinero(fila.aportacionesAcumuladas)}</td><td>${dinero(fila.crecimientoRealAcumulado)}</td><td>${pct(fila.porcentajeObjetivo)}</td></tr>`).join("");
        $("#tabla-bloque").hidden = resultado.serieAnual.length === 0;
    }
    function renderTodo(resultado, entrada) {
        estado.resultado = resultado; estado.entrada = entrada;
        ["#escenarios", "#sensibilidad", "#coast-bloque", ".metodologia-breve"].forEach(selector => { $(selector).hidden = false; });
        renderPrincipal(resultado); renderProgreso(resultado); renderMetricas(resultado); renderGrafico(resultado); renderEscenarios(entrada); renderSensibilidad(entrada, resultado); renderTabla(resultado);
        $("#resultado-coast").innerHTML = ""; $("#resultados").hidden = false; $("#resultados").focus({ preventScroll: true }); $("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function renderInvalido() {
        $("#resultados").hidden = false; $("#resultado-principal").className = "resultado-principal invalid"; $("#resultado-principal").innerHTML = `<p class="paso">Revisa los datos</p><h2 id="resultado-titulo">No ha sido posible calcular este escenario.</h2><p>Corrige los campos indicados o utiliza valores menos extremos.</p>`;
        ["#progreso-contenedor","#metricas","#grafico-fire","#escenarios-grid","#sensibilidad-grid","#tabla-evolucion","#resultado-coast"].forEach(selector => { $(selector).innerHTML = ""; });
        ["#evolucion", "#escenarios", "#sensibilidad", "#coast-bloque", "#tabla-bloque", ".metodologia-breve"].forEach(selector => { $(selector).hidden = true; });
        $("#resultados").focus();
    }
    function calcular(evento) {
        evento.preventDefault();
        const entrada = recogerEntrada();
        if (!entrada) { $("#resultados").hidden = true; document.querySelector("[aria-invalid=true]")?.focus(); return; }
        const resultado = engine.proyectarFire(entrada);
        if (resultado.estado === engine.STATUS.INVALID) { renderInvalido(); return; }
        renderTodo(resultado, entrada);
    }
    function calcularCoast(evento) {
        evento.preventDefault();
        document.getElementById("edadObjetivoCoast").removeAttribute("aria-invalid"); $("#error-edadObjetivoCoast").textContent = "";
        if (!estado.resultado) { mostrarError("edadObjetivoCoast", "Calcula primero tu escenario FIRE principal."); return; }
        const edadObjetivo = valor("edadObjetivoCoast"), edadActual = estado.entrada.edadActual;
        if (!Number.isFinite(edadObjetivo)) { mostrarError("edadObjetivoCoast", "Introduce una edad objetivo válida."); return; }
        if (edadObjetivo < edadActual) { mostrarError("edadObjetivoCoast", "La edad objetivo no puede ser inferior a tu edad actual."); return; }
        const meses = Math.round((edadObjetivo - edadActual) * 12);
        if (meses > engine.CONSTANTES.HORIZONTE_MAXIMO_MESES) { mostrarError("edadObjetivoCoast", "La edad objetivo no puede superar un horizonte de 100 años."); return; }
        const resultado = engine.calcularCoastFire({ objetivoFire: estado.resultado.objetivoFire, rentabilidadRealAnual: estado.resultado.rentabilidadRealAnual, mesesHastaObjetivo: meses, patrimonioActual: estado.resultado.patrimonioInicial });
        if (resultado.estado === engine.STATUS.INVALID) { $("#resultado-coast").innerHTML = `<p class="coast-mensaje no">No ha sido posible calcular Coast FIRE con estos supuestos.</p>`; return; }
        const alcanzado = resultado.estado === engine.STATUS.COAST_REACHED;
        $("#resultado-coast").innerHTML = `<p class="coast-mensaje ${alcanzado ? "" : "no"}">${alcanzado ? "Según estos supuestos, ya has alcanzado Coast FIRE para esa edad objetivo." : "Según estos supuestos, todavía no has alcanzado Coast FIRE para esa edad objetivo."}</p><div class="coast-grid">${metrica("Capital Coast necesario hoy", dinero(resultado.capitalCoastNecesarioHoy))}${metrica("Patrimonio actual", dinero(resultado.patrimonioActual))}${metrica(alcanzado ? "Margen" : "Capital pendiente", dinero(Math.abs(resultado.diferencia)))}${metrica("Porcentaje alcanzado", pct(resultado.porcentajeAlcanzado))}</div><p class="aclaracion">El estado se refiere únicamente a dejar de realizar nuevas aportaciones bajo estos supuestos; no implica que puedas dejar de trabajar.</p>`;
    }
    function reiniciar() {
        window.setTimeout(() => {
            limpiarErrores(); estado.resultado = null; estado.entrada = null; $("#resultados").hidden = true;
            ["#resultado-principal", "#progreso-contenedor", "#metricas", "#grafico-fire", "#grafico-descripcion", "#escenarios-grid", "#sensibilidad-grid", "#tabla-evolucion", "#resultado-coast"].forEach(selector => { $(selector).innerHTML = ""; });
            [".opciones-avanzadas", "#coast-bloque", "#tabla-bloque"].forEach(selector => { $(selector).open = false; });
            $("#form-fire").querySelector("input").focus();
        }, 0);
    }
    function iniciar() {
        if (!engine) return;
        $("#form-fire").addEventListener("submit", calcular);
        $("#form-fire").addEventListener("reset", reiniciar);
        $("#form-coast").addEventListener("submit", calcularCoast);
        window.FireUI = Object.freeze({ calcular, dinero, pct, duracion });
    }
    iniciar();
}());
