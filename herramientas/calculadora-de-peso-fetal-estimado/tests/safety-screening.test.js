(function runFetalWeightSafetyTests(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var config = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var safety = root.ImoancyFetalWeightSafety;

    function positionReportedEfw(gestationalAge, efwGrams) {
        return science.positionEfwInReference({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: gestationalAge,
            efwObservation: {
                efwGrams: efwGrams,
                source: "report_entered",
                method: "unknown"
            }
        });
    }

    function engineIssueCodes(result) {
        return (result.errors || []).map(function readCode(item) {
            return item.code;
        });
    }

    function biometricContext(changes) {
        var value = {
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "biometrics",
            gestationalAge: { weeks: 30, days: 0 },
            seeksDiagnosis: false,
            seeksClinicalInterpretation: false,
            biometrics: { hcCm: 30, acCm: 28, flCm: 5.5 }
        };

        Object.keys(changes || {}).forEach(function apply(key) {
            value[key] = changes[key];
        });
        return value;
    }

    function reportContext(changes) {
        var value = {
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "report_entered",
            gestationalAge: { weeks: 30, days: 0 },
            seeksDiagnosis: false,
            seeksClinicalInterpretation: false,
            efwGrams: 1500
        };

        Object.keys(changes || {}).forEach(function apply(key) {
            value[key] = changes[key];
        });
        return value;
    }

    h.test("API safety fetal disponible y congelada", function () {
        h.ok(safety && typeof safety.screenFetalWeightContext === "function");
        h.ok(typeof science.hasEfwReferenceMathematicalSupport === "function");
        h.ok(Object.isFrozen(safety));
        h.equal(safety.scienceVersion, config.scienceVersion);
    });
    h.test("superficie pública safety es mínima", function () {
        h.keys(safety, ["scienceVersion", "screenFetalWeightContext"]);
    });
    h.test("decisión safety expone contrato estable", function () {
        var decision = safety.screenFetalWeightContext(reportContext());
        h.keys(decision, [
            "scienceVersion",
            "status",
            "scope",
            "inputMode",
            "pregnancyPopulation",
            "canCalculateEfw",
            "canPositionInReference",
            "requiresProfessionalInterpretation",
            "reasonCodes",
            "missingFields",
            "invalidFields"
        ]);
        h.ok(h.isDeepFrozen(decision));
    });
    h.test("singleton biométrico válido permite cálculo y referencia", function () {
        var decision = safety.screenFetalWeightContext(biometricContext());
        h.equal(decision.status, "allowed");
        h.equal(decision.scope, "educational_efw_observation_and_reference_position");
        h.equal(decision.canCalculateEfw, true);
        h.equal(decision.canPositionInReference, true);
        h.equal(decision.requiresProfessionalInterpretation, false);
        h.deepEqual(decision.reasonCodes, []);
    });
    h.test("informe sin método conocido permite solo observación y posición educativa", function () {
        var decision = safety.screenFetalWeightContext(reportContext());
        h.equal(decision.status, "allowed");
        h.equal(decision.canCalculateEfw, false);
        h.equal(decision.canPositionInReference, true);
    });
    h.test("informe Hadlock declarado permite posición de referencia", function () {
        var decision = safety.screenFetalWeightContext(reportContext({
            reportedMethod: "  hadlock_hc_ac_fl  "
        }));
        h.equal(decision.status, "allowed");
        h.equal(decision.canPositionInReference, true);
    });
    h.test("EFW de 1 g no promete posición que el motor no puede calcular", function () {
        var context = reportContext({ efwGrams: 1 });
        var decision = safety.screenFetalWeightContext(context);
        var positioned = positionReportedEfw(context.gestationalAge, context.efwGrams);
        h.equal(decision.status, "invalid");
        h.equal(decision.canPositionInReference, false);
        h.includes(decision.reasonCodes, "efw_outside_reference_mathematical_support");
        h.equal(positioned.status, "invalid");
        h.includes(engineIssueCodes(positioned), "efw_outside_reference_mathematical_support");
    });
    h.test("valor inmediatamente inferior al límite matemático queda fuera del soporte", function () {
        // La separación binaria64 inmediatamente por debajo de 1 es 2^-53.
        var efwGrams = 1 - (Number.EPSILON / 2);
        var decision = safety.screenFetalWeightContext(reportContext({ efwGrams: efwGrams }));
        h.equal(science.hasEfwReferenceMathematicalSupport({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: efwGrams
        }), false);
        h.equal(decision.status, "invalid");
        h.equal(decision.canPositionInReference, false);
        h.includes(decision.reasonCodes, "efw_outside_reference_mathematical_support");
    });
    h.test("siguiente IEEE-754 sobre 1 g pertenece al soporte matemático", function () {
        var efwGrams = 1 + Number.EPSILON;
        var context = reportContext({ efwGrams: efwGrams });
        var decision = safety.screenFetalWeightContext(context);
        var positioned = positionReportedEfw(context.gestationalAge, context.efwGrams);
        h.equal(science.hasEfwReferenceMathematicalSupport({
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: context.gestationalAge,
            efwGrams: efwGrams
        }), true);
        h.equal(decision.status, "allowed");
        h.equal(decision.canPositionInReference, true);
        h.equal(positioned.status, "valid");
    });
    h.test("guard matemático es puro y determinista", function () {
        var input = {
            pregnancyPopulation: "singleton_confirmed",
            gestationalAge: { weeks: 30, days: 0 },
            efwGrams: 1500
        };
        var before = JSON.stringify(input);
        h.equal(science.hasEfwReferenceMathematicalSupport(input), true);
        h.equal(science.hasEfwReferenceMathematicalSupport(input), true);
        h.equal(JSON.stringify(input), before);
    });
    h.test("safety es puro y determinista", function () {
        var input = reportContext({ reportedMethod: "hadlock_hc_ac_fl" });
        var before = JSON.stringify(input);
        var first = safety.screenFetalWeightContext(input);
        var second = safety.screenFetalWeightContext(input);
        h.equal(JSON.stringify(input), before);
        h.deepEqual(first, second);
    });
    h.test("safety acepta contexto y subobjetos congelados", function () {
        var age = Object.freeze({ weeks: 30, days: 0 });
        var values = Object.freeze({ hcCm: 30, acCm: 28, flCm: 5.5 });
        var context = Object.freeze({
            pregnancyPopulation: "singleton_confirmed",
            inputMode: "biometrics",
            gestationalAge: age,
            seeksDiagnosis: false,
            seeksClinicalInterpretation: false,
            biometrics: values
        });
        var decision = safety.screenFetalWeightContext(context);
        h.equal(decision.status, "allowed");
        h.deepEqual(age, { weeks: 30, days: 0 });
        h.deepEqual(values, { hcCm: 30, acCm: 28, flCm: 5.5 });
    });

    [
        ["biométrico 17+6", biometricContext({ gestationalAge: { weeks: 17, days: 6 } }), true],
        ["biométrico 41+1", biometricContext({ gestationalAge: { weeks: 41, days: 1 } }), true],
        ["informe 17+6", reportContext({ gestationalAge: { weeks: 17, days: 6 } }), false],
        ["informe 41+1", reportContext({ gestationalAge: { weeks: 41, days: 1 } }), false]
    ].forEach(function testOutOfRange(row) {
        h.test("safety fuera de referencia: " + row[0], function () {
            var decision = safety.screenFetalWeightContext(row[1]);
            h.equal(decision.status, "reference_out_of_range");
            h.equal(decision.scope, "efw_observation_without_reference_position");
            h.equal(decision.canCalculateEfw, row[2]);
            h.equal(decision.canPositionInReference, false);
            h.includes(decision.reasonCodes, "gestational_age_outside_reference_domain");
        });
    });
    [
        [18, 0],
        [18, 1],
        [40, 6],
        [41, 0]
    ].forEach(function testInclusiveDomain(row) {
        h.test("safety acepta dominio exacto " + row[0] + "+" + row[1], function () {
            var decision = safety.screenFetalWeightContext(reportContext({
                gestationalAge: { weeks: row[0], days: row[1] }
            }));
            h.equal(decision.status, "allowed");
            h.equal(decision.canPositionInReference, true);
        });
    });
    h.test("método de informe conocido incompatible bloquea posición", function () {
        var decision = safety.screenFetalWeightContext(reportContext({
            reportedMethod: "intergrowth_two_parameter"
        }));
        h.equal(decision.status, "incompatible_efw_method");
        h.equal(decision.scope, "efw_observation_without_compatible_reference");
        h.equal(decision.canCalculateEfw, false);
        h.equal(decision.canPositionInReference, false);
        h.includes(decision.reasonCodes, "efw_method_incompatible_with_reference");
    });

    ["biometrics", "report_entered"].forEach(function testMultiple(mode) {
        h.test("embarazo múltiple no usa estándar singleton en modo " + mode, function () {
            var context = mode === "biometrics" ? biometricContext() : reportContext();
            context.pregnancyPopulation = "multiple";
            var decision = safety.screenFetalWeightContext(context);
            h.equal(decision.status, "unsupported_population");
            h.equal(decision.scope, "unsupported_population");
            h.equal(decision.canCalculateEfw, false);
            h.equal(decision.canPositionInReference, false);
            h.includes(decision.reasonCodes, "multiple_pregnancy_not_supported");
        });
    });
    ["biometrics", "report_entered"].forEach(function testUnknownPopulation(mode) {
        h.test("población no confirmada se bloquea en modo " + mode, function () {
            var context = mode === "biometrics" ? biometricContext() : reportContext();
            context.pregnancyPopulation = "unknown";
            var decision = safety.screenFetalWeightContext(context);
            h.equal(decision.status, "singleton_confirmation_required");
            h.equal(decision.scope, "blocked_pending_population_confirmation");
            h.equal(decision.canPositionInReference, false);
            h.includes(decision.reasonCodes, "singleton_not_confirmed");
        });
    });
    h.test("población múltiple mantiene prioridad y adjunta intención diagnóstica", function () {
        var decision = safety.screenFetalWeightContext(biometricContext({
            pregnancyPopulation: "multiple",
            seeksDiagnosis: true
        }));
        h.equal(decision.status, "unsupported_population");
        h.equal(decision.requiresProfessionalInterpretation, true);
        h.includes(decision.reasonCodes, "multiple_pregnancy_not_supported");
        h.includes(decision.reasonCodes, "diagnosis_requested");
    });
    h.test("población desconocida mantiene prioridad y adjunta interpretación clínica", function () {
        var decision = safety.screenFetalWeightContext(reportContext({
            pregnancyPopulation: "unknown",
            seeksClinicalInterpretation: true
        }));
        h.equal(decision.status, "singleton_confirmation_required");
        h.equal(decision.requiresProfessionalInterpretation, true);
        h.includes(decision.reasonCodes, "clinical_indication_interpretation_requested");
    });
    [
        ["diagnóstico", true, false, ["diagnosis_requested"]],
        ["interpretación clínica", false, true, ["clinical_indication_interpretation_requested"]],
        ["ambas intenciones", true, true, ["diagnosis_requested", "clinical_indication_interpretation_requested"]]
    ].forEach(function testProfessionalIntent(row) {
        h.test("singleton deriva a profesional por " + row[0], function () {
            var decision = safety.screenFetalWeightContext(reportContext({
                seeksDiagnosis: row[1],
                seeksClinicalInterpretation: row[2]
            }));
            h.equal(decision.status, "professional_interpretation_required");
            h.equal(decision.scope, "professional_interpretation_required");
            h.equal(decision.requiresProfessionalInterpretation, true);
            h.equal(decision.canCalculateEfw, false);
            h.equal(decision.canPositionInReference, false);
            h.deepEqual(decision.reasonCodes, row[3]);
        });
    });

    [
        ["undefined", undefined, "incomplete", "context", "missingFields"],
        ["null", null, "invalid", "context", "invalidFields"],
        ["array", [], "invalid", "context", "invalidFields"],
        ["texto", "context", "invalid", "context", "invalidFields"]
    ].forEach(function testContainer(row) {
        h.test("safety rechaza contexto " + row[0], function () {
            var decision = safety.screenFetalWeightContext(row[1]);
            h.equal(decision.status, row[2]);
            h.includes(decision[row[4]], row[3]);
        });
    });
    [
        "pregnancyPopulation",
        "inputMode",
        "gestationalAge",
        "seeksDiagnosis",
        "seeksClinicalInterpretation"
    ].forEach(function testMissingCommonField(field) {
        h.test("safety exige campo propio " + field, function () {
            var context = biometricContext();
            delete context[field];
            var decision = safety.screenFetalWeightContext(context);
            h.equal(decision.status, "incomplete");
            h.includes(decision.missingFields, field);
            h.equal(decision.canCalculateEfw, false);
            h.equal(decision.canPositionInReference, false);
        });
    });
    [
        ["población", { pregnancyPopulation: "singleton" }, "pregnancyPopulation"],
        ["modo", { inputMode: "direct" }, "inputMode"],
        ["intención diagnóstica", { seeksDiagnosis: 0 }, "seeksDiagnosis"],
        ["intención clínica", { seeksClinicalInterpretation: "false" }, "seeksClinicalInterpretation"],
        ["edad contenedor", { gestationalAge: [] }, "gestationalAge"]
    ].forEach(function testInvalidCommon(row) {
        h.test("safety invalida " + row[0], function () {
            var decision = safety.screenFetalWeightContext(biometricContext(row[1]));
            h.equal(decision.status, "invalid");
            h.includes(decision.invalidFields, row[2]);
        });
    });
    ["weeks", "days"].forEach(function testMissingAgePart(field) {
        h.test("safety exige gestationalAge." + field, function () {
            var age = { weeks: 30, days: 0 };
            delete age[field];
            var decision = safety.screenFetalWeightContext(reportContext({ gestationalAge: age }));
            h.equal(decision.status, "incomplete");
            h.includes(decision.missingFields, "gestationalAge." + field);
        });
    });
    [
        [{ weeks: 30.5, days: 0 }, "gestationalAge.weeks"],
        [{ weeks: 30, days: 7 }, "gestationalAge.days"],
        [{ weeks: "30", days: 0 }, "gestationalAge.weeks"],
        [{ weeks: 30, days: NaN }, "gestationalAge.days"]
    ].forEach(function testInvalidAge(row, index) {
        h.test("safety invalida edad científica caso " + String(index + 1), function () {
            var decision = safety.screenFetalWeightContext(reportContext({ gestationalAge: row[0] }));
            h.equal(decision.status, "invalid");
            h.includes(decision.invalidFields, row[1]);
        });
    });
    h.test("safety exige contenedor biometrics", function () {
        var context = biometricContext();
        delete context.biometrics;
        var decision = safety.screenFetalWeightContext(context);
        h.equal(decision.status, "incomplete");
        h.includes(decision.missingFields, "biometrics");
    });
    ["hcCm", "acCm", "flCm"].forEach(function testMissingBiometric(field) {
        h.test("safety exige biometrics." + field, function () {
            var values = { hcCm: 30, acCm: 28, flCm: 5.5 };
            delete values[field];
            var decision = safety.screenFetalWeightContext(biometricContext({ biometrics: values }));
            h.equal(decision.status, "incomplete");
            h.includes(decision.missingFields, "biometrics." + field);
        });
    });
    ["hcCm", "acCm", "flCm"].forEach(function testInvalidBiometric(field) {
        h.test("safety invalida biometría no positiva " + field, function () {
            var values = { hcCm: 30, acCm: 28, flCm: 5.5 };
            values[field] = 0;
            var decision = safety.screenFetalWeightContext(biometricContext({ biometrics: values }));
            h.equal(decision.status, "invalid");
            h.includes(decision.invalidFields, "biometrics." + field);
        });
    });
    [
        ["ausente", undefined, "incomplete"],
        ["cero", 0, "invalid"],
        ["negativo", -1, "invalid"],
        ["texto", "1500", "invalid"],
        ["NaN", NaN, "invalid"],
        ["infinito", Infinity, "invalid"],
        ["objeto", { grams: 1500 }, "invalid"]
    ].forEach(function testInvalidReportEfw(row, index) {
        h.test("safety EFW de informe " + row[0], function () {
            var context = reportContext();
            if (index === 0) {
                delete context.efwGrams;
            } else {
                context.efwGrams = row[1];
            }
            var decision = safety.screenFetalWeightContext(context);
            h.equal(decision.status, row[2]);
            h.equal(decision.canPositionInReference, false);
            h.includes(
                row[2] === "incomplete" ? decision.missingFields : decision.invalidFields,
                "efwGrams"
            );
        });
    });
    h.test("canPosition true nunca contradice el soporte matemático del motor", function () {
        var gestationalAges = [
            { weeks: 18, days: 0 },
            { weeks: 18, days: 1 },
            { weeks: 22, days: 3 },
            { weeks: 30, days: 0 },
            { weeks: 40, days: 6 },
            { weeks: 41, days: 0 }
        ];
        var efwValues = [
            Number.MIN_VALUE,
            1 - (Number.EPSILON / 2),
            1,
            1 + Number.EPSILON,
            2,
            50,
            1500,
            Number.MAX_VALUE
        ];
        var allowed = 0;
        var blocked = 0;

        gestationalAges.forEach(function verifyAge(gestationalAge) {
            efwValues.forEach(function verifyEfw(efwGrams) {
                var context = reportContext({
                    gestationalAge: gestationalAge,
                    efwGrams: efwGrams
                });
                var decision = safety.screenFetalWeightContext(context);
                var positioned = positionReportedEfw(gestationalAge, efwGrams);

                if (decision.canPositionInReference) {
                    allowed += 1;
                    h.equal(positioned.status, "valid");
                    h.ok(
                        engineIssueCodes(positioned).indexOf(
                            "efw_outside_reference_mathematical_support"
                        ) === -1
                    );
                } else {
                    blocked += 1;
                }
            });
        });

        h.ok(allowed > 0);
        h.ok(blocked > 0);
    });
    ["", "   ", null, 42].forEach(function testInvalidReportedMethod(value, index) {
        h.test("safety rechaza reportedMethod vacío/no texto " + String(index + 1), function () {
            var decision = safety.screenFetalWeightContext(reportContext({ reportedMethod: value }));
            h.equal(decision.status, "invalid");
            h.includes(decision.invalidFields, "reportedMethod");
        });
    });
    h.test("gate múltiple no evalúa valores biométricos", function () {
        var values = { acCm: 28, flCm: 5.5 };
        Object.defineProperty(values, "hcCm", {
            enumerable: true,
            get: function forbiddenGetter() { throw new Error("singleton math executed"); }
        });
        var decision = safety.screenFetalWeightContext(biometricContext({
            pregnancyPopulation: "multiple",
            biometrics: values
        }));
        h.equal(decision.status, "unsupported_population");
    });
    h.test("población múltiple identificada prevalece aunque falten datos singleton", function () {
        var context = biometricContext({ pregnancyPopulation: "multiple" });
        delete context.biometrics;
        var decision = safety.screenFetalWeightContext(context);
        h.equal(decision.status, "unsupported_population");
        h.equal(decision.canCalculateEfw, false);
        h.equal(decision.canPositionInReference, false);
        h.includes(decision.reasonCodes, "multiple_pregnancy_not_supported");
        h.includes(decision.missingFields, "biometrics");
    });
    h.test("solo identificar población múltiple basta para bloquear estándar singleton", function () {
        var decision = safety.screenFetalWeightContext({ pregnancyPopulation: "multiple" });
        h.equal(decision.status, "unsupported_population");
        h.equal(decision.inputMode, null);
        h.equal(decision.canCalculateEfw, false);
        h.equal(decision.canPositionInReference, false);
    });
}(globalThis));
