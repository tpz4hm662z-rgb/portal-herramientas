(function runWaterSafetyTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var safety = root.ImoancyWaterSafety;
    var BOOLEAN_FIELDS = [
        "isPregnant",
        "isLactating",
        "hasKnownKidneyDisease",
        "hasHeartFailureOrFluidRestrictionCondition",
        "hasMedicalFluidRestriction",
        "hasRelevantAcuteIllness",
        "seeksTherapeuticRecommendation"
    ];

    function profile(changes) {
        var value = {
            ageYears: 35,
            isPregnant: false,
            isLactating: false,
            hasKnownKidneyDisease: false,
            hasHeartFailureOrFluidRestrictionCondition: false,
            hasMedicalFluidRestriction: false,
            hasRelevantAcuteIllness: false,
            seeksTherapeuticRecommendation: false
        };

        Object.keys(changes || {}).forEach(function applyChange(key) {
            value[key] = changes[key];
        });

        return value;
    }

    function isDeepFrozen(value) {
        if (!value || typeof value !== "object" || !Object.isFrozen(value)) {
            return false;
        }

        return Object.keys(value).every(function childIsFrozen(key) {
            return !value[key] || typeof value[key] !== "object" || isDeepFrozen(value[key]);
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

    h.test("API de seguridad disponible y congelada", function () {
        h.ok(safety && typeof safety.screenHydrationContext === "function");
        h.ok(Object.isFrozen(safety));
        h.equal(safety.scienceVersion, "1.0.0");
        h.equal(safety.scienceVersion, root.ImoancyWaterScienceConfig.scienceVersion);
    });
    h.test("perfil ausente queda incompleto", function () {
        var result = safety.screenHydrationContext();
        h.equal(result.status, "incomplete");
        h.includes(result.missingFields, "profile");
        h.equal(result.canShowPopulationReference, false);
    });
    [null, [], "profile"].forEach(function invalidProfile(value, index) {
        h.test("perfil estructuralmente inválido " + index, function () {
            var result = safety.screenHydrationContext(value);
            h.equal(result.status, "invalid");
            h.includes(result.invalidFields, "profile");
        });
    });
    ["ageYears"].concat(BOOLEAN_FIELDS).forEach(function requiredField(field) {
        h.test("cribado exige respuesta explícita " + field, function () {
            var input = profile();
            delete input[field];
            var result = safety.screenHydrationContext(input);
            h.equal(result.status, "incomplete");
            h.includes(result.missingFields, field);
        });
    });
    h.test("false explícito cuenta como respuesta", function () {
        h.equal(safety.screenHydrationContext(profile()).status, "educational_scope");
    });
    BOOLEAN_FIELDS.forEach(function strictBoolean(field) {
        h.test("cribado no coacciona booleano " + field, function () {
            var changes = {};
            changes[field] = "false";
            var result = safety.screenHydrationContext(profile(changes));
            h.equal(result.status, "invalid");
            h.includes(result.invalidFields, field);
        });
    });
    [NaN, Infinity, -Infinity, -1, "18", null].forEach(function invalidAge(value, index) {
        h.test("cribado rechaza edad inválida " + index, function () {
            var result = safety.screenHydrationContext(profile({ ageYears: value }));
            h.equal(result.status, "invalid");
            h.includes(result.invalidFields, "ageYears");
        });
    });
    h.test("menor queda como población no soportada", function () {
        var result = safety.screenHydrationContext(profile({ ageYears: 17.999 }));
        h.equal(result.status, "unsupported_population");
        h.equal(result.scope, "unsupported_population");
        h.equal(result.canShowPopulationReference, false);
        h.equal(result.requiresProfessionalGuidance, true);
        h.includes(result.reasonCodes, "minor_population_unsupported");
        h.equal(result.allowedPopulationReferenceKeys.length, 0);
    });
    h.test("exclusión de menores es alcance v1 y no ausencia de referencias EFSA", function () {
        var scope = root.ImoancyWaterScienceConfig.populationScope;
        var result = safety.screenHydrationContext(profile({ ageYears: 17 }));
        h.equal(scope.minimumSupportedAgeYears, 18);
        h.equal(scope.minorPopulationStatus, "unsupported_population");
        h.equal(scope.pediatricReferencesImplemented, false);
        h.ok(scope.rationale.indexOf("scope decision") >= 0);
        h.ok(scope.rationale.indexOf("does not assert that EFSA lacks") >= 0);
        h.equal(result.status, scope.minorPopulationStatus);
        h.equal(result.canShowPopulationReference, false);
        h.equal(result.allowedPopulationReferenceKeys.length, 0);
    });
    h.test("adulto sano entra en alcance educativo", function () {
        var result = safety.screenHydrationContext(profile({ ageYears: 18 }));
        h.equal(result.status, "educational_scope");
        h.equal(result.canShowPopulationReference, true);
        h.deepEqual(result.allowedPopulationReferenceKeys, ["adult_female", "adult_male"]);
        h.equal(result.canGenerateIndividualGuidance, false);
    });
    h.test("embarazo permite solo referencia poblacional correspondiente", function () {
        var result = safety.screenHydrationContext(profile({ isPregnant: true }));
        h.equal(result.status, "population_reference_only");
        h.deepEqual(result.allowedPopulationReferenceKeys, ["pregnancy"]);
        h.equal(result.canGenerateIndividualGuidance, false);
    });
    h.test("lactancia permite solo referencia poblacional correspondiente", function () {
        var result = safety.screenHydrationContext(profile({ isLactating: true }));
        h.equal(result.status, "population_reference_only");
        h.deepEqual(result.allowedPopulationReferenceKeys, ["lactation"]);
        h.equal(result.canGenerateIndividualGuidance, false);
    });
    h.test("embarazo y lactancia simultáneos exigen aclaración", function () {
        var result = safety.screenHydrationContext(profile({ isPregnant: true, isLactating: true }));
        h.equal(result.status, "clarification_required");
        h.equal(result.canShowPopulationReference, false);
        h.equal(result.allowedPopulationReferenceKeys.length, 0);
        h.deepEqual(result.candidatePopulationReferenceKeys, ["pregnancy", "lactation"]);
    });

    [
        ["hasKnownKidneyDisease", "known_kidney_disease"],
        ["hasHeartFailureOrFluidRestrictionCondition", "heart_failure_or_fluid_restriction_condition"],
        ["hasMedicalFluidRestriction", "medical_fluid_restriction"],
        ["hasRelevantAcuteIllness", "relevant_acute_illness"],
        ["seeksTherapeuticRecommendation", "therapeutic_recommendation_requested"]
    ].forEach(function medicalCase(row) {
        h.test("cribado deriva contexto médico " + row[0], function () {
            var changes = {};
            changes[row[0]] = true;
            var result = safety.screenHydrationContext(profile(changes));
            h.equal(result.status, "medical_referral");
            h.equal(result.scope, "professional_guidance_required");
            h.equal(result.canShowPopulationReference, false);
            h.equal(result.requiresProfessionalGuidance, true);
            h.includes(result.medicalReferralReasonCodes, row[1]);
        });
    });
    h.test("combinación médica conserva todas las causas", function () {
        var result = safety.screenHydrationContext(profile({
            hasKnownKidneyDisease: true,
            hasHeartFailureOrFluidRestrictionCondition: true,
            hasMedicalFluidRestriction: true,
            hasRelevantAcuteIllness: true,
            seeksTherapeuticRecommendation: true
        }));
        h.equal(result.status, "medical_referral");
        h.equal(result.medicalReferralReasonCodes.length, 5);
        h.equal(new Set(result.medicalReferralReasonCodes).size, 5);
    });
    h.test("condición médica prevalece sobre minoría sin perder motivo", function () {
        var result = safety.screenHydrationContext(profile({
            ageYears: 12,
            hasKnownKidneyDisease: true
        }));
        h.equal(result.status, "medical_referral");
        h.includes(result.reasonCodes, "known_kidney_disease");
        h.includes(result.reasonCodes, "minor_population_unsupported");
    });
    h.test("condición médica y doble etapa conservan candidatos sin mostrar referencia", function () {
        var result = safety.screenHydrationContext(profile({
            isPregnant: true,
            isLactating: true,
            hasMedicalFluidRestriction: true
        }));
        h.equal(result.status, "medical_referral");
        h.equal(result.canShowPopulationReference, false);
        h.deepEqual(result.candidatePopulationReferenceKeys, ["pregnancy", "lactation"]);
        h.includes(result.reasonCodes, "pregnancy_and_lactation_require_clarification");
    });
    h.test("menor con embarazo y lactancia sigue fuera de alcance", function () {
        var result = safety.screenHydrationContext(profile({
            ageYears: 17,
            isPregnant: true,
            isLactating: true
        }));
        h.equal(result.status, "unsupported_population");
        h.includes(result.reasonCodes, "minor_population_unsupported");
        h.includes(result.reasonCodes, "pregnancy_and_lactation_require_clarification");
        h.equal(result.canShowPopulationReference, false);
    });
    h.test("propiedades heredadas no completan cribado", function () {
        var result = safety.screenHydrationContext(Object.create(profile()));
        h.equal(result.status, "incomplete");
        h.includes(result.missingFields, "ageYears");
    });
    h.test("todas las decisiones mantienen forma estable", function () {
        var results = [
            safety.screenHydrationContext(),
            safety.screenHydrationContext(null),
            safety.screenHydrationContext(profile({ ageYears: 12 })),
            safety.screenHydrationContext(profile({ hasKnownKidneyDisease: true })),
            safety.screenHydrationContext(profile({ isPregnant: true })),
            safety.screenHydrationContext(profile())
        ];
        var keys = Object.keys(results[0]);
        results.forEach(function sameShape(result) {
            h.deepEqual(Object.keys(result), keys);
            h.equal(result.canGenerateIndividualGuidance, false);
        });
    });
    h.test("decisiones de seguridad están profundamente congeladas", function () {
        h.ok(isDeepFrozen(safety.screenHydrationContext(profile())));
        h.ok(isDeepFrozen(safety.screenHydrationContext(profile({ hasKnownKidneyDisease: true }))));
    });
    h.test("seguridad no devuelve cantidades, dosis ni diagnósticos", function () {
        var keys = allKeys(safety.screenHydrationContext(profile({ hasKnownKidneyDisease: true })));
        [
            "liters", "dailyNeedLiters", "sodiumMg", "electrolyteDose",
            "hydrationScore", "dehydrated", "diagnosis", "treatment"
        ].forEach(function forbidden(key) {
            h.equal(keys.indexOf(key), -1);
        });
    });
    h.test("cribado acepta entrada congelada, no muta y es determinista", function () {
        var input = Object.freeze(profile());
        var before = JSON.stringify(input);
        var first = safety.screenHydrationContext(input);
        var second = safety.screenHydrationContext(input);
        h.equal(JSON.stringify(input), before);
        h.deepEqual(first, second);
    });
}(globalThis));
