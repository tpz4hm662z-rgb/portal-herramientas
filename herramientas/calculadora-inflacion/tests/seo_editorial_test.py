"""Auditoría SEO/editorial reproducible sin dependencias externas."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from decimal import Decimal, getcontext
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
CANONICAL = "https://imoancy.com/herramientas/calculadora-inflacion/"
EXPECTED_HASHES = {
    "core.js": "0715f5161b732815fe75e8c7c03477a0e22e213a7d411aabe61b68d9c76c3d7b",
    "config.js": "82a9b8333b34d410e6caf662508d03eaadf2da2da3b90dd59b29ac2caf4bbaae",
}

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title = ""; self.in_title = False; self.tags=[]; self.links=[]; self.metas=[]; self.scripts=[]; self.ids=set()
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.tags.append((tag,data));
        if tag=="title": self.in_title=True
        if tag=="a": self.links.append(data.get("href",""))
        if tag=="meta": self.metas.append(data)
        if tag=="script": self.scripts.append(data)
        if data.get("id"): self.ids.add(data["id"])
    def handle_endtag(self, tag):
        if tag=="title": self.in_title=False
    def handle_data(self, data):
        if self.in_title: self.title += data

p=AuditParser(); p.feed(HTML)
checks=[]
def check(name, condition):
    if not condition: raise AssertionError(name)
    checks.append(name)
def meta(key,value): return next((x.get("content") for x in p.metas if x.get(key)==value),None)

check("title", p.title == "Calculadora de Inflación y Poder Adquisitivo PRO | Imoancy" and len(p.title)<=65)
description=meta("name","description"); check("meta description", description and 120<=len(description)<=165 and "IPC oficial" not in description)
canonical=next((x.get("href") for tag,x in p.tags if tag=="link" and x.get("rel")=="canonical"),None); check("canonical",canonical==CANONICAL)
check("Open Graph",meta("property","og:title")==p.title and meta("property","og:url")==CANONICAL and meta("property","og:description"))
check("Twitter",meta("name","twitter:title")==p.title and meta("name","twitter:url")==CANONICAL and meta("name","twitter:description"))
check("lang y viewport",'<html lang="es">' in HTML and meta("name","viewport"))
check("favicon y apple touch",'rel="icon"' in HTML and 'rel="apple-touch-icon"' in HTML)
check("H1 único",len(re.findall(r"<h1(?:\s|>)",HTML,re.I))==1)
check("headings",len(re.findall(r"<h2(?:\s|>)",HTML,re.I))>=10 and not re.search(r"<h[4-6](?:\s|>)",HTML,re.I))

json_texts=re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>',HTML,re.S)
check("un JSON-LD parseable",len(json_texts)==1)
graph=json.loads(json_texts[0])["@graph"]; types={item["@type"] for item in graph}
check("tipos JSON-LD",types=={"Organization","WebPage","SoftwareApplication","BreadcrumbList"})
check("URLs JSON-LD",next(x for x in graph if x["@type"]=="WebPage")["url"]==CANONICAL)
check("sin ratings falsos",not re.search(r"aggregateRating|review|award|certif",json_texts[0],re.I))
check("sin FAQPage",'FAQPage' not in json_texts[0])
check("16 FAQ visibles",len(re.findall(r"<details>",HTML))==16 and len(re.findall(r"<summary>",HTML))==16)
check("metodología",'id="metodologia"' in HTML and "Cambio de poder adquisitivo" in HTML and "Cambio real" in HTML)
for formula in ["(1 + i)<sup>n</sup> − 1","cantidad actual × (1 + i)<sup>n</sup>","valor final / valor inicial − 1","meses / 12"]: check(f"fórmula {formula}",formula in HTML)
check("limitaciones",all(text in HTML for text in ["tasa anual constante","no equivale al IPC realmente observado","No actualiza alquileres ni aplica IRAV","No calcula impuestos"]))
check("distinción IPC",all(text in HTML for text in ["no es un índice exacto del coste de la vida","no reproduce la experiencia de precios concreta","no calcula automáticamente el IPC histórico oficial"]))
check("fuentes oficiales",all(host in HTML for host in ["www.ine.es","ine.es/calcula/","www.bde.es","www.ecb.europa.eu"]))
check("enlace calculadora INE",'https://ine.es/calcula/index.do?lang=es' in HTML)
check("responsabilidad y fecha",'Editor responsable: Imoancy' in HTML and '13 de agosto de 2026' in HTML and 'Responsabilidad editorial' in HTML)
check("sin EEAT inventado",not re.search(r"revisado por (economista|asesor)|certificado por|premiado por",HTML,re.I))
check("calculadora antes de relacionados y guía",HTML.index('class="calculadora"') < HTML.index('id="herramientas-relacionadas"') < HTML.index('class="guia-inflacion"'))
check("GA4 único",HTML.count('gtag("config","G-QH8MJ6LVHN")')==1)
script=(ROOT/"script.js").read_text(encoding="utf-8"); check("privacidad eventos",'{ tool_name: "inflation", mode: activeMode }' in script and not re.search(r"gtag\([^\n]*(amount|rate|period|result)",script,re.I))
check("sin localhost ni rutas locales",not re.search(r"localhost|127\.0\.0\.1|file://|/Users/",HTML))

internal=[]
for href in p.links:
    if href.startswith("#"): check(f"ancla {href}",href[1:] in p.ids)
    elif href.startswith("https://imoancy.com/herramientas/"):
        check(f"sin autoenlace {href}",href!=CANONICAL); internal.append(href)
        slug=urlparse(href).path.rstrip("/").split("/")[-1]
        check(f"destino interno {slug}",(ROOT.parent/slug/"index.html").exists())
check("malla interna",len(set(internal))>=3)
for src in re.findall(r'(?:src|href)="((?:\.\.?/)[^"]+)"',HTML):
    path=(ROOT/src).resolve(); check(f"recurso local {src}",path.exists())

for name,expected in EXPECTED_HASHES.items():
    actual=hashlib.sha256((ROOT/"js"/name).read_bytes()).hexdigest(); check(f"hash {name}",actual==expected)

getcontext().prec=50
factor=(Decimal(1)+Decimal("0.03"))**10
future=Decimal(10000)*factor; real=Decimal(10000)/factor; power=Decimal(1)/factor-1
check("ejemplo 10000",future.quantize(Decimal("0.01"))==Decimal("13439.16") and real.quantize(Decimal("0.01"))==Decimal("7440.94") and (power*100).quantize(Decimal("0.01"))==Decimal("-25.59"))
nominal=Decimal(1750)/Decimal(1500)-1; fisher=(Decimal(1)+nominal)/Decimal("1.25")-1
check("ejemplo salario",abs(nominal-Decimal("0.1666666666666666666666666667"))<Decimal("1e-27") and abs(fisher-Decimal("-0.06666666666666666666666666664"))<Decimal("1e-27"))
check("cifras publicadas",all(x in HTML for x in ["13.439,16 €","7.440,94 €","−25,59 %","+16,67 %","−6,67 %"]))

print(json.dumps({"total":len(checks),"passed":len(checks),"failed":0},ensure_ascii=False))
