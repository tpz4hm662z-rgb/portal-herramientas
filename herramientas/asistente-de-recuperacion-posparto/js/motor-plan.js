/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Motor del Plan Personalizado de Recuperación.
   Entradas únicas: usuario y resultado.contenido.
===================================================== */

"use strict";

const MotorPlanRecuperacion = (() => {
    function generar(usuario, contenido) {
        validarEntradas(usuario, contenido);
        const prioridades = clasificarPrioridades(contenido, usuario);
        return Object.freeze({
            prioridades,
            movimiento: crearMovimiento(usuario, contenido.actividad),
            alimentacion: crearAlimentacion(usuario, contenido.peso),
            descanso: crearDescanso(usuario, contenido.energia),
            hidratacion: crearHidratacion(usuario),
            bienestarEmocional: crearBienestarEmocional(usuario, contenido.cambiosEmocionales),
            revisiones: crearRevisiones(usuario),
            objetivos: Object.freeze(crearObjetivos(usuario)),
            consejo: crearConsejo(usuario)
        });
    }

    function clasificarPrioridades(contenido, usuario) {
        const apartados = Object.values(contenido)
            .sort((a, b) => b.ordenPrioridad - a.ordenPrioridad);
        return Object.freeze({
            alta: Object.freeze(apartados.filter(item => item.prioridad === "alta").slice(0, 4).map(item => crearPrioridad(item, usuario))),
            media: Object.freeze(apartados.filter(item => item.prioridad === "media").slice(0, 6).map(item => crearPrioridad(item, usuario))),
            baja: Object.freeze(apartados.filter(item => item.prioridad === "baja").slice(0, 5).map(item => crearPrioridad(item, usuario)))
        });
    }

    function crearPrioridad(apartado, usuario) {
        const motivo = apartado.sintomasRelacionados.length
            ? "Aparece con mayor relevancia porque se relaciona con sensaciones que has seleccionado."
            : `Su relevancia se ajusta a tu etapa de ${usuario.etapa.nombre.toLowerCase()} y al contexto general de tu recuperación.`;
        return Object.freeze({
            clave: apartado.clave,
            icono: apartado.icono,
            titulo: apartado.titulo,
            explicacion: apartado.puntosClave[0],
            motivo,
            color: apartado.color
        });
    }

    function crearMovimiento(usuario, actividad) {
        const parto = fraseParto(usuario.tipoParto.clave);
        return bloque(
            "movimiento", "🚶‍♀️", "Movimiento progresivo",
            `En la semana ${numero(usuario.semanas)}, aproximadamente el mes ${numero(usuario.meses)}, tras ${parto}, tu actividad ha pasado de ${usuario.actividadAntes.nombre.toLowerCase()} a ${usuario.actividadActual.nombre.toLowerCase()}. En muchas mujeres el movimiento puede retomarse de forma progresiva, atendiendo a las sensaciones y siempre que el profesional sanitario lo considere adecuado.`,
            actividad.puntosClave.slice(0, 3)
        );
    }

    function crearAlimentacion(usuario, peso) {
        const lactancia = usuario.lactancia.clave === "no"
            ? "Sin lactancia, las necesidades siguen dependiendo de tus rutinas, tu descanso y tu situación personal."
            : `Con ${usuario.lactancia.nombre.toLowerCase()}, las necesidades cotidianas pueden sentirse diferentes y conviene evitar expectativas rígidas.`;
        const contextoPeso = Math.abs(usuario.pesoActual - usuario.pesoAntes) < 1
            ? "Los valores de peso actual y previo que has facilitado son similares"
            : usuario.pesoActual > usuario.pesoAntes
                ? "El peso actual indicado es mayor que el previo al embarazo"
                : "El peso actual indicado es menor que el previo al embarazo";
        return bloque(
            "alimentacion", "🥗", "Alimentación flexible y suficiente",
            `En la etapa de ${usuario.etapa.nombre.toLowerCase()}, ${lactancia.charAt(0).toLowerCase()}${lactancia.slice(1)} ${contextoPeso}, pero esa comparación no define la calidad de tu recuperación. Una alimentación variada y regular puede acompañar este periodo; el plan no propone dietas ni pérdidas rápidas de peso.`,
            peso.puntosClave.slice(0, 3)
        );
    }

    function crearDescanso(usuario, energia) {
        const fatiga = usuario.sintomas.includes("fatiga")
            ? "Como has indicado fatiga, este aspecto adquiere una relevancia especial en tu plan."
            : "Aunque no hayas seleccionado fatiga, el descanso continúa formando parte del contexto de recuperación.";
        return bloque(
            "descanso", "🌙", "Descanso y recuperación cotidiana",
            `${fatiga} En la etapa de ${usuario.etapa.nombre.toLowerCase()}, alternar las demandas diarias con oportunidades de descanso puede resultar útil. La actividad actual también puede ajustarse a cómo te encuentres cada día.`,
            energia.puntosClave.slice(0, 3)
        );
    }

    function crearHidratacion(usuario) {
        const contexto = usuario.lactancia.clave === "no"
            ? "Mantener líquidos disponibles durante el día puede ayudar a sostener las rutinas habituales."
            : "Durante la lactancia puede resultar especialmente práctico beber según la sed y tener agua accesible en los momentos de alimentación del bebé.";
        return bloque(
            "hidratacion", "💧", "Hidratación cotidiana",
            `${contexto} Las necesidades varían según el clima, la actividad y las circunstancias individuales; esta orientación no establece una cantidad clínica concreta.`,
            ["Distribuir la hidratación a lo largo del día.", "Adaptarla a la sed, la actividad y el entorno.", "Evitar convertirla en una meta rígida."]
        );
    }

    function crearBienestarEmocional(usuario, emociones) {
        return bloque(
            "bienestar-emocional", "💜", "Bienestar emocional",
            `Los cambios emocionales pueden formar parte de la adaptación durante ${usuario.etapa.nombre.toLowerCase()}. No existe una forma única de vivir el posparto. Si las emociones son intensas, persistentes o interfieren de manera importante en tu vida diaria, puedes compartirlo con un profesional sanitario.`,
            emociones.puntosClave.slice(0, 4)
        );
    }

    function crearRevisiones(usuario) {
        return bloque(
            "revisiones", "🩺", "Revisiones habituales",
            `En tu etapa de ${usuario.etapa.nombre.toLowerCase()}, las revisiones programadas permiten comentar la evolución y resolver dudas relacionadas con el parto, la lactancia, la actividad o las sensaciones seleccionadas. Este recordatorio no establece un calendario médico específico.`,
            ["Mantener las citas que ya tengas programadas.", "Anotar dudas puede facilitar su consulta.", "Comentar los cambios que te preocupen."]
        );
    }

    function crearObjetivos(usuario) {
        const objetivos = [
            "Buscar oportunidades de descanso cuando sea posible.",
            "Mantener una hidratación compatible con tus rutinas.",
            "Observar la evolución de las sensaciones sin compararla con la de otras personas.",
            "Seguir las revisiones habituales y llevar tus dudas."
        ];
        if (usuario.actividadActual.clave === "reposo") objetivos.splice(2, 0, "Valorar una vuelta gradual al movimiento cuando esté indicado.");
        else objetivos.splice(2, 0, "Ajustar el movimiento de forma progresiva a cómo te encuentres.");
        if (usuario.sintomas.length > 0) objetivos.push("Comentar las molestias persistentes o que generen preocupación.");
        return objetivos.slice(0, 6);
    }

    function crearConsejo(usuario) {
        const sintomas = usuario.sintomas.length
            ? `Las ${usuario.sintomas.length} sensaciones que has seleccionado merecen contexto y seguimiento, no comparaciones.`
            : "No haber seleccionado síntomas no significa que tu experiencia tenga que parecerse a la de otras madres.";
        return `Estás en ${usuario.etapa.nombre.toLowerCase()} tras ${fraseParto(usuario.tipoParto.clave)}, ${fraseLactancia(usuario.lactancia.clave)}, y actualmente describes tu actividad como ${usuario.actividadActual.nombre.toLowerCase()}. ${sintomas} Cada recuperación tiene su propio ritmo: puedes avanzar de manera gradual y consultar cualquier duda cuando lo necesites.`;
    }

    function bloque(clave, icono, titulo, texto, puntos) {
        return Object.freeze({ clave, icono, titulo, texto, puntos: Object.freeze([...puntos]) });
    }

    function fraseParto(clave) {
        if (clave === "cesarea") return "una cesárea";
        if (clave === "instrumental") return "un parto instrumental";
        return "un parto vaginal";
    }

    function fraseLactancia(clave) {
        if (clave === "exclusiva") return "con lactancia exclusiva";
        if (clave === "mixta") return "con lactancia mixta";
        return "sin lactancia";
    }

    function numero(valor) {
        return Number(valor).toLocaleString("es-ES", { maximumFractionDigits: 1 });
    }

    function validarEntradas(usuario, contenido) {
        if (!usuario || !contenido || !contenido.actividad || !contenido.energia) {
            throw new TypeError("El plan necesita el perfil y el contenido inteligente completos.");
        }
    }

    return Object.freeze({ generar });
})();
