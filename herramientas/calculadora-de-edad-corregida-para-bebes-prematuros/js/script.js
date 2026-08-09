/* Imoancy Template v3.1 Stable · Lógica específica */
"use strict";

const MS_DIA = 86400000;

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    const botonReiniciar = $(CONFIG.selectores.botonReiniciar);
    const hoy = fechaISO(new Date());

    $("#fechaNacimiento").max = hoy;
    $("#fechaReferencia").max = hoy;
    $("#fechaReferencia").value = hoy;

    formulario.addEventListener("submit", procesarFormulario);
    botonReiniciar.addEventListener("click", () => {
        reiniciarHerramientaBase();
        $("#fechaReferencia").value = hoy;
        $("#diasGestacion").value = "0";
        $("#fechaNacimiento").focus();
    });
}

function procesarFormulario(evento) {
    evento.preventDefault();
    establecerEstadoCalculando(true);

    const validacion = validarFormulario();
    const validacionEspecifica = validarDatosClinicos(validacion.valores);

    if (!validacion.valido || !validacionEspecifica) {
        establecerEstadoCalculando(false);
        return;
    }

    const resultado = calcular(validacion.valores);
    pintarResultados(resultado);
    pintarExperienciaPremium(resultado);
    registrarCalculo();
    establecerEstadoCalculando(false);
}

function validarDatosClinicos(datos) {
    let valido = true;
    const nacimiento = leerFecha(datos.fechaNacimiento);
    const referencia = leerFecha(datos.fechaReferencia);
    const hoy = leerFecha(fechaISO(new Date()));

    if (!nacimiento) {
        mostrarError("#errorFechaNacimiento", "Introduce una fecha de nacimiento válida.");
        valido = false;
    } else if (nacimiento > hoy) {
        mostrarError("#errorFechaNacimiento", "La fecha de nacimiento no puede ser futura.");
        valido = false;
    }

    if (!referencia) {
        mostrarError("#errorFechaReferencia", "Introduce una fecha de referencia válida.");
        valido = false;
    } else if (referencia > hoy) {
        mostrarError("#errorFechaReferencia", "La fecha de referencia no puede ser futura.");
        valido = false;
    } else if (nacimiento && referencia < nacimiento) {
        mostrarError("#errorFechaReferencia", "La fecha de referencia debe ser igual o posterior al nacimiento.");
        valido = false;
    }

    if (!Number.isInteger(datos.semanasGestacion)) {
        mostrarError("#errorSemanasGestacion", "Introduce semanas completas, sin decimales.");
        valido = false;
    }

    if (!Number.isInteger(datos.diasGestacion)) {
        mostrarError("#errorDiasGestacion", "Introduce un número entero entre 0 y 6.");
        valido = false;
    }

    if (!valido) {
        const primerError = $("[aria-invalid='true']");
        if (primerError) primerError.focus();
    }
    return valido;
}

function calcular(datos) {
    const nacimiento = leerFecha(datos.fechaNacimiento);
    const referencia = leerFecha(datos.fechaReferencia);
    const gestacionDias = (datos.semanasGestacion * 7) + datos.diasGestacion;
    const prematuridadDias = 280 - gestacionDias;
    const probableParto = sumarDias(nacimiento, prematuridadDias);
    const cronologicaDias = diferenciaDias(nacimiento, referencia);
    const corregidaDias = diferenciaDias(probableParto, referencia);
    const antesDeTermino = corregidaDias < 0;
    const dosAniosCorregidos = sumarAnios(probableParto, 2);
    const correccionSuperada = referencia >= dosAniosCorregidos;

    let principal;
    let descripcion;
    let resumen;
    let interpretacion;
    let recomendaciones;

    if (antesDeTermino) {
        principal = "Aún no ha llegado la FPP";
        descripcion = `Faltan ${formatearSemanasDias(Math.abs(corregidaDias))} para la fecha probable de parto.`;
        resumen = `En la fecha elegida, tu bebé tiene ${formatearDuracion(nacimiento, referencia)} de edad cronológica.`;
        interpretacion = "Todavía no se expresa una edad corregida positiva porque no ha llegado la fecha en la que se completarían 40 semanas. Esto es esperable: durante este periodo resulta más útil hablar de edad gestacional o de cuánto falta para la fecha probable de parto.";
        recomendaciones = [
            "Usa la fecha probable de parto como punto de inicio de la edad corregida.",
            "Sigue las indicaciones del equipo de neonatología para alimentación, crecimiento y cuidados.",
            "No compares el ritmo del bebé con el de un recién nacido a término de la misma edad cronológica."
        ];
    } else {
        principal = formatearDuracion(probableParto, referencia);
        descripcion = correccionSuperada
            ? "La calculamos como referencia, aunque después de los 24 meses suele dejar de ser necesario corregir la edad."
            : "Es la edad que tendría si contamos desde su fecha probable de parto.";
        resumen = `Tu bebé tiene ${formatearDuracion(nacimiento, referencia)} de edad cronológica y ${principal} de edad corregida.`;
        interpretacion = correccionSuperada
            ? "Tu bebé ya ha superado los 24 meses de edad corregida. A partir de esta etapa suele utilizarse la edad cronológica, porque la diferencia relacionada con la prematuridad pierde relevancia progresivamente. Su profesional sanitario puede mantener otro criterio según la evolución individual."
            : "Para observar el desarrollo temprano, toma como referencia principal la edad corregida. La diferencia con la edad cronológica no significa un retraso: representa el tiempo de gestación que faltó antes del nacimiento. Los hitos se valoran dentro de intervalos amplios y según la evolución individual.";
        recomendaciones = correccionSuperada
            ? [
                "Utiliza habitualmente la edad cronológica, salvo indicación distinta de su profesional sanitario.",
                "Valora la trayectoria de desarrollo completa y no una comparación puntual.",
                "Mantén los controles recomendados para su historia de prematuridad."
            ]
            : CONFIG.recomendaciones;
    }

    return {
        principal,
        edadCorregidaDias: corregidaDias,
        antesDeTermino,
        correccionSuperada,
        secundarios: {
            edadCronologica: formatearDuracion(nacimiento, referencia),
            fechaProbableParto: formatearFecha(probableParto),
            prematuridad: formatearSemanasDias(prematuridadDias)
        },
        resumen,
        descripcion,
        interpretacion,
        recomendaciones
    };
}

function pintarExperienciaPremium(resultado) {
    pintarComparacionVisual(resultado);
    pintarGuiaDinamica(resultado.edadCorregidaDias, resultado.antesDeTermino);
}

function pintarComparacionVisual(resultado) {
    const edadCronologica = resultado.secundarios.edadCronologica;
    const edadCorregida = resultado.principal;

    establecerTexto("#comparacionCronologica", edadCronologica);
    establecerTexto("#comparacionCorregida", edadCorregida);

    let comparacion;
    if (resultado.antesDeTermino) {
        comparacion = "Para valorar el desarrollo en este momento suele ser más útil considerar la edad gestacional y cuánto falta para alcanzar la fecha probable de parto.";
    } else if (resultado.correccionSuperada) {
        comparacion = `La edad corregida sería ${edadCorregida.toLowerCase()}, aunque después de los 24 meses suele resultar más útil utilizar la edad cronológica como referencia.`;
    } else {
        comparacion = `Para valorar el desarrollo suele ser más útil compararlo con un bebé nacido a término de aproximadamente ${edadCorregida.toLowerCase()}.`;
    }

    establecerTexto("#textoComparacion", comparacion);
}

function pintarGuiaDinamica(edadCorregidaDias, antesDeTermino) {
    const etapas = CONFIG.guiaDesarrollo || [];
    if (!etapas.length) return;

    const diasParaEtapa = Math.max(0, edadCorregidaDias);
    const etapa = etapas.find(item => diasParaEtapa <= item.hastaDias) || etapas.at(-1);
    const superaGuia = edadCorregidaDias > etapas.at(-1).hastaDias;
    const contenedor = $("#guiaDesarrolloGrid");
    if (!contenedor) return;

    establecerTexto("#etapaGuia", antesDeTermino ? "Antes de la fecha probable de parto" : (superaGuia ? "Más de 24 meses corregidos" : etapa.etapa));
    establecerTexto(
        "#introduccionGuia",
        antesDeTermino
            ? "La fecha probable de parto todavía no ha llegado. Estas ideas anticipan la primera etapa corregida y pueden adaptarse a las indicaciones del equipo neonatal."
            : (superaGuia ? "La corrección suele dejar de utilizarse después de esta etapa. Conservamos las orientaciones de 18–24 meses como contexto, mientras la edad cronológica y el seguimiento individual ganan protagonismo." : etapa.introduccion)
    );
    establecerTexto("#textoProximaEtapa", etapa.despues);

    const iconos = {
        "Desarrollo motor": "🤸",
        "Comunicación": "💬",
        "Juego": "🧸",
        "Sueño": "🌙",
        "Alimentación": "🥣",
        "Interacción social": "🤝",
        "Consejos útiles": "💡"
    };

    contenedor.replaceChildren();

    Object.entries(etapa.areas).forEach(([titulo, texto]) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "guia-area-tarjeta";

        const icono = document.createElement("span");
        icono.className = "guia-area-icono";
        icono.setAttribute("aria-hidden", "true");
        icono.textContent = iconos[titulo] || "•";

        const contenido = document.createElement("div");
        const encabezado = document.createElement("h4");
        const parrafo = document.createElement("p");
        encabezado.textContent = titulo;
        parrafo.textContent = texto;

        contenido.append(encabezado, parrafo);
        tarjeta.append(icono, contenido);
        contenedor.appendChild(tarjeta);
    });
}

function leerFecha(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) return null;
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
    return fecha;
}

function fechaISO(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function sumarDias(fecha, dias) {
    return new Date(fecha.getTime() + (dias * MS_DIA));
}

function sumarAnios(fecha, anios) {
    const copia = new Date(fecha.getTime());
    copia.setUTCFullYear(copia.getUTCFullYear() + anios);
    return copia;
}

function diferenciaDias(inicio, fin) {
    return Math.round((fin.getTime() - inicio.getTime()) / MS_DIA);
}

function formatearFecha(fecha) {
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fecha);
}

function formatearSemanasDias(diasTotales) {
    const semanas = Math.floor(diasTotales / 7);
    const dias = diasTotales % 7;
    const partes = [];
    if (semanas) partes.push(`${semanas} ${semanas === 1 ? "semana" : "semanas"}`);
    if (dias || !partes.length) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
    return partes.join(" y ");
}

function formatearDuracion(inicio, fin) {
    if (fin < inicio) return "0 días";
    let anios = fin.getUTCFullYear() - inicio.getUTCFullYear();
    let cursor = sumarPeriodo(inicio, anios, 0);
    if (cursor > fin) {
        anios--;
        cursor = sumarPeriodo(inicio, anios, 0);
    }
    let meses = 0;
    while (meses < 11 && sumarPeriodo(cursor, 0, meses + 1) <= fin) meses++;
    cursor = sumarPeriodo(cursor, 0, meses);
    const dias = diferenciaDias(cursor, fin);
    const partes = [];
    if (anios) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
    if (meses) partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
    if (dias || !partes.length) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
    return unirPartes(partes);
}

function sumarPeriodo(fecha, anios, meses) {
    const totalMeses = fecha.getUTCMonth() + meses + (anios * 12);
    const anioDestino = fecha.getUTCFullYear() + Math.floor(totalMeses / 12);
    const mesDestino = ((totalMeses % 12) + 12) % 12;
    const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino + 1, 0)).getUTCDate();
    return new Date(Date.UTC(anioDestino, mesDestino, Math.min(fecha.getUTCDate(), ultimoDia)));
}

function unirPartes(partes) {
    if (partes.length < 2) return partes[0];
    return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

function registrarCalculo() {
    if (typeof window.gtag === "function") {
        window.gtag("event", "calculo_edad_corregida", { tool_name: "edad_corregida" });
    }
}
