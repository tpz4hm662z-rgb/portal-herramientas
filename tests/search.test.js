"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function element() {
    return {
        children: [], hidden: true, textContent: "", value: "", handlers: {},
        addEventListener(name, callback) { this.handlers[name] = callback; },
        replaceChildren() { this.children = []; },
        appendChild(child) { this.children.push(child); },
        querySelector(name) { return (this.parts ||= {})[name] ||= element(); }
    };
}
const input = element(), panel = element(), status = element();
const document = {
    getElementById(id) { return { buscador: input, "resultados-busqueda": panel, "estado-busqueda": status }[id]; },
    createElement: element,
    addEventListener() {}
};
const context = vm.createContext({ window: {}, document });
for (const file of ["assets/search-index.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
function search(query) {
    input.value = query;
    input.handlers.input();
    return panel.children.filter(item => item.href).map(item => item.href);
}
const examples = [
    ["He dejado mi trabajo y quiero cobrar el paro", "/guias/baja-voluntaria-nuevo-trabajo-paro/"],
    ["EDAD CORREGIDA BEBÉ PREMATURO", "/herramientas/calculadora-de-edad-corregida-para-bebes-prematuros/"],
    ["cuánta agua beber", "/herramientas/calculadora-agua-diaria/"],
    ["quiero ahorrar dinero cada mes", "/herramientas/calculadora-ahorro/"],
    ["envié una transferencia a una cuenta equivocada", "/guias/transferencia-cuenta-equivocada-recuperar-dinero/"],
    ["calcular sueldo neto", "/herramientas/calculadora-sueldo-neto/"],
    ["mi bici vuelve a pinchar", "/herramientas/por-que-vuelvo-pinchar-bicicleta/"],
    ["coser vaqueros con mi máquina", "/herramientas/configurar-maquina-coser-vaqueros/"],
    ["montaje para pescar dorada", "/herramientas/montaje-dorada-surfcasting/"],
    ["qué renta cuenta para la beca MEC", "/guias/beca-mec-renta-unidad-familiar/"]
];
for (const [query, expected] of examples) test(query, () => assert.equal(search(query)[0], expected));
test("buscar explícitamente una guía", () => assert.equal(search("guía paro")[0].startsWith("/guias/"), true));
test("acentos y mayúsculas no alteran el orden", () => assert.deepEqual(search("OVULACIÓN"), search("ovulacion")));
test("todas las soluciones se recuperan por su título", () => {
    for (const item of context.window.ImoancySearchIndex) assert.ok(search(item.title).includes(item.url), item.title);
});
test("una consulta ajena no devuelve resultados arbitrarios", () => assert.deepEqual(search("astronautas marcianos"), []));
test("vaciar la búsqueda cierra y limpia resultados y anuncio", () => {
    search("paro"); search("  ");
    assert.equal(panel.hidden, true); assert.equal(panel.children.length, 0); assert.equal(status.textContent, "");
});
test("resultados deterministas, únicos y limitados", () => {
    const result = search("bebé");
    assert.deepEqual(result, search("bebé")); assert.ok(result.length <= 6); assert.equal(new Set(result).size, result.length);
});
