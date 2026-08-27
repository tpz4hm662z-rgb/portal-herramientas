(function testPhase2UiContract(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var base = root.ImoancyFetalWeightTestBase;
    var read = root.ImoancyFetalWeightTestRead;
    var html = read(base + "/index.html");
    var css = read(base + "/css/style.css");
    var controller = read(base + "/js/script.js");
    var storage = read(base + "/js/fetal-records-storage.js");

    function includes(text, fragment) {
        return text.indexOf(fragment) !== -1;
    }

    h.test("HTML loads the frozen scientific modules before the controller", function () {
        var order = ["science-config.js", "science-engine.js", "safety-screening.js",
            "fetal-records.js", "fetal-records-storage.js", "script.js"];
        var last = -1;
        order.forEach(function (name) {
            var position = html.indexOf('src="js/' + name + '"');
            h.ok(position > last, name + " must load in contract order");
            last = position;
        });
    });

    h.test("legacy scientific controller dependencies are not loaded", function () {
        h.ok(!includes(html, 'src="js/config.js"'));
        h.ok(!includes(html, 'src="js/core.js"'));
    });

    h.test("input mode radios have no preselected answer", function () {
        var inputs = html.match(/<input[^>]+name="input-mode"[^>]*>/g) || [];
        h.equal(inputs.length, 2);
        inputs.forEach(function (input) { h.ok(!/\schecked(?:\s|>|=)/.test(input)); });
    });

    h.test("pregnancy screening radios have no preselected answer", function () {
        var inputs = html.match(/<input[^>]+name="pregnancy-population"[^>]*>/g) || [];
        h.equal(inputs.length, 3);
        inputs.forEach(function (input) { h.ok(!/\schecked(?:\s|>|=)/.test(input)); });
    });

    h.test("singleton, multiple and unknown are explicit options", function () {
        h.ok(includes(html, 'value="singleton_confirmed"'));
        h.ok(includes(html, 'value="multiple"'));
        h.ok(includes(html, 'value="unknown"'));
    });

    h.test("clinical dating confirmation is explicit and has no preselected answer", function () {
        var inputs = html.match(/<input[^>]+name="gestational-age-source"[^>]*>/g) || [];
        h.equal(inputs.length, 3);
        inputs.forEach(function (input) { h.ok(!/\schecked(?:\s|>|=)/.test(input)); });
        h.ok(includes(html, 'value="established"'));
        h.ok(includes(html, 'value="not_established"'));
        h.ok(includes(controller, "gestational_age_confirmation_required"));
    });

    h.test("BPD is not an interactive input", function () {
        h.ok(!/<input[^>]+(?:id|name)="[^"]*bpd/i.test(html));
        h.ok(includes(html, "BPD no es necesario"));
    });

    ["hc-mm", "ac-mm", "fl-mm", "report-efw", "gestational-weeks", "gestational-days",
        "scan-date", "report-method"].forEach(function labelled(id) {
        h.test(id + " has a visible label", function () {
            h.ok(includes(html, 'for="' + id + '"'));
            h.ok(includes(html, 'id="' + id + '"'));
        });
    });

    h.test("inline errors avoid duplicating the assertive summary announcement", function () {
        var errors = html.match(/<p[^>]+class="field-error"[^>]*>/g) || [];
        h.ok(errors.length >= 10);
        errors.forEach(function (error) { h.ok(!includes(error, 'role="status"')); });
    });

    h.test("error summary is focusable and assertive", function () {
        h.ok(/id="form-error-summary"[^>]+role="alert"[^>]+aria-live="assertive"[^>]+tabindex="-1"/.test(html));
    });

    h.test("result and Passport status regions are focusable", function () {
        h.ok(/id="resultados"[^>]+tabindex="-1"/.test(html));
        h.ok(/id="passport-status"[^>]+aria-live="polite"[^>]+tabindex="-1"/.test(html));
    });

    h.test("select numeric values use their string value instead of input-only valueAsNumber", function () {
        h.ok(includes(controller, 'control.tagName === "SELECT" ? Number(raw) : control.valueAsNumber'));
    });

    h.test("destructive actions use inline confirmation rather than alert or confirm", function () {
        h.ok(includes(html, 'id="confirmation-panel"'));
        h.ok(!/\balert\s*\(/.test(controller));
        h.ok(!/\bconfirm\s*\(/.test(controller));
    });

    h.test("controller clears residual aria-invalid state", function () {
        h.ok(includes(controller, 'removeAttribute("aria-invalid")'));
        h.ok(includes(controller, 'clearFormErrors'));
    });

    h.test("controller restores focus after cancel", function () {
        h.ok(includes(controller, "focusElement(trigger)"));
    });

    h.test("controller moves focus after save and mutations", function () {
        h.ok(includes(controller, 'focusElement(byId("passport-title"))'));
        h.ok(includes(controller, 'focusElement(savedEntries.length === 0'));
    });

    h.test("confirmation can be cancelled with Escape", function () {
        h.ok(includes(controller, 'event.key === "Escape"'));
    });

    h.test("touch targets meet the 44 CSS pixel baseline", function () {
        h.ok(/\.radio-row label\{[^}]*min-height:44px/.test(css));
        h.ok(/\.boton\{min-height:50px/.test(css));
    });

    h.test("keyboard focus is visibly styled", function () {
        h.ok(includes(css, ":focus-visible"));
        h.ok(includes(css, "outline:3px solid"));
    });

    h.test("long stored strings are protected from layout overflow", function () {
        h.ok(includes(css, ".passport-card dd,.comparison-record dd{overflow-wrap:anywhere"));
        h.ok(includes(css, ".confirmation-panel"));
        h.ok(includes(css, "overflow:auto"));
    });

    h.test("mobile breakpoints include narrow phones", function () {
        h.ok(includes(css, "@media(max-width:393px)"));
        h.ok(includes(css, "grid-template-columns:1fr"));
    });

    h.test("layout does not hide horizontal overflow globally", function () {
        h.ok(!/body\s*\{[^}]*overflow-x\s*:\s*hidden/.test(css));
        h.ok(!/html\s*\{[^}]*overflow-x\s*:\s*hidden/.test(css));
        h.ok(includes(css, "width:min(calc(100% - 32px),var(--container))"));
    });

    h.test("error and primary colors use high-contrast dark values", function () {
        h.ok(includes(css, "color:#991b1b"));
        h.ok(includes(css, "background:#1d4ed8"));
    });

    h.test("reduced-motion preference is respected", function () {
        h.ok(includes(css, "@media(prefers-reduced-motion:reduce)"));
    });

    h.test("visible privacy copy explains local browser storage", function () {
        h.ok(includes(html, "Permanece en el almacenamiento local de este navegador"));
        h.ok(includes(html, "No requiere cuenta"));
        h.ok(includes(html, "puede desaparecer si borras los datos del navegador"));
    });

    h.test("visible privacy copy excludes screening and identity data", function () {
        h.ok(includes(html, "No guarda respuestas del cribado ni datos identificativos"));
    });

    h.test("controller and storage send no custom input analytics", function () {
        [controller, storage].forEach(function (source) {
            h.ok(!/\bgtag\s*\(/.test(source));
            h.ok(!/\bfetch\s*\(/.test(source));
            h.ok(!/sendBeacon/.test(source));
            h.ok(!/XMLHttpRequest/.test(source));
        });
    });

    h.test("multiple pregnancy reaches the Safety gate before requesting singleton inputs", function () {
        h.ok(includes(controller, 'populationControl.value === "multiple"'));
        h.ok(includes(controller, 'safety.screenFetalWeightContext({'));
    });

    h.test("Passport has explicit corruption recovery and discard controls", function () {
        h.ok(includes(html, 'id="recover-valid-records"'));
        h.ok(includes(html, 'id="discard-corrupt-storage"'));
        h.ok(includes(controller, "recoverValidEntries"));
        h.ok(includes(controller, "discardCorruptData"));
    });

    h.test("first record copy explains the second-record unlock", function () {
        h.ok(includes(html, "Si más adelante registras otra ecografía"));
        h.ok(includes(html, "Comparar no equivale"));
    });

    h.test("comparison UI names A and B without automatic chronology", function () {
        h.ok(includes(html, "Ecografía A"));
        h.ok(includes(html, "Ecografía B"));
        h.ok(includes(html, "No se reordenan por fecha"));
    });

    h.test("comparison controller delegates to the frozen records API", function () {
        h.ok(includes(controller, "records.compareFetalPassportEntries(first, second)"));
    });

    h.test("history exposes a contextual open action", function () {
        h.ok(includes(controller, 'data-action="open"'));
        h.ok(includes(controller, 'aria-label="Abrir '));
        h.ok(includes(controller, "renderSavedEntry(entry)"));
    });

    h.test("repeated delete actions receive contextual accessible names", function () {
        h.ok(includes(controller, 'aria-label="Eliminar '));
        h.ok(includes(controller, "presentationLabel(entry)"));
    });

    h.test("storage corruption disables ordinary destructive controls", function () {
        h.ok(includes(controller, "storageBlocked ? ' disabled"));
        h.ok(includes(controller, 'byId("clear-passport").disabled = storageBlocked'));
    });

    h.test("comparison presentation includes human units", function () {
        [" g", " kg", " días", "semanas +"].forEach(function (unit) {
            h.ok(includes(controller + html, unit), "missing " + unit);
        });
    });

    h.test("result shows grams before visual kilograms", function () {
        h.ok(html.indexOf('id="result-weight"') < html.indexOf('id="result-kilograms"'));
        h.ok(includes(html, "Peso fetal estimado"));
    });

    h.test("percentile scale has a text alternative and no clinical zones", function () {
        h.ok(includes(html, 'id="percentile-text-alternative"'));
        h.ok(includes(controller, "no es una categoría clínica"));
        h.ok(!includes(css, "zone-low"));
        h.ok(!includes(css, "zone-high"));
    });

    h.test("z-score is visible only as a non-diagnostic statistical value", function () {
        h.ok(includes(html, 'id="result-z-score"'));
        h.ok(includes(html, "Dato estadístico; no es un diagnóstico"));
        h.ok(includes(controller, 'renderReference(position.percentile, position.zScore)'));
    });

    h.test("structured FAQ documents both accepted biometric units", function () {
        h.ok(includes(html, "milímetros o centímetros"));
        h.ok(includes(html, "Selecciona explícitamente milímetros o centímetros"));
    });

    h.test("unknown report methods do not receive Stirnemann-Hadlock position", function () {
        h.ok(includes(controller, 'value.reportedMethod = "report_efw_method_unknown"'));
        h.ok(includes(html, "no se calculan percentil ni z-score"));
    });

    h.test("result explicitly rejects diagnosis and isolated evolution claims", function () {
        h.ok(includes(html, "No clasifica por sí solo"));
        h.ok(includes(html, "Una observación aislada no describe por sí sola la evolución"));
    });

    h.test("comparison explicitly rejects rate, cause and prediction", function () {
        h.ok(includes(controller, "no calcula velocidad"));
        h.ok(includes(controller, "no atribuye causas"));
        h.ok(includes(controller, "no predice mediciones futuras"));
    });

    h.test("only two contextual product links are rendered near the result", function () {
        var block = html.match(/<div class="contextual-tools-grid">([\s\S]*?)<\/div>\s*<\/aside>/);
        h.ok(block);
        h.equal((block[1].match(/<a /g) || []).length, 2);
    });

    h.test("duplicate bottom related-tools block was removed", function () {
        h.ok(!includes(html, 'id="herramientas-relacionadas"'));
    });

    h.test("all static HTML identifiers are unique", function () {
        var ids = [];
        var match;
        var pattern = /\sid="([^"]+)"/g;
        while ((match = pattern.exec(html))) ids.push(match[1]);
        h.equal(new Set(ids).size, ids.length);
    });

    ["formulaHadlock", "interpolarCurvas", "9.43643", "9.41579", "83.54220",
        "0.1", "99.9"].forEach(function forbiddenScience(fragment) {
        h.test("controller does not duplicate scientific implementation " + fragment, function () {
            h.ok(!includes(controller, fragment));
        });
    });

    ["growthRate", "growthVelocity", "comparabilityScore", "riskLevel",
        "birthWeightPrediction", "inferGestationalAge"].forEach(function forbiddenProduct(fragment) {
        h.test("Phase 2 production JS omits " + fragment, function () {
            h.ok(!includes(controller + storage, fragment));
        });
    });
}(globalThis));
