(function runWaterPhaseTwoUiTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var ui = root.ImoancyWaterUI;
    var science = root.ImoancyWaterScience;
    var read = root.ImoancyWaterTestRead;
    var base = root.ImoancyWaterTestBase;
    var html = read(base + "/index.html");
    var controller = read(base + "/script.js");
    var storageSource = read(base + "/js/passport-storage.js");
    var css = read(base + "/style.css");

    function adultProfile() {
        return ui.buildSafetyProfile({
            ageYears: 30,
            lifeStage: "none",
            hasKnownKidneyDisease: false,
            hasHeartFailureOrFluidRestrictionCondition: false,
            hasMedicalFluidRestriction: false,
            hasRelevantAcuteIllness: false,
            seeksTherapeuticRecommendation: false
        });
    }

    function sessionValues(changes) {
        var values = {
            preWeightKg: 70,
            postWeightKg: 69.3,
            fluidIntakeMl: 500,
            durationMinutes: 60,
            urineMl: 0,
            activity: "carrera",
            temperatureC: 24,
            humidityPercent: 45,
            indoorOutdoor: "outdoor",
            perceivedIntensity: "medium",
            equipmentOrClothing: "camiseta",
            notes: "",
            sessionDate: "2026-08-20"
        };
        Object.keys(changes || {}).forEach(function apply(key) { values[key] = changes[key]; });
        return values;
    }

    h.test("API de presentación Fase 2 disponible y congelada", function () {
        h.ok(ui && typeof ui.initialize === "function");
        h.ok(Object.isFrozen(ui));
    });
    h.test("presentación convierte mililitros a litros", function () {
        h.equal(ui.convertVolumeToLiters(500, "ml"), 0.5);
        h.equal(ui.convertVolumeToLiters(0, "ml"), 0);
    });
    h.test("presentación conserva litros sin transformación", function () {
        h.equal(ui.convertVolumeToLiters(1.25, "L"), 1.25);
    });
    h.test("transformación de volumen rechaza valores inválidos", function () {
        h.equal(ui.convertVolumeToLiters(-1, "ml"), null);
        h.equal(ui.convertVolumeToLiters("500", "ml"), null);
        h.equal(ui.convertVolumeToLiters(NaN, "ml"), null);
        h.equal(ui.convertVolumeToLiters(500, "unknown"), null);
    });
    h.test("perfil UI adulto completa todos los booleanos del cribado", function () {
        var profile = adultProfile();
        h.equal(profile.ageYears, 30);
        Object.keys(profile).filter(function exceptAge(key) { return key !== "ageYears"; })
            .forEach(function falseFlag(key) { h.equal(profile[key], false); });
    });
    h.test("perfil UI representa embarazo", function () {
        var profile = ui.buildSafetyProfile({ ageYears: 30, lifeStage: "pregnancy" });
        h.equal(profile.isPregnant, true);
        h.equal(profile.isLactating, false);
    });
    h.test("perfil UI representa lactancia", function () {
        var profile = ui.buildSafetyProfile({ ageYears: 30, lifeStage: "lactation" });
        h.equal(profile.isPregnant, false);
        h.equal(profile.isLactating, true);
    });
    h.test("integración de cribado permite referencia adulta seleccionada", function () {
        var resolved = ui.resolveReference(adultProfile(), "adult_male");
        h.equal(resolved.decision.status, "educational_scope");
        h.equal(resolved.reference.group, "adult_male");
        h.equal(resolved.reference.totalWaterLitersPerDay, 2.5);
    });
    h.test("integración de cribado bloquea referencia adulta a menor", function () {
        var profile = adultProfile();
        profile.ageYears = 17;
        var resolved = ui.resolveReference(profile, "adult_male");
        h.equal(resolved.decision.status, "unsupported_population");
        h.equal(resolved.reference, null);
    });
    h.test("integración de cribado deriva contexto médico sin cifra", function () {
        var profile = adultProfile();
        profile.hasKnownKidneyDisease = true;
        var resolved = ui.resolveReference(profile, "adult_female");
        h.equal(resolved.decision.status, "medical_referral");
        h.equal(resolved.reference, null);
    });
    h.test("payload de sesión transforma volúmenes antes del motor", function () {
        var payload = ui.buildSessionPayload(sessionValues({ urineMl: 125 }));
        h.equal(payload.inputs.fluidIntakeLiters, 0.5);
        h.equal(payload.inputs.urineLiters, 0.125);
        h.equal(payload.inputs.durationMinutes, 60);
    });
    h.test("payload conserva contexto sin alterar ecuación", function () {
        var payload = ui.buildSessionPayload(sessionValues());
        h.equal(payload.context.activity, "carrera");
        h.equal(payload.context.temperatureC, 24);
        h.equal(payload.context.durationMinutes, payload.inputs.durationMinutes);
    });
    h.test("payload inválido no llega al motor", function () {
        h.equal(ui.buildSessionPayload(sessionValues({ fluidIntakeMl: "500" })), null);
    });
    h.test("resultado de sesión integrado conserva tasa observada", function () {
        var payload = ui.buildSessionPayload(sessionValues());
        var result = science.calculateObservedSweatSession(payload.inputs);
        h.equal(result.status, "valid");
        h.close(result.computed.sweatRateLitersPerHour, 1.2);
        h.equal(result.semantics.isFluidIntakePrescription, false);
    });
    h.test("payload de sesión nunca contiene referencia EFSA", function () {
        var json = JSON.stringify(ui.buildSessionPayload(sessionValues()));
        h.equal(/efsa|totalWaterLitersPerDay|dailyNeed|targetLiters/i.test(json), false);
    });
    h.test("HTML separa referencia y sesión en pestañas accesibles", function () {
        h.ok(html.indexOf('role="tablist"') >= 0);
        h.ok(html.indexOf('aria-controls="panel-reference"') >= 0);
        h.ok(html.indexOf('aria-controls="panel-session"') >= 0);
        h.ok(html.indexOf('role="tabpanel"') >= 0);
    });
    h.test("HTML integra cribado progresivo no persistente", function () {
        h.ok(html.indexOf('id="safety-details"') >= 0);
        h.ok(html.indexOf("Estas respuestas no se guardan") >= 0);
        h.ok(html.indexOf('id="safety-kidney"') >= 0);
        h.ok(html.indexOf('id="safety-therapeutic"') >= 0);
    });
    h.test("HTML ofrece todos los campos principales de sesión", function () {
        ["pre-weight", "post-weight", "fluid-intake", "duration-minutes", "urine-volume"]
            .forEach(function present(id) { h.ok(html.indexOf('id="' + id + '"') >= 0); });
    });
    h.test("HTML ofrece contexto opcional completo", function () {
        [
            "session-date", "activity-context", "temperature-context", "humidity-context",
            "environment-context", "intensity-context", "equipment-context", "notes-context"
        ].forEach(function present(id) { h.ok(html.indexOf('id="' + id + '"') >= 0); });
    });
    h.test("formularios agrupan opciones mediante fieldset y legend", function () {
        h.ok((html.match(/<fieldset/g) || []).length >= 4);
        h.ok((html.match(/<legend/g) || []).length >= 4);
    });
    h.test("resultados y errores dinámicos son anunciables", function () {
        h.ok((html.match(/aria-live="polite"/g) || []).length >= 4);
        h.ok((html.match(/role="alert"/g) || []).length >= 2);
        h.ok(html.indexOf('id="session-result"') >= 0);
    });
    h.test("controles desplegables declaran estado expandido", function () {
        h.ok(html.indexOf('id="context-toggle"') >= 0);
        h.ok(html.indexOf('aria-expanded="false"') >= 0);
        h.ok(controller.indexOf("setAttribute(\"aria-expanded\"") >= 0);
    });
    h.test("controlador gestiona navegación de pestañas por teclado", function () {
        ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"]
            .forEach(function keyPresent(key) { h.ok(controller.indexOf(key) >= 0); });
    });
    h.test("controlador evita alert como sistema de error", function () {
        h.equal(/\balert\s*\(/.test(controller), false);
    });
    h.test("reinicio de sesión no borra el Pasaporte", function () {
        var resetBody = controller.slice(
            controller.indexOf("function resetSession"),
            controller.indexOf("function setDefaultDate")
        );
        h.equal(/store\.clear|localStorage|removeItem/.test(resetBody), false);
    });
    h.test("controlador no instrumenta datos con analytics", function () {
        h.equal(/gtag|dataLayer|analytics|collect\s*\(/i.test(controller), false);
    });
    h.test("persistencia está separada del DOM y analytics", function () {
        h.equal(/\bdocument\b|gtag|dataLayer|analytics/i.test(storageSource), false);
    });
    h.test("HTML declara privacidad exclusivamente local", function () {
        h.ok(html.indexOf("únicamente en este dispositivo") >= 0);
        h.equal(/crear cuenta|sincronizar con la nube/i.test(html), false);
    });
    h.test("comparación del núcleo separa coincidencias diferencias e incógnitas", function () {
        var comparison = science.compareSessionContexts(
            { activity: "carrera", durationMinutes: 60, temperatureC: 20 },
            { activity: "carrera", durationMinutes: 75 }
        );
        h.includes(comparison.matches, "activity");
        h.includes(comparison.differences, "durationMinutes");
        h.includes(comparison.unknown, "temperatureC");
        h.equal(comparison.canAverageAutomatically, false);
    });
    h.test("UI de comparación no crea porcentajes ni promedio", function () {
        h.equal(/comparab(?:le|ilidad)[^\n]{0,40}%|averageSweatRate|promedio personal/i.test(controller), false);
        h.ok(html.indexOf("sin puntuaciones ni promedios") >= 0);
    });
    h.test("resultado UI rechaza prescripción y suma EFSA con sudor", function () {
        h.ok(controller.indexOf("No indica cuánto debes beber por hora") >= 0);
        h.ok(controller.indexOf("no se suma a la referencia EFSA") >= 0);
        h.equal(/targetLiters|dailyNeedLiters|recommendedLiters/.test(controller), false);
    });
    h.test("señales educativas no crean diagnóstico por orina", function () {
        h.ok(html.indexOf("señal contextual imperfecta") >= 0);
        h.equal(/hydrationScore|estás deshidratado|semaforo|semáforo clínico/i.test(html + controller), false);
    });
    h.test("CSS evita overflow y adapta formularios a móvil", function () {
        h.ok(css.indexOf("overflow-x: hidden") >= 0);
        h.ok(css.indexOf("@media (max-width: 640px)") >= 0);
        h.ok(css.indexOf("@media (max-width: 360px)") >= 0);
        h.ok(css.indexOf("min-width: 0") >= 0);
    });
    h.test("CSS respeta reducción de movimiento", function () {
        h.ok(css.indexOf("prefers-reduced-motion: reduce") >= 0);
    });
    h.test("HTML carga persistencia después del núcleo y antes del controlador", function () {
        var safetyPosition = html.indexOf('src="js/safety-screening.js"');
        var storagePosition = html.indexOf('src="js/passport-storage.js"');
        var controllerPosition = html.indexOf('src="script.js"');
        h.ok(safetyPosition < storagePosition && storagePosition < controllerPosition);
    });
}(globalThis));
