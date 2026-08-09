/* =====================================================
   ASISTENTE DE RECUPERACIÓN POSPARTO PRO
   Motor educativo de señales de alerta y consulta.
===================================================== */

"use strict";

const MotorAlertasPosparto = (() => {
    const URGENCIAS_GENERALES = Object.freeze([
        "Fiebre de 38 °C o más, especialmente si se acompaña de escalofríos o malestar importante.",
        "Sangrado vaginal repentino o muy abundante.",
        "Dolor intenso de aparición brusca o dolor abdominal intenso que no cede.",
        "Dificultad importante para respirar o sensación de falta de aire.",
        "Dolor, presión u opresión en el pecho, especialmente junto con dificultad respiratoria.",
        "Pérdida de conciencia, desorientación marcada o desmayo.",
        "Convulsiones.",
        "Dolor de cabeza intenso que no mejora o empeora, especialmente con cambios en la visión.",
        "Hinchazón, enrojecimiento o dolor intenso en una pierna o un brazo, especialmente de un solo lado.",
        "Pensamientos de hacerse daño o de hacer daño al bebé."
    ]);

    function generar(usuario, contenido, plan) {
        validarEntradas(usuario, contenido, plan);
        return Object.freeze({
            habituales: crearHabituales(usuario, contenido),
            consultar: crearConsultas(usuario, contenido),
            urgentes: Object.freeze([...URGENCIAS_GENERALES]),
            pedirAyuda: crearPedirAyuda(usuario),
            recuerda: "Esta herramienta no puede valorar la intensidad, la causa ni la urgencia de un síntoma. Cuando exista una situación preocupante, la valoración sanitaria directa es la referencia adecuada."
        });
    }

    function crearHabituales(usuario, contenido) {
        const candidatos = [];
        agregarSi(candidatos, usuario.sintomas.includes("fatiga"), "☀️", "Cambios de energía", "Es frecuente que la energía fluctúe durante el posparto, especialmente con descanso fragmentado. La intensidad y la evolución varían entre mujeres.", contenido.energia);
        agregarSi(candidatos, usuario.sintomas.includes("caida-cabello"), "💇‍♀️", "Cambios del cabello", "Puede ocurrir que el ciclo del cabello cambie meses después del parto. No todas las mujeres lo experimentan con la misma intensidad.", contenido.cabello);
        agregarSi(candidatos, usuario.sintomas.includes("estrias"), "🌿", "Cambios en la piel", "Las estrías y otros cambios cutáneos pueden continuar evolucionando gradualmente después del embarazo.", contenido.piel);
        agregarSi(candidatos, usuario.sintomas.some(s => ["barriga-prominente", "debilidad-abdominal"].includes(s)), "🫶", "Adaptación abdominal", "Muchas mujeres perciben cambios en el aspecto o el control abdominal mientras los tejidos continúan adaptándose.", contenido.abdomen);
        agregarSi(candidatos, usuario.sintomas.includes("hinchazon"), "💧", "Hinchazón leve", "Puede existir hinchazón leve durante algunos momentos del posparto, pero su contexto, intensidad y evolución son importantes.", contenido.energia);

        if (candidatos.length < 3) {
            candidatos.push(crearItem("🌱", "Evolución individual", "Los cambios físicos pueden avanzar a ritmos diferentes y no tienen que aparecer todos.", contenido.cambiosFisicos));
            candidatos.push(crearItem("✨", "Adaptación hormonal", "Las variaciones hormonales pueden influir en distintas sensaciones sin seguir un calendario idéntico para todas.", contenido.hormonas));
            candidatos.push(crearItem("🌙", "Descanso cambiante", "El descanso posparto puede ser irregular y modificar temporalmente la percepción de energía.", contenido.energia));
        }
        return Object.freeze(unicos(candidatos).sort((a, b) => b.orden - a.orden).slice(0, 5));
    }

    function crearConsultas(usuario, contenido) {
        const consultas = [];
        agregarSi(consultas, usuario.sintomas.some(s => ["dolor-abdominal", "dolor-lumbar", "dolor-pelvico"].includes(s)), "🗣️", "Dolor que persiste o limita", "Conviene comentar con un profesional un dolor que no mejora, aumenta, limita de forma importante las actividades o genera preocupación.", contenido.actividad);
        agregarSi(consultas, usuario.sintomas.includes("perdidas-orina"), "🌼", "Pérdidas de orina", "Las pérdidas de orina que persisten, no mejoran o afectan al bienestar pueden comentarse para recibir una valoración individual.", contenido.sueloPelvico);
        agregarSi(consultas, usuario.tipoParto.clave === "cesarea" || usuario.sintomas.includes("dolor-cicatriz"), "🩹", "Molestias en la cicatriz", "Tras una cesárea, o si existe dolor en una cicatriz, conviene consultar los cambios importantes, persistentes o que generen dudas.", contenido.cicatriz);
        agregarSi(consultas, usuario.sintomas.some(s => ["estrenimiento", "hemorroides"].includes(s)), "🍐", "Molestias digestivas persistentes", "El estreñimiento o las hemorroides que persisten, empeoran o interfieren de forma importante pueden valorarse profesionalmente.", contenido.digestivo);
        agregarSi(consultas, usuario.sintomas.includes("fatiga"), "☀️", "Fatiga intensa o mantenida", "Conviene comentar una fatiga muy intensa, mantenida o que dificulte de forma importante el cuidado personal y las actividades cotidianas.", contenido.energia);
        agregarSi(consultas, usuario.sintomas.includes("hinchazon"), "💬", "Hinchazón que preocupa", "Una hinchazón marcada, que aumenta, resulta dolorosa o genera preocupación merece consulta profesional.", contenido.energia);

        if (consultas.length === 0) {
            consultas.push(crearItem("💬", "Cualquier duda sobre la evolución", `Aunque no hayas seleccionado molestias que prioricen esta sección, puedes consultar cualquier cambio que te preocupe durante ${usuario.etapa.nombre.toLowerCase()}.`, contenido.cambiosFisicos));
        }
        return Object.freeze(unicos(consultas).sort((a, b) => b.orden - a.orden).slice(0, 6));
    }

    function crearPedirAyuda(usuario) {
        const contexto = usuario.sintomas.length
            ? "Haber señalado síntomas permite ordenar el informe, pero no es necesario esperar a que se vuelvan muy intensos para plantear una duda."
            : "Aunque no hayas señalado síntomas, puedes pedir orientación si algo no encaja con tu evolución o te genera inquietud.";
        return `La recuperación no es igual en todas las mujeres. ${contexto} Pedir ayuda y explicar cómo te encuentras forma parte del cuidado posparto.`;
    }

    function agregarSi(lista, condicion, icono, titulo, texto, origen) {
        if (condicion) lista.push(crearItem(icono, titulo, texto, origen));
    }

    function crearItem(icono, titulo, texto, origen) {
        return Object.freeze({ icono, titulo, texto, referencia: origen.titulo, orden: origen.ordenPrioridad });
    }

    function unicos(items) {
        return [...new Map(items.map(item => [item.titulo, item])).values()];
    }

    function validarEntradas(usuario, contenido, plan) {
        if (!usuario || !contenido || !plan) throw new TypeError("El módulo de alertas necesita usuario, contenido y plan completos.");
    }

    return Object.freeze({ generar });
})();
