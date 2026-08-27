/* Imoancy Template v3.1 Stable · Lógica específica */
"use strict";

const MS_DIA = 86400000;

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    const botonReiniciar = $(CONFIG.selectores.botonReiniciar);
    const hoy = fechaISO(new Date());

    $("#fechaNacimiento").max = hoy;
    $("#fechaReferencia").value = hoy;

    formulario.addEventListener("submit", procesarFormulario);
    botonReiniciar.addEventListener("click", () => {
        reiniciarHerramientaBase();
        $("#fechaReferencia").value = hoy;
        $("#diasGestacion").value = "0";
        $("#fechaNacimiento").focus();
    });
}

function procesarFormulario(evento) {
    evento.preventDefault();
    establecerEstadoCalculando(true);

    const validacion = validarFormulario();
    const validacionEspecifica = validarDatosClinicos(validacion.valores);

    if (!validacion.valido || !validacionEspecifica) {
        establecerEstadoCalculando(false);
        return;
    }

    const resultado = calcular(validacion.valores);
    pintarResultados(resultado);
    pintarExperienciaPremium(resultado);
    registrarCalculo();
    establecerEstadoCalculando(false);
}

function validarDatosClinicos(datos) {
    let valido = true;
    const nacimiento = leerFecha(datos.fechaNacimiento);
    const referencia = leerFecha(datos.fechaReferencia);
    const hoy = leerFecha(fechaISO(new Date()));

    if (!nacimiento) {
        mostrarError("#errorFechaNacimiento", "Introduce una fecha de nacimiento válida.");
        valido = false;
    } else if (nacimiento > hoy) {
        mostrarError("#errorFechaNacimiento", "La fecha de nacimiento no puede ser futura.");
        valido = false;
    }

    if (!referencia) {
        mostrarError("#errorFechaReferencia", "Introduce una fecha de referencia válida.");
        valido = false;
    } else if (nacimiento && referencia < nacimiento) {
        mostrarError("#errorFechaReferencia", "La fecha de referencia debe ser igual o posterior al nacimiento.");
        valido = false;
    }

    if (!Number.isInteger(datos.semanasGestacion)) {
        mostrarError("#errorSemanasGestacion", "Introduce semanas completas, sin decimales.");
        valido = false;
    }

    if (!Number.isInteger(datos.diasGestacion)) {
        mostrarError("#errorDiasGestacion", "Introduce un número entero entre 0 y 6.");
        valido = false;
    }

    if (!valido) {
        const primerError = $("[aria-invalid='true']");
        if (primerError) primerError.focus();
    }
    return valido;
}

function calcular(datos) {
    const nacimiento = leerFecha(datos.fechaNacimiento);
    const referencia = leerFecha(datos.fechaReferencia);
    const gestacionDias = (datos.semanasGestacion * 7) + datos.diasGestacion;
    const prematuridadDias = 280 - gestacionDias;
    const probableParto = sumarDias(nacimiento, prematuridadDias);
    const cronologicaDias = diferenciaDias(nacimiento, referencia);
    const corregidaDias = diferenciaDias(probableParto, referencia);
    const antesDeTermino = corregidaDias < 0;
    const dosAniosCorregidos = sumarAnios(probableParto, 2);
    const correccionSuperada = referencia >= dosAniosCorregidos;

    let principal;
    let descripcion;
    let resumen;
    let interpretacion;
    let recomendaciones;

    if (antesDeTermino) {
        principal = "Aún no ha llegado la FPP";
        descripcion = `Faltan ${formatearSemanasDias(Math.abs(corregidaDias))} para la fecha probable de parto.`;
        resumen = `En la fecha elegida, tu bebé tiene ${formatearDuracion(nacimiento, referencia)} de edad cronológica.`;
        interpretacion = "Antes de la fecha probable de parto mostramos cuánto falta para esa fecha, sin convertirlo en una edad corregida negativa.";
        recomendaciones = [
            `Edad cronológica: ${formatearDuracion(nacimiento, referencia)} desde el nacimiento.`,
            `Antes de la FPP: faltan ${formatearSemanasDias(Math.abs(corregidaDias))} para la fecha prevista; no se muestra una edad corregida negativa.`,
            "Vacunas y citas: sigue las pautas sanitarias correspondientes; no deben retrasarse automáticamente usando la edad corregida."
        ];
    } else {
        principal = formatearDuracion(probableParto, referencia);
        descripcion = correccionSuperada
            ? "La mostramos como dato de referencia, aunque alrededor de los 2 años suele dejar de utilizarse para valorar hitos."
            : "Es la edad que tendría si contamos desde su fecha probable de parto.";
        resumen = `Tu bebé tiene ${formatearDuracion(nacimiento, referencia)} de edad cronológica y ${principal} de edad corregida.`;
        interpretacion = correccionSuperada
            ? "Alrededor de los 2 años, la corrección deja habitualmente de utilizarse como referencia para los hitos. No es una frontera biológica rígida y el equipo sanitario puede individualizar su uso."
            : "Durante los primeros 2 años, la edad corregida aporta contexto al hablar de desarrollo e hitos. Esta herramienta solo sitúa la edad: no evalúa el desarrollo.";
        recomendaciones = correccionSuperada
            ? [
                `Edad cronológica: ${formatearDuracion(nacimiento, referencia)} desde el nacimiento; se muestra siempre como referencia.`,
                "Alrededor de los 2 años suele dejar de corregirse la edad para valorar hitos, de forma gradual y no como una frontera rígida.",
                "Vacunas y citas: sigue las pautas sanitarias correspondientes; no deben retrasarse automáticamente usando la edad corregida."
            ]
            : [
                `Desarrollo e hitos: durante los primeros 2 años, mira principalmente la edad corregida (${principal}).`,
                `Edad cronológica: ${formatearDuracion(nacimiento, referencia)} desde el nacimiento; se muestra siempre como referencia.`,
                "Vacunas y citas: sigue las pautas sanitarias correspondientes; no deben retrasarse automáticamente usando la edad corregida."
            ];
    }

    return {
        principal,
        edadCorregidaDias: corregidaDias,
        antesDeTermino,
        correccionSuperada,
        secundarios: {
            edadCronologica: formatearDuracion(nacimiento, referencia),
            fechaProbableParto: formatearFecha(probableParto),
            prematuridad: formatearSemanasDias(prematuridadDias)
        },
        resumen,
        descripcion,
        interpretacion,
        recomendaciones
    };
}

function pintarExperienciaPremium(resultado) {
    pintarComparacionVisual(resultado);
}

function pintarComparacionVisual(resultado) {
    const edadCronologica = resultado.secundarios.edadCronologica;
    const edadCorregida = resultado.principal;

    establecerTexto("#comparacionCronologica", edadCronologica);
    establecerTexto("#comparacionCorregida", edadCorregida);

    let comparacion;
    if (resultado.antesDeTermino) {
        comparacion = "La edad cronológica sigue contando desde el nacimiento. Antes de la FPP mostramos cuánto falta para la fecha prevista, sin edad corregida negativa.";
    } else if (resultado.correccionSuperada) {
        comparacion = `La edad corregida es ${edadCorregida.toLowerCase()}. Alrededor de los 2 años suele dejar de utilizarse para valorar hitos, sin que sea una frontera rígida.`;
    } else {
        comparacion = `Durante los primeros 2 años, la edad corregida (${edadCorregida.toLowerCase()}) aporta contexto al hablar de desarrollo e hitos.`;
    }

    establecerTexto("#textoComparacion", comparacion);
}

function leerFecha(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) return null;
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
    return fecha;
}

function fechaISO(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function sumarDias(fecha, dias) {
    return new Date(fecha.getTime() + (dias * MS_DIA));
}

function sumarAnios(fecha, anios) {
    const copia = new Date(fecha.getTime());
    copia.setUTCFullYear(copia.getUTCFullYear() + anios);
    return copia;
}

function diferenciaDias(inicio, fin) {
    return Math.round((fin.getTime() - inicio.getTime()) / MS_DIA);
}

function formatearFecha(fecha) {
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fecha);
}

function formatearSemanasDias(diasTotales) {
    const semanas = Math.floor(diasTotales / 7);
    const dias = diasTotales % 7;
    const partes = [];
    if (semanas) partes.push(`${semanas} ${semanas === 1 ? "semana" : "semanas"}`);
    if (dias || !partes.length) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
    return partes.join(" y ");
}

function formatearDuracion(inicio, fin) {
    if (fin < inicio) return "0 días";
    let anios = fin.getUTCFullYear() - inicio.getUTCFullYear();
    let cursor = sumarPeriodo(inicio, anios, 0);
    if (cursor > fin) {
        anios--;
        cursor = sumarPeriodo(inicio, anios, 0);
    }
    let meses = 0;
    while (meses < 11 && sumarPeriodo(cursor, 0, meses + 1) <= fin) meses++;
    cursor = sumarPeriodo(cursor, 0, meses);
    const dias = diferenciaDias(cursor, fin);
    const partes = [];
    if (anios) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
    if (meses) partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
    if (dias || !partes.length) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
    return unirPartes(partes);
}

function sumarPeriodo(fecha, anios, meses) {
    const totalMeses = fecha.getUTCMonth() + meses + (anios * 12);
    const anioDestino = fecha.getUTCFullYear() + Math.floor(totalMeses / 12);
    const mesDestino = ((totalMeses % 12) + 12) % 12;
    const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino + 1, 0)).getUTCDate();
    return new Date(Date.UTC(anioDestino, mesDestino, Math.min(fecha.getUTCDate(), ultimoDia)));
}

function unirPartes(partes) {
    if (partes.length < 2) return partes[0];
    return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

function registrarCalculo() {
    if (typeof window.gtag === "function") {
        window.gtag("event", "calculo_edad_corregida", { tool_name: "edad_corregida" });
    }
}
