"use strict";

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        CONFIG.comportamiento.scrollSuave = false;
    }
    const formulario = $(CONFIG.selectores.formulario);
    formulario.addEventListener("submit", procesarFormulario);
    formulario.addEventListener("input", marcarResultadosDesactualizados);
    $("#botonReiniciar").addEventListener("click", reiniciarCalculadora);
    $("#medicion").addEventListener("change", actualizarCampoMedicion);
    $("#unidadEdad").addEventListener("change", () => {
        actualizarLimiteEdad();
        actualizarPosturaSugerida();
    });
    $("#edad").addEventListener("input", actualizarPosturaSugerida);
    ["#edad", "#valor"].forEach(selector => $(selector).addEventListener("input", () => limpiarError(selector === "#edad" ? "#errorEdad" : "#errorValor")));
    actualizarCampoMedicion();
    actualizarLimiteEdad();
    actualizarPosturaSugerida();
}

function actualizarCampoMedicion() {
    const tipo = $("#medicion").value;
    const esPeso = tipo === "peso";
    $("#unidadValor").textContent = esPeso ? "kg" : "cm";
    $("#valor").placeholder = esPeso ? "Ejemplo: 7,5" : tipo === "talla" ? "Ejemplo: 68" : "Ejemplo: 42";
    $("#ayudaValor").textContent = esPeso ? "Introduce el peso en kilogramos." : tipo === "talla" ? "Introduce la longitud o talla en centímetros." : "Introduce el contorno máximo de la cabeza en centímetros.";
    if (tipo === "talla") {
        mostrarElemento($("#opcionPostura"));
        actualizarPosturaSugerida();
    } else {
        ocultarElemento($("#opcionPostura"));
    }
    limpiarError("#errorValor");
}

function actualizarLimiteEdad() {
    const limites = { dias: 1826, semanas: 260.8, meses: 60, anos: 5 };
    $("#edad").max = String(limites[$("#unidadEdad").value]);
}

function actualizarPosturaSugerida() {
    const edad = convertirANumero($("#edad").value);
    if (edad === null) return;
    const dias = Math.ceil(convertirEdadADias(edad, $("#unidadEdad").value));
    $("#postura").value = dias < 731 ? "longitud" : "altura";
}

function marcarResultadosDesactualizados() {
    if (!elementoEstaOculto($("#resultados"))) {
        ocultarResultados();
        $("#estadoFormulario").textContent = "Los datos han cambiado. Vuelve a calcular para actualizar el resultado.";
    }
}

function procesarFormulario(evento) {
    evento.preventDefault();
    limpiarTodosLosErrores();
    establecerEstadoCalculando(true);

    try {
        const datos = recogerYValidar();
        if (!datos) return;
        const resultado = calcularPercentil(datos);
        if (!resultado) return;
        pintarResultado(resultado);
        mostrarResultados();
        $("#estadoFormulario").textContent = `Percentil ${resultado.percentilTexto} calculado correctamente.`;
    } finally {
        establecerEstadoCalculando(false);
    }
}

function recogerYValidar() {
    const edad = convertirANumero($("#edad").value);
    const valor = convertirANumero($("#valor").value);
    const unidadEdad = $("#unidadEdad").value;
    const medicion = $("#medicion").value;
    const sexoSeleccionado = $('input[name="sexo"]:checked');
    const postura = $("#postura").value;
    const unidadesValidas = ["dias", "semanas", "meses", "anos"];
    const medicionesValidas = ["peso", "talla", "perimetro"];
    let valido = true;

    if (!sexoSeleccionado || !["nino", "nina"].includes(sexoSeleccionado.value)) {
        mostrarError("#errorSexo", "Selecciona el sexo.");
        valido = false;
    }

    if (!unidadesValidas.includes(unidadEdad)) {
        mostrarError("#errorEdad", "Selecciona una unidad de edad válida.");
        valido = false;
    }

    if (!medicionesValidas.includes(medicion)) {
        mostrarError("#errorMedicion", "Selecciona un tipo de medición válido.");
        valido = false;
    }

    if (medicion === "talla" && !["longitud", "altura"].includes(postura)) {
        mostrarError("#errorPostura", "Selecciona cómo se realizó la medición.");
        valido = false;
    }

    if (edad === null) {
        mostrarError("#errorEdad", "Introduce la edad del bebé.");
        valido = false;
    } else if (edad < 0) {
        mostrarError("#errorEdad", "La edad no puede ser negativa.");
        valido = false;
    }

    const diasExactos = edad === null || !unidadesValidas.includes(unidadEdad) ? null : convertirEdadADias(edad, unidadEdad);
    if (diasExactos !== null && diasExactos > 1826) {
        mostrarError("#errorEdad", "Esta referencia cubre desde el nacimiento hasta los 5 años.");
        valido = false;
    }

    if (valor === null) {
        mostrarError("#errorValor", "Introduce el valor medido.");
        valido = false;
    } else if (valor <= 0) {
        mostrarError("#errorValor", "El valor debe ser mayor que cero.");
        valido = false;
    }

    const rangosFisicos = { peso: [0.3, 40], talla: [30, 130], perimetro: [20, 65] };
    const rangoFisico = rangosFisicos[medicion];
    if (valor !== null && rangoFisico && (valor < rangoFisico[0] || valor > rangoFisico[1])) {
        const unidad = medicion === "peso" ? "kg" : "cm";
        mostrarError("#errorValor", `Revisa la medición: debe estar entre ${rangoFisico[0]} y ${rangoFisico[1]} ${unidad}.`);
        valido = false;
    }

    if (!valido) {
        const primerError = $(".campo-invalido");
        if (primerError) primerError.focus();
        $("#estadoFormulario").textContent = "Hay errores en el formulario.";
        return null;
    }

    return {
        sexo: sexoSeleccionado.value,
        edadOriginal: edad,
        unidadEdad,
        diasExactos,
        dias: Math.ceil(diasExactos),
        medicion,
        valor,
        postura
    };
}

function convertirEdadADias(edad, unidad) {
    const factores = { dias: 1, semanas: 7, meses: 30.4375, anos: 365.25 };
    const dias = edad * factores[unidad];
    const esLimiteSuperior = (unidad === "anos" && edad === 5) || (unidad === "meses" && edad === 60);
    return esLimiteSuperior ? 1826 : dias;
}

function calcularPercentil(datos) {
    const tabla = WHO_GROWTH_DATA.tablas[datos.medicion][datos.sexo];
    const diaInferior = Math.floor(datos.diasExactos);
    const diaSuperior = Math.ceil(datos.diasExactos);
    const filaInferior = tabla[diaInferior];
    const filaSuperior = tabla[diaSuperior];
    if (!filaInferior || !filaSuperior) {
        mostrarError("#errorEdad", "No hay una referencia OMS disponible para esa edad.");
        return null;
    }
    const fraccion = datos.diasExactos - diaInferior;
    const interpolar = indice => filaInferior[indice] + (filaSuperior[indice] - filaInferior[indice]) * fraccion;

    let valorAjustado = datos.valor;
    let ajustePostura = "";
    if (datos.medicion === "talla") {
        const referenciaPrincipal = datos.dias < 731 ? "longitud" : "altura";
        valorAjustado = ajustarTallaPorPostura(datos.valor, datos.postura, referenciaPrincipal);
        if (referenciaPrincipal === "longitud" && datos.postura === "altura") {
            ajustePostura = " Se añadieron 0,7 cm conforme al ajuste OMS por medición de pie antes de los 2 años.";
        } else if (referenciaPrincipal === "altura" && datos.postura === "longitud") {
            ajustePostura = " Se restaron 0,7 cm conforme al ajuste OMS por medición tumbado desde los 2 años.";
        }
    }

    const l = interpolar(1);
    const m = interpolar(2);
    const s = interpolar(3);
    let z;

    /*
       Entre los días 730 y 731 la tabla de talla cambia de longitud
       tumbado a altura de pie. Se interpolan las puntuaciones Z tras
       estandarizar la medida en cada lado para no mezclar ambas escalas.
    */
    if (datos.medicion === "talla" && diaInferior === 730 && diaSuperior === 731) {
        const valorComoLongitud = ajustarTallaPorPostura(datos.valor, datos.postura, "longitud");
        const valorComoAltura = ajustarTallaPorPostura(datos.valor, datos.postura, "altura");
        const zLongitud = calcularZLMS(valorComoLongitud, filaInferior[1], filaInferior[2], filaInferior[3]);
        const zAltura = calcularZLMS(valorComoAltura, filaSuperior[1], filaSuperior[2], filaSuperior[3]);
        z = zLongitud + (zAltura - zLongitud) * fraccion;
    } else {
        z = calcularZLMS(valorAjustado, l, m, s);
    }

    if (datos.medicion === "peso") z = ajustarZExtremo(z, valorAjustado, l, m, s);

    const limitesZ = { peso: [-6, 5], talla: [-6, 6], perimetro: [-5, 5] };
    if (z < limitesZ[datos.medicion][0] || z > limitesZ[datos.medicion][1]) {
        mostrarError("#errorValor", "El valor queda fuera de los límites de plausibilidad de la OMS. Comprueba la edad, la unidad y la medición.");
        $("#valor").focus();
        return null;
    }

    const percentil = limitarNumero(distribucionNormal(z) * 100, 0.1, 99.9);
    return { ...datos, valorAjustado, ajustePostura, z, percentil, percentilTexto: formatearPercentil(percentil) };
}

function ajustarTallaPorPostura(valor, postura, referencia) {
    if (referencia === "longitud" && postura === "altura") return valor + 0.7;
    if (referencia === "altura" && postura === "longitud") return valor - 0.7;
    return valor;
}

function calcularZLMS(valor, l, m, s) {
    return (Math.pow(valor / m, l) - 1) / (s * l);
}

function ajustarZExtremo(z, valor, l, m, s) {
    const valorEnZ = desviacion => m * Math.pow(1 + l * s * desviacion, 1 / l);
    if (z > 3) return 3 + (valor - valorEnZ(3)) / (valorEnZ(3) - valorEnZ(2));
    if (z < -3) return -3 + (valor - valorEnZ(-3)) / (valorEnZ(-2) - valorEnZ(-3));
    return z;
}

function distribucionNormal(z) {
    const signo = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * x);
    const erf = signo * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
    return 0.5 * (1 + erf);
}

function formatearPercentil(percentil) {
    if (percentil < 1 || percentil > 99) return percentil.toLocaleString("es-ES", { maximumFractionDigits: 1 });
    return Math.round(percentil).toString();
}

function pintarResultado(resultado) {
    const nombres = { peso: "Peso por edad", talla: "Longitud/talla por edad", perimetro: "Perímetro craneal por edad" };
    const unidades = { dias: "días", semanas: "semanas", meses: "meses", anos: "años" };
    const unidadValor = resultado.medicion === "peso" ? "kg" : "cm";
    const interpretacion = obtenerInterpretacion(resultado.percentil);

    $("#resultadoPrincipal").textContent = `P${resultado.percentilTexto}`;
    $("#descripcionResultadoPrincipal").textContent = interpretacion.titulo;
    $("#resumenResultado").textContent = `${nombres[resultado.medicion]} para ${resultado.sexo === "nino" ? "niño" : "niña"} de ${formatearNumeroSimple(resultado.edadOriginal)} ${unidades[resultado.unidadEdad]}.`;
    $("#resultadoValor").textContent = `${formatearNumeroSimple(resultado.valor)} ${unidadValor}`;
    $("#resultadoMedicion").textContent = nombres[resultado.medicion];
    $("#resultadoEdad").textContent = `${formatearNumeroSimple(resultado.diasExactos)} días`;
    $("#resultadoZ").textContent = resultado.z.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $("#interpretacionResultado").textContent = interpretacion.mensaje + resultado.ajustePostura;
    $("#etiquetaIndicador").textContent = `P${resultado.percentilTexto}`;
    $("#indicadorPercentil").style.left = `${resultado.percentil}%`;
    $("#descripcionBarra").textContent = `El indicador está situado en el percentil ${resultado.percentilTexto} de una escala de 0 a 100.`;
    pintarRecomendaciones([
        "Valora la evolución en varias revisiones, no una medición aislada.",
        "Comprueba que la técnica y el instrumento de medición sean adecuados.",
        "Comenta el resultado con el pediatra, especialmente si cambia la trayectoria habitual."
    ]);
}

function obtenerInterpretacion(p) {
    if (p < 3) return { titulo: "Muy por debajo de la media estadística", mensaje: "La medición se sitúa por debajo de P3 en la referencia. Esto no constituye un diagnóstico; conviene revisarla y comentarla con el pediatra dentro del contexto global del crecimiento." };
    if (p < 15) return { titulo: "Inferior a la media estadística", mensaje: "La medición está por debajo de la zona central de la referencia. Puede ser compatible con un patrón individual normal; la evolución y el contexto clínico son esenciales." };
    if (p <= 85) return { titulo: "Dentro de la zona central de la referencia", mensaje: "La medición se encuentra dentro del intervalo central de la referencia OMS. Aun así, el seguimiento de la trayectoria es más informativo que un resultado aislado." };
    if (p <= 97) return { titulo: "Superior a la media estadística", mensaje: "La medición está por encima de la zona central de la referencia. Un percentil alto, por sí solo, no indica un problema de salud." };
    return { titulo: "Muy superior a la media estadística", mensaje: "La medición se sitúa por encima de P97 en la referencia. Esto no constituye un diagnóstico; el pediatra puede interpretarla junto con otras medidas y la evolución." };
}

function formatearNumeroSimple(numero) {
    return numero.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

function reiniciarCalculadora() {
    reiniciarHerramientaBase();
    actualizarCampoMedicion();
    actualizarLimiteEdad();
    $("#estadoFormulario").textContent = "";
}
