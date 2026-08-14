/* Interpretación longitudinal determinista y prudente. Sin DOM. */
"use strict";

(function (root, factory) {
    const tracking = typeof module === "object" && module.exports
        ? require("./tracking-schema.js")
        : root.ImoancyBodyFatTracking;
    const api = factory(tracking);
    if (typeof module === "object" && module.exports) module.exports = api;
    root.ImoancyBodyFatChangeInterpreter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (tracking) {
    function byMethod(group, methodId) {
        return group && Array.isArray(group.measurements)
            ? group.measurements.find(item => item.method.id === methodId) || null
            : null;
    }
    function direction(value) {
        if (!Number.isFinite(value) || Math.abs(value) < 1e-12) return "same";
        return value > 0 ? "up" : "down";
    }
    function delta(a, b) {
        return Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
    }
    function changedInputs(earlier, later) {
        const keys = earlier.method.id === "rfm"
            ? ["waistCm", "heightCm", "sex"]
            : ["weightKg", "ageYears", "heightCm", "sex"];
        return keys.filter(key => !Object.is(earlier.observed[key], later.observed[key]));
    }
    function roundingPresentation(earlier, later, internalDelta) {
        const earlierDisplay = Math.round(earlier.estimated.bodyFatPercent);
        const laterDisplay = Math.round(later.estimated.bodyFatPercent);
        const visibleDelta = laterDisplay - earlierDisplay;
        const internalDirection = direction(internalDelta);
        let relation = "ALIGNED_APPROXIMATION";
        if (internalDirection === "same") relation = "NO_CHANGE";
        else if (visibleDelta === 0) relation = "HIDDEN_INTERNAL_CHANGE";
        else if (Math.abs(internalDelta) < 1) relation = "VISIBLE_ROUNDING_BOUNDARY";
        return Object.freeze({ earlierDisplay, laterDisplay, visibleDelta, internalDirection, relation });
    }
    function methodComparison(earlier, later) {
        if (!earlier || !later) return { available: false, comparable: false, reason: "MISSING_METHOD" };
        const result = tracking.compareMeasurements(earlier, later);
        const estimateDelta = result.estimatedDelta ? result.estimatedDelta.bodyFatPercentagePoints : null;
        return {
            available: true,
            comparable: result.compatibleForEstimatedTrend,
            reason: result.incompatibilityReason,
            changedInputs: changedInputs(earlier, later),
            deltaPercentagePoints: estimateDelta,
            direction: result.estimatedDelta ? direction(estimateDelta) : null,
            rounding: result.estimatedDelta ? roundingPresentation(earlier, later, estimateDelta) : null
        };
    }
    function observedFromGroup(cunBae, rfm) {
        const base = cunBae?.observed || rfm?.observed || {};
        const rfmWaist = rfm?.observed?.waistCm;
        return Object.assign({}, base, { waistCm: Number.isFinite(base.waistCm) ? base.waistCm : rfmWaist });
    }
    function buildExplanation(oppositeDirections, cunBae, rfm) {
        const base = oppositeDirections
            ? "CUN-BAE y RFM se movieron en direcciones distintas. Esto describe la respuesta matemática de dos ecuaciones y no demuestra que una sea correcta ni que haya ocurrido una pérdida o ganancia real de grasa."
            : "CUN-BAE utiliza peso/IMC, edad y sexo. RFM utiliza altura, cintura y sexo; sus resultados son estimaciones y que coincidan no confirma un cambio corporal real.";
        const changed = new Set([].concat(cunBae.changedInputs || [], rfm.changedInputs || []));
        const notes = [];
        if (changed.has("weightKg")) notes.push("El peso introducido cambió; CUN-BAE puede variar matemáticamente por su efecto en el IMC.");
        if (changed.has("waistCm")) notes.push("La cintura introducida cambió; RFM puede variar matemáticamente por la relación altura/cintura.");
        if (changed.has("ageYears")) notes.push("La edad introducida cambió; CUN-BAE la incorpora, así que parte de su diferencia matemática puede proceder de esa variable.");
        if (changed.has("heightCm")) notes.push("La altura introducida cambió; modifica el IMC de CUN-BAE y la relación altura/cintura de RFM cuando esos métodos están disponibles.");
        if (changed.has("sex")) notes.push("El sexo usado por la ecuación cambió; se aplican coeficientes distintos y no mostramos deltas estimados entre esas variantes.");
        return [base].concat(notes).join(" ");
    }
    function interpretChange(earlierGroup, laterGroup) {
        if (!earlierGroup || !laterGroup) throw new TypeError("Se requieren dos grupos");
        if (new Date(laterGroup.measuredAt) <= new Date(earlierGroup.measuredAt)) throw new TypeError("Orden temporal inválido");
        const earlyCun = byMethod(earlierGroup, "cun-bae"), lateCun = byMethod(laterGroup, "cun-bae");
        const earlyRfm = byMethod(earlierGroup, "rfm"), lateRfm = byMethod(laterGroup, "rfm");
        const observedEarly = observedFromGroup(earlyCun, earlyRfm);
        const observedLate = observedFromGroup(lateCun, lateRfm);
        const observed = {
            weightKg: delta(observedEarly.weightKg, observedLate.weightKg),
            waistCm: delta(observedEarly.waistCm, observedLate.waistCm)
        };
        const cunBae = methodComparison(earlyCun, lateCun);
        const rfm = methodComparison(earlyRfm, lateRfm);
        const oppositeDirections = cunBae.comparable && rfm.comparable &&
            cunBae.direction !== "same" && rfm.direction !== "same" && cunBae.direction !== rfm.direction;
        const incompatible = [cunBae, rfm].some(item => item.available && !item.comparable);
        const anyComparable = [cunBae, rfm].some(item => item.comparable);
        return Object.freeze({
            elapsedMs: new Date(laterGroup.measuredAt) - new Date(earlierGroup.measuredAt),
            observed: Object.freeze({ ...observed, weightDirection: direction(observed.weightKg), waistDirection: direction(observed.waistCm) }),
            estimates: Object.freeze({ cunBae: Object.freeze(cunBae), rfm: Object.freeze(rfm) }),
            oppositeDirections,
            structurallyComparable: !incompatible && anyComparable,
            headline: incompatible
                ? "Estas mediciones no se comparan directamente"
                : oppositeDirections
                    ? "Las estimaciones se han movido en direcciones diferentes"
                    : "Esto es lo que ha cambiado matemáticamente",
            explanation: buildExplanation(oppositeDirections, cunBae, rfm),
            canSay: "Podemos describir los datos introducidos y la dirección matemática de estimaciones compatibles.",
            cannotSay: "Estas ecuaciones no demuestran una pérdida o ganancia exacta de grasa corporal, ni permiten atribuir el cambio a músculo o grasa concreta. Que ambas estimaciones coincidan tampoco confirma que el cambio estimado sea real."
        });
    }
    return Object.freeze({ interpretChange, direction });
});
