"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const engine = require("../js/core.js");
const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
function rejects(input, field, code) {
    assert.throws(() => engine.calculate(input), error => {
        assert.ok(error instanceof engine.ValidationError);
        assert.equal(error.field, field);
        if (code) assert.equal(error.code, code);
        assert.ok(error.message.length > 10);
        assert.equal(error.errors[0].field, field);
        return true;
    });
}

test("default railroaded two-leaf curtain requires 4.2 linear metres", () => {
    const r = engine.calculate();
    close(r.finishedCoveragePerPanel, 100);
    close(r.finishedWidthPerPanel, 200);
    close(r.usableFabricWidth, 278);
    close(r.cutHeight, 270);
    close(r.cutWidthPerPanel, 210);
    close(r.baseMeters, 4.2);
    close(r.purchaseMeters, 4.2);
    assert.equal(r.seamsPerPanel, 0);
    assert.equal(r.totalDrops, 2);
});

test("one leaf removes exactly two external-edge allowances from total fabric", () => {
    const one = engine.calculate({ panels: 1 });
    const two = engine.calculate({ panels: 2 });
    close(one.baseMeters, 4.1);
    close(two.baseMeters - one.baseMeters, 0.1);
});

test("an exact height fit is accepted; one millimetre above is blocked", () => {
    close(engine.calculate({ finishedHeight: 248 }).cutHeight, 278);
    rejects({ finishedHeight: 248.1 }, "fabricWidth", "height_does_not_fit");
});

test("railroaded fit excludes both selvages and includes shrinkage", () => {
    rejects({ shrinkage: 5 }, "fabricWidth", "height_does_not_fit");
    const r = engine.calculate({ shrinkage: 10, fabricWidth: 320 });
    close(r.usableFabricWidth, 286.2);
    close(r.cutWidthPerPanel, 210 / 0.9);
    close(r.baseMeters, 4.2 / 0.9);
    close(r.purchaseMeters, 4.7);
});

test("vertical 140 cm cloth: two complete drops per leaf, four in total", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 140 });
    assert.equal(r.dropsPerPanel, 2);
    assert.equal(r.totalDrops, 4);
    assert.equal(r.seamsPerPanel, 1);
    assert.equal(r.cutWidthPerPanel, null);
    close(r.availableWidthPerPanel, 263);
    close(r.excessWidthPerPanel, 63);
    close(r.baseMeters, 10.8);
    assert.ok(r.warnings.some(x => x.includes("medias tiras")));
});

test("seams consume both joined edges and can require one additional drop", () => {
    const common = { orientation: "vertical", panels: 1, trackWidth: 266, fullness: 1, fabricWidth: 140, sideAllowance: 5 };
    assert.equal(engine.calculate({ ...common, seamAllowance: 0 }).dropsPerPanel, 2);
    assert.equal(engine.calculate({ ...common, seamAllowance: 1.5 }).dropsPerPanel, 3);
});

test("exact horizontal capacity takes two drops; 0.01 cm excess needs three", () => {
    const common = { orientation: "vertical", panels: 1, fullness: 1, fabricWidth: 140, sideAllowance: 5 };
    assert.equal(engine.calculate({ ...common, trackWidth: 263 }).dropsPerPanel, 2);
    assert.equal(engine.calculate({ ...common, trackWidth: 263.01 }).dropsPerPanel, 3);
});

test("each leaf independently receives complete drops", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 150, panels: 2 });
    assert.equal(r.totalDrops, 4); // Global ceil(400 / 148) would incorrectly suggest three.
});

test("vertical shrinkage increases raw drop and can also increase drop count", () => {
    const common = { orientation: "vertical", panels: 1, trackWidth: 260, fullness: 1, fabricWidth: 140 };
    const original = engine.calculate(common);
    const shrunk = engine.calculate({ ...common, shrinkage: 10 });
    assert.equal(original.dropsPerPanel, 2);
    assert.equal(shrunk.dropsPerPanel, 3);
    close(shrunk.rawDropLength, 300);
    close(shrunk.baseMeters, 9);
});

test("straight case rounds each drop to rapport and adds exactly one initial rapport", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 140, pattern: "straight", repeat: 64 });
    close(r.rawDropLength, 270);
    close(r.dropLength, 320);
    close(r.initialPatternReserveCm, 64);
    close(r.baseMeters, 13.44);
    close(r.purchaseMeters, 13.5);
});

test("raw length on a rapport multiple never adds an unnecessary full repeat", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 140, pattern: "straight", repeat: 54 });
    close(r.dropLength, 270);
    close(r.baseMeters, 11.34);
});

test("pattern repeats are rounded after shrinkage compensation", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 140, pattern: "straight", repeat: 64, shrinkage: 20 });
    close(r.rawDropLength, 337.5);
    close(r.dropLength, 384);
    close(r.baseMeters, 16);
});

test("reserve applies to pattern-inclusive base, then purchase rounds up, then cost", () => {
    const r = engine.calculate({ orientation: "vertical", fabricWidth: 140, pattern: "straight", repeat: 64, reservePercent: 10, purchaseStep: 0.5, pricePerMeter: 12.5 });
    close(r.baseMeters, 13.44);
    close(r.reserveMeters, 1.344);
    close(r.purchasableBeforeRoundingMeters, 14.784);
    close(r.purchaseMeters, 15);
    close(r.roundingMeters, 0.216);
    close(r.cost, 187.5);
});

test("zero extra reserve and no price do not invent safety factors or prices", () => {
    const r = engine.calculate();
    close(r.reserveMeters, 0);
    close(r.roundingMeters, 0);
    close(r.cost, 0);
});

test("plain fabric ignores the repeat but tells the caller", () => {
    const normal = engine.calculate({ orientation: "vertical", fabricWidth: 140 });
    const extra = engine.calculate({ orientation: "vertical", fabricWidth: 140, repeat: 64 });
    close(extra.baseMeters, normal.baseMeters);
    close(extra.initialPatternReserveCm, 0);
    assert.ok(extra.warnings.some(x => x.includes("no se aplica")));
});

test("unsupported half-drop and railroaded case do not produce purchase advice", () => {
    rejects({ pattern: "half-drop", orientation: "vertical", repeat: 64 }, "pattern", "unsupported_half_drop");
    rejects({ pattern: "half-drop" }, "pattern", "unsupported_half_drop");
    rejects({ pattern: "straight", repeat: 64 }, "orientation", "unsupported_railroaded_pattern");
    rejects({ pattern: "straight", orientation: "vertical", repeat: 0 }, "repeat", "missing_repeat");
});

test("strict finite inputs reject empty values, strings, booleans, null and NaN", () => {
    for (const value of [undefined, null, "", "200", true, NaN, Infinity, -Infinity]) rejects({ trackWidth: value }, "trackWidth", "not_finite_number");
    for (const value of [null, [], "", 7]) rejects(value, "input", "invalid_input");
});

test("dimensional, allowance, percentage and purchase bounds are enforced", () => {
    const invalid = { trackWidth: 3001, finishedHeight: 0, fullness: 0.9, fabricWidth: 9, topAllowance: -1, bottomAllowance: 101, sideAllowance: 51, seamAllowance: 11, selvage: 21, shrinkage: 20.01, repeat: 501, reservePercent: 30.01, pricePerMeter: -0.01, purchaseStep: 0 };
    Object.keys(invalid).forEach(field => rejects({ [field]: invalid[field] }, field, "out_of_range"));
    rejects({ panels: 3 }, "panels");
    rejects({ panels: "2" }, "panels");
    rejects({ orientation: "auto" }, "orientation");
    rejects({ pattern: "unknown" }, "pattern");
    rejects({ fabricWidth: 10, selvage: 5 }, "fabricWidth", "no_usable_width");
});

test("the 200-drop guard allows its boundary and blocks the next drop", () => {
    const common = { orientation: "vertical", panels: 2, fullness: 1, fabricWidth: 10, selvage: 0, sideAllowance: 0, seamAllowance: 0 };
    assert.equal(engine.calculate({ ...common, trackWidth: 2000 }).totalDrops, 200);
    rejects({ ...common, trackWidth: 2000.1 }, "fabricWidth", "too_many_drops");
});

test("joining strips with no added width cannot cause an endless loop", () => {
    rejects({ orientation: "vertical", fabricWidth: 10, selvage: 1, seamAllowance: 4 }, "fabricWidth", "too_many_drops");
});

test("defaults and supplied inputs are never mutated", () => {
    const input = Object.freeze({ orientation: "vertical", fabricWidth: 140 });
    const r = engine.calculate(input);
    r.input.trackWidth = 555;
    assert.equal(engine.defaults.trackWidth, 200);
    assert.equal(input.fabricWidth, 140);
    assert.equal(engine.calculate(input).input.trackWidth, 200);
});

test("browser UMD contract loads without Node or DOM", () => {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../js/core.js"), "utf8"), context);
    close(context.CurtainCalculator.calculate().purchaseMeters, 4.2);
});

test("hundreds of deterministic combinations preserve purchase and width coverage", () => {
    for (const trackWidth of [80, 150, 200, 399.9, 800]) {
        for (const panels of [1, 2]) for (const fabricWidth of [90, 140, 280]) {
            for (const shrinkage of [0, 5, 15]) for (const pattern of ["plain", "straight"]) {
                const r = engine.calculate({ orientation: "vertical", trackWidth, panels, fabricWidth, shrinkage, pattern, repeat: 64, reservePercent: 7, purchaseStep: 0.25 });
                assert.ok(r.availableWidthPerPanel + 1e-9 >= r.finishedWidthPerPanel);
                if (r.dropsPerPanel > 1) {
                    const n = r.dropsPerPanel - 1;
                    const previousWidth = n * r.usableFabricWidth - 2 * r.input.seamAllowance * (n - 1) - 2 * r.input.sideAllowance;
                    assert.ok(previousWidth < r.finishedWidthPerPanel);
                }
                assert.ok(r.dropLength + 1e-9 >= r.rawDropLength);
                assert.ok(r.purchaseMeters + 1e-9 >= r.purchasableBeforeRoundingMeters);
                assert.ok(r.roundingMeters < r.input.purchaseStep + 1e-9);
                close(r.purchaseMeters / r.input.purchaseStep, Math.round(r.purchaseMeters / r.input.purchaseStep));
                if (pattern === "straight") close(r.dropLength / 64, Math.round(r.dropLength / 64));
            }
        }
    }
});
