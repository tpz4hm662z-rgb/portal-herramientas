/* UI controller for Muscle Mass PRO v1.0. Scientific arithmetic lives only in scientific-core.js. */
"use strict";

(function (root) {
    const UI = {};

    UI.parseStrictNumber = function (value) {
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value !== "string" || value.trim() === "") return null;
        const normalized = value.trim().replace(",", ".");
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
        const number = Number(normalized);
        return Number.isFinite(number) ? number : null;
    };

    UI.normalizeFormValues = function (raw) {
        const age = UI.parseStrictNumber(raw.age);
        const heightCm = UI.parseStrictNumber(raw.heightCm);
        const weightKg = UI.parseStrictNumber(raw.weightKg);
        return {
            sex: raw.sex,
            age,
            heightCm,
            heightM: heightCm === null ? null : heightCm / 100,
            weightKg,
            populationGroup: raw.populationGroup || undefined
        };
    };

    UI.validateNormalized = function (values) {
        const errors = {};
        if (values.sex !== "male" && values.sex !== "female") errors.sex = "Selecciona tu sexo biológico.";
        if (values.age === null) errors.age = "Introduce tu edad.";
        else if (!Number.isInteger(values.age)) errors.age = "Introduce la edad en años completos.";
        else if (values.age < 20 || values.age > 81) errors.age = "Esta estimación está disponible para personas de 20 a 81 años.";
        /* UX/unit guards only: these are not clinical or Lee-model limits. */
        if (values.heightCm === null || values.heightCm < 50 || values.heightCm > 300) errors.height = "Revisa la altura. Introdúcela en centímetros, por ejemplo 172.";
        if (values.weightKg === null || values.weightKg < 10 || values.weightKg > 500) errors.weight = "Revisa el peso introducido. Escríbelo en kilogramos.";
        return errors;
    };

    UI.formatOneDecimal = function (value) {
        if (typeof value !== "number" || !Number.isFinite(value)) return "—";
        return value.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    /* Visual-only scale: mean ± 2 SD fills the line; positions are clamped to its edges. */
    UI.referencePosition = function (value, mean, sd) {
        if (![value, mean, sd].every(Number.isFinite) || sd <= 0) return null;
        const lower = mean - 2 * sd;
        const upper = mean + 2 * sd;
        return Math.max(0, Math.min(100, (value - lower) / (upper - lower) * 100));
    };

    UI.referenceMarkerLayout = function (userPosition) {
        if (typeof userPosition !== "number" || !Number.isFinite(userPosition)) return null;
        const user = Math.max(0, Math.min(100, userPosition));
        const distance = Math.abs(user - 50);
        if (distance < 2) return { combined: true, combinedPosition: (user + 50) / 2, meanBelow: false, userBelow: false };
        return { combined: false, combinedPosition: null, meanBelow: distance < 12, userBelow: false };
    };

    UI.humanResultError = function (status) {
        if (status === "not_applicable_age") return "Esta estimación está disponible para personas de 20 a 81 años.";
        if (status === "physiologically_invalid") return "No podemos generar una estimación fiable con estos datos. Revisa los valores introducidos.";
        return "No podemos calcular con estos datos. Revisa los campos indicados.";
    };

    UI.referenceGroupText = function (sex, group) {
        const sexText = sex === "male" ? "hombres" : "mujeres";
        const ageText = group === "70+" ? "70 años o más" : `${group} años`;
        return `Referencia poblacional · ${sexText} de ${ageText}`;
    };

    if (typeof module !== "undefined" && module.exports) module.exports = UI;
    root.MuscleMassUI = UI;

    if (typeof document === "undefined") return;
    const byId = (id) => document.getElementById(id);
    const form = byId("mm-form");
    if (!form) return;
    const results = byId("mm-results");
    const formError = byId("mm-form-error");
    let hasResult = false;
    const sexHelpButton = byId("mm-sex-help-button");
    const sexHelp = byId("mm-help-sex");
    sexHelpButton.addEventListener("click", function () {
        const open = sexHelpButton.getAttribute("aria-expanded") === "true";
        sexHelpButton.setAttribute("aria-expanded", String(!open));
        sexHelp.hidden = open;
    });

    function clearErrors() {
        ["sex", "age", "height", "weight"].forEach((key) => { byId(`mm-error-${key}`).textContent = ""; });
        form.querySelectorAll("[aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));
        formError.hidden = true;
        formError.textContent = "";
    }

    function hideStaleResult() {
        if (!hasResult) return;
        results.hidden = true;
        hasResult = false;
    }

    function showErrors(errors) {
        const keys = Object.keys(errors);
        keys.forEach((key) => {
            byId(`mm-error-${key}`).textContent = errors[key];
            const target = key === "sex" ? byId("mm-sex-field") : byId(`mm-${key}`);
            if (target) target.setAttribute("aria-invalid", "true");
        });
        formError.textContent = "Revisa los campos indicados antes de continuar.";
        formError.hidden = false;
        const first = keys[0] === "sex" ? form.querySelector("input[name=sex]") : byId(`mm-${keys[0]}`);
        if (first) first.focus();
    }

    function render(result, values) {
        byId("mm-muscle-kg").textContent = UI.formatOneDecimal(result.muscleKg);
        byId("mm-muscle-percent").textContent = UI.formatOneDecimal(result.musclePercent);
        byId("mm-bmi-notice").hidden = result.validationStatus !== "extended_bmi";
        byId("mm-population-note").hidden = result.populationAdjustmentApplied;
        byId("mm-reference-group").textContent = UI.referenceGroupText(values.sex, result.referenceGroup);
        byId("mm-reference-mean").textContent = UI.formatOneDecimal(result.referenceMeanPercent);
        byId("mm-reference-user").textContent = UI.formatOneDecimal(result.musclePercent);
        const position = UI.referencePosition(result.musclePercent, result.referenceMeanPercent, result.referenceSdPercent);
        const markerLayout = UI.referenceMarkerLayout(position);
        const meanMarker = byId("mm-mean-marker"), userMarker = byId("mm-user-marker"), combinedMarker = byId("mm-combined-marker");
        meanMarker.style.left = "50%"; userMarker.style.left = `${position}%`;
        meanMarker.classList.toggle("label-below", markerLayout.meanBelow);
        userMarker.classList.toggle("label-below", markerLayout.userBelow);
        meanMarker.hidden = markerLayout.combined; userMarker.hidden = markerLayout.combined;
        combinedMarker.hidden = !markerLayout.combined;
        combinedMarker.style.left = `${markerLayout.combinedPosition}%`;
        byId("mm-reference-accessible").textContent = `Tu estimación es ${UI.formatOneDecimal(result.musclePercent)} %. La media publicada para ${UI.referenceGroupText(values.sex, result.referenceGroup).replace("Referencia poblacional · ", "")} es ${UI.formatOneDecimal(result.referenceMeanPercent)} %.`;
        byId("mm-limited-evidence").hidden = result.referenceEvidence !== "limited";
        byId("mm-meaning-kg").textContent = UI.formatOneDecimal(result.muscleKg);
        byId("mm-meaning-percent").textContent = UI.formatOneDecimal(result.musclePercent);
        results.hidden = false;
        hasResult = true;
        results.scrollIntoView({ behavior: "smooth", block: "start" });
        results.focus({ preventScroll: true });
    }

    form.addEventListener("input", hideStaleResult);
    form.addEventListener("change", hideStaleResult);
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();
        const data = new FormData(form);
        const values = UI.normalizeFormValues({ sex: data.get("sex"), age: data.get("age"), heightCm: data.get("heightCm"), weightKg: data.get("weightKg"), populationGroup: data.get("populationGroup") });
        const errors = UI.validateNormalized(values);
        if (Object.keys(errors).length) { hideStaleResult(); showErrors(errors); return; }
        const button = byId("mm-submit");
        button.disabled = true;
        const result = estimateSkeletalMuscle({ sex: values.sex, age: values.age, heightM: values.heightM, weightKg: values.weightKg, populationGroup: values.populationGroup });
        button.disabled = false;
        if (result.validationStatus === "invalid_input" || result.validationStatus === "not_applicable_age" || result.validationStatus === "physiologically_invalid") {
            hideStaleResult(); formError.textContent = UI.humanResultError(result.validationStatus); formError.hidden = false; return;
        }
        render(result, values);
    });
}(typeof globalThis !== "undefined" ? globalThis : this));
