"use strict";
(function (root) {
    const read = root.ImoancyReadTestFile, base = root.ImoancyBodyFatTestBase;
    const html = read(base + "/index.html"), script = read(base + "/js/script.js"), css = read(base + "/css/style.css");
    let passed = 0, failures = [];
    function test(name, fn) { try { fn(); passed += 1; } catch (error) { failures.push("ui-adversarial · " + name + ": " + error.message); } }
    function ok(value) { if (!value) throw Error("assertion failed"); }
    function has(text, fragment) { return text.indexOf(fragment) >= 0; }
    test("HTML no carga módulos Navy heredados", () => { ok(!has(html, 'src="js/config.js"')); ok(!has(html, 'src="js/core.js"')); });
    test("controlador no contiene fórmula Navy", () => ["86.010", "70.041", "163.205", "1.0324", "cuello", "cadera"].forEach(term => ok(!has(script, term))));
    test("segunda cintura requiere selección y nunca promedio", () => { ok(has(html, 'name="lecturaCintura"')); ok(has(script, "waistChoice")); ok(!has(script, "(first + second) / 2")); ok(!has(html, "utilizaremos el promedio")); });
    test("protocolo visible conserva todos los elementos NHANES", () => ["de pie", "manos en los hombros opuestos", "línea media axilar", "paralela al suelo", "sin comprimir", "espiración normal", "0,1 cm"].forEach(term => ok(has(html, term))));
    test("RFM 18-19 tiene explicación y control específico", () => { ok(has(html, 'id="avisoRfmEdad"')); ok(has(script, "ageYears >= 20")); });
    test("resultado no usa región live extensa", () => { const tag = html.slice(html.indexOf('<section id="resultados"'), html.indexOf('>', html.indexOf('<section id="resultados"')) + 1); ok(!has(tag, "aria-live")); });
    test("foco programático dispone de destinos", () => ["titulo-resultados", "titulo-cintura", "titulo-guardar", "titulo-evolucion"].forEach(id => ok(has(html, 'id="' + id + '"') && has(html.slice(Math.max(0, html.indexOf('id="' + id + '"') - 120), html.indexOf('id="' + id + '"') + 180), 'tabindex="-1"'))));
    test("contraste puede cerrarse y devolver foco", () => { ok(has(html, 'id="cerrarCintura"')); ok(has(script, "cerrarCintura")); });
    test("privacidad no serializa datos en URL o analítica", () => { ["URLSearchParams", "location.search", "location.hash", "history.pushState", "sendBeacon", "fetch(", "gtag("].forEach(term => ok(!has(script, term))); });
    test("CSS protege radios y textos largos", () => { ok(has(css, ".seleccion-lectura")); ok(has(css, "overflow-wrap:anywhere")); });
    test("movimiento reducido anula desplazamiento y animaciones", () => { ok(has(css, "@media (prefers-reduced-motion:reduce)")); ok(has(css, "scroll-behavior:auto")); ok(has(script, 'matchMedia("(prefers-reduced-motion: reduce)")')); ok(!has(script, 'behavior: "smooth"')); });
    test("delta aproximado redondea simétricamente", () => { ok(has(script, "Math.sign(value) * Math.round(Math.abs(value))")); ok(has(script, "roundSymmetrically(comparison.deltaPercentagePoints)")); });
    (root.ImoancyBodyFatPhase2Suites || (root.ImoancyBodyFatPhase2Suites = [])).push({ passed, failed: failures.length, failures });
})(globalThis);
