"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const pages = {
  ahorro: {
    file: "herramientas/calculadora-ahorro/index.html",
    url: "https://imoancy.com/herramientas/calculadora-ahorro/"
  },
  interes: {
    file: "herramientas/calculadora-interes-compuesto-avanzada/index.html",
    url: "https://imoancy.com/herramientas/calculadora-interes-compuesto-avanzada/"
  },
  fire: {
    file: "herramientas/calculadora-fire/index.html",
    url: "https://imoancy.com/herramientas/calculadora-fire/"
  }
};

for (const page of Object.values(pages)) {
  page.html = fs.readFileSync(path.join(ROOT, page.file), "utf8");
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`OK ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}
function ok(value, message) {
  if (!value) throw new Error(message || "condición no cumplida");
}
function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(message || `${actual} !== ${expected}`);
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matches(html, regex) {
  return [...html.matchAll(regex)];
}
function linksTo(html, url) {
  const regex = new RegExp(`<a\\b[^>]*href=["']${escapeRegExp(url)}["'][^>]*>`, "gi");
  return matches(html, regex);
}
function editorialLinksTo(html, url) {
  return linksTo(html, url).filter(match => !/imoancy-related__card/i.test(match[0]));
}
function cardLinksTo(html, url) {
  return linksTo(html, url).filter(match => /imoancy-related__card/i.test(match[0]));
}
function jsonLd(html) {
  return matches(html, /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    .map(match => JSON.parse(match[1]));
}
function breadcrumbSchemas(schemas) {
  const found = [];
  const visit = value => {
    if (!value || typeof value !== "object") return;
    if (value["@type"] === "BreadcrumbList") found.push(value);
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === "object") visit(child);
    }
  };
  schemas.forEach(visit);
  return found;
}

const relations = [
  ["ahorro", "interes"], ["ahorro", "fire"],
  ["interes", "ahorro"], ["interes", "fire"],
  ["fire", "ahorro"], ["fire", "interes"]
];

for (const [from, to] of relations) {
  test(`${from} → ${to}: un enlace editorial`, () => equal(editorialLinksTo(pages[from].html, pages[to].url).length, 1));
  test(`${from} → ${to}: una tarjeta`, () => equal(cardLinksTo(pages[from].html, pages[to].url).length, 1));
}

for (const [name, page] of Object.entries(pages)) {
  test(`${name}: canonical intacto`, () => ok(new RegExp(`<link\\b[^>]*rel=["']canonical["'][^>]*href=["']${escapeRegExp(page.url)}["']`, "i").test(page.html)));
  test(`${name}: index, follow explícito y único`, () => equal(matches(page.html, /<meta\b[^>]*name=["']robots["'][^>]*content=["']index, follow["'][^>]*>/gi).length, 1));
  test(`${name}: un H1`, () => equal(matches(page.html, /<h1\b/gi).length, 1));
  test(`${name}: GA4 intacto`, () => ok(page.html.includes("G-QH8MJ6LVHN")));
  test(`${name}: sin dominios obsoletos`, () => ok(!/github\.io|Herramientas360/i.test(page.html)));
  test(`${name}: JSON-LD parseable`, () => ok(jsonLd(page.html).length > 0));
  test(`${name}: breadcrumb visible y accesible`, () => ok(/<nav\b[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*aria-label=["']Migas de pan["'][^>]*>/i.test(page.html)));
  test(`${name}: BreadcrumbList Inicio → herramienta`, () => {
    const breadcrumbs = breadcrumbSchemas(jsonLd(page.html));
    equal(breadcrumbs.length, 1);
    const items = breadcrumbs[0].itemListElement;
    equal(items.length, 2);
    equal(items[0].position, 1);
    equal(items[0].name, "Inicio");
    equal(items[0].item, "https://imoancy.com/");
    equal(items[1].position, 2);
    equal(items[1].item, page.url);
    ok(String(breadcrumbs[0]["@id"] || "").endsWith("/#breadcrumb"));
  });
  test(`${name}: destinos internos absolutos existen localmente`, () => {
    const hrefs = matches(page.html, /<a\b[^>]*href=["'](https:\/\/imoancy\.com\/herramientas\/[^"'#?]+\/)["']/gi).map(match => match[1]);
    for (const href of hrefs) {
      const slug = new URL(href).pathname.replace(/^\/herramientas\//, "").replace(/\/$/, "");
      ok(fs.existsSync(path.join(ROOT, "herramientas", slug, "index.html")), href);
    }
  });
}

test("Ahorro mantiene enlaces a Inflación y Rentabilidad", () => {
  ok(pages.ahorro.html.includes("https://imoancy.com/herramientas/calculadora-inflacion/"));
  ok(pages.ahorro.html.includes("https://imoancy.com/herramientas/calculadora-rentabilidad-inversiones/"));
});
test("Interés mantiene enlaces a Inflación y Rentabilidad", () => {
  ok(pages.interes.html.includes("https://imoancy.com/herramientas/calculadora-inflacion/"));
  ok(pages.interes.html.includes("https://imoancy.com/herramientas/calculadora-rentabilidad-inversiones/"));
});
test("FIRE mantiene enlace a Jubilación", () => ok(pages.fire.html.includes("https://imoancy.com/herramientas/calculadora-jubilacion/")));

if (!process.exitCode) console.log(`\n${passed} pruebas de malla superadas`);
