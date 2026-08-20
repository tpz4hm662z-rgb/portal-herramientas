(function exposeWaterScienceConfig(root) {
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
            sweatPassportEntry: "1.0.0"
        },
        populationScope: {
            minimumSupportedAgeYears: 18,
            minorPopulationStatus: "unsupported_population",
            pediatricReferencesImplemented: false,
            rationale: "Excluding people under 18 is an Agua Diaria PRO v1 scope decision; it does not assert that EFSA lacks pediatric or adolescent references."
        },
        efsa: {
            framework: "dietary_reference_value",
            referenceType: "population_adequate_intake",
            quantity: "total_water",
            unit: "L/day",
            includes: [
                "drinking_water",
                "other_beverages",
                "food_moisture"
            ],
            applicability: {
                ambientTemperature: "moderate",
                physicalActivity: "moderate",
                physicalActivityLevelPal: 1.6,
                usesTemperatureCorrection: false,
                usesActivityCorrection: false,
                automaticallyIncludesAdditionalLosses: {
                    intenseExercise: false,
                    highSweat: false,
                    demandingEnvironmentalConditions: false
                }
            },
            semantics: {
                waterScope: "total_water_from_beverages_and_foods",
                isPureWaterTarget: false,
                isExactIndividualNeed: false,
                isPersonalizedRecommendation: false,
                isAutomaticallyConvertedToGlasses: false,
                usesFixedFoodWaterPercentage: false,
                canBeAddedToObservedSweatAsDailyTarget: false
            },
            references: {
                adult_female: {
                    group: "adult_female",
                    totalWaterLitersPerDay: 2.0,
                    sourceId: "efsa_water_drv_2010"
                },
                adult_male: {
                    group: "adult_male",
                    totalWaterLitersPerDay: 2.5,
                    sourceId: "efsa_water_drv_2010"
                },
                pregnancy: {
                    group: "pregnancy",
                    totalWaterLitersPerDay: 2.3,
                    sourceId: "efsa_water_drv_2010"
                },
                lactation: {
                    group: "lactation",
                    totalWaterLitersPerDay: 2.7,
                    sourceId: "efsa_water_drv_2010"
                }
            }
        },
        observedSweatSession: {
            observationType: "estimated_observed_sweat_session",
            sweatLossUnit: "L",
            sweatRateUnit: "L/hour",
            bodyMassChangeUnit: "%",
            qualityPolicy: {
                physiologicalPlausibilityThresholdsApplied: false,
                reason: "No evidence-backed plausibility thresholds were approved for this phase.",
                implementedChecks: [
                    "required_values",
                    "numeric_type",
                    "finite_values",
                    "non_negative_fluid_inputs",
                    "positive_weights_and_duration",
                    "finite_computed_results",
                    "non_negative_observed_sweat_loss"
                ]
            },
            semantics: {
                isSessionSpecificObservation: true,
                isDailyWaterNeed: false,
                isFluidIntakePrescription: false,
                isSodiumOrElectrolytePrescription: false,
                combinesWithEfsaReference: false
            }
        },
        sessionContextFields: [
            "activity",
            "durationMinutes",
            "temperatureC",
            "humidityPercent",
            "indoorOutdoor",
            "perceivedIntensity",
            "equipmentOrClothing",
            "notes",
            "sessionDate"
        ],
        guardrails: {
            deriveDailyNeedFromBodyWeight: false,
            applyFixedSexIncrement: false,
            applyFixedActivityIncrement: false,
            addEfsaReferenceToObservedSweat: false,
            prescribeSodiumOrElectrolytes: false,
            diagnoseFromUrineColor: false,
            automaticallyAverageHeterogeneousSessions: false
        },
        sources: {
            efsa_water_drv_2010: {
                id: "efsa_water_drv_2010",
                organization: "European Food Safety Authority (EFSA)",
                title: "Scientific Opinion on Dietary Reference Values for water",
                publication: "EFSA Journal 2010; 8(3):1459",
                doi: "10.2903/j.efsa.2010.1459",
                url: "https://doi.org/10.2903/j.efsa.2010.1459",
                supports: [
                    "population_adequate_intakes_for_total_water",
                    "reference_applicability_at_moderate_ambient_temperature_and_pal_1_6"
                ]
            },
            nata_fluid_replacement_2017: {
                id: "nata_fluid_replacement_2017",
                organization: "National Athletic Trainers' Association (NATA)",
                title: "National Athletic Trainers' Association Position Statement: Fluid Replacement for the Physically Active",
                publication: "Journal of Athletic Training 2017; 52(9):877-895",
                doi: "10.4085/1062-6050-52.9.02",
                url: "https://www.nata.org/sites/default/files/2025-08/fluid_replacement_for_the_physically_active.pdf",
                supports: [
                    "observed_session_sweat_loss_equation",
                    "observed_session_sweat_rate_equation",
                    "session_context_and_variability"
                ]
            }
        }
    };

    root.ImoancyWaterScienceConfig = deepFreeze(config);
}(typeof globalThis !== "undefined" ? globalThis : this));
