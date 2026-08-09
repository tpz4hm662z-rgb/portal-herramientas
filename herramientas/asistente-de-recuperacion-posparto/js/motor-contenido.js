/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Motor inteligente de contenidos.
   Entrada única: objeto usuario. Sin acceso al DOM.
===================================================== */

"use strict";

const MotorContenidoPosparto = (() => {
    const PRIORIDAD = Object.freeze({ alta: 3, media: 2, baja: 1 });

    const CONTEXTO_ETAPA = Object.freeze({
        1: { momento: "en los primeros días tras el parto", marco: "El organismo está iniciando numerosos ajustes físicos y hormonales, por lo que las sensaciones pueden cambiar con rapidez.", ritmo: "muy reciente" },
        2: { momento: "durante las primeras seis semanas", marco: "La recuperación temprana continúa de forma gradual y es frecuente que convivan avances con días de mayor cansancio.", ritmo: "temprano" },
        3: { momento: "entre las semanas 7 y 12", marco: "Muchas mujeres perciben una mayor estabilidad, aunque los tejidos, la energía y las rutinas todavía pueden seguir adaptándose.", ritmo: "inicial" },
        4: { momento: "entre los 3 y 6 meses", marco: "Parte de los cambios suele evolucionar progresivamente, pero la lactancia, el descanso y la actividad pueden influir en cómo se vive esta etapa.", ritmo: "intermedio" },
        5: { momento: "entre los 6 y 12 meses", marco: "Numerosos cambios pueden haberse estabilizado, aunque algunas sensaciones persisten de forma variable y merecen atención individualizada.", ritmo: "avanzado" },
        6: { momento: "después del primer año", marco: "El tiempo transcurrido no hace que todas las experiencias sean iguales: ciertos cambios pueden continuar vinculados al parto, la lactancia o las demandas cotidianas.", ritmo: "prolongado" }
    });

    const SABIAS_QUE = Object.freeze({
        cambiosFisicos: "No todas las áreas del cuerpo evolucionan a la vez: es posible percibir avances en unas funciones mientras otras continúan adaptándose a su propio ritmo.",
        abdomen: "La recuperación de la musculatura abdominal puede prolongarse varios meses y depende del embarazo, el parto, la actividad, los tejidos y otros factores individuales.",
        utero: "En muchas mujeres el útero reduce progresivamente su tamaño durante las primeras semanas tras el parto, aunque el ritmo y las sensaciones pueden variar.",
        hormonas: "Las variaciones hormonales del posparto pueden acompañar cambios en el sueño, el ciclo, la energía, el cabello, la piel y el estado de ánimo.",
        sueloPelvico: "El embarazo puede influir en el suelo pélvico incluso cuando el parto ha sido por cesárea, porque la adaptación comienza antes del nacimiento.",
        peso: "El peso posparto incluye cambios de líquidos y composición corporal, por lo que una cifra aislada no describe toda la recuperación.",
        piel: "Las estrías suelen cambiar de color y textura con el tiempo, pero su evolución depende de características individuales de la piel.",
        cabello: "La caída capilar posparto puede hacerse más visible varios meses después del nacimiento debido a cambios sincronizados en el ciclo del cabello.",
        energia: "El sueño fragmentado puede modificar la percepción del esfuerzo y la concentración, incluso cuando la cantidad total de descanso parece suficiente.",
        digestivo: "La movilidad, la hidratación, los horarios y los cambios de rutina pueden influir conjuntamente en el ritmo intestinal durante el posparto."
    });

    const ETIQUETAS_CONTENIDO = Object.freeze({
        sueloPelvico: "🟠 Recuperación muscular", peso: "🟢 Evolución habitual",
        piel: "🔵 Recuperación fisiológica", cabello: "🟣 Cambios hormonales",
        energia: "🟢 Adaptación general", digestivo: "🟢 Adaptación digestiva"
    });

    const EVOLUCION_PROXIMA = Object.freeze({
        sueloPelvico: "la percepción de soporte, comodidad y control puede continuar evolucionando gradualmente; el ritmo depende del embarazo, del parto y de las circunstancias individuales",
        peso: "la evolución del peso puede seguir siendo gradual y depender de múltiples factores, entre ellos la actividad, las rutinas, el descanso y la lactancia",
        piel: "algunos cambios de textura, sensibilidad o coloración pueden ir atenuándose progresivamente, aunque no existe un calendario común para todas las pieles",
        cabello: "el ciclo capilar puede mantenerse estable o mostrar cambios más adelante dentro del periodo posparto; la intensidad y la duración son variables",
        energia: "la energía puede fluctuar mientras cambian el descanso, la lactancia y las demandas cotidianas, sin seguir necesariamente una progresión lineal",
        digestivo: "el ritmo intestinal puede ir adaptándose a la movilidad y a las nuevas rutinas, aunque ciertas molestias pueden persistir de manera variable"
    });

    const DEFINICIONES = Object.freeze({
        abdomen: {
            titulo: "Abdomen y pared abdominal", icono: "🫶", color: "ciruela",
            sintomas: ["barriga-prominente", "debilidad-abdominal", "dolor-abdominal"],
            resumen: "La pared abdominal atraviesa una adaptación progresiva después del embarazo. Su aspecto, la sensación de fuerza y la respuesta durante las tareas cotidianas pueden evolucionar a ritmos distintos.",
            detalle: "Los músculos y tejidos abdominales han soportado cambios importantes durante el embarazo. Es frecuente que el control del tronco, la tensión o la forma del abdomen no recuperen de inmediato su estado previo. La actividad actual y el tiempo posparto ayudan a contextualizar estas sensaciones, sin permitir por sí solos establecer su causa.",
            puntos: ["La evolución de la pared abdominal no es lineal.", "Aspecto y función no siempre cambian al mismo ritmo.", "Las cargas cotidianas pueden modificar las sensaciones.", "Una molestia persistente puede comentarse en las revisiones habituales."]
        },
        utero: {
            titulo: "Cambios del útero", icono: "🌷", color: "rosa",
            sintomas: ["dolor-abdominal"],
            resumen: "Tras el parto, el útero inicia un proceso gradual de adaptación. La percepción de los cambios varía según el momento posparto y puede convivir con otras sensaciones abdominales.",
            detalle: "Durante las primeras etapas, el útero y los tejidos cercanos continúan ajustándose después del embarazo. Con el paso de las semanas este proceso suele avanzar, aunque no todas las mujeres lo perciben del mismo modo. El tipo de parto y la lactancia forman parte del contexto general, pero una herramienta educativa no puede valorar hallazgos individuales.",
            puntos: ["Los cambios uterinos se producen gradualmente.", "La experiencia puede variar entre mujeres y entre partos.", "El momento posparto modifica el contexto de las sensaciones.", "Las revisiones sanitarias permiten valorar la evolución individual."]
        },
        hormonas: {
            titulo: "Adaptación hormonal", icono: "✨", color: "violeta",
            sintomas: ["caida-cabello", "fatiga", "hinchazon"],
            resumen: "El entorno hormonal cambia tras el embarazo y continúa adaptándose durante el posparto. La lactancia y el descanso pueden influir en cómo se perciben la energía, el cabello y otros cambios corporales.",
            detalle: "La transición hormonal no ocurre de forma idéntica en todas las personas. Puede relacionarse temporalmente con cambios en el ciclo, la piel, el cabello, el estado de ánimo o la energía, sin que una sola sensación explique el conjunto. Cuando existe lactancia, su patrón añade un contexto hormonal específico que puede prolongar algunas diferencias respecto a antes del embarazo.",
            puntos: ["La adaptación hormonal tiene un ritmo individual.", "La lactancia puede modificar este contexto durante más tiempo.", "Sueño, alimentación y demandas de cuidado también influyen en el bienestar.", "Los cambios deben interpretarse en conjunto, no de forma aislada."]
        },
        peso: {
            titulo: "Peso y composición corporal", icono: "⚖️", color: "azul",
            sintomas: ["hinchazon"],
            resumen: "El peso posparto refleja muchos componentes y no sigue una trayectoria universal. El tiempo, la lactancia, el descanso, la actividad y las circunstancias personales influyen de manera diferente.",
            detalle: "Comparar el peso actual con el previo al embarazo ofrece contexto, pero no describe por sí solo la recuperación ni la salud. Los líquidos, los cambios de composición corporal, el sueño y la disponibilidad para moverse o alimentarse con regularidad pueden participar en su evolución. La lactancia tampoco produce el mismo efecto en todas las mujeres.",
            puntos: ["El peso no resume la calidad de la recuperación.", "Las variaciones posparto son individuales.", "La lactancia no garantiza una evolución concreta.", "Los hábitos sostenibles suelen ser más útiles que las expectativas rígidas."]
        },
        sueloPelvico: {
            titulo: "Suelo pélvico", icono: "🌼", color: "coral",
            sintomas: ["perdidas-orina", "dolor-pelvico"],
            resumen: "El suelo pélvico participa en el soporte, la continencia y el movimiento. El embarazo y el parto pueden cambiar temporalmente su percepción y su respuesta funcional.",
            detalle: "La recuperación del suelo pélvico depende de múltiples factores y no puede deducirse solo por el tipo de parto. Las pérdidas de orina o el dolor pélvico aportan contexto relevante para los apartados educativos, pero no constituyen un diagnóstico. La evolución puede ser progresiva y merece una valoración individual si las molestias preocupan o persisten.",
            puntos: ["El embarazo también influye, con independencia del tipo de parto.", "Continencia, comodidad y función son dimensiones relacionadas.", "La intensidad y persistencia de las molestias importan.", "La valoración profesional puede individualizar la recuperación."]
        },
        piel: {
            titulo: "Piel y estrías", icono: "🌿", color: "verde",
            sintomas: ["estrias"],
            resumen: "La piel se adapta después de meses de distensión y cambios hormonales. Textura, sensibilidad, pigmentación y estrías pueden seguir evolucionando durante bastante tiempo.",
            detalle: "Es frecuente que la piel no cambie al mismo ritmo que otras áreas de la recuperación. Las estrías suelen modificar gradualmente su color y apariencia, aunque la evolución varía según características individuales. El estado de hidratación o la lactancia pueden acompañar cambios de sensibilidad, pero no permiten anticipar un resultado concreto.",
            puntos: ["Las estrías son frecuentes tras la distensión del embarazo.", "Su aspecto puede cambiar lentamente.", "La genética y las características de la piel influyen.", "No existe un ritmo único de adaptación cutánea."]
        },
        cabello: {
            titulo: "Cabello en el posparto", icono: "💇‍♀️", color: "dorado",
            sintomas: ["caida-cabello"],
            resumen: "El ciclo del cabello puede modificarse después del embarazo. Algunas mujeres notan una caída más visible en determinados meses, con intensidad y duración variables.",
            detalle: "Los cambios hormonales pueden hacer que más cabellos entren en una fase de renovación parecida al mismo tiempo. Esto suele percibirse de forma diferente según el volumen previo, el momento posparto, la alimentación o el descanso. Haber seleccionado caída del cabello permite dar más relevancia a este contenido, sin asumir su causa ni evolución.",
            puntos: ["El ciclo capilar puede cambiar meses después del parto.", "La cantidad percibida varía entre personas.", "El descanso y las circunstancias generales aportan contexto.", "Una evolución que preocupe puede consultarse de forma individual."]
        },
        energia: {
            titulo: "Energía y descanso", icono: "☀️", color: "ambar",
            sintomas: ["fatiga", "hinchazon"],
            resumen: "La energía durante el posparto depende de la recuperación, el sueño, la lactancia y las demandas de cuidado. Sentirse diferente a antes del embarazo puede formar parte de un contexto amplio.",
            detalle: "El descanso fragmentado puede influir en la percepción de esfuerzo, el ánimo y la capacidad para mantener rutinas. La lactancia añade demandas cotidianas, aunque su efecto se experimenta de manera individual. La actividad actual también ayuda a entender el nivel de carga, pero la fatiga no debe atribuirse automáticamente a un único factor.",
            puntos: ["El descanso posparto suele ser irregular.", "La energía puede fluctuar de un día a otro.", "Lactancia, actividad y apoyo cotidiano modifican el contexto.", "La fatiga persistente merece ser comentada si genera preocupación."]
        },
        actividad: {
            titulo: "Actividad y función cotidiana", icono: "🚶‍♀️", color: "turquesa",
            sintomas: ["dolor-lumbar", "dolor-pelvico", "debilidad-abdominal"],
            resumen: "La vuelta al movimiento depende del punto de partida, el tipo de parto, el tiempo transcurrido y las sensaciones actuales. La progresión no tiene que ser idéntica para todas.",
            detalle: "Comparar la actividad previa con la actual permite comprender cuánto han cambiado las demandas físicas. Caminar, descansar o retomar ejercicio representan situaciones diferentes según la etapa y la experiencia personal. La presencia de dolor lumbar, pélvico o debilidad abdominal aumenta la relevancia informativa de este bloque, sin indicar por sí misma qué actividad corresponde.",
            puntos: ["La progresión puede adaptarse al momento y a las sensaciones.", "La actividad previa aporta contexto, no una obligación.", "Las molestias musculoesqueléticas pueden alterar la tolerancia.", "La orientación individual resulta útil cuando existen dudas."]
        },
        digestivo: {
            titulo: "Bienestar digestivo", icono: "🍐", color: "lima",
            sintomas: ["estrenimiento", "hemorroides"],
            resumen: "El ritmo intestinal puede cambiar durante el posparto. Hidratación, alimentación, movilidad, descanso y experiencias del parto forman parte de un contexto que varía ampliamente.",
            detalle: "El estreñimiento o las hemorroides pueden aparecer o persistir durante diferentes etapas, pero no todas las mujeres los experimentan. El tipo de parto, la actividad disponible y la lactancia pueden acompañar cambios en rutinas y necesidades generales. Este apartado organiza información educativa y no determina el origen de una molestia concreta.",
            puntos: ["El ritmo digestivo puede variar temporalmente.", "Hidratación y rutinas influyen en el contexto general.", "La movilidad disponible cambia entre etapas.", "Las molestias persistentes pueden abordarse en una valoración individual."]
        },
        cicatriz: {
            titulo: "Tejidos y cicatrices del parto", icono: "🩹", color: "terracota",
            sintomas: ["dolor-cicatriz"],
            resumen: "Los tejidos implicados en el parto continúan adaptándose después del nacimiento. La zona relevante y las sensaciones esperables dependen especialmente del tipo de parto.",
            detalle: "La recuperación de los tejidos es gradual y puede influir en el movimiento, el contacto o ciertas tareas. En una cesárea el contexto incluye una cicatriz abdominal; tras un parto vaginal o instrumental, la experiencia de los tejidos perineales puede ser distinta. Este contenido se adapta al tipo indicado y no presupone que exista una lesión o complicación.",
            puntos: ["La sensibilidad de los tejidos puede cambiar con el tiempo.", "El tipo de parto determina qué zona resulta relevante.", "Dolor, tirantez y comodidad no evolucionan igual en todas.", "Las dudas sobre una cicatriz pueden valorarse de manera individual."]
        },
        cambiosFisicos: {
            titulo: "Cambios físicos generales", icono: "🌱", color: "bosque",
            sintomas: ["hinchazon", "fatiga", "dolor-lumbar"],
            resumen: "La recuperación física reúne cambios en tejidos, fuerza, postura, energía y rutinas. No existe un único indicador que permita medir por completo cómo está evolucionando.",
            detalle: "El tiempo desde el parto aporta una referencia, pero el tipo de parto, la lactancia, la actividad previa y las demandas actuales hacen que cada experiencia sea diferente. Algunas áreas pueden sentirse estables mientras otras necesitan más tiempo. Los síntomas seleccionados ayudan a ordenar los contenidos sin convertirlos en conclusiones médicas.",
            puntos: ["La recuperación incluye varias áreas a la vez.", "Los avances no siempre son lineales.", "El contexto personal modifica la experiencia.", "Un informe educativo no sustituye una valoración clínica."]
        },
        cambiosEmocionales: {
            titulo: "Adaptación emocional", icono: "💜", color: "lavanda",
            sintomas: ["fatiga"],
            resumen: "El posparto implica ajustes emocionales, familiares y cotidianos además de cambios físicos. El descanso, la lactancia, la recuperación y el apoyo disponible pueden influir en cómo se vive esta etapa.",
            detalle: "Es posible experimentar emociones variadas mientras se reorganizan rutinas, expectativas y responsabilidades. No existe una forma única de sentirse ni un calendario idéntico para adaptarse. La fatiga puede condicionar la percepción del bienestar, pero este motor no interpreta el estado emocional ni realiza evaluaciones clínicas; solo prepara contexto educativo respetuoso.",
            puntos: ["Las emociones pueden ser cambiantes y complejas.", "El apoyo cotidiano forma parte del bienestar.", "La comparación con otras experiencias puede resultar poco útil.", "Pedir ayuda ante malestar o preocupación es una opción válida."]
        }
    });

    function generar(usuario) {
        validarUsuario(usuario);
        const contexto = crearContexto(usuario);
        const bloquesOrdenados = Object.entries(DEFINICIONES).map(([clave, definicion]) => [
                clave,
                crearBloque(clave, definicion, usuario, contexto)
            ]).sort((a, b) => b[1].ordenPrioridad - a[1].ordenPrioridad);
        return Object.freeze(Object.fromEntries(bloquesOrdenados));
    }

    function crearContexto(usuario) {
        const etapa = CONTEXTO_ETAPA[usuario.etapa.numero];
        const parto = contextoParto(usuario.tipoParto.clave);
        const lactancia = contextoLactancia(usuario.lactancia.clave);
        const actividad = `Antes del embarazo tu actividad era ${usuario.actividadAntes.nombre.toLowerCase()} y actualmente indicas ${usuario.actividadActual.nombre.toLowerCase()}.`;
        const referenciaTemporal = usuario.meses < 3
            ? `Alrededor de la semana ${formatearReferencia(usuario.semanas)}`
            : `Alrededor del mes ${formatearReferencia(usuario.meses)}`;
        return Object.freeze({ etapa, parto, lactancia, actividad, referenciaTemporal });
    }

    function crearBloque(clave, definicion, usuario, contexto) {
        const sintomasPresentes = definicion.sintomas.filter(sintoma => usuario.sintomas.includes(sintoma));
        const prioridad = calcularPrioridad(clave, sintomasPresentes, usuario);
        const nivelInformativo = prioridad === "alta"
            ? "Información destacada"
            : prioridad === "media" ? "Información importante" : "Información básica";
        const matiz = crearMatiz(clave, usuario, sintomasPresentes, contexto);

        return Object.freeze({
            clave,
            titulo: personalizarTitulo(clave, definicion.titulo, usuario),
            resumen: `${contexto.referenciaTemporal}, ${contexto.etapa.momento}, ${definicion.resumen} ${matiz.resumen}`,
            explicacion: `${contexto.etapa.marco} ${definicion.detalle} ${matiz.explicacion}`,
            puntosClave: Object.freeze([...definicion.puntos.slice(0, 4), matiz.punto].filter(Boolean).slice(0, 5)),
            informacionImportante: crearInformacionImportante(clave, usuario, sintomasPresentes, definicion),
            sabiasQue: SABIAS_QUE[clave] || "La evolución posparto combina múltiples cambios y puede seguir ritmos diferentes en cada persona.",
            etiquetaSuperior: ETIQUETAS_CONTENIDO[clave] || "🔵 Información personalizada",
            proximasSemanas: crearEvolucionProxima(clave, contexto),
            prioridad,
            ordenPrioridad: calcularOrdenPrioridad(clave, prioridad, usuario),
            icono: definicion.icono,
            color: definicion.color,
            nivelInformativo,
            sintomasRelacionados: Object.freeze(sintomasPresentes)
        });
    }

    function crearMatiz(clave, usuario, sintomas, contexto) {
        const conSintomas = sintomas.length > 0;
        const nombres = sintomas.map(nombreSintoma).join(", ");
        const resumen = conSintomas
            ? `Como has indicado ${nombres}, este apartado recibe más prioridad dentro de tu informe.`
            : `En tu perfil no aparecen molestias seleccionadas directamente vinculadas con este apartado.`;

        let explicacion = `${contexto.parto} ${contexto.actividad}`;
        if (["hormonas", "peso", "energia", "cambiosFisicos", "cambiosEmocionales"].includes(clave)) {
            explicacion = `${contexto.lactancia} ${explicacion}`;
        }
        if (clave === "cicatriz") explicacion = personalizarCicatriz(usuario.tipoParto.clave, conSintomas);
        if (clave === "cabello" && usuario.sintomas.includes("caida-cabello")) {
            explicacion += " La caída del cabello seleccionada hace que el informe amplíe este tema, manteniendo un enfoque orientativo.";
        }
        if (["cambiosFisicos", "cambiosEmocionales"].includes(clave)) {
            explicacion += ` La edad indicada, ${usuario.edad} años, forma parte del perfil general, pero no permite anticipar por sí sola un ritmo de recuperación.`;
        }

        return {
            resumen,
            explicacion,
            punto: conSintomas ? `Has señalado: ${nombres}.` : null
        };
    }

    function calcularPrioridad(clave, sintomas, usuario) {
        if (clave === "cambiosFisicos") return "alta";
        if (clave === "cicatriz" && usuario.tipoParto.clave === "cesarea" && usuario.sintomas.includes("dolor-cicatriz")) return "alta";
        if (clave === "sueloPelvico" && usuario.sintomas.includes("perdidas-orina")) return "alta";
        if (clave === "actividad" && usuario.sintomas.includes("dolor-lumbar")) return "alta";
        if (clave === "abdomen" && sintomas.length > 0) return "alta";
        if (clave === "digestivo" && sintomas.length > 0) return "alta";
        if (clave === "piel" && usuario.sintomas.includes("estrias")) return "alta";
        if (clave === "cabello" && usuario.sintomas.includes("caida-cabello")) return "alta";
        if (sintomas.length > 0) return "media";
        if (clave === "cicatriz" && usuario.tipoParto.clave === "cesarea") return "media";
        if (clave === "hormonas" && usuario.lactancia.clave !== "no") return "media";
        if (["cambiosFisicos", "energia"].includes(clave)) return "media";
        return "baja";
    }

    function crearInformacionImportante(clave, usuario, sintomas, definicion) {
        if (sintomas.length > 0) {
            return `Este apartado se ha priorizado porque indicas ${sintomas.map(nombreSintoma).join(", ")}. La selección aporta contexto al informe, pero no identifica por sí sola el origen ni el significado de esas sensaciones.`;
        }
        if (clave === "hormonas" && usuario.lactancia.clave !== "no") {
            return `El tipo de lactancia indicado hace especialmente útil interpretar los cambios hormonales dentro de tu etapa posparto, siempre teniendo en cuenta que la experiencia y la duración varían entre mujeres.`;
        }
        return `${definicion.puntos[0]} En tu perfil este contenido tiene una función educativa y debe interpretarse junto con la etapa, el parto, la lactancia y la actividad actual.`;
    }

    function crearEvolucionProxima(clave, contexto) {
        const evolucion = EVOLUCION_PROXIMA[clave];
        if (!evolucion) return "La evolución puede continuar de forma gradual y diferente en cada persona, según la etapa y las circunstancias individuales.";
        const matiz = ["peso", "piel", "cabello", "energia"].includes(clave)
            ? contexto.lactancia
            : contexto.parto;
        return `${contexto.referenciaTemporal}, ${evolucion}. ${matiz} Esta orientación describe posibilidades generales y no predice una evolución individual.`;
    }

    function calcularOrdenPrioridad(clave, prioridad, usuario) {
        if (clave === "cicatriz" && usuario.tipoParto.clave === "cesarea" && usuario.sintomas.includes("dolor-cicatriz")) return 100;
        if (clave === "sueloPelvico" && usuario.sintomas.includes("perdidas-orina")) return 95;
        if (clave === "actividad" && usuario.sintomas.includes("dolor-lumbar")) return 90;
        if (clave === "abdomen" && usuario.sintomas.some(sintoma => ["barriga-prominente", "debilidad-abdominal", "dolor-abdominal"].includes(sintoma))) return 88;
        if (clave === "digestivo" && usuario.sintomas.some(sintoma => ["estrenimiento", "hemorroides"].includes(sintoma))) return 89;
        if (clave === "cabello" && usuario.sintomas.includes("caida-cabello")) return 85;
        if (clave === "piel" && usuario.sintomas.includes("estrias")) return 80;
        if (clave === "cambiosFisicos") return 70;
        return PRIORIDAD[prioridad] * 10;
    }

    function personalizarTitulo(clave, titulo, usuario) {
        if (clave !== "cicatriz") return titulo;
        if (usuario.tipoParto.clave === "cesarea") return "Cicatriz y tejidos tras la cesárea";
        if (usuario.tipoParto.clave === "instrumental") return "Tejidos tras el parto instrumental";
        return "Tejidos tras el parto vaginal";
    }

    function contextoParto(clave) {
        if (clave === "cesarea") return "La recuperación tras una cesárea incorpora además la adaptación de los tejidos abdominales implicados en la cirugía.";
        if (clave === "instrumental") return "Tras un parto instrumental, las sensaciones de los tejidos y la recuperación funcional pueden requerir un contexto específico.";
        return "Tras un parto vaginal, los tejidos pélvicos y la adaptación funcional forman parte del contexto de recuperación.";
    }

    function contextoLactancia(clave) {
        if (clave === "exclusiva") return "La lactancia exclusiva mantiene un contexto hormonal y unas demandas cotidianas particulares, sin determinar por sí sola cómo evolucionará la recuperación.";
        if (clave === "mixta") return "La lactancia mixta aporta un contexto hormonal y de rutinas propio, cuya experiencia puede variar con el tiempo.";
        return "Al no indicar lactancia, la evolución hormonal sigue su propio ritmo y continúa dependiendo de múltiples factores personales.";
    }

    function personalizarCicatriz(clave, conDolor) {
        if (clave === "cesarea") return `En tu caso este apartado se centra únicamente en la cicatriz abdominal de la cesárea${conDolor ? ", ya que has seleccionado dolor en la cicatriz" : ""}. Su evolución requiere una lectura individual y no se deduce solo por el tiempo transcurrido.`;
        if (clave === "instrumental") return "En tu caso el contenido se centrará en los tejidos relacionados con el parto instrumental y no mostrará información propia de una cicatriz de cesárea.";
        return "En tu caso el contenido se centrará en los tejidos relacionados con el parto vaginal y no mostrará información propia de una cicatriz de cesárea.";
    }

    function nombreSintoma(clave) {
        const nombres = {
            "barriga-prominente": "barriga prominente", "debilidad-abdominal": "debilidad abdominal",
            "dolor-abdominal": "dolor abdominal", "dolor-lumbar": "dolor lumbar", "dolor-pelvico": "dolor pélvico",
            "dolor-cicatriz": "dolor en la cicatriz", "perdidas-orina": "pérdidas de orina",
            "caida-cabello": "caída del cabello", estrias: "estrías", fatiga: "fatiga",
            hinchazon: "hinchazón", estrenimiento: "estreñimiento", hemorroides: "hemorroides"
        };
        return nombres[clave] || clave;
    }

    function validarUsuario(usuario) {
        const propiedades = ["edad", "semanas", "meses", "etapa", "tipoParto", "lactancia", "actividadAntes", "actividadActual", "sintomas"];
        if (!usuario || propiedades.some(propiedad => usuario[propiedad] === undefined)) {
            throw new TypeError("El Motor de Contenidos necesita un perfil de usuario completo.");
        }
    }

    function formatearReferencia(valor) {
        return Number(valor).toLocaleString("es-ES", { maximumFractionDigits: 1 });
    }

    return Object.freeze({ generar });
})();
