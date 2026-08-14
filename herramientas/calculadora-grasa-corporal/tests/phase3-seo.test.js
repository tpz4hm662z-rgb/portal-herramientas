"use strict";
(function (root) {
    const read = root.ImoancyReadTestFile;
    const base = root.ImoancyBodyFatTestBase;
    const html = read(base + "/index.html");
    const css = read(base + "/css/style.css");
    let passed = 0;
    const failures = [];

    function test(name, fn) {
        try { fn(); passed += 1; }
        catch (error) { failures.push("phase3-seo · " + name + ": " + error.message); }
    }
    function ok(value, message) { if (!value) throw Error(message || "assertion failed"); }
    function count(fragment) { return html.split(fragment).length - 1; }
    function elementText(id) {
        const match = html.match(new RegExp('<[^>]+id="' + id + '"[^>]*>([\\s\\S]*?)<\\/[^>]+>'));
        ok(match, "no se encontró #" + id);
        return match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    const title = "Calculadora de Grasa Corporal: estima tu porcentaje | Imoancy";
    const description = "Calcula una estimación de tu porcentaje de grasa corporal, contrasta con cintura y guarda mediciones en tu navegador para comparar su evolución.";
    const ldBlocks = [];
    const ldPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let ldMatch;
    while ((ldMatch = ldPattern.exec(html))) ldBlocks.push(JSON.parse(ldMatch[1]));
    const graph = ldBlocks[0] && ldBlocks[0]["@graph"];
    const byType = type => graph.find(item => item["@type"] === type);

    test("title final exacto y longitud razonable", () => { ok(count("<title>" + title + "</title>") === 1); ok(title.length >= 45 && title.length <= 65); });
    test("meta description final exacta y longitud razonable", () => { ok(html.indexOf('name="description"\n        content="' + description + '"') >= 0); ok(description.length >= 120 && description.length <= 160); });
    test("canonical absoluto correcto", () => ok(html.indexOf('href="https://imoancy.com/herramientas/calculadora-grasa-corporal/"') >= 0));
    test("robots permite indexación", () => ok(html.indexOf('name="robots" content="index, follow"') >= 0));
    test("meta keywords obsoleta eliminada", () => ok(html.indexOf('name="keywords"') < 0));
    test("un único H1 mantiene el nombre de producto", () => { ok((html.match(/<h1(?:\s[^>]*)?>/g) || []).length === 1); ok(html.indexOf("<h1>\n                    Calculadora de Grasa Corporal PRO\n                </h1>") >= 0); });
    test("hero comunica cuatro datos y no medición clínica", () => { ok(html.indexOf("con cuatro datos") >= 0); ok(html.indexOf("no es una\n                    medición clínica") >= 0); });
    test("fecha visible de revisión es legítima", () => ok(count('datetime="2026-08-14"') >= 2 && html.indexOf("14 de agosto de 2026") >= 0));
    test("Open Graph y Twitter coinciden con title y description", () => { ok(count('content="' + title + '"') === 2); ok(count('content="' + description + '"') === 3); });
    test("Twitter incluye alternativa de imagen", () => ok(html.indexOf('name="twitter:image:alt"') >= 0));
    test("solo existe un bloque JSON-LD", () => ok(ldBlocks.length === 1));
    test("JSON-LD contiene un graph válido", () => ok(Array.isArray(graph) && graph.length === 4));
    test("IDs JSON-LD son distintos", () => { const ids = graph.map(item => item["@id"]); ok(new Set(ids).size === ids.length); });
    test("Organization mínima y verificable", () => { const item = byType("Organization"); ok(item.name === "Imoancy"); ok(item.url === "https://imoancy.com/"); });
    test("WebPage enlaza aplicación, breadcrumb y publisher", () => { const item = byType("WebPage"); ok(item.mainEntity["@id"].endsWith("#application")); ok(item.breadcrumb["@id"].endsWith("#breadcrumb")); ok(item.publisher["@id"].endsWith("#organization")); });
    test("WebApplication no inventa oferta ni valoración", () => { const item = byType("WebApplication"); ok(item.isAccessibleForFree === true); ok(!item.offers && !item.aggregateRating && !item.review); });
    test("breadcrumb JSON-LD tiene dos niveles", () => { const item = byType("BreadcrumbList"); ok(item.itemListElement.length === 2); ok(item.itemListElement[0].name === "Inicio"); });
    test("breadcrumb también es visible", () => { ok(html.indexOf('class="migas-pan"') >= 0); ok(html.indexOf('aria-current="page">Calculadora de Grasa Corporal') >= 0); });
    test("FAQPage se retira sin eliminar FAQ visible", () => { ok(html.indexOf('"@type": "FAQPage"') < 0); ok((html.match(/<details>/g) || []).length === 12); });
    test("metodología pública identifica poblaciones CUN-BAE", () => ["6.510 adultos blancos", "67 % mujeres", "18 a 80 años", "1.149 personas", "4,66 puntos porcentuales"].forEach(value => ok(html.indexOf(value) >= 0, value)));
    test("metodología pública identifica poblaciones RFM", () => ["12.581 adultos", "3.456 adultos", "DXA", "desde los 20 años"].forEach(value => ok(html.indexOf(value) >= 0, value)));
    test("fórmulas públicas reflejan los motores aprobados", () => { ok(html.indexOf("−44,988 + 0,503×edad") >= 0); ok(html.indexOf("64 − 20×(altura ÷ cintura) + 12×sexo") >= 0); });
    test("protocolo de cintura coincide en interfaz y guía", () => ok(elementText("protocoloCintura") === elementText("protocoloCinturaEducativo")));
    test("fuentes primarias enlazadas", () => ["pubmed.ncbi.nlm.nih.gov/22179957", "nature.com/articles/s41598-018-29362-1", "stacks.cdc.gov/view/cdc/51795"].forEach(value => ok(html.indexOf(value) >= 0, value)));
    test("responsabilidad editorial institucional y revisión son visibles", () => { ok(html.indexOf("Responsabilidad editorial") >= 0); ok(html.indexOf("Conoce más sobre Imoancy y nuestros criterios de trabajo") >= 0); ok(html.indexOf("quién está detrás de Imoancy") < 0); });
    test("enlaces contextuales son naturales, únicos y tienen destinos locales reales", () => { const info = html.slice(html.indexOf('<section id="informacion"'), html.indexOf('<section id="metodologia"')); const methodology = html.slice(html.indexOf('<section id="metodologia"'), html.indexOf('<section id="medir-cintura"')); const muscleUrl = "https://imoancy.com/herramientas/calculadora-porcentaje-masa-muscular/"; const bmiUrl = "https://imoancy.com/herramientas/calculadora-imc/"; ok(info.indexOf('<a href="' + muscleUrl + '">Calculadora de Masa Muscular Esquelética</a>') >= 0); ok(methodology.indexOf('<a href="' + bmiUrl + '">Calculadora de IMC</a>') >= 0); ok(count('href="' + muscleUrl + '"') === 2); ok(count('href="' + bmiUrl + '"') === 2); ok(html.indexOf(">haz clic aquí<") < 0); const manager = $.NSFileManager.defaultManager; ok(manager.fileExistsAtPath(base + "/../calculadora-porcentaje-masa-muscular/index.html")); ok(manager.fileExistsAtPath(base + "/../calculadora-imc/index.html")); });
    test("privacidad local no se contradice", () => { ok(html.indexOf("Solo si pulsas “Guardar” y confirmas") >= 0); ok(html.indexOf("el historial no se sincroniza") >= 0); });
    test("Grasa Ideal queda diferenciada", () => { ok(html.indexOf("no estima tu porcentaje corporal actual") >= 0); ok(html.indexOf("herramienta distinta") >= 0); });
    test("sin scripts externos nuevos ni GA duplicado", () => { const srcs = Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g), match => match[1]); const external = srcs.filter(src => /^https?:/.test(src)); ok(external.length === 1 && external[0].indexOf("googletagmanager.com/gtag/js") >= 0); ok(count('gtag("config"') === 1); });
    test("legado Navy no se carga ni permanece en disco", () => { ok(html.indexOf('src="js/config.js"') < 0 && html.indexOf('src="js/core.js"') < 0); const manager = $.NSFileManager.defaultManager; ok(!manager.fileExistsAtPath(base + "/js/config.js")); ok(!manager.fileExistsAtPath(base + "/js/core.js")); });
    test("IDs HTML son únicos", () => { const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]); ok(new Set(ids).size === ids.length, "hay IDs repetidos"); });
    test("impresión oculta historial y controles", () => { const print = css.slice(css.lastIndexOf("@media print")); ok(print.indexOf("#evolucion") >= 0); ok(print.indexOf("button") >= 0); ok(print.indexOf("form") >= 0); ok(print.indexOf("display:none !important") >= 0); });
    test("fórmulas y enlaces largos tienen protección responsive", () => ok(css.indexOf("overflow-wrap:anywhere") >= 0 && css.indexOf(".metodologia-grid") >= 0));

    (root.ImoancyBodyFatPhase2Suites || (root.ImoancyBodyFatPhase2Suites = [])).push({
        passed,
        failed: failures.length,
        failures
    });
})(globalThis);
