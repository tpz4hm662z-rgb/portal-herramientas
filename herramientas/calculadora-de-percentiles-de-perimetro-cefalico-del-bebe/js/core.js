/* =====================================================
   HERRAMIENTAS360 CORE
   core.js
   Versión 3.1 Stable
   © 2026 José Carlos Núñez Florido

   Motor reutilizable para todas las herramientas.

   ORDEN OBLIGATORIO:
   1. config.js
   2. core.js
   3. script.js
===================================================== */

"use strict";


/* =====================================================
   1. SELECTORES DOM
===================================================== */

/**
 * Devuelve el primer elemento que coincide con el selector.
 *
 * @param {string} selector
 * @param {Document|Element} contexto
 * @returns {Element|null}
 */
const $ = (selector, contexto = document) => {

    if (!selector || !contexto) return null;

    return contexto.querySelector(selector);

};


/**
 * Devuelve todos los elementos que coinciden con el selector.
 *
 * @param {string} selector
 * @param {Document|Element} contexto
 * @returns {NodeList}
 */
const $$ = (selector, contexto = document) => {

    if (!selector || !contexto) return [];

    return contexto.querySelectorAll(selector);

};


/* =====================================================
   2. UTILIDADES GENERALES
===================================================== */

/**
 * Comprueba si un valor es nulo, indefinido o está vacío.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function estaVacio(valor) {

    return (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    );

}


/**
 * Convierte un valor a número de forma segura.
 * También acepta comas decimales.
 *
 * @param {*} valor
 * @returns {number|null}
 */
function convertirANumero(valor) {

    if (estaVacio(valor)) return null;

    const numero = Number(
        String(valor)
            .trim()
            .replace(",", ".")
    );

    return Number.isFinite(numero) ? numero : null;

}


/**
 * Limita un número entre un valor mínimo y máximo.
 *
 * @param {number} numero
 * @param {number} minimo
 * @param {number} maximo
 * @returns {number}
 */
function limitarNumero(numero, minimo, maximo) {

    return Math.min(Math.max(numero, minimo), maximo);

}


/**
 * Redondea un número a los decimales indicados.
 *
 * @param {number} numero
 * @param {number} decimales
 * @returns {number}
 */
function redondearNumero(numero, decimales = 2) {

    const factor = 10 ** decimales;

    return Math.round(
        (Number(numero) + Number.EPSILON) * factor
    ) / factor;

}


/**
 * Ejecuta una función después de una pequeña espera.
 *
 * @param {Function} funcion
 * @param {number} espera
 * @returns {Function}
 */
function debounce(funcion, espera = 250) {

    let temporizador;

    return (...argumentos) => {

        clearTimeout(temporizador);

        temporizador = setTimeout(() => {

            funcion(...argumentos);

        }, espera);

    };

}


/* =====================================================
   3. VISIBILIDAD Y CLASES
===================================================== */

function mostrarElemento(elemento) {

    if (!elemento) return;

    elemento.classList.remove("oculto");

    elemento.removeAttribute("hidden");

}


function ocultarElemento(elemento) {

    if (!elemento) return;

    elemento.classList.add("oculto");

}


function alternarElemento(elemento) {

    if (!elemento) return;

    elemento.classList.toggle("oculto");

}


function elementoEstaOculto(elemento) {

    if (!elemento) return true;

    return (
        elemento.classList.contains("oculto") ||
        elemento.hasAttribute("hidden")
    );

}


function agregarClase(elemento, clase) {

    if (!elemento || !clase) return;

    elemento.classList.add(clase);

}


function eliminarClase(elemento, clase) {

    if (!elemento || !clase) return;

    elemento.classList.remove(clase);

}


/* =====================================================
   4. CONTENIDO DEL DOM
===================================================== */

function establecerTexto(selectorOElemento, texto = "") {

    const elemento = obtenerElemento(selectorOElemento);

    if (!elemento) return;

    elemento.textContent = texto;

}


function establecerHTML(selectorOElemento, html = "") {

    const elemento = obtenerElemento(selectorOElemento);

    if (!elemento) return;

    elemento.innerHTML = html;

}


function obtenerElemento(selectorOElemento) {

    if (!selectorOElemento) return null;

    if (typeof selectorOElemento === "string") {

        return $(selectorOElemento);

    }

    return selectorOElemento;

}


/* =====================================================
   5. SCROLL Y FOCO
===================================================== */

function scrollAElemento(elemento, opciones = {}) {

    if (!elemento) return;

    const comportamientoSuave =
        CONFIG?.comportamiento?.scrollSuave !== false;

    elemento.scrollIntoView({

        behavior:
            opciones.behavior ||
            (comportamientoSuave ? "smooth" : "auto"),

        block:
            opciones.block || "start"

    });

}


function enfocarElemento(elemento) {

    if (!elemento) return;

    elemento.focus({

        preventScroll: true

    });

}


/* =====================================================
   6. FORMATEADORES
===================================================== */

function formatearNumero(
    numero,
    decimales = CONFIG?.formato?.decimales ?? 2
) {

    const valor = convertirANumero(numero);

    if (valor === null) return "—";

    const mostrarCeros =
        CONFIG?.formato?.mostrarCerosFinales !== false;

    return valor.toLocaleString(
        CONFIG?.formato?.locale || "es-ES",
        {
            minimumFractionDigits:
                mostrarCeros ? decimales : 0,

            maximumFractionDigits:
                decimales,

            useGrouping:
                CONFIG?.formato?.usarSeparadorMiles !== false
        }
    );

}


function formatearMoneda(
    numero,
    decimales = CONFIG?.formato?.decimales ?? 2
) {

    const valor = convertirANumero(numero);

    if (valor === null) return "—";

    return valor.toLocaleString(
        CONFIG?.formato?.locale || "es-ES",
        {
            style: "currency",

            currency:
                CONFIG?.formato?.moneda || "EUR",

            minimumFractionDigits:
                decimales,

            maximumFractionDigits:
                decimales
        }
    );

}


function formatearPorcentaje(
    numero,
    decimales =
        CONFIG?.formato?.decimalesPorcentaje ?? 2
) {

    const valor = convertirANumero(numero);

    if (valor === null) return "—";

    return `${formatearNumero(valor, decimales)} %`;

}


function formatearValor(
    valor,
    formato = "numero",
    decimales = CONFIG?.formato?.decimales ?? 2
) {

    switch (formato) {

        case "moneda":
            return formatearMoneda(valor, decimales);

        case "porcentaje":
            return formatearPorcentaje(valor, decimales);

        case "texto":
            return estaVacio(valor) ? "—" : String(valor);

        case "numero":
        default:
            return formatearNumero(valor, decimales);

    }

}


/* =====================================================
   7. MENSAJES DE ERROR
===================================================== */

function mostrarError(selectorOElemento, mensaje) {

    const elemento = obtenerElemento(selectorOElemento);

    if (!elemento) return;

    elemento.textContent = mensaje || "";

    elemento.setAttribute("role", "alert");

    const campo = obtenerCampoDesdeError(elemento);

    if (campo) {

        campo.classList.add("campo-invalido");

        campo.setAttribute("aria-invalid", "true");

    }

}


function limpiarError(selectorOElemento) {

    const elemento = obtenerElemento(selectorOElemento);

    if (!elemento) return;

    elemento.textContent = "";

    elemento.removeAttribute("role");

    const campo = obtenerCampoDesdeError(elemento);

    if (campo) {

        campo.classList.remove("campo-invalido");

        campo.removeAttribute("aria-invalid");

    }

}


function obtenerCampoDesdeError(elementoError) {

    const campoConfig = Object.values(
        CONFIG?.campos || {}
    ).find(campo => {

        return $(campo.selectorError) === elementoError;

    });

    return campoConfig
        ? $(campoConfig.selector)
        : null;

}


function limpiarTodosLosErrores() {

    Object.values(CONFIG?.campos || {}).forEach(campo => {

        limpiarError(campo.selectorError);

    });

}


function mostrarErrorGeneral(mensaje) {

    debugAdvertencia(
        mensaje ||
        CONFIG?.mensajes?.errorGeneral ||
        "Revisa los datos introducidos."
    );

}


/* =====================================================
   8. OBTENCIÓN DE DATOS DEL FORMULARIO
===================================================== */

function obtenerValorCampo(configuracionCampo) {

    const elemento = $(configuracionCampo.selector);

    if (!elemento) return null;

    switch (configuracionCampo.tipo) {

        case "numero":
            return convertirANumero(elemento.value);

        case "checkbox":
            return elemento.checked;

        case "radio": {

            const seleccionado = $(
                `${configuracionCampo.selector}:checked`
            );

            return seleccionado
                ? seleccionado.value
                : "";

        }

        case "select":
        case "texto":
        default:
            return elemento.value.trim();

    }

}


function obtenerValoresFormulario() {

    const valores = {};

    Object.entries(CONFIG?.campos || {}).forEach(
        ([clave, configuracionCampo]) => {

            valores[clave] =
                obtenerValorCampo(configuracionCampo);

        }
    );

    return valores;

}


/* =====================================================
   9. VALIDACIÓN AUTOMÁTICA
===================================================== */

function validarCampo(configuracionCampo) {

    const elemento = $(configuracionCampo.selector);

    if (!elemento) {

        debugAdvertencia(
            `No se encontró el campo ${configuracionCampo.selector}`
        );

        return {
            valido: false,
            valor: null
        };

    }

    const valorOriginal = elemento.value;
    const valor = obtenerValorCampo(configuracionCampo);

    limpiarError(configuracionCampo.selectorError);


    if (
        configuracionCampo.obligatorio &&
        estaVacio(valorOriginal)
    ) {

        mostrarError(
            configuracionCampo.selectorError,
            configuracionCampo.mensajes?.obligatorio ||
            "Completa este campo."
        );

        return {
            valido: false,
            valor
        };

    }


    if (configuracionCampo.tipo === "numero") {

        if (valor === null) {

            mostrarError(
                configuracionCampo.selectorError,
                configuracionCampo.mensajes?.invalido ||
                "Introduce un número válido."
            );

            return {
                valido: false,
                valor
            };

        }


        if (
            configuracionCampo.permitirCero === false &&
            valor === 0
        ) {

            mostrarError(
                configuracionCampo.selectorError,
                configuracionCampo.mensajes?.minimo ||
                "El valor debe ser superior a cero."
            );

            return {
                valido: false,
                valor
            };

        }


        if (
            configuracionCampo.minimo !== null &&
            configuracionCampo.minimo !== undefined &&
            valor < configuracionCampo.minimo
        ) {

            mostrarError(
                configuracionCampo.selectorError,
                configuracionCampo.mensajes?.minimo ||
                `El valor mínimo es ${configuracionCampo.minimo}.`
            );

            return {
                valido: false,
                valor
            };

        }


        if (
            configuracionCampo.maximo !== null &&
            configuracionCampo.maximo !== undefined &&
            valor > configuracionCampo.maximo
        ) {

            mostrarError(
                configuracionCampo.selectorError,
                configuracionCampo.mensajes?.maximo ||
                `El valor máximo es ${configuracionCampo.maximo}.`
            );

            return {
                valido: false,
                valor
            };

        }

    }


    if (
        configuracionCampo.tipo === "select" &&
        configuracionCampo.obligatorio &&
        estaVacio(valor)
    ) {

        mostrarError(
            configuracionCampo.selectorError,
            configuracionCampo.mensajes?.obligatorio ||
            "Selecciona una opción."
        );

        return {
            valido: false,
            valor
        };

    }


    return {
        valido: true,
        valor
    };

}


function validarFormulario() {

    const valores = {};
    const camposInvalidos = [];

    Object.entries(CONFIG?.campos || {}).forEach(
        ([clave, configuracionCampo]) => {

            const resultado =
                validarCampo(configuracionCampo);

            valores[clave] = resultado.valor;

            if (!resultado.valido) {

                camposInvalidos.push(
                    configuracionCampo
                );

            }

        }
    );


    if (
        camposInvalidos.length > 0 &&
        (
            CONFIG?.comportamiento?.enfocarPrimerError ||
            CONFIG?.accesibilidad?.enfocarPrimerError
        )
    ) {

        const primerCampo = $(
            camposInvalidos[0].selector
        );

        if (primerCampo) {

            scrollAElemento(primerCampo, {
                block: "center"
            });

            enfocarElemento(primerCampo);

        }

    }


    return {

        valido: camposInvalidos.length === 0,

        valores,

        camposInvalidos

    };

}


/* =====================================================
   10. FORMULARIO
===================================================== */

function reiniciarFormulario(formulario) {

    if (!formulario) return;

    formulario.reset();

}


function limpiarFormulario(formulario) {

    reiniciarFormulario(formulario);

    limpiarTodosLosErrores();

}


function prepararLimpiezaErroresAlEditar() {

    if (
        CONFIG?.comportamiento?.limpiarErroresAlEditar ===
        false
    ) {

        return;

    }

    Object.values(CONFIG?.campos || {}).forEach(campo => {

        const elemento = $(campo.selector);

        if (!elemento) return;

        const evento =
            campo.tipo === "select" ||
            campo.tipo === "checkbox" ||
            campo.tipo === "radio"
                ? "change"
                : "input";

        elemento.addEventListener(evento, () => {

            limpiarError(campo.selectorError);

            if (
                CONFIG?.comportamiento
                    ?.ocultarResultadosAlEditar
            ) {

                ocultarResultados();

            }

        });

    });

}


/* =====================================================
   11. ESTADO DEL BOTÓN CALCULAR
===================================================== */

function establecerEstadoCalculando(estaCalculando) {

    const boton = $(
        CONFIG?.selectores?.botonCalcular
    );

    if (!boton) return;

    const configuracionBoton =
        CONFIG?.botones?.calcular || {};

    if (estaCalculando) {

        boton.textContent =
            configuracionBoton.textoProcesando ||
            "Calculando...";

        if (
            configuracionBoton
                .desactivarDuranteCalculo !== false
        ) {

            boton.disabled = true;

        }

        boton.setAttribute("aria-busy", "true");

    } else {

        boton.textContent =
            configuracionBoton.textoNormal ||
            "Calcular resultado";

        boton.disabled = false;

        boton.removeAttribute("aria-busy");

    }

}


/* =====================================================
   12. MOTOR DE RESULTADOS
===================================================== */

/**
 * Estructura esperada:
 *
 * {
 *   principal: 100,
 *   secundarios: {
 *      secundarioUno: 50,
 *      secundarioDos: 200,
 *      secundarioTres: 110
 *   },
 *   resumen: "...",
 *   descripcion: "...",
 *   interpretacion: "...",
 *   recomendaciones: ["...", "..."]
 * }
 */
function pintarResultados(datosResultado = {}) {

    pintarResultadoPrincipal(
        datosResultado.principal
    );

    pintarResultadosSecundarios(
        datosResultado.secundarios || {}
    );

    establecerTexto(
        CONFIG?.selectores?.resumenResultado,
        datosResultado.resumen ??
        CONFIG?.textosResultado?.resumen ??
        ""
    );

    establecerTexto(
        CONFIG?.resultadoPrincipal?.selectorDescripcion,
        datosResultado.descripcion ??
        CONFIG?.resultadoPrincipal?.descripcion ??
        ""
    );

    establecerTexto(
        CONFIG?.selectores?.interpretacionResultado,
        datosResultado.interpretacion ??
        CONFIG?.textosResultado?.interpretacion ??
        ""
    );

    pintarRecomendaciones(
        datosResultado.recomendaciones ??
        CONFIG?.recomendaciones ??
        []
    );

    mostrarResultados();

}


function pintarResultadoPrincipal(valor) {

    const configuracion =
        CONFIG?.resultadoPrincipal;

    if (!configuracion) return;

    establecerTexto(
        configuracion.selectorValor,
        formatearValor(
            valor,
            configuracion.formato,
            configuracion.decimales
        )
    );

    establecerTexto(
        configuracion.selectorUnidad,
        configuracion.unidad || ""
    );

}


function pintarResultadosSecundarios(valores = {}) {

    (CONFIG?.resultadosSecundarios || []).forEach(
        (configuracion, indice) => {

            const valor =
                valores[configuracion.clave] ??
                valores[indice] ??
                null;

            establecerTexto(
                configuracion.selectorValor,
                formatearValor(
                    valor,
                    configuracion.formato,
                    configuracion.decimales
                )
            );


            if (configuracion.selectorTitulo) {

                establecerTexto(
                    configuracion.selectorTitulo,
                    configuracion.titulo
                );

            }


            if (configuracion.selectorUnidad) {

                establecerTexto(
                    configuracion.selectorUnidad,
                    configuracion.unidad
                );

            }

        }
    );

}


function pintarRecomendaciones(recomendaciones = []) {

    const lista = $(
        CONFIG?.selectores?.listaRecomendaciones
    );

    if (!lista) return;

    lista.innerHTML = "";

    recomendaciones.forEach(recomendacion => {

        const elementoLista =
            document.createElement("li");

        elementoLista.textContent =
            String(recomendacion);

        lista.appendChild(elementoLista);

    });

}


/* =====================================================
   13. MOSTRAR Y OCULTAR RESULTADOS
===================================================== */

function mostrarResultados() {

    const seccion = $(
        CONFIG?.selectores?.seccionResultados
    );

    if (!seccion) return;

    mostrarElemento(seccion);

    const botonReiniciar = $(
        CONFIG?.selectores?.botonReiniciar
    );

    if (
        botonReiniciar &&
        CONFIG?.comportamiento?.mostrarBotonReiniciar !==
        false
    ) {

        mostrarElemento(botonReiniciar);

    }


    if (
        CONFIG?.comportamiento?.scrollResultados !== false
    ) {

        window.requestAnimationFrame(() => {

            scrollAElemento(seccion);

        });

    }


    if (
        CONFIG?.accesibilidad?.enfocarResultados
    ) {

        seccion.setAttribute("tabindex", "-1");

        enfocarElemento(seccion);

    }

}


function ocultarResultados() {

    const seccion = $(
        CONFIG?.selectores?.seccionResultados
    );

    ocultarElemento(seccion);

}


/* =====================================================
   14. REINICIO GENERAL
===================================================== */

function reiniciarHerramientaBase() {

    const formulario = $(
        CONFIG?.selectores?.formulario
    );

    limpiarFormulario(formulario);

    ocultarResultados();

    const botonReiniciar = $(
        CONFIG?.selectores?.botonReiniciar
    );

    ocultarElemento(botonReiniciar);

    establecerEstadoCalculando(false);

    const primerCampoConfig =
        Object.values(CONFIG?.campos || {})[0];

    if (primerCampoConfig) {

        const primerCampo = $(
            primerCampoConfig.selector
        );

        if (primerCampo) {

            enfocarElemento(primerCampo);

        }

    }

}


/* =====================================================
   15. PORTAPAPELES Y COMPARTIR
===================================================== */

async function copiarTexto(texto) {

    try {

        await navigator.clipboard.writeText(
            String(texto)
        );

        return true;

    } catch (error) {

        debugError(
            "No se pudo copiar el texto.",
            error
        );

        return false;

    }

}


async function compartirContenido(datos = {}) {

    if (!navigator.share) {

        return false;

    }

    try {

        await navigator.share({

            title:
                datos.title ||
                CONFIG?.herramienta?.nombre ||
                "Imoancy",

            text:
                datos.text || "",

            url:
                datos.url ||
                CONFIG?.herramienta?.url ||
                window.location.href

        });

        return true;

    } catch (error) {

        if (error.name !== "AbortError") {

            debugError(
                "No se pudo compartir el resultado.",
                error
            );

        }

        return false;

    }

}


/* =====================================================
   16. ALMACENAMIENTO LOCAL
===================================================== */

function obtenerClaveAlmacenamiento(sufijo = "") {

    const prefijo =
        CONFIG?.almacenamiento?.prefijo || "h360";

    const clave =
        CONFIG?.almacenamiento?.clave ||
        CONFIG?.herramienta?.proyecto ||
        "herramienta";

    return `${prefijo}-${clave}${sufijo ? `-${sufijo}` : ""}`;

}


function guardarLocal(clave, datos) {

    try {

        localStorage.setItem(
            obtenerClaveAlmacenamiento(clave),
            JSON.stringify(datos)
        );

        return true;

    } catch (error) {

        debugError(
            "No se pudieron guardar los datos.",
            error
        );

        return false;

    }

}


function recuperarLocal(clave) {

    try {

        const datos = localStorage.getItem(
            obtenerClaveAlmacenamiento(clave)
        );

        return datos
            ? JSON.parse(datos)
            : null;

    } catch (error) {

        debugError(
            "No se pudieron recuperar los datos.",
            error
        );

        return null;

    }

}


function eliminarLocal(clave) {

    try {

        localStorage.removeItem(
            obtenerClaveAlmacenamiento(clave)
        );

        return true;

    } catch (error) {

        debugError(
            "No se pudieron eliminar los datos.",
            error
        );

        return false;

    }

}


/* =====================================================
   17. DEPURACIÓN
===================================================== */

function debugLog(...datos) {

    if (!CONFIG?.desarrollo?.debug) return;

    console.log(
        "[Imoancy]",
        ...datos
    );

}


function debugAdvertencia(...datos) {

    if (!CONFIG?.desarrollo?.debug) return;

    console.warn(
        "[Imoancy]",
        ...datos
    );

}


function debugError(...datos) {

    if (!CONFIG?.desarrollo?.debug) return;

    console.error(
        "[Imoancy]",
        ...datos
    );

}


/* =====================================================
   18. INICIALIZACIÓN DEL CORE
===================================================== */

function iniciarCoreImoancy() {

    ocultarResultados();

    limpiarTodosLosErrores();

    prepararLimpiezaErroresAlEditar();

    const botonReiniciar = $(
        CONFIG?.selectores?.botonReiniciar
    );

    ocultarElemento(botonReiniciar);


    if (
        CONFIG?.desarrollo?.mostrarConfiguracion
    ) {

        debugLog(
            "Configuración cargada:",
            CONFIG
        );

    }

    debugLog(
        `${CONFIG?.herramienta?.nombre || "Herramienta"} iniciada correctamente.`
    );

}


document.addEventListener(
    "DOMContentLoaded",
    iniciarCoreImoancy
);
