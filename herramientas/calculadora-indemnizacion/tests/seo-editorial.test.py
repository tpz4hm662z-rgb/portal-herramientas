#!/usr/bin/env python3
"""Regresión estática de SEO, contenido editorial y activos protegidos."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "index.html"
CSS_PATH = ROOT / "style.css"
html = HTML_PATH.read_text(encoding="utf-8")
css = CSS_PATH.read_text(encoding="utf-8")
passed = 0


def check(condition, message):
    global passed
    if not condition:
        raise AssertionError(message)
    passed += 1


class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.attrs = []
        self.text = []
        self.json_blocks = []
        self._json = False
        self._json_parts = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.tags.append(tag)
        self.attrs.append((tag, values))
        if tag == "script" and values.get("type") == "application/ld+json":
            self._json = True
            self._json_parts = []

    def handle_endtag(self, tag):
        if tag == "script" and self._json:
            self.json_blocks.append("".join(self._json_parts))
            self._json = False

    def handle_data(self, data):
        if self._json:
            self._json_parts.append(data)
        else:
            self.text.append(data)


parser = AuditParser()
parser.feed(html)
visible = " ".join(parser.text)
attrs = parser.attrs

check(len([1 for tag in parser.tags if tag == "h1"]) == 1, "debe existir un solo H1")
check("Calculadora de Indemnización por Despido PRO | Imoancy" in html, "title PRO ausente")
description = "Calcula una estimación de indemnización por despido improcedente, objetivo o colectivo según salario, antigüedad y límites legales."
check(description in html, "description prevista ausente")
check('content="index,follow,max-image-preview:large"' in html, "robots incorrecto")
check('rel="canonical" href="https://imoancy.com/herramientas/calculadora-indemnizacion/"' in html, "canonical incorrecta")
check('property="og:title" content="Calculadora de Indemnización por Despido PRO | Imoancy"' in html, "OG title incorrecto")
check('name="twitter:title" content="Calculadora de Indemnización por Despido PRO | Imoancy"' in html, "Twitter title incorrecto")
check('../../assets/brand/favicon.ico' in html, "favicon ausente")
check('../../assets/brand/apple-touch-icon.png' in html, "apple touch icon ausente")
check(len(parser.json_blocks) == 1, "debe existir un bloque JSON-LD")
data = json.loads(parser.json_blocks[0])
graph = data["@graph"]
types = {item["@type"] for item in graph}
check(types == {"WebPage", "SoftwareApplication", "BreadcrumbList", "Organization"}, "tipos JSON-LD inesperados")
check("FAQPage" not in html, "FAQPage no debe existir")
check("AggregateRating" not in html and "Review" not in types, "ratings/reviews no permitidos")
check("LegalService" not in html, "LegalService no permitido")
check(any(item.get("@id", "").endswith("#webpage") for item in graph), "WebPage sin id propio")
check(any(item.get("@id", "").endswith("#software") for item in graph), "SoftwareApplication sin id propio")
software = next(item for item in graph if item["@type"] == "SoftwareApplication")
check(software["offers"]["price"] == "0", "precio gratuito incorrecto")
check(software["offers"]["priceCurrency"] == "EUR", "moneda incorrecta")
crumbs = next(item for item in graph if item["@type"] == "BreadcrumbList")
check([x["position"] for x in crumbs["itemListElement"]] == [1, 2], "breadcrumb inválido")
check(html.index('id="herramientas-relacionadas"') < html.index('class="guia-editorial"'), "orden editorial incorrecto")
for heading in (
    "Qué datos intervienen en el cálculo", "Tipos de extinción y cuantía orientativa",
    "Despido improcedente: regla de 33 días", "Contratos anteriores a febrero de 2012: transición 45/33",
    "Despido objetivo procedente: regla de 20 días", "Despido colectivo",
    "Cómo se obtiene el salario diario", "Antigüedad y prorrateo mensual",
    "Límites máximos que aplica la calculadora", "Indemnización y finiquito no son lo mismo",
    "Fin de contrato temporal", "Ejemplos de cálculo", "Metodología de la calculadora",
    "Alcance y limitaciones", "Preguntas frecuentes", "Fuentes y responsabilidad editorial"):
    check(heading in visible, f"sección ausente: {heading}")
check(len([1 for tag in parser.tags if tag == "details"]) == 16, "deben existir 16 FAQ")
check(len([1 for tag in parser.tags if tag == "summary"]) == 16, "cada FAQ debe tener summary")
check("3.575,00 €" in visible, "ejemplo post-2012 incorrecto")
check("8.075,00 €" in visible, "ejemplo transitorio incorrecto")
check("2.166,67 €" in visible, "ejemplo objetivo incorrecto")
check('href="https://imoancy.com/herramientas/calculadora-finiquito/"' in html, "enlace contextual a finiquito ausente")
check("Estatuto de los Trabajadores, texto consolidado (BOE)" in visible, "fuente BOE ausente")
check("Calculadora oficial del CGPJ" in visible, "fuente CGPJ ausente")
check("versión 0.6 actualizada a julio de 2026" in visible, "guía CGPJ ausente")
check("Última revisión: 13 de agosto de 2026" in visible, "fecha editorial ausente")
check("no asesoramiento jurídico" in visible, "limitación jurídica ausente")
check(".guia-editorial" in css, "estilos editoriales ausentes")
check("@media(max-width:700px)" in css, "breakpoint editorial ausente")
print(f"SEO/editorial: {passed} PASS, 0 FAIL")

