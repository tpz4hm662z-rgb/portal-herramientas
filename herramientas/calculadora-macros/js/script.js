
/* ==========================================================
   IMOANCY
   Calculadora de Macronutrientes
   SCRIPT.JS
   Versión 1.0
   © 2026 José Carlos Núñez Florido
========================================================== */
 
"use strict";
 
 
/* ==========================================================
   SELECTORES PRINCIPALES
========================================================== */
 
const formulario = $("#formularioHerramienta");
 
const campoSexo = $("#sexo");
const campoEdad = $("#edad");
const campoPeso = $("#peso");
const campoAltura = $("#altura");
const campoActividad = $("#actividad");
const campoObjetivo = $("#objetivo");
 
const botonCalcular = $("#botonCalcular");
const botonReiniciar = $("#botonReiniciar");
 
const seccionResultados = $("#resultados");
 
const camposFormulario = [
    campoSexo,
    campoEdad,
    campoPeso,
    campoAltura,
    campoActividad,
    campoObjetivo
];
 
 
/* ==========================================================
   INICIALIZACIÓN
========================================================== */
 
document.addEventListener("DOMContentLoaded", inicializarHerramienta);
 
 
/**
 * Prepara los eventos y el estado inicial de la calculadora.
 */
function inicializarHerramienta() {
 
    if (!formulario) {
 
        console.error(
            "Imoancy: no se encontró el formulario #formularioHerramienta."
        );
 
        return;
 
    }
 
    formulario.addEventListener("submit", manejarEnvioFormulario);
    botonReiniciar.addEventListener("click", reiniciarHerramienta);
 
    camposFormulario.forEach((campo) => {
 
        campo.addEventListener("input", () => limpiarErrorCampo(campo));
        campo.addEventListener("change", () => limpiarErrorCampo(campo));
 
    });
 
}
 
 
/* ==========================================================
   EVENTOS
========================================================== */
 
/**
 * Gestiona el envío del formulario.
 *
 * @param {SubmitEvent} evento
 */
function manejarEnvioFormulario(evento) {
 
    evento.preventDefault();
 
    limpiarErrores();
 
    const datos = obtenerDatosFormulario();
 
    if (!validarFormulario(datos)) {
 
        enfocarPrimerCampoConError();
 
        return;
 
    }
 
    const resultados = calcularResultados(datos);
 
    renderizarResultados(resultados);
    registrarCalculoAnalytics(resultados.datos.objetivo);
 
}
 
 
/* ==========================================================
   OBTENER DATOS
========================================================== */
 
/**
 * Obtiene y normaliza los datos introducidos por el usuario.
 *
 * @returns {{
 *   sexo: string,
 *   edad: number,
 *   peso: number,
 *   altura: number,
 *   actividad: number,
 *   objetivo: string
 * }}
 */
function obtenerDatosFormulario() {
 
    return {
 
        sexo: obtenerTexto("sexo").trim(),
 
        edad: obtenerValor("edad"),
 
        peso: obtenerValor("peso"),
 
        altura: obtenerValor("altura"),
 
        actividad: obtenerValor("actividad"),
 
        objetivo: obtenerTexto("objetivo").trim()
 
    };
 
}
 
 
/* ==========================================================
   VALIDACIÓN
========================================================== */
 
/**
 * Valida todos los datos del formulario.
 *
 * @param {Object} datos
 * @returns {boolean}
 */
function validarFormulario(datos) {
 
    let formularioValido = true;
 
    if (!["hombre", "mujer"].includes(datos.sexo)) {
 
        mostrarErrorCampo(
            campoSexo,
            "errorSexo",
            "Selecciona tu sexo."
        );
 
        formularioValido = false;
 
    }
 
    if (
        !Number.isFinite(datos.edad) ||
        !Number.isInteger(datos.edad) ||
        !dentroDeRango(
            datos.edad,
            CONFIG.general.edadMin,
            CONFIG.general.edadMax
        )
    ) {
 
        mostrarErrorCampo(
            campoEdad,
            "errorEdad",
            `Introduce una edad válida entre ${CONFIG.general.edadMin} y ${CONFIG.general.edadMax} años.`
        );
 
        formularioValido = false;
 
    }
 
    if (
        !Number.isFinite(datos.peso) ||
        !dentroDeRango(
            datos.peso,
            CONFIG.general.pesoMin,
            CONFIG.general.pesoMax
        )
    ) {
 
        mostrarErrorCampo(
            campoPeso,
            "errorPeso",
            `Introduce un peso válido entre ${CONFIG.general.pesoMin} y ${CONFIG.general.pesoMax} kg.`
        );
 
        formularioValido = false;
 
    }
 
    if (
        !Number.isFinite(datos.altura) ||
        !dentroDeRango(
            datos.altura,
            CONFIG.general.alturaMin,
            CONFIG.general.alturaMax
        )
    ) {
 
        mostrarErrorCampo(
            campoAltura,
            "errorAltura",
            `Introduce una altura válida entre ${CONFIG.general.alturaMin} y ${CONFIG.general.alturaMax} cm.`
        );
 
        formularioValido = false;
 
    }
 
    if (!actividadValida(datos.actividad)) {
 
        mostrarErrorCampo(
            campoActividad,
            "errorActividad",
            "Selecciona un nivel de actividad física."
        );
 
        formularioValido = false;
 
    }
 
    if (!Object.prototype.hasOwnProperty.call(CONFIG.objetivos, datos.objetivo)) {
 
        mostrarErrorCampo(
            campoObjetivo,
            "errorObjetivo",
            "Selecciona tu objetivo."
        );
 
        formularioValido = false;
 
    }
 
    return formularioValido;
 
}
 
 
/**
 * Comprueba que el factor de actividad pertenece a la configuración.
 *
 * @param {number} actividad
 * @returns {boolean}
 */
function actividadValida(actividad) {
 
    const factoresValidos = Object.values(CONFIG.actividad);
 
    return factoresValidos.some(
        (factor) => Math.abs(factor - actividad) < 0.0001
    );
 
}
 
 
/**
 * Muestra un mensaje de error asociado a un campo.
 *
 * @param {HTMLElement} campo
 * @param {string} idError
 * @param {string} mensaje
 */
function mostrarErrorCampo(campo, idError, mensaje) {
 
    const elementoError = $("#" + idError);
 
    if (elementoError) {
 
        elementoError.textContent = mensaje;
 
    }
 
    campo.classList.add("campo-invalido");
    campo.setAttribute("aria-invalid", "true");
 
}
 
 
/**
 * Limpia el error de un campo concreto.
 *
 * @param {HTMLElement} campo
 */
function limpiarErrorCampo(campo) {
 
    const idError = obtenerIdErrorCampo(campo.id);
 
    if (idError) {
 
        const elementoError = $("#" + idError);
 
        if (elementoError) {
 
            elementoError.textContent = "";
 
        }
 
    }
 
    campo.classList.remove("campo-invalido");
    campo.removeAttribute("aria-invalid");
 
}
 
 
/**
 * Limpia todos los errores del formulario.
 */
function limpiarErrores() {
 
    camposFormulario.forEach(limpiarErrorCampo);
 
}
 
 
/**
 * Devuelve el ID del mensaje de error asociado a un campo.
 *
 * @param {string} idCampo
 * @returns {string}
 */
function obtenerIdErrorCampo(idCampo) {
 
    const mapaErrores = {
 
        sexo: "errorSexo",
        edad: "errorEdad",
        peso: "errorPeso",
        altura: "errorAltura",
        actividad: "errorActividad",
        objetivo: "errorObjetivo"
 
    };
 
    return mapaErrores[idCampo] || "";
 
}
 
 
/**
 * Coloca el foco en el primer campo no válido.
 */
function enfocarPrimerCampoConError() {
 
    const primerCampoInvalido = formulario.querySelector(
        '[aria-invalid="true"]'
    );
 
    if (primerCampoInvalido) {
 
        primerCampoInvalido.focus();
 
    }
 
}
 
 
/* ==========================================================
   MOTOR DE CÁLCULO
========================================================== */
 
/**
 * Ejecuta todos los cálculos de la herramienta.
 *
 * @param {Object} datos
 * @returns {Object}
 */
function calcularResultados(datos) {
 
    const tmb = calcularTmb(datos);
 
    const tdee = calcularTdee(tmb, datos.actividad);
 
    const caloriasObjetivo = calcularCaloriasObjetivo(
        tdee,
        datos.objetivo
    );
 
    const proteinas = calcularProteinas(
        datos.peso,
        datos.objetivo
    );
 
    const grasas = calcularGrasas(
        datos.peso,
        datos.objetivo
    );
 
    const carbohidratos = calcularCarbohidratos(
        caloriasObjetivo,
        proteinas,
        grasas
    );
 
    const imc = calcularImc(
        datos.peso,
        datos.altura
    );
 
    const clasificacionImc = clasificarImc(imc);
 
    const distribucion = calcularDistribucionCalorica(
        caloriasObjetivo,
        proteinas,
        carbohidratos,
        grasas
    );
 
    return {
 
        datos,
 
        tmb: redondear(tmb),
 
        tdee: redondear(tdee),
 
        calorias: redondear(caloriasObjetivo),
 
        proteinas: redondear(proteinas),
 
        carbohidratos: redondear(carbohidratos),
 
        grasas: redondear(grasas),
 
        imc: redondear(imc, 1),
 
        clasificacionImc,
 
        distribucion
 
    };
 
}
 
 
/**
 * Calcula la tasa metabólica basal con Mifflin-St Jeor.
 *
 * Hombre:
 * 10 × peso + 6.25 × altura − 5 × edad + 5
 *
 * Mujer:
 * 10 × peso + 6.25 × altura − 5 × edad − 161
 *
 * @param {Object} datos
 * @returns {number}
 */
function calcularTmb(datos) {
 
    const base = (
        10 * datos.peso +
        6.25 * datos.altura -
        5 * datos.edad
    );
 
    return datos.sexo === "hombre"
        ? base + 5
        : base - 161;
 
}
 
 
/**
 * Calcula el gasto energético diario total.
 *
 * @param {number} tmb
 * @param {number} actividad
 * @returns {number}
 */
function calcularTdee(tmb, actividad) {
 
    return tmb * actividad;
 
}
 
 
/**
 * Ajusta las calorías según el objetivo elegido.
 *
 * @param {number} tdee
 * @param {string} objetivo
 * @returns {number}
 */
function calcularCaloriasObjetivo(tdee, objetivo) {
 
    const ajuste = CONFIG.objetivos[objetivo];
 
    return Math.max(tdee + ajuste, 1200);
 
}
 
 
/**
 * Calcula los gramos diarios de proteína.
 *
 * @param {number} peso
 * @param {string} objetivo
 * @returns {number}
 */
function calcularProteinas(peso, objetivo) {
 
    return peso * CONFIG.proteinas[objetivo];
 
}
 
 
/**
 * Calcula los gramos diarios de grasa.
 *
 * @param {number} peso
 * @param {string} objetivo
 * @returns {number}
 */
function calcularGrasas(peso, objetivo) {
 
    return peso * CONFIG.grasas[objetivo];
 
}
 
 
/**
 * Calcula los carbohidratos con las calorías restantes.
 *
 * @param {number} caloriasTotales
 * @param {number} proteinas
 * @param {number} grasas
 * @returns {number}
 */
function calcularCarbohidratos(
    caloriasTotales,
    proteinas,
    grasas
) {
 
    const caloriasProteinas = (
        proteinas * CONFIG.calorias.proteina
    );
 
    const caloriasGrasas = (
        grasas * CONFIG.calorias.grasa
    );
 
    const caloriasDisponibles = (
        caloriasTotales -
        caloriasProteinas -
        caloriasGrasas
    );
 
    if (caloriasDisponibles <= 0) {
 
        return 0;
 
    }
 
    return (
        caloriasDisponibles /
        CONFIG.calorias.carbohidrato
    );
 
}
 
 
/**
 * Calcula el índice de masa corporal.
 *
 * @param {number} peso
 * @param {number} alturaCm
 * @returns {number}
 */
function calcularImc(peso, alturaCm) {
 
    const alturaMetros = alturaCm / 100;
 
    return peso / (alturaMetros ** 2);
 
}
 
 
/**
 * Clasifica el IMC de forma orientativa.
 *
 * @param {number} imc
 * @returns {string}
 */
function clasificarImc(imc) {
 
    if (imc < 18.5) {
 
        return "Peso bajo";
 
    }
 
    if (imc < 25) {
 
        return "Peso saludable";
 
    }
 
    if (imc < 30) {
 
        return "Sobrepeso";
 
    }
 
    if (imc < 35) {
 
        return "Obesidad grado I";
 
    }
 
    if (imc < 40) {
 
        return "Obesidad grado II";
 
    }
 
    return "Obesidad grado III";
 
}
 
 
/**
 * Calcula el porcentaje energético de cada macronutriente.
 *
 * @param {number} caloriasTotales
 * @param {number} proteinas
 * @param {number} carbohidratos
 * @param {number} grasas
 * @returns {{proteinas: number, carbohidratos: number, grasas: number}}
 */
function calcularDistribucionCalorica(
    caloriasTotales,
    proteinas,
    carbohidratos,
    grasas
) {
 
    const caloriasProteinas = (
        proteinas * CONFIG.calorias.proteina
    );
 
    const caloriasCarbohidratos = (
        carbohidratos * CONFIG.calorias.carbohidrato
    );
 
    const caloriasGrasas = (
        grasas * CONFIG.calorias.grasa
    );
 
    return {
 
        proteinas: redondear(
            porcentaje(caloriasProteinas, caloriasTotales)
        ),
 
        carbohidratos: redondear(
            porcentaje(caloriasCarbohidratos, caloriasTotales)
        ),
 
        grasas: redondear(
            porcentaje(caloriasGrasas, caloriasTotales)
        )
 
    };
 
}
 
 
/* ==========================================================
   RENDERIZADO DE RESULTADOS
========================================================== */
 
/**
 * Muestra todos los resultados calculados.
 *
 * @param {Object} resultados
 */
function renderizarResultados(resultados) {
 
    asignarTexto(
        "resultadoPrincipal",
        formatearNumero(resultados.calorias)
    );
 
    asignarTexto(
        "resultadoProteinas",
        formatearNumero(resultados.proteinas)
    );
 
    asignarTexto(
        "resultadoCarbohidratos",
        formatearNumero(resultados.carbohidratos)
    );
 
    asignarTexto(
        "resultadoGrasas",
        formatearNumero(resultados.grasas)
    );
 
    asignarTexto(
        "resultadoTmb",
        formatearNumero(resultados.tmb)
    );
 
    asignarTexto(
        "resultadoTdee",
        formatearNumero(resultados.tdee)
    );
 
    asignarTexto(
        "resultadoImc",
        formatearDecimal(resultados.imc, 1)
    );
 
    asignarTexto(
        "clasificacionImc",
        resultados.clasificacionImc
    );
 
    asignarTexto(
        "resumenResultado",
        crearResumenResultado(resultados)
    );
 
    asignarTexto(
        "descripcionResultadoPrincipal",
        crearDescripcionCalorias(resultados)
    );
 
    asignarTexto(
        "interpretacionResultado",
        crearInterpretacion(resultados)
    );
 
    renderizarRecomendaciones(resultados);
 
    mostrar(seccionResultados);
    seccionResultados.classList.remove("oculto");
 
    botonReiniciar.classList.remove("oculto");
 
    aparecer(seccionResultados);
 
    requestAnimationFrame(() => {
 
        scrollA(seccionResultados);
 
    });
 
}
 
 
/**
 * Crea el texto breve situado bajo el título de resultados.
 *
 * @param {Object} resultados
 * @returns {string}
 */
function crearResumenResultado(resultados) {
 
    const nombreObjetivo = obtenerNombreObjetivo(
        resultados.datos.objetivo
    );
 
    return (
        `Para ${nombreObjetivo.toLowerCase()}, tu referencia diaria es de ` +
        `${formatearNumero(resultados.calorias)} kcal, ` +
        `${formatearNumero(resultados.proteinas)} g de proteína, ` +
        `${formatearNumero(resultados.carbohidratos)} g de carbohidratos ` +
        `y ${formatearNumero(resultados.grasas)} g de grasa.`
    );
 
}
 
 
/**
 * Crea la descripción de las calorías objetivo.
 *
 * @param {Object} resultados
 * @returns {string}
 */
function crearDescripcionCalorias(resultados) {
 
    const objetivo = resultados.datos.objetivo;
 
    if (objetivo === "perder") {
 
        return (
            `Objetivo calculado aplicando un déficit aproximado de ` +
            `${Math.abs(CONFIG.objetivos.perder)} kcal sobre tu gasto diario.`
        );
 
    }
 
    if (objetivo === "ganar") {
 
        return (
            `Objetivo calculado aplicando un superávit aproximado de ` +
            `${CONFIG.objetivos.ganar} kcal sobre tu gasto diario.`
        );
 
    }
 
    return (
        "Objetivo calculado para mantener aproximadamente tu peso actual."
    );
 
}
 
 
/**
 * Genera una interpretación personalizada del resultado.
 *
 * @param {Object} resultados
 * @returns {string}
 */
function crearInterpretacion(resultados) {
 
    const objetivo = resultados.datos.objetivo;
 
    const textosObjetivo = {
 
        perder:
            "La estimación aplica un déficit calórico moderado para favorecer una pérdida progresiva de grasa.",
 
        mantener:
            "La estimación mantiene las calorías cerca de tu gasto energético diario para favorecer la estabilidad del peso.",
 
        ganar:
            "La estimación aplica un superávit calórico moderado para apoyar la ganancia de masa muscular."
 
    };
 
    return (
        `${textosObjetivo[objetivo]} ` +
        `Tu metabolismo basal estimado es de ` +
        `${formatearNumero(resultados.tmb)} kcal y tu gasto diario total, ` +
        `antes del ajuste, es de ${formatearNumero(resultados.tdee)} kcal. ` +
        `El reparto energético aproximado es ` +
        `${resultados.distribucion.proteinas}% proteína, ` +
        `${resultados.distribucion.carbohidratos}% carbohidratos y ` +
        `${resultados.distribucion.grasas}% grasas. ` +
        `Tu IMC es ${formatearDecimal(resultados.imc, 1)} ` +
        `(${resultados.clasificacionImc.toLowerCase()}), ` +
        `una referencia general que no distingue entre grasa y masa muscular.`
    );
 
}
 
 
/**
 * Inserta las recomendaciones personalizadas sin usar HTML externo.
 *
 * @param {Object} resultados
 */
function renderizarRecomendaciones(resultados) {
 
    const lista = $("#listaRecomendaciones");
 
    const recomendaciones = crearRecomendaciones(resultados);
 
    lista.replaceChildren();
 
    recomendaciones.forEach((recomendacion) => {
 
        const elementoLista = document.createElement("li");
 
        elementoLista.textContent = recomendacion;
 
        lista.appendChild(elementoLista);
 
    });
 
}
 
 
/**
 * Crea recomendaciones dinámicas según los resultados.
 *
 * @param {Object} resultados
 * @returns {string[]}
 */
function crearRecomendaciones(resultados) {
 
    const recomendaciones = [
 
        `Usa estas cifras como punto de partida y observa tu evolución durante al menos dos o tres semanas.`,
 
        `Distribuye aproximadamente ${formatearNumero(resultados.proteinas)} g de proteína entre varias comidas según tus preferencias.`,
 
        "Prioriza alimentos variados, verduras, frutas, legumbres, cereales integrales y fuentes de proteína de calidad.",
 
        "Mantén una hidratación adecuada y adapta la ingesta a tu entrenamiento, hambre, energía y recuperación."
 
    ];
 
    if (resultados.datos.objetivo === "perder") {
 
        recomendaciones.push(
            "Busca una pérdida gradual y evita reducir más las calorías sin valorar primero tu progreso."
        );
 
    }
 
    if (resultados.datos.objetivo === "mantener") {
 
        recomendaciones.push(
            "Si el peso cambia de forma sostenida, ajusta ligeramente las calorías según la tendencia observada."
        );
 
    }
 
    if (resultados.datos.objetivo === "ganar") {
 
        recomendaciones.push(
            "Combina el superávit con entrenamiento de fuerza y controla que la subida de peso sea progresiva."
        );
 
    }
 
    if (
        resultados.clasificacionImc === "Peso bajo" ||
        resultados.clasificacionImc.startsWith("Obesidad")
    ) {
 
        recomendaciones.push(
            "Por tu clasificación orientativa de IMC, puede ser especialmente útil consultar a un dietista-nutricionista o profesional sanitario."
        );
 
    }
 
    return recomendaciones;
 
}
 
 
/* ==========================================================
   REINICIO
========================================================== */
 
/**
 * Devuelve la herramienta a su estado inicial.
 */
function reiniciarHerramienta() {
 
    limpiarFormulario(formulario);
    limpiarErrores();
 
    ocultar(seccionResultados);
    seccionResultados.classList.add("oculto");
 
    botonReiniciar.classList.add("oculto");
 
    restaurarResultados();
 
    campoSexo.focus();
 
    scrollA($("#calculadora"));
 
}
 
 
/**
 * Restaura los textos numéricos de resultados.
 */
function restaurarResultados() {
 
    const resultadosNumericos = [
 
        "resultadoPrincipal",
        "resultadoProteinas",
        "resultadoCarbohidratos",
        "resultadoGrasas",
        "resultadoTmb",
        "resultadoTdee",
        "resultadoImc"
 
    ];
 
    resultadosNumericos.forEach((id) => {
 
        asignarTexto(id, "0");
 
    });
 
    asignarTexto(
        "resumenResultado",
        "Esta es una estimación orientativa basada en los datos introducidos."
    );
 
    asignarTexto(
        "descripcionResultadoPrincipal",
        "Energía diaria estimada según tu objetivo."
    );
 
    asignarTexto(
        "clasificacionImc",
        "Clasificación orientativa del índice de masa corporal."
    );
 
    asignarTexto(
        "interpretacionResultado",
        "Aquí aparecerá una explicación personalizada del cálculo."
    );
 
    const lista = $("#listaRecomendaciones");
 
    lista.replaceChildren();
 
    [
        "Distribuye los macronutrientes entre varias comidas según tus preferencias.",
        "Prioriza alimentos variados y fuentes de proteína de calidad.",
        "Ajusta progresivamente según tu evolución y sensaciones."
    ].forEach((texto) => {
 
        const elementoLista = document.createElement("li");
 
        elementoLista.textContent = texto;
 
        lista.appendChild(elementoLista);
 
    });
 
}
 
 
/* ==========================================================
   UTILIDADES DE PRESENTACIÓN
========================================================== */
 
/**
 * Devuelve el nombre legible del objetivo.
 *
 * @param {string} objetivo
 * @returns {string}
 */
function obtenerNombreObjetivo(objetivo) {
 
    const nombres = {
 
        perder: "Perder grasa",
 
        mantener: "Mantener el peso",
 
        ganar: "Ganar masa muscular"
 
    };
 
    return nombres[objetivo] || "Objetivo seleccionado";
 
}
 
 
/**
 * Formatea un número decimal usando la configuración española.
 *
 * @param {number} valor
 * @param {number} decimales
 * @returns {string}
 */
function formatearDecimal(valor, decimales = 1) {
 
    return new Intl.NumberFormat("es-ES", {
 
        minimumFractionDigits: decimales,
 
        maximumFractionDigits: decimales
 
    }).format(valor);
 
}
 
 
/* ==========================================================
   GOOGLE ANALYTICS
========================================================== */
 
/**
 * Registra el uso de la calculadora cuando Analytics está disponible.
 *
 * @param {string} objetivo
 */
function registrarCalculoAnalytics(objetivo) {
 
    if (typeof window.gtag !== "function") {
 
        return;
 
    }
 
    window.gtag("event", "calcular_macros", {
 
        herramienta: CONFIG.herramienta.proyecto,
 
        objetivo
 
    });
 
}
