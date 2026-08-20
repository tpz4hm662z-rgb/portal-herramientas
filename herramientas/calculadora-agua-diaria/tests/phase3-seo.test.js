(function runWaterPhaseThreeSeoTests(root) {
    "use strict";

    var h = root.ImoancyWaterTestHarness;
    var read = root.ImoancyWaterTestRead;
    var sha256 = root.ImoancyWaterTestSha256;
    var base = root.ImoancyWaterTestBase;
    var html = read(base + "/index.html");
    var portal = read(base + "/../../index.html");
    var head = html.slice(0, html.indexOf("</head>"));
    var body = html.slice(html.indexOf("<body"));
    var jsonMatch = html.match(/<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
    var structured = JSON.parse(jsonMatch[1]);
    var graphTypes = structured["@graph"].map(function graphType(node) { return node["@type"]; });

    function count(pattern, value) {
        return (value.match(pattern) || []).length;
    }

    function meta(name) {
        var match = head.match(new RegExp('<meta name="' + name + '" content="([^"]+)"'));
        return match ? match[1] : "";
    }

    h.test("Fase 3 usa el title aprobado sin promesas absolutas", function () {
        h.ok(head.indexOf("<title>Calculadora de Agua Diaria y Tasa de Sudoración | Imoancy</title>") >= 0);
        h.equal(/exacta|ideal|perfecta|personalizada/i.test(head.match(/<title>(.*?)<\/title>/)[1]), false);
    });
    h.test("meta description cubre ambas intenciones con longitud natural", function () {
        var description = meta("description");
        h.ok(description.length >= 145 && description.length <= 160);
        h.ok(/EFSA/i.test(description));
        h.ok(/agua total/i.test(description));
        h.ok(/tasa de sudoración/i.test(description));
        h.ok(/Pasaporte local/i.test(description));
        h.ok(/sin prometer una necesidad exacta/i.test(description));
    });
    h.test("documento conserva un único H1 orientado a herramienta", function () {
        h.equal(count(/<h1\b/g, html), 1);
        h.ok(html.indexOf("<h1>Calculadora de agua diaria y tasa de sudoración</h1>") >= 0);
    });
    h.test("canonical permanece intacto", function () {
        h.equal(count(/<link rel="canonical"/g, head), 1);
        h.ok(head.indexOf('<link rel="canonical" href="https://imoancy.com/herramientas/calculadora-agua-diaria/">') >= 0);
    });
    h.test("hero compacto explica EFSA sesión y guardado local", function () {
        var hero = body.slice(body.indexOf('<div class="hero-contenido">'), body.indexOf("</header>"));
        h.ok(hero.indexOf("referencia EFSA de agua total") >= 0);
        h.ok(hero.indexOf("tasa observada de una sesión") >= 0);
        h.ok(hero.indexOf("guarda comparaciones en este dispositivo") >= 0);
        h.ok(hero.length < 1400);
    });
    h.test("guía editorial aparece después de la herramienta", function () {
        h.ok(html.indexOf('class="editorial-guide"') > html.indexOf('class="passport-section"'));
        h.ok(html.indexOf('class="editorial-guide"') < html.indexOf('id="herramientas-relacionadas"'));
    });
    h.test("estructura editorial incluye todos los H2 estratégicos", function () {
        [
            "¿Cuánta agua necesitas al día?", "Referencias de agua de EFSA",
            "¿El agua de los alimentos también cuenta?", "¿Necesitas beber más si haces ejercicio?",
            "Cómo calcular la tasa de sudoración", "¿Por qué cambia cuánto sudas?",
            "Una medición no cuenta toda la historia", "Pasaporte Personal de Sudoración",
            "Señales relacionadas con la hidratación", "Metodología de Agua Diaria PRO",
            "Limitaciones", "Preguntas frecuentes", "Fuentes científicas y responsabilidad editorial"
        ].forEach(function headingPresent(text) { h.ok(html.indexOf("<h2>" + text + "</h2>") >= 0); });
    });
    h.test("tabla EFSA presenta cuatro referencias como agua total", function () {
        ["2,0 L/día", "2,5 L/día", "2,3 L/día", "2,7 L/día"]
            .forEach(function valuePresent(value) { h.ok(html.indexOf(value) >= 0); });
        h.ok(html.indexOf("agua total procedente de bebidas y alimentos") >= 0);
        h.ok(html.indexOf("temperatura ambiental moderada") >= 0);
        h.ok(html.indexOf("PAL 1,6") >= 0);
    });
    h.test("tabla EFSA contiene caption y cabeceras con scope", function () {
        h.ok(html.indexOf("<caption>") >= 0);
        h.ok(count(/scope="col"/g, html) >= 2);
        h.ok(count(/scope="row"/g, html) === 4);
    });
    h.test("agua de alimentos se explica sin porcentaje universal", function () {
        var section = html.slice(html.indexOf('id="agua-alimentos"'), html.indexOf('id="agua-ejercicio"'));
        h.ok(section.indexOf("incluyen conjuntamente el agua de las bebidas y la humedad de los alimentos") >= 0);
        h.ok(section.indexOf("no aplica un porcentaje universal") >= 0);
        h.equal(/\b\d{1,2}\s*%/.test(section), false);
    });
    h.test("ejercicio no recibe una regla fija ni prescripción automática", function () {
        var section = html.slice(html.indexOf('id="agua-ejercicio"'), html.indexOf('id="calcular-sudoracion"'));
        h.ok(section.indexOf("una cantidad fija por hora no describe") >= 0);
        h.ok(section.indexOf("no se suma automáticamente a EFSA") >= 0);
        h.equal(/500\s*ml|añade\s+\d/i.test(section), false);
    });
    h.test("metodología de sudor coincide con el motor aprobado", function () {
        var section = html.slice(html.indexOf('id="calcular-sudoracion"'), html.indexOf('id="variacion-sudor"'));
        h.ok(section.indexOf("masa antes − masa después + líquido ingerido − orina") >= 0);
        h.ok(section.indexOf("pérdida estimada de sudor ÷ duración en horas") >= 0);
        h.ok(section.indexOf("1,2 L/h") >= 0);
        h.ok(section.indexOf("durante esa sesión") >= 0);
    });
    h.test("equivalencia kg litro queda limitada al método agudo", function () {
        h.ok(html.indexOf("el cambio agudo de masa expresado en kilogramos se incorpora con el mismo valor numérico en litros") >= 0);
        h.ok(html.indexOf("no significa que cualquier cambio de peso") >= 0);
    });
    h.test("variabilidad se explica sin coeficientes ni causalidad", function () {
        var section = html.slice(html.indexOf('id="variacion-sudor"'), html.indexOf('id="una-medicion"'));
        ["intensidad", "duración", "temperatura", "humedad", "aclimatación", "ropa", "características individuales"]
            .forEach(function factorPresent(factor) { h.ok(section.indexOf(factor) >= 0); });
        h.ok(section.indexOf("no demuestra por sí solo") >= 0);
        h.equal(/coeficiente\s*=|multiplica/i.test(section), false);
    });
    h.test("Pasaporte editorial conserva límites y privacidad real", function () {
        var section = html.slice(html.indexOf('id="pasaporte-guia"'), html.indexOf('id="signals-title"'));
        ["coincidencias", "diferencias", "datos desconocidos", "sin crear puntuaciones", "No diagnostica ni prescribe", "localmente"]
            .forEach(function claimPresent(claim) { h.ok(section.indexOf(claim) >= 0); });
    });
    h.test("señales no crean diagnóstico por color de orina", function () {
        var section = html.slice(html.indexOf('id="signals-title"'), html.indexOf('id="metodologia"'));
        h.ok(section.indexOf("señal contextual imperfecta") >= 0);
        h.ok(section.indexOf("no diagnostica por sí sola") >= 0);
        h.equal(/amarillo\s*=|oscuro\s*=|hydrationScore/i.test(section), false);
    });
    h.test("metodología separa las tres capas y sus límites", function () {
        var section = html.slice(html.indexOf('id="metodologia"'), html.indexOf('id="limitaciones"'));
        ["Referencia habitual", "Sesión de sudoración", "Comparación", "No calcula una necesidad exacta", "No prescribe sodio", "No diagnostica por el color"]
            .forEach(function methodPresent(text) { h.ok(section.indexOf(text) >= 0); });
        h.ok(section.indexOf("No suma la referencia EFSA y el sudor") >= 0);
    });
    h.test("limitaciones visibles cubren medición medicina y menores", function () {
        var section = html.slice(html.indexOf('id="limitaciones"'), html.indexOf('id="preguntas-frecuentes"'));
        ["referencia poblacional", "báscula", "Ropa mojada", "restricciones de líquidos", "menor de 18 años"]
            .forEach(function limitPresent(text) { h.ok(section.indexOf(text) >= 0); });
    });
    h.test("FAQ visible contiene nueve preguntas útiles", function () {
        var section = html.slice(html.indexOf('id="preguntas-frecuentes"'), html.indexOf('id="fuentes"'));
        h.equal(count(/<details>/g, section), 9);
        h.ok(section.indexOf("¿Es correcto calcular el agua como 35 ml por kilo?") >= 0);
        h.ok(section.indexOf("¿Mis datos se envían a Imoancy?") >= 0);
    });
    h.test("35 ml por kilo solo aparece como simplificación rechazada", function () {
        var section = html.slice(html.indexOf("¿Es correcto calcular el agua como 35 ml por kilo?"), html.indexOf("¿El agua de los alimentos cuenta?"));
        h.ok(section.indexOf("no la usa para afirmar una necesidad individual exacta") >= 0);
        h.equal(/debes|recomienda|objetivo de/i.test(section), false);
    });
    h.test("fuentes científicas muestran los dos DOI aprobados", function () {
        h.ok(html.indexOf("10.2903/j.efsa.2010.1459") >= 0);
        h.ok(html.indexOf("10.4085/1062-6050-52.9.02") >= 0);
        h.ok(html.indexOf("Scientific Opinion on Dietary Reference Values for water") >= 0);
        h.ok(html.indexOf("Fluid Replacement for the Physically Active") >= 0);
    });
    h.test("fuentes externas usan enlaces seguros", function () {
        var section = html.slice(html.indexOf('id="fuentes"'), html.indexOf('id="herramientas-relacionadas"'));
        h.equal(count(/target="_blank"/g, section), 2);
        h.equal(count(/rel="noopener noreferrer"/g, section), 2);
    });
    h.test("fecha y responsabilidad editorial son explícitas sin credenciales inventadas", function () {
        h.ok(count(/20 de agosto de 2026/g, html) >= 2);
        h.ok(html.indexOf("Equipo editorial de Imoancy") >= 0);
        h.equal(/revisado por (?:médico|doctor)|dietista|nutricionista colegiado/i.test(html), false);
    });
    h.test("JSON-LD es parseable y declara solo entidades reales", function () {
        h.ok(jsonMatch !== null);
        h.equal(structured["@context"], "https://schema.org");
        h.includes(graphTypes, "WebPage");
        h.includes(graphTypes, "SoftwareApplication");
        h.includes(graphTypes, "BreadcrumbList");
        h.equal(graphTypes.length, 3);
    });
    h.test("JSON-LD no inventa FAQ reviews ratings ni schema médico", function () {
        var json = JSON.stringify(structured);
        ["FAQPage", "Review", "AggregateRating", "MedicalWebPage", "Physician"]
            .forEach(function absent(type) { h.equal(json.indexOf(type), -1); });
    });
    h.test("JSON-LD refleja fecha aplicación gratuita y URL canónica", function () {
        var json = JSON.stringify(structured);
        h.ok(json.indexOf('"dateModified":"2026-08-20"') >= 0);
        h.ok(json.indexOf('"isAccessibleForFree":true') >= 0);
        h.ok(json.indexOf("https://imoancy.com/herramientas/calculadora-agua-diaria/") >= 0);
    });
    h.test("Open Graph y Twitter cubren ambas intenciones", function () {
        h.ok(head.indexOf('property="og:title" content="Calculadora de Agua Diaria y Tasa de Sudoración | Imoancy"') >= 0);
        h.ok(head.indexOf('name="twitter:title" content="Calculadora de Agua Diaria y Tasa de Sudoración | Imoancy"') >= 0);
        h.ok(count(/tasa observada de sudoración/g, head) >= 2);
        h.ok(head.indexOf('property="og:url" content="https://imoancy.com/herramientas/calculadora-agua-diaria/"') >= 0);
    });
    h.test("preview social conserva imagen y alt descriptivo", function () {
        h.ok(head.indexOf('og-image-1200x630.png') >= 0);
        h.ok(head.indexOf("referencia EFSA y tasa de sudoración") >= 0);
    });
    h.test("enlazado interno relacionado apunta a herramientas existentes", function () {
        ["calculadora-calorias", "calculadora-tmb", "calculadora-proteinas"].forEach(function validTool(slug) {
            h.ok(html.indexOf("https://imoancy.com/herramientas/" + slug + "/") >= 0);
            h.ok(read(base + "/../" + slug + "/index.html").length > 0);
        });
    });
    h.test("portal reemplaza el claim heredado sin tocar la URL", function () {
        var cardStart = portal.indexOf('href="https://imoancy.com/herramientas/calculadora-agua-diaria/"');
        var card = portal.slice(cardStart, portal.indexOf("</a>", cardStart));
        h.ok(card.indexOf("referencias EFSA de agua total") >= 0);
        h.ok(card.indexOf("tasa observada de sudoración") >= 0);
        h.equal(/según tu peso|deberías beber/i.test(card), false);
    });
    h.test("contenido no crea una fórmula diaria ni suma EFSA y sudor", function () {
        h.equal(/(?:peso|kg)\s*[×*]\s*(?:30|35)|EFSA\s*\+\s*sudor/i.test(body), false);
        h.equal(/(?:objetivo|necesidad)\s*(?:diaria)?\s*=.*(?:EFSA|sudor)/i.test(body), false);
    });
    h.test("núcleo científico mantiene los tres hashes congelados", function () {
        h.equal(sha256(base + "/js/science-config.js"), "cb66bc57237a65d63778a83af041afe3e34f94f9742e145150b638c911b4c294");
        h.equal(sha256(base + "/js/science-engine.js"), "5e1f0e182070ae7c179127c774852eae0e07a99911536af2d008ae77db28bb0b");
        h.equal(sha256(base + "/js/safety-screening.js"), "0b7797c2d4814901e6c03cc6c224c48185cb6c93e563ef375cf4d6e8eeae5044");
    });
}(globalThis));
