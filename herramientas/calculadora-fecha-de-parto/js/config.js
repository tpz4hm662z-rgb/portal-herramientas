"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de Fecha de Parto PRO",
        nombreCorto: "Fecha de Parto PRO",
        proyecto: "calculadora-fecha-de-parto",
        categoria: "Embarazo y Bebés",
        icono: "🤰",
        version: "1.0",
        fechaActualizacion: "30 de julio de 2026",
        fechaISO: "2026-07-30",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-fecha-de-parto/",
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
        metodo: {
            nombre: "Método de cálculo",
            selector: "input[name=\"metodo\"]",
            selectorError: "#errorMetodo",
            tipo: "radio",
            obligatorio: true,
            mensajes: { obligatorio: "Selecciona un método de cálculo." }
        },
        fum: {
            nombre: "Fecha de última menstruación",
            selector: "#fum",
            selectorError: "#errorFum",
            tipo: "texto",
            obligatorio: false,
            mensajes: { obligatorio: "Introduce la fecha de tu última menstruación." }
        },
        fpp: {
            nombre: "Fecha probable de parto",
            selector: "#fpp",
            selectorError: "#errorFpp",
            tipo: "texto",
            obligatorio: false,
            mensajes: { obligatorio: "Introduce la fecha probable de parto." }
        }
    },
    resultadoPrincipal: {
        selectorValor: "#resultadoPrincipal",
        selectorUnidad: "#unidadResultadoPrincipal",
        selectorDescripcion: "#descripcionResultadoPrincipal",
        titulo: "Fecha probable de parto",
        unidad: "",
        icono: "📅",
        decimales: 0,
        formato: "texto",
        descripcion: "Estimación basada en un embarazo estándar de 40 semanas."
    },
    resultadosSecundarios: [
        { clave: "edadGestacional", selectorValor: "#resultadoEdad", titulo: "Edad gestacional", formato: "texto" },
        { clave: "trimestre", selectorValor: "#resultadoTrimestre", titulo: "Trimestre actual", formato: "texto" },
        { clave: "concepcion", selectorValor: "#resultadoConcepcion", titulo: "Concepción aproximada", formato: "texto" },
        { clave: "fum", selectorValor: "#resultadoFum", titulo: "Última menstruación", formato: "texto" },
        { clave: "diasRestantes", selectorValor: "#resultadoDias", titulo: "Tiempo hasta la FPP", formato: "texto" },
        { clave: "porcentaje", selectorValor: "#resultadoPorcentaje", titulo: "Embarazo completado", formato: "texto" }
    ],
    textosResultado: {
        resumen: "",
        interpretacion: "La fecha es orientativa y puede ajustarse durante el seguimiento prenatal.",
        aviso: "Esta herramienta no sustituye el seguimiento prenatal."
    },
    recomendaciones: [
        "Lleva esta estimación a tus revisiones prenatales.",
        "La ecografía puede ajustar la fecha probable de parto.",
        "Consulta cualquier duda con tu matrona, ginecólogo u otro profesional sanitario."
    ],
    mensajes: {
        errorGeneral: "Revisa la fecha indicada antes de continuar.",
        errorCalculo: "No se ha podido realizar el cálculo.",
        formularioIncompleto: "Completa correctamente la fecha.",
        sinResultados: "No hay resultados disponibles.",
        reinicioCorrecto: "La calculadora se ha reiniciado correctamente."
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
        calcular: { textoNormal: "Calcular fecha de parto", textoProcesando: "Calculando...", desactivarDuranteCalculo: true },
        reiniciar: { texto: "Reiniciar calculadora" }
    },
    funciones: {},
    almacenamiento: { prefijo: "h360", clave: "calculadora-fecha-de-parto", guardarFormulario: false, guardarResultado: false },
    accesibilidad: { anunciarResultados: true, anunciarErrores: true, enfocarResultados: false, enfocarPrimerError: true },
    desarrollo: { debug: false, mostrarConfiguracion: false, registrarCalculos: false }
};

Object.freeze(CONFIG);
