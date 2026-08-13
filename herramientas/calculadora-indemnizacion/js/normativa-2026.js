"use strict";

(function (root, factory) {
    const normativa = factory();
    if (typeof module === "object" && module.exports) module.exports = normativa;
    else root.ImoancyIndemnizacionNormativa2026 = normativa;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const normativa = {
        id: "IMOANCY-INDEMNIZACION-ES-2026.1",
        jurisdiction: "ES",
        verifiedOn: "2026-08-13",
        transitionDate: "2012-02-12",
        salaryDaysPerYear: 365,
        rules: {
            UNFAIR_DISMISSAL: {
                status: "SUPPORTED",
                currentDaysPerYear: 33,
                preTransitionDaysPerYear: 45,
                ordinaryCapDays: 720,
                transitionalAbsoluteCapDays: 1260,
                legalBasis: ["ET art. 56.1", "ET DT 11.2"]
            },
            OBJECTIVE_DISMISSAL: {
                status: "SUPPORTED",
                daysPerYear: 20,
                capDays: 360,
                legalBasis: ["ET art. 53.1.b"]
            },
            COLLECTIVE_DISMISSAL_BASE: {
                status: "SUPPORTED",
                daysPerYear: 20,
                capDays: 360,
                legalBasis: ["ET art. 51.4", "ET art. 53.1.b"],
                qualification: "Solo mínimo legal base; acuerdos o mejoras requieren análisis específico."
            },
            TEMPORARY_CONTRACT_EXPIRY: {
                status: "REQUIRES_SPECIAL_ANALYSIS",
                legalBasis: ["ET art. 49.1.c", "disposiciones transitorias históricas"],
                reason: "La cuantía y el derecho dependen de modalidad, fecha, exclusiones y sucesión contractual."
            },
            WORKER_INITIATED_INDEMNIFIED_TERMINATION: { status: "REQUIRES_SPECIAL_ANALYSIS", legalBasis: ["ET art. 50"] },
            GEOGRAPHICAL_MOBILITY: { status: "OUT_OF_SCOPE", legalBasis: ["ET art. 40"] },
            SUBSTANTIAL_CHANGE: { status: "OUT_OF_SCOPE", legalBasis: ["ET art. 41"] },
            NULL_DISMISSAL: { status: "OUT_OF_SCOPE" }
        },
        unsupportedServicePatterns: ["FIXED_DISCONTINUOUS"],
        exclusions: [
            "backPay", "moralDamages", "additionalCompensation", "fundamentalRights",
            "tax", "fogasa", "unemploymentBenefit", "settlement", "reinstatement",
            "collectiveAgreementImprovements", "specialEmploymentRelationships"
        ],
        sources: [
            {
                authority: "BOE",
                title: "Estatuto de los Trabajadores, texto consolidado",
                url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430",
                provisions: ["49.1.c", "51.4", "53.1.b", "56.1", "DT 11.2"],
                consultedOn: "2026-08-13"
            },
            {
                authority: "CGPJ",
                title: "Calculadora de indemnizaciones laborales",
                url: "https://www.poderjudicial.es/cgpj/es/Servicios/Utilidades/Calculo-de-indemnizaciones-por-extincion-de-contrato-de-trabajo/",
                consultedOn: "2026-08-13"
            },
            {
                authority: "CGPJ",
                title: "Guía práctica legal y jurisprudencial, v0.6 (julio de 2026)",
                url: "https://www.poderjudicial.es/stfls/CGPJ/UTILIDADES/Guia_pr%C3%A1ctica_legal_y_jurisprudencial_calculo_indemnizaciones_v06_actualizada_a_julio_2026.pdf",
                consultedOn: "2026-08-13"
            }
        ]
    };

    function deepFreeze(value) {
        Object.keys(value).forEach(function (key) {
            if (value[key] && typeof value[key] === "object") deepFreeze(value[key]);
        });
        return Object.freeze(value);
    }

    return deepFreeze(normativa);
}));
