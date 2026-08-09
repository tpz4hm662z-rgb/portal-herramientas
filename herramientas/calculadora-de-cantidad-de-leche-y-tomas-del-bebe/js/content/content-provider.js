/** Agregador editorial. Cada colección conserva una única fuente de verdad. */
import { ALERTS_CONTENT } from "./alerts-content.js";
import { FAQ_CONTENT } from "./faq-content.js";
import { RELATED_CONTENT } from "./related-content.js";
import { SOURCES_CONTENT } from "./sources-content.js";
import { TIMELINE_CONTENT } from "./timeline-content.js";
import { REVIEW, TRANSPARENCY_CONTENT, TRUST_CONTENT } from "./trust-content.js";
const CONTENIDO = Object.freeze({
  alimentacion: Object.freeze({ formula: "Fórmula infantil", materna: "Lactancia materna directa", mixta: "Lactancia mixta", extraida: "Leche materna extraída" }),
  nacimiento: Object.freeze({ termino: "A término", prematuro: "Prematuro" }),
  estados: Object.freeze({
    orientacion_disponible: Object.freeze({ variante: "informativo", icono: "ⓘ", titulo: "Orientación general disponible", texto: "El resultado es un intervalo orientativo basado en los datos indicados y en alimentación responsiva." }),
    referencia_global_prudente: Object.freeze({ variante: "observacion", icono: "◉", titulo: "Referencia global prudente", texto: "No es posible separar ni estimar con estos datos cuánto obtiene el bebé directamente del pecho." }),
    volumen_no_estimable: Object.freeze({ variante: "informativo", icono: "♥", titulo: "La toma directa no se mide en mililitros", texto: "No es posible estimar de forma fiable los mililitros transferidos durante una toma directa al pecho únicamente con estos datos." }),
    requiere_valoracion_individual: Object.freeze({ variante: "consulta", icono: "⚕", titulo: "Valoración individual necesaria", texto: "Las necesidades pueden depender de la edad corregida, la evolución, la indicación neonatal y el seguimiento clínico. Esta herramienta no sustituye el plan de pediatría o neonatología." }),
    entrada_invalida: Object.freeze({ variante: "observacion", icono: "!", titulo: "Revisa los datos", texto: "No se ha generado el informe porque faltan datos válidos." })
  }),
  introducciones: Object.freeze({
    formula: "El intervalo estima una referencia diaria y por toma para alimentación con fórmula a partir de la edad, el peso y la rutina indicada. No es un objetivo rígido ni implica que el bebé tenga que terminar cada biberón.",
    materna: "En la lactancia directa, una cifra en mililitros no describiría de forma fiable la leche transferida. El resultado se centra deliberadamente en la alimentación responsiva, la observación y la evolución del crecimiento.",
    mixta: "El intervalo es una referencia global de alimentación y no una recomendación sobre cuánto complemento ofrecer. La calculadora no puede separar la leche transferida al pecho de la ofrecida mediante recipiente.",
    extraida: "El intervalo describe leche materna ofrecida mediante recipiente. El volumen preparado u ofrecido puede ser diferente del finalmente ingerido y no equivale automáticamente a una toma directa al pecho.",
    prematuro: "En bebés prematuros, una orientación general no puede sustituir un plan individual. La edad corregida, la evolución y las indicaciones de neonatología pueden cambiar las necesidades.",
    entrada_invalida: "Revisa los datos indicados para poder generar una orientación coherente."
  }),
  explicaciones: Object.freeze({
    intervalo_orientativo: "El rango representa una zona de referencia y evita transmitir una precisión que la alimentación real no tiene.",
    variacion_diaria: "El apetito puede variar entre tomas y de un día a otro por el ritmo de crecimiento, el descanso, el entorno o el estado general.",
    alimentacion_responsiva: "Las señales de hambre, pausa y saciedad del propio bebé ayudan a interpretar el intervalo.",
    transferencia_no_medible: "Los datos introducidos no permiten medir cuánto se transfiere directamente durante una toma al pecho.",
    observacion_integral: "La evolución del crecimiento, el bienestar y el patrón global aportan más información que una toma aislada.",
    referencia_global: "La referencia engloba el patrón de alimentación y no debe leerse como una cantidad automática de fórmula o suplemento.",
    volumen_ofrecido: "La cifra se refiere al volumen ofrecido mediante un recipiente.",
    ofrecido_no_ingerido: "Ofrecer una cantidad no significa que el bebé tenga que ingerirla por completo.",
    valoracion_individual: "Las necesidades deben contextualizarse individualmente.",
    edad_corregida: "La edad corregida puede ser relevante para interpretar la etapa de desarrollo.",
    seguimiento_clinico: "La evolución y las indicaciones del equipo sanitario tienen prioridad sobre esta orientación general."
  }),
  limitaciones: Object.freeze({
    comunes: Object.freeze(["Esta herramienta ofrece orientación general y no sustituye una valoración pediátrica.", "El resultado no sustituye el seguimiento del crecimiento a lo largo del tiempo."]),
    sin_cifra_exacta: "No puede determinar una cifra exacta válida para todas las tomas o todos los días.",
    sin_necesidad_individual: "No conoce todas las circunstancias clínicas ni las necesidades individuales del bebé.",
    sin_transferencia_pecho: "No mide la cantidad transferida directamente al pecho.",
    sin_seguimiento_crecimiento: "No evalúa por sí sola la trayectoria de peso y crecimiento.",
    sin_calculo_complemento: "No calcula cuánto complemento necesita un bebé con lactancia mixta.",
    sin_equivalencia_pecho: "No convierte un volumen extraído en una equivalencia automática con la toma directa.",
    sin_plan_neonatal: "No sustituye el plan indicado por pediatría o neonatología."
  }),
  complementaria: "La alimentación complementaria se ha tenido en cuenta como contexto; no se han reducido automáticamente las cantidades.",
  recomendaciones: Object.freeze({
    alimentacion: Object.freeze({ titulo: "Alimentación", texto: "Respeta las señales de hambre y saciedad y evita forzar que termine una toma." }),
    hidratacion: Object.freeze({ titulo: "Hidratación", texto: "Observa el patrón habitual del bebé y consulta si percibes cambios que te preocupen." }),
    observacion: Object.freeze({ titulo: "Observación", texto: "Valora el conjunto de comportamiento, evolución y bienestar, no una toma aislada." }),
    seguimiento: Object.freeze({ titulo: "Seguimiento", texto: "El seguimiento del crecimiento permite valorar la evolución a lo largo del tiempo." }),
    profesional_sanitario: Object.freeze({ titulo: "Consulta profesional", texto: "Comenta las necesidades individualizadas con pediatría, neonatología o el profesional que realiza el seguimiento." })
  }),
  senales: Object.freeze({
    alimentacion_pecho: Object.freeze({ grupo: "Alimentación", titulo: "Patrón responsivo", texto: "El bebé muestra interés por alimentarse y finaliza o pausa la toma siguiendo sus propias señales." }),
    alimentacion_recipiente: Object.freeze({ grupo: "Alimentación", titulo: "Señales durante la toma", texto: "Acepta la toma con un ritmo variable y muestra señales reconocibles de pausa o saciedad." }),
    crecimiento: Object.freeze({ grupo: "Crecimiento", titulo: "Evolución seguida", texto: "El crecimiento se valora mediante su trayectoria en los controles, no por una cifra aislada." }),
    hidratacion: Object.freeze({ grupo: "Hidratación", titulo: "Patrón habitual", texto: "Mantiene un patrón de pañales y bienestar acorde con lo que el equipo sanitario considera esperable para su situación." }),
    comportamiento: Object.freeze({ grupo: "Comportamiento", titulo: "Estado general", texto: "Alterna periodos de alimentación, descanso e interacción de acuerdo con su patrón habitual." })
  }),
  alertas: ALERTS_CONTENT,
  etapas: Object.freeze({ recien_nacido: "Primeros días", primer_mes: "Primer mes", uno_tres_meses: "De 1 a 3 meses", tres_seis_meses: "De 3 a 6 meses", seis_nueve_meses: "De 6 a 9 meses", nueve_doce_meses: "De 9 a 12 meses", doce_meses: "12 meses" }),
  timelineCompleto: TIMELINE_CONTENT,
  faq: FAQ_CONTENT,
  fuentes: SOURCES_CONTENT,
  relacionadas: RELATED_CONTENT,
  transparencia: TRANSPARENCY_CONTENT,
  confianza: TRUST_CONTENT,
  revision: REVIEW,
  errores: Object.freeze({ EDAD_INVALIDA: "Introduce una edad válida.", EDAD_FUERA_RANGO: "La herramienta admite edades de hasta 12 meses.", PESO_INVALIDO: "Introduce un peso positivo y válido.", PESO_FUERA_RANGO: "Introduce un peso entre 0,5 y 20 kg.", ALIMENTACION_INVALIDA: "Selecciona el tipo de alimentación.", NACIMIENTO_INVALIDO: "Selecciona el tipo de nacimiento.", TOMAS_INVALIDAS: "Introduce entre 1 y 24 tomas.", COMPLEMENTARIA_INVALIDA: "Indica si ha comenzado alimentación complementaria.", INICIO_COMPLEMENTARIA_INVALIDO: "Indica una edad de inicio entre 1 y 12 meses.", INICIO_COMPLEMENTARIA_POSTERIOR: "La edad de inicio no puede ser posterior a la edad actual.", SIN_RANGO_DISPONIBLE: "No existe orientación para la edad indicada." })
});

export function obtenerContenido() { return CONTENIDO; }
