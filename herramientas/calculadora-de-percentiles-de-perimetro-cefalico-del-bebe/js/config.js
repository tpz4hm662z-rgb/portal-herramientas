/* Imoancy Template v3.1 — configuración de la herramienta */
"use strict";

const CONFIG = {
    herramienta: {
        nombre: "Calculadora de Percentiles de Perímetro Cefálico del Bebé PRO",
        nombreCorto: "Percentil cefálico bebé",
        proyecto: "calculadora-de-percentiles-de-perimetro-cefalico-del-bebe",
        categoria: "Embarazo y bebés",
        icono: "👶",
        version: "1.0",
        fechaActualizacion: "2 de agosto de 2026",
        fechaISO: "2026-08-02",
        autor: "José Carlos Núñez Florido",
        marca: "Imoancy",
        url: "https://imoancy.com/herramientas/calculadora-de-percentiles-de-perimetro-cefalico-del-bebe/",
        urlPortal: "https://imoancy.com/"
    },
    formato: { locale: "es-ES", moneda: "EUR", decimales: 1, decimalesPorcentaje: 1, usarSeparadorMiles: true, mostrarCerosFinales: false },
    comportamiento: { scrollResultados: true, scrollSuave: true, enfocarPrimerError: true, ocultarResultadosAlEditar: true, limpiarErroresAlEditar: true, mostrarBotonReiniciar: true, bloquearBotonDuranteCalculo: true, tiempoBloqueoBoton: 300 },
    campos: {
        datoUno: {
            nombre: "Edad", selector: "#datoUno", selectorError: "#errorDatoUno", tipo: "numero", obligatorio: true,
            minimo: 0, maximo: 60, permitirCero: true,
            mensajes: { obligatorio: "Introduce la edad del bebé.", invalido: "Introduce una edad válida en meses.", minimo: "La edad no puede ser negativa.", maximo: "La edad debe estar entre 0 y 60 meses." }
        },
        datoDos: {
            nombre: "Perímetro cefálico", selector: "#datoDos", selectorError: "#errorDatoDos", tipo: "numero", obligatorio: true,
            minimo: 25, maximo: 65, permitirCero: false,
            mensajes: { obligatorio: "Introduce el perímetro cefálico.", invalido: "Introduce una medida válida, por ejemplo 42,5.", minimo: "El perímetro debe estar entre 25 y 65 cm.", maximo: "El perímetro debe estar entre 25 y 65 cm." }
        },
        opcion: {
            nombre: "Sexo", selector: "#opcion", selectorError: "#errorOpcion", tipo: "select", obligatorio: true,
            mensajes: { obligatorio: "Selecciona el sexo del bebé.", invalido: "Selecciona Niño o Niña." }
        }
    },
    resultadoPrincipal: { selectorValor: "#resultadoPrincipal", selectorUnidad: "#unidadResultadoPrincipal", selectorDescripcion: "#descripcionResultadoPrincipal", titulo: "Percentil estimado", unidad: "OMS", icono: "📊", decimales: 0, formato: "texto", descripcion: "Posición aproximada respecto a la referencia de crecimiento de la OMS." },
    resultadosSecundarios: [
        { clave: "secundarioUno", selectorValor: "#resultadoSecundarioUno", selectorTitulo: null, selectorUnidad: "#unidadResultadoSecundarioUno", titulo: "Perímetro introducido", unidad: "cm", icono: "📏", decimales: 1, formato: "numero", descripcion: "Medida indicada en el formulario." },
        { clave: "secundarioDos", selectorValor: "#resultadoSecundarioDos", selectorTitulo: null, selectorUnidad: "#unidadResultadoSecundarioDos", titulo: "Edad y sexo", unidad: "datos declarados", icono: "👶", decimales: 0, formato: "texto", descripcion: "Datos usados para seleccionar la curva OMS." },
        { clave: "secundarioTres", selectorValor: "#resultadoSecundarioTres", selectorTitulo: null, selectorUnidad: "#unidadResultadoSecundarioTres", titulo: "Clasificación", unidad: "orientativa", icono: "✅", decimales: 0, formato: "texto", descripcion: "Orientación basada en el percentil estimado." }
    ],
    textosResultado: { resumen: "Resultado estimado según las curvas de crecimiento de la OMS.", interpretacion: "Interpreta siempre el dato junto con la evolución del crecimiento y la valoración pediátrica.", aviso: "Resultado exclusivamente orientativo." },
    recomendaciones: ["Comprueba la medida y repítela si la cinta se movió.", "Valora la evolución en el tiempo, no una cifra aislada.", "Comenta cualquier duda con el pediatra."],
    mensajes: { errorGeneral: "Revisa los campos marcados antes de continuar.", errorCalculo: "No se ha podido realizar el cálculo.", formularioIncompleto: "Completa correctamente todos los campos.", sinResultados: "No hay resultados disponibles.", reinicioCorrecto: "La herramienta se ha reiniciado correctamente.", copiando: "Copiando resultado...", copiado: "Resultado copiado al portapapeles.", errorCopiar: "No se ha podido copiar el resultado.", compartido: "Resultado compartido correctamente.", errorCompartir: "No se ha podido compartir el resultado." },
    selectores: { formulario: "#formularioHerramienta", botonCalcular: "#botonCalcular", botonReiniciar: "#botonReiniciar", seccionResultados: "#resultados", resumenResultado: "#resumenResultado", interpretacionResultado: "#interpretacionResultado", listaRecomendaciones: "#listaRecomendaciones" },
    botones: { calcular: { textoNormal: "Calcular percentil", textoProcesando: "Calculando...", desactivarDuranteCalculo: true }, reiniciar: { texto: "Reiniciar" } },
    funciones: { copiarResultado: false, compartirResultado: true, exportarPDF: false, imprimirResultado: false, guardarLocalmente: false, recuperarUltimoCalculo: false, analiticaEventos: false },
    almacenamiento: { prefijo: "h360", clave: "calculadora-de-percentiles-de-perimetro-cefalico-del-bebe", guardarFormulario: false, guardarResultado: false },
    accesibilidad: { anunciarResultados: true, anunciarErrores: true, enfocarResultados: true, enfocarPrimerError: true },
    desarrollo: { debug: false, mostrarConfiguracion: false, registrarCalculos: false }
};

Object.freeze(CONFIG);
