(function exposeFetalWeightScienceConfig(root) {
    "use strict";

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }

        Object.getOwnPropertyNames(value).forEach(function freezeProperty(name) {
            deepFreeze(value[name]);
        });

        return Object.freeze(value);
    }

    var config = {
        scienceVersion: "1.0.0",
        schemaVersions: {
            fetalPassportEntry: "1.0.0"
        },
        populationScope: {
            supportedPopulation: "singleton_confirmed",
            unsupportedPopulationStatus: "unsupported_population",
            multiplePregnancyReferenceImplemented: false,
            rationale: "Singleton-only support is a Peso Fetal PRO v1 scope decision. A singleton standard must not be applied to twins, triplets or other multiple pregnancies."
        },
        gestationalAge: {
            inputConvention: "completed_weeks_plus_additional_days",
            additionalDaysMinimum: 0,
            additionalDaysMaximum: 6,
            continuousWeeksFormula: "(completedWeeks * 7 + additionalDays) / 7",
            source: "user_provided_from_obstetric_follow_up",
            redatedFromBiometrics: false,
            redatedFromEstimatedFetalWeight: false
        },
        hadlock: {
            id: "hadlock_hc_ac_fl",
            name: "Hadlock HC + AC + FL",
            outputType: "estimated_fetal_weight",
            formula: "log10(EFW_g) = 1.326 - 0.00326*AC_cm*FL_cm + 0.0107*HC_cm + 0.0438*AC_cm + 0.158*FL_cm",
            requiredBiometrics: [
                "hcCm",
                "acCm",
                "flCm"
            ],
            coefficients: {
                intercept: 1.326,
                acTimesFl: -0.00326,
                hc: 0.0107,
                ac: 0.0438,
                fl: 0.158
            },
            units: {
                hc: "cm",
                ac: "cm",
                fl: "cm",
                efw: "g"
            },
            bpdUsed: false,
            averagesMultipleMethods: false,
            sourceId: "hadlock_1985"
        },
        reference: {
            id: "intergrowth_hadlock_2020",
            version: "2020",
            name: "INTERGROWTH-21st standards for Hadlock's estimation of fetal weight",
            population: "singleton",
            compatibleEfwMethod: "hadlock_hc_ac_fl",
            distribution: "box_cox_gaussian_lms",
            responseTransformation: "natural_log_of_efw_grams",
            gestationalAgeConvention: "exact_continuous_weeks",
            gestationalAgeDomain: {
                minimumCompletedWeeks: 18,
                minimumAdditionalDays: 0,
                minimumTotalDays: 126,
                maximumCompletedWeeks: 41,
                maximumAdditionalDays: 0,
                maximumTotalDays: 287,
                inclusive: true,
                evidence: "published_weekly_rows_18_through_41_in_official_table_s2",
                outsideDomainPolicy: "reference_out_of_range",
                extrapolates: false,
                clamps: false,
                interpolatesWeeklyRows: false
            },
            lms: {
                table: "Table S1",
                logarithm: "natural",
                lambda: {
                    formula: "9.43643 + 9.41579*(GA/10)^-2 - 83.54220*ln(GA/10)*(GA/10)^-2",
                    constant: 9.43643,
                    inverseSquare: 9.41579,
                    logInverseSquare: -83.54220
                },
                mu: {
                    formula: "-2.42272 + 1.86478*GA^0.5 - 1.93299e-5*GA^3",
                    constant: -2.42272,
                    squareRoot: 1.86478,
                    cubic: -1.93299e-5
                },
                sigma: {
                    formula: "0.0193557 + 0.0310716*(GA/10)^-2 - 0.0657587*ln(GA/10)*(GA/10)^-2",
                    constant: 0.0193557,
                    inverseSquare: 0.0310716,
                    logInverseSquare: -0.0657587
                }
            },
            supportedReferenceCentiles: [3, 5, 10, 50, 90, 95, 97],
            standardNormalQuantiles: {
                p3: -1.880793608151251,
                p5: -1.6448536269514729,
                p10: -1.2815515655446004,
                p50: 0,
                p90: 1.2815515655446004,
                p95: 1.6448536269514722,
                p97: 1.8807936081512509
            },
            tailPresentation: {
                preservesComputedPercentile: true,
                appliesArtificialClamp: false,
                sourceDefinedLessThanP1Policy: false,
                sourceDefinedGreaterThanP99Policy: false,
                presentationCutoffsDeferred: true
            },
            reportEnteredMethodPolicy: {
                unknownMethodCanBePositionedWithExplicitUncertainty: true,
                knownNonHadlockMethodCanBePositioned: false
            },
            sourceId: "intergrowth_hadlock_2020",
            verification: {
                coefficientSource: "official_supplementary_table_s1",
                externalWeeklyFixtureSource: "official_supplementary_table_s2",
                legacyWeeklyRowsUsedByRuntime: false,
                officialSupplementsVerifiedDirectly: true,
                independentlyCrossChecked: true
            }
        },
        abbreviations: {
            HC: {
                canonicalField: "head_circumference",
                spanishTerms: ["circunferencia cefalica", "perimetro cefalico"],
                spanishAliases: ["CC", "PC"],
                usedInPrimaryHadlock: true
            },
            AC: {
                canonicalField: "abdominal_circumference",
                spanishTerms: ["circunferencia abdominal", "perimetro abdominal"],
                spanishAliases: ["CA", "PA"],
                usedInPrimaryHadlock: true
            },
            FL: {
                canonicalField: "femur_length",
                spanishTerms: ["longitud femoral"],
                spanishAliases: ["LF"],
                usedInPrimaryHadlock: true
            },
            EFW: {
                canonicalField: "estimated_fetal_weight",
                spanishTerms: ["peso fetal estimado"],
                spanishAliases: ["PFE"],
                usedInPrimaryHadlock: false
            },
            BPD: {
                canonicalField: "biparietal_diameter",
                spanishTerms: ["diametro biparietal"],
                spanishAliases: ["DBP"],
                usedInPrimaryHadlock: false
            }
        },
        efwSources: {
            imoancyHadlock: "imoancy_hadlock_hc_ac_fl",
            reportEntered: "report_entered"
        },
        efwMethods: {
            hadlockHcAcFl: "hadlock_hc_ac_fl",
            unknown: "unknown"
        },
        uncertainty: {
            efwIsEstimate: true,
            dependsOnUltrasoundBiometrics: true,
            measurementsAndFormulaMayDiffer: true,
            percentileDependsOnReference: true,
            individualConfidenceIntervalImplemented: false,
            automaticPlusMinusTenPercent: false
        },
        guardrails: {
            diagnosesFromPercentile: false,
            classifiesFetalGrowth: false,
            redatesFromBiometricsOrEfw: false,
            predictsFutureWeight: false,
            predictsBirthWeight: false,
            usesDoppler: false,
            appliesSingletonReferenceToMultiples: false,
            appliesHadlockReferenceToKnownDifferentEfwMethod: false,
            averagesEfwMethods: false,
            createsClinicalScore: false,
            storesOrTransmitsData: false
        },
        sources: {
            hadlock_1985: {
                id: "hadlock_1985",
                authors: "Hadlock FP, Harrist RB, Sharman RS, Deter RL, Park SK",
                title: "Estimation of fetal weight with the use of head, body, and femur measurements--a prospective study",
                publication: "American Journal of Obstetrics and Gynecology 1985;151(3):333-337",
                doi: "10.1016/0002-9378(85)90298-4",
                url: "https://doi.org/10.1016/0002-9378(85)90298-4",
                supports: ["hadlock_hc_ac_fl_estimated_fetal_weight_formula"]
            },
            intergrowth_hadlock_2020: {
                id: "intergrowth_hadlock_2020",
                authors: "Stirnemann J, Salomon LJ, Papageorghiou AT",
                title: "INTERGROWTH-21st standards for Hadlock's estimation of fetal weight",
                publication: "Ultrasound in Obstetrics & Gynecology 2020;56(6):946-948",
                doi: "10.1002/uog.22000",
                url: "https://doi.org/10.1002/uog.22000",
                supplementaryTableS1Url: "https://obgyn.onlinelibrary.wiley.com/action/downloadSupplement?doi=10.1002%2Fuog.22000&file=uog22000-sup-0001-TableS1.docx",
                supplementaryTableS2Url: "https://obgyn.onlinelibrary.wiley.com/action/downloadSupplement?doi=10.1002%2Fuog.22000&file=uog22000-sup-0002-TableS2.docx",
                independentEquationCrossCheckUrl: "https://www.cfef.org/fichiers/Annexes02.pdf",
                supports: [
                    "hadlock_specific_efw_reference",
                    "box_cox_gaussian_lms_equations",
                    "gestational_age_specific_centiles"
                ]
            }
        }
    };

    root.ImoancyFetalWeightScienceConfig = deepFreeze(config);
}(typeof globalThis !== "undefined" ? globalThis : this));
