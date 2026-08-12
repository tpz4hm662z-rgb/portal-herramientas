(function (root, factory) {
    "use strict";
    const value = factory();
    if (typeof module === "object" && module.exports) module.exports = value;
    else root.FiniquitoNormativa2026 = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const NORMATIVA_2026 = {
        id: "ESP_ET_2026_FINIQUITO_V1",
        jurisdiccion: "España — relación laboral común",
        moneda: "EUR",
        precisionMonetaria: 2,
        referencias: {
            pagasExtra: {
                cita: "Estatuto de los Trabajadores, artículo 31",
                regla: "Dos gratificaciones como regla general; cuantía y segunda fecha según convenio/acuerdo. El convenio puede permitir el prorrateo.",
                url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430#a31"
            },
            vacaciones: {
                cita: "Estatuto de los Trabajadores, artículo 38",
                regla: "Duración pactada en convenio o contrato, nunca inferior a 30 días naturales por año.",
                url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430#a38"
            },
            temporal: {
                cita: "Estatuto de los Trabajadores, artículo 49.1.c y disposición transitoria octava; guía CGPJ v0.5 (octubre 2024)",
                metodo: "SALARIO_DIARIO_X_DIAS_REALES_X_MODULO_ENTRE_365",
                escalaPorFechaCelebracion: [
                    { desde: "2001-03-04", hasta: "2011-12-31", diasPorAnio: 8 },
                    { desde: "2012-01-01", hasta: "2012-12-31", diasPorAnio: 9 },
                    { desde: "2013-01-01", hasta: "2013-12-31", diasPorAnio: 10 },
                    { desde: "2014-01-01", hasta: "2014-12-31", diasPorAnio: 11 },
                    { desde: "2015-01-01", hasta: null, diasPorAnio: 12 }
                ],
                anteriorA: "2001-03-04",
                anteriorAStatus: "UNSUPPORTED",
                excluidos: ["FIN_CONTRATO_FORMATIVO", "FIN_CONTRATO_SUSTITUCION"],
                url: "https://www.boe.es/eli/es/rdlg/2015/10/23/2/con#dt-8"
            },
            objetivo: {
                cita: "Estatuto de los Trabajadores, artículo 53.1.b",
                diasPorAnio: 20,
                maxMensualidades: 12,
                url: "https://www.boe.es/eli/es/rdlg/2015/10/23/2/con#a53"
            },
            improcedente: {
                cita: "Estatuto de los Trabajadores, artículo 56 y disposición transitoria undécima",
                fechaCorte: "2012-02-12",
                diasPorAnioPosterior: 33,
                diasPorAnioAnterior: 45,
                limiteOrdinarioDias: 720,
                limiteAbsolutoMensualidades: 42,
                maxMensualidadesPosterior: 24,
                url: "https://www.boe.es/eli/es/rdlg/2015/10/23/2/con#dt-11"
            },
            salarioRegulador: {
                cita: "Doctrina jurisprudencial recogida en la guía CGPJ v0.5 (octubre 2024)",
                regla: "Salario bruto anual computable dividido entre 365; el mensual debe incluir la prorrata real de pagas extraordinarias.",
                url: "https://www.poderjudicial.es/stfls/CGPJ/UTILIDADES/Gu%C3%ADa%20pr%C3%A1ctica%20legal%20y%20jurisprudencial%20c%C3%A1lculo%20indemnizaciones_octubre2024.pdf"
            },
            computoMensual: {
                cita: "ET arts. 53 y 56; SSTS citadas en guía CGPJ v0.5",
                regla: "Las fracciones residuales se computan como mes completo únicamente en reglas con prorrateo mensual.",
                url: "https://www.poderjudicial.es/stfls/CGPJ/UTILIDADES/Gu%C3%ADa%20pr%C3%A1ctica%20legal%20y%20jurisprudencial%20c%C3%A1lculo%20indemnizaciones_octubre2024.pdf"
            },
            vacacionesPosteriores: {
                cita: "Seguridad Social — situación asimilada al alta por vacaciones retribuidas no disfrutadas",
                regla: "El período comunicado comienza el día posterior a la baja; no implica reconocimiento de prestación.",
                url: "https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/5300/7855/1dd6b5c6-0a3e-4395-a63a-f4626a3270cd/41899/41237/41246"
            }
        },
        vacaciones: {
            diasNaturalesMinimosAnuales: 30,
            regimenPorDefecto: "NATURALES"
        },
        limitesEntrada: {
            importeAbsolutoMaximo: 1000000000,
            numeroPagasMinimo: 1,
            numeroPagasMaximo: 24,
            diasAnualesMaximo: 366,
            conceptosMaximo: 200
        },
        limitesDominio: {
            diasVacacionesAnualesOrdinariosMaximo: 60,
            nota: "Valores superiores requieren estado condicionado; es un control de dominio, no un límite legal universal."
        },
        causasSoportadas: [
            "BAJA_VOLUNTARIA",
            "FIN_CONTRATO_TEMPORAL_INDEMNIZABLE",
            "FIN_CONTRATO_FORMATIVO",
            "FIN_CONTRATO_SUSTITUCION",
            "DESPIDO_OBJETIVO",
            "DESPIDO_DISCIPLINARIO_PROCEDENTE",
            "DESPIDO_IMPROCEDENTE"
        ],
        causasNoSoportadas: [
            "NULIDAD", "DESPIDO_COLECTIVO_COMPLEJO", "ARTICULO_50", "MODIFICACION_SUSTANCIAL",
            "MOVILIDAD_GEOGRAFICA", "RELACION_LABORAL_ESPECIAL", "ALTA_DIRECCION",
            "EMPLEO_HOGAR", "FUNCIONARIO", "ERTE", "ERE", "SUCESION_EMPRESARIAL",
            "SUBROGACION", "INDEMNIZACION_PACTADA"
        ]
    };

    function congelar(value) {
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            Object.values(value).forEach(congelar);
            Object.freeze(value);
        }
        return value;
    }

    return congelar(NORMATIVA_2026);
});
