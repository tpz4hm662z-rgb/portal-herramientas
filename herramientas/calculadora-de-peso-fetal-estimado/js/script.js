(function exposeFetalWeightProController(root) {
    "use strict";

    var config = root.ImoancyFetalWeightScienceConfig;
    var science = root.ImoancyFetalWeightScience;
    var safety = root.ImoancyFetalWeightSafety;
    var records = root.ImoancyFetalWeightRecords;
    var storageModule = root.ImoancyFetalWeightRecordStorage;
    var initialized = false;
    var store = null;
    var savedEntries = [];
    var currentResult = null;
    var currentSaved = false;
    var storageBlocked = false;
    var pendingAction = null;
    var recordCounter = 0;
    var OTHER_REPORTED_METHOD = "other_reported_method";
    var FIELD_ERRORS = Object.freeze({
        "input-mode-biometrics": "input-mode-error",
        "input-mode-report": "input-mode-error",
        "population-singleton": "population-error",
        "population-multiple": "population-error",
        "population-unknown": "population-error",
        "gestational-source-established": "gestational-source-error",
        "gestational-source-not-established": "gestational-source-error",
        "gestational-source-unknown": "gestational-source-error",
        "gestational-weeks": "gestational-weeks-error",
        "gestational-days": "gestational-days-error",
        "biometric-unit": "biometric-unit-error",
        "hc-mm": "hc-mm-error",
        "ac-mm": "ac-mm-error",
        "fl-mm": "fl-mm-error",
        "report-efw": "report-efw-error",
        "report-method": "report-method-error",
        "scan-date": "scan-date-error",
        "compare-a": "comparison-selection-error",
        "compare-b": "comparison-selection-error"
    });

    if (!config || !science || !safety || !records || !storageModule) {
        throw new Error(
            "Fetal-weight science, safety, records and storage must load before the UI controller."
        );
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isFiniteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }

    function deepFreeze(value) {
        if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }
        Object.getOwnPropertyNames(value).forEach(function freezeProperty(key) {
            deepFreeze(value[key]);
        });
        return Object.freeze(value);
    }

    function convertBiometricsToMillimeters(values, unit) {
        var multiplier;
        var output;
        if (!isRecord(values) || (unit !== "mm" && unit !== "cm")) {
            throw new TypeError("Biometrics require an explicit mm or cm unit.");
        }
        multiplier = unit === "cm" ? 10 : 1;
        output = {
            hcMm: values.hc * multiplier,
            acMm: values.ac * multiplier,
            flMm: values.fl * multiplier
        };
        if (!isFiniteNumber(output.hcMm) || !isFiniteNumber(output.acMm) ||
            !isFiniteNumber(output.flMm)) {
            throw new TypeError("Biometrics must be finite numbers.");
        }
        return deepFreeze(output);
    }

    function buildPresentationIdentities(entries) {
        var ordered;
        var byRecordId = Object.create(null);
        if (!Array.isArray(entries)) return deepFreeze([]);
        ordered = entries.slice().sort(function stableCreationOrder(left, right) {
            if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? -1 : 1;
            return left.recordId < right.recordId ? -1 : (left.recordId > right.recordId ? 1 : 0);
        });
        ordered.forEach(function assign(entry, index) {
            byRecordId[entry.recordId] = {
                label: "Ecografía " + String(index + 1),
                stableLabel: stableLocalIdentity(entry)
            };
        });
        return deepFreeze(entries.map(function identity(entry) {
            return {
                recordId: entry.recordId,
                label: byRecordId[entry.recordId].label,
                stableLabel: byRecordId[entry.recordId].stableLabel
            };
        }));
    }

    function stableLocalIdentity(entry) {
        var instant = new Date(entry.createdAt);
        var created = isFiniteNumber(instant.getTime()) ? new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(instant) : "fecha de creación no disponible";
        var localReference = String(entry.recordId || "")
            .replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "SINREF";
        return "creada " + created + " · ref. local " + localReference;
    }

    function passportViewState(loaded) {
        var entries = isRecord(loaded) && Array.isArray(loaded.entries) ? loaded.entries.slice() : [];
        var confirmedEmpty = isRecord(loaded) && (loaded.confirmedEmpty === true ||
            (loaded.ok === true && loaded.status === "empty"));
        return deepFreeze({
            entries: entries,
            storageBlocked: !isRecord(loaded) || loaded.ok !== true,
            isEmpty: confirmedEmpty && entries.length === 0,
            historyAvailability: isRecord(loaded) && typeof loaded.historyAvailability === "string" ?
                loaded.historyAvailability : (confirmedEmpty ? "confirmed" : "unknown"),
            historicalEntryCount: isRecord(loaded) &&
                Number.isInteger(loaded.historicalEntryCount) ? loaded.historicalEntryCount :
                entries.filter(function historical(entry) {
                    return entry.scienceVersion !== records.scienceVersion;
                }).length
        });
    }

    function escapeHtml(value) {
        return String(value === null || typeof value === "undefined" ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatNumber(value, minimumDigits, maximumDigits) {
        return new Intl.NumberFormat("es-ES", {
            minimumFractionDigits: minimumDigits,
            maximumFractionDigits: maximumDigits
        }).format(value);
    }

    function formatGrams(value) {
        return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function formatKilograms(value) {
        return formatNumber(value / 1000, 2, 2);
    }

    function formatPercentile(value) {
        return formatNumber(value, 0, 1);
    }

    function formatGestationalAge(age) {
        var dayWord = age.days === 1 ? "día" : "días";
        return String(age.weeks) + " semanas + " + String(age.days) + " " + dayWord;
    }

    function signedNumber(value, digits) {
        var formatted = formatNumber(Math.abs(value), digits, digits);
        if (value > 0) return "+" + formatted;
        if (value < 0) return "−" + formatted;
        return formatted;
    }

    function buildScienceInput(input, convertedBiometrics) {
        var value = {
            pregnancyPopulation: input.pregnancyPopulation,
            inputMode: input.inputMode,
            gestationalAge: {
                weeks: input.gestationalAge.weeks,
                days: input.gestationalAge.days
            }
        };

        if (input.inputMode === "biometrics") {
            value.biometrics = convertedBiometrics;
        } else {
            value.efwGrams = input.efwGrams;
            if (typeof input.reportedMethod === "string" && input.reportedMethod.trim() !== "") {
                value.reportedMethod = input.reportedMethod.trim() === config.efwMethods.unknown
                    ? "report_efw_method_unknown" : input.reportedMethod.trim();
            } else {
                value.reportedMethod = "report_efw_method_unknown";
            }
        }
        return value;
    }

    function buildSafetyInput(scienceInput) {
        var value = {
            pregnancyPopulation: scienceInput.pregnancyPopulation,
            inputMode: scienceInput.inputMode,
            gestationalAge: scienceInput.gestationalAge,
            seeksDiagnosis: false,
            seeksClinicalInterpretation: false
        };

        if (scienceInput.inputMode === "biometrics") {
            value.biometrics = scienceInput.biometrics;
        } else {
            value.efwGrams = scienceInput.efwGrams;
            if (Object.prototype.hasOwnProperty.call(scienceInput, "reportedMethod")) {
                value.reportedMethod = scienceInput.reportedMethod;
            }
        }
        return value;
    }

    function evaluateInput(input) {
        var conversion = null;
        var convertedBiometrics = null;
        var scientificInput;
        var safetyInput;
        var decision;
        var evaluation = null;
        var canExposeObservation;

        if (!isRecord(input) || !isRecord(input.gestationalAge)) {
            return deepFreeze({
                status: "invalid",
                decision: null,
                evaluation: null,
                conversion: null,
                canExposeObservation: false
            });
        }

        if (input.gestationalAgeEstablished !== true) {
            return deepFreeze({
                status: "gestational_age_confirmation_required",
                decision: {
                    status: "gestational_age_confirmation_required",
                    reasonCodes: ["gestational_age_not_clinically_established"],
                    canCalculateEfw: false,
                    canPositionInReference: false
                },
                evaluation: null,
                conversion: null,
                canExposeObservation: false
            });
        }

        if (input.inputMode === "biometrics") {
            conversion = science.convertBiometricsMmToCm(input.biometricsMm);
            if (conversion.status !== "valid") {
                return deepFreeze({
                    status: conversion.status,
                    decision: null,
                    evaluation: null,
                    conversion: conversion,
                    canExposeObservation: false
                });
            }
            convertedBiometrics = conversion.biometrics;
        }

        scientificInput = buildScienceInput(input, convertedBiometrics);
        safetyInput = buildSafetyInput(scientificInput);
        decision = safety.screenFetalWeightContext(safetyInput);
        canExposeObservation = [
            "allowed",
            "reference_out_of_range",
            "incompatible_efw_method"
        ].indexOf(decision.status) !== -1;

        if (canExposeObservation) {
            evaluation = science.evaluateFetalWeight(scientificInput);
            canExposeObservation = isRecord(evaluation.efwObservation) &&
                isFiniteNumber(evaluation.efwObservation.efwGrams);
        }

        return deepFreeze({
            status: decision.status,
            decision: decision,
            evaluation: evaluation,
            conversion: conversion,
            canExposeObservation: canExposeObservation
        });
    }

    function createLocalRecordMetadata(epochMilliseconds, nonce) {
        var instant = new Date(epochMilliseconds);
        var suffix = String(nonce).replace(/[^a-zA-Z0-9_-]/g, "");
        if (!isFiniteNumber(epochMilliseconds) || !suffix || !isFiniteNumber(instant.getTime())) {
            throw new TypeError("Local record metadata requires a valid time and nonce.");
        }
        return Object.freeze({
            recordId: "fetal-" + String(epochMilliseconds) + "-" + suffix,
            createdAt: instant.toISOString()
        });
    }

    function buildPassportEntry(outcome, scanDate, metadata) {
        var evaluation;
        var observation;
        var position;
        var options;
        if (!isRecord(outcome) || !outcome.canExposeObservation ||
            !isRecord(outcome.evaluation) || !isRecord(metadata)) {
            throw new TypeError("A valid visible observation and local metadata are required.");
        }
        evaluation = outcome.evaluation;
        observation = evaluation.efwObservation;
        position = evaluation.referencePosition;
        options = {
            recordId: metadata.recordId,
            createdAt: metadata.createdAt,
            scanDate: scanDate || null,
            gestationalAgeWeeks: evaluation.gestationalAge.weeks,
            gestationalAgeDays: evaluation.gestationalAge.days,
            efwGrams: observation.efwGrams,
            efwSource: observation.source,
            efwMethod: observation.method,
            biometrics: observation.biometrics
        };
        if (isRecord(position) && position.status === "valid") {
            options.referenceId = position.referenceId;
            options.referenceVersion = position.referenceVersion;
            options.zScore = position.zScore;
            options.percentile = position.percentile;
        }
        return records.buildFetalPassportEntry(options);
    }

    function describeMethod(source, method) {
        if (source === config.efwSources.imoancyHadlock) {
            return "Calculado por Imoancy con HC + AC + FL mediante Hadlock";
        }
        if (method === config.efwMethods.unknown || method === "report_efw_method_unknown") {
            return "PFE copiado del informe · método no indicado";
        }
        if (method === config.efwMethods.hadlockHcAcFl) {
            return "PFE copiado del informe · método declarado: Hadlock HC + AC + FL";
        }
        if (method === OTHER_REPORTED_METHOD) {
            return "PFE copiado del informe · el informe indica otro método";
        }
        return "PFE copiado del informe · método declarado: " + method;
    }

    function comparisonSummary(comparison) {
        return deepFreeze({
            homogeneous: comparison.homogeneousComparisonAllowed,
            reference: comparison.referenceComparability,
            method: comparison.methodComparability,
            scienceVersion: comparison.scienceVersionComparability,
            schemaVersion: comparison.schemaVersionComparability,
            unknownData: comparison.unknownData.slice(),
            compatibilityIssues: comparison.compatibilityIssues.slice(),
            scanIntervalDays: comparison.scanIntervalDays,
            gestationalAgeDifferenceDays: comparison.gestationalAgeDifferenceDays,
            efwDifferenceGrams: comparison.efwDifferenceGrams,
            percentileDifference: comparison.percentileDifference
        });
    }

    function byId(id) {
        return root.document && root.document.getElementById
            ? root.document.getElementById(id)
            : null;
    }

    function setHidden(element, hidden) {
        if (element) element.hidden = hidden;
    }

    function setText(id, value) {
        var element = byId(id);
        if (element) element.textContent = String(value === null ? "" : value);
    }

    function focusElement(element) {
        if (element && typeof element.focus === "function") {
            element.focus({ preventScroll: true });
            if (typeof element.scrollIntoView === "function") {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    function selectedRadio(name) {
        return root.document.querySelector('input[name="' + name + '"]:checked');
    }

    function errorIdFor(controlId) {
        return FIELD_ERRORS[controlId] || controlId + "-error";
    }

    function setFieldError(controlId, message) {
        var control = byId(controlId);
        var errorId = errorIdFor(controlId);
        var error = byId(errorId);
        var currentDescription;
        if (control) {
            control.setAttribute("aria-invalid", "true");
            currentDescription = (control.getAttribute("aria-describedby") || "")
                .split(/\s+/).filter(Boolean).filter(function notSame(id) { return id !== errorId; });
            currentDescription.push(errorId);
            control.setAttribute("aria-describedby", currentDescription.join(" "));
        }
        if (error) {
            error.textContent = message;
            setHidden(error, false);
        }
    }

    function clearFieldError(control) {
        var controlId = typeof control === "string" ? control : control.id;
        var element = typeof control === "string" ? byId(control) : control;
        var errorId = errorIdFor(controlId);
        var error = byId(errorId);
        var description;
        if (element) {
            element.removeAttribute("aria-invalid");
            description = (element.getAttribute("aria-describedby") || "")
                .split(/\s+/).filter(Boolean).filter(function removeError(id) { return id !== errorId; });
            if (description.length > 0) element.setAttribute("aria-describedby", description.join(" "));
            else element.removeAttribute("aria-describedby");
        }
        if (error) {
            error.textContent = "";
            setHidden(error, true);
        }
    }

    function clearFormErrors() {
        var form = byId("fetal-form");
        var summary = byId("form-error-summary");
        if (form) {
            form.querySelectorAll('[aria-invalid="true"]').forEach(function clear(control) {
                clearFieldError(control);
            });
            form.querySelectorAll(".field-error").forEach(function clearMessage(error) {
                error.textContent = "";
                setHidden(error, true);
            });
        }
        if (summary) {
            summary.innerHTML = "";
            setHidden(summary, true);
        }
        setHidden(byId("screening-message"), true);
    }

    function clearTransientMessages() {
        var summary = byId("form-error-summary");
        if (summary) {
            summary.innerHTML = "";
            setHidden(summary, true);
        }
        setHidden(byId("screening-message"), true);
        setText("save-status", "");
    }

    function invalidateCurrentResult() {
        currentResult = null;
        currentSaved = false;
        setHidden(byId("resultados"), true);
        clearTransientMessages();
        invalidateComparison();
        updateSaveButton();
    }

    function showErrorSummary(errors) {
        var summary = byId("form-error-summary");
        if (!summary) return;
        summary.innerHTML = "<strong>Revisa " + String(errors.length) +
            (errors.length === 1 ? " dato:</strong>" : " datos:</strong>") +
            "<ul>" + errors.map(function item(message) {
                return "<li>" + escapeHtml(message) + "</li>";
            }).join("") + "</ul>";
        setHidden(summary, false);
        focusElement(summary);
    }

    function addError(errors, controlId, message) {
        setFieldError(controlId, message);
        errors.push(message);
    }

    function readNumber(controlId, label, options, errors) {
        var control = byId(controlId);
        var raw = control ? control.value.trim() : "";
        var value;
        if (raw === "") {
            addError(errors, controlId, "Introduce " + label + ".");
            return null;
        }
        value = control && control.tagName === "SELECT" ? Number(raw) : control.valueAsNumber;
        if (!isFiniteNumber(value)) {
            addError(errors, controlId, "Introduce un número válido para " + label + ".");
            return null;
        }
        if (options.integer && !Number.isInteger(value)) {
            addError(errors, controlId, label + " debe indicarse con un número entero.");
            return null;
        }
        if (options.positive && value <= 0) {
            addError(errors, controlId, label + " debe ser mayor que cero.");
            return null;
        }
        if (isFiniteNumber(options.minimum) && value < options.minimum) {
            addError(errors, controlId, label + " no puede ser menor que " + String(options.minimum) + ".");
            return null;
        }
        if (isFiniteNumber(options.maximum) && value > options.maximum) {
            addError(errors, controlId, label + " no puede ser mayor que " + String(options.maximum) + ".");
            return null;
        }
        return value;
    }

    function readFormInput() {
        var errors = [];
        var modeControl = selectedRadio("input-mode");
        var populationControl = selectedRadio("pregnancy-population");
        var gestationalSourceControl = selectedRadio("gestational-age-source");
        var weeks;
        var days;
        var input;
        var methodChoice;
        var biometricUnit;
        var rawBiometrics;
        var scanDate = byId("scan-date").value;
        if (!modeControl) addError(errors, "input-mode-biometrics", "Elige cómo quieres introducir la ecografía.");
        if (!populationControl) addError(errors, "population-singleton", "Indica si es un embarazo único, múltiple o si no lo sabes.");
        if (!gestationalSourceControl) addError(errors, "gestational-source-established", "Confirma de dónde procede la edad gestacional.");
        weeks = readNumber("gestational-weeks", "las semanas de gestación", { integer: true, minimum: 0 }, errors);
        days = readNumber("gestational-days", "los días adicionales", { integer: true, minimum: 0, maximum: 6 }, errors);
        if (scanDate && byId("scan-date").validity && !byId("scan-date").validity.valid) {
            addError(errors, "scan-date", "Introduce una fecha de ecografía válida o déjala vacía.");
        }
        input = {
            pregnancyPopulation: populationControl ? populationControl.value : null,
            inputMode: modeControl ? modeControl.value : null,
            gestationalAgeEstablished: gestationalSourceControl ?
                gestationalSourceControl.value === "established" : false,
            gestationalAge: { weeks: weeks, days: days },
            scanDate: scanDate || null
        };
        if (modeControl && modeControl.value === "biometrics") {
            biometricUnit = byId("biometric-unit").value;
            if (biometricUnit !== "mm" && biometricUnit !== "cm") {
                addError(errors, "biometric-unit", "Selecciona la unidad que utiliza el informe.");
            }
            rawBiometrics = {
                hc: readNumber("hc-mm", "HC / CC", { positive: true }, errors),
                ac: readNumber("ac-mm", "AC / CA", { positive: true }, errors),
                fl: readNumber("fl-mm", "FL / LF", { positive: true }, errors)
            };
            input.biometricsUnit = biometricUnit;
            if (biometricUnit && Object.keys(rawBiometrics).every(function finite(key) {
                return isFiniteNumber(rawBiometrics[key]);
            })) {
                input.biometricsMm = convertBiometricsToMillimeters(rawBiometrics, biometricUnit);
            } else {
                input.biometricsMm = { hcMm: null, acMm: null, flMm: null };
            }
        }
        if (modeControl && modeControl.value === "report_entered") {
            input.efwGrams = readNumber("report-efw", "el PFE en gramos", { positive: true }, errors);
            methodChoice = byId("report-method").value;
            if (methodChoice === "") {
                addError(errors, "report-method", "Indica si conoces el método del PFE.");
            } else if (methodChoice === "hadlock") {
                input.reportedMethod = config.efwMethods.hadlockHcAcFl;
            } else if (methodChoice === "other") {
                input.reportedMethod = OTHER_REPORTED_METHOD;
            } else if (methodChoice === "unknown") {
                input.reportedMethod = "report_efw_method_unknown";
            }
        }
        return { errors: errors, input: input };
    }

    function screeningMessage(decision) {
        if (!decision) return "No se han podido validar los datos introducidos.";
        if (decision.status === "unsupported_population") {
            return "Esta referencia se ha implementado únicamente para embarazos únicos. En un embarazo múltiple no se calcula ni se muestra una posición singleton.";
        }
        if (decision.status === "singleton_confirmation_required") {
            return "Para utilizar esta referencia necesitamos confirmar que se trata de un embarazo único. Si no lo sabes, consúltalo en el informe o con tu equipo sanitario.";
        }
        if (decision.status === "professional_interpretation_required") {
            return "Esta herramienta no realiza diagnósticos ni interpreta indicaciones clínicas. Esa valoración corresponde al equipo sanitario.";
        }
        if (decision.status === "gestational_age_confirmation_required") {
            return "La edad gestacional debe proceder del seguimiento o datación clínica. Si no está establecida o no lo sabes, consulta el informe o a tu equipo sanitario antes de usar la herramienta.";
        }
        if (decision.reasonCodes.indexOf("efw_outside_reference_mathematical_support") !== -1) {
            return "El valor introducido no pertenece al soporte matemático de la referencia implementada. No se ha generado una posición.";
        }
        return "Revisa los datos indicados antes de continuar.";
    }

    function showScreeningBlock(decision) {
        var element = byId("screening-message");
        if (!element) return;
        element.innerHTML = "<strong>No se puede mostrar el resultado en este contexto.</strong><p>" +
            escapeHtml(screeningMessage(decision)) + "</p>";
        setHidden(element, false);
        focusElement(element);
    }

    function sourceExplanation(evaluation, input) {
        var observation = evaluation.efwObservation;
        if (observation.source === config.efwSources.imoancyHadlock) {
            return "Se utilizaron HC, AC y FL tal como se introdujeron en " +
                (input && input.biometricsUnit === "cm" ? "centímetros" : "milímetros") +
                " y la presentación los convirtió a las unidades del contrato. El núcleo científico aplicó Hadlock HC + AC + FL para estimar el PFE y, cuando el contrato lo permitió, lo posicionó en la referencia INTERGROWTH-Hadlock implementada.";
        }
        return "Imoancy no recalculó el PFE: utilizó exactamente el valor introducido desde el informe. " +
            (observation.method === config.efwMethods.unknown ||
                observation.method === "report_efw_method_unknown"
                ? "El método del ecógrafo quedó registrado como desconocido, sin inferir Hadlock. Sin un método compatible conocido no se calculan percentil ni z-score Stirnemann-Hadlock."
                : (observation.method === OTHER_REPORTED_METHOD
                    ? "El informe indica otro método; no se guarda texto libre ni se atribuye Hadlock."
                    : "El método declarado quedó registrado como “" + observation.method + "”.")) +
            (observation.method === config.efwMethods.unknown ||
                observation.method === "report_efw_method_unknown" ? "" :
                " La posición solo se muestra cuando ese método y el resto del contrato son compatibles.");
    }

    function unavailableReferenceText(outcome) {
        if (outcome.status === "reference_out_of_range") {
            return "Se muestra el PFE, pero no una posición. La referencia implementada solo permite posicionar observaciones dentro del intervalo publicado utilizado por esta herramienta; ese intervalo no es una recomendación clínica de uso.";
        }
        if (outcome.status === "incompatible_efw_method") {
            return "Se muestra el PFE del informe, pero no percentil ni z-score: el método es desconocido o no es compatible con la referencia Stirnemann-Hadlock. No se ha cambiado ni inferido el método.";
        }
        return "No hay una posición de referencia disponible para esta observación.";
    }

    function renderReference(percentile, zScore) {
        var marker = byId("percentile-marker");
        var scale = byId("percentile-scale");
        var position = Math.min(100, Math.max(0, percentile));
        var label = "Percentil aproximado " + formatPercentile(percentile) +
            ". Posición estadística dentro de la referencia; no es una categoría clínica.";
        setHidden(byId("result-position-card"), false);
        setHidden(byId("result-position-available"), false);
        setHidden(byId("result-position-unavailable"), true);
        setText("result-percentile", formatPercentile(percentile));
        setText("result-z-score", signedNumber(zScore, 2));
        marker.style.left = String(position) + "%";
        marker.setAttribute("data-label", "P" + formatPercentile(percentile));
        scale.setAttribute("aria-label", label);
        setText("percentile-text-alternative", label);
    }

    function renderUnavailableReference(message) {
        setHidden(byId("result-position-card"), false);
        setHidden(byId("result-position-available"), true);
        setHidden(byId("result-position-unavailable"), false);
        setText("result-percentile", "—");
        setText("result-z-score", "—");
        setText("result-position-unavailable", message);
    }

    function renderOutcome(outcome, input, saved) {
        var section = byId("resultados");
        var evaluation = outcome.evaluation;
        var observation = evaluation.efwObservation;
        var position = evaluation.referencePosition;
        currentResult = { outcome: outcome, input: input };
        currentSaved = saved === true;
        setText("result-weight", formatGrams(observation.efwGrams));
        setText("result-kilograms", formatKilograms(observation.efwGrams));
        setText("result-age", formatGestationalAge(evaluation.gestationalAge));
        setText("result-source", describeMethod(observation.source, observation.method));
        setText("calculation-explanation", sourceExplanation(evaluation, input));
        setHidden(byId("result-method-uncertainty"),
            observation.source !== config.efwSources.reportEntered ||
            (observation.method !== config.efwMethods.unknown &&
                observation.method !== "report_efw_method_unknown"));
        setHidden(byId("result-rounding-note"), Number.isInteger(observation.efwGrams));
        if (position && position.status === "valid" && isFiniteNumber(position.percentile) &&
            isFiniteNumber(position.zScore)) {
            renderReference(position.percentile, position.zScore);
        } else {
            renderUnavailableReference(unavailableReferenceText(outcome));
        }
        setHidden(section, false);
        updateSaveButton();
        focusElement(section);
    }

    function renderSavedEntry(entry) {
        var age = { weeks: entry.gestationalAgeWeeks, days: entry.gestationalAgeDays };
        currentResult = null;
        currentSaved = true;
        setText("result-weight", formatGrams(entry.efwGrams));
        setText("result-kilograms", formatKilograms(entry.efwGrams));
        setText("result-age", formatGestationalAge(age));
        setText("result-source", describeMethod(entry.efwSource, entry.efwMethod));
        setHidden(byId("result-method-uncertainty"),
            entry.efwSource !== config.efwSources.reportEntered ||
            (entry.efwMethod !== config.efwMethods.unknown &&
                entry.efwMethod !== "report_efw_method_unknown"));
        setHidden(byId("result-rounding-note"), Number.isInteger(entry.efwGrams));
        setText("calculation-explanation",
            entry.efwSource === config.efwSources.imoancyHadlock
                ? "Este registro conserva el PFE Hadlock y las biometrías HC + AC + FL validadas por el núcleo científico."
                : "Este registro conserva el PFE aportado desde el informe y su método declarado, sin recalcularlo ni inferirlo."
        );
        if (isFiniteNumber(entry.percentile) && isFiniteNumber(entry.zScore)) {
            renderReference(entry.percentile, entry.zScore);
        }
        else renderUnavailableReference("Este registro no contiene una posición numérica verificable en la referencia actual.");
        setHidden(byId("resultados"), false);
        updateSaveButton();
        focusElement(byId("resultados"));
    }

    function handleCalculation(event) {
        var read;
        var outcome;
        var populationControl;
        event.preventDefault();
        clearFormErrors();
        setText("save-status", "");
        invalidateComparison();
        populationControl = selectedRadio("pregnancy-population");
        if (populationControl && populationControl.value === "multiple") {
            showScreeningBlock(safety.screenFetalWeightContext({
                pregnancyPopulation: "multiple"
            }));
            return;
        }
        read = readFormInput();
        if (read.errors.length > 0) {
            showErrorSummary(read.errors);
            return;
        }
        outcome = evaluateInput(read.input);
        if (!outcome.canExposeObservation) {
            showScreeningBlock(outcome.decision);
            return;
        }
        renderOutcome(outcome, read.input, false);
    }

    function handleCalculatorKeydown(event) {
        var target = event.target;
        if (event.key !== "Enter" || !target ||
            target.tagName === "SELECT" || target.tagName === "BUTTON" ||
            target.type === "radio" || target.type === "checkbox") {
            return;
        }
        event.preventDefault();
        handleCalculation(event);
    }

    function updateModePanels() {
        var selected = selectedRadio("input-mode");
        var mode = selected ? selected.value : null;
        setHidden(byId("biometrics-fields"), mode !== "biometrics");
        setHidden(byId("report-fields"), mode !== "report_entered");
        clearFieldError("input-mode-biometrics");
        clearFieldError("input-mode-report");
    }

    function updateBiometricUnits() {
        var unit = byId("biometric-unit").value;
        var displayedUnit = unit || "unidad";
        var placeholders = unit === "cm" ? ["30", "28", "5,5"] :
            (unit === "mm" ? ["300", "280", "55"] : ["—", "—", "—"]);
        ["hc", "ac", "fl"].forEach(function update(field, index) {
            setText(field + "-input-unit", displayedUnit);
            byId(field + "-mm").setAttribute("placeholder", placeholders[index]);
        });
    }

    function resetForm() {
        var form = byId("fetal-form");
        if (!form) return;
        form.querySelectorAll("input").forEach(function resetInput(input) {
            if (input.type === "radio" || input.type === "checkbox") input.checked = false;
            else input.value = "";
        });
        form.querySelectorAll("select").forEach(function resetSelect(select) {
            select.selectedIndex = 0;
        });
        clearFormErrors();
        updateModePanels();
        updateBiometricUnits();
        setHidden(byId("resultados"), true);
        currentResult = null;
        currentSaved = false;
        setText("save-status", "");
        invalidateComparison();
        updateSaveButton();
        focusElement(byId("input-mode-biometrics"));
    }

    function randomNonce() {
        recordCounter += 1;
        if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID();
        return "local-" + String(recordCounter);
    }

    function updateSaveButton() {
        var button = byId("save-observation");
        if (!button) return;
        button.disabled = !currentResult || currentSaved || storageBlocked;
        if (currentSaved) button.textContent = "Observación ya guardada";
        else if (storageBlocked) button.textContent = "Guardado no disponible";
        else button.textContent = "Guardar en mi Pasaporte";
    }

    function saveCurrentObservation() {
        var metadata;
        var entry;
        var saved;
        if (!currentResult || currentSaved || storageBlocked) return;
        metadata = createLocalRecordMetadata(Date.now(), randomNonce());
        try {
            entry = buildPassportEntry(currentResult.outcome, currentResult.input.scanDate, metadata);
        } catch (error) {
            setText("save-status", "No se ha podido crear un registro íntegro para guardar.");
            focusElement(byId("save-status"));
            return;
        }
        saved = store.save(entry);
        if (!saved.ok) {
            handleStorageFailure(saved);
            setText("save-status", "No se ha escrito ningún dato. Revisa el estado del Pasaporte.");
            focusElement(byId("save-status"));
            return;
        }
        currentSaved = true;
        setText("save-status", "Observación guardada localmente en este navegador.");
        renderPassport(saved);
        updateSaveButton();
        focusElement(byId("passport-title"));
    }

    function entryLabel(entry) {
        return formatGestationalAge({ weeks: entry.gestationalAgeWeeks, days: entry.gestationalAgeDays });
    }

    function presentationLabel(entry) {
        var identities = buildPresentationIdentities(savedEntries);
        var identity = identities.filter(function same(item) {
            return item.recordId === entry.recordId;
        })[0];
        return identity ? identity.label + " · " + identity.stableLabel : "Ecografía guardada";
    }

    function renderHistory() {
        var list = byId("passport-list");
        if (!list) return;
        list.innerHTML = savedEntries.map(function card(entry) {
            var label = entryLabel(entry);
            var identity = presentationLabel(entry);
            var date = entry.scanDate ? escapeHtml(entry.scanDate) : "Fecha no indicada";
            var method = escapeHtml(describeMethod(entry.efwSource, entry.efwMethod));
            var historical = entry.scienceVersion !== records.scienceVersion;
            return [
                '<article class="passport-card"><div class="passport-card__heading"><div>',
                '<p class="eyebrow">' + escapeHtml(identity) + '</p><h4>' + escapeHtml(label) + '</h4>',
                '</div><strong>' + escapeHtml(formatGrams(entry.efwGrams)) + ' g</strong></div>',
                '<dl><div><dt>Fecha</dt><dd>' + date + '</dd></div>',
                '<div><dt>Procedencia</dt><dd>' + method + '</dd></div>',
                '<div><dt>Percentil</dt><dd>' +
                    (isFiniteNumber(entry.percentile) ? escapeHtml(formatPercentile(entry.percentile)) : "No disponible") +
                    '</dd></div><div><dt>Versión científica</dt><dd>' +
                    escapeHtml(entry.scienceVersion) + (historical ? " · histórica" : " · actual") +
                    '</dd></div></dl><div class="passport-card__actions">',
                '<button type="button" class="boton boton-secundario" data-action="open" data-record-id="' +
                    escapeHtml(entry.recordId) + '" aria-label="Abrir ' + escapeHtml(identity) + ', ' + escapeHtml(label) + '">Abrir ecografía</button>',
                '<button type="button" class="boton boton-peligro" data-action="remove"' +
                    (storageBlocked ? ' disabled aria-disabled="true"' : '') + ' data-record-id="' +
                    escapeHtml(entry.recordId) + '" aria-label="Eliminar ' + escapeHtml(identity) + ', ' + escapeHtml(label) + '">Eliminar ecografía</button>',
                '</div></article>'
            ].join("");
        }).join("");
    }

    function renderComparisonSelectors() {
        var first = byId("compare-a");
        var second = byId("compare-b");
        var options = '<option value="">Selecciona una ecografía</option>' +
            savedEntries.map(function option(entry) {
                return '<option value="' + escapeHtml(entry.recordId) + '">' +
                    escapeHtml(presentationLabel(entry) + " · " + entryLabel(entry) + " · " +
                        formatGrams(entry.efwGrams) + " g") + '</option>';
            }).join("");
        if (first) first.innerHTML = options;
        if (second) second.innerHTML = options;
    }

    function renderCorruption(loaded) {
        var panel = byId("storage-problem");
        var recover = byId("recover-valid-records");
        var discard = byId("discard-corrupt-storage");
        if (!panel) return;
        if (loaded.ok) {
            setHidden(panel, true);
            return;
        }
        setHidden(panel, false);
        setHidden(recover, loaded.status !== "partial_corruption");
        setHidden(discard, loaded.status !== "partial_corruption" && loaded.status !== "corrupt_data");
        if (loaded.status === "partial_corruption") {
            panel.querySelector("p").textContent = "Se han aislado " + String(loaded.entries.length) +
                " registros válidos y " + String(loaded.invalidEntryCount) +
                " registros no válidos" + (loaded.duplicateEntryCount > 0 ?
                    ", incluidos " + String(loaded.duplicateEntryCount) +
                    " con identificadores duplicados" : "") +
                ". Las entradas ambiguas no se muestran ni pueden eliminarse individualmente. No se sobrescribirá nada hasta que elijas recuperar los registros inequívocos o descartar conscientemente el almacenamiento dañado.";
        } else if (loaded.status === "corrupt_data") {
            panel.querySelector("p").textContent = loaded.entries.length > 0 ?
                "El almacenamiento local ya no puede leerse. Se mantiene visible el último snapshot válido conocido, bloqueado y sin sobrescribir. Puedes descartar el contenido ilegible explícitamente si deseas empezar de nuevo." :
                "El almacenamiento local no puede leerse. No se ha eliminado ni sobrescrito y no se afirma que esté vacío. Puedes descartarlo explícitamente si deseas empezar de nuevo.";
        } else {
            panel.querySelector("p").textContent = loaded.entries.length > 0 ?
                "El almacenamiento local no está disponible. Se mantiene visible el último snapshot válido conocido, pero queda bloqueado y no se ha escrito ni eliminado nada." :
                "El almacenamiento local no está disponible. No se puede confirmar si existe historial; puedes calcular, pero no guardar en este navegador.";
        }
    }

    function renderHistoricalNotice(count) {
        var notice = byId("historical-records-note");
        if (!notice) return;
        if (count < 1) {
            notice.textContent = "";
            setHidden(notice, true);
            return;
        }
        notice.textContent = String(count) + (count === 1 ?
            " ecografía pertenece" : " ecografías pertenecen") +
            " a una versión científica histórica. Se conserva sin recalcular ni migrar. Puede compararse descriptivamente, pero nunca se considerará homogénea con una versión científica diferente.";
        setHidden(notice, false);
    }

    function invalidateComparison() {
        var result = byId("comparison-result");
        if (result) {
            result.innerHTML = "";
            setHidden(result, true);
        }
        clearFieldError("compare-a");
        clearFieldError("compare-b");
    }

    function renderPassport(loaded) {
        var view = passportViewState(loaded);
        savedEntries = view.entries.slice();
        storageBlocked = view.storageBlocked;
        renderCorruption(loaded);
        renderHistoricalNotice(view.historicalEntryCount);
        setHidden(byId("passport-empty"), !view.isEmpty);
        setHidden(byId("passport-content"), savedEntries.length === 0);
        setHidden(byId("first-observation-note"), savedEntries.length !== 1);
        setHidden(byId("comparison-section"), savedEntries.length < 2);
        byId("clear-passport").disabled = storageBlocked || savedEntries.length === 0;
        renderHistory();
        renderComparisonSelectors();
        invalidateComparison();
        updateSaveButton();
    }

    function handleStorageFailure(result) {
        if (["corrupt_data", "partial_corruption", "storage_unavailable"].indexOf(result.status) !== -1) {
            renderPassport(result);
        }
    }

    function findEntry(recordId) {
        return savedEntries.filter(function same(entry) { return entry.recordId === recordId; })[0] || null;
    }

    function handleHistoryClick(event) {
        var button = event.target.closest("button[data-action]");
        var entry;
        if (!button) return;
        entry = findEntry(button.getAttribute("data-record-id"));
        if (!entry) return;
        if (button.getAttribute("data-action") === "open") {
            renderSavedEntry(entry);
        } else {
            requestConfirmation("remove", entry.recordId, button,
                "Eliminar " + presentationLabel(entry) + " · " + entryLabel(entry),
                "Esta acción elimina únicamente este registro local y no puede deshacerse.",
                "Eliminar este registro");
        }
    }

    function requestConfirmation(kind, recordId, trigger, title, text, confirmLabel) {
        var panel = byId("confirmation-panel");
        pendingAction = { kind: kind, recordId: recordId, trigger: trigger };
        setText("confirmation-title", title);
        setText("confirmation-text", text);
        setText("confirmation-accept", confirmLabel);
        setHidden(panel, false);
        if (typeof panel.showModal === "function") {
            if (!panel.open) panel.showModal();
        } else {
            panel.setAttribute("open", "");
        }
        focusElement(byId("confirmation-cancel"));
    }

    function closeConfirmationPanel() {
        var panel = byId("confirmation-panel");
        if (!panel) return;
        if (typeof panel.close === "function" && panel.open) panel.close();
        else panel.removeAttribute("open");
        setHidden(panel, true);
    }

    function modalIsOpen() {
        var panel = byId("confirmation-panel");
        return Boolean(pendingAction && panel && !panel.hidden &&
            (panel.open || panel.getAttribute("open") !== null));
    }

    function keepModalFocus(event) {
        var panel = byId("confirmation-panel");
        if (modalIsOpen() && event.target && !panel.contains(event.target)) {
            focusElement(byId("confirmation-cancel"));
        }
    }

    function blockOutsideModalInteraction(event) {
        var panel = byId("confirmation-panel");
        if (modalIsOpen() && event.target && !panel.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }
            focusElement(byId("confirmation-cancel"));
        }
    }

    function handleDocumentModalKeydown(event) {
        if (modalIsOpen() && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelConfirmation();
        }
    }

    function handleConfirmationKeydown(event) {
        var panel = byId("confirmation-panel");
        var focusable;
        var first;
        var last;
        if (event.key === "Escape") {
            event.preventDefault();
            cancelConfirmation();
            return;
        }
        if (event.key !== "Tab" || !panel) return;
        focusable = panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) {
            event.preventDefault();
            panel.focus();
            return;
        }
        first = focusable[0];
        last = focusable[focusable.length - 1];
        if (event.shiftKey && root.document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && root.document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function cancelConfirmation() {
        var trigger = pendingAction && pendingAction.trigger;
        pendingAction = null;
        closeConfirmationPanel();
        focusElement(trigger);
    }

    function finishMutation(result, message) {
        if (!result.ok) {
            handleStorageFailure(result);
            setText("passport-status", "No se ha modificado el historial.");
            focusElement(byId("passport-status"));
            return;
        }
        renderPassport(result.status === "cleared" || result.status === "corrupt_data_discarded"
            ? { ok: true, status: "empty", entries: [] } : result);
        setText("passport-status", message);
        focusElement(savedEntries.length === 0 ? byId("passport-empty") : byId("passport-title"));
    }

    function acceptConfirmation() {
        var action = pendingAction;
        var result;
        pendingAction = null;
        closeConfirmationPanel();
        if (!action) return;
        if (action.kind === "remove") {
            result = store.remove(action.recordId);
            finishMutation(result, "Ecografía eliminada del almacenamiento local.");
        } else if (action.kind === "clear") {
            result = store.clear();
            finishMutation(result, "Historial local eliminado.");
        } else if (action.kind === "recover") {
            result = store.recoverValidEntries();
            finishMutation(result, "Registros válidos recuperados. Los registros corruptos se descartaron tras tu confirmación.");
        } else if (action.kind === "discard") {
            result = store.discardCorruptData();
            finishMutation(result, "Almacenamiento corrupto descartado. El Pasaporte está vacío.");
        }
    }

    function comparisonRecordHtml(title, record) {
        return [
            '<article class="comparison-record"><h5>' + escapeHtml(title) + '</h5><dl>',
            '<div><dt>Edad gestacional</dt><dd>' + escapeHtml(formatGestationalAge(record.gestationalAge)) + '</dd></div>',
            '<div><dt>PFE</dt><dd>' + escapeHtml(formatGrams(record.efwGrams)) + ' g</dd></div>',
            '<div><dt>Percentil</dt><dd>' +
                (isFiniteNumber(record.percentile) ? escapeHtml(formatPercentile(record.percentile)) : "No disponible") + '</dd></div>',
            '<div><dt>Método/procedencia</dt><dd>' + escapeHtml(describeMethod(record.efwSource, record.efwMethod)) + '</dd></div>',
            '</dl></article>'
        ].join("");
    }

    function unknownLabel(value) {
        var labels = {
            "recordA.scanDate": "Fecha de la ecografía A", "recordB.scanDate": "Fecha de la ecografía B",
            "recordA.reference": "Referencia de la ecografía A", "recordB.reference": "Referencia de la ecografía B",
            "recordA.zScore": "Z-score de la ecografía A", "recordB.zScore": "Z-score de la ecografía B",
            "recordA.percentile": "Percentil de la ecografía A", "recordB.percentile": "Percentil de la ecografía B",
            "recordA.efwMethod": "Método del PFE de la ecografía A", "recordB.efwMethod": "Método del PFE de la ecografía B",
            "recordA.biometrics": "Biometrías de la ecografía A", "recordB.biometrics": "Biometrías de la ecografía B",
            "recordA.biometrics.hcCm": "Circunferencia cefálica de la ecografía A",
            "recordB.biometrics.hcCm": "Circunferencia cefálica de la ecografía B",
            "recordA.biometrics.acCm": "Circunferencia abdominal de la ecografía A",
            "recordB.biometrics.acCm": "Circunferencia abdominal de la ecografía B",
            "recordA.biometrics.flCm": "Longitud del fémur de la ecografía A",
            "recordB.biometrics.flCm": "Longitud del fémur de la ecografía B"
        };
        return labels[value] || value.replace(/recordA/g, "Ecografía A").replace(/recordB/g, "Ecografía B");
    }

    function renderComparison(comparison) {
        var output = byId("comparison-result");
        var summary = comparisonSummary(comparison);
        var differences = [
            "Edad gestacional: " + formatGestationalAge(comparison.recordA.gestationalAge) + " → " +
                formatGestationalAge(comparison.recordB.gestationalAge) + " (diferencia " +
                signedNumber(summary.gestationalAgeDifferenceDays, 0) + " días)",
            "PFE: " + formatGrams(comparison.recordA.efwGrams) + " g → " +
                formatGrams(comparison.recordB.efwGrams) + " g (diferencia " +
                signedNumber(summary.efwDifferenceGrams, 0) + " g)"
        ];
        var compatibility = [];
        if (isFiniteNumber(summary.percentileDifference)) {
            differences.push("Percentil: " + formatPercentile(comparison.recordA.percentile) + " → " +
                formatPercentile(comparison.recordB.percentile) + " (diferencia " +
                signedNumber(summary.percentileDifference, 1) + ")");
        }
        if (isFiniteNumber(summary.scanIntervalDays)) {
            differences.push("Intervalo entre las fechas aportadas: " + signedNumber(summary.scanIntervalDays, 0) +
                " días" + (summary.scanIntervalDays < 0 ? "; la ecografía B tiene una fecha anterior a A" : ""));
        }
        if (summary.reference === "different") {
            compatibility.push("Las observaciones utilizan una referencia o versión de referencia diferente.");
        } else if (summary.reference !== "same") {
            compatibility.push("La referencia o su versión no consta en al menos una observación.");
        }
        if (summary.method === "different") {
            compatibility.push("Las observaciones declaran métodos de PFE diferentes.");
        } else if (summary.method !== "same") {
            compatibility.push("El método del PFE es desconocido en al menos una observación.");
        }
        if (summary.scienceVersion !== "same") compatibility.push("Las versiones científicas son diferentes.");
        if (summary.schemaVersion !== "same") compatibility.push("Las versiones del esquema son diferentes.");
        output.innerHTML = [
            '<div class="comparison-pair">', comparisonRecordHtml("Ecografía A", comparison.recordA),
            comparisonRecordHtml("Ecografía B", comparison.recordB), '</div>',
            '<section class="comparison-verdict"><h5>' +
                (summary.homogeneous ? "Comparación homogénea" : "Comparación no homogénea") + '</h5><p>' +
                (summary.homogeneous
                    ? "Ambos registros superaron la validación de integridad y comparten referencia, versiones y método compatible."
                    : "Las cifras se conservan como observaciones separadas; no se intenta corregir ni hacer equivalentes los registros.") +
                '</p></section>',
            '<section><h5>Diferencias descriptivas</h5><ul>' + differences.map(function item(value) {
                return '<li>' + escapeHtml(value) + '</li>';
            }).join("") + '</ul></section>',
            compatibility.length > 0 ? '<section><h5>Incompatibilidades</h5><ul>' + compatibility.map(function item(value) {
                return '<li>' + escapeHtml(value) + '</li>';
            }).join("") + '</ul></section>' : "",
            summary.unknownData.length > 0 ? '<section><h5>Datos desconocidos</h5><ul>' +
                summary.unknownData.map(function item(value) { return '<li>' + escapeHtml(unknownLabel(value)) + '</li>'; }).join("") +
                '</ul></section>' : "",
            '<p class="comparison-caution">Descripción matemática únicamente: no calcula velocidad, no atribuye causas, no realiza valoración clínica y no predice mediciones futuras.</p>'
        ].join("");
        setHidden(output, false);
        focusElement(output);
    }

    function compareSelectedEntries() {
        var firstId = byId("compare-a").value;
        var secondId = byId("compare-b").value;
        var first;
        var second;
        var comparison;
        clearFieldError("compare-a");
        clearFieldError("compare-b");
        if (!firstId || !secondId) {
            setFieldError(!firstId ? "compare-a" : "compare-b", "Selecciona dos ecografías para comparar.");
            focusElement(byId(!firstId ? "compare-a" : "compare-b"));
            return;
        }
        if (firstId === secondId) {
            setFieldError("compare-b", "Selecciona una ecografía diferente en cada posición.");
            focusElement(byId("compare-b"));
            return;
        }
        first = findEntry(firstId);
        second = findEntry(secondId);
        if (!first || !second) return;
        try {
            comparison = records.compareFetalPassportEntries(first, second);
        } catch (error) {
            byId("comparison-result").innerHTML =
                "<strong>No se puede comparar.</strong><p>Uno de los registros no supera la validación de integridad. No se ha reparado ni reinterpretado.</p>";
            setHidden(byId("comparison-result"), false);
            focusElement(byId("comparison-result"));
            return;
        }
        renderComparison(comparison);
    }

    function initialize() {
        var form;
        var loaded;
        if (initialized || !root.document) return;
        initialized = true;
        store = storageModule.createStore();
        form = byId("fetal-form");
        form.addEventListener("input", function clearEditedError(event) {
            if (event.target && event.target.id) {
                clearFieldError(event.target);
                invalidateCurrentResult();
            }
        });
        form.addEventListener("change", function handleChoice(event) {
            if (event.target && event.target.id) {
                clearFieldError(event.target);
                invalidateCurrentResult();
            }
            if (event.target.name === "input-mode") updateModePanels();
            if (event.target.name === "pregnancy-population") {
                clearFieldError("population-singleton");
                clearFieldError("population-multiple");
                clearFieldError("population-unknown");
            }
            if (event.target.id === "biometric-unit") updateBiometricUnits();
        });
        form.addEventListener("keydown", handleCalculatorKeydown);
        byId("calculate-observation").addEventListener("click", handleCalculation);
        byId("reset-tool").addEventListener("click", resetForm);
        byId("save-observation").addEventListener("click", saveCurrentObservation);
        byId("passport-list").addEventListener("click", handleHistoryClick);
        byId("compare-records").addEventListener("click", compareSelectedEntries);
        byId("clear-passport").addEventListener("click", function requestClear() {
            requestConfirmation("clear", null, byId("clear-passport"), "Eliminar todo el Pasaporte local",
                "Se eliminarán todas las ecografías guardadas en este navegador. Esta acción no puede deshacerse.",
                "Eliminar todo el historial");
        });
        byId("recover-valid-records").addEventListener("click", function requestRecovery() {
            requestConfirmation("recover", null, byId("recover-valid-records"), "Recuperar únicamente los registros válidos",
                "Los registros que no superan la validación se descartarán. Los registros válidos aislados se conservarán.",
                "Recuperar registros válidos");
        });
        byId("discard-corrupt-storage").addEventListener("click", function requestDiscard() {
            requestConfirmation("discard", null, byId("discard-corrupt-storage"), "Descartar almacenamiento corrupto",
                "Se eliminará el contenido local ilegible o no válido para empezar con un Pasaporte vacío.",
                "Descartar almacenamiento");
        });
        byId("confirmation-accept").addEventListener("click", acceptConfirmation);
        byId("confirmation-cancel").addEventListener("click", cancelConfirmation);
        byId("confirmation-panel").addEventListener("keydown", handleConfirmationKeydown);
        byId("confirmation-panel").addEventListener("cancel", function preventNativeCancel(event) {
            event.preventDefault();
            cancelConfirmation();
        });
        root.document.addEventListener("focusin", keepModalFocus, true);
        root.document.addEventListener("click", blockOutsideModalInteraction, true);
        root.document.addEventListener("keydown", handleDocumentModalKeydown, true);
        byId("compare-a").addEventListener("change", invalidateComparison);
        byId("compare-b").addEventListener("change", invalidateComparison);
        updateModePanels();
        updateBiometricUnits();
        loaded = store.list();
        renderPassport(loaded);
    }

    root.ImoancyFetalWeightUI = Object.freeze({
        evaluateInput: evaluateInput,
        buildPassportEntry: buildPassportEntry,
        createLocalRecordMetadata: createLocalRecordMetadata,
        convertBiometricsToMillimeters: convertBiometricsToMillimeters,
        buildPresentationIdentities: buildPresentationIdentities,
        passportViewState: passportViewState,
        describeMethod: describeMethod,
        comparisonSummary: comparisonSummary,
        formatGestationalAge: formatGestationalAge,
        formatGrams: formatGrams,
        formatKilograms: formatKilograms,
        initialize: initialize
    });

    if (root.document) {
        if (root.document.readyState === "loading") {
            root.document.addEventListener("DOMContentLoaded", initialize, { once: true });
        } else {
            initialize();
        }
    }
}(typeof globalThis !== "undefined" ? globalThis : this));
