/* Lógica específica: no prescribe volúmenes ni sustituye la valoración clínica. */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#formularioHerramienta");
    const reset = document.querySelector("#botonReiniciar");
    const birth = document.querySelector("#fechaNacimiento");
    const due = document.querySelector("#fechaPrevista");
    const today = fechaLocalHoy();
    birth.max = today;
    due.max = sumarAnios(today, 1);
    form.addEventListener("submit", procesarFormulario);
    reset.addEventListener("click", reiniciar);
});

function fechaLocalHoy() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function sumarAnios(fechaISO, cantidad) {
    const partes = fechaISO.split("-").map(Number);
    return `${partes[0] + cantidad}-${String(partes[1]).padStart(2, "0")}-${String(partes[2]).padStart(2, "0")}`;
}

function leerFecha(id) {
    const valor = document.querySelector(id).value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [a, m, d] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d));
    return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d ? fecha : null;
}

function diasEntre(inicio, fin) { return Math.floor((fin - inicio) / 86400000); }

function duracionHumana(dias, permitirNegativo = false) {
    const negativo = dias < 0;
    const total = Math.abs(dias);
    const meses = Math.floor(total / 30.4375);
    const diasRestantes = Math.round(total - meses * 30.4375);
    const texto = meses === 0 ? `${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}` : `${meses} ${meses === 1 ? "mes" : "meses"}${diasRestantes ? ` y ${diasRestantes} días` : ""}`;
    return negativo && permitirNegativo ? `faltan ${texto}` : texto;
}

function limpiarErrores() {
    document.querySelectorAll(".mensaje-error").forEach(el => { el.textContent = ""; });
    document.querySelectorAll("[aria-invalid='true']").forEach(el => el.removeAttribute("aria-invalid"));
    document.querySelector("#errorGeneral").textContent = "";
}

function error(id, mensaje) {
    const campo = document.querySelector(id);
    campo.setAttribute("aria-invalid", "true");
    document.querySelector(`#error${campo.id.charAt(0).toUpperCase()}${campo.id.slice(1)}`).textContent = mensaje;
}

function procesarFormulario(evento) {
    evento.preventDefault();
    limpiarErrores();
    const nacimiento = leerFecha("#fechaNacimiento");
    const prevista = leerFecha("#fechaPrevista");
    const peso = Number(document.querySelector("#pesoActual").value);
    const alimentacion = document.querySelector("#tipoAlimentacion").value;
    const tomasValor = document.querySelector("#tomasDia").value;
    const tomas = tomasValor === "" ? null : Number(tomasValor);
    const [hoyA, hoyM, hoyD] = fechaLocalHoy().split("-").map(Number);
    const hoy = new Date(Date.UTC(hoyA, hoyM - 1, hoyD));
    let valido = true;
    if (!nacimiento || nacimiento > hoy) { error("#fechaNacimiento", "Introduce una fecha de nacimiento válida, no futura."); valido = false; }
    if (!prevista) { error("#fechaPrevista", "Introduce una fecha prevista de parto válida."); valido = false; }
    if (nacimiento && prevista && prevista < nacimiento) { error("#fechaPrevista", "La fecha prevista de parto no puede ser anterior al nacimiento."); valido = false; }
    if (!Number.isFinite(peso) || peso < 0.3 || peso > 25) { error("#pesoActual", "Introduce un peso actual entre 0,3 y 25 kg."); valido = false; }
    if (!alimentacion) { error("#tipoAlimentacion", "Selecciona el tipo de alimentación."); valido = false; }
    if (tomas !== null && (!Number.isInteger(tomas) || tomas < 1 || tomas > 24)) { error("#tomasDia", "Indica un número entero entre 1 y 24, o deja el campo vacío."); valido = false; }
    if (!valido) { document.querySelector("#errorGeneral").textContent = CONFIG.mensajes.errorGeneral; document.querySelector("[aria-invalid='true']")?.focus(); return; }
    pintar(calcular({ nacimiento, prevista, peso, alimentacion, tomas, hoy }));
}

function calcular(datos) {
    const diasCronologicos = Math.max(0, diasEntre(datos.nacimiento, datos.hoy));
    const diasPrematuridad = Math.max(0, diasEntre(datos.nacimiento, datos.prevista));
    const diasCorregidos = diasCronologicos - diasPrematuridad;
    const semanasCorregidas = diasCorregidos / 7;
    let etapa;
    if (diasCorregidos < 0) etapa = { nombre: "Antes de la fecha prevista de parto", consejo: "La alimentación suele requerir un plan individualizado del equipo de neonatología. La coordinación entre succión, deglución y respiración puede estar todavía madurando." };
    else if (diasCorregidos < 4 * 30.4375) etapa = { nombre: "Primeros meses de edad corregida", consejo: "La leche continúa siendo el alimento principal. Observa la eficacia de las tomas, los pañales mojados, el bienestar y la evolución del crecimiento con el equipo sanitario." };
    else if (diasCorregidos < 6 * 30.4375) etapa = { nombre: "Valoración de la preparación", consejo: "Puede empezar a valorarse la alimentación complementaria, pero la edad por sí sola no decide el momento: importan el desarrollo, la estabilidad clínica y los signos de preparación." };
    else if (diasCorregidos < 12 * 30.4375) etapa = { nombre: "Alimentación complementaria progresiva", consejo: "La leche sigue teniendo un papel central mientras se incorporan texturas y alimentos variados de forma progresiva, segura y según la pauta profesional." };
    else etapa = { nombre: "Dieta familiar adaptada", consejo: "Se avanza hacia una alimentación variada, equilibrada y con texturas adecuadas, manteniendo el seguimiento del crecimiento y del desarrollo oral." };
    return { ...datos, diasCronologicos, diasCorregidos, semanasCorregidas, etapa };
}

function pintar(r) {
    const nombres = { materna: "Lactancia materna", extraida: "Leche materna extraída", formula: "Fórmula para prematuros", mixta: "Alimentación mixta" };
    document.querySelector("#edadCronologica").textContent = duracionHumana(r.diasCronologicos);
    document.querySelector("#edadCorregida").textContent = r.diasCorregidos < 0 ? duracionHumana(r.diasCorregidos, true) : duracionHumana(r.diasCorregidos);
    document.querySelector("#semanasCorregidas").textContent = r.diasCorregidos < 0 ? `faltan ${Math.ceil(Math.abs(r.semanasCorregidas))} semanas` : `${Math.floor(r.semanasCorregidas)} semanas`;
    document.querySelector("#etapaAlimentaria").textContent = r.etapa.nombre;
    document.querySelector("#alimentacionResultado").textContent = nombres[r.alimentacion];
    document.querySelector("#resumenResultado").textContent = `Tu bebé tiene ${duracionHumana(r.diasCronologicos)} de edad cronológica y ${r.diasCorregidos < 0 ? duracionHumana(r.diasCorregidos, true) + " para alcanzar la edad corregida de 0 días" : duracionHumana(r.diasCorregidos) + " de edad corregida"}.`;
    document.querySelector("#consejoEtapa").textContent = r.etapa.consejo;
    document.querySelector("#notaTomas").textContent = r.tomas ? `Has indicado ${r.tomas} tomas al día. Este dato no permite valorar por sí solo si la ingesta es suficiente; coméntalo con el equipo que sigue al bebé.` : "No has indicado el número de tomas. La frecuencia necesaria varía y debe valorarse junto con la eficacia de las tomas y el crecimiento.";
    const resultados = document.querySelector("#resultados");
    resultados.setAttribute("tabindex", "-1");
    resultados.setAttribute("aria-atomic", "true");
    resultados.classList.remove("oculto"); resultados.removeAttribute("hidden");
    document.querySelector("#botonReiniciar").classList.remove("oculto");
    resultados.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    resultados.focus({ preventScroll: true });
}

function reiniciar() {
    document.querySelector("#formularioHerramienta").reset(); limpiarErrores();
    document.querySelector("#resultados").classList.add("oculto");
    document.querySelector("#resultados").setAttribute("hidden", "");
    document.querySelector("#botonReiniciar").classList.add("oculto");
    document.querySelector("#fechaNacimiento").focus();
}
