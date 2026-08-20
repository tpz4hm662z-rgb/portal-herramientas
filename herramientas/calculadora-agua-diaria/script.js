(function exposeWaterProController(root) {
    "use strict";

    var science = root.ImoancyWaterScience;
    var safety = root.ImoancyWaterSafety;
    var passportStorage = root.ImoancyWaterPassportStorage;
    var GROUP_LABELS = Object.freeze({
        adult_female: "Mujer adulta",
        adult_male: "Hombre adulto",
        pregnancy: "Embarazo",
        lactation: "Lactancia"
    });
    var CONTEXT_LABELS = Object.freeze({
        activity: "Actividad",
        durationMinutes: "Duración",
        temperatureC: "Temperatura",
        humidityPercent: "Humedad",
        indoorOutdoor: "Entorno",
        perceivedIntensity: "Intensidad percibida",
        equipmentOrClothing: "Ropa o equipamiento"
    });
    var INTENSITY_LABELS = Object.freeze({
        easy: "Suave",
        medium: "Media",
        hard: "Alta"
    });
    var initialized = false;
    var store = null;
    var savedEntries = [];
    var currentSession = null;

    if (!science || !safety || !passportStorage) {
        throw new Error("Water science, safety and passport storage must load before the UI controller.");
    }

    function byId(id) {
        return root.document && root.document.getElementById
            ? root.document.getElementById(id)
            : null;
    }

    function setHidden(element, hidden) {
        if (!element) return;
        element.hidden = hidden;
        if (element.style) element.style.display = hidden ? "none" : "block";
    }

    function focusElement(element) {
        if (element && typeof element.focus === "function") {
            element.focus();
        }
    }

    function escapeHtml(value) {
        return String(value === null || typeof value === "undefined" ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatNumber(value, digits) {
        return value.toLocaleString("es-ES", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        });
    }

    function convertVolumeToLiters(value, unit) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
            return null;
        }
        if (unit === "ml") return value / 1000;
        if (unit === "L") return value;
        return null;
    }

    function buildSafetyProfile(values) {
        var stage = values.lifeStage;
        return {
            ageYears: values.ageYears,
            isPregnant: stage === "pregnancy" || stage === "both",
            isLactating: stage === "lactation" || stage === "both",
            hasKnownKidneyDisease: values.hasKnownKidneyDisease === true,
            hasHeartFailureOrFluidRestrictionCondition: values.hasHeartFailureOrFluidRestrictionCondition === true,
            hasMedicalFluidRestriction: values.hasMedicalFluidRestriction === true,
            hasRelevantAcuteIllness: values.hasRelevantAcuteIllness === true,
            seeksTherapeuticRecommendation: values.seeksTherapeuticRecommendation === true
        };
    }

    function resolveReference(profile, selectedGroup) {
        var decision = safety.screenHydrationContext(profile);
        var group = null;

        if (!decision.canShowPopulationReference) {
            return { decision: decision, reference: null, group: null };
        }

        if (decision.allowedPopulationReferenceKeys.length === 1) {
            group = decision.allowedPopulationReferenceKeys[0];
        } else if (decision.allowedPopulationReferenceKeys.indexOf(selectedGroup) >= 0) {
            group = selectedGroup;
        }

        return {
            decision: decision,
            reference: group ? science.getEfsaTotalWaterReference(group) : null,
            group: group
        };
    }

    function buildSessionPayload(values) {
        var fluidLiters = convertVolumeToLiters(values.fluidIntakeMl, "ml");
        var urineLiters = convertVolumeToLiters(values.urineMl, "ml");

        if ([values.preWeightKg, values.postWeightKg, values.durationMinutes, fluidLiters, urineLiters]
            .some(function invalid(value) { return typeof value !== "number" || !Number.isFinite(value); })) {
            return null;
        }

        return {
            inputs: {
                preWeightKg: values.preWeightKg,
                postWeightKg: values.postWeightKg,
                fluidIntakeLiters: fluidLiters,
                durationMinutes: values.durationMinutes,
                urineLiters: urineLiters
            },
            context: {
                activity: values.activity,
                durationMinutes: values.durationMinutes,
                temperatureC: values.temperatureC,
                humidityPercent: values.humidityPercent,
                indoorOutdoor: values.indoorOutdoor,
                perceivedIntensity: values.perceivedIntensity,
                equipmentOrClothing: values.equipmentOrClothing,
                notes: values.notes,
                sessionDate: values.sessionDate
            }
        };
    }

    function showMessage(element, html, className) {
        if (!element) return;
        element.className = className || "inline-message";
        element.innerHTML = html;
        setHidden(element, false);
    }

    function clearMessage(element) {
        if (!element) return;
        element.innerHTML = "";
        setHidden(element, true);
    }

    function renderReferenceHtml(reference) {
        var liters = formatNumber(reference.totalWaterLitersPerDay, 1);
        return [
            '<div class="result-header"><div>',
            '<p class="result-kicker">Referencia poblacional EFSA</p>',
            '<h3>' + escapeHtml(GROUP_LABELS[reference.group]) + '</h3>',
            '<p class="result-value">' + liters + ' <span class="result-unit">L/día</span></p>',
            '<p>Referencia de agua total en las condiciones indicadas.</p>',
            '</div></div>',
            '<ul class="result-semantics">',
            '<li>Incluye conjuntamente el agua de las bebidas y de los alimentos.</li>',
            '<li>No representa ' + liters + ' L de agua pura ni una necesidad individual exacta.</li>',
            '<li>Corresponde a temperatura ambiental moderada y actividad física moderada (PAL 1,6).</li>',
            '<li>No incorpora automáticamente pérdidas particulares por ejercicio, sudoración elevada o ambientes exigentes.</li>',
            '</ul>',
            '<p class="quality-note">Esta referencia permanece separada de cualquier medición de una sesión de sudoración.</p>'
        ].join("");
    }

    function renderBlockedReference(decision) {
        if (decision.status === "medical_referral") {
            return '<h3>Conviene utilizar orientación profesional</h3>' +
                '<p>Una referencia general puede no ser apropiada en este contexto. Sigue la indicación profesional que hayas recibido o consulta con un profesional sanitario.</p>' +
                '<p>No se ha generado una cifra alternativa.</p>';
        }
        if (decision.status === "unsupported_population") {
            return '<h3>Esta versión está dirigida a personas adultas</h3>' +
                '<p>Agua Diaria PRO v1 no implementa referencias para menores de 18 años. Esto es una decisión de alcance, no significa que EFSA carezca de referencias para esas edades.</p>';
        }
        if (decision.status === "clarification_required") {
            return '<h3>Necesitamos una etapa de referencia única</h3>' +
                '<p>Embarazo y lactancia tienen referencias diferentes. Revisa la selección antes de continuar; no se combinan ambas cifras.</p>';
        }
        return '<h3>No se puede mostrar todavía la referencia</h3><p>Revisa los datos indicados.</p>';
    }

    function describedByFor(id) {
        if (id === "reference-age") return "reference-age-help";
        if (id === "grupo-referencia") return "reference-group-help";
        return "";
    }

    function fieldErrorIdFor(id) {
        if (id === "grupo-referencia") return "reference-group-error";
        if (id.indexOf("safety-") === 0 && id !== "safety-context") return "safety-details-error";
        return id + "-error";
    }

    function clearFieldError(id, errorId) {
        var element = byId(id);
        var error = byId(errorId || fieldErrorIdFor(id));
        var description = describedByFor(id);

        if (element && element.removeAttribute) {
            element.removeAttribute("aria-invalid");
            if (description) element.setAttribute("aria-describedby", description);
            else element.removeAttribute("aria-describedby");
        }
        if (error) {
            error.textContent = "";
            setHidden(error, true);
        }
    }

    function setFieldError(id, message, errorId) {
        var element = byId(id);
        var resolvedErrorId = errorId || fieldErrorIdFor(id);
        var error = byId(resolvedErrorId);
        var description = describedByFor(id);

        if (element && element.setAttribute) {
            element.setAttribute("aria-invalid", "true");
            element.setAttribute("aria-describedby",
                (description ? description + " " : "") + resolvedErrorId);
        }
        if (error) {
            error.textContent = message;
            setHidden(error, false);
        }
    }

    function clearFormFieldErrors(form) {
        if (!form || !form.querySelectorAll) return;
        form.querySelectorAll('[aria-invalid="true"]').forEach(function clearInvalid(element) {
            clearFieldError(element.id);
        });
        form.querySelectorAll(".field-error").forEach(function clearError(error) {
            error.textContent = "";
            setHidden(error, true);
        });
    }

    function focusFirstInvalid(form) {
        var first = form && form.querySelector ? form.querySelector('[aria-invalid="true"]') : null;
        focusElement(first);
    }

    function convertDurationToMinutes(value, unit) {
        if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
        if (unit === "minutes") return value;
        if (unit === "hours") return value * 60;
        return null;
    }

    function numericField(id, label, options, errors) {
        var element = byId(id);
        var raw = element ? String(element.value).trim() : "";
        var value;
        var settings = options || {};

        if (raw === "") {
            if (settings.optional) {
                clearFieldError(id);
                return settings.defaultValue;
            }
            errors.push(label + ": introduce un valor.");
            setFieldError(id, "Introduce un valor.");
            return null;
        }

        value = Number(raw);
        if (!Number.isFinite(value) ||
            (typeof settings.minimum === "number" && value < settings.minimum) ||
            (settings.positive && value <= 0) ||
            (typeof settings.maximum === "number" && value > settings.maximum)) {
            errors.push(label + ": revisa el valor introducido.");
            setFieldError(id, "Revisa el valor introducido.");
            return null;
        }

        clearFieldError(id);
        return value;
    }

    function optionalNumber(id, label, limits, errors) {
        return numericField(id, label, {
            optional: true,
            defaultValue: null,
            minimum: limits && limits.minimum,
            maximum: limits && limits.maximum
        }, errors);
    }

    function errorList(errors) {
        return '<p><strong>Revisa estos datos:</strong></p><ul>' + errors.map(function item(error) {
            return '<li>' + escapeHtml(error) + '</li>';
        }).join("") + '</ul>';
    }

    function handleReferenceSubmit(event) {
        var errors = [];
        var age;
        var group;
        var stage;
        var safetyChoice;
        var medicalEnabled;
        var profile;
        var resolved;
        var errorBox = byId("reference-errors");
        var output = byId("resultado");

        if (event && event.preventDefault) event.preventDefault();
        clearMessage(errorBox);
        clearMessage(output);
        clearFormFieldErrors(byId("reference-form"));

        age = numericField("reference-age", "Edad", { minimum: 0 }, errors);
        group = byId("grupo-referencia") ? byId("grupo-referencia").value : "";
        stage = byId("life-stage") ? byId("life-stage").value : "";
        safetyChoice = byId("safety-context") ? byId("safety-context").value : "";
        medicalEnabled = safetyChoice === "yes";

        if (["none", "pregnancy", "lactation", "both"].indexOf(stage) < 0) {
            errors.push("Etapa actual: selecciona una opción.");
            setFieldError("life-stage", "Selecciona una opción.");
        }
        if (["no", "yes"].indexOf(safetyChoice) < 0) {
            errors.push("Circunstancias de especial prudencia: selecciona una respuesta.");
            setFieldError("safety-context", "Selecciona una respuesta.");
        }

        if (medicalEnabled && ![
            "safety-kidney", "safety-heart", "safety-restriction", "safety-acute", "safety-therapeutic"
        ].some(function selectedSafety(id) { return byId(id).checked; })) {
            errors.push("Marca al menos una circunstancia que requiera especial prudencia.");
            setFieldError("safety-kidney", "Marca al menos una circunstancia.", "safety-details-error");
        } else {
            clearFieldError("safety-kidney", "safety-details-error");
        }

        if (stage === "none" && !group) {
            errors.push("Selecciona el sexo utilizado por la referencia EFSA.");
            setFieldError("grupo-referencia", "Selecciona una opción.", "reference-group-error");
        } else {
            clearFieldError("grupo-referencia", "reference-group-error");
        }

        if (errors.length > 0) {
            showMessage(errorBox, errorList(errors), "inline-message error-message");
            focusFirstInvalid(byId("reference-form"));
            return;
        }

        profile = buildSafetyProfile({
            ageYears: age,
            lifeStage: stage,
            hasKnownKidneyDisease: medicalEnabled && byId("safety-kidney").checked,
            hasHeartFailureOrFluidRestrictionCondition: medicalEnabled && byId("safety-heart").checked,
            hasMedicalFluidRestriction: medicalEnabled && byId("safety-restriction").checked,
            hasRelevantAcuteIllness: medicalEnabled && byId("safety-acute").checked,
            seeksTherapeuticRecommendation: medicalEnabled && byId("safety-therapeutic").checked
        });
        resolved = resolveReference(profile, group);

        if (!resolved.reference) {
            showMessage(output, renderBlockedReference(resolved.decision),
                resolved.decision.status === "medical_referral"
                    ? "dynamic-result warning-message"
                    : "dynamic-result");
            focusElement(output);
            return;
        }

        showMessage(output, renderReferenceHtml(resolved.reference), "dynamic-result");
        focusElement(output);
    }

    function directReferenceFallback() {
        var group = byId("grupo-referencia");
        var output = byId("resultado");
        var reference = group ? science.getEfsaTotalWaterReference(group.value) : null;

        if (!output) return;
        if (!reference) {
            showMessage(output, "<p>Selecciona un grupo adulto para consultar la referencia poblacional.</p>", "dynamic-result");
            focusElement(output);
            return;
        }
        showMessage(output, renderReferenceHtml(reference), "dynamic-result");
        focusElement(output);
    }

    function readSessionValues() {
        var errors = [];
        var durationValue = numericField("duration-minutes", "Duración", { positive: true }, errors);
        var durationMinutes = convertDurationToMinutes(
            durationValue,
            byId("duration-unit") ? byId("duration-unit").value : "minutes"
        );
        var values = {
            preWeightKg: numericField("pre-weight", "Masa antes", { positive: true }, errors),
            postWeightKg: numericField("post-weight", "Masa después", { positive: true }, errors),
            fluidIntakeMl: numericField("fluid-intake", "Líquidos ingeridos", { minimum: 0 }, errors),
            durationMinutes: durationMinutes,
            urineMl: numericField("urine-volume", "Orina", { optional: true, defaultValue: 0, minimum: 0 }, errors),
            activity: byId("activity-context").value,
            temperatureC: optionalNumber("temperature-context", "Temperatura", null, errors),
            humidityPercent: optionalNumber("humidity-context", "Humedad", { minimum: 0, maximum: 100 }, errors),
            indoorOutdoor: byId("environment-context").value,
            perceivedIntensity: byId("intensity-context").value,
            equipmentOrClothing: byId("equipment-context").value,
            notes: byId("notes-context").value,
            sessionDate: byId("session-date").value
        };

        return { values: values, errors: errors };
    }

    function calculationErrors(calculation) {
        var labels = {
            negative_observed_sweat_loss: "El balance produce una pérdida negativa. Revisa las medidas y los volúmenes.",
            non_finite_calculation: "No ha sido posible obtener un resultado finito.",
            post_weight_above_pre_weight: "La masa posterior es mayor que la anterior; el resultado se conserva con una advertencia."
        };
        return calculation.errors.map(function mapIssue(issue) {
            return labels[issue.code] || "Revisa " + issue.field + ".";
        });
    }

    function contextSummary(context) {
        var items = [];
        if (context.sessionDate) items.push("Fecha: " + escapeHtml(context.sessionDate));
        if (context.activity) items.push("Actividad: " + escapeHtml(context.activity));
        if (context.temperatureC !== null) items.push("Temperatura: " + formatNumber(context.temperatureC, 1) + " °C");
        if (context.humidityPercent !== null) items.push("Humedad: " + formatNumber(context.humidityPercent, 0) + " %");
        if (context.indoorOutdoor) items.push("Entorno: " + escapeHtml(context.indoorOutdoor === "indoor" ? "Interior" : "Exterior"));
        if (context.perceivedIntensity) items.push("Intensidad: " + escapeHtml(INTENSITY_LABELS[context.perceivedIntensity] || context.perceivedIntensity));
        if (context.equipmentOrClothing) items.push("Ropa/equipamiento: " + escapeHtml(context.equipmentOrClothing));
        return items.length > 0
            ? '<div class="passport-meta">' + items.map(function item(value) { return "<span>" + value + "</span>"; }).join("") + "</div>"
            : '<p class="field-help">No se añadió contexto opcional.</p>';
    }

    function renderSessionResult(calculation, context) {
        var warning = calculation.warnings.length > 0
            ? '<p class="quality-note">La masa posterior registrada es mayor que la anterior. Comprueba las medidas; la observación se muestra sin interpretarla como diagnóstico.</p>'
            : "";
        return [
            '<p class="result-kicker">Estimación observada durante esta sesión</p>',
            '<h3>Tasa de sudoración observada</h3>',
            '<p class="result-value">' + formatNumber(calculation.computed.sweatRateLitersPerHour, 2) + ' <span class="result-unit">L/h</span></p>',
            '<p>No indica cuánto debes beber por hora y no se suma a la referencia EFSA.</p>',
            '<div class="metric-grid">',
            '<div class="metric-card"><span>Pérdida estimada de la sesión</span><strong>' + formatNumber(calculation.computed.sweatLossLiters, 2) + ' L</strong></div>',
            '<div class="metric-card"><span>Cambio de masa corporal</span><strong>' + formatNumber(calculation.computed.bodyMassChangePercent, 2) + ' %</strong></div>',
            '<div class="metric-card"><span>Duración</span><strong>' + formatNumber(calculation.inputs.durationMinutes, calculation.inputs.durationMinutes % 1 === 0 ? 0 : 2) + ' min</strong></div>',
            '</div>',
            contextSummary(context),
            warning,
            '<details class="calculation-details"><summary>¿Cómo se ha calculado?</summary><p>Se estima el cambio de masa + la bebida ingerida − la orina registrada. Después, el resultado se divide por la duración en horas.</p></details>',
            '<p class="save-explanation"><strong>Al guardar:</strong> conservas en este navegador la medición, la tasa observada, el contexto registrado y, cuando existan, fecha y notas. Servirá para comparar futuras mediciones en contextos parecidos. No se envía ni se convierte en una recomendación.</p>',
            '<div class="form-actions"><button id="save-session" class="button button-primary" type="button">Guardar en mi Pasaporte</button></div>'
        ].join("");
    }

    function handleSessionSubmit(event) {
        var read;
        var payload;
        var calculation;
        var context;
        var errorsBox = byId("session-errors");
        var output = byId("session-result");

        if (event && event.preventDefault) event.preventDefault();
        clearMessage(errorsBox);
        clearMessage(output);
        clearFormFieldErrors(byId("sweat-form"));
        currentSession = null;

        read = readSessionValues();
        if (read.errors.length > 0) {
            showMessage(errorsBox, errorList(read.errors), "inline-message error-message");
            focusFirstInvalid(byId("sweat-form"));
            return;
        }

        payload = buildSessionPayload(read.values);
        calculation = payload ? science.calculateObservedSweatSession(payload.inputs) : null;
        if (!calculation || calculation.status === "error") {
            showMessage(errorsBox, errorList(calculation ? calculationErrors(calculation) : ["No se pudieron transformar los datos de la sesión."]), "inline-message error-message");
            focusElement(errorsBox);
            return;
        }

        context = science.normalizeSessionContext(payload.context);
        currentSession = { inputs: payload.inputs, context: context, calculation: calculation };
        showMessage(output, renderSessionResult(calculation, context), "dynamic-result");
        byId("save-session").addEventListener("click", saveCurrentSession);
        focusElement(output);
    }

    function createEntryId() {
        if (root.crypto && typeof root.crypto.randomUUID === "function") {
            return root.crypto.randomUUID();
        }
        return "session-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    function saveCurrentSession() {
        var entry;
        var saveResult;
        var status = byId("storage-status");

        if (!currentSession || !store) return;
        entry = science.buildSweatPassportEntry({
            id: createEntryId(),
            createdAt: new Date().toISOString(),
            sessionDate: currentSession.context.sessionDate,
            inputs: currentSession.inputs,
            context: currentSession.context
        });
        saveResult = store.save(entry);

        if (!saveResult.ok) {
            showStorageProblem(saveResult);
            return;
        }

        var wasFirstEntry = savedEntries.length === 0;
        savedEntries = saveResult.entries;
        if (byId("save-session")) {
            byId("save-session").disabled = true;
            byId("save-session").textContent = "Sesión guardada";
        }
        showMessage(status, wasFirstEntry
            ? "<p><strong>Primera medición guardada.</strong> Cuando registres otra sesión podrás comparar sus condiciones y tasas observadas. Añadir actividad y condiciones hará la comparación más informativa. Se conserva únicamente en este navegador.</p>"
            : "<p>Sesión guardada únicamente en este navegador. Ya puedes compararla con otra medición.</p>",
        "inline-message success-message");
        renderPassport();
        focusElement(status);
    }

    function formatEntryDateTime(entry) {
        var created = new Date(entry.createdAt);
        var validCreated = !Number.isNaN(created.getTime());
        var date = entry.sessionDate || (validCreated
            ? created.toLocaleDateString("es-ES")
            : entry.createdAt.slice(0, 10));
        var time = validCreated
            ? created.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
            : entry.createdAt.slice(11, 16);
        return date + (time ? " " + time : "");
    }

    function entryTitle(entry) {
        return entry.context.activity || "Sesión sin actividad indicada";
    }

    function entryDescriptor(entry, index) {
        return "Sesión " + String(index + 1) + " · " + formatEntryDateTime(entry) + " · " + entryTitle(entry);
    }

    function renderEntryDetails(entry) {
        var context = entry.context;
        var rows = [
            "Registro local: " + formatEntryDateTime(entry),
            "Masa antes: " + formatNumber(entry.inputs.preWeightKg, 2) + " kg",
            "Masa después: " + formatNumber(entry.inputs.postWeightKg, 2) + " kg",
            "Líquidos durante la sesión: " + formatNumber(entry.inputs.fluidIntakeLiters, 3) + " L",
            "Orina durante la sesión: " + formatNumber(entry.inputs.urineLiters, 3) + " L",
            "Duración: " + formatNumber(entry.inputs.durationMinutes, entry.inputs.durationMinutes % 1 === 0 ? 0 : 2) + " min",
            "Tasa de sudoración observada: " + formatNumber(entry.computed.sweatRateLitersPerHour, 2) + " L/h",
            "Pérdida estimada: " + formatNumber(entry.computed.sweatLossLiters, 2) + " L",
            "Cambio de masa: " + formatNumber(entry.computed.bodyMassChangePercent, 2) + " %",
            context.sessionDate ? "Fecha indicada: " + context.sessionDate : null,
            context.activity ? "Actividad: " + context.activity : null,
            context.temperatureC === null ? null : "Temperatura: " + formatNumber(context.temperatureC, 1) + " °C",
            context.humidityPercent === null ? null : "Humedad: " + formatNumber(context.humidityPercent, 0) + " %",
            context.indoorOutdoor ? "Entorno: " + (context.indoorOutdoor === "indoor" ? "Interior" : "Exterior") : null,
            context.perceivedIntensity ? "Intensidad: " + (INTENSITY_LABELS[context.perceivedIntensity] || context.perceivedIntensity) : null,
            context.equipmentOrClothing ? "Ropa/equipamiento: " + context.equipmentOrClothing : null,
            context.notes ? "Notas: " + context.notes : null
        ].filter(function present(value) { return value !== null; });

        return '<ul class="detail-list">' + rows.map(function row(value) {
            return "<li>" + escapeHtml(value) + "</li>";
        }).join("") + '</ul><p class="local-detail-note">Estos datos permanecen en el almacenamiento local de este navegador hasta que elimines la sesión o borres sus datos.</p>';
    }

    function entryCard(entry, index) {
        var descriptor = entryDescriptor(entry, index);
        var meta = [
            escapeHtml(formatEntryDateTime(entry)),
            formatNumber(entry.inputs.durationMinutes, entry.inputs.durationMinutes % 1 === 0 ? 0 : 2) + " min"
        ];
        if (entry.context.perceivedIntensity) meta.push(escapeHtml(INTENSITY_LABELS[entry.context.perceivedIntensity] || entry.context.perceivedIntensity));
        if (entry.context.temperatureC !== null) meta.push(formatNumber(entry.context.temperatureC, 1) + " °C");

        return [
            '<article class="passport-card" tabindex="-1" data-entry-id="' + escapeHtml(entry.id) + '" aria-label="' + escapeHtml(descriptor) + '">',
            '<div class="passport-card-header"><div><h4>' + escapeHtml(descriptor) + '</h4><div class="passport-meta">',
            meta.map(function chip(value) { return "<span>" + value + "</span>"; }).join(""),
            '</div></div><div class="passport-rate">' + formatNumber(entry.computed.sweatRateLitersPerHour, 2) + ' L/h</div></div>',
            '<details><summary>Abrir detalles de ' + escapeHtml(descriptor) + '</summary>' + renderEntryDetails(entry) + '</details>',
            '<button class="button button-secondary button-small delete-session" type="button" data-delete-id="' + escapeHtml(entry.id) + '" aria-label="Eliminar ' + escapeHtml(descriptor) + '">Eliminar sesión</button>',
            '</article>'
        ].join("");
    }

    function comparisonOption(entry, index) {
        return '<option value="' + escapeHtml(entry.id) + '">' +
            escapeHtml(entryDescriptor(entry, index) + " · " + formatNumber(entry.computed.sweatRateLitersPerHour, 2) + " L/h") +
            "</option>";
    }

    function showStorageProblem(problem) {
        var box = byId("storage-status");
        var html;
        var status = typeof problem === "string" ? problem : problem.status;
        var count = problem && problem.invalidEntryCount;

        if (status === "partial_corruption") {
            html = '<p><strong>Se detectaron ' + escapeHtml(count) + ' sesiones locales dañadas.</strong> ' +
                'Las sesiones válidas se muestran, pero guardar y eliminar están bloqueados para no sobrescribir datos sin permiso.</p>' +
                '<button id="recover-valid-storage" class="button button-secondary button-small" type="button">Conservar solo las sesiones válidas</button> ' +
                '<button id="discard-corrupt-storage" class="button button-danger button-small" type="button">Eliminar todos los datos locales</button>';
        } else if (status === "corrupt_data") {
            html = '<p><strong>Los datos locales no se pueden leer.</strong> Guardar está bloqueado para evitar sobrescribirlos. No se han encontrado sesiones recuperables.</p>' +
                '<button id="discard-corrupt-storage" class="button button-danger button-small" type="button">Eliminar los datos dañados</button>';
        } else {
            html = '<p><strong>El almacenamiento local no está disponible.</strong> Puedes calcular la sesión, pero no guardarla en este dispositivo.</p>';
        }
        showMessage(box, html, "inline-message warning-message");

        if (status === "partial_corruption" && byId("recover-valid-storage")) {
            byId("recover-valid-storage").addEventListener("click", function recoverValid() {
                if (!root.confirm || !root.confirm("¿Conservar solo las sesiones válidas y descartar las dañadas? Esta acción no se puede deshacer.")) return;
                var recovered = store.recoverValidEntries();
                if (recovered.ok) {
                    savedEntries = recovered.entries;
                    showMessage(box, "<p>Se conservaron las sesiones válidas. Las entradas dañadas se descartaron con tu confirmación.</p>", "inline-message success-message");
                    renderPassport();
                    focusElement(box);
                } else {
                    showStorageProblem(recovered);
                }
            });
        }

        if ((status === "corrupt_data" || status === "partial_corruption") && byId("discard-corrupt-storage")) {
            byId("discard-corrupt-storage").addEventListener("click", function discardCorrupt() {
                if (!root.confirm || !root.confirm("¿Eliminar definitivamente todos los datos locales del Pasaporte? Esta acción no se puede deshacer.")) return;
                var cleared = store.clear();
                if (cleared.ok) {
                    savedEntries = [];
                    showMessage(box, "<p>Datos locales eliminados. El Pasaporte está vacío.</p>", "inline-message success-message");
                    renderPassport();
                    focusElement(box);
                } else {
                    showStorageProblem(cleared);
                }
            });
        }
    }

    function renderPassport() {
        var empty = byId("passport-empty");
        var content = byId("passport-content");
        var list = byId("passport-list");
        var left = byId("compare-left");
        var right = byId("compare-right");
        var compareButton = byId("compare-sessions");
        var options;

        if (!empty || !content || !list) return;
        clearMessage(byId("comparison-result"));
        setHidden(empty, savedEntries.length > 0);
        setHidden(content, savedEntries.length === 0);
        list.innerHTML = savedEntries.map(entryCard).join("");
        list.querySelectorAll(".delete-session").forEach(function bindDelete(button) {
            button.addEventListener("click", function removeEntry() {
                var card = button.closest ? button.closest(".passport-card") : null;
                var index = card ? Array.prototype.indexOf.call(list.children, card) : 0;
                var removed = store.remove(button.getAttribute("data-delete-id"));
                if (!removed.ok) {
                    showStorageProblem(removed);
                    return;
                }
                savedEntries = removed.entries;
                showMessage(byId("storage-status"), "<p>Sesión eliminada del dispositivo.</p>", "inline-message success-message");
                renderPassport();
                if (savedEntries.length > 0) {
                    focusElement(list.children[Math.min(index, savedEntries.length - 1)]);
                } else {
                    focusElement(empty);
                }
            });
        });

        options = savedEntries.map(comparisonOption).join("");
        left.innerHTML = options;
        right.innerHTML = options;
        if (savedEntries.length > 1) right.selectedIndex = 1;
        left.disabled = savedEntries.length < 2;
        right.disabled = savedEntries.length < 2;
        compareButton.disabled = savedEntries.length < 2;
    }

    function findEntry(id) {
        return savedEntries.filter(function match(entry) { return entry.id === id; })[0] || null;
    }

    function formatContextValue(field, value) {
        if (value === null || typeof value === "undefined" || value === "") return "sin indicar";
        if (field === "durationMinutes") return formatNumber(value, value % 1 === 0 ? 0 : 2) + " min";
        if (field === "temperatureC") return formatNumber(value, 1) + " °C";
        if (field === "humidityPercent") return formatNumber(value, 0) + " %";
        if (field === "indoorOutdoor") return value === "indoor" ? "Interior" : value === "outdoor" ? "Exterior" : String(value);
        if (field === "perceivedIntensity") return INTENSITY_LABELS[value] || String(value);
        return String(value);
    }

    function describeDimension(field, dimension) {
        var label = CONTEXT_LABELS[field];
        if (dimension.status === "different") {
            return label + ": " + formatContextValue(field, dimension.left) + " → " + formatContextValue(field, dimension.right);
        }
        if (dimension.status === "match") {
            return label + ": " + formatContextValue(field, dimension.left);
        }
        return label + ": falta en una o ambas sesiones";
    }

    function comparisonList(title, fields, comparison) {
        var values = fields.length > 0
            ? fields.map(function fieldItem(field) {
                return "<li>" + escapeHtml(describeDimension(field, comparison.dimensions[field])) + "</li>";
            }).join("")
            : "<li>Ninguno</li>";
        return '<div class="comparison-group"><h5>' + title + '</h5><ul>' + values + "</ul></div>";
    }

    function compareSelectedSessions() {
        var leftEntry = findEntry(byId("compare-left").value);
        var rightEntry = findEntry(byId("compare-right").value);
        var output = byId("comparison-result");
        var comparison;

        if (!leftEntry || !rightEntry || leftEntry.id === rightEntry.id) {
            showMessage(output, "<p>Selecciona dos sesiones distintas.</p>", "comparison-result error-message");
            focusElement(output);
            return;
        }

        comparison = science.compareSessionContexts(leftEntry.context, rightEntry.context);
        showMessage(output, [
            '<p><strong>Mediciones observadas:</strong> ',
            formatNumber(leftEntry.computed.sweatRateLitersPerHour, 2) + " L/h y " +
            formatNumber(rightEntry.computed.sweatRateLitersPerHour, 2) + " L/h.</p>",
            '<p class="field-help">Las diferencias observadas pueden ayudarte a describir el contexto, pero no demuestran causas. No se calcula un promedio ni se extrapola a otras condiciones.</p>',
            '<div class="comparison-columns">',
            comparisonList("Coincidencias", comparison.matches, comparison),
            comparisonList("Diferencias", comparison.differences, comparison),
            comparisonList("Datos desconocidos", comparison.unknown, comparison),
            '</div>'
        ].join(""), "comparison-result");
        focusElement(output);
    }

    function activatePanel(name, moveFocus) {
        var referenceTab = byId("tab-reference");
        var sessionTab = byId("tab-session");
        var referencePanel = byId("panel-reference");
        var sessionPanel = byId("panel-session");
        var sessionActive = name === "session";

        referenceTab.setAttribute("aria-selected", String(!sessionActive));
        sessionTab.setAttribute("aria-selected", String(sessionActive));
        referenceTab.tabIndex = sessionActive ? -1 : 0;
        sessionTab.tabIndex = sessionActive ? 0 : -1;
        referenceTab.classList.toggle("is-active", !sessionActive);
        sessionTab.classList.toggle("is-active", sessionActive);
        setHidden(referencePanel, sessionActive);
        setHidden(sessionPanel, !sessionActive);
        if (moveFocus) focusElement(sessionActive ? sessionTab : referenceTab);
    }

    function resetReference() {
        var form = byId("reference-form");
        if (form && typeof form.reset === "function") form.reset();
        clearFormFieldErrors(form);
        setHidden(byId("safety-details"), true);
        setHidden(byId("reference-confirmations"), true);
        if (byId("reference-confirmations-toggle")) {
            byId("reference-confirmations-toggle").setAttribute("aria-expanded", "false");
        }
        clearMessage(byId("reference-errors"));
        clearMessage(byId("resultado"));
        if (byId("grupo-referencia")) {
            byId("grupo-referencia").value = "";
            byId("grupo-referencia").disabled = false;
        }
    }

    function resetSession() {
        var form = byId("sweat-form");
        if (form && typeof form.reset === "function") form.reset();
        clearFormFieldErrors(form);
        currentSession = null;
        setHidden(byId("session-context"), true);
        if (byId("context-toggle")) byId("context-toggle").setAttribute("aria-expanded", "false");
        clearMessage(byId("session-errors"));
        clearMessage(byId("session-result"));
        setDefaultDate();
    }

    function setDefaultDate() {
        var date = byId("session-date");
        var now = new Date();
        var localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
        if (date && !date.value) date.value = localDate;
    }

    function loadPassport() {
        var loaded;
        try {
            store = passportStorage.createStore();
            loaded = store.list();
        } catch (error) {
            store = passportStorage.createStore(null);
            loaded = { ok: false, status: "storage_unavailable", entries: [] };
        }
        savedEntries = loaded.entries;
        renderPassport();
        if (!loaded.ok) showStorageProblem(loaded);
    }

    function initialize() {
        var tabs;
        if (initialized || !byId("reference-form")) return;
        initialized = true;

        tabs = [byId("tab-reference"), byId("tab-session")];
        tabs.forEach(function bindTab(tab) {
            tab.addEventListener("click", function openTab() {
                activatePanel(tab.getAttribute("data-panel"), false);
            });
            tab.addEventListener("keydown", function tabKeys(event) {
                var index = tabs.indexOf(tab);
                var next = null;
                if (event.key === "ArrowRight" || event.key === "ArrowDown") next = tabs[(index + 1) % tabs.length];
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = tabs[(index - 1 + tabs.length) % tabs.length];
                if (event.key === "Home") next = tabs[0];
                if (event.key === "End") next = tabs[tabs.length - 1];
                if (next) {
                    event.preventDefault();
                    activatePanel(next.getAttribute("data-panel"), true);
                }
            });
        });

        byId("reference-form").addEventListener("submit", handleReferenceSubmit);
        byId("reference-form").addEventListener("input", function invalidateReference(event) {
            clearMessage(byId("reference-errors"));
            clearMessage(byId("resultado"));
            if (event.target && event.target.id) clearFieldError(event.target.id);
        });
        byId("reference-reset").addEventListener("click", function reset(event) {
            event.preventDefault();
            resetReference();
        });
        byId("reference-confirmations-toggle").addEventListener("click", function showConfirmations() {
            byId("reference-confirmations-toggle").setAttribute("aria-expanded", "true");
            setHidden(byId("reference-confirmations"), false);
            focusElement(byId("life-stage"));
        });
        byId("safety-context").addEventListener("change", function toggleSafety() {
            var hasDetails = byId("safety-context").value === "yes";
            setHidden(byId("safety-details"), !hasDetails);
            if (!hasDetails) {
                ["safety-kidney", "safety-heart", "safety-restriction", "safety-acute", "safety-therapeutic"]
                    .forEach(function clearSafety(id) {
                        byId(id).checked = false;
                        clearFieldError(id, "safety-details-error");
                    });
            }
        });
        byId("life-stage").addEventListener("change", function syncReferenceGroup() {
            var usesAdultGroup = byId("life-stage").value === "none";
            byId("grupo-referencia").disabled = !usesAdultGroup;
            if (!usesAdultGroup) clearFieldError("grupo-referencia", "reference-group-error");
        });

        byId("sweat-form").addEventListener("submit", handleSessionSubmit);
        byId("sweat-form").addEventListener("input", function invalidateSession(event) {
            currentSession = null;
            clearMessage(byId("session-errors"));
            clearMessage(byId("session-result"));
            if (event.target && event.target.id) clearFieldError(event.target.id);
        });
        byId("session-reset").addEventListener("click", function reset(event) {
            event.preventDefault();
            resetSession();
        });
        byId("context-toggle").addEventListener("click", function toggleContext() {
            var expanded = byId("context-toggle").getAttribute("aria-expanded") === "true";
            byId("context-toggle").setAttribute("aria-expanded", String(!expanded));
            setHidden(byId("session-context"), expanded);
        });
        byId("compare-sessions").addEventListener("click", compareSelectedSessions);
        byId("compare-left").addEventListener("change", function invalidateComparison() {
            clearMessage(byId("comparison-result"));
        });
        byId("compare-right").addEventListener("change", function invalidateComparison() {
            clearMessage(byId("comparison-result"));
        });
        byId("clear-passport").addEventListener("click", function clearAll() {
            if (!root.confirm || !root.confirm("¿Eliminar todas las sesiones guardadas en este dispositivo?")) return;
            var cleared = store.clear();
            if (!cleared.ok) {
                showStorageProblem(cleared);
                return;
            }
            savedEntries = [];
            showMessage(byId("storage-status"), "<p>Historial local eliminado.</p>", "inline-message success-message");
            renderPassport();
            focusElement(byId("passport-empty"));
        });

        setDefaultDate();
        loadPassport();
    }

    root.mostrarReferenciaAguaTotal = function mostrarReferenciaAguaTotal() {
        if (byId("reference-form") && byId("reference-age")) {
            handleReferenceSubmit({ preventDefault: function preventDefault() {} });
        } else {
            directReferenceFallback();
        }
    };
    root.reiniciarFormulario = resetReference;
    root.ImoancyWaterUI = Object.freeze({
        convertVolumeToLiters: convertVolumeToLiters,
        convertDurationToMinutes: convertDurationToMinutes,
        buildSafetyProfile: buildSafetyProfile,
        resolveReference: resolveReference,
        buildSessionPayload: buildSessionPayload,
        describePassportEntry: entryDescriptor,
        describeComparisonDimension: describeDimension,
        initialize: initialize
    });

    if (root.document && typeof root.document.addEventListener === "function") {
        if (root.document.readyState === "loading") {
            root.document.addEventListener("DOMContentLoaded", initialize);
        } else {
            initialize();
        }
    }
}(typeof globalThis !== "undefined" ? globalThis : this));
