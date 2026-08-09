/* ==========================================================
   HERRAMIENTAS360
   Calculadora de Calorías
   SCRIPT.JS
   Motor principal de cálculo
   Versión 1.0
   © 2026 José Carlos Núñez Florido
========================================================== */

"use strict";


/* ==========================================================
   ELEMENTOS DEL DOM
========================================================== */

const formulario = $("#form-calorias");

const camposSexo = $$('input[name="sexo"]');
const campoSexoInicial = $('input[name="sexo"]');

const campoEdad = $("#edad");
const campoPeso = $("#peso");
const campoAltura = $("#altura");
const campoActividad = $("#actividad");

const camposObjetivo = $$('input[name="objetivo"]');
const campoObjetivoInicial = $('input[name="objetivo"]');

const botonCalcular =
    formulario?.querySelector('button[type="submit"]') ?? null;


/* ==========================================================
   ESTADO DE LA APLICACIÓN
========================================================== */

let calculando = false;
let ultimoResultado = null;


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

document.addEventListener("DOMContentLoaded", iniciarAplicacion);


/**
 * Prepara los eventos principales de la calculadora.
 */
function iniciarAplicacion() {

    if (!formulario) {

        console.error(
            "Herramientas360: no se ha encontrado el formulario con id='form-calorias'."
        );

        return;

    }

    formulario.addEventListener("submit", gestionarCalculo);

    formulario.addEventListener("reset", gestionarReinicio);

    actualizarAnioFooter();

}


/* ==========================================================
   GESTIÓN DEL FORMULARIO
========================================================== */

/**
 * Gestiona el envío del formulario.
 *
 * @param {SubmitEvent} evento
 */
async function gestionarCalculo(evento) {

    evento.preventDefault();

    if (calculando) return;

    ocultarResultadosAnteriores();

    const datos = obtenerDatosFormulario();

    const validacion = validarDatosFormulario(datos);

    if (!validacion.valido) {

        mostrarError(validacion.mensaje);

        enfocarCampo(validacion.campo);

        return;

    }

    try {

        establecerEstadoCalculando(true);

        await ejecutarAnimacionCalculo();

        const resultado = calcularResultadoCompleto(datos);

        ultimoResultado = resultado;

        mostrarResultados(resultado);

        actualizarResultadosComplementarios(resultado);

    } catch (error) {

        console.error(
            "Herramientas360: se ha producido un error durante el cálculo.",
            error
        );

        mostrarError(
            "No se ha podido completar el cálculo. Revisa los datos e inténtalo de nuevo."
        );

    } finally {

        establecerEstadoCalculando(false);

    }

}


/**
 * Gestiona el reinicio nativo del formulario.
 */
function gestionarReinicio() {

    ultimoResultado = null;

    window.setTimeout(() => {

        ocultarResultadosAnteriores();

        limpiarEstadoCalculo();

        campoSexoInicial?.focus();

    }, 0);

}


/* ==========================================================
   OBTENCIÓN DE DATOS
========================================================== */

/**
 * Obtiene el radio seleccionado de un grupo.
 *
 * @param {string} nombre
 * @returns {HTMLInputElement|null}
 */
function obtenerRadioSeleccionado(nombre) {

    return document.querySelector(
        `input[name="${nombre}"]:checked`
    );

}


/**
 * Obtiene y normaliza los datos introducidos.
 *
 * @returns {{
 *   sexo: string,
 *   edad: number,
 *   peso: number,
 *   altura: number,
 *   actividad: string,
 *   objetivo: string
 * }}
 */
function obtenerDatosFormulario() {

    const sexoSeleccionado =
        obtenerRadioSeleccionado("sexo");

    const objetivoSeleccionado =
        obtenerRadioSeleccionado("objetivo");

    return {

        sexo: normalizarTexto(
            sexoSeleccionado?.value
        ),

        edad: numero(
            campoEdad?.value
        ),

        peso: numero(
            campoPeso?.value
        ),

        altura: numero(
            campoAltura?.value
        ),

        actividad: normalizarClaveActividad(
            campoActividad?.value
        ),

        objetivo: normalizarTexto(
            objetivoSeleccionado?.value
        )

    };

}


/**
 * Normaliza un valor de texto.
 *
 * @param {string} valor
 * @returns {string}
 */
function normalizarTexto(valor) {

    return String(valor ?? "").trim();

}


/**
 * Convierte los valores del select de actividad
 * en las claves utilizadas por config.js.
 *
 * @param {string} valor
 * @returns {string}
 */
function normalizarClaveActividad(valor) {

    const clave = normalizarTexto(valor);

    const equivalencias = {

        /* Valores actuales del index.html */
        "1.2": "sedentario",
        "1.20": "sedentario",

        "1.375": "ligero",

        "1.55": "moderado",

        "1.725": "intenso",

        "1.9": "muyIntenso",
        "1.90": "muyIntenso",

        /* Claves compatibles para futuras versiones */
        "sedentario": "sedentario",

        "ligero": "ligero",
        "actividad-ligera": "ligero",

        "moderado": "moderado",
        "actividad-moderada": "moderado",

        "intenso": "intenso",
        "actividad-intensa": "intenso",

        "muy-intenso": "muyIntenso",
        "muy_intenso": "muyIntenso",
        "muyIntenso": "muyIntenso"

    };

    return equivalencias[clave] ?? "";

}


/* ==========================================================
   VALIDACIÓN
========================================================== */

/**
 * Valida todos los datos necesarios.
 *
 * @param {Object} datos
 * @returns {{
 *   valido: boolean,
 *   mensaje: string,
 *   campo: HTMLElement|null
 * }}
 */
function validarDatosFormulario(datos) {

    if (!datos.sexo) {

        return crearErrorValidacion(
            "Selecciona tu sexo.",
            campoSexoInicial
        );

    }

    if (!["hombre", "mujer"].includes(datos.sexo)) {

        return crearErrorValidacion(
            "Selecciona una opción válida en el campo sexo.",
            campoSexoInicial
        );

    }

    if (!Number.isFinite(datos.edad)) {

        return crearErrorValidacion(
            "Introduce una edad válida.",
            campoEdad
        );

    }

    if (
        !dentroDeRango(
            datos.edad,
            LIMITES.edad.min,
            LIMITES.edad.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorEdad,
            campoEdad
        );

    }

    if (!Number.isFinite(datos.peso)) {

        return crearErrorValidacion(
            "Introduce un peso válido.",
            campoPeso
        );

    }

    if (
        !dentroDeRango(
            datos.peso,
            LIMITES.peso.min,
            LIMITES.peso.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorPeso,
            campoPeso
        );

    }

    if (!Number.isFinite(datos.altura)) {

        return crearErrorValidacion(
            "Introduce una altura válida.",
            campoAltura
        );

    }

    if (
        !dentroDeRango(
            datos.altura,
            LIMITES.altura.min,
            LIMITES.altura.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorAltura,
            campoAltura
        );

    }

    if (
        !datos.actividad ||
        !Object.hasOwn(ACTIVIDAD, datos.actividad)
    ) {

        return crearErrorValidacion(
            "Selecciona un nivel de actividad válido.",
            campoActividad
        );

    }

    if (
        !datos.objetivo ||
        !Object.hasOwn(OBJETIVOS, datos.objetivo)
    ) {

        return crearErrorValidacion(
            "Selecciona un objetivo válido.",
            campoObjetivoInicial
        );

    }

    return {

        valido: true,

        mensaje: "",

        campo: null

    };

}


/**
 * Crea una respuesta de validación fallida.
 *
 * @param {string} mensaje
 * @param {HTMLElement|null} campo
 * @returns {Object}
 */
function crearErrorValidacion(mensaje, campo = null) {

    return {

        valido: false,

        mensaje,

        campo

    };

}


/**
 * Coloca el foco en el campo incorrecto.
 *
 * @param {HTMLElement|null} campo
 */
function enfocarCampo(campo) {

    if (!campo) return;

    campo.focus();

}


/* ==========================================================
   MOTOR DE CÁLCULO
========================================================== */

/**
 * Ejecuta todos los cálculos y prepara el objeto
 * que recibe results.js.
 *
 * @param {Object} datos
 * @returns {Object}
 */
function calcularResultadoCompleto(datos) {

    const tmb = calcularTMB(datos);

    const factorActividad =
        ACTIVIDAD[datos.actividad].factor;

    const tdee = calcularTDEE(
        tmb,
        factorActividad
    );

    const caloriasPerder = aplicarAjuste(
        tdee,
        OBJETIVOS.perder.ajuste
    );

    const caloriasMantener = aplicarAjuste(
        tdee,
        OBJETIVOS.mantener.ajuste
    );

    const caloriasGanar = aplicarAjuste(
        tdee,
        OBJETIVOS.ganar.ajuste
    );

    const caloriasObjetivo = obtenerCaloriasObjetivo(
        datos.objetivo,
        {
            perder: caloriasPerder,
            mantener: caloriasMantener,
            ganar: caloriasGanar
        }
    );

    const ajuste =
        OBJETIVOS[datos.objetivo].ajuste;

    const confianza =
        calcularConfianzaEstimacion(datos);

    return {

        sexo: datos.sexo,

        edad: datos.edad,

        peso: datos.peso,

        altura: datos.altura,

        actividad: datos.actividad,

        objetivo: datos.objetivo,

        formula: FORMULA.nombre,

        factorActividad,

        ajuste,

        tmb: redondear(tmb),

        tdee: redondear(tdee),

        calorias: redondear(caloriasObjetivo),

        caloriasPerder: redondear(caloriasPerder),

        caloriasMantener: redondear(caloriasMantener),

        caloriasGanar: redondear(caloriasGanar),

        confianza,

        fecha: new Date()

    };

}


/**
 * Calcula la Tasa Metabólica Basal mediante
 * la fórmula Mifflin-St Jeor.
 *
 * @param {Object} datos
 * @returns {number}
 */
function calcularTMB(datos) {

    const base =
        (10 * datos.peso) +
        (6.25 * datos.altura) -
        (5 * datos.edad);

    if (datos.sexo === "hombre") {

        return base + 5;

    }

    return base - 161;

}


/**
 * Calcula el gasto energético total diario.
 *
 * @param {number} tmb
 * @param {number} factorActividad
 * @returns {number}
 */
function calcularTDEE(tmb, factorActividad) {

    return tmb * factorActividad;

}


/**
 * Aplica un porcentaje de déficit o superávit.
 *
 * @param {number} caloriasBase
 * @param {number} ajuste
 * @returns {number}
 */
function aplicarAjuste(caloriasBase, ajuste) {

    return caloriasBase * (1 + ajuste);

}


/**
 * Selecciona las calorías correspondientes al objetivo.
 *
 * @param {string} objetivo
 * @param {Object} opciones
 * @returns {number}
 */
function obtenerCaloriasObjetivo(objetivo, opciones) {

    if (!Object.hasOwn(opciones, objetivo)) {

        return opciones.mantener;

    }

    return opciones[objetivo];

}


/* ==========================================================
   FIABILIDAD ORIENTATIVA
========================================================== */

/**
 * Calcula un nivel orientativo de confianza.
 *
 * @param {Object} datos
 * @returns {{
 *   nivel: string,
 *   porcentaje: number
 * }}
 */
function calcularConfianzaEstimacion(datos) {

    let porcentaje = 84;

    if (
        datos.edad <= LIMITES.edad.min + 2 ||
        datos.edad >= LIMITES.edad.max - 5
    ) {

        porcentaje -= 5;

    }

    if (
        datos.peso <= LIMITES.peso.min + 5 ||
        datos.peso >= LIMITES.peso.max - 20
    ) {

        porcentaje -= 5;

    }

    if (
        datos.altura <= LIMITES.altura.min + 5 ||
        datos.altura >= LIMITES.altura.max - 5
    ) {

        porcentaje -= 4;

    }

    porcentaje = Math.max(
        65,
        Math.min(90, porcentaje)
    );

    let nivel = "Alta";

    if (porcentaje < 75) {

        nivel = "Orientativa";

    } else if (porcentaje < 82) {

        nivel = "Media";

    }

    return {

        nivel,

        porcentaje

    };

}


/* ==========================================================
   INFORMACIÓN COMPLEMENTARIA DEL RESULTADO
========================================================== */

/**
 * Actualiza los elementos de resultados que no gestiona
 * directamente results.js.
 *
 * @param {Object} datos
 */
function actualizarResultadosComplementarios(datos) {

    actualizarInterpretacion(datos);

    actualizarConfianza(datos);

    actualizarResumenResultado(datos);

    actualizarIconoRecomendacion(datos);

}


/**
 * Muestra una interpretación personalizada.
 *
 * @param {Object} datos
 */
function actualizarInterpretacion(datos) {

    const elemento =
        $("#resultado-interpretacion");

    if (!elemento) return;

    const calorias =
        formatearNumero(datos.calorias);

    const mensajes = {

        perder:
            `Para perder grasa, puedes utilizar unas ${calorias} kcal al día como punto de partida. Observa tu evolución durante varias semanas y evita déficits extremos.`,

        mantener:
            `Para mantener tu peso actual, tu ingesta orientativa es de unas ${calorias} kcal al día. El resultado puede variar según tu actividad real y tu composición corporal.`,

        ganar:
            `Para favorecer la ganancia muscular, puedes comenzar con unas ${calorias} kcal al día, acompañadas de entrenamiento de fuerza, proteína suficiente y descanso.`

    };

    elemento.textContent =
        mensajes[datos.objetivo] ??
        "Utiliza este resultado como una estimación inicial y ajústalo según tu evolución.";

}


/**
 * Actualiza el nivel y la barra de confianza.
 *
 * @param {Object} datos
 */
function actualizarConfianza(datos) {

    const nivel =
        $("#nivel-confianza");

    const barra =
        $(".confidence__bar");

    const progreso =
        $(".confidence__bar span");

    if (nivel) {

        nivel.textContent =
            datos.confianza.nivel;

    }

    if (barra) {

        barra.setAttribute(
            "aria-valuenow",
            String(datos.confianza.porcentaje)
        );

    }

    if (progreso) {

        progreso.style.width =
            `${datos.confianza.porcentaje}%`;

    }

}


/**
 * Actualiza el resumen superior del resultado.
 *
 * @param {Object} datos
 */
function actualizarResumenResultado(datos) {

    const resumen =
        $("#resumen-resultado");

    if (!resumen) return;

    resumen.textContent =
        `Estimación calculada mediante ${datos.formula}, aplicando un factor de actividad de ${datos.factorActividad}.`;

}


/**
 * Actualiza el icono de la recomendación.
 *
 * @param {Object} datos
 */
function actualizarIconoRecomendacion(datos) {

    const icono =
        $("#recomendacion-icono");

    if (!icono) return;

    const iconos = {

        perder: "🔥",

        mantener: "⚖️",

        ganar: "💪"

    };

    icono.textContent =
        iconos[datos.objetivo] ?? "✅";

}


/* ==========================================================
   ANIMACIÓN DE CÁLCULO
========================================================== */

/**
 * Ejecuta la animación configurada en core.js.
 */
async function ejecutarAnimacionCalculo() {

    if (
        typeof animacionCalculo === "function"
    ) {

        await animacionCalculo();

    }

}


/**
 * Activa o desactiva el estado visual de cálculo.
 *
 * @param {boolean} activo
 */
function establecerEstadoCalculando(activo) {

    calculando = activo;

    if (!botonCalcular) return;

    botonCalcular.disabled = activo;

    botonCalcular.setAttribute(
        "aria-busy",
        String(activo)
    );

    if (activo) {

        botonCalcular.dataset.textoOriginal =
            botonCalcular.textContent.trim();

        botonCalcular.textContent =
            "Calculando...";

        return;

    }

    const textoOriginal =
        botonCalcular.dataset.textoOriginal;

    botonCalcular.textContent =
        textoOriginal || "Calcular mis calorías";

}


/**
 * Limpia el texto del proceso de cálculo.
 */
function limpiarEstadoCalculo() {

    const estadoCalculo =
        $("#estado-calculo");

    if (estadoCalculo) {

        estadoCalculo.textContent = "";

    }

}


/* ==========================================================
   RESULTADOS
========================================================== */

/**
 * Oculta la sección anterior antes de realizar
 * un cálculo nuevo.
 */
function ocultarResultadosAnteriores() {

    const seccionResultados =
        $("#resultados");

    if (seccionResultados) {

        seccionResultados.hidden = true;

    }

}


/* ==========================================================
   PIE DE PÁGINA
========================================================== */

/**
 * Actualiza el año del footer si existe
 * un elemento compatible.
 */
function actualizarAnioFooter() {

    const elementoAnio =
        $("#anio-actual") ||
        $("[data-current-year]");

    if (!elementoAnio) return;

    elementoAnio.textContent =
        obtenerAnioActual();

}