#!/usr/bin/env python3
"""Regenera el catálogo estático; --check detecta páginas o metadata desactualizadas."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/search-index.js"
# Vocabulario de recuperación, no contenido ni metadata SEO.
ALIASES = {
    "comprobador-permisos-laborales-familiares": "permiso permisos dias hospitalizacion hospital ingresado ingreso operacion operar reposo enfermedad grave fallecimiento muerte madre padre hermano hermana suegra suegro cunado abuelo nieto sobrino conviviente familiar cuidados",
    "baja-voluntaria-nuevo-trabajo-paro": "dejar deje renunciar renuncie trabajo empleo cobrar paro dimision periodo prueba",
    "excedencia-voluntaria-trabajar-otra-empresa-paro": "excedencia trabajar empresa empleo cobrar paro",
    "reduccion-jornada-cuidado-hijo-despido-paro": "reducida reduccion jornada despiden despido hijo hija hijos paro",
    "adaptacion-jornada-cuidado-hijos": "cambiar horario conciliar conciliacion cuidar hijo hija hijos sin reducir sueldo",
    "turno-fijo-manana-cuidado-hijos": "pedir solicitar turno fijo manana cuidar hijo hija hijos horario",
    "se-acaba-contrato-estando-baja": "termina termina contrato acaba baja medica enfermedad quien paga",
    "vacaciones-no-disfrutadas-paro": "vacaciones pendientes pagadas disfrutar solicitar paro",
    "cobrando-paro-encontrado-trabajo-prestacion": "cobro cobrando paro encontre encontrado trabajo compatibilidad empleo",
    "beca-mec-renta-unidad-familiar": "beca becas mec familia familiar miembros padres separados custodia renta ingresos",
    "transferencia-cuenta-equivocada-recuperar-dinero": "enviado envie dinero transferencia cuenta equivocada error iban banco recuperar",
    "vendi-coche-comprador-no-cambia-titularidad": "vendido vendi coche comprador nombre titularidad transferencia vehiculo",
    "comprar-coche-segunda-mano-sin-historial-mantenimiento": "comprar coche usado segunda mano historial mantenimiento facturas",
    "coche-alquiler-cargos-inesperados": "alquile alquiler coche cobrado cargo deposito fianza franquicia",
    "actas-comunidad-antes-comprar-piso": "comprar piso vivienda comunidad actas derramas deudas",
    "comparar-presupuestos-reforma-partidas-diferentes": "comparar presupuestos reforma obras partidas precio",
    "calculadora-de-edad-corregida-para-bebes-prematuros": "edad bebe prematuro prematuros nacio antes tiempo semanas",
    "calculadora-de-peso-fetal-estimado": "peso bebe embarazo ecografia informe hadlock fl ac hc pfe feto fetal",
    "contador-de-contracciones-de-parto-pro": "contar medir cronometrar contracciones parto cronometro",
    "calculadora-agua-diaria": "agua beber hidratacion sudor sudoracion ejercicio deporte",
    "calculadora-ovulacion": "ovular ovulacion dias fertiles fertilidad ciclo menstruacion",
    "calculadora-calorias": "calorias comer diarias energia ejercicio alimentacion",
    "calculadora-sueldo-neto": "salario sueldo bruto neto nomina cobro cobrar",
    "calculadora-ahorro": "ahorrar ahorro dinero mes objetivo",
    "calculadora-interes-compuesto-avanzada": "invertir inversion interes compuesto aportaciones",
    "calculadora-inflacion": "inflacion poder adquisitivo dinero precios ipc",
    "calculadora-tela-cortinas": "cuanta tela cortinas visillos fruncido frunce 140 280 300 onda perfecta ollaos tablas metros costura",
    "montaje-dorada-surfcasting": "pescar pesca dorada surfcasting montaje aparejo mar playa cebo depende",
    "configurar-maquina-coser-vaqueros": "coser vaqueros jeans denim maquina aguja hilo puntada depende",
    "por-que-vuelvo-pinchar-bicicleta": "bici bicicleta pincho pinchar pinchazo pinchazos rueda camara depende",
}
DEPENDE = {"montaje-dorada-surfcasting", "configurar-maquina-coser-vaqueros", "por-que-vuelvo-pinchar-bicicleta"}


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.in_title = False
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "meta" and attrs.get("name") == "description":
            self.description = attrs.get("content", "")
        if tag == "meta" and attrs.get("name") == "robots":
            self.noindex = "noindex" in attrs.get("content", "").lower()
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def build():
    records = []
    for folder in ("guias", "herramientas"):
        for page in sorted((ROOT / folder).glob("*/index.html")):
            meta = Metadata()
            meta.feed(page.read_text())
            if meta.noindex:
                continue
            expected = "https://imoancy.com/" + page.relative_to(ROOT).as_posix().removesuffix("index.html")
            if meta.canonical != expected or not meta.title or not meta.description:
                raise ValueError(f"Metadata incompleta o canonical inesperado: {page}")
            slug = page.parent.name
            records.append({
                "url": expected.removeprefix("https://imoancy.com"),
                "title": meta.title.split(" | Imoancy")[0].strip(),
                "description": meta.description,
                "type": "Guía" if folder == "guias" else "DEPENDE™" if slug in DEPENDE else "Herramienta",
                "terms": ALIASES.get(slug, ""),
            })
    return "// Generado por scripts/build_search_index.py. No editar a mano.\nwindow.ImoancySearchIndex = " + json.dumps(records, ensure_ascii=False, indent=2) + ";\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != content:
            raise SystemExit("Catálogo desactualizado: ejecuta python3 scripts/build_search_index.py")
        print("Catálogo actualizado")
    else:
        OUTPUT.write_text(content)
        print("Catálogo generado")
