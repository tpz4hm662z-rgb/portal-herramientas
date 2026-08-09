"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de Percentiles de Crecimiento del Bebé PRO",
        nombreCorto: "Percentiles del bebé",
        proyecto: "calculadora-percentiles-crecimiento-bebe",
        categoria: "Salud y bienestar",
        icono: "👶",
        version: "1.0",
        fechaActualizacion: "30 de julio de 2026",
        fechaISO: "2026-07-30",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-de-percentiles-de-crecimiento-del-bebe/",
        urlPortal: "https://imoancy.com/"
    },
    formato: { locale: "es-ES", moneda: "EUR", decimales: 2, decimalesPorcentaje: 1, usarSeparadorMiles: true, mostrarCerosFinales: false },
    comportamiento: { scrollResultados: true, scrollSuave: true, enfocarPrimerError: true, ocultarResultadosAlEditar: false, limpiarErroresAlEditar: true, mostrarBotonReiniciar: true, bloquearBotonDuranteCalculo: true, tiempoBloqueoBoton: 0 },
    campos: {
        sexo: { nombre: "Sexo", selector: "input[name=\"sexo\"]", selectorError: "#errorSexo", tipo: "radio", obligatorio: true, mensajes: { obligatorio: "Selecciona el sexo." } },
        edad: { nombre: "Edad", selector: "#edad", selectorError: "#errorEdad", tipo: "numero", obligatorio: true, minimo: 0, maximo: 1826, permitirCero: true, mensajes: { obligatorio: "Introduce la edad del bebé.", invalido: "Introduce una edad válida.", minimo: "La edad no puede ser negativa.", maximo: "La edad debe estar entre el nacimiento y los 5 años." } },
        unidadEdad: { nombre: "Unidad de edad", selector: "#unidadEdad", selectorError: "#errorEdad", tipo: "select", obligatorio: true, mensajes: { obligatorio: "Selecciona la unidad de edad." } },
        medicion: { nombre: "Medición", selector: "#medicion", selectorError: "#errorMedicion", tipo: "select", obligatorio: true, mensajes: { obligatorio: "Selecciona el tipo de medición." } },
        valor: { nombre: "Valor", selector: "#valor", selectorError: "#errorValor", tipo: "numero", obligatorio: true, minimo: 0.1, maximo: 130, permitirCero: false, mensajes: { obligatorio: "Introduce el valor medido.", invalido: "Introduce un número válido.", minimo: "El valor debe ser mayor que cero.", maximo: "El valor está fuera del rango admitido." } },
        postura: { nombre: "Postura", selector: "#postura", selectorError: "#errorPostura", tipo: "select", obligatorio: false, mensajes: { invalido: "Selecciona cómo se realizó la medición." } }
    },
    selectores: { formulario: "#formularioHerramienta", botonCalcular: "#botonCalcular", botonReiniciar: "#botonReiniciar", seccionResultados: "#resultados", resumenResultado: "#resumenResultado", interpretacionResultado: "#interpretacionResultado", listaRecomendaciones: "#listaRecomendaciones" },
    botones: { calcular: { textoNormal: "Calcular percentil", textoProcesando: "Calculando…", desactivarDuranteCalculo: true }, reiniciar: { texto: "Reiniciar" } },
    resultadoPrincipal: { selectorValor: "#resultadoPrincipal", selectorUnidad: null, selectorDescripcion: "#descripcionResultadoPrincipal", titulo: "Percentil estimado", unidad: "", icono: "📊", decimales: 0, formato: "texto", descripcion: "" },
    resultadosSecundarios: [],
    textosResultado: { resumen: "", interpretacion: "", aviso: "Resultado exclusivamente informativo." },
    recomendaciones: [],
    mensajes: { errorGeneral: "Revisa los campos marcados.", errorCalculo: "No se ha podido calcular el percentil.", formularioIncompleto: "Completa correctamente todos los campos.", sinResultados: "No hay resultados disponibles.", reinicioCorrecto: "La calculadora se ha reiniciado.", copiando: "", copiado: "", errorCopiar: "", compartido: "", errorCompartir: "" },
    funciones: { copiarResultado: false, compartirResultado: false, exportarPDF: false, imprimirResultado: false, guardarLocalmente: false, recuperarUltimoCalculo: false, analiticaEventos: false },
    almacenamiento: { prefijo: "h360", clave: "calculadora-percentiles-crecimiento-bebe", guardarFormulario: false, guardarResultado: false },
    accesibilidad: { anunciarResultados: true, anunciarErrores: true, enfocarResultados: true, enfocarPrimerError: true },
    desarrollo: { debug: false, mostrarConfiguracion: false, registrarCalculos: false }
};

Object.freeze(CONFIG);
