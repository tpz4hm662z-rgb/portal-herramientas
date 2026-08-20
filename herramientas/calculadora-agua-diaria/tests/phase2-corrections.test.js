(function runWaterPhaseTwoCorrectionTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var ui = root.ImoancyWaterUI;
    var science = root.ImoancyWaterScience;
    var read = root.ImoancyWaterTestRead;
    var base = root.ImoancyWaterTestBase;
    var html = read(base + "/index.html");
    var controller = read(base + "/script.js");
    var css = read(base + "/style.css");

    function luminance(hex) {
        var channels = [0, 2, 4].map(function channel(offset) {
            var value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
            return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function contrast(left, right) {
        var values = [luminance(left), luminance(right)].sort(function descending(a, b) { return b - a; });
        return (values[0] + 0.05) / (values[1] + 0.05);
    }

    h.test("cribado no preselecciona etapa ni contexto de seguridad", function () {
        h.equal(/name="lifeStage"[^>]*checked|name="hasSafetyContext"[^>]*checked/.test(html), false);
        h.ok(html.indexOf('<option value="">Selecciona una opción</option>') >= 0);
        h.ok(html.indexOf('<option value="">Selecciona una respuesta</option>') >= 0);
    });
    h.test("controlador bloquea etapa y seguridad sin respuesta explícita", function () {
        h.ok(controller.indexOf('["none", "pregnancy", "lactation", "both"].indexOf(stage) < 0') >= 0);
        h.ok(controller.indexOf('["no", "yes"].indexOf(safetyChoice) < 0') >= 0);
        h.ok(controller.indexOf('focusFirstInvalid(byId("reference-form"))') >= 0);
    });
    h.test("confirmaciones de referencia usan revelado progresivo", function () {
        h.ok(html.indexOf('id="reference-confirmations" hidden') >= 0);
        h.ok(html.indexOf('aria-controls="reference-confirmations"') >= 0);
        h.ok(controller.indexOf('focusElement(byId("life-stage"))') >= 0);
    });
    h.test("hero móvil mantiene detalles conceptuales colapsables", function () {
        h.ok(html.indexOf('<details class="hero-details">') >= 0);
        h.ok(css.indexOf("padding: 28px 18px 58px") >= 0);
    });
    h.test("errores de campos tienen destinos identificables", function () {
        [
            "reference-age-error", "reference-group-error", "life-stage-error",
            "safety-context-error", "safety-details-error", "pre-weight-error",
            "post-weight-error", "fluid-intake-error", "duration-minutes-error",
            "urine-volume-error", "temperature-context-error", "humidity-context-error"
        ].forEach(function errorPresent(id) { h.ok(html.indexOf('id="' + id + '"') >= 0); });
    });
    h.test("controlador asocia aria-invalid y aria-describedby al error", function () {
        h.ok(controller.indexOf('element.setAttribute("aria-invalid", "true")') >= 0);
        h.ok(controller.indexOf('element.setAttribute("aria-describedby"') >= 0);
        h.ok(controller.indexOf('element.removeAttribute("aria-invalid")') >= 0);
        h.ok(controller.indexOf('element.removeAttribute("aria-describedby")') >= 0);
    });
    h.test("campos opcionales vacíos limpian errores obsoletos", function () {
        var optionalBranch = controller.slice(controller.indexOf("if (settings.optional)"), controller.indexOf("value = Number(raw)"));
        h.ok(optionalBranch.indexOf("clearFieldError(id)") >= 0);
    });
    h.test("reinicios limpian todos los estados de error", function () {
        var resetReference = controller.slice(controller.indexOf("function resetReference"), controller.indexOf("function resetSession"));
        var resetSession = controller.slice(controller.indexOf("function resetSession"), controller.indexOf("function setDefaultDate"));
        h.ok(resetReference.indexOf("clearFormFieldErrors(form)") >= 0);
        h.ok(resetSession.indexOf("clearFormFieldErrors(form)") >= 0);
    });
    h.test("contraste del cian textual sobre blanco supera 4.5 a 1", function () {
        h.ok(contrast("0e7490", "ffffff") >= 4.5);
    });
    h.test("contraste del anillo de foco sobre blanco supera 3 a 1", function () {
        h.ok(contrast("1e40af", "ffffff") >= 3);
        h.ok(css.indexOf("--focus-ring: #1e40af") >= 0);
    });
    h.test("errores y borrado aportan señal no dependiente solo del color", function () {
        h.ok(css.indexOf('content: "Error: "') >= 0);
        h.ok(css.indexOf('content: "× "') >= 0);
    });
    h.test("cadenas del usuario pueden partirse sin ocultar overflow", function () {
        h.ok(css.indexOf("overflow-wrap: anywhere") >= 0);
        h.ok(css.indexOf(".detail-list li") >= 0);
        h.equal(/body\s*\{[^}]*overflow-x:\s*hidden/.test(css), false);
    });
    h.test("cada sesión combina ordinal fecha hora y actividad", function () {
        h.ok(controller.indexOf('"Sesión " + String(index + 1)') >= 0);
        h.ok(controller.indexOf('toLocaleTimeString("es-ES"') >= 0);
        h.ok(controller.indexOf('formatEntryDateTime(entry) + " · " + entryTitle(entry)') >= 0);
    });
    h.test("sesiones con fecha actividad tasa y duración idénticas siguen distinguiéndose", function () {
        var sameEntry = {
            createdAt: "2026-08-20T18:42:00.000Z",
            sessionDate: "2026-08-20",
            context: { activity: "carrera" }
        };
        var first = ui.describePassportEntry(sameEntry, 0);
        var second = ui.describePassportEntry(sameEntry, 1);
        h.ok(first.indexOf("Sesión 1") >= 0);
        h.ok(second.indexOf("Sesión 2") >= 0);
        h.equal(first === second, false);
    });
    h.test("acciones del historial reciben nombres accesibles contextuales", function () {
        h.ok(controller.indexOf('aria-label="Eliminar ') >= 0);
        h.ok(controller.indexOf('Abrir detalles de ') >= 0);
        h.ok(controller.indexOf('aria-label="' + "' + escapeHtml(descriptor)") >= 0);
    });
    h.test("selectores de comparación usan el descriptor humano completo", function () {
        var option = controller.slice(controller.indexOf("function comparisonOption"), controller.indexOf("function showStorageProblem"));
        h.ok(option.indexOf("entryDescriptor(entry, index)") >= 0);
    });
    h.test("detalle conserva todas las medidas originales y resultados", function () {
        [
            "Registro local:", "Masa antes:", "Masa después:", "Líquidos durante la sesión:",
            "Orina durante la sesión:", "Duración:", "Tasa de sudoración observada:",
            "Pérdida estimada:", "Cambio de masa:", "Actividad:", "Temperatura:",
            "Humedad:", "Entorno:", "Intensidad:", "Ropa/equipamiento:", "Notas:"
        ].forEach(function detailPresent(text) { h.ok(controller.indexOf(text) >= 0); });
    });
    h.test("detalle recuerda que la sesión permanece local", function () {
        h.ok(controller.indexOf("almacenamiento local de este navegador") >= 0);
    });
    h.test("comparación traduce códigos de entorno e intensidad", function () {
        ["Interior", "Exterior", "Suave", "Media", "Alta"].forEach(function translation(value) {
            h.ok(controller.indexOf(value) >= 0);
        });
    });
    h.test("comparación presenta unidades humanas", function () {
        var formatter = controller.slice(controller.indexOf("function formatContextValue"), controller.indexOf("function describeDimension"));
        [" min", " °C", " %"].forEach(function unit(value) { h.ok(formatter.indexOf(value) >= 0); });
    });
    h.test("comparación 60 min contra 60 min muestra coincidencia conocida", function () {
        var comparison = science.compareSessionContexts(
            { durationMinutes: 60 },
            { durationMinutes: 60 }
        );
        h.includes(comparison.matches, "durationMinutes");
        h.equal(
            ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes),
            "Duración: 60 min"
        );
    });
    h.test("comparación 60 min contra 90 min muestra diferencia conocida", function () {
        var comparison = science.compareSessionContexts(
            { durationMinutes: 60 },
            { durationMinutes: 90 }
        );
        h.includes(comparison.differences, "durationMinutes");
        h.equal(
            ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes),
            "Duración: 60 min → 90 min"
        );
    });
    h.test("duración conocida contra ausente se muestra como dato desconocido", function () {
        var comparison = science.compareSessionContexts(
            { durationMinutes: 60 },
            {}
        );
        h.includes(comparison.unknown, "durationMinutes");
        h.equal(
            ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes),
            "Duración: falta en una o ambas sesiones"
        );
    });
    h.test("dos duraciones ausentes se muestran como dato desconocido", function () {
        var comparison = science.compareSessionContexts({}, {});
        h.includes(comparison.unknown, "durationMinutes");
        h.equal(
            ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes),
            "Duración: falta en una o ambas sesiones"
        );
    });
    h.test("un dato desconocido nunca termina en coincidencias", function () {
        [{ durationMinutes: 60 }, {}].forEach(function missingOnEitherSide(left, index, rows) {
            var right = rows[1 - index];
            var comparison = science.compareSessionContexts(left, right);
            h.equal(comparison.matches.indexOf("durationMinutes"), -1);
            h.includes(comparison.unknown, "durationMinutes");
        });
    });
    h.test("comparación conserva unidades min grados porcentaje y litros por hora", function () {
        var comparison = science.compareSessionContexts(
            { durationMinutes: 60, temperatureC: 20, humidityPercent: 50 },
            { durationMinutes: 90, temperatureC: 25, humidityPercent: 65 }
        );
        h.equal(ui.describeComparisonDimension("durationMinutes", comparison.dimensions.durationMinutes), "Duración: 60 min → 90 min");
        h.equal(ui.describeComparisonDimension("temperatureC", comparison.dimensions.temperatureC), "Temperatura: 20,0 °C → 25,0 °C");
        h.equal(ui.describeComparisonDimension("humidityPercent", comparison.dimensions.humidityPercent), "Humedad: 50 % → 65 %");
        h.ok(controller.indexOf(' + " L/h y " +') >= 0);
    });
    h.test("comparación no atribuye causalidad ni calcula promedio", function () {
        h.ok(controller.indexOf("no demuestran causas") >= 0);
        h.ok(controller.indexOf("No se calcula un promedio") >= 0);
    });
    h.test("duración acepta minutos y horas en presentación", function () {
        h.ok(html.indexOf('id="duration-unit"') >= 0);
        h.ok(html.indexOf('<option value="hours">horas</option>') >= 0);
    });
    h.test("90 minutos se convierten en 90 minutos internos", function () {
        h.equal(ui.convertDurationToMinutes(90, "minutes"), 90);
    });
    h.test("1.5 horas se convierten en 90 minutos internos", function () {
        h.equal(ui.convertDurationToMinutes(1.5, "hours"), 90);
    });
    h.test("conversión de duración rechaza unidad y valores inválidos", function () {
        h.equal(ui.convertDurationToMinutes(1, "days"), null);
        h.equal(ui.convertDurationToMinutes(0, "minutes"), null);
        h.equal(ui.convertDurationToMinutes("1.5", "hours"), null);
    });
    h.test("comparación aparece antes del historial", function () {
        h.ok(html.indexOf('class="comparison-card"') < html.indexOf('id="passport-list"'));
    });
    h.test("comparación se habilita de forma explícita desde dos sesiones", function () {
        h.ok(controller.indexOf("compareButton.disabled = savedEntries.length < 2") >= 0);
        h.ok(html.indexOf('id="compare-sessions" class="button button-primary"') >= 0);
    });
    h.test("toda reconstrucción del historial invalida comparación activa", function () {
        var render = controller.slice(controller.indexOf("function renderPassport"), controller.indexOf("function findEntry"));
        h.ok(render.indexOf('clearMessage(byId("comparison-result"))') >= 0);
    });
    h.test("guardar eliminar recuperar y borrar reconstruyen el historial", function () {
        var mutationRenders = controller.match(/renderPassport\(\);/g) || [];
        h.ok(mutationRenders.length >= 6);
        h.ok(controller.indexOf("savedEntries = saveResult.entries") < controller.indexOf("renderPassport();"));
    });
    h.test("guardar mueve foco a la confirmación", function () {
        var save = controller.slice(controller.indexOf("function saveCurrentSession"), controller.indexOf("function formatEntryDateTime"));
        h.ok(save.indexOf("focusElement(status)") >= 0);
    });
    h.test("eliminar mueve foco a otra sesión o al estado vacío", function () {
        var render = controller.slice(controller.indexOf("function renderPassport"), controller.indexOf("function findEntry"));
        h.ok(render.indexOf("focusElement(list.children") >= 0);
        h.ok(render.indexOf("focusElement(empty)") >= 0);
    });
    h.test("recuperar y borrar todo restauran foco lógico", function () {
        h.ok(controller.indexOf("focusElement(box)") >= 0);
        h.ok(controller.indexOf('focusElement(byId("passport-empty"))') >= 0);
    });
    h.test("antes de guardar explica qué dónde y para qué", function () {
        h.ok(controller.indexOf("la medición, la tasa observada, el contexto registrado") >= 0);
        h.ok(controller.indexOf("en este navegador") >= 0);
        h.ok(controller.indexOf("comparar futuras mediciones") >= 0);
    });
    h.test("primera sesión explica el valor del regreso sin gamificación", function () {
        h.ok(controller.indexOf("Primera medición guardada") >= 0);
        h.ok(controller.indexOf("Cuando registres otra sesión") >= 0);
        h.equal(/streak|badge|puntos/i.test(controller), false);
    });
    h.test("privacidad enumera datos locales y posible pérdida", function () {
        ["pesos", "líquidos", "tasa observada", "contexto", "notas", "almacenamiento local", "Pueden perderse"]
            .forEach(function privacyTerm(term) { h.ok(html.indexOf(term) >= 0); });
    });
    h.test("controlador no transmite datos mediante APIs de red", function () {
        h.equal(/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|gtag\s*\(/.test(controller), false);
    });
}(globalThis));
