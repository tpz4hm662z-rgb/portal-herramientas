(function (root) {
  "use strict";

  var core = root.ImoancySueldoCore;
  var documentRef = root.document;
  var currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var decimal = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fieldByCoreName = {
    salarioBaseAnual: "salario-anual", numeroPagas: "form-sueldo", pagExtraProrrateada: "form-sueldo",
    grupoCotizacion: "grupo-cotizacion", tipoContratoCotizacion: "tipo-contrato",
    tipoContratoIrpf: "tipo-contrato", anioNacimiento: "anio-nacimiento",
    situacionFamiliar: "situacion-familiar", discapacidad: "discapacidad",
    movilidadReducida: "movilidad-reducida", tiempoCompleto: "form-sueldo",
    descendientes: "numero-descendientes", remuneracionOrdinariaMes: "salario-anual",
    prorrataPagasExtraMes: "form-sueldo", complementosSalarialesMes: "complementos-mes",
    horasExtraOrdinariasMes: "horas-extra-ordinarias", horasExtraFuerzaMayorMes: "horas-extra-fuerza"
  };
  var errorByFieldId = {
    "salario-anual": "error-salario", "form-sueldo": "error-global", "grupo-cotizacion": "error-grupo",
    "tipo-contrato": "error-contrato", "anio-nacimiento": "error-nacimiento", "situacion-familiar": "error-situacion",
    "discapacidad": "error-discapacidad", "movilidad-reducida": "error-discapacidad", "numero-descendientes": "error-descendientes",
    "complementos-mes": "error-complementos", "horas-extra-ordinarias": "error-extra-ordinarias", "horas-extra-fuerza": "error-extra-fuerza"
  };
  var state = { annual: null, habitualMonth: null, variableMonth: null };

  function byId(id) { return documentRef.getElementById(id); }
  function text(id, value) { byId(id).textContent = value; }
  function money(value) { return Number.isFinite(value) ? currency.format(value === 0 ? 0 : value) : "—"; }
  function percentage(value) { return Number.isFinite(value) ? decimal.format(value === 0 ? 0 : value) + " %" : "—"; }
  function numberValue(id) {
    var element = byId(id);
    return element.value.trim() === "" ? NaN : (element.type === "number" ? element.valueAsNumber : Number(element.value));
  }
  function selectedPayments() { return Number(documentRef.querySelector('input[name="numeroPagas"]:checked').value); }
  function errorMessage(item) {
    var messages = {
      MISSING: "Este dato es obligatorio.", WRONG_TYPE: "Introduce un valor con el formato correcto.", NAN: "Introduce un número válido.",
      INFINITE: "El valor es demasiado grande.", NEGATIVE: "El importe no puede ser negativo.", ZERO: "El valor debe ser mayor que cero.",
      NOT_INTEGER: "Introduce un número entero.", OUT_OF_RANGE: "El valor está fuera de los límites admitidos.",
      UNSUPPORTED: "Esta opción no está soportada por la calculadora.", INCOHERENT: "Revisa este dato porque no es coherente con el resto de opciones."
    };
    return messages[item.codigo] || item.mensaje || "Revisa este dato.";
  }
  function clearErrors() {
    documentRef.querySelectorAll("[aria-invalid=true]").forEach(function (element) { element.removeAttribute("aria-invalid"); });
    documentRef.querySelectorAll(".error-campo").forEach(function (element) { element.hidden = true; element.textContent = ""; });
    var global = byId("error-global"); global.hidden = true; global.textContent = "";
  }
  function coreFieldRoot(path) { return path.indexOf("descendientes[") === 0 ? "descendientes" : path.split(".")[0]; }
  function showErrors(errors) {
    clearErrors();
    var first = null, globalMessages = [];
    errors.forEach(function (item) {
      var coreName = coreFieldRoot(item.campo || "$"), fieldId = fieldByCoreName[coreName] || "form-sueldo";
      var field = byId(fieldId), errorElement = byId(errorByFieldId[fieldId] || "error-global");
      if (field && fieldId !== "form-sueldo") { field.setAttribute("aria-invalid", "true"); if (!first) first = field; }
      if (errorElement && errorElement.id !== "error-global") { errorElement.textContent = errorMessage(item); errorElement.hidden = false; }
      else globalMessages.push(errorMessage(item));
    });
    var global = byId("error-global");
    if (globalMessages.length || !first) { global.textContent = globalMessages[0] || "No se pudo completar el cálculo. Revisa los campos indicados."; global.hidden = false; }
    hideResults();
    (first || global).focus();
  }
  function hideResults() { byId("resultado").hidden = true; byId("resultado-variable").hidden = true; state.annual = null; state.habitualMonth = null; state.variableMonth = null; }

  function createLabeledNumber(id, name, labelText, value) {
    var wrapper = documentRef.createElement("div"), label = documentRef.createElement("label"), input = documentRef.createElement("input"), help = documentRef.createElement("p"), errorElement = documentRef.createElement("p");
    wrapper.className = "campo"; label.htmlFor = id; label.textContent = labelText;
    input.type = "number"; input.id = id; input.name = name; input.value = String(value); input.min = "1906"; input.max = "2026"; input.step = "1"; input.inputMode = "numeric"; input.required = true;
    help.className = "ayuda"; help.id = "ayuda-" + id; help.textContent = "Año de nacimiento del descendiente.";
    errorElement.className = "error-campo"; errorElement.id = "error-" + id; errorElement.hidden = true;
    input.setAttribute("aria-describedby", help.id + " " + errorElement.id);
    wrapper.append(label, input, help, errorElement); return wrapper;
  }
  function createWholeSelector(index, familySituation) {
    var wrapper = documentRef.createElement("div"), label = documentRef.createElement("label"), select = documentRef.createElement("select"), shared = documentRef.createElement("option"), whole = documentRef.createElement("option"), help = documentRef.createElement("p");
    wrapper.className = "campo"; label.htmlFor = "computo-descendiente-" + index; label.textContent = "Cómputo del descendiente";
    select.id = label.htmlFor; select.name = "computoDescendiente" + index;
    shared.value = "compartido"; shared.textContent = "Compartido con otro progenitor"; whole.value = "entero"; whole.textContent = "Por entero";
    select.append(shared, whole); select.value = familySituation === 1 ? "entero" : "compartido"; if (familySituation === 1) select.disabled = true;
    help.className = "ayuda"; help.id = "ayuda-computo-" + index; help.textContent = familySituation === 1 ? "La situación monoparental exige cómputo por entero." : "Selecciona por entero solo cuando proceda fiscalmente.";
    select.setAttribute("aria-describedby", help.id); wrapper.append(label, select, help); return wrapper;
  }
  function renderDescendantFields() {
    var count = Number(byId("numero-descendientes").value), family = Number(byId("situacion-familiar").value), container = byId("datos-descendientes"), fragment = documentRef.createDocumentFragment();
    container.replaceChildren(); container.hidden = count === 0; if (!count) return;
    var heading = documentRef.createElement("h3"); heading.textContent = "Datos de tus descendientes"; fragment.append(heading);
    for (var index = 0; index < count; index += 1) {
      var row = documentRef.createElement("div"); row.className = "descendiente-fila";
      row.append(createLabeledNumber("anio-descendiente-" + index, "anioDescendiente" + index, "Año de nacimiento · descendiente " + (index + 1), 2018 - index), createWholeSelector(index, family)); fragment.append(row);
    }
    container.append(fragment);
  }
  function descendantValues() {
    var count = Number(byId("numero-descendientes").value), family = Number(byId("situacion-familiar").value), values = [];
    for (var index = 0; index < count; index += 1) {
      var select = byId("computo-descendiente-" + index);
      values.push({ anioNacimiento: numberValue("anio-descendiente-" + index), computoEntero: family === 1 || select.value === "entero" });
    }
    return values;
  }
  function annualInput() {
    var payments = selectedPayments();
    return {
      salarioBaseAnual: numberValue("salario-anual"), complementosSalarialesAnuales: 0,
      horasExtraOrdinariasAnuales: 0, horasExtraFuerzaMayorAnuales: 0,
      numeroPagas: payments, pagExtraProrrateada: payments === 12,
      grupoCotizacion: numberValue("grupo-cotizacion"), tipoContratoCotizacion: byId("tipo-contrato").value,
      tipoContratoIrpf: "general", anioNacimiento: numberValue("anio-nacimiento"),
      situacionFamiliar: numberValue("situacion-familiar"), discapacidad: byId("discapacidad").value,
      movilidadReducida: byId("movilidad-reducida").checked, movilidadGeografica: byId("movilidad-geografica").checked,
      prestamoVivienda: false, pensionCompensatoriaAnual: 0, anualidadesAlimentosAnuales: 0,
      descendientes: descendantValues(), ascendientes: [], tiempoCompleto: true
    };
  }
  function monthlyInput(annual, withVariables) {
    var payments = selectedPayments(), ordinaryPaid = annual.pagas.brutoPagaOrdinaria;
    var proratedExtra = payments === 14 ? annual.remuneracion.ordinariaMensualCotizable - ordinaryPaid : 0;
    return {
      remuneracionOrdinariaMes: ordinaryPaid, prorrataPagasExtraMes: proratedExtra,
      complementosSalarialesMes: withVariables ? numberValue("complementos-mes") : 0,
      horasExtraOrdinariasMes: withVariables ? numberValue("horas-extra-ordinarias") : 0,
      horasExtraFuerzaMayorMes: withVariables ? numberValue("horas-extra-fuerza") : 0,
      numeroPagas: payments, grupoCotizacion: numberValue("grupo-cotizacion"),
      tipoContratoCotizacion: byId("tipo-contrato").value, tiempoCompleto: true
    };
  }
  function setRowVisibility(id, visible) { byId(id).hidden = !visible; }
  function renderAnnual(result) {
    state.annual = result;
    text("resultado-neto-anual", money(result.resumen.netoAnual)); text("resultado-neto-medio", "Media mensual en 12 meses: " + money(result.resumen.netoMensualPromedio12));
    text("resultado-bruto", money(result.resumen.brutoAnual)); text("resultado-cotizaciones", money(result.resumen.seguridadSocialAnual)); text("resultado-irpf", money(result.resumen.irpfAnual)); text("resultado-tipo-irpf", percentage(result.irpf.tipoRetencion));
    text("paga-ordinaria", money(result.pagas.netoPagaOrdinaria)); text("etiqueta-paga-ordinaria", result.pagas.pagasExtra ? "Nómina ordinaria estimada" : "Neto mensual estimado");
    setRowVisibility("bloque-paga-extra", result.pagas.pagasExtra > 0); if (result.pagas.pagasExtra) text("paga-extra", money(result.pagas.netoPagaExtra));
    var q = result.seguridadSocial.cuotas;
    text("cuota-comunes", money(q.contingenciasComunes)); text("cuota-desempleo", money(q.desempleo)); text("cuota-formacion", money(q.formacionProfesional)); text("cuota-mei", money(q.mei)); text("cuota-total", money(q.total));
    setRowVisibility("fila-solidaridad-anual", q.solidaridad > 0); if (q.solidaridad > 0) text("cuota-solidaridad", money(q.solidaridad));
    var overtime = q.horasExtraOrdinarias + q.horasExtraFuerzaMayor; setRowVisibility("fila-extra-anual", overtime > 0); if (overtime > 0) text("cuota-extra-anual", money(overtime));
    var gross = result.resumen.brutoAnual;
    text("cada-cien-neto", money(result.resumen.netoAnual / gross * 100)); text("cada-cien-cotizaciones", money(result.resumen.seguridadSocialAnual / gross * 100)); text("cada-cien-irpf", money(result.resumen.irpfAnual / gross * 100));
    byId("resultado").hidden = false;
  }
  function renderVariable(habitual, variable) {
    state.habitualMonth = habitual; state.variableMonth = variable;
    text("habitual-bruto", money(habitual.comparacion.brutoMes)); text("habitual-cotizaciones", money(habitual.comparacion.cotizacionesTrabajador));
    text("variable-bruto", money(variable.comparacion.brutoMes)); text("variable-cotizaciones", money(variable.comparacion.cotizacionesTrabajador));
    text("diferencia-bruto", "+" + money(variable.comparacion.brutoMes - habitual.comparacion.brutoMes)); text("diferencia-cotizaciones", money(variable.comparacion.cotizacionesTrabajador - habitual.comparacion.cotizacionesTrabajador));
    var q = variable.cuotas;
    text("variable-comunes", money(q.contingenciasComunes)); text("variable-desempleo", money(q.desempleo)); text("variable-formacion", money(q.formacionProfesional)); text("variable-mei", money(q.mei)); text("variable-total", money(q.total));
    setRowVisibility("fila-variable-solidaridad", q.solidaridad > 0); if (q.solidaridad > 0) text("variable-solidaridad", money(q.solidaridad));
    setRowVisibility("fila-variable-extra-ordinaria", q.horasExtraOrdinarias > 0); if (q.horasExtraOrdinarias > 0) text("variable-extra-ordinaria", money(q.horasExtraOrdinarias));
    setRowVisibility("fila-variable-extra-fuerza", q.horasExtraFuerzaMayor > 0); if (q.horasExtraFuerzaMayor > 0) text("variable-extra-fuerza", money(q.horasExtraFuerzaMayor));
    byId("resultado-variable").hidden = false;
  }
  function hasMonthlyVariables() { return ["complementos-mes", "horas-extra-ordinarias", "horas-extra-fuerza"].some(function (id) { var value = numberValue(id); return Number.isFinite(value) && value !== 0; }); }
  function calculate(event) {
    if (event) event.preventDefault(); clearErrors(); hideResults();
    if (!core || !root.ImoancySueldoNormativa2026) { showErrors([{ campo: "$", codigo: "UNSUPPORTED", mensaje: "No se ha podido cargar el motor 2026." }]); return false; }
    var annual = core.calculate(annualInput()); if (!annual.ok) { showErrors(annual.errors); return false; }
    var habitual = core.calculateMonthlyContribution(monthlyInput(annual, false)); if (!habitual.ok) { showErrors(habitual.errors); return false; }
    renderAnnual(annual); state.habitualMonth = habitual;
    if (hasMonthlyVariables()) { var variable = core.calculateMonthlyContribution(monthlyInput(annual, true)); if (!variable.ok) { showErrors(variable.errors); return false; } renderVariable(habitual, variable); }
    byId("titulo-resultado").focus(); return true;
  }
  function updateDisabilityState() { var enabled = byId("discapacidad").value === "33a64"; byId("movilidad-reducida").disabled = !enabled; if (!enabled) byId("movilidad-reducida").checked = false; }
  function resetUI() {
    clearErrors(); hideResults(); byId("opciones-avanzadas").open = false; byId("opciones-variables").open = false; renderDescendantFields(); updateDisabilityState(); byId("salario-anual").focus();
  }
  function init() {
    var form = byId("form-sueldo"); if (!form) return;
    form.addEventListener("submit", calculate);
    form.addEventListener("reset", function () { root.setTimeout(resetUI, 0); });
    byId("numero-descendientes").addEventListener("change", renderDescendantFields); byId("situacion-familiar").addEventListener("change", renderDescendantFields); byId("discapacidad").addEventListener("change", updateDisabilityState);
    renderDescendantFields(); updateDisabilityState();
    root.ImoancySueldoUI = Object.freeze({ calculate: calculate, reset: function () { form.reset(); }, getState: function () { return state; }, renderDescendantFields: renderDescendantFields });
  }
  if (documentRef.readyState === "loading") documentRef.addEventListener("DOMContentLoaded", init); else init();
}(typeof globalThis !== "undefined" ? globalThis : this));
