(function runWaterScienceTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var config = root.ImoancyWaterScienceConfig;
    var science = root.ImoancyWaterScience;

    function own(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function session(changes) {
        var value = {
            preWeightKg: 70,
            postWeightKg: 69.3,
            fluidIntakeLiters: 0.5,
            durationMinutes: 60,
            urineLiters: 0
        };

        Object.keys(changes || {}).forEach(function applyChange(key) {
            value[key] = changes[key];
        });

        return value;
    }

    function issueCodes(result) {
        return result.errors.concat(result.warnings).map(function getCode(issue) {
            return issue.code;
        });
    }

    function allKeys(value, result) {
        var keys = result || [];

        if (!value || typeof value !== "object") {
            return keys;
        }

        Object.keys(value).forEach(function visit(key) {
            keys.push(key);
            allKeys(value[key], keys);
        });

        return keys;
    }

    function isDeepFrozen(value) {
        if (!value || typeof value !== "object" || !Object.isFrozen(value)) {
            return false;
        }

        return Object.keys(value).every(function childIsFrozen(key) {
            return !value[key] || typeof value[key] !== "object" || isDeepFrozen(value[key]);
        });
    }

    h.test("configuración científica global disponible", function () {
        h.ok(config && typeof config === "object");
    });
    h.test("API científica global disponible", function () {
        h.ok(science && typeof science.calculateObservedSweatSession === "function");
    });
    h.test("configuración profundamente congelada", function () {
        h.ok(isDeepFrozen(config));
    });
    h.test("API científica congelada", function () {
        h.ok(Object.isFrozen(science));
    });
    h.test("versión científica consistente", function () {
        h.equal(config.scienceVersion, "1.0.0");
        h.equal(science.scienceVersion, config.scienceVersion);
    });
    h.test("esquema de pasaporte versionado", function () {
        h.equal(config.schemaVersions.sweatPassportEntry, "1.0.0");
    });
    h.test("fuente EFSA trazable por DOI", function () {
        h.equal(config.sources.efsa_water_drv_2010.doi, "10.2903/j.efsa.2010.1459");
    });
    h.test("fuente NATA trazable por DOI", function () {
        h.equal(config.sources.nata_fluid_replacement_2017.doi, "10.4085/1062-6050-52.9.02");
    });
    h.test("guardrails científicos críticos desactivan prescripción", function () {
        Object.keys(config.guardrails).forEach(function guardrailIsFalse(key) {
            h.equal(config.guardrails[key], false);
        });
    });
    h.test("política documenta ausencia de umbrales fisiológicos aprobados", function () {
        var policy = config.observedSweatSession.qualityPolicy;
        h.equal(policy.physiologicalPlausibilityThresholdsApplied, false);
        h.ok(policy.reason.indexOf("No evidence-backed") >= 0);
        h.includes(policy.implementedChecks, "finite_values");
    });
    h.test("superficie pública no exporta combinador ni necesidad diaria", function () {
        h.deepEqual(Object.keys(science).sort(), [
            "buildSweatPassportEntry",
            "calculateObservedSweatSession",
            "compareSessionContexts",
            "getEfsaTotalWaterReference",
            "normalizeSessionContext",
            "scienceVersion"
        ].sort());
    });

    [
        ["adult_female", 2.0],
        ["adult_male", 2.5],
        ["pregnancy", 2.3],
        ["lactation", 2.7]
    ].forEach(function testEfsaReference(row) {
        h.test("EFSA " + row[0] + " conserva valor exacto", function () {
            var reference = science.getEfsaTotalWaterReference(row[0]);
            h.equal(reference.totalWaterLitersPerDay, row[1]);
            h.equal(reference.group, row[0]);
        });
    });

    h.test("EFSA declara litros por día y referencia poblacional", function () {
        var reference = science.getEfsaTotalWaterReference("adult_female");
        h.equal(reference.unit, "L/day");
        h.equal(reference.referenceType, "population_adequate_intake");
        h.equal(reference.quantity, "total_water");
    });
    h.test("EFSA incluye bebidas y humedad de alimentos", function () {
        var includes = science.getEfsaTotalWaterReference("adult_male").includes;
        h.includes(includes, "drinking_water");
        h.includes(includes, "other_beverages");
        h.includes(includes, "food_moisture");
    });
    h.test("configuración EFSA conserva aplicabilidad ambiental moderada", function () {
        h.equal(config.efsa.applicability.ambientTemperature, "moderate");
        h.ok(Object.isFrozen(config.efsa.applicability));
    });
    h.test("salida EFSA identifica temperatura ambiental moderada", function () {
        var applicability = science.getEfsaTotalWaterReference("adult_female").applicability;
        h.equal(applicability.ambientTemperature, "moderate");
    });
    h.test("salida EFSA identifica actividad moderada y PAL 1,6", function () {
        var applicability = science.getEfsaTotalWaterReference("adult_male").applicability;
        h.equal(applicability.physicalActivity, "moderate");
        h.equal(applicability.physicalActivityLevelPal, 1.6);
    });
    h.test("salida EFSA no incorpora automáticamente pérdidas adicionales", function () {
        var losses = science.getEfsaTotalWaterReference("pregnancy")
            .applicability.automaticallyIncludesAdditionalLosses;
        h.equal(losses.intenseExercise, false);
        h.equal(losses.highSweat, false);
        h.equal(losses.demandingEnvironmentalConditions, false);
    });
    h.test("salida EFSA declara ausencia de correcciones por temperatura y actividad", function () {
        var applicability = science.getEfsaTotalWaterReference("lactation").applicability;
        h.equal(applicability.usesTemperatureCorrection, false);
        h.equal(applicability.usesActivityCorrection, false);
    });
    h.test("EFSA distingue agua total de agua pura", function () {
        var semantics = science.getEfsaTotalWaterReference("pregnancy").semantics;
        h.equal(semantics.waterScope, "total_water_from_beverages_and_foods");
        h.equal(semantics.isPureWaterTarget, false);
    });
    h.test("EFSA no representa necesidad ni recomendación individual", function () {
        var semantics = science.getEfsaTotalWaterReference("lactation").semantics;
        h.equal(semantics.isExactIndividualNeed, false);
        h.equal(semantics.isPersonalizedRecommendation, false);
    });
    h.test("EFSA no convierte a vasos ni estima porcentaje alimentario", function () {
        var semantics = science.getEfsaTotalWaterReference("adult_female").semantics;
        h.equal(semantics.isAutomaticallyConvertedToGlasses, false);
        h.equal(semantics.usesFixedFoodWaterPercentage, false);
    });
    h.test("EFSA prohíbe suma con sudor como objetivo diario", function () {
        h.equal(
            science.getEfsaTotalWaterReference("adult_male").semantics.canBeAddedToObservedSweatAsDailyTarget,
            false
        );
    });
    h.test("referencia EFSA incluye versión y fuente", function () {
        var reference = science.getEfsaTotalWaterReference("adult_female");
        h.equal(reference.scienceVersion, "1.0.0");
        h.equal(reference.source.id, "efsa_water_drv_2010");
    });
    h.test("fuente EFSA hace trazable la condición PAL 1,6", function () {
        h.includes(
            config.sources.efsa_water_drv_2010.supports,
            "reference_applicability_at_moderate_ambient_temperature_and_pal_1_6"
        );
    });
    [undefined, null, "", "unknown", 2, {}, "toString", "__proto__"].forEach(function invalidGroup(value, index) {
        h.test("EFSA rechaza grupo desconocido " + index, function () {
            h.equal(science.getEfsaTotalWaterReference(value), null);
        });
    });
    h.test("resultado EFSA está profundamente congelado", function () {
        h.ok(isDeepFrozen(science.getEfsaTotalWaterReference("adult_male")));
    });
    h.test("resultado EFSA no expone objetivo, vasos ni sudor", function () {
        var keys = allKeys(science.getEfsaTotalWaterReference("adult_female"));
        ["glasses", "foodPercentage", "sweatLossLiters", "dailyNeedLiters", "targetLiters", "recommendedLiters"].forEach(function absent(key) {
            h.equal(keys.indexOf(key), -1);
        });
    });

    h.test("sudor caso manual NATA", function () {
        var result = science.calculateObservedSweatSession(session());
        h.equal(result.status, "valid");
        h.close(result.computed.sweatLossLiters, 1.2);
        h.close(result.computed.sweatRateLitersPerHour, 1.2);
        h.close(result.computed.bodyMassChangePercent, -1);
    });
    h.test("sudor divide por media hora", function () {
        var result = science.calculateObservedSweatSession(session({ durationMinutes: 30 }));
        h.close(result.computed.sweatLossLiters, 1.2);
        h.close(result.computed.sweatRateLitersPerHour, 2.4);
    });
    h.test("sudor resta orina", function () {
        var result = science.calculateObservedSweatSession(session({ urineLiters: 0.2 }));
        h.close(result.computed.sweatLossLiters, 1.0);
        h.close(result.computed.sweatRateLitersPerHour, 1.0);
    });
    h.test("sudor admite sesión sin ingesta", function () {
        var result = science.calculateObservedSweatSession(session({ fluidIntakeLiters: 0 }));
        h.close(result.computed.sweatLossLiters, 0.7);
    });
    h.test("orina omitida usa cero", function () {
        var input = session();
        delete input.urineLiters;
        var result = science.calculateObservedSweatSession(input);
        h.equal(result.inputs.urineLiters, 0);
        h.close(result.computed.sweatLossLiters, 1.2);
    });
    h.test("decimales conservan precisión interna", function () {
        var result = science.calculateObservedSweatSession({
            preWeightKg: 72.4,
            postWeightKg: 71.85,
            fluidIntakeLiters: 0.625,
            urineLiters: 0.075,
            durationMinutes: 75
        });
        h.close(result.computed.sweatLossLiters, 1.1);
        h.close(result.computed.sweatRateLitersPerHour, 0.88);
        h.close(result.computed.bodyMassChangePercent, ((71.85 - 72.4) / 72.4) * 100);
    });
    h.test("misma masa con ingesta conserva balance observado", function () {
        var result = science.calculateObservedSweatSession(session({ postWeightKg: 70 }));
        h.close(result.computed.sweatLossLiters, 0.5);
        h.close(result.computed.bodyMassChangePercent, 0);
    });
    h.test("peso final mayor avisa si el balance sigue calculable", function () {
        var result = science.calculateObservedSweatSession(session({ postWeightKg: 70.2 }));
        h.equal(result.status, "warning");
        h.close(result.computed.sweatLossLiters, 0.3);
        h.includes(issueCodes(result), "post_weight_above_pre_weight");
    });
    h.test("pérdida calculada negativa bloquea sin truncar a cero", function () {
        var result = science.calculateObservedSweatSession(session({ postWeightKg: 70.2, fluidIntakeLiters: 0 }));
        h.equal(result.status, "error");
        h.equal(result.computed.sweatLossLiters, null);
        h.includes(issueCodes(result), "negative_observed_sweat_loss");
    });
    h.test("orina superior al balance produce error", function () {
        var result = science.calculateObservedSweatSession(session({ urineLiters: 2 }));
        h.equal(result.status, "error");
        h.includes(issueCodes(result), "negative_observed_sweat_loss");
    });
    h.test("pérdida exactamente cero es observación válida sin diagnóstico", function () {
        var result = science.calculateObservedSweatSession(session({ postWeightKg: 70, fluidIntakeLiters: 0 }));
        h.equal(result.status, "valid");
        h.equal(result.computed.sweatLossLiters, 0);
        h.equal(result.computed.sweatRateLitersPerHour, 0);
        h.equal(allKeys(result).indexOf("dehydrated"), -1);
    });

    ["preWeightKg", "postWeightKg", "fluidIntakeLiters", "durationMinutes"].forEach(function missingField(field) {
        h.test("sudor rechaza campo requerido ausente " + field, function () {
            var input = session();
            delete input[field];
            var result = science.calculateObservedSweatSession(input);
            h.equal(result.status, "error");
            h.includes(issueCodes(result), "missing_" + field);
        });
    });
    h.test("sudor rechaza entrada ausente", function () {
        var result = science.calculateObservedSweatSession();
        h.equal(result.status, "error");
        h.ok(result.errors.length >= 4);
    });
    [
        ["preWeightKg", 0, "non_positive_preWeightKg"],
        ["preWeightKg", -1, "non_positive_preWeightKg"],
        ["postWeightKg", 0, "non_positive_postWeightKg"],
        ["postWeightKg", -1, "non_positive_postWeightKg"],
        ["durationMinutes", 0, "non_positive_durationMinutes"],
        ["durationMinutes", -1, "non_positive_durationMinutes"],
        ["fluidIntakeLiters", -0.1, "negative_fluidIntakeLiters"],
        ["urineLiters", -0.1, "negative_urineLiters"]
    ].forEach(function rangeCase(row) {
        h.test("sudor valida signo " + row[0] + " " + row[1], function () {
            var changes = {};
            changes[row[0]] = row[1];
            var result = science.calculateObservedSweatSession(session(changes));
            h.equal(result.status, "error");
            h.includes(issueCodes(result), row[2]);
        });
    });
    ["preWeightKg", "postWeightKg", "fluidIntakeLiters", "durationMinutes", "urineLiters"].forEach(function strictNumber(field) {
        h.test("sudor no coacciona string en " + field, function () {
            var changes = {};
            changes[field] = "1";
            var result = science.calculateObservedSweatSession(session(changes));
            h.equal(result.status, "error");
            h.includes(issueCodes(result), "invalid_" + field);
        });
    });
    [NaN, Infinity, -Infinity, null, true, {}].forEach(function hostileNumber(value, index) {
        h.test("sudor rechaza número hostil " + index, function () {
            var result = science.calculateObservedSweatSession(session({ preWeightKg: value }));
            h.equal(result.status, "error");
            h.includes(issueCodes(result), "invalid_preWeightKg");
        });
    });
    h.test("sudor bloquea overflow derivado", function () {
        var result = science.calculateObservedSweatSession(session({
            preWeightKg: Number.MAX_VALUE,
            postWeightKg: 1,
            fluidIntakeLiters: Number.MAX_VALUE
        }));
        h.equal(result.status, "error");
        h.includes(issueCodes(result), "non_finite_calculation");
    });
    h.test("sudor bloquea tasa no finita por duración subnormal", function () {
        var result = science.calculateObservedSweatSession(session({ durationMinutes: Number.MIN_VALUE }));
        h.equal(result.status, "error");
        h.includes(issueCodes(result), "non_finite_calculation");
    });
    h.test("sudor rechaza propiedades numéricas heredadas", function () {
        var input = Object.create(session());
        var result = science.calculateObservedSweatSession(input);
        h.equal(result.status, "error");
        h.includes(issueCodes(result), "missing_preWeightKg");
    });
    h.test("sudor no ejecuta valueOf hostil", function () {
        var value = { valueOf: function () { throw new Error("coercion"); } };
        var result = science.calculateObservedSweatSession(session({ preWeightKg: value }));
        h.equal(result.status, "error");
    });
    h.test("sudor acepta entrada congelada y no la muta", function () {
        var input = Object.freeze(session());
        var before = JSON.stringify(input);
        science.calculateObservedSweatSession(input);
        h.equal(JSON.stringify(input), before);
    });
    h.test("sudor es determinista", function () {
        var input = session({ durationMinutes: 47.5 });
        h.deepEqual(
            science.calculateObservedSweatSession(input),
            science.calculateObservedSweatSession(input)
        );
    });
    h.test("resultado de sudor está profundamente congelado", function () {
        h.ok(isDeepFrozen(science.calculateObservedSweatSession(session())));
    });
    h.test("sudor conserva semántica observada no prescriptiva", function () {
        var semantics = science.calculateObservedSweatSession(session()).semantics;
        h.equal(semantics.isSessionSpecificObservation, true);
        h.equal(semantics.isDailyWaterNeed, false);
        h.equal(semantics.isFluidIntakePrescription, false);
        h.equal(semantics.isSodiumOrElectrolytePrescription, false);
        h.equal(semantics.combinesWithEfsaReference, false);
    });
    h.test("sudor no devuelve dosis, objetivo ni diagnóstico", function () {
        var keys = allKeys(science.calculateObservedSweatSession(session()));
        [
            "dailyNeedLiters", "targetLiters", "recommendedLiters", "glasses",
            "sodiumMg", "sodiumGrams", "sodiumPerHour", "electrolyteDose",
            "hydrationScore", "dehydrated", "hyponatremia", "diagnosis"
        ].forEach(function forbidden(key) {
            h.equal(keys.indexOf(key), -1);
        });
    });

    h.test("contexto conserva todos los campos canónicos", function () {
        var context = science.normalizeSessionContext({
            activity: "Carrera",
            durationMinutes: 60,
            temperatureC: 24.5,
            humidityPercent: 55,
            indoorOutdoor: "outdoor",
            perceivedIntensity: "moderate",
            equipmentOrClothing: "camiseta ligera",
            notes: "viento",
            sessionDate: "2026-08-20"
        });
        h.deepEqual(Object.keys(context), config.sessionContextFields);
        h.equal(context.temperatureC, 24.5);
        h.equal(context.notes, "viento");
    });
    h.test("contexto normaliza textos vacíos como desconocidos", function () {
        var context = science.normalizeSessionContext({ activity: "  ", notes: "" });
        h.equal(context.activity, null);
        h.equal(context.notes, null);
    });
    h.test("contexto no coacciona números", function () {
        var context = science.normalizeSessionContext({ temperatureC: "20", humidityPercent: NaN });
        h.equal(context.temperatureC, null);
        h.equal(context.humidityPercent, null);
    });
    h.test("contexto ignora propiedades heredadas", function () {
        var context = science.normalizeSessionContext(Object.create({ activity: "heredada" }));
        h.equal(context.activity, null);
    });
    h.test("contexto normalizado está congelado", function () {
        h.ok(isDeepFrozen(science.normalizeSessionContext({ activity: "ciclismo" })));
    });
    h.test("contextos completos idénticos son comparables", function () {
        var context = {
            activity: "carrera", durationMinutes: 60, temperatureC: 20,
            humidityPercent: 40, indoorOutdoor: "outdoor",
            perceivedIntensity: "moderate", equipmentOrClothing: "ligero"
        };
        var comparison = science.compareSessionContexts(context, context);
        h.equal(comparison.status, "comparable");
        h.equal(comparison.comparable, true);
        h.equal(comparison.matches.length, 7);
    });
    h.test("contextos incompletos expresan incertidumbre", function () {
        var comparison = science.compareSessionContexts({ activity: "carrera" }, { activity: "carrera" });
        h.equal(comparison.status, "uncertain");
        h.equal(comparison.comparable, null);
        h.ok(comparison.unknown.length > 0);
    });
    [
        ["activity", "carrera", "ciclismo"],
        ["durationMinutes", 60, 61],
        ["temperatureC", 20, 21],
        ["humidityPercent", 40, 41],
        ["indoorOutdoor", "indoor", "outdoor"],
        ["perceivedIntensity", "moderate", "hard"],
        ["equipmentOrClothing", "ligero", "pesado"]
    ].forEach(function comparisonDifference(row) {
        h.test("comparabilidad detecta diferencia en " + row[0], function () {
            var base = {
                activity: "carrera", durationMinutes: 60, temperatureC: 20,
                humidityPercent: 40, indoorOutdoor: "outdoor",
                perceivedIntensity: "moderate", equipmentOrClothing: "ligero"
            };
            var changed = JSON.parse(JSON.stringify(base));
            base[row[0]] = row[1];
            changed[row[0]] = row[2];
            var comparison = science.compareSessionContexts(base, changed);
            h.equal(comparison.status, "differences_observed");
            h.equal(comparison.comparable, null);
            h.includes(comparison.differences, row[0]);
        });
    });
    h.test("comparabilidad devuelve deltas numéricos crudos", function () {
        var comparison = science.compareSessionContexts(
            { durationMinutes: 60, temperatureC: 20 },
            { durationMinutes: 75, temperatureC: 23 }
        );
        h.equal(comparison.dimensions.durationMinutes.delta, 15);
        h.equal(comparison.dimensions.temperatureC.delta, 3);
    });
    h.test("comparabilidad textual ignora espacios externos y mayúsculas", function () {
        var comparison = science.compareSessionContexts(
            { activity: " Carrera " },
            { activity: "carrera" }
        );
        h.equal(comparison.dimensions.activity.status, "match");
    });
    h.test("notas y fecha no inventan equivalencia fisiológica", function () {
        var left = { activity: "carrera", notes: "a", sessionDate: "2026-01-01" };
        var right = { activity: "carrera", notes: "b", sessionDate: "2026-02-01" };
        var comparison = science.compareSessionContexts(left, right);
        h.equal(own(comparison.dimensions, "notes"), false);
        h.equal(own(comparison.dimensions, "sessionDate"), false);
    });
    h.test("comparación es simétrica en estados observables", function () {
        var left = { activity: "a", durationMinutes: 30 };
        var right = { activity: "b", durationMinutes: 60 };
        var forward = science.compareSessionContexts(left, right);
        var reverse = science.compareSessionContexts(right, left);
        h.equal(forward.status, reverse.status);
        h.deepEqual(forward.differences, reverse.differences);
        h.equal(forward.dimensions.durationMinutes.delta, -reverse.dimensions.durationMinutes.delta);
    });
    h.test("comparación no usa tolerancias ni permite promedios automáticos", function () {
        var comparison = science.compareSessionContexts({}, {});
        h.equal(comparison.usesNumericTolerance, false);
        h.equal(comparison.canAverageAutomatically, false);
        h.equal(comparison.transferability, "uncertain");
    });
    h.test("contexto con duración o humedad fuera de su dominio queda desconocido", function () {
        var context = science.normalizeSessionContext({ durationMinutes: -1, humidityPercent: 101 });
        h.equal(context.durationMinutes, null);
        h.equal(context.humidityPercent, null);
        h.equal(science.compareSessionContexts(
            { durationMinutes: -1, humidityPercent: -1 },
            { durationMinutes: -1, humidityPercent: -1 }
        ).status, "uncertain");
    });
    h.test("comparación está profundamente congelada", function () {
        h.ok(isDeepFrozen(science.compareSessionContexts({}, {})));
    });

    h.test("pasaporte conserva contrato y versiones", function () {
        var entry = science.buildSweatPassportEntry({
            id: "sweat_001",
            createdAt: "2026-08-20T10:00:00Z",
            sessionDate: "2026-08-19",
            inputs: session(),
            context: { activity: "carrera" }
        });
        h.equal(entry.schemaVersion, "1.0.0");
        h.equal(entry.scienceVersion, "1.0.0");
        h.equal(entry.id, "sweat_001");
        h.equal(entry.sessionDate, "2026-08-19");
        ["inputs", "context", "computed", "qualityFlags"].forEach(function present(key) {
            h.ok(own(entry, key));
        });
    });
    h.test("pasaporte conserva cálculo observado", function () {
        var entry = science.buildSweatPassportEntry({ inputs: session() });
        h.close(entry.computed.sweatLossLiters, 1.2);
        h.close(entry.computed.sweatRateLitersPerHour, 1.2);
        h.equal(entry.quality.status, "valid");
    });
    h.test("pasaporte usa duración matemática como única duración", function () {
        var entry = science.buildSweatPassportEntry({
            inputs: session({ durationMinutes: 60 }),
            context: { durationMinutes: 90 }
        });
        h.equal(entry.inputs.durationMinutes, 60);
        h.equal(entry.context.durationMinutes, 60);
        h.equal(entry.computed.durationHours, 1);
        h.equal(entry.quality.status, "warning");
        h.includes(entry.qualityFlags, "context_duration_mismatch");
    });
    h.test("pasaporte detecta fechas de sesión contradictorias", function () {
        var entry = science.buildSweatPassportEntry({
            sessionDate: "2026-08-20",
            inputs: session(),
            context: { sessionDate: "2026-08-19" }
        });
        h.equal(entry.sessionDate, "2026-08-20");
        h.equal(entry.context.sessionDate, "2026-08-20");
        h.equal(entry.quality.status, "warning");
        h.includes(entry.qualityFlags, "session_date_mismatch");
    });
    h.test("pasaporte marca fecha superior inválida y conserva fecha contextual", function () {
        var entry = science.buildSweatPassportEntry({
            sessionDate: 20260820,
            inputs: session(),
            context: { sessionDate: "2026-08-19" }
        });
        h.equal(entry.sessionDate, "2026-08-19");
        h.includes(entry.qualityFlags, "invalid_session_date");
    });
    h.test("pasaporte conserva contexto sin coeficientes", function () {
        var entry = science.buildSweatPassportEntry({
            inputs: session(),
            context: {
                activity: "carrera", temperatureC: 34, humidityPercent: 80,
                indoorOutdoor: "outdoor", perceivedIntensity: "hard",
                equipmentOrClothing: "pesado", notes: "sol"
            }
        });
        h.equal(entry.context.activity, "carrera");
        h.close(entry.computed.sweatLossLiters, 1.2);
    });
    h.test("pasaporte no genera id ni fechas implícitas", function () {
        var entry = science.buildSweatPassportEntry({ inputs: session() });
        h.equal(entry.id, null);
        h.equal(entry.createdAt, null);
        h.equal(entry.sessionDate, null);
    });
    h.test("pasaporte inválido no presenta cálculo válido", function () {
        var entry = science.buildSweatPassportEntry({ inputs: session({ durationMinutes: 0 }) });
        h.equal(entry.quality.status, "error");
        h.equal(entry.computed.sweatLossLiters, null);
        h.ok(entry.qualityFlags.length > 0);
    });
    h.test("pasaporte toma snapshot independiente", function () {
        var inputs = session();
        var context = { activity: "carrera" };
        var entry = science.buildSweatPassportEntry({ inputs: inputs, context: context });
        inputs.preWeightKg = 90;
        context.activity = "ciclismo";
        h.equal(entry.inputs.preWeightKg, 70);
        h.equal(entry.context.activity, "carrera");
    });
    h.test("pasaporte es determinista con metadatos aportados", function () {
        var options = {
            id: "sweat_002", createdAt: "2026-08-20T10:00:00Z",
            sessionDate: "2026-08-19", inputs: session(), context: { activity: "remo" }
        };
        h.deepEqual(science.buildSweatPassportEntry(options), science.buildSweatPassportEntry(options));
    });
    h.test("pasaporte está profundamente congelado", function () {
        h.ok(isDeepFrozen(science.buildSweatPassportEntry({ inputs: session() })));
    });
    h.test("pasaporte no convierte observación en prescripción", function () {
        var entry = science.buildSweatPassportEntry({ inputs: session() });
        var keys = allKeys(entry);
        h.equal(entry.semantics.isFluidIntakePrescription, false);
        ["recommendedLiters", "targetLiters", "sodiumMg", "electrolyteDose"].forEach(function absent(key) {
            h.equal(keys.indexOf(key), -1);
        });
    });
}(globalThis));
