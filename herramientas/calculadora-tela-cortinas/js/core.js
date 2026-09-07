/* Curtain fabric estimator. All lengths are centimetres unless named Meters.
 * Pure arithmetic: no DOM, network, storage or automatic product assumptions.
 */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.CurtainCalculator = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const defaults = Object.freeze({
        trackWidth: 200, finishedHeight: 240, fullness: 2, panels: 2,
        fabricWidth: 280, orientation: "railroaded", topAllowance: 10,
        bottomAllowance: 20, sideAllowance: 5, seamAllowance: 1.5,
        selvage: 1, repeat: 0, pattern: "plain", shrinkage: 0,
        reservePercent: 0, pricePerMeter: 0, purchaseStep: 0.1
    });
    const ranges = Object.freeze({
        trackWidth: [1, 3000, "El ancho de barra o riel debe estar entre 1 y 3.000 cm."],
        finishedHeight: [1, 1000, "El alto terminado debe estar entre 1 y 1.000 cm."],
        fullness: [1, 4, "El factor de frunce debe estar entre 1 y 4."],
        fabricWidth: [10, 1000, "El ancho de tela debe estar entre 10 y 1.000 cm."],
        topAllowance: [0, 100, "El margen superior debe estar entre 0 y 100 cm."],
        bottomAllowance: [0, 100, "El margen inferior debe estar entre 0 y 100 cm."],
        sideAllowance: [0, 50, "El consumo de cada borde lateral debe estar entre 0 y 50 cm."],
        seamAllowance: [0, 10, "El margen por borde de unión debe estar entre 0 y 10 cm."],
        selvage: [0, 20, "El orillo que se retira de cada lado debe estar entre 0 y 20 cm."],
        repeat: [0, 500, "El rapport debe estar entre 0 y 500 cm."],
        shrinkage: [0, 20, "El encogimiento debe estar entre 0 y 20 %."],
        reservePercent: [0, 30, "La reserva adicional debe estar entre 0 y 30 %."],
        pricePerMeter: [0, 10000, "El precio por metro debe estar entre 0 y 10.000 €."],
        purchaseStep: [0.01, 10, "El incremento de venta debe estar entre 0,01 y 10 metros."]
    });

    class ValidationError extends Error {
        constructor(field, message, code) {
            super(message);
            this.name = "ValidationError";
            this.field = field;
            this.code = code || "invalid_value";
            this.errors = [{ field: this.field, code: this.code, message: this.message }];
        }
    }

    function normalize(input) {
        if (input === undefined) input = {};
        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new ValidationError("input", "Introduce los datos de la cortina.", "invalid_input");
        }
        const data = {};
        Object.keys(defaults).forEach(key => {
            data[key] = Object.prototype.hasOwnProperty.call(input, key) ? input[key] : defaults[key];
        });
        Object.keys(ranges).forEach(key => {
            const value = data[key], range = ranges[key];
            if (typeof value !== "number" || !Number.isFinite(value)) {
                throw new ValidationError(key, "Introduce un número válido. " + range[2], "not_finite_number");
            }
            if (value < range[0] || value > range[1]) {
                throw new ValidationError(key, range[2], "out_of_range");
            }
        });
        if (data.panels !== 1 && data.panels !== 2) {
            throw new ValidationError("panels", "Selecciona una o dos hojas.", "invalid_panels");
        }
        if (data.orientation !== "railroaded" && data.orientation !== "vertical") {
            throw new ValidationError("orientation", "Selecciona la orientación de la tela.", "invalid_orientation");
        }
        if (data.pattern === "half-drop") {
            throw new ValidationError("pattern", "El estampado a medio salto necesita un plan de casado específico. Consulta a quien vaya a confeccionar la cortina antes de comprar.", "unsupported_half_drop");
        }
        if (data.pattern !== "plain" && data.pattern !== "straight") {
            throw new ValidationError("pattern", "Selecciona tela lisa o estampado con case recto.", "invalid_pattern");
        }
        if (data.pattern !== "plain" && data.orientation === "railroaded") {
            throw new ValidationError("orientation", "Para calcular un estampado con case recto, cambia a tiras verticales. Esta herramienta no calcula el casado con tela girada.", "unsupported_railroaded_pattern");
        }
        if (data.pattern === "straight" && data.repeat <= 0) {
            throw new ValidationError("repeat", "Introduce un rapport mayor que cero para casar el estampado.", "missing_repeat");
        }
        return data;
    }

    // Remove only floating-point representation noise at exact multiples.
    function roundUp(value, step) {
        const ratio = value / step;
        const tolerance = 8 * Number.EPSILON * Math.max(1, Math.abs(ratio));
        return Number((Math.ceil(ratio - tolerance) * step).toPrecision(15));
    }
    function atLeast(available, required) {
        const tolerance = 8 * Number.EPSILON * Math.max(1, Math.abs(available), Math.abs(required));
        return available + tolerance >= required;
    }

    function calculate(input) {
        const data = normalize(input);
        const shrinkFactor = 1 - data.shrinkage / 100;
        const finishedCoveragePerPanel = data.trackWidth / data.panels;
        const finishedWidthPerPanel = data.trackWidth * data.fullness / data.panels;
        const usableFabricWidth = (data.fabricWidth - 2 * data.selvage) * shrinkFactor;
        const cutHeight = data.finishedHeight + data.topAllowance + data.bottomAllowance;
        const rawDropLength = cutHeight / shrinkFactor;
        const warnings = [];
        if (usableFabricWidth <= 0) {
            throw new ValidationError("fabricWidth", "El ancho de tela debe superar la suma de los dos orillos.", "no_usable_width");
        }

        let dropsPerPanel = 1, cutWidthPerPanel = null, dropLength = rawDropLength;
        let initialPatternReserveCm = 0, baseMeters, availableWidthPerPanel;
        if (data.orientation === "railroaded") {
            if (!atLeast(usableFabricWidth, cutHeight)) {
                throw new ValidationError("fabricWidth", "La tela no alcanza el alto más los márgenes después de retirar orillos y prever encogimiento. No compres esta cantidad: cambia a tiras verticales o usa una tela más ancha.", "height_does_not_fit");
            }
            cutWidthPerPanel = (finishedWidthPerPanel + 2 * data.sideAllowance) / shrinkFactor;
            baseMeters = cutWidthPerPanel * data.panels / 100;
            availableWidthPerPanel = finishedWidthPerPanel;
            warnings.push("Usa tela girada solo si el fabricante confirma que admite confección al ancho; comprueba dirección, caída y acabado.");
        } else {
            const maxDropsPerPanel = Math.floor(200 / data.panels);
            const widthForDrops = count => count * usableFabricWidth - 2 * data.seamAllowance * (count - 1) - 2 * data.sideAllowance;
            while (dropsPerPanel <= maxDropsPerPanel && !atLeast(widthForDrops(dropsPerPanel), finishedWidthPerPanel)) {
                dropsPerPanel += 1;
            }
            if (dropsPerPanel > maxDropsPerPanel) {
                throw new ValidationError("fabricWidth", "Esta combinación no permite resolver la cortina con un máximo de 200 tiras. Revisa el ancho de tela, los márgenes y el ancho de barra.", "too_many_drops");
            }
            availableWidthPerPanel = widthForDrops(dropsPerPanel);
            if (data.pattern === "straight") {
                dropLength = roundUp(rawDropLength, data.repeat);
                initialPatternReserveCm = data.repeat;
                warnings.push("El case recto supone un rapport vertical regular y el mismo motivo a la misma altura. Se reserva un rapport inicial para situar el primer corte; confirma la posición del dibujo antes de cortar.");
            }
            baseMeters = (dropsPerPanel * data.panels * dropLength + initialPatternReserveCm) / 100;
            warnings.push("Estimación conservadora con tiras completas por hoja. No reparte medias tiras entre hojas ni optimiza retales; las uniones se descuentan del ancho útil.");
        }
        if (data.pattern === "plain" && data.repeat > 0) {
            warnings.push("El rapport introducido no se aplica porque has seleccionado tela lisa.");
        }
        if (data.shrinkage > 0) {
            warnings.push("El encogimiento indicado se aplica igual en ambos ejes antes de confeccionar. Si trama y urdimbre encogen distinto, mide una muestra o consulta al proveedor.");
        }
        const reserveMeters = baseMeters * data.reservePercent / 100;
        const purchasableBeforeRoundingMeters = baseMeters + reserveMeters;
        const purchaseMeters = roundUp(purchasableBeforeRoundingMeters, data.purchaseStep);
        const result = {
            input: data, shrinkFactor, finishedCoveragePerPanel, finishedWidthPerPanel,
            usableFabricWidth, cutHeight, rawDropLength, dropLength,
            dropsPerPanel, totalDrops: dropsPerPanel * data.panels,
            seamsPerPanel: dropsPerPanel - 1, cutWidthPerPanel,
            availableWidthPerPanel,
            excessWidthPerPanel: Math.max(0, availableWidthPerPanel - finishedWidthPerPanel),
            initialPatternReserveCm, baseMeters, reserveMeters,
            purchasableBeforeRoundingMeters, purchaseMeters,
            roundingMeters: Math.max(0, purchaseMeters - purchasableBeforeRoundingMeters),
            cost: purchaseMeters * data.pricePerMeter,
            warnings
        };
        Object.keys(result).forEach(key => {
            if (typeof result[key] === "number" && !Number.isFinite(result[key])) {
                throw new ValidationError("input", "La combinación excede los límites de cálculo. Revisa las medidas.", "non_finite_result");
            }
        });
        return result;
    }

    return Object.freeze({ calculate, defaults, ValidationError });
}));
