/* =====================================================
   IMOANCY TEMPLATE · CONFIGURACIÓN
   Asistente de Recuperación Posparto PRO
===================================================== */

"use strict";

const crearCampo = (nombre, selector, selectorError, tipo, mensajes, extras = {}) => ({
    nombre, selector, selectorError, tipo, obligatorio: true, mensajes, ...extras
});

const CONFIG = {
    herramienta: {
        nombre: "Asistente de Recuperación Posparto PRO",
        nombreCorto: "Recuperación Posparto PRO",
        proyecto: "asistente-recuperacion-posparto-pro",
        categoria: "Salud y bienestar",
        icono: "🌿",
        version: "1.0.0-rc.1",
        fechaActualizacion: "3 de agosto de 2026",
        fechaISO: "2026-08-03",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/asistente-de-recuperacion-posparto/",
        urlPortal: "https://imoancy.com/"
    },
    formato: { locale: "es-ES", moneda: "EUR", decimales: 2, decimalesPorcentaje: 2, usarSeparadorMiles: true, mostrarCerosFinales: true },
    comportamiento: { scrollResultados: false, scrollSuave: true, enfocarPrimerError: true, ocultarResultadosAlEditar: true, limpiarErroresAlEditar: true, mostrarBotonReiniciar: true, bloquearBotonDuranteCalculo: true, tiempoBloqueoBoton: 300 },
    campos: {
        edad: crearCampo("Edad", "#edad", "#errorEdad", "numero", { obligatorio: "Introduce tu edad.", invalido: "Introduce una edad válida.", minimo: "La edad debe ser de al menos 12 años.", maximo: "La edad no puede superar los 70 años." }, { minimo: 12, maximo: 70, permitirCero: false }),
        altura: crearCampo("Altura", "#altura", "#errorAltura", "numero", { obligatorio: "Introduce tu altura.", invalido: "Introduce una altura válida.", minimo: "La altura mínima admitida es 100 cm.", maximo: "La altura máxima admitida es 230 cm." }, { minimo: 100, maximo: 230, permitirCero: false }),
        pesoAntes: crearCampo("Peso antes del embarazo", "#pesoAntes", "#errorPesoAntes", "numero", { obligatorio: "Introduce tu peso antes del embarazo.", invalido: "Introduce un peso válido.", minimo: "El peso debe ser de al menos 25 kg.", maximo: "El peso no puede superar los 300 kg." }, { minimo: 25, maximo: 300, permitirCero: false }),
        pesoActual: crearCampo("Peso actual", "#pesoActual", "#errorPesoActual", "numero", { obligatorio: "Introduce tu peso actual.", invalido: "Introduce un peso válido.", minimo: "El peso debe ser de al menos 25 kg.", maximo: "El peso no puede superar los 300 kg." }, { minimo: 25, maximo: 300, permitirCero: false }),
        fechaParto: crearCampo("Fecha del parto", "#fechaParto", "#errorFechaParto", "texto", { obligatorio: "Selecciona la fecha del parto.", invalido: "Selecciona una fecha válida que no sea futura." }),
        tipoParto: crearCampo("Tipo de parto", "#tipoParto", "#errorTipoParto", "select", { obligatorio: "Selecciona el tipo de parto.", invalido: "Selecciona una opción válida." }),
        lactancia: crearCampo("Lactancia", "#lactancia", "#errorLactancia", "select", { obligatorio: "Selecciona el tipo de lactancia.", invalido: "Selecciona una opción válida." }),
        actividadAntes: crearCampo("Actividad antes del embarazo", "input[name='actividadAntes']", "#errorActividadAntes", "radio", { obligatorio: "Selecciona tu nivel de actividad anterior.", invalido: "Selecciona una opción válida." }),
        actividadActual: crearCampo("Actividad actual", "input[name='actividadActual']", "#errorActividadActual", "radio", { obligatorio: "Selecciona tu actividad actual.", invalido: "Selecciona una opción válida." })
    },
    resultadoPrincipal: { selectorValor: "#resultadoPrincipal", selectorUnidad: "#unidadResultadoPrincipal", selectorDescripcion: "#descripcionResultadoPrincipal", titulo: "Resultado", unidad: "", icono: "🌿", decimales: 0, formato: "texto", descripcion: "" },
    resultadosSecundarios: [],
    textosResultado: { resumen: "", interpretacion: "", aviso: "Información orientativa. No sustituye la valoración médica." },
    recomendaciones: [],
    mensajes: { errorGeneral: "Revisa los campos marcados antes de continuar.", errorCalculo: "No se ha podido analizar el formulario.", formularioIncompleto: "Completa correctamente todos los campos.", reinicioCorrecto: "El formulario se ha reiniciado correctamente.", copiando: "", copiado: "", errorCopiar: "", compartido: "", errorCompartir: "" },
    selectores: { formulario: "#formularioHerramienta", botonCalcular: "#botonCalcular", botonReiniciar: "#botonReiniciar", seccionResultados: "#resultados", resumenResultado: "#resumenResultado", interpretacionResultado: "#interpretacionResultado", listaRecomendaciones: "#listaRecomendaciones" },
    botones: { calcular: { textoNormal: "Analizar mi recuperación", textoProcesando: "Analizando…", desactivarDuranteCalculo: true }, reiniciar: { texto: "Reiniciar" } },
    funciones: { copiarResultado: false, compartirResultado: false, exportarPDF: false, imprimirResultado: false, guardarLocalmente: false, recuperarUltimoCalculo: false, analiticaEventos: true },
    almacenamiento: { prefijo: "h360", clave: "asistente-recuperacion-posparto-pro", guardarFormulario: false, guardarResultado: false },
    accesibilidad: { anunciarResultados: true, anunciarErrores: true, enfocarResultados: false, enfocarPrimerError: true }
};

Object.freeze(CONFIG);
