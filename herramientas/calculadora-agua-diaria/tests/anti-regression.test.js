(function runWaterAntiRegressionTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var science = root.ImoancyWaterScience;
    var config = root.ImoancyWaterScienceConfig;
    var read = root.ImoancyWaterTestRead;
    var base = root.ImoancyWaterTestBase;
    var scienceConfigSource = read(base + "/js/science-config.js");
    var scienceEngineSource = read(base + "/js/science-engine.js");
    var safetySource = read(base + "/js/safety-screening.js");
    var controllerSource = read(base + "/script.js");
    var htmlSource = read(base + "/index.html");
    var urlConfigSource = read(base + "/js/config.js");
    var productionScienceSource = scienceConfigSource + "\n" + scienceEngineSource + "\n" + safetySource;

    function session(extra) {
        var input = {
            preWeightKg: 70,
            postWeightKg: 69.3,
            fluidIntakeLiters: 0.5,
            durationMinutes: 60,
            urineLiters: 0
        };
        Object.keys(extra || {}).forEach(function apply(key) { input[key] = extra[key]; });
        return input;
    }

    function allKeys(value, result) {
        var keys = result || [];
        if (!value || typeof value !== "object") return keys;
        Object.keys(value).forEach(function visit(key) {
            keys.push(key);
            allKeys(value[key], keys);
        });
        return keys;
    }

    function count(source, pattern) {
        var matches = source.match(pattern);
        return matches ? matches.length : 0;
    }

    h.test("configuración EFSA contiene exactamente cuatro grupos aprobados", function () {
        h.deepEqual(Object.keys(config.efsa.references).sort(), [
            "adult_female", "adult_male", "pregnancy", "lactation"
        ].sort());
    });
    h.test("referencia no cambia con argumentos de peso adicionales", function () {
        [40, 70, 160].forEach(function invariant(weight) {
            var result = science.getEfsaTotalWaterReference("adult_female", { weightKg: weight });
            h.equal(result.totalWaterLitersPerDay, 2.0);
        });
    });
    h.test("referencia no cambia con argumentos de actividad adicionales", function () {
        ["sedentary", "light", "moderate", "intense"].forEach(function invariant(activity) {
            var result = science.getEfsaTotalWaterReference("adult_male", { activity: activity });
            h.equal(result.totalWaterLitersPerDay, 2.5);
        });
    });
    h.test("aplicabilidad EFSA no crea ajustes matemáticos por calor o actividad", function () {
        var reference = science.getEfsaTotalWaterReference("adult_male", {
            temperatureC: 42,
            activity: "intense"
        });
        [
            "temperatureCorrectionLiters",
            "heatAdjustmentLiters",
            "activityCorrectionLiters",
            "activityAdjustmentLiters",
            "adjustedTotalWaterLiters"
        ].forEach(function absent(key) {
            h.equal(Object.prototype.hasOwnProperty.call(reference, key), false);
        });
        h.equal(reference.totalWaterLitersPerDay, 2.5);
    });
    h.test("API no exporta cálculo de necesidad diaria", function () {
        [
            "calculateDailyNeed", "calculateDailyWater", "combineEfsaAndSweat",
            "recommendFluidIntake", "prescribeElectrolytes"
        ].forEach(function absent(name) {
            h.equal(typeof science[name], "undefined");
        });
    });
    h.test("referencia y sesión son objetos conceptualmente separados", function () {
        var reference = science.getEfsaTotalWaterReference("adult_female");
        var observed = science.calculateObservedSweatSession(session());
        h.equal(Object.prototype.hasOwnProperty.call(reference, "computed"), false);
        h.equal(Object.prototype.hasOwnProperty.call(observed, "totalWaterLitersPerDay"), false);
        h.equal(reference.semantics.canBeAddedToObservedSweatAsDailyTarget, false);
        h.equal(observed.semantics.combinesWithEfsaReference, false);
    });
    h.test("EFSA mujer más sudor nunca aparece como objetivo 3,2", function () {
        var output = JSON.stringify({
            reference: science.getEfsaTotalWaterReference("adult_female"),
            observed: science.calculateObservedSweatSession(session())
        });
        h.equal(output.indexOf("targetLiters"), -1);
        h.equal(output.indexOf("dailyNeedLiters"), -1);
        h.equal(output.indexOf("3.2"), -1);
    });
    h.test("EFSA hombre más sudor nunca aparece como objetivo 3,7", function () {
        var output = JSON.stringify({
            reference: science.getEfsaTotalWaterReference("adult_male"),
            observed: science.calculateObservedSweatSession(session())
        });
        h.equal(output.indexOf("targetLiters"), -1);
        h.equal(output.indexOf("3.7"), -1);
    });
    h.test("metadatos de aplicabilidad no combinan EFSA con el pasaporte de sudor", function () {
        var reference = science.getEfsaTotalWaterReference("adult_female");
        var observed = science.calculateObservedSweatSession(session());
        h.equal(reference.totalWaterLitersPerDay, 2.0);
        h.close(observed.computed.sweatLossLiters, 1.2);
        h.equal(typeof reference.sweatLossLiters, "undefined");
        h.equal(typeof observed.totalWaterLitersPerDay, "undefined");
        h.equal(typeof science.combineEfsaAndSweat, "undefined");
    });
    h.test("código científico no contiene fórmula heredada por kilogramo", function () {
        h.equal(/35\s*(?:ml|mililitros?)\s*\/?\s*kg/i.test(productionScienceSource), false);
        h.equal(/weightKg\s*\*\s*35|peso\s*\*\s*35/i.test(productionScienceSource), false);
    });
    h.test("incremento fijo heredado por sexo no puede reactivarse", function () {
        h.equal(config.guardrails.applyFixedSexIncrement, false);
        h.equal(/\+=\s*0?\.3\b/.test(scienceEngineSource + "\n" + controllerSource), false);
    });
    h.test("incrementos fijos heredados por actividad no pueden reactivarse", function () {
        h.equal(config.guardrails.applyFixedActivityIncrement, false);
        h.equal(/\+=\s*(?:0?\.3|0?\.6|1(?:\.0)?)\b/.test(scienceEngineSource + "\n" + controllerSource), false);
        h.equal(/sedentario|ligero|moderado|intenso/i.test(scienceEngineSource + "\n" + controllerSource), false);
    });
    h.test("controlador no conserva peso ni niveles heredados", function () {
        h.equal(/\bpeso\b|sedentario|ligero|moderado|intenso/i.test(controllerSource), false);
    });
    h.test("controlador consume el motor sin duplicar cifras EFSA", function () {
        h.ok(controllerSource.indexOf("getEfsaTotalWaterReference") >= 0);
        h.equal(/\b2\.(?:0|3|5|7)\b/.test(controllerSource), false);
    });
    h.test("motor no redondea ni formatea resultados", function () {
        h.equal(/toFixed|toLocaleString|Math\.round/.test(scienceEngineSource), false);
    });
    h.test("núcleo no usa DOM", function () {
        h.equal(/\bdocument\b|\bwindow\b/.test(productionScienceSource), false);
    });
    h.test("núcleo no persiste datos", function () {
        h.equal(/localStorage|sessionStorage|indexedDB|document\.cookie/.test(productionScienceSource), false);
    });
    h.test("núcleo no contiene dosis automáticas de sodio", function () {
        h.equal(/sodiumMg|sodiumGrams|sodiumPerHour|electrolyteDose|drinkConcentration/.test(productionScienceSource), false);
    });
    h.test("color de orina no genera score ni diagnóstico", function () {
        var baseline = science.calculateObservedSweatSession(session());
        var withColor = science.calculateObservedSweatSession(session({ urineColor: "dark" }));
        h.deepEqual(withColor, baseline);
        h.equal(/hydrationScore|dehydrated\s*=|urineColor/.test(productionScienceSource), false);
    });
    h.test("cambio de masa no genera diagnóstico", function () {
        var keys = allKeys(science.calculateObservedSweatSession(session()));
        ["dehydrated", "hyponatremia", "disease", "diagnosis"].forEach(function absent(key) {
            h.equal(keys.indexOf(key), -1);
        });
    });
    h.test("contexto ambiental nunca cambia ecuaciones", function () {
        var hot = science.calculateObservedSweatSession(session({
            temperatureC: 40, humidityPercent: 95, activity: "carrera", perceivedIntensity: "hard"
        }));
        var cold = science.calculateObservedSweatSession(session({
            temperatureC: -5, humidityPercent: 10, activity: "esquí", perceivedIntensity: "easy"
        }));
        h.deepEqual(hot.computed, cold.computed);
    });
    h.test("comparabilidad impide promedio automático heterogéneo", function () {
        var comparison = science.compareSessionContexts(
            { activity: "carrera", durationMinutes: 60 },
            { activity: "ciclismo", durationMinutes: 90 }
        );
        h.equal(comparison.status, "differences_observed");
        h.equal(comparison.comparable, null);
        h.equal(comparison.canAverageAutomatically, false);
        h.equal(typeof comparison.averageSweatRate, "undefined");
    });
    h.test("harness numérico rechaza NaN", function () {
        try {
            h.close(NaN, 1);
        } catch (error) {
            return;
        }
        throw new Error("close accepted NaN");
    });
    h.test("HTML carga ciencia, seguridad y controlador en orden", function () {
        var configPosition = htmlSource.indexOf('src="js/science-config.js"');
        var enginePosition = htmlSource.indexOf('src="js/science-engine.js"');
        var safetyPosition = htmlSource.indexOf('src="js/safety-screening.js"');
        var controllerPosition = htmlSource.indexOf('src="script.js"');
        h.ok(configPosition >= 0);
        h.ok(configPosition < enginePosition && enginePosition < safetyPosition && safetyPosition < controllerPosition);
        h.equal(count(htmlSource, /src="js\/science-config\.js"/g), 1);
        h.equal(count(htmlSource, /src="js\/science-engine\.js"/g), 1);
        h.equal(count(htmlSource, /src="js\/safety-screening\.js"/g), 1);
    });
    h.test("CONFIG se declara una sola vez", function () {
        h.equal(count(htmlSource + "\n" + urlConfigSource, /\bconst\s+CONFIG\b/g), 1);
    });
    h.test("formulario mínimo ya no solicita peso ni actividad", function () {
        h.equal(htmlSource.indexOf('id="peso"'), -1);
        h.equal(htmlSource.indexOf('id="actividad"'), -1);
        h.ok(htmlSource.indexOf('id="grupo-referencia"') >= 0);
    });
    h.test("cuerpo visible no recomienda regla 30–35 ml/kg", function () {
        var body = htmlSource.slice(htmlSource.indexOf("<body"));
        h.equal(/(?:recomienda|debes|multiplica)[^<]{0,80}(?:30\s*(?:a|–|-)\s*35|35)\s*ml/i.test(body), false);
        h.ok(body.indexOf("¿Es correcto calcular el agua como 35 ml por kilo?") >= 0);
        h.ok(body.indexOf("no la usa para afirmar una necesidad individual exacta") >= 0);
    });
    h.test("metadatos no prometen cálculo individual por peso o actividad", function () {
        var head = htmlSource.slice(0, htmlSource.indexOf("</head>"));
        h.equal(/según tu peso|agua por peso|cuánta agua debes beber|necesitas beber/i.test(head), false);
        h.ok(head.indexOf("sin prometer una necesidad exacta") >= 0);
    });
    h.test("resultado UI comunica agua total y no vasos", function () {
        var elements = {
            "grupo-referencia": { value: "adult_female", focus: function () {} },
            resultado: { innerHTML: "", style: { display: "none" }, focus: function () {} }
        };
        root.document = { getElementById: function (id) { return elements[id]; } };
        eval(controllerSource);
        root.mostrarReferenciaAguaTotal();
        h.ok(elements.resultado.innerHTML.indexOf("agua total") >= 0);
        h.ok(elements.resultado.innerHTML.indexOf("bebidas") >= 0);
        h.ok(elements.resultado.innerHTML.indexOf("alimentos") >= 0);
        h.equal(/vasos?/i.test(elements.resultado.innerHTML), false);
    });
    h.test("reinicio UI no produce ReferenceError", function () {
        var elements = {
            "grupo-referencia": { value: "adult_male", focus: function () {} },
            resultado: { innerHTML: "contenido", style: { display: "block" }, focus: function () {} }
        };
        root.document = { getElementById: function (id) { return elements[id]; } };
        root.reiniciarFormulario();
        h.equal(elements["grupo-referencia"].value, "");
        h.equal(elements.resultado.innerHTML, "");
        h.equal(elements.resultado.style.display, "none");
    });
    h.test("UI sin grupo falla de forma accesible dentro del resultado", function () {
        var elements = {
            "grupo-referencia": { value: "", focus: function () {} },
            resultado: { innerHTML: "", style: { display: "none" }, focus: function () {} }
        };
        root.document = { getElementById: function (id) { return elements[id]; } };
        root.mostrarReferenciaAguaTotal();
        h.ok(elements.resultado.innerHTML.indexOf("Selecciona") >= 0);
        h.equal(elements.resultado.style.display, "block");
    });
}(globalThis));
