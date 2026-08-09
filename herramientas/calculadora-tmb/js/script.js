/* =====================================================
   Herramientas360
   Calculadora TMB
   Versión 1.0
   © 2026 José Carlos Núñez Florido
===================================================== */

"use strict";

/* =====================================================
   ELEMENTOS DEL FORMULARIO
===================================================== */

const formulario = document.getElementById("formularioTmb");

const campoSexo = document.getElementById("sexo");
const campoEdad = document.getElementById("edad");
const campoPeso = document.getElementById("peso");
const campoAltura = document.getElementById("altura");
const campoActividad = document.getElementById("actividad");

const botonCalcular = document.getElementById("calcular");
const botonReiniciar = document.getElementById("reiniciar");

/* =====================================================
   ELEMENTOS DE RESULTADOS
===================================================== */

const seccionResultado = document.getElementById("resultado");

const tmbResultado = document.getElementById("tmbResultado");
const mantenimientoResultado = document.getElementById(
    "mantenimientoResultado"
);
const perderResultado = document.getElementById("perderResultado");
const ganarResultado = document.getElementById("ganarResultado");

const resumenResultado = document.getElementById("resumenResultado");
const interpretacionResultado = document.getElementById(
    "interpretacionResultado"
);

/* =====================================================
   MENSAJES DE ERROR
===================================================== */

const errorSexo = document.getElementById("errorSexo");
const errorEdad = document.getElementById("errorEdad");
const errorPeso = document.getElementById("errorPeso");
const errorAltura = document.getElementById("errorAltura");
const errorActividad = document.getElementById("errorActividad");

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const CONFIG = {
    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-tmb/"
    }
};

const LIMITES = {
    edad: {
        minimo: 14,
        maximo: 100
    },

    peso: {
        minimo: 35,
        maximo: 300
    },

    altura: {
        minimo: 120,
        maximo: 230
    }
};

/* =====================================================
   EVENTOS
===================================================== */

formulario.addEventListener("submit", calcularTmb);

botonReiniciar.addEventListener("click", reiniciarCalculadora);

campoSexo.addEventListener("change", () => {
    limpiarError(campoSexo, errorSexo);
});

campoEdad.addEventListener("input", () => {
    limpiarError(campoEdad, errorEdad);
});

campoPeso.addEventListener("input", () => {
    limpiarError(campoPeso, errorPeso);
});

campoAltura.addEventListener("input", () => {
    limpiarError(campoAltura, errorAltura);
});

campoActividad.addEventListener("change", () => {
    limpiarError(campoActividad, errorActividad);
});

/* =====================================================
   FUNCIÓN PRINCIPAL
===================================================== */

function calcularTmb(evento) {

    evento.preventDefault();

    limpiarTodosLosErrores();

    const sexo = campoSexo.value;

    const edad = convertirNumero(campoEdad.value);

    const peso = convertirNumero(campoPeso.value);

    const altura = convertirNumero(campoAltura.value);

    const actividad = convertirNumero(campoActividad.value);

    const formularioValido = validarFormulario({
        sexo,
        edad,
        peso,
        altura,
        actividad
    });

    if (!formularioValido) {
        enfocarPrimerCampoConError();
        return;
    }

    const tmb = obtenerTmb({
        sexo,
        edad,
        peso,
        altura
    });

    const mantenimiento = tmb * actividad;

    const caloriasPerder = obtenerCaloriasParaPerder(mantenimiento);

    const caloriasGanar = mantenimiento + 300;

    mostrarResultados({
        sexo,
        edad,
        tmb,
        mantenimiento,
        caloriasPerder,
        caloriasGanar,
        actividad
    });
}

/* =====================================================
   CÁLCULO DE LA TMB
===================================================== */

function obtenerTmb(datos) {

    const { sexo, edad, peso, altura } = datos;

    let tmb;

    if (sexo === "hombre") {

        tmb =
            (10 * peso) +
            (6.25 * altura) -
            (5 * edad) +
            5;

    } else {

        tmb =
            (10 * peso) +
            (6.25 * altura) -
            (5 * edad) -
            161;
    }

    return tmb;
}

/* =====================================================
   OBJETIVOS CALÓRICOS
===================================================== */

function obtenerCaloriasParaPerder(mantenimiento) {

    const deficitModerado = mantenimiento - 500;

    const limiteOrientativo = mantenimiento * 0.75;

    return Math.max(deficitModerado, limiteOrientativo);
}

/* =====================================================
   MOSTRAR RESULTADOS
===================================================== */

function mostrarResultados(datos) {

    const {
        sexo,
        edad,
        tmb,
        mantenimiento,
        caloriasPerder,
        caloriasGanar,
        actividad
    } = datos;

    const tmbRedondeada = Math.round(tmb);

    const mantenimientoRedondeado = Math.round(mantenimiento);

    const perderRedondeado = Math.round(caloriasPerder);

    const ganarRedondeado = Math.round(caloriasGanar);

    tmbResultado.textContent = formatearNumero(tmbRedondeada);

    mantenimientoResultado.textContent =
        formatearNumero(mantenimientoRedondeado);

    perderResultado.textContent =
        formatearNumero(perderRedondeado);

    ganarResultado.textContent =
        formatearNumero(ganarRedondeado);

    resumenResultado.textContent =
        crearResumenResultado({
            sexo,
            edad,
            mantenimiento: mantenimientoRedondeado
        });

    interpretacionResultado.textContent =
        crearInterpretacion({
            mantenimiento: mantenimientoRedondeado,
            perder: perderRedondeado,
            ganar: ganarRedondeado,
            actividad
        });

    seccionResultado.classList.remove("oculto");

    botonReiniciar.classList.remove("oculto");

    botonCalcular.textContent = "Actualizar resultados";

    desplazarAResultados();
}

/* =====================================================
   RESUMEN PERSONALIZADO
===================================================== */

function crearResumenResultado(datos) {

    const {
        sexo,
        edad,
        mantenimiento
    } = datos;

    const descripcionSexo =
        sexo === "hombre"
            ? "un hombre"
            : "una mujer";

    return (
        `Según los datos introducidos, para ${descripcionSexo} de ` +
        `${edad} años se estima un gasto aproximado de ` +
        `${formatearNumero(mantenimiento)} kcal al día para mantener el peso actual.`
    );
}

/* =====================================================
   INTERPRETACIÓN PERSONALIZADA
===================================================== */

function crearInterpretacion(datos) {

    const {
        mantenimiento,
        perder,
        ganar,
        actividad
    } = datos;

    const nivelActividad = obtenerTextoActividad(actividad);

    return (
        `Con un nivel de actividad ${nivelActividad}, tu gasto energético ` +
        `diario estimado es de ${formatearNumero(mantenimiento)} kcal. ` +
        `Para perder grasa de forma gradual, la referencia orientativa sería ` +
        `aproximadamente ${formatearNumero(perder)} kcal al día. ` +
        `Para favorecer una ganancia de masa muscular, podrías partir de unas ` +
        `${formatearNumero(ganar)} kcal diarias. Estas cifras son estimaciones ` +
        `y deben ajustarse según tu evolución, composición corporal y estado de salud.`
    );
}

/* =====================================================
   TEXTO DEL NIVEL DE ACTIVIDAD
===================================================== */

function obtenerTextoActividad(valorActividad) {

    const niveles = {
        1.2: "sedentario",
        1.375: "ligero",
        1.55: "moderado",
        1.725: "intenso",
        1.9: "muy intenso"
    };

    return niveles[valorActividad] || "seleccionado";
}

/* =====================================================
   VALIDACIÓN DEL FORMULARIO
===================================================== */

function validarFormulario(datos) {

    const {
        sexo,
        edad,
        peso,
        altura,
        actividad
    } = datos;

    let formularioValido = true;

    if (!sexo) {

        mostrarError(
            campoSexo,
            errorSexo,
            "Selecciona tu sexo."
        );

        formularioValido = false;
    }

    if (!Number.isFinite(edad)) {

        mostrarError(
            campoEdad,
            errorEdad,
            "Introduce tu edad."
        );

        formularioValido = false;

    } else if (
        edad < LIMITES.edad.minimo ||
        edad > LIMITES.edad.maximo
    ) {

        mostrarError(
            campoEdad,
            errorEdad,
            `La edad debe estar entre ${LIMITES.edad.minimo} y ${LIMITES.edad.maximo} años.`
        );

        formularioValido = false;
    }

    if (!Number.isFinite(peso)) {

        mostrarError(
            campoPeso,
            errorPeso,
            "Introduce tu peso."
        );

        formularioValido = false;

    } else if (
        peso < LIMITES.peso.minimo ||
        peso > LIMITES.peso.maximo
    ) {

        mostrarError(
            campoPeso,
            errorPeso,
            `El peso debe estar entre ${LIMITES.peso.minimo} y ${LIMITES.peso.maximo} kg.`
        );

        formularioValido = false;
    }

    if (!Number.isFinite(altura)) {

        mostrarError(
            campoAltura,
            errorAltura,
            "Introduce tu altura."
        );

        formularioValido = false;

    } else if (
        altura < LIMITES.altura.minimo ||
        altura > LIMITES.altura.maximo
    ) {

        mostrarError(
            campoAltura,
            errorAltura,
            `La altura debe estar entre ${LIMITES.altura.minimo} y ${LIMITES.altura.maximo} cm.`
        );

        formularioValido = false;
    }

    if (!Number.isFinite(actividad)) {

        mostrarError(
            campoActividad,
            errorActividad,
            "Selecciona tu nivel de actividad."
        );

        formularioValido = false;
    }

    return formularioValido;
}

/* =====================================================
   GESTIÓN DE ERRORES
===================================================== */

function mostrarError(campo, elementoError, mensaje) {

    const contenedorCampo = campo.closest(".campo");

    if (contenedorCampo) {
        contenedorCampo.classList.add("campo-error");
    }

    elementoError.textContent = mensaje;

    campo.setAttribute("aria-invalid", "true");
}

function limpiarError(campo, elementoError) {

    const contenedorCampo = campo.closest(".campo");

    if (contenedorCampo) {
        contenedorCampo.classList.remove("campo-error");
    }

    elementoError.textContent = "";

    campo.removeAttribute("aria-invalid");
}

function limpiarTodosLosErrores() {

    limpiarError(campoSexo, errorSexo);

    limpiarError(campoEdad, errorEdad);

    limpiarError(campoPeso, errorPeso);

    limpiarError(campoAltura, errorAltura);

    limpiarError(campoActividad, errorActividad);
}

function enfocarPrimerCampoConError() {

    const primerCampoConError =
        formulario.querySelector('[aria-invalid="true"]');

    if (primerCampoConError) {
        primerCampoConError.focus();
    }
}

/* =====================================================
   REINICIAR CALCULADORA
===================================================== */

function reiniciarCalculadora() {

    formulario.reset();

    limpiarTodosLosErrores();

    seccionResultado.classList.add("oculto");

    botonReiniciar.classList.add("oculto");

    botonCalcular.textContent = "Calcular mi TMB";

    tmbResultado.textContent = "0";

    mantenimientoResultado.textContent = "0";

    perderResultado.textContent = "0";

    ganarResultado.textContent = "0";

    resumenResultado.textContent = "";

    interpretacionResultado.textContent = "";

    campoSexo.focus();

    desplazarAFormulario();
}

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

function convertirNumero(valor) {

    if (valor === "") {
        return NaN;
    }

    const valorNormalizado =
        String(valor).replace(",", ".");

    return Number(valorNormalizado);
}

function formatearNumero(numero) {

    return new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 0
    }).format(numero);
}

function desplazarAResultados() {

    window.setTimeout(() => {

        seccionResultado.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 120);
}

function desplazarAFormulario() {

    window.setTimeout(() => {

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }, 100);
}
