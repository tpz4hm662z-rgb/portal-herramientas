/* =====================================================
   HERRAMIENTAS360 CORE
   core.js
   Versión 3.0 Stable
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
 * @returns {NodeList|Array}
 */
const $$ = (selector, contexto = document) => {

    if (!selector || !contexto) return [];

    return contexto.querySelectorAll(selector);

};


/* =====================================================
   2. UTILIDADES DE NÚMEROS
===================================================== */

/**
 * Convierte un valor a número.
 * También admite comas como separador decimal.
 *
 * @param {*} valor
 * @returns {number}
 */
function numero(valor) {

    if (typeof valor === "string") {

        valor = valor
            .trim()
            .replace(",", ".");

    }

    return Number(valor);

}


/**
 * Comprueba si un valor es un número finito.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function esNumeroValido(valor) {

    return Number.isFinite(numero(valor));

}


/**
 * Comprueba si un número está dentro de un rango.
 *
 * @param {number} valor
 * @param {number} minimo
 * @param {number} maximo
 * @returns {boolean}
 */
function dentroDeRango(valor, minimo, maximo) {

    const valorNumerico = numero(valor);

    if (!Number.isFinite(valorNumerico)) return false;

    if (
        minimo !== undefined &&
        minimo !== null &&
        valorNumerico < minimo
    ) {

        return false;

    }

    if (
        maximo !== undefined &&
        maximo !== null &&
        valorNumerico > maximo
    ) {

        return false;

    }

    return true;

}


/**
 * Redondea un número a una cantidad de decimales.
 *
 * @param {number} valor
 * @param {number} decimales
 * @returns {number}
 */
function redondear(valor, decimales = 0) {

    const valorNumerico = numero(valor);

    if (!Number.isFinite(valorNumerico)) return 0;

    const factor = 10 ** decimales;

    return Math.round(
        (valorNumerico + Number.EPSILON) * factor
    ) / factor;

}


/**
 * Limita un número entre un mínimo y un máximo.
 *
 * @param {number} valor
 * @param {number} minimo
 * @param {number} maximo
 * @returns {number}
 */
function limitar(valor, minimo, maximo) {

    return Math.min(
        Math.max(numero(valor), minimo),
        maximo
    );

}


/**
 * Formatea un número usando formato español.
 *
 * @param {number} valor
 * @param {number} decimales
 * @returns {string}
 */
function formatearNumero(valor, decimales = 0) {

    const valorNumerico = numero(valor);

    if (!Number.isFinite(valorNumerico)) return "0";

    return new Intl.NumberFormat("es-ES", {

        minimumFractionDigits: decimales,

        maximumFractionDigits: decimales

    }).format(valorNumerico);

}


/**
 * Calcula un porcentaje de una cantidad.
 *
 * @param {number} cantidad
 * @param {number} porcentaje
 * @returns {number}
 */
function calcularPorcentaje(cantidad, porcentaje) {

    const cantidadNumerica = numero(cantidad);

    const porcentajeNumerico = numero(porcentaje);

    if (
        !Number.isFinite(cantidadNumerica) ||
        !Number.isFinite(porcentajeNumerico)
    ) {

        return 0;

    }

    return cantidadNumerica * porcentajeNumerico / 100;

}


/* =====================================================
   3. UTILIDADES DE TEXTO
===================================================== */

/**
 * Elimina espacios innecesarios de un texto.
 *
 * @param {*} valor
 * @returns {string}
 */
function limpiarTexto(valor) {

    if (valor === null || valor === undefined) {

        return "";

    }

    return String(valor).trim();

}


/**
 * Convierte la primera letra de un texto en mayúscula.
 *
 * @param {string} texto
 * @returns {string}
 */
function primeraMayuscula(texto) {

    const textoLimpio = limpiarTexto(texto);

    if (!textoLimpio) return "";

    return (
        textoLimpio.charAt(0).toUpperCase() +
        textoLimpio.slice(1)
    );

}


/**
 * Comprueba si un valor está vacío.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function estaVacio(valor) {

    return limpiarTexto(valor) === "";

}


/* =====================================================
   4. CLASES Y VISIBILIDAD
===================================================== */

/**
 * Añade una clase a un elemento.
 *
 * @param {Element|null} elemento
 * @param {string} clase
 */
function agregarClase(elemento, clase) {

    if (!elemento || !clase) return;

    elemento.classList.add(clase);

}


/**
 * Elimina una clase de un elemento.
 *
 * @param {Element|null} elemento
 * @param {string} clase
 */
function eliminarClase(elemento, clase) {

    if (!elemento || !clase) return;

    elemento.classList.remove(clase);

}


/**
 * Comprueba si un elemento contiene una clase.
 *
 * @param {Element|null} elemento
 * @param {string} clase
 * @returns {boolean}
 */
function tieneClase(elemento, clase) {

    if (!elemento || !clase) return false;

    return elemento.classList.contains(clase);

}


/**
 * Muestra un elemento.
 *
 * @param {Element|null} elemento
 * @param {string} claseOculto
 */
function mostrarElemento(
    elemento,
    claseOculto = "oculto"
) {

    if (!elemento) return;

    eliminarClase(elemento, claseOculto);

    elemento.removeAttribute("hidden");

    elemento.setAttribute("aria-hidden", "false");

}


/**
 * Oculta un elemento.
 *
 * @param {Element|null} elemento
 * @param {string} claseOculto
 */
function ocultarElemento(
    elemento,
    claseOculto = "oculto"
) {

    if (!elemento) return;

    agregarClase(elemento, claseOculto);

    elemento.setAttribute("aria-hidden", "true");

}


/**
 * Alterna la visibilidad de un elemento.
 *
 * @param {Element|null} elemento
 * @param {boolean} visible
 * @param {string} claseOculto
 */
function alternarElemento(
    elemento,
    visible,
    claseOculto = "oculto"
) {

    if (visible) {

        mostrarElemento(elemento, claseOculto);

    } else {

        ocultarElemento(elemento, claseOculto);

    }

}


/* =====================================================
   5. CAMPOS DE FORMULARIO
===================================================== */

/**
 * Obtiene un campo por su ID.
 *
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function obtenerCampo(id) {

    if (!id) return null;

    return document.getElementById(id);

}


/**
 * Obtiene el valor de un campo.
 *
 * @param {string|HTMLElement} campo
 * @returns {string}
 */
function obtenerValorCampo(campo) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return "";

    return limpiarTexto(elemento.value);

}


/**
 * Obtiene el valor numérico de un campo.
 *
 * @param {string|HTMLElement} campo
 * @returns {number}
 */
function obtenerNumeroCampo(campo) {

    return numero(obtenerValorCampo(campo));

}


/**
 * Establece el valor de un campo.
 *
 * @param {string|HTMLElement} campo
 * @param {*} valor
 */
function establecerValorCampo(campo, valor) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return;

    elemento.value = valor ?? "";

}


/**
 * Limpia el valor de un campo.
 *
 * @param {string|HTMLElement} campo
 */
function limpiarCampo(campo) {

    establecerValorCampo(campo, "");

}


/**
 * Activa o desactiva un campo.
 *
 * @param {string|HTMLElement} campo
 * @param {boolean} desactivado
 */
function desactivarCampo(campo, desactivado = true) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return;

    elemento.disabled = desactivado;

}


/**
 * Establece si un campo es obligatorio.
 *
 * @param {string|HTMLElement} campo
 * @param {boolean} obligatorio
 */
function establecerCampoObligatorio(
    campo,
    obligatorio = true
) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return;

    elemento.required = obligatorio;

    elemento.setAttribute(
        "aria-required",
        String(obligatorio)
    );

}


/* =====================================================
   6. MENSAJES DE ERROR
===================================================== */

/**
 * Obtiene el elemento de error asociado a un campo.
 *
 * Convención:
 * campo "edad" -> elemento "errorEdad"
 *
 * @param {string|HTMLElement} campo
 * @returns {HTMLElement|null}
 */
function obtenerElementoError(campo) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento || !elemento.id) return null;

    const idError =
        "error" +
        primeraMayuscula(elemento.id);

    return obtenerCampo(idError);

}


/**
 * Obtiene el contenedor visual de un campo.
 *
 * @param {HTMLElement|null} campo
 * @returns {HTMLElement|null}
 */
function obtenerContenedorCampo(campo) {

    if (!campo) return null;

    return campo.closest(".campo");

}


/**
 * Muestra un error en un campo.
 *
 * @param {string|HTMLElement} campo
 * @param {string} mensaje
 * @param {Object} opciones
 */
function mostrarErrorCampo(
    campo,
    mensaje,
    opciones = {}
) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return;

    const claseError =
        opciones.claseError ||
        CONFIG?.interfaz?.claseError ||
        "campo-error";

    const contenedor =
        obtenerContenedorCampo(elemento);

    const elementoError =
        obtenerElementoError(elemento);

    if (contenedor) {

        agregarClase(contenedor, claseError);

    }

    elemento.setAttribute(
        CONFIG?.interfaz?.atributoInvalido ||
        "aria-invalid",
        "true"
    );

    if (elementoError) {

        elementoError.textContent =
            limpiarTexto(mensaje);

        elementoError.setAttribute(
            "role",
            "alert"
        );

    }

}


/**
 * Limpia el error de un campo.
 *
 * @param {string|HTMLElement} campo
 * @param {Object} opciones
 */
function limpiarErrorCampo(
    campo,
    opciones = {}
) {

    const elemento = typeof campo === "string"
        ? obtenerCampo(campo)
        : campo;

    if (!elemento) return;

    const claseError =
        opciones.claseError ||
        CONFIG?.interfaz?.claseError ||
        "campo-error";

    const contenedor =
        obtenerContenedorCampo(elemento);

    const elementoError =
        obtenerElementoError(elemento);

    if (contenedor) {

        eliminarClase(contenedor, claseError);

    }

    elemento.removeAttribute(
        CONFIG?.interfaz?.atributoInvalido ||
        "aria-invalid"
    );

    if (elementoError) {

        elementoError.textContent = "";

        elementoError.removeAttribute("role");

    }

}


/**
 * Limpia todos los errores de un formulario.
 *
 * @param {HTMLFormElement|null} formulario
 */
function limpiarErroresFormulario(formulario) {

    if (!formulario) return;

    const campos = formulario.querySelectorAll(
        "input, select, textarea"
    );

    campos.forEach((campo) => {

        limpiarErrorCampo(campo);

    });

}


/**
 * Enfoca el primer campo que contiene un error.
 *
 * @param {HTMLFormElement|null} formulario
 */
function enfocarPrimerError(formulario) {

    if (!formulario) return;

    const selector =
        `[${CONFIG?.interfaz?.atributoInvalido || "aria-invalid"}="true"]`;

    const primerCampo =
        formulario.querySelector(selector);

    if (!primerCampo) return;

    primerCampo.focus({

        preventScroll: true

    });

    primerCampo.scrollIntoView({

        behavior:
            CONFIG?.interfaz?.comportamientoScroll ||
            "smooth",

        block: "center"

    });

}


/* =====================================================
   7. VALIDACIÓN GENERAL
===================================================== */

/**
 * Valida que un valor no esté vacío.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function validarObligatorio(valor) {

    return !estaVacio(valor);

}


/**
 * Valida que un valor pertenezca a una lista.
 *
 * @param {*} valor
 * @param {Array} opciones
 * @returns {boolean}
 */
function validarOpcion(valor, opciones = []) {

    return opciones.includes(
        limpiarTexto(valor)
    );

}


/**
 * Valida un número y su rango.
 *
 * @param {*} valor
 * @param {number} minimo
 * @param {number} maximo
 * @returns {boolean}
 */
function validarNumero(
    valor,
    minimo = null,
    maximo = null
) {

    const valorNumerico = numero(valor);

    if (!Number.isFinite(valorNumerico)) {

        return false;

    }

    return dentroDeRango(
        valorNumerico,
        minimo,
        maximo
    );

}


/**
 * Valida un campo utilizando su configuración.
 *
 * @param {HTMLElement|null} campo
 * @param {Object} configuracion
 * @param {Object} contexto
 * @returns {Object}
 */
function validarCampo(
    campo,
    configuracion = {},
    contexto = {}
) {

    if (!campo) {

        return {

            valido: false,

            mensaje:
                "No se ha encontrado el campo."

        };

    }

    const valor = obtenerValorCampo(campo);

    let obligatorio =
        configuracion.obligatorio === true;

    if (
        configuracion.obligatorioPara &&
        contexto.sexo ===
        configuracion.obligatorioPara
    ) {

        obligatorio = true;

    }

    if (obligatorio && estaVacio(valor)) {

        return {

            valido: false,

            mensaje:
                configuracion.mensajeVacio ||
                "Completa este campo."

        };

    }

    if (!obligatorio && estaVacio(valor)) {

        return {

            valido: true,

            valor: null

        };

    }

    if (configuracion.tipo === "select") {

        if (
            Array.isArray(
                configuracion.opcionesValidas
            ) &&
            !validarOpcion(
                valor,
                configuracion.opcionesValidas
            )
        ) {

            return {

                valido: false,

                mensaje:
                    configuracion.mensajeVacio ||
                    "Selecciona una opción válida."

            };

        }

        return {

            valido: true,

            valor

        };

    }

    if (configuracion.tipo === "numero") {

        const valorNumerico = numero(valor);

        if (!Number.isFinite(valorNumerico)) {

            return {

                valido: false,

                mensaje:
                    configuracion.mensajeInvalido ||
                    "Introduce un número válido."

            };

        }

        if (
            !dentroDeRango(
                valorNumerico,
                configuracion.minimo,
                configuracion.maximo
            )
        ) {

            return {

                valido: false,

                mensaje:
                    configuracion.mensajeRango ||
                    "El valor está fuera del rango permitido."

            };

        }

        return {

            valido: true,

            valor: valorNumerico

        };

    }

    return {

        valido: true,

        valor

    };

}


/**
 * Valida los campos configurados.
 *
 * @param {Object} configuracionCampos
 * @param {Object} contexto
 * @returns {Object}
 */
function validarCamposConfigurados(
    configuracionCampos = {},
    contexto = {}
) {

    let formularioValido = true;

    const datos = {};

    let primerCampoInvalido = null;

    Object.entries(
        configuracionCampos
    ).forEach(([nombre, configuracion]) => {

        const campo =
            obtenerCampo(configuracion.id);

        if (!campo) return;

        limpiarErrorCampo(campo);

        const resultado = validarCampo(
            campo,
            configuracion,
            contexto
        );

        if (!resultado.valido) {

            formularioValido = false;

            mostrarErrorCampo(
                campo,
                resultado.mensaje
            );

            if (!primerCampoInvalido) {

                primerCampoInvalido = campo;

            }

            return;

        }

        datos[nombre] = resultado.valor;

    });

    return {

        valido: formularioValido,

        datos,

        primerCampoInvalido

    };

}


/* =====================================================
   8. RESULTADOS EN PANTALLA
===================================================== */

/**
 * Establece el contenido de texto de un elemento.
 *
 * @param {string|HTMLElement} elemento
 * @param {*} valor
 */
function establecerTexto(elemento, valor) {

    const destino = typeof elemento === "string"
        ? $(elemento)
        : elemento;

    if (!destino) return;

    destino.textContent =
        valor === null ||
        valor === undefined
            ? ""
            : String(valor);

}


/**
 * Sustituye el contenido de una lista.
 *
 * @param {string|HTMLElement} lista
 * @param {Array<string>} elementos
 */
function renderizarLista(lista, elementos = []) {

    const elementoLista =
        typeof lista === "string"
            ? $(lista)
            : lista;

    if (!elementoLista) return;

    elementoLista.innerHTML = "";

    elementos.forEach((texto) => {

        const li = document.createElement("li");

        li.textContent = limpiarTexto(texto);

        elementoLista.appendChild(li);

    });

}


/**
 * Muestra la sección de resultados.
 *
 * @param {HTMLElement|null} seccion
 */
function mostrarResultados(seccion) {

    const elemento = seccion || $(
        CONFIG?.selectores?.seccionResultados
    );

    if (!elemento) return;

    mostrarElemento(
        elemento,
        CONFIG?.interfaz?.claseOculto ||
        "oculto"
    );

}


/**
 * Oculta la sección de resultados.
 *
 * @param {HTMLElement|null} seccion
 */
function ocultarResultados(seccion) {

    const elemento = seccion || $(
        CONFIG?.selectores?.seccionResultados
    );

    if (!elemento) return;

    ocultarElemento(
        elemento,
        CONFIG?.interfaz?.claseOculto ||
        "oculto"
    );

}


/**
 * Desplaza la pantalla hasta un elemento.
 *
 * @param {HTMLElement|null} elemento
 * @param {Object} opciones
 */
function desplazarAElemento(
    elemento,
    opciones = {}
) {

    if (!elemento) return;

    elemento.scrollIntoView({

        behavior:
            opciones.behavior ||
            CONFIG?.interfaz?.comportamientoScroll ||
            "smooth",

        block:
            opciones.block ||
            CONFIG?.interfaz?.bloqueScroll ||
            "start"

    });

}


/* =====================================================
   9. BOTONES Y ESTADOS
===================================================== */

/**
 * Cambia el texto y estado de un botón.
 *
 * @param {HTMLButtonElement|null} boton
 * @param {Object} opciones
 */
function actualizarBoton(
    boton,
    opciones = {}
) {

    if (!boton) return;

    if (
        opciones.texto !== undefined
    ) {

        boton.textContent =
            opciones.texto;

    }

    if (
        opciones.desactivado !== undefined
    ) {

        boton.disabled =
            opciones.desactivado;

    }

    if (
        opciones.cargando !== undefined
    ) {

        boton.setAttribute(
            "aria-busy",
            String(opciones.cargando)
        );

    }

}


/**
 * Muestra el botón de reinicio.
 *
 * @param {HTMLButtonElement|null} boton
 */
function mostrarBotonReiniciar(boton) {

    if (!boton) return;

    mostrarElemento(
        boton,
        CONFIG?.interfaz?.claseOculto ||
        "oculto"
    );

}


/**
 * Oculta el botón de reinicio.
 *
 * @param {HTMLButtonElement|null} boton
 */
function ocultarBotonReiniciar(boton) {

    if (!boton) return;

    ocultarElemento(
        boton,
        CONFIG?.interfaz?.claseOculto ||
        "oculto"
    );

}


/* =====================================================
   10. CLASIFICACIONES
===================================================== */

/**
 * Busca una clasificación según un valor.
 *
 * @param {number} valor
 * @param {Array<Object>} clasificaciones
 * @returns {Object|null}
 */
function obtenerClasificacion(
    valor,
    clasificaciones = []
) {

    const valorNumerico = numero(valor);

    if (!Number.isFinite(valorNumerico)) {

        return null;

    }

    return clasificaciones.find(
        (clasificacion) => {

            return (
                valorNumerico >=
                    clasificacion.minimo &&
                valorNumerico <=
                    clasificacion.maximo
            );

        }
    ) || null;

}


/**
 * Combina recomendaciones específicas y generales.
 *
 * @param {Array<string>} especificas
 * @param {Array<string>} generales
 * @param {number} limite
 * @returns {Array<string>}
 */
function combinarRecomendaciones(
    especificas = [],
    generales = [],
    limite = 5
) {

    const resultado = [];

    const agregarSinDuplicar = (texto) => {

        const textoLimpio = limpiarTexto(texto);

        if (
            textoLimpio &&
            !resultado.includes(textoLimpio)
        ) {

            resultado.push(textoLimpio);

        }

    };

    especificas.forEach(agregarSinDuplicar);

    generales.forEach(agregarSinDuplicar);

    return resultado.slice(0, limite);

}


/* =====================================================
   11. ANALÍTICA
===================================================== */

/**
 * Envía un evento a Google Analytics.
 *
 * @param {string} nombreEvento
 * @param {Object} parametros
 */
function registrarEvento(
    nombreEvento,
    parametros = {}
) {

    if (
        CONFIG?.analitica?.activa !== true
    ) {

        return;

    }

    if (
        typeof window.gtag !== "function"
    ) {

        return;

    }

    try {

        window.gtag(
            "event",
            nombreEvento,
            {

                event_category:
                    CONFIG?.analitica?.categoria ||
                    "Herramientas360",

                herramienta:
                    CONFIG?.analitica?.herramienta ||
                    CONFIG?.herramienta?.nombre ||
                    "Herramienta",

                ...parametros

            }
        );

    } catch (error) {

        console.warn(
            "No se pudo registrar el evento:",
            error
        );

    }

}


/* =====================================================
   12. ACCESIBILIDAD
===================================================== */

/**
 * Anuncia un mensaje a lectores de pantalla.
 *
 * @param {string} mensaje
 * @param {"polite"|"assertive"} prioridad
 */
function anunciarMensaje(
    mensaje,
    prioridad = "polite"
) {

    if (!mensaje) return;

    let zona = document.getElementById(
        "zonaAnunciosAccesibles"
    );

    if (!zona) {

        zona = document.createElement("div");

        zona.id =
            "zonaAnunciosAccesibles";

        zona.className =
            "solo-lectores-pantalla";

        zona.setAttribute(
            "aria-live",
            prioridad
        );

        zona.setAttribute(
            "aria-atomic",
            "true"
        );

        zona.style.position = "absolute";

        zona.style.width = "1px";

        zona.style.height = "1px";

        zona.style.padding = "0";

        zona.style.margin = "-1px";

        zona.style.overflow = "hidden";

        zona.style.clip =
            "rect(0, 0, 0, 0)";

        zona.style.whiteSpace = "nowrap";

        zona.style.border = "0";

        document.body.appendChild(zona);

    }

    zona.setAttribute(
        "aria-live",
        prioridad
    );

    zona.textContent = "";

    window.setTimeout(() => {

        zona.textContent = mensaje;

    }, 50);

}


/* =====================================================
   13. FORMULARIOS
===================================================== */

/**
 * Reinicia un formulario.
 *
 * @param {HTMLFormElement|null} formulario
 */
function reiniciarFormulario(formulario) {

    if (!formulario) return;

    formulario.reset();

    limpiarErroresFormulario(formulario);

}


/**
 * Añade limpieza de error mientras el usuario escribe.
 *
 * @param {HTMLFormElement|null} formulario
 */
function activarLimpiezaErrores(formulario) {

    if (!formulario) return;

    if (
        CONFIG?.interfaz
            ?.limpiarErroresAlEscribir !== true
    ) {

        return;

    }

    formulario.addEventListener(
        "input",
        (evento) => {

            const campo = evento.target;

            if (
                campo.matches(
                    "input, select, textarea"
                )
            ) {

                limpiarErrorCampo(campo);

            }

        }
    );

    formulario.addEventListener(
        "change",
        (evento) => {

            const campo = evento.target;

            if (
                campo.matches(
                    "input, select, textarea"
                )
            ) {

                limpiarErrorCampo(campo);

            }

        }
    );

}


/**
 * Devuelve todos los datos de un formulario.
 *
 * @param {HTMLFormElement|null} formulario
 * @returns {Object}
 */
function obtenerDatosFormulario(formulario) {

    if (!formulario) return {};

    const formData =
        new FormData(formulario);

    return Object.fromEntries(
        formData.entries()
    );

}


/* =====================================================
   14. SEGURIDAD Y CONTROL DE ERRORES
===================================================== */

/**
 * Ejecuta una función capturando posibles errores.
 *
 * @param {Function} funcion
 * @param {Function|null} alFallar
 * @returns {*}
 */
function ejecutarSeguro(
    funcion,
    alFallar = null
) {

    try {

        return funcion();

    } catch (error) {

        console.error(
            "Error en Herramientas360:",
            error
        );

        if (
            typeof alFallar === "function"
        ) {

            return alFallar(error);

        }

        return null;

    }

}


/**
 * Comprueba que CONFIG exista.
 *
 * @returns {boolean}
 */
function comprobarConfiguracion() {

    if (
        typeof CONFIG === "undefined" ||
        !CONFIG
    ) {

        console.error(
            "No se ha cargado config.js."
        );

        return false;

    }

    return true;

}


/**
 * Comprueba que exista un conjunto de elementos.
 *
 * @param {Object<string, Element|null>} elementos
 * @returns {boolean}
 */
function comprobarElementos(elementos = {}) {

    const elementosAusentes =
        Object.entries(elementos)
            .filter(([, elemento]) => !elemento)
            .map(([nombre]) => nombre);

    if (elementosAusentes.length > 0) {

        console.error(
            "Faltan elementos del DOM:",
            elementosAusentes.join(", ")
        );

        return false;

    }

    return true;

}


/* =====================================================
   15. EVENTO DOM CARGADO
===================================================== */

/**
 * Ejecuta una función cuando el DOM esté preparado.
 *
 * @param {Function} funcion
 */
function alCargarDocumento(funcion) {

    if (typeof funcion !== "function") {

        return;

    }

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            funcion,
            { once: true }
        );

    } else {

        funcion();

    }

}


/* =====================================================
   16. INFORMACIÓN DEL CORE
===================================================== */

const H360_CORE = Object.freeze({

    nombre: "Herramientas360 Core",

    version: "3.0 Stable",

    autor: "José Carlos Núñez Florido",

    cargado: true

});


console.info(
    `${H360_CORE.nombre} · ${H360_CORE.version}`
);