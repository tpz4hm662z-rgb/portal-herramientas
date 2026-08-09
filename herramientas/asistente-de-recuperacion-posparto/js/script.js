/* =====================================================
   IMOANCY TEMPLATE · LÓGICA PROPIA
   Asistente de Recuperación Posparto PRO
   Coordinador del motor interno y del informe personalizado.
===================================================== */

"use strict";

const MotorRecuperacionPosparto = (() => {
    const MILISEGUNDOS_DIA = 86400000;

    const CATEGORIAS_SINTOMAS = Object.freeze({
        abdomen: ["barriga-prominente", "debilidad-abdominal", "dolor-abdominal"],
        sueloPelvico: ["perdidas-orina", "dolor-pelvico"],
        cesarea: ["dolor-cicatriz"],
        muscular: ["dolor-lumbar"],
        piel: ["estrias"],
        hormonal: ["caida-cabello"],
        general: ["fatiga", "hinchazon"],
        digestivo: ["estrenimiento", "hemorroides"]
    });

    const TIPOS_PARTO = Object.freeze({
        vaginal: { clave: "vaginal", nombre: "Parto vaginal", rama: "partoVaginal" },
        cesarea: { clave: "cesarea", nombre: "Cesárea", rama: "cesarea" },
        instrumental: { clave: "instrumental", nombre: "Parto instrumental", rama: "partoInstrumental" }
    });

    const TIPOS_LACTANCIA = Object.freeze({
        exclusiva: { clave: "exclusiva", nombre: "Lactancia exclusiva" },
        mixta: { clave: "mixta", nombre: "Lactancia mixta" },
        no: { clave: "no", nombre: "No lactancia" }
    });

    const NIVELES_ACTIVIDAD = Object.freeze({
        sedentaria: { clave: "sedentaria", nombre: "Sedentaria", nivel: 0 },
        activa: { clave: "activa", nombre: "Activa", nivel: 1 },
        deportista: { clave: "deportista", nombre: "Deportista", nivel: 2 },
        reposo: { clave: "reposo", nombre: "Reposo", nivel: 0 },
        paseos: { clave: "paseos", nombre: "Paseos", nivel: 1 },
        ligero: { clave: "ligero", nombre: "Ejercicio ligero", nivel: 2 },
        entrenamiento: { clave: "entrenamiento", nombre: "Entrenamiento", nivel: 3 }
    });

    const PRESENTACION_ETAPAS = Object.freeze({
        "posparto-inmediato": { icono: "🌸", color: "rosa", descripcion: "Son los primeros días tras el parto. El organismo inicia numerosos ajustes y el descanso, el apoyo y el seguimiento habitual tienen especial importancia." },
        "posparto-temprano": { icono: "🌷", color: "coral", descripcion: "Durante estas primeras semanas la recuperación continúa de forma gradual. Las necesidades pueden cambiar de un día a otro y cada experiencia mantiene su propio ritmo." },
        "recuperacion-inicial": { icono: "🌱", color: "verde", descripcion: "Entre las semanas 7 y 12 suele consolidarse una recuperación progresiva. La evolución sigue siendo individual y conviene adaptar las rutinas a cómo te encuentres." },
        "recuperacion-intermedia": { icono: "🌿", color: "turquesa", descripcion: "Entre los 3 y 6 meses continúan los ajustes físicos y hormonales. Es una etapa para observar la evolución y avanzar gradualmente en las actividades cotidianas." },
        "recuperacion-avanzada": { icono: "🪴", color: "azul", descripcion: "Entre los 6 y 12 meses la recuperación puede seguir evolucionando. Mantener hábitos sostenibles y comentar las molestias persistentes en las revisiones ayuda a cuidar el bienestar." },
        "mas-de-doce-meses": { icono: "🌳", color: "violeta", descripcion: "Después de 12 meses todavía pueden existir cambios relacionados con el embarazo, el parto y la crianza. Tu bienestar continúa mereciendo atención individualizada." }
    });

    const PRIORIDADES_ETAPAS = Object.freeze({
        1: ["Priorizar el descanso siempre que sea posible.", "Mantener una hidratación y alimentación regulares.", "Aceptar apoyo práctico durante los primeros días.", "Seguir las indicaciones y revisiones sanitarias habituales."],
        2: ["Alternar actividad cotidiana suave con periodos de descanso.", "Cuidar la hidratación, especialmente si das el pecho.", "Avanzar en las rutinas sin forzar el ritmo.", "Comentar en las revisiones las molestias que persistan o preocupen."],
        3: ["Reanudar la actividad de manera gradual cuando esté indicado.", "Mantener descanso, hidratación y alimentación suficientes.", "Observar cómo responde el cuerpo a los cambios de rutina.", "Continuar con las revisiones posparto recomendadas."],
        4: ["Consolidar hábitos de movimiento progresivos y sostenibles.", "Reservar espacios para el descanso y la recuperación.", "Prestar atención a molestias que no mejoren con el tiempo.", "Mantener el seguimiento sanitario que corresponda."],
        5: ["Adaptar la actividad física a tu situación y evolución.", "Sostener hábitos realistas de descanso, alimentación e hidratación.", "Valorar con profesionales las molestias persistentes.", "Cuidar también el bienestar emocional y la red de apoyo."],
        6: ["Mantener hábitos de autocuidado compatibles con tu día a día.", "No normalizar molestias persistentes solo por haber pasado tiempo.", "Solicitar valoración profesional ante dudas sobre tu recuperación.", "Ajustar actividad, descanso y apoyo a tus necesidades actuales."]
    });

    const NOMBRES_SINTOMAS = Object.freeze({
        "barriga-prominente": "barriga prominente", "debilidad-abdominal": "debilidad abdominal",
        "dolor-abdominal": "dolor abdominal", "dolor-lumbar": "dolor lumbar",
        "dolor-pelvico": "dolor pélvico", "dolor-cicatriz": "dolor en la cicatriz",
        "perdidas-orina": "pérdidas de orina", "caida-cabello": "caída del cabello",
        estrias: "estrías", fatiga: "fatiga", hinchazon: "hinchazón",
        estrenimiento: "estreñimiento", hemorroides: "hemorroides"
    });

    let ultimoResultado = null;

    function iniciar() {
        const formulario = $(CONFIG.selectores.formulario);
        const botonReiniciar = $(CONFIG.selectores.botonReiniciar);
        const fechaParto = $("#fechaParto");

        fechaParto.max = obtenerFechaLocalActual();
        mostrarElemento(botonReiniciar);
        formulario.addEventListener("submit", procesarFormulario);
        formulario.addEventListener("input", actualizarProgreso);
        formulario.addEventListener("change", manejarCambioFormulario);
        botonReiniciar.addEventListener("click", reiniciar);
        actualizarProgreso();
        RenderizadorSeoConfianza.renderTodo();
    }

    function manejarCambioFormulario(evento) {
        actualizarProgreso();
        if (evento.target.matches("input[name='actividadAntes'], input[name='actividadActual']")) {
            const nombre = evento.target.name;
            const selectorError = nombre === "actividadAntes" ? "#errorActividadAntes" : "#errorActividadActual";
            limpiarError(selectorError);
            evento.target.closest("[role='radiogroup']")?.removeAttribute("aria-invalid");
        }
        if (!elementoEstaOculto($(CONFIG.selectores.seccionResultados))) ocultarResultados();
    }

    function procesarFormulario(evento) {
        evento.preventDefault();
        establecerEstadoCalculando(true);

        const validacion = validarDatosEntrada();
        if (!validacion.valido) {
            establecerEstadoCalculando(false);
            ultimoResultado = null;
            return;
        }

        try {
            ultimoResultado = ejecutar(validacion.datos);
            mostrarInforme(ultimoResultado);
            registrarEvento("generate_report");
            anunciarEstado("Tu informe personalizado está listo.");
        } catch (error) {
            ultimoResultado = null;
            mostrarErrorGeneral(CONFIG.mensajes.errorCalculo);
            anunciarEstado(CONFIG.mensajes.errorCalculo);
        } finally {
            window.setTimeout(
                () => establecerEstadoCalculando(false),
                CONFIG.comportamiento.tiempoBloqueoBoton
            );
        }
    }

    function validarDatosEntrada() {
        const validacionBase = validarFormulario();
        const fechaValida = validarFechaParto();
        const actividadValida = validarActividad();

        if (!validacionBase.valido || !fechaValida || !actividadValida) {
            if (validacionBase.valido) {
                if (!fechaValida) {
                    $("#fechaParto").focus();
                } else {
                    const nombreGrupo = $("input[name='actividadAntes']:checked")
                        ? "actividadActual"
                        : "actividadAntes";
                    const primerGrupoIncompleto = $(`input[name='${nombreGrupo}']`);
                    if (primerGrupoIncompleto) primerGrupoIncompleto.focus();
                }
            }
            anunciarEstado(CONFIG.mensajes.formularioIncompleto);
            return { valido: false, datos: null };
        }

        return { valido: true, datos: obtenerDatos() };
    }

    function obtenerDatos() {
        const valor = selector => $(selector).value.trim();
        return {
            edad: convertirANumero(valor("#edad")),
            altura: convertirANumero(valor("#altura")),
            pesoAntes: convertirANumero(valor("#pesoAntes")),
            pesoActual: convertirANumero(valor("#pesoActual")),
            fechaParto: valor("#fechaParto"),
            tipoParto: valor("#tipoParto"),
            lactancia: valor("#lactancia"),
            actividadAntes: $("input[name='actividadAntes']:checked").value,
            actividadActual: $("input[name='actividadActual']:checked").value,
            sintomas: Array.from($$("input[name='sintomas']:checked"), campo => campo.value)
        };
    }

    function ejecutar(datos) {
        const tiempo = calcularTiempoPosparto(datos.fechaParto);
        const etapa = clasificarEtapa(tiempo);
        const parto = clasificarParto(datos.tipoParto);
        const lactancia = clasificarLactancia(datos.lactancia);
        const actividad = clasificarActividad(datos.actividadAntes, datos.actividadActual);
        const usuario = crearPerfilUsuario(datos, tiempo, etapa, parto, lactancia, actividad);
        const sintomas = analizarSintomas(usuario);
        return generarObjetoResultado(usuario, sintomas);
    }

    function calcularTiempoPosparto(fechaISO) {
        const [anio, mes, dia] = fechaISO.split("-").map(Number);
        const fechaPartoUTC = new Date(Date.UTC(anio, mes - 1, dia));
        const ahora = new Date();
        const hoyUTC = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
        const dias = Math.floor((hoyUTC - fechaPartoUTC) / MILISEGUNDOS_DIA);
        const mesesCompletos = calcularMesesCompletos(fechaPartoUTC, hoyUTC);
        const inicioFraccion = sumarMesesUTC(fechaPartoUTC, mesesCompletos);
        const finFraccion = sumarMesesUTC(fechaPartoUTC, mesesCompletos + 1);
        const fraccionMes = (hoyUTC - inicioFraccion) / (finFraccion - inicioFraccion);

        return Object.freeze({
            fechaParto: fechaISO,
            dias,
            semanas: redondearNumero(dias / 7, 2),
            semanasCompletas: Math.floor(dias / 7),
            meses: redondearNumero(mesesCompletos + Math.max(0, fraccionMes), 2),
            mesesCompletos,
            trimestre: Math.floor(mesesCompletos / 3) + 1
        });
    }

    function calcularMesesCompletos(inicio, fin) {
        let meses = (fin.getUTCFullYear() - inicio.getUTCFullYear()) * 12
            + fin.getUTCMonth() - inicio.getUTCMonth();
        if (sumarMesesUTC(inicio, meses) > fin) meses -= 1;
        return Math.max(0, meses);
    }

    function sumarMesesUTC(fecha, cantidad) {
        const primerDia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + cantidad, 1));
        const ultimoDiaMes = new Date(Date.UTC(
            primerDia.getUTCFullYear(),
            primerDia.getUTCMonth() + 1,
            0
        )).getUTCDate();
        return new Date(Date.UTC(
            primerDia.getUTCFullYear(),
            primerDia.getUTCMonth(),
            Math.min(fecha.getUTCDate(), ultimoDiaMes)
        ));
    }

    function clasificarEtapa(tiempo) {
        if (tiempo.dias <= 7) return crearEtapa(1, "posparto-inmediato", "Posparto inmediato");
        if (tiempo.dias <= 42) return crearEtapa(2, "posparto-temprano", "Posparto temprano");
        if (tiempo.dias <= 84) return crearEtapa(3, "recuperacion-inicial", "Recuperación inicial");
        if (tiempo.meses <= 6) return crearEtapa(4, "recuperacion-intermedia", "Recuperación intermedia");
        if (tiempo.meses <= 12) return crearEtapa(5, "recuperacion-avanzada", "Recuperación avanzada");
        return crearEtapa(6, "mas-de-doce-meses", "Más de 12 meses");
    }

    function crearEtapa(numero, clave, nombre) {
        return Object.freeze({ numero, clave, nombre });
    }

    function clasificarParto(clave) {
        return Object.freeze({ ...TIPOS_PARTO[clave], ramas: {
            partoVaginal: clave === "vaginal",
            cesarea: clave === "cesarea",
            partoInstrumental: clave === "instrumental"
        } });
    }

    function clasificarLactancia(clave) {
        return Object.freeze({ ...TIPOS_LACTANCIA[clave] });
    }

    function clasificarActividad(antes, actual) {
        return Object.freeze({
            antes: Object.freeze({ ...NIVELES_ACTIVIDAD[antes] }),
            actual: Object.freeze({ ...NIVELES_ACTIVIDAD[actual] })
        });
    }

    function crearPerfilUsuario(datos, tiempo, etapa, parto, lactancia, actividad) {
        return Object.freeze({
            edad: datos.edad,
            altura: datos.altura,
            pesoAntes: datos.pesoAntes,
            pesoActual: datos.pesoActual,
            tipoParto: parto,
            lactancia,
            actividadAntes: actividad.antes,
            actividadActual: actividad.actual,
            dias: tiempo.dias,
            semanas: tiempo.semanas,
            meses: tiempo.meses,
            trimestre: tiempo.trimestre,
            tiempo,
            etapa,
            sintomas: Object.freeze([...datos.sintomas])
        });
    }

    function analizarSintomas(usuario) {
        const seleccionados = new Set(usuario.sintomas);
        return Object.freeze(Object.fromEntries(
            Object.entries(CATEGORIAS_SINTOMAS).map(([categoria, sintomas]) => [
                categoria,
                Object.freeze(sintomas.filter(sintoma => seleccionados.has(sintoma)))
            ])
        ));
    }

    function generarObjetoResultado(usuario, clasificacionSintomas) {
        const contenido = MotorContenidoPosparto.generar(usuario);
        const plan = MotorPlanRecuperacion.generar(usuario, contenido);
        const alertas = MotorAlertasPosparto.generar(usuario, contenido, plan);
        return {
            usuario,
            clasificacionSintomas,
            contenido,
            plan,
            timelineInteligente: MotorTimelinePosparto.generar(usuario, contenido, plan),
            alertas,
            posicionCronologia: Math.min(100, redondearNumero((usuario.meses / 12) * 100, 2)),
            estadoGeneral: {
                abdomen: {}, utero: {}, peso: {}, piel: {}, hormonas: {},
                actividad: {}, sueloPelvico: {}, energia: {}, digestivo: {}, alertas: {}
            },
            resumen: {},
            cambios: {},
            abdomen: {},
            utero: {},
            hormonas: {},
            peso: {},
            sueloPelvico: {},
            piel: {},
            cabello: {},
            actividad: {},
            alimentacion: {},
            timeline: [],
            recomendaciones: []
        };
    }

    function mostrarInforme(resultado) {
        const usuario = resultado.usuario;
        const presentacion = PRESENTACION_ETAPAS[usuario.etapa.clave];
        const totalSintomas = usuario.sintomas.length;

        establecerTexto("#resumenResultado", crearSubtitulo(usuario));
        establecerTexto("#informeSemanas", formatearCantidad(usuario.semanas, "semana", "semanas"));
        establecerTexto("#informeDias", formatearCantidad(usuario.dias, "día", "días"));
        establecerTexto("#informeMeses", formatearCantidad(usuario.meses, "mes", "meses"));
        establecerTexto("#informeEtapa", usuario.etapa.nombre);
        establecerTexto("#informeParto", usuario.tipoParto.nombre);
        establecerTexto("#informeLactancia", usuario.lactancia.nombre);
        establecerTexto("#informeActividad", usuario.actividadActual.nombre);

        const tarjetaEtapa = $("#tarjetaEtapa");
        tarjetaEtapa.dataset.etapaColor = presentacion.color;
        establecerTexto("#iconoEtapa", presentacion.icono);
        establecerTexto("#nombreEtapa", usuario.etapa.nombre);
        establecerTexto("#descripcionEtapa", presentacion.descripcion);

        $("#posicionActual").style.left = `${resultado.posicionCronologia}%`;
        establecerTexto("#cronologiaEstado", `Posición actual: ${usuario.etapa.nombre}, aproximadamente ${formatearNumero(usuario.meses, 1)} meses desde el parto.`);

        establecerTexto("#perfilParto", usuario.tipoParto.nombre);
        establecerTexto("#perfilLactancia", usuario.lactancia.nombre);
        establecerTexto("#perfilActividad", `${usuario.actividadAntes.nombre} antes · ${usuario.actividadActual.nombre} ahora`);
        establecerTexto("#perfilSintomas", totalSintomas
            ? usuario.sintomas.map(sintoma => NOMBRES_SINTOMAS[sintoma]).join(", ")
            : "No has seleccionado síntomas");
        establecerTexto("#totalSintomas", totalSintomas);
        establecerTexto("#interpretacionResultado", crearInterpretacion(usuario));
        pintarPrioridades(PRIORIDADES_ETAPAS[usuario.etapa.numero]);
        RenderizadorContenidoPosparto.renderContenido(resultado.contenido);
        RenderizadorPlanRecuperacion.renderPlanRecuperacion(resultado.plan);
        RenderizadorTimelinePosparto.renderTimeline(resultado.timelineInteligente);
        RenderizadorAlertasPosparto.renderAlertas(resultado.alertas);

        const seccion = $(CONFIG.selectores.seccionResultados);
        mostrarElemento(seccion);
        seccion.classList.remove("informe-visible");
        window.requestAnimationFrame(() => {
            seccion.classList.add("informe-visible");
            scrollAElemento(seccion, { block: "start" });
            enfocarElemento(seccion);
        });
    }

    function crearSubtitulo(usuario) {
        return `Según la información facilitada, esta orientación corresponde a la etapa de ${usuario.etapa.nombre.toLowerCase()} tras ${fraseParto(usuario.tipoParto.clave)}, ${fraseLactancia(usuario.lactancia.clave)}.`;
    }

    function crearInterpretacion(usuario) {
        const sintomas = usuario.sintomas.length;
        const contextoSintomas = sintomas === 0
            ? "No has indicado síntomas en el formulario"
            : `Has seleccionado ${sintomas} ${sintomas === 1 ? "síntoma" : "síntomas"}`;
        return `Te encuentras aproximadamente en la semana ${formatearNumero(usuario.semanas, 1)} tras ${fraseParto(usuario.tipoParto.clave)}. Tu etapa actual es ${usuario.etapa.nombre.toLowerCase()} y tu actividad se describe como ${usuario.actividadActual.nombre.toLowerCase()}. ${fraseLactancia(usuario.lactancia.clave, true)}. ${contextoSintomas}; estos datos ayudan a contextualizar la información, aunque la evolución posparto es individual y este informe no establece diagnósticos.`;
    }

    function fraseParto(clave) {
        if (clave === "cesarea") return "una cesárea";
        if (clave === "instrumental") return "un parto instrumental";
        return "un parto vaginal";
    }

    function fraseLactancia(clave, iniciarMayuscula = false) {
        const frases = { exclusiva: "con lactancia exclusiva", mixta: "con lactancia mixta", no: "sin lactancia" };
        const frase = frases[clave];
        return iniciarMayuscula ? frase.charAt(0).toUpperCase() + frase.slice(1) : frase;
    }

    function formatearCantidad(valor, singular, plural) {
        const decimales = Number.isInteger(valor) ? 0 : 1;
        return `${formatearNumero(valor, decimales)} ${valor === 1 ? singular : plural}`;
    }

    function pintarPrioridades(prioridades) {
        const lista = $("#listaPrioridades");
        lista.replaceChildren(...prioridades.map(prioridad => {
            const elemento = document.createElement("li");
            elemento.textContent = prioridad;
            return elemento;
        }));
    }

    function validarActividad() {
        let valido = true;
        const grupos = [
            ["actividadAntes", "#errorActividadAntes", "Selecciona tu nivel de actividad anterior."],
            ["actividadActual", "#errorActividadActual", "Selecciona tu actividad actual."]
        ];

        grupos.forEach(([nombre, selectorError, mensaje]) => {
            limpiarError(selectorError);
            const grupo = $(`input[name='${nombre}']`).closest("[role='radiogroup']");
            if (!$(`input[name='${nombre}']:checked`)) {
                mostrarError(selectorError, mensaje);
                grupo.setAttribute("aria-invalid", "true");
                valido = false;
            } else {
                grupo.removeAttribute("aria-invalid");
            }
        });

        return valido;
    }

    function validarFechaParto() {
        const campo = $("#fechaParto");
        if (!campo.value) return false;
        const [anio, mes, dia] = campo.value.split("-").map(Number);
        const fecha = new Date(Date.UTC(anio, mes - 1, dia));
        const ahora = new Date();
        const hoy = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
        const fechaCoherente = fecha.getUTCFullYear() === anio
            && fecha.getUTCMonth() === mes - 1
            && fecha.getUTCDate() === dia;

        if (!fechaCoherente || fecha > hoy) {
            mostrarError("#errorFechaParto", CONFIG.campos.fechaParto.mensajes.invalido);
            return false;
        }
        return true;
    }

    function obtenerFechaLocalActual() {
        const hoy = new Date();
        const desplazamiento = hoy.getTimezoneOffset() * 60000;
        return new Date(hoy.getTime() - desplazamiento).toISOString().slice(0, 10);
    }

    function actualizarProgreso() {
        const pasos = [
            ["#edad", "#altura", "#pesoAntes", "#pesoActual"],
            ["#fechaParto", "#tipoParto", "#lactancia"],
            ["input[name='actividadAntes']:checked", "input[name='actividadActual']:checked"],
            ["input[name='sintomas']:checked"]
        ];
        const completos = pasos.map((selectores, indice) => selectores.every(selector => {
            const elemento = $(selector);
            if (indice === 3) return Boolean(elemento);
            return Boolean(elemento && String(elemento.value).trim());
        }));
        completos[3] = completos.slice(0, 3).every(Boolean);

        let pasoActual = completos.findIndex(completo => !completo);
        if (pasoActual === -1) pasoActual = pasos.length - 1;
        const porcentaje = Math.round((completos.filter(Boolean).length / pasos.length) * 100);

        $("#barraProgreso").style.width = `${porcentaje}%`;
        $("#progresoFormulario").setAttribute("aria-valuenow", String(porcentaje));
        $("#progresoTexto").textContent = `${porcentaje}% completado`;
        $$(".progreso-paso").forEach((paso, indice) => {
            paso.classList.toggle("completado", completos[indice]);
            paso.classList.toggle("actual", indice === pasoActual);
            if (indice === pasoActual) paso.setAttribute("aria-current", "step");
            else paso.removeAttribute("aria-current");
        });
    }

    function reiniciar() {
        reiniciarHerramientaBase();
        ultimoResultado = null;
        $$("[role='radiogroup'][aria-invalid]").forEach(grupo => grupo.removeAttribute("aria-invalid"));
        actualizarProgreso();
        mostrarElemento($(CONFIG.selectores.botonReiniciar));
        registrarEvento("reset_form");
        anunciarEstado(CONFIG.mensajes.reinicioCorrecto);
    }

    function registrarEvento(nombre) {
        if (CONFIG.funciones.analiticaEventos && typeof window.gtag === "function") {
            window.gtag("event", nombre, { tool_name: CONFIG.herramienta.proyecto });
        }
    }

    function anunciarEstado(mensaje) {
        const estado = $("#estadoFormulario");
        estado.textContent = "";
        window.requestAnimationFrame(() => { estado.textContent = mensaje; });
    }

    function obtenerUltimoResultado() {
        return ultimoResultado;
    }

    return Object.freeze({ iniciar, ejecutar, obtenerUltimoResultado });
})();

document.addEventListener("DOMContentLoaded", MotorRecuperacionPosparto.iniciar);
