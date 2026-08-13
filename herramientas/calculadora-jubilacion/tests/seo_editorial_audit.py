#!/usr/bin/env python3
"""Static SEO/editorial contract for Jubilación PRO Fase 3."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.headings, self.links, self.meta, self.title = set(), [], [], {}, ""
        self._heading = None
        self._title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            assert data["id"] not in self.ids, f"duplicate id: {data['id']}"
            self.ids.add(data["id"])
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._heading = [int(tag[1]), ""]
        if tag == "a":
            self.links.append(data.get("href", ""))
        if tag == "meta" and data.get("name"):
            self.meta[data["name"]] = data.get("content", "")
        if tag == "title":
            self._title = True

    def handle_endtag(self, tag):
        if self._heading and tag == f"h{self._heading[0]}":
            self.headings.append(tuple(self._heading))
            self._heading = None
        if tag == "title":
            self._title = False

    def handle_data(self, data):
        if self._heading:
            self._heading[1] += data.strip()
        if self._title:
            self.title += data.strip()


p = AuditParser()
p.feed(HTML)
assert p.title == "Calculadora de Jubilación 2026 PRO | Edad y Pensión | Imoancy"
assert 50 <= len(p.title) <= 65
assert 120 <= len(p.meta["description"]) <= 160
assert p.meta["robots"] == "index,follow,max-image-preview:large"
assert HTML.count('<link rel="canonical" href="https://imoancy.com/herramientas/calculadora-jubilacion/">') == 1
assert sum(level == 1 for level, _ in p.headings) == 1
for before, after in zip(p.headings, p.headings[1:]):
    assert after[0] <= before[0] + 1, f"heading jump: {before} -> {after}"
schemas = [json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>', HTML, re.S)]
assert len(schemas) == 1
types = {item["@type"] for item in schemas[0]["@graph"]}
assert types == {"Organization", "WebPage", "SoftwareApplication", "BreadcrumbList"}
assert "FAQPage" not in HTML and "AggregateRating" not in HTML and '"Review"' not in HTML
assert HTML.count("<details>") >= 17
for marker in ["Cómo calcula Imoancy tu jubilación", "Qué no calcula esta versión", "Editor responsable:", "13 de agosto de 2026", "Simulador oficial de jubilación"]:
    assert marker in HTML, marker
for href in [
    "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724",
    "https://www.boe.es/buscar/act.php?id=BOE-A-2023-11645",
    "https://www.boe.es/buscar/act.php?id=BOE-A-2024-26917",
    "https://www.boe.es/buscar/act.php?id=BOE-A-2026-11474",
    "https://imoancy.com/herramientas/calculadora-sueldo-neto/",
    "https://imoancy.com/herramientas/calculadora-finiquito/",
    "https://imoancy.com/herramientas/calculadora-indemnizacion/",
]:
    assert href in p.links, href
print("SEO/editorial: 25 PASS, 0 FAIL")
