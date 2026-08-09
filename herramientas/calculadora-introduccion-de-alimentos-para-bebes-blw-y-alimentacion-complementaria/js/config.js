/* Imoancy Template v3.1 Stable · Configuración */
"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de Introducción de Alimentos para Bebés PRO",
        nombreCorto: "Introducción de alimentos",
        proyecto: "calculadora-introduccion-de-alimentos-para-bebes-blw-y-alimentacion-complementaria",
        categoria: "Salud y familia",
        icono: "🥣",
        version: "1.0",
        fechaActualizacion: "2 de agosto de 2026",
        fechaISO: "2026-08-02",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-introduccion-de-alimentos-para-bebes-blw-y-alimentacion-complementaria/",
        urlPortal: "https://imoancy.com/"
    },
    formato: { locale: "es-ES", moneda: "EUR", decimales: 0, decimalesPorcentaje: 0, usarSeparadorMiles: true, mostrarCerosFinales: false },
    comportamiento: { scrollResultados: true, scrollSuave: true, enfocarPrimerError: true, ocultarResultadosAlEditar: false, limpiarErroresAlEditar: true, mostrarBotonReiniciar: true, bloquearBotonDuranteCalculo: true, tiempoBloqueoBoton: 300 },
    campos: {
        fechaNacimiento: {
            nombre: "Fecha de nacimiento", selector: "#fechaNacimiento", selectorError: "#errorFechaNacimiento",
            tipo: "texto", obligatorio: true,
            mensajes: { obligatorio: "Introduce la fecha de nacimiento.", invalido: "Introduce una fecha de nacimiento válida." }
        },
        prematuro: {
            nombre: "Prematuridad", selector: "#prematuro", selectorError: "#errorPrematuro",
            tipo: "select", obligatorio: true,
            mensajes: { obligatorio: "Indica si el bebé nació prematuro.", invalido: "Selecciona una opción válida." }
        },
        edadGestacional: {
            nombre: "Edad gestacional", selector: "#edadGestacional", selectorError: "#errorEdadGestacional",
            tipo: "numero", obligatorio: false, minimo: 22, maximo: 36, permitirCero: false,
            mensajes: { obligatorio: "Introduce la edad gestacional.", invalido: "Introduce semanas completas válidas.", minimo: "El mínimo es 22 semanas.", maximo: "El máximo es 36 semanas." }
        },
        metodo: {
            nombre: "Método preferido", selector: "#metodo", selectorError: "#errorMetodo",
            tipo: "select", obligatorio: true,
            mensajes: { obligatorio: "Selecciona un método preferido.", invalido: "Selecciona una opción válida." }
        }
    },
    resultadoPrincipal: { selectorValor: "#resultadoPrincipal", selectorUnidad: "#unidadResultadoPrincipal", selectorDescripcion: "#descripcionResultadoPrincipal", titulo: "Situación orientativa", unidad: "", icono: "🌱", decimales: 0, formato: "texto", descripcion: "Valoración educativa basada en la edad que corresponde considerar." },
    resultadosSecundarios: [
        { clave: "cronologica", selectorValor: "#resultadoCronologica", titulo: "Edad cronológica", unidad: "", formato: "texto", decimales: 0 },
        { clave: "corregida", selectorValor: "#resultadoCorregida", titulo: "Edad corregida", unidad: "", formato: "texto", decimales: 0 },
        { clave: "metodo", selectorValor: "#resultadoMetodo", titulo: "Método preferido", unidad: "", formato: "texto", decimales: 0 }
    ],
    textosResultado: { resumen: "Orientación personalizada sobre el momento de la alimentación complementaria.", interpretacion: "Cada bebé tiene su propio ritmo." },
    recomendaciones: [],
    mensajes: { formularioIncompleto: "Revisa los campos señalados.", sinResultados: "No hay resultados disponibles.", copiado: "Resultado copiado.", errorCopiar: "No se ha podido copiar el resultado.", errorCompartir: "No se ha podido compartir el resultado." },
    selectores: { formulario: "#formularioHerramienta", botonCalcular: "#botonCalcular", botonReiniciar: "#botonReiniciar", seccionResultados: "#resultados", resumenResultado: "#resumenResultado", interpretacionResultado: "#interpretacionResultado", listaRecomendaciones: "#listaRecomendaciones" },
    botones: { calcular: { textoNormal: "Ver orientación personalizada", textoProcesando: "Calculando…", desactivarDuranteCalculo: true } },
    accesibilidad: { enfocarPrimerError: true, enfocarResultados: true },
    analitica: { activa: false, id: "" },
    desarrollo: { debug: false }
};
