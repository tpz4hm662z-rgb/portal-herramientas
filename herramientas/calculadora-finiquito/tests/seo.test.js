(async function () {
    "use strict";
    const resultados = [], marco = document.getElementById("calculadora");
    const normalizar = texto => texto.replace(/\s+/g, " ").trim();
    function test(nombre, ok, detalle) { resultados.push({ nombre, ok: Boolean(ok), error: ok ? "" : (detalle || "condición falsa") }); }
    await new Promise(resolve => marco.addEventListener("load", resolve, { once: true }));
    const doc = marco.contentDocument, url = "https://imoancy.com/herramientas/calculadora-finiquito/";
    const meta = selector => doc.querySelector(selector)?.content || "";

    test("un único H1 descriptivo", doc.querySelectorAll("h1").length === 1 && normalizar(doc.querySelector("h1").textContent) === "Calculadora de finiquito");
    test("title específico y actualizado", doc.title === "Calculadora de finiquito 2026 | Imoancy");
    test("meta description útil", meta('meta[name="description"]').length >= 120 && meta('meta[name="description"]').length <= 165);
    test("canonical público exacto", doc.querySelector('link[rel="canonical"]')?.href === url);
    test("Open Graph completo y coherente", meta('meta[property="og:title"]') === doc.title && meta('meta[property="og:url"]') === url && meta('meta[property="og:description"]').length > 80 && /^https:\/\//.test(meta('meta[property="og:image"]')));
    test("Twitter Card completa", meta('meta[name="twitter:card"]') === "summary_large_image" && meta('meta[name="twitter:title"]') === doc.title && meta('meta[name="twitter:description"]').length > 40 && /^https:\/\//.test(meta('meta[name="twitter:image"]')));

    let datos, errorJson = "";
    try { datos = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent); } catch (error) { errorJson = error.message; }
    test("JSON-LD sintácticamente válido", Boolean(datos), errorJson);
    const grafo = datos?.["@graph"] || [], porTipo = tipo => grafo.find(item => item["@type"] === tipo);
    test("schema WebPage", porTipo("WebPage")?.url === url && porTipo("WebPage")?.dateModified === "2026-08-12");
    test("schema SoftwareApplication", porTipo("SoftwareApplication")?.url === url && porTipo("SoftwareApplication")?.isAccessibleForFree === true);
    const breadcrumb = porTipo("BreadcrumbList")?.itemListElement || [];
    test("schema BreadcrumbList", breadcrumb.length === 2 && breadcrumb[0]?.position === 1 && breadcrumb[0]?.item === "https://imoancy.com/" && breadcrumb[1]?.position === 2 && breadcrumb[1]?.item === url);
    test("breadcrumb sin destinos inexistentes conocidos", breadcrumb.every(item => ["https://imoancy.com/", url].includes(item.item)) && !breadcrumb.some(item => item.item === "https://imoancy.com/herramientas/"));
    test("schema FAQPage", porTipo("FAQPage")?.mainEntity?.length === 18);

    const visibles = Array.from(doc.querySelectorAll("#faq .lista-faq details")).map(item => ({
        pregunta: normalizar(item.querySelector("summary").textContent),
        respuesta: normalizar(item.querySelector("p").textContent)
    }));
    const schemaFaq = (porTipo("FAQPage")?.mainEntity || []).map(item => ({ pregunta: item.name, respuesta: item.acceptedAnswer?.text }));
    test("18 FAQ visibles", visibles.length === 18);
    test("FAQ visible y schema coinciden literalmente", JSON.stringify(visibles) === JSON.stringify(schemaFaq));
    test("distinción finiquito e indemnización visible", /Finiquito e indemnización no son lo mismo/.test(doc.querySelector(".distincion-rapida")?.textContent || ""));
    test("metodología y fórmula visibles", doc.querySelectorAll("#metodologia .tarjetas-metodo > div").length === 4 && /finiquito estimado/i.test(doc.querySelector("#metodologia .formula")?.textContent || ""));
    test("limitaciones expresas", doc.querySelectorAll("#limitaciones li").length >= 6 && /no sustituye/i.test(doc.querySelector("#limitaciones").textContent));
    test("fecha de revisión visible", /12 de agosto de 2026/.test(doc.querySelector(".revision-editorial")?.textContent || ""));
    test("privacidad visible", /No enviamos salarios, fechas ni importes/.test(doc.querySelector(".privacidad")?.textContent || ""));

    const fuentes = Array.from(doc.querySelectorAll("#fuentes a"));
    const dominios = new Set(fuentes.map(a => new URL(a.href).hostname));
    test("cuatro fuentes oficiales contextuales", fuentes.length === 4 && ["www.boe.es", "www.poderjudicial.es", "www.seg-social.es", "sepe.es"].every(d => dominios.has(d)));
    const internos = Array.from(doc.querySelectorAll(".contenido-editorial a, #herramientas-relacionadas a"));
    const hrefIndemnizacion = "https://imoancy.com/herramientas/calculadora-indemnizacion/";
    const hrefSueldoNeto = "https://imoancy.com/herramientas/calculadora-sueldo-neto/";
    test("enlaces internos laborales relevantes", internos.filter(a => a.href === hrefIndemnizacion).length === 2 && internos.filter(a => a.href === hrefSueldoNeto).length === 2);
    test("sin autorreferencias editoriales", !internos.some(a => a.href === url));
    test("solo dos tarjetas relacionadas de alta afinidad", doc.querySelectorAll("#herramientas-relacionadas .imoancy-related__card").length === 2 && !doc.querySelector("#herramientas-relacionadas").textContent.includes("ahorro"));
    const anclas = Array.from(doc.querySelectorAll(".indice-editorial a"));
    test("índice sin anclas rotas", anclas.length === 9 && anclas.every(a => a.hash && doc.getElementById(a.hash.slice(1))));
    const textoEditorial = normalizar(doc.querySelector(".contenido-editorial")?.textContent || "");
    test("profundidad editorial suficiente", textoEditorial.split(" ").length >= 1400, `${textoEditorial.split(" ").length} palabras`);
    test("sin promesas engañosas", !/(resultado exacto|finiquito oficial|resultado garantizado|100 ?% exact)/i.test(textoEditorial));

    const pass = resultados.filter(x => x.ok).length, resumen = { total: resultados.length, pass, fail: resultados.length - pass, resultados };
    globalThis.FiniquitoSeoTestResults = resumen;
    document.getElementById("salida").textContent = resultados.map(x => (x.ok ? "PASS " : "FAIL ") + x.nombre + (x.error ? " — " + x.error : "")).join("\n") + `\nTOTAL ${resumen.total} PASS ${pass} FAIL ${resumen.fail}`;
    document.body.dataset.testsFailed = String(resumen.fail); document.body.dataset.testsComplete = "true";
})();
