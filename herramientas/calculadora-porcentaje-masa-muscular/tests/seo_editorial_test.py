#!/usr/bin/env python3
"""Fase 3 static SEO/editorial audit; uses only Python's standard library."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, sys

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parents[1]
html = (BASE / "index.html").read_text(encoding="utf-8")
portal = (ROOT / "index.html").read_text(encoding="utf-8")
failures = []
passed = 0

def test(name, condition):
    global passed
    if condition:
        passed += 1
    else:
        failures.append(name)

def active_markup(source):
    source = re.sub(r'<template\b[^>]*>.*?</template>', '', source, flags=re.S | re.I)
    source = re.sub(r'<script\b[^>]*application/json-disabled[^>]*>.*?</script>', '', source, flags=re.S | re.I)
    return source

active = active_markup(html)
canonical = "https://imoancy.com/herramientas/calculadora-porcentaje-masa-muscular/"
new_name = "Calculadora de Masa Muscular Esquelética"

test("one concise title", len(re.findall(r'<title\b', active, re.I)) == 1 and f"{new_name} PRO | Imoancy" in active)
test("title length", 35 <= len(re.search(r'<title>(.*?)</title>', active, re.S).group(1).strip()) <= 65)
test("one meta description", len(re.findall(r'<meta\s+name="description"', active, re.I)) == 1)
test("description mentions kg and percentage", "en kg y porcentaje" in active[:6000])
test("one canonical", len(re.findall(r'<link\s+rel="canonical"', active, re.I)) == 1)
test("canonical historical URL", f'rel="canonical"\n        href="{canonical}"' in active)
test("one active H1", len(re.findall(r'<h1\b', active, re.I)) == 1)
test("exact H1", f'<h1 id="mm-title">{new_name}</h1>' in active)
test("Open Graph title", f'content="{new_name} PRO | Imoancy"' in active)
test("Open Graph historical URL", f'property="og:url"\n        content="{canonical}"' in active)
test("Twitter title", f'name="twitter:title"\n        content="{new_name} PRO | Imoancy"' in active)
test("no active old public name", "Calculadora de Porcentaje de Masa Muscular" not in active)

ld_blocks = re.findall(r'<script\s+type="application/ld\+json">(.*?)</script>', active, re.S | re.I)
test("one JSON-LD graph", len(ld_blocks) == 1)
try:
    graph = json.loads(ld_blocks[0])["@graph"]
except Exception as exc:
    failures.append(f"valid JSON-LD: {exc}")
    graph = []
types = {item.get("@type"): item for item in graph}
test("WebPage schema", types.get("WebPage", {}).get("name") == f"{new_name} PRO | Imoancy")
test("SoftwareApplication schema", types.get("SoftwareApplication", {}).get("name") == f"{new_name} PRO")
test("BreadcrumbList schema", types.get("BreadcrumbList", {}).get("itemListElement", [{}, {}])[-1].get("name") == new_name)
test("schema URL remains canonical", all(item.get("url", canonical) == canonical for item in graph if item.get("@type") in {"WebPage", "SoftwareApplication"}))
test("no invented ratings", not re.search(r'aggregateRating|reviewCount|ratingValue', active, re.I))
test("FAQPage intentionally omitted", 'FAQPage omitido:' in html and '"@type": "FAQPage"' not in html)

test("exact Lee equation", "SMM (kg) = 0,244 × peso + 7,80 × altura + 6,6 × sexo − 0,098 × edad + ajuste poblacional − 3,3" in active)
test("correct Lee DOI", "10.1093/ajcn/72.3.796" in active)
test("correct Janssen DOI", "10.1152/jappl.2000.89.1.81" in active)
test("Lee authors and pages", "Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB" in active and "72(3):796–803" in active)
test("Janssen authors and pages", "Janssen I, Heymsfield SB, Wang ZM, Ross R" in active and "89(1):81–88" in active)
test("SEE contextualized", "SEE aproximado de 2,8 kg" in active and "no debe leerse como ±2,8 kg" in active)
test("age policy", "20 a 81 años" in active)
test("BMI policy", "IMC ≥30" in active and "mayor cautela" in active)
test("MRI reference descriptive", "comparación descriptiva con la media MRI" in active)
test("Lee model described as validated against MRI", "ecuación antropométrica basada en MRI" not in active and active.count("ecuación antropométrica validada frente a MRI") >= 3 and active.count("ecuación antropométrica desarrollada y validada frente a MRI") >= 2)
test("advanced age limitation", "edades ≥70 tuvieron menor representación" in active)
test("muscle differs from lean mass", "Masa muscular y masa magra: no son lo mismo" in active)
test("eight visible FAQs", len(re.findall(r'<section id="preguntas-frecuentes".*?</section>', active, re.S)) == 1 and len(re.findall(r'<details>', re.search(r'<section id="preguntas-frecuentes".*?</section>', active, re.S).group(0))) == 8)
test("privacy claim matches local controller", not re.search(r'fetch\s*\(|XMLHttpRequest|sendBeacon', (BASE / "js/script.js").read_text()))

related = re.search(r'<section id="herramientas-relacionadas".*?</section>', active, re.S).group(0)
related_hrefs = re.findall(r'<a[^>]+href="([^"]+)"', related)
test("exactly three related cards", len(related_hrefs) == 3)
test("no related self-link", canonical not in related_hrefs)
test("three useful relations", all(fragment in " ".join(related_hrefs) for fragment in ["calculadora-grasa-corporal", "calculadora-porcentaje-grasa-ideal", "calculadora-proteinas"]))
test("related links map to local directories", all((ROOT / href.replace("https://imoancy.com/", "")).exists() for href in related_hrefs))
test("portal new name", f'<h3>{new_name} PRO</h3>' in portal and canonical in portal)
test("portal inventory remains 34", '"numberOfItems": 34' in portal and len(re.findall(r'"@type":"ListItem","position":\d+', portal)) == 34)
for incoming in [ROOT / "herramientas/calculadora-grasa-corporal/index.html", ROOT / "herramientas/calculadora-porcentaje-grasa-ideal/index.html"]:
    text = incoming.read_text(encoding="utf-8")
    test(f"incoming anchor updated: {incoming.parent.name}", "Calculadora de masa muscular esquelética" in text and canonical in text)

test("legacy content physically removed", '<template id="contenido-legado-inerte">' not in html and '<section class="hero">' not in active and 'nivelActividad' not in active)
test("no new slug", "/herramientas/calculadora-masa-muscular" not in html + portal)
test("no medical authority claims", not re.search(r'revisado por médicos|precisión médica|validado por Imoancy|herramienta clínica', active, re.I))

for failure in failures:
    print("FAIL", failure)
print(f"Fase 3 tests: {passed} PASS, {len(failures)} FAIL")
sys.exit(1 if failures else 0)
