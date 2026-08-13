#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import hashlib, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
EXPECTED = {
    "js/core.js": "8152f262dd1f020da34cbc76b966fdc3fe5ffced716d1f9f64f7ce6c22ee4369",
    "js/config.js": "f1a1dd6ba476760cc633c55526747683d651a82f04aac9085d6e0b133b6a355c",
}

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags=[]; self.ids=[]; self.links=[]; self.jsonld=[]; self.in_json=False; self.buffer=[]
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.tags.append(tag)
        if "id" in data: self.ids.append(data["id"])
        if tag == "a": self.links.append(data)
        if tag == "script" and data.get("type") == "application/ld+json": self.in_json=True; self.buffer=[]
    def handle_data(self, data):
        if self.in_json: self.buffer.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self.in_json: self.jsonld.append(json.loads("".join(self.buffer))); self.in_json=False

p=AuditParser(); p.feed(HTML)
tests=[]
def check(name, condition): tests.append((name, bool(condition)))
def meta(name=None, prop=None):
    pattern = rf'<meta\s+[^>]*{("name="+chr(34)+re.escape(name)+chr(34)) if name else ("property="+chr(34)+re.escape(prop)+chr(34))}[^>]*content="([^"]+)"'
    match=re.search(pattern, HTML, re.I); return match.group(1) if match else ""

title=re.search(r"<title>(.*?)</title>",HTML,re.S).group(1)
check("title", title == "Calculadora de Rentabilidad de Inversiones PRO | Imoancy")
check("meta description", 120 <= len(meta(name="description")) <= 165 and "rentabilidad" in meta(name="description").lower())
check("canonical", 'rel="canonical" href="https://imoancy.com/herramientas/calculadora-rentabilidad-inversiones/"' in HTML)
check("H1 único", len(re.findall(r"<h1\b",HTML,re.I)) == 1)
check("headings H2/H3", len(re.findall(r"<h2\b",HTML,re.I)) >= 10 and len(re.findall(r"<h3\b",HTML,re.I)) >= 5)
check("Open Graph", all(meta(prop=x) for x in ["og:title","og:description","og:url","og:image"]))
check("Twitter", all(meta(name=x) for x in ["twitter:card","twitter:title","twitter:description","twitter:image"]))
check("apple touch icon", 'rel="apple-touch-icon" href="../../assets/brand/apple-touch-icon.png"' in HTML and (ROOT / "../../assets/brand/apple-touch-icon.png").resolve().exists())
graph=p.jsonld[0]["@graph"]
types={item["@type"] for item in graph}
check("JSON-LD types", {"WebPage","SoftwareApplication","BreadcrumbList","Organization"} <= types)
check("sin FAQPage", "FAQPage" not in types and '"FAQPage"' not in HTML)
check("FAQ visible", len(re.findall(r'<section id="preguntas-frecuentes"',HTML)) == 1 and len(re.findall(r'<details><summary>',HTML)) >= 12)
check("IDs únicos", len(p.ids) == len(set(p.ids)))
check("enlaces externos seguros", all(a.get("target") != "_blank" or "noopener" in a.get("rel","") for a in p.links))
check("fuentes oficiales", all(domain in HTML for domain in ["cnmv.es","bde.es","support.microsoft.com"]) and "Ficha_Tarifas.pdf" in HTML and "investor.gov" not in HTML)
check("enlaces internos", all(path in HTML for path in ["calculadora-interes-compuesto-avanzada","calculadora-inflacion","calculadora-ahorro"]))
check("metodología", 'id="metodologia"' in HTML and "Actual/365" in HTML and "XNPV" in HTML and "XIRR" in HTML)
check("ejemplo XIRR reproducible", all(text in HTML for text in ["1 de enero de 2021","1 de julio de 2022","1 de enero de 2024","5,7458 % anual"]))
check("limitaciones", "Limitaciones que debes conocer" in HTML and "no garantiza" in HTML.lower())
check("sin metadata heredada", "Calcula cuánto podría crecer una inversión con aportaciones mensuales" not in HTML)
check("sin rating inventado", "AggregateRating" not in HTML and '"review"' not in HTML)
check("motor intacto", all(hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest for path,digest in EXPECTED.items()))

failed=[name for name,ok in tests if not ok]
print(json.dumps({"total":len(tests),"passed":len(tests)-len(failed),"failed":len(failed),"failures":failed},ensure_ascii=False))
sys.exit(bool(failed))
