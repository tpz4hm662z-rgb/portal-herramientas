/* Imoancy Template v3.1 Stable · Configuración */
"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de edad corregida para bebés prematuros",
        nombreCorto: "Edad corregida",
        proyecto: "calculadora-de-edad-corregida-para-bebes-prematuros",
        categoria: "Salud y bienestar",
        icono: "👶",
        version: "1.0",
        fechaActualizacion: "1 de agosto de 2026",
        fechaISO: "2026-08-01",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-de-edad-corregida-para-bebes-prematuros/",
        urlPortal: "https://imoancy.com/"
    },
    formato: {
        locale: "es-ES",
        moneda: "EUR",
        decimales: 0,
        decimalesPorcentaje: 0,
        usarSeparadorMiles: true,
        mostrarCerosFinales: false
    },
    comportamiento: {
        scrollResultados: true,
        scrollSuave: true,
        enfocarPrimerError: true,
        ocultarResultadosAlEditar: false,
        limpiarErroresAlEditar: true,
        mostrarBotonReiniciar: true,
        bloquearBotonDuranteCalculo: true,
        tiempoBloqueoBoton: 300
    },
    campos: {
        fechaNacimiento: {
            nombre: "Fecha de nacimiento",
            selector: "#fechaNacimiento",
            selectorError: "#errorFechaNacimiento",
            tipo: "texto",
            obligatorio: true,
            mensajes: { obligatorio: "Indica la fecha de nacimiento del bebé." }
        },
        semanasGestacion: {
            nombre: "Semanas de gestación",
            selector: "#semanasGestacion",
            selectorError: "#errorSemanasGestacion",
            tipo: "numero",
            obligatorio: true,
            minimo: 22,
            maximo: 39,
            permitirCero: false,
            mensajes: { obligatorio: "Indica las semanas de gestación.", invalido: "Introduce un número entero válido.", minimo: "Para este cálculo, indica 22 semanas o más.", maximo: "La edad corregida se utiliza en nacimientos anteriores a 40 semanas." }
        },
        diasGestacion: {
            nombre: "Días de gestación",
            selector: "#diasGestacion",
            selectorError: "#errorDiasGestacion",
            tipo: "numero",
            obligatorio: true,
            minimo: 0,
            maximo: 6,
            permitirCero: true,
            mensajes: { obligatorio: "Indica los días adicionales (0 si no hubo).", invalido: "Introduce un número entre 0 y 6.", minimo: "El mínimo es 0 días.", maximo: "Indica un máximo de 6 días." }
        },
        fechaReferencia: {
            nombre: "Fecha de referencia",
            selector: "#fechaReferencia",
            selectorError: "#errorFechaReferencia",
            tipo: "texto",
            obligatorio: true,
            mensajes: { obligatorio: "Indica la fecha en la que quieres calcular la edad." }
        }
    },
    resultadoPrincipal: {
        selectorValor: "#resultadoPrincipal",
        selectorUnidad: "#unidadResultadoPrincipal",
        selectorDescripcion: "#descripcionResultadoPrincipal",
        titulo: "Edad corregida",
        unidad: "",
        icono: "💛",
        decimales: 0,
        formato: "texto",
        descripcion: "Edad ajustada al tiempo de gestación que faltó hasta completar 40 semanas."
    },
    resultadosSecundarios: [
        { clave: "edadCronologica", selectorValor: "#resultadoSecundarioUno", selectorTitulo: null, selectorUnidad: null, titulo: "Edad cronológica", unidad: "", icono: "📅", decimales: 0, formato: "texto", descripcion: "Tiempo desde el nacimiento." },
        { clave: "fechaProbableParto", selectorValor: "#resultadoSecundarioDos", selectorTitulo: null, selectorUnidad: null, titulo: "Fecha probable de parto", unidad: "", icono: "🗓️", decimales: 0, formato: "texto", descripcion: "Fecha estimada de 40 semanas." },
        { clave: "prematuridad", selectorValor: "#resultadoSecundarioTres", selectorTitulo: null, selectorUnidad: null, titulo: "Tiempo de prematuridad", unidad: "", icono: "⏱️", decimales: 0, formato: "texto", descripcion: "Tiempo que se descuenta." }
    ],
    textosResultado: {
        resumen: "Resultado calculado con los datos introducidos.",
        interpretacion: "La edad corregida ayuda a contextualizar el desarrollo temprano.",
        aviso: "Información educativa y orientativa."
    },
    recomendaciones: [
        "Usa la edad corregida como referencia flexible, no como una fecha límite para alcanzar hitos.",
        "Para vacunas y citas suele utilizarse la edad cronológica; confirma siempre el calendario con pediatría.",
        "Comenta cualquier duda sobre crecimiento o desarrollo con el equipo sanitario que conoce a tu bebé."
    ],
    mensajes: {
        errorGeneral: "Revisa los campos marcados antes de continuar.",
        errorCalculo: "No se ha podido realizar el cálculo.",
        formularioIncompleto: "Completa correctamente todos los campos.",
        sinResultados: "No hay resultados disponibles.",
        reinicioCorrecto: "La herramienta se ha reiniciado correctamente."
    },
    selectores: {
        formulario: "#formularioHerramienta",
        botonCalcular: "#botonCalcular",
        botonReiniciar: "#botonReiniciar",
        seccionResultados: "#resultados",
        resumenResultado: "#resumenResultado",
        interpretacionResultado: "#interpretacionResultado",
        listaRecomendaciones: "#listaRecomendaciones"
    },
    botones: {
        calcular: { textoNormal: "Calcular edad corregida", textoProcesando: "Calculando…", desactivarDuranteCalculo: true },
        reiniciar: { texto: "Reiniciar" }
    },
    funciones: { copiarResultado: false, compartirResultado: false, exportarPDF: false, imprimirResultado: false, guardarLocalmente: false, recuperarUltimoCalculo: false, analiticaEventos: true },
    almacenamiento: { prefijo: "h360", clave: "edad-corregida", guardarFormulario: false, guardarResultado: false },
    accesibilidad: { anunciarResultados: true, anunciarErrores: true, enfocarResultados: false, enfocarPrimerError: true },
    desarrollo: { debug: false, mostrarConfiguracion: false, registrarCalculos: false }
};

Object.freeze(CONFIG);
