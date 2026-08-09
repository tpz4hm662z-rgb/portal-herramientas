/* Lógica específica — percentil de perímetro cefálico OMS 0–60 meses */
"use strict";

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
    const formulario = $(CONFIG.selectores.formulario);
    const reiniciar = $(CONFIG.selectores.botonReiniciar);
    const compartir = $("#botonCompartir");
    formulario.addEventListener("submit", procesarFormulario);
    reiniciar.addEventListener("click", () => {
        reiniciarHerramientaBase();
        ocultarElemento(compartir);
        establecerTexto("#estadoFormulario", "");
        establecerTexto("#estadoCompartir", "");
        window.setTimeout(() => $("#datoUno").focus(), 0);
    });
    compartir.addEventListener("click", compartirResultado);
    Object.values(CONFIG.campos).forEach(campo => {
        const control = $(campo.selector);
        const eventos = campo.tipo === "select" ? ["change", "blur"] : ["input", "blur"];
        eventos.forEach(tipo => control.addEventListener(tipo, () => {
            validarCampoEnTiempoReal(campo);
            ocultarElemento(compartir);
            establecerTexto("#estadoFormulario", "");
            establecerTexto("#estadoCompartir", "");
        }));
    });
}

function tieneFormatoDecimalValido(valor) {
    return /^-?\d+(?:[.,]\d+)?$/.test(String(valor).trim());
}

function validarCampoEnTiempoReal(campo) {
    const resultado = validarCampo(campo);
    if (!resultado.valido || campo.tipo !== "numero") return resultado.valido;
    const control = $(campo.selector);
    if (!tieneFormatoDecimalValido(control.value)) {
        mostrarError(campo.selectorError, campo.mensajes.invalido);
        return false;
    }
    return true;
}

function validarFormatosYSexo() {
    let valido = true;
    let primerInvalido = null;
    [CONFIG.campos.datoUno, CONFIG.campos.datoDos].forEach(campo => {
        const control = $(campo.selector);
        if (control.value.trim() && !tieneFormatoDecimalValido(control.value)) {
            mostrarError(campo.selectorError, campo.mensajes.invalido);
            valido = false;
            primerInvalido ||= control;
        }
    });
    const sexo = $(CONFIG.campos.opcion.selector).value;
    if (sexo && !["nino", "nina"].includes(sexo)) {
        mostrarError(CONFIG.campos.opcion.selectorError, CONFIG.campos.opcion.mensajes.invalido);
        valido = false;
        primerInvalido ||= $(CONFIG.campos.opcion.selector);
    }
    if (primerInvalido) {
        scrollAElemento(primerInvalido, { block: "center" });
        enfocarElemento(primerInvalido);
    }
    return valido;
}

function procesarFormulario(evento) {
    evento.preventDefault();
    establecerEstadoCalculando(true);
    const validacion = validarFormulario();
    const formatosValidos = validarFormatosYSexo();
    if (!validacion.valido || !formatosValidos) {
        establecerTexto("#estadoFormulario", CONFIG.mensajes.errorGeneral);
        establecerEstadoCalculando(false);
        return;
    }
    establecerTexto("#estadoFormulario", "");
    try {
        const resultado = calcular(validacion.valores);
        pintarResultados(resultado);
        mostrarElemento($("#botonCompartir"));
    } catch (error) {
        establecerTexto("#estadoFormulario", CONFIG.mensajes.errorCalculo);
    } finally {
        establecerEstadoCalculando(false);
    }
}

/* Parámetros LMS oficiales OMS para cada mes completo (0–60). L es 1 en
   toda la serie. Para edades decimales se interpolan M y S linealmente. */
const OMS_PC = {
    nino: {
        meses: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60],
        m: [34.4618,37.2759,39.1285,40.5135,41.6317,42.5576,43.3306,43.9803,44.5300,44.9998,45.4051,45.7573,46.0661,46.3395,46.5844,46.8060,47.0088,47.1962,47.3711,47.5357,47.6919,47.8408,47.9833,48.1201,48.2515,48.3777,48.4989,48.6151,48.7264,48.8331,48.9351,49.0327,49.1260,49.2153,49.3007,49.3826,49.4612,49.5367,49.6093,49.6791,49.7465,49.8116,49.8745,49.9354,49.9942,50.0512,50.1064,50.1598,50.2115,50.2617,50.3105,50.3578,50.4039,50.4488,50.4926,50.5354,50.5772,50.6183,50.6587,50.6984,50.7375],
        s: [0.03686,0.03133,0.02997,0.02918,0.02868,0.02837,0.02817,0.02804,0.02796,0.02792,0.02790,0.02789,0.02789,0.02789,0.02791,0.02792,0.02795,0.02797,0.02800,0.02803,0.02806,0.02810,0.02813,0.02817,0.02821,0.02825,0.02830,0.02834,0.02838,0.02842,0.02847,0.02851,0.02855,0.02859,0.02863,0.02867,0.02871,0.02875,0.02878,0.02882,0.02886,0.02889,0.02893,0.02896,0.02899,0.02903,0.02906,0.02909,0.02912,0.02915,0.02918,0.02921,0.02924,0.02927,0.02929,0.02932,0.02935,0.02938,0.02940,0.02943,0.02946]
    },
    nina: {
        meses: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60],
        m: [33.8787,36.5463,38.2521,39.5328,40.5817,41.4590,42.1995,42.8290,43.3671,43.8300,44.2319,44.5844,44.8965,45.1752,45.4265,45.6551,45.8650,46.0598,46.2424,46.4152,46.5801,46.7384,46.8913,47.0391,47.1822,47.3204,47.4536,47.5817,47.7045,47.8219,47.9340,48.0410,48.1432,48.2408,48.3343,48.4239,48.5099,48.5926,48.6722,48.7489,48.8228,48.8941,48.9629,49.0294,49.0937,49.1560,49.2164,49.2751,49.3321,49.3877,49.4419,49.4947,49.5464,49.5969,49.6464,49.6947,49.7421,49.7885,49.8341,49.8789,49.9229],
        s: [0.03496,0.03210,0.03168,0.03140,0.03119,0.03102,0.03087,0.03075,0.03063,0.03053,0.03044,0.03035,0.03027,0.03019,0.03012,0.03006,0.02999,0.02993,0.02987,0.02982,0.02977,0.02972,0.02967,0.02962,0.02957,0.02953,0.02949,0.02945,0.02941,0.02937,0.02933,0.02929,0.02926,0.02922,0.02919,0.02915,0.02912,0.02909,0.02906,0.02903,0.02900,0.02897,0.02894,0.02891,0.02888,0.02886,0.02883,0.02880,0.02878,0.02875,0.02873,0.02870,0.02868,0.02865,0.02863,0.02861,0.02859,0.02856,0.02854,0.02852,0.02850]
    }
};

function interpolar(edad, serie, valores) {
    if (edad <= serie[0]) return valores[0];
    for (let i = 1; i < serie.length; i += 1) {
        if (edad <= serie[i]) {
            const proporcion = (edad - serie[i - 1]) / (serie[i] - serie[i - 1]);
            return valores[i - 1] + proporcion * (valores[i] - valores[i - 1]);
        }
    }
    return valores[valores.length - 1];
}

function normalAcumulada(z) {
    const signo = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + signo * erf);
}

function calcular(datos) {
    const tabla = OMS_PC[datos.opcion];
    if (!tabla) throw new Error("Sexo no válido para la referencia OMS.");
    const mediana = interpolar(datos.datoUno, tabla.meses, tabla.m);
    const s = interpolar(datos.datoUno, tabla.meses, tabla.s);
    const z = (datos.datoDos / mediana - 1) / s; // L=1 en las tablas OMS de PC/edad
    const percentilExacto = limitarNumero(normalAcumulada(z) * 100, 0.1, 99.9);
    const percentil = limitarNumero(Math.round(percentilExacto), 1, 99);
    let clasificacion = "Normal";
    if (percentilExacto < 3) clasificacion = "Muy bajo";
    else if (percentilExacto < 15) clasificacion = "Bajo";
    else if (percentilExacto > 97) clasificacion = "Muy alto";
    else if (percentilExacto > 85) clasificacion = "Alto";
    const sexo = datos.opcion === "nino" ? "Niño" : "Niña";
    const unidadEdad = datos.datoUno === 1 ? "mes" : "meses";
    const normal = clasificacion === "Normal";
    return {
        principal: `P${percentil}`,
        secundarios: {
            secundarioUno: datos.datoDos,
            secundarioDos: `${formatearNumero(datos.datoUno, 1)} ${unidadEdad} · ${sexo}`,
            secundarioTres: clasificacion
        },
        resumen: `Percentil estimado ${percentil} para ${sexo.toLowerCase()} de ${formatearNumero(datos.datoUno, 1)} ${unidadEdad}.`,
        descripcion: "Estimación según perímetro cefálico para la edad y el sexo en los estándares OMS.",
        interpretacion: normal
            ? "El perímetro cefálico se encuentra dentro del rango esperado para la edad según esta estimación. La trayectoria de varias mediciones aporta más información que un valor aislado."
            : `La estimación se clasifica como «${clasificacion.toLowerCase()}». Esto no establece un diagnóstico: la técnica de medición, la prematuridad y la evolución previa pueden modificar la interpretación.`,
        recomendaciones: [
            "Comprueba que la cinta pasó por la frente, justo sobre las cejas, y por la parte más prominente de la nuca.",
            "Registra las mediciones para valorar su evolución en la curva de crecimiento.",
            normal ? "Mantén los controles pediátricos habituales." : "Se recomienda comentar este resultado con el pediatra para una valoración individual."
        ]
    };
}

async function compartirResultado() {
    const texto = `Percentil cefálico estimado: ${$("#resultadoPrincipal").textContent}. Resultado orientativo de Imoancy.`;
    if (navigator.share) {
        try {
            await navigator.share({ title: CONFIG.herramienta.nombre, text: texto, url: CONFIG.herramienta.url });
            establecerTexto("#estadoCompartir", "Resultado compartido correctamente.");
            return;
        } catch (error) {
            if (error.name === "AbortError") {
                establecerTexto("#estadoCompartir", "Compartición cancelada.");
                return;
            }
        }
    }
    {
        const copiado = await copiarTexto(`${texto} ${CONFIG.herramienta.url}`);
        const boton = $("#botonCompartir");
        boton.textContent = copiado ? "Resultado copiado" : "Compartir resultado";
        establecerTexto("#estadoCompartir", copiado ? "Resultado copiado al portapapeles." : "No se ha podido compartir ni copiar el resultado.");
        window.setTimeout(() => { boton.textContent = "Compartir resultado"; }, 1800);
    }
}
