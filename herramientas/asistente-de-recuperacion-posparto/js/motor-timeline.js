/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Motor de la Timeline Inteligente de Recuperación.
===================================================== */

"use strict";

const MotorTimelinePosparto = (() => {
    const HITOS = Object.freeze([
        { clave: "nacimiento", titulo: "Nacimiento", icono: "🌸", etiqueta: "Inicio del posparto", descripcion: "Comienza una etapa de adaptación física, hormonal y cotidiana tras el nacimiento.", cambios: ["Primeros ajustes del organismo.", "Inicio de nuevas rutinas de descanso y cuidado."], contenido: "cambiosFisicos" },
        { clave: "semana-1", titulo: "Semana 1", icono: "🌷", etiqueta: "Primeros días", descripcion: "Durante la primera semana pueden convivir numerosos cambios recientes y una necesidad importante de recuperación.", cambios: ["Adaptación física temprana.", "Cambios de energía y descanso."], contenido: "energia" },
        { clave: "semana-2", titulo: "Semana 2", icono: "🌱", etiqueta: "Adaptación temprana", descripcion: "En la segunda semana la evolución suele continuar gradualmente, sin que todas las sensaciones cambien al mismo ritmo.", cambios: ["Continuidad de los ajustes uterinos y hormonales.", "Rutinas de alimentación y descanso en adaptación."], contenido: "utero" },
        { clave: "semana-6", titulo: "Semana 6", icono: "🌼", etiqueta: "Recuperación temprana", descripcion: "Al acercarse a las seis semanas muchas mujeres perciben cambios progresivos, aunque la experiencia sigue siendo individual.", cambios: ["Evolución de tejidos y función cotidiana.", "Mayor contexto sobre abdomen y suelo pélvico."], contenido: "sueloPelvico" },
        { clave: "mes-3", titulo: "Mes 3", icono: "🌿", etiqueta: "Recuperación inicial", descripcion: "En torno al tercer mes algunas rutinas pueden sentirse más estables y otras áreas continuar adaptándose.", cambios: ["Evolución de actividad, energía y abdomen.", "Posibles cambios de cabello y piel."], contenido: "actividad" },
        { clave: "mes-6", titulo: "Mes 6", icono: "🪴", etiqueta: "Recuperación intermedia", descripcion: "Hacia los seis meses numerosos cambios pueden haberse estabilizado parcialmente, con diferencias según cada contexto.", cambios: ["Consolidación gradual de rutinas.", "Cambios variables en peso, piel y hormonas."], contenido: "peso" },
        { clave: "mes-12", titulo: "Mes 12", icono: "🌳", etiqueta: "Recuperación avanzada", descripcion: "Alrededor del primer año la recuperación continúa siendo personal y algunas sensaciones todavía pueden merecer seguimiento.", cambios: ["Perspectiva más amplia de la evolución.", "Continuidad del bienestar físico y emocional."], contenido: "cambiosEmocionales" }
    ]);

    function generar(usuario, contenido, plan) {
        validarEntradas(usuario, contenido, plan);
        const indiceActual = obtenerIndiceActual(usuario);
        const hitos = HITOS.map((hito, indice) => crearHito(hito, indice, indiceActual, usuario, contenido));
        return Object.freeze({
            hitos: Object.freeze(hitos),
            actual: crearDetalleActual(hitos[indiceActual], usuario, contenido, plan),
            siguiente: indiceActual < hitos.length - 1 ? crearSiguiente(hitos[indiceActual + 1]) : null,
            recuerda: crearRecuerdo(usuario)
        });
    }

    function obtenerIndiceActual(usuario) {
        if (usuario.dias === 0) return 0;
        if (usuario.dias <= 7) return 1;
        if (usuario.dias <= 14) return 2;
        if (usuario.dias <= 42) return 3;
        if (usuario.meses < 3) return 4;
        if (usuario.meses < 6) return 5;
        return 6;
    }

    function crearHito(base, indice, indiceActual, usuario, contenido) {
        const estado = indice < indiceActual
            ? "completado"
            : indice === indiceActual ? "actual" : indice === indiceActual + 1 ? "proximo" : "futuro";
        const apartado = contenido[base.contenido] || contenido.cambiosFisicos;
        return Object.freeze({
            ...base,
            estado,
            estadoVisual: estadoEtiqueta(estado),
            descripcion: `${base.descripcion} ${matizParto(usuario.tipoParto.clave)}`,
            cambiosHabituales: Object.freeze([...base.cambios, matizLactancia(usuario.lactancia.clave)]),
            prioridadPrincipal: Object.freeze({
                icono: apartado.icono,
                titulo: apartado.titulo,
                texto: apartado.puntosClave[0]
            })
        });
    }

    function crearDetalleActual(hito, usuario, contenido, plan) {
        const sintomas = usuario.sintomas.length
            ? `Los síntomas seleccionados hacen que algunos apartados aparezcan con mayor prioridad.`
            : "No has seleccionado síntomas, por lo que el contenido mantiene un enfoque general para tu etapa.";
        return Object.freeze({
            titulo: hito.titulo,
            cambiosFisicos: contenido.cambiosFisicos.resumen,
            cambiosHormonales: contenido.hormonas.resumen,
            actividad: contenido.actividad.resumen,
            recuperacionGeneral: `${plan.descanso.texto} ${sintomas}`
        });
    }

    function crearSiguiente(hito) {
        return Object.freeze({
            titulo: hito.titulo,
            icono: hito.icono,
            texto: `Muchas mujeres comienzan a percibir nuevos ajustes al aproximarse a ${hito.titulo.toLowerCase()}. Es posible que algunos cambios avancen y otros necesiten más tiempo; la evolución suele ser gradual y personal.`
        });
    }

    function crearRecuerdo(usuario) {
        const contexto = usuario.sintomas.length
            ? "Las sensaciones que has indicado sirven para organizar la información, pero no determinan por sí solas cómo debería avanzar tu recuperación."
            : "La ausencia de síntomas seleccionados tampoco establece un ritmo concreto de recuperación.";
        return `Los hitos son referencias educativas, no plazos que debas cumplir. ${contexto} Si surgen dudas o cambios que te preocupen, puedes comentarlos con un profesional sanitario.`;
    }

    function matizParto(clave) {
        if (clave === "cesarea") return "Tras una cesárea, la adaptación incluye también los tejidos abdominales relacionados con la cirugía.";
        if (clave === "instrumental") return "El parto instrumental aporta un contexto específico para los tejidos y la función pélvica.";
        return "Tras un parto vaginal, los tejidos pélvicos forman parte del contexto de recuperación.";
    }

    function matizLactancia(clave) {
        if (clave === "exclusiva") return "La lactancia exclusiva puede influir en el contexto hormonal, la energía y la hidratación.";
        if (clave === "mixta") return "La lactancia mixta añade un contexto propio de rutinas, energía y cambios hormonales.";
        return "Sin lactancia, la adaptación hormonal y energética continúa dependiendo de múltiples factores.";
    }

    function estadoEtiqueta(estado) {
        return { completado: "✓ Completado", actual: "📍 Etapa actual", proximo: "⏳ Próxima etapa", futuro: "○ Etapa posterior" }[estado];
    }

    function validarEntradas(usuario, contenido, plan) {
        if (!usuario || !contenido || !plan || usuario.dias === undefined) {
            throw new TypeError("La timeline necesita usuario, contenido y plan completos.");
        }
    }

    return Object.freeze({ generar });
})();
