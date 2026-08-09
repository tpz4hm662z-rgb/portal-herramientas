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
    desarrollo: { debug: false, mostrarConfiguracion: false, registrarCalculos: false },

    guiaDesarrollo: [
        {
            hastaDias: 30,
            etapa: "0–1 meses corregidos",
            introduccion: "Una etapa de adaptación en la que el contacto, la calma y las rutinas sencillas ocupan un lugar central.",
            areas: {
                "Desarrollo motor": "Es habitual observar movimientos espontáneos y posturas flexionadas. En momentos tranquilos puede comenzar a mover la cabeza brevemente hacia un lado.",
                "Comunicación": "Muchos bebés se expresan sobre todo mediante el llanto, pequeños sonidos y cambios en su expresión.",
                "Juego": "Puede disfrutar mirando rostros cercanos, contrastes suaves y objetos situados a poca distancia.",
                "Sueño": "Es habitual que el sueño esté repartido en muchos periodos y todavía no siga un ritmo de día y noche.",
                "Alimentación": "Las tomas pueden ser frecuentes y pausadas. Muchos bebés prematuros necesitan tiempo para coordinar succión, respiración y descanso.",
                "Interacción social": "Puede calmarse con una voz conocida, el contacto piel con piel o una forma estable de sostenerlo.",
                "Consejos útiles": "Los ratos breves de contacto y observación suelen ser suficientes. Sigue las pautas individualizadas de su equipo sanitario."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a sostener la mirada durante más tiempo, responder a voces conocidas y mostrar movimientos algo más organizados."
        },
        {
            hastaDias: 60,
            etapa: "1–2 meses corregidos",
            introduccion: "Poco a poco puede aumentar el tiempo de alerta y el interés por las personas cercanas.",
            areas: {
                "Desarrollo motor": "Puede comenzar a levantar la cabeza durante instantes cuando está boca abajo y despierto, siempre con supervisión.",
                "Comunicación": "Es habitual escuchar sonidos cortos además del llanto y observar respuestas diferentes según la voz.",
                "Juego": "Muchos bebés disfrutan siguiendo lentamente un rostro o un objeto sencillo con la mirada.",
                "Sueño": "Los periodos de sueño siguen siendo variables. Puede comenzar a aparecer algún tramo algo más largo.",
                "Alimentación": "Es habitual que el ritmo de las tomas continúe ajustándose y que existan pausas para descansar.",
                "Interacción social": "Puede comenzar a mantener más contacto visual y a mostrar las primeras sonrisas en momentos de calma.",
                "Consejos útiles": "Hablarle despacio, responder a sus señales y ofrecer pequeños ratos boca abajo pueden acompañar esta etapa."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a sonreír con mayor intención, seguir mejor los movimientos y sostener la cabeza durante periodos algo más largos."
        },
        {
            hastaDias: 121,
            etapa: "2–4 meses corregidos",
            introduccion: "La curiosidad y la respuesta social suelen hacerse más visibles, aunque cada progreso mantiene su propio ritmo.",
            areas: {
                "Desarrollo motor": "Muchos bebés muestran mayor control de la cabeza y pueden comenzar a apoyarse sobre los antebrazos cuando están boca abajo.",
                "Comunicación": "Puede comenzar a emitir gorjeos, responder a voces y experimentar con distintos sonidos.",
                "Juego": "Es habitual que observe sus manos, siga objetos y disfrute de juegos breves cara a cara.",
                "Sueño": "Puede empezar a diferenciar mejor el día de la noche, aunque los despertares continúan siendo habituales.",
                "Alimentación": "Las tomas pueden resultar más organizadas y eficientes, con variaciones normales de un día a otro.",
                "Interacción social": "Muchos bebés sonríen al interactuar y muestran entusiasmo moviendo brazos o piernas.",
                "Consejos útiles": "Alternar posiciones, hablarle y dejar tiempo para responder favorece una interacción tranquila y respetuosa."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a alcanzar objetos, reír, girarse hacia sonidos y participar de forma más activa en los juegos."
        },
        {
            hastaDias: 182,
            etapa: "4–6 meses corregidos",
            introduccion: "El cuerpo, la voz y los objetos cercanos ofrecen nuevas oportunidades para explorar.",
            areas: {
                "Desarrollo motor": "Puede comenzar a girarse, sostener mejor el tronco con apoyo y llevarse las manos u objetos seguros a la boca.",
                "Comunicación": "Es habitual escuchar risas, chillidos suaves y cadenas de sonidos cada vez más variadas.",
                "Juego": "Muchos bebés intentan agarrar juguetes, agitarlos y explorar su textura con manos y boca.",
                "Sueño": "Puede haber rutinas más reconocibles, aunque las siestas y los despertares todavía cambian con frecuencia.",
                "Alimentación": "La leche continúa siendo el alimento principal. El momento de iniciar otros alimentos se valora de forma individual con pediatría.",
                "Interacción social": "Puede reconocer a personas habituales, buscar su atención y responder con sonidos o sonrisas.",
                "Consejos útiles": "Un espacio seguro en el suelo y juguetes sencillos permiten explorar sin necesidad de acelerar ninguna postura."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a sentarse con apoyo, pasar objetos de una mano a otra y combinar más sonidos."
        },
        {
            hastaDias: 273,
            etapa: "6–9 meses corregidos",
            introduccion: "La exploración gana protagonismo y el bebé puede participar cada vez más en las rutinas familiares.",
            areas: {
                "Desarrollo motor": "Muchos bebés pueden comenzar a sentarse con apoyo o de forma progresivamente estable y a desplazarse de maneras muy variadas.",
                "Comunicación": "Es habitual el balbuceo repetido y la respuesta al tono de voz o a su nombre en situaciones cotidianas.",
                "Juego": "Puede disfrutar golpeando, soltando, buscando objetos parcialmente escondidos y repitiendo acciones.",
                "Sueño": "Las rutinas pueden ser algo más predecibles, aunque los cambios del desarrollo suelen modificar temporalmente el descanso.",
                "Alimentación": "Puede comenzar o consolidar la alimentación complementaria cuando muestre preparación y exista orientación profesional.",
                "Interacción social": "Muchos bebés diferencian mejor a las personas conocidas y pueden mostrarse reservados ante alguien nuevo.",
                "Consejos útiles": "Permitir que explore texturas y movimientos en un entorno seguro suele aportar más que dirigir cada actividad."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a buscar objetos escondidos, desplazarse con más intención, imitar gestos y comprender palabras familiares."
        },
        {
            hastaDias: 364,
            etapa: "9–12 meses corregidos",
            introduccion: "La intención, la imitación y las ganas de participar pueden apreciarse con mayor claridad.",
            areas: {
                "Desarrollo motor": "Puede comenzar a cambiar de postura, desplazarse, ponerse de pie con apoyo o explorar otras estrategias de movimiento.",
                "Comunicación": "Muchos bebés combinan sílabas, imitan sonidos y comprenden expresiones sencillas acompañadas de gestos.",
                "Juego": "Es habitual que busque objetos ocultos, introduzca y saque piezas grandes o imite acciones cotidianas.",
                "Sueño": "Puede mantener una rutina reconocible con una o varias siestas, aunque cada familia encuentra su propio patrón.",
                "Alimentación": "La variedad de sabores y texturas puede aumentar gradualmente, manteniendo la leche como una parte importante de la alimentación.",
                "Interacción social": "Puede señalar, saludar, compartir atención y buscar la reacción de las personas cercanas.",
                "Consejos útiles": "Nombrar lo que mira, responder a sus gestos y adaptar el espacio permite acompañar su creciente autonomía."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a usar gestos más claros, decir alguna palabra con intención, dar pasos con apoyo y participar más en las comidas."
        },
        {
            hastaDias: 547,
            etapa: "12–18 meses corregidos",
            introduccion: "La autonomía y la comprensión suelen crecer a través del movimiento, la repetición y el juego compartido.",
            areas: {
                "Desarrollo motor": "Muchos bebés comienzan a dar pasos con o sin apoyo, agacharse, levantarse y transportar objetos ligeros.",
                "Comunicación": "Puede comprender indicaciones sencillas, utilizar gestos y comenzar a ampliar poco a poco sus palabras con intención.",
                "Juego": "Es habitual imitar tareas, apilar pocas piezas, garabatear y experimentar con recipientes u objetos cotidianos seguros.",
                "Sueño": "Muchos bebés pasan gradualmente a una siesta principal, aunque la transición puede ser irregular.",
                "Alimentación": "Puede participar más en las comidas, probar distintas texturas y practicar el uso de vaso o cuchara con ayuda.",
                "Interacción social": "Puede mostrar preferencias, compartir intereses y buscar cercanía mientras explora con mayor independencia.",
                "Consejos útiles": "Ofrecer elecciones sencillas, tiempo para intentar y límites tranquilos acompaña el deseo de autonomía."
            },
            despues: "En las próximas semanas o meses muchos bebés pueden comenzar a caminar con mayor seguridad, ampliar su juego de imitación y combinar gestos con más palabras."
        },
        {
            hastaDias: 730,
            etapa: "18–24 meses corregidos",
            introduccion: "El lenguaje, el juego simbólico y la iniciativa personal pueden avanzar de formas muy diferentes.",
            areas: {
                "Desarrollo motor": "Es habitual que camine con mayor estabilidad y puede comenzar a correr, subir con ayuda o lanzar una pelota.",
                "Comunicación": "Muchos bebés amplían su vocabulario, señalan para compartir y pueden comenzar a unir palabras o expresiones breves.",
                "Juego": "Puede aparecer el juego simbólico sencillo, como dar de comer a un muñeco, además de clasificar o construir.",
                "Sueño": "Una siesta y una rutina nocturna estable son frecuentes, con variaciones normales entre familias.",
                "Alimentación": "Puede comer cada vez con mayor autonomía, aunque las preferencias y el apetito suelen cambiar por etapas.",
                "Interacción social": "Puede jugar cerca de otros niños, imitarles y expresar con más claridad afecto, interés o frustración.",
                "Consejos útiles": "Conversar durante las rutinas, leer juntos y permitir juego libre ofrece oportunidades naturales de aprendizaje."
            },
            despues: "En los meses siguientes muchos niños pueden comenzar a combinar más palabras, perfeccionar la carrera, imaginar escenas de juego y participar con mayor autonomía en las rutinas."
        }
    ]
};

Object.freeze(CONFIG);
