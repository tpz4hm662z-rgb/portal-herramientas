/* Lógica específica: Calculadora de percentiles infantiles OMS */
"use strict";

const formulario = $("#formularioPercentiles");
const resultados = $("#resultados");
const botonReiniciar = $("#botonReiniciar");
const avisoErrores = $("#avisoErrores");

const campos = {
    sexo: $("#sexo"),
    edad: $("#edad"),
    peso: $("#peso"),
    talla: $("#talla")
};

formulario.addEventListener("submit", calcularPercentiles);
botonReiniciar.addEventListener("click", reiniciar);

Object.values(campos).forEach((campo) => {
    campo.addEventListener("input", () => limpiarError(campo));
    campo.addEventListener("change", () => limpiarError(campo));
});

function validar() {
    Object.values(campos).forEach(limpiarError);

    const valores = {
        sexo: campos.sexo.value,
        edad: convertirNumero(campos.edad.value),
        peso: convertirNumero(campos.peso.value),
        talla: convertirNumero(campos.talla.value)
    };
    const errores = {};

    if (!["nina", "nino"].includes(valores.sexo)) errores.sexo = "Selecciona si es niña o niño.";
    if (campos.edad.value === "") errores.edad = "Introduce la edad en meses.";
    else if (!Number.isInteger(valores.edad) || valores.edad < CONFIG.campos.edad.minimo || valores.edad > CONFIG.campos.edad.maximo) errores.edad = "La edad debe ser un número entero entre 0 y 60 meses.";
    if (campos.peso.value === "") errores.peso = "Introduce el peso.";
    else if (valores.peso === null || valores.peso < CONFIG.campos.peso.minimo || valores.peso > CONFIG.campos.peso.maximo) errores.peso = "Introduce un peso válido entre 1 y 40 kg.";
    if (campos.talla.value === "") errores.talla = "Introduce la talla o longitud.";
    else if (valores.talla === null || valores.talla < CONFIG.campos.talla.minimo || valores.talla > CONFIG.campos.talla.maximo) errores.talla = "Introduce una talla válida entre 30 y 130 cm.";

    Object.entries(errores).forEach(([nombre, mensaje]) => mostrarError(campos[nombre], mensaje));
    return { valido: Object.keys(errores).length === 0, valores, errores };
}

function mostrarError(campo, mensaje) {
    const error = $(`#error${campo.id[0].toUpperCase()}${campo.id.slice(1)}`);
    campo.setAttribute("aria-invalid", "true");
    error.textContent = mensaje;
}

function limpiarError(campo) {
    const error = $(`#error${campo.id[0].toUpperCase()}${campo.id.slice(1)}`);
    campo.removeAttribute("aria-invalid");
    error.textContent = "";
    avisoErrores.classList.add("oculto");
}

function calcularPercentiles(evento) {
    evento.preventDefault();
    const validacion = validar();
    if (!validacion.valido) {
        avisoErrores.textContent = "Revisa los campos indicados antes de calcular.";
        avisoErrores.classList.remove("oculto");
        campos[Object.keys(validacion.errores)[0]].focus();
        return;
    }

    const { sexo, edad, peso, talla } = validacion.valores;
    const parametrosPeso = DATOS_OMS.pesoEdad[sexo][edad];
    const parametrosTalla = DATOS_OMS.tallaEdad[sexo][edad];
    const zPeso = calcularZLms(peso, parametrosPeso);
    const zTalla = calcularZLms(talla, parametrosTalla);
    const limitesPeso = CONFIG.limitesOms.pesoEdad;
    const limitesTalla = CONFIG.limitesOms.tallaEdad;

    if (zPeso < limitesPeso.minimo || zPeso > limitesPeso.maximo || zTalla < limitesTalla.minimo || zTalla > limitesTalla.maximo) {
        if (zPeso < limitesPeso.minimo || zPeso > limitesPeso.maximo) mostrarError(campos.peso, "El peso no parece compatible con la edad. Revisa la medición.");
        if (zTalla < limitesTalla.minimo || zTalla > limitesTalla.maximo) mostrarError(campos.talla, "La talla no parece compatible con la edad. Revisa la medición.");
        avisoErrores.textContent = "Hay una medición fuera de los límites de comprobación de la OMS. Revisa los datos.";
        avisoErrores.classList.remove("oculto");
        (zPeso < limitesPeso.minimo || zPeso > limitesPeso.maximo ? campos.peso : campos.talla).focus();
        return;
    }

    const percentilPeso = normalAcumulada(zPeso) * 100;
    const percentilTalla = normalAcumulada(zTalla) * 100;
    const imc = peso / ((talla / 100) ** 2);

    pintarPercentil("Peso", percentilPeso);
    pintarPercentil("Talla", percentilTalla);
    $("#valorImc").textContent = formatoNumero(imc, 1);
    $("#resumenResultado").textContent =
        `Referencia OMS para ${sexo === "nina" ? "una niña" : "un niño"} de ${edad} ${edad === 1 ? "mes" : "meses"}.`;
    resultados.classList.remove("oculto");
    botonReiniciar.classList.remove("oculto");
    resultados.setAttribute("tabindex", "-1");
    resultados.focus({ preventScroll: true });
    resultados.scrollIntoView({ behavior: movimientoReducido() ? "auto" : "smooth", block: "start" });
}

function pintarPercentil(tipo, valor) {
    const id = tipo === "Peso" ? "Peso" : "Talla";
    const etiqueta = etiquetaPercentil(valor);
    $(`#percentil${id}`).textContent = etiqueta;
    $(`#explicacion${id}`).textContent =
        `Aproximadamente el ${formatoNumero(valor, valor < 1 || valor > 99 ? 1 : 0)} % de la referencia OMS tiene un ${tipo.toLowerCase()} igual o menor.`;
    $(`#barra${id}`).style.left = `${valor}%`;
}

function etiquetaPercentil(valor) {
    if (valor <= 0.1) return "< P0,1";
    if (valor >= 99.9) return "> P99,9";
    return `P${formatoNumero(valor, valor < 3 || valor > 97 ? 1 : 0)}`;
}

function reiniciar() {
    formulario.reset();
    Object.values(campos).forEach(limpiarError);
    resultados.classList.add("oculto");
    botonReiniciar.classList.add("oculto");
    campos.sexo.focus();
}
