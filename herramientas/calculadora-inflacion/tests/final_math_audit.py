"""Contraste Decimal independiente contra la API JavaScript real."""
from decimal import Decimal, getcontext
import json
from pathlib import Path
import subprocess

getcontext().prec = 70
root = Path(__file__).resolve().parents[1]
core = (root / "js" / "core.js").read_text(encoding="utf-8")
config = (root / "js" / "config.js").read_text(encoding="utf-8")
html = (root / "index.html").read_text(encoding="utf-8")

assert "document." not in core and "window." not in core
assert "localStorage" not in core and "fetch(" not in core
assert "toFixed" not in core and "toLocaleString" not in core and "Math.round" not in core
assert "js/core.js" in html, "Fase 2 debe consumir el motor congelado"
assert html.index('src="js/config.js"') < html.index('src="js/core.js"') < html.index('src="script.js"')
assert "Math.log1p" in core and "Math.exp" in core
assert "(1 + nominalChange) / inflation.factor - 1" in core

factor_cases = [
    ("3% x 10", "0.03", "10"),
    ("2% x 30", "0.02", "30"),
    ("0%", "0", "17"),
    ("-2% x 10", "-0.02", "10"),
    ("-50%", "-0.5", "1"),
    ("-99%", "-0.99", "1"),
    ("periodo 0", "7", "0"),
    ("0.5 años", "0.08", "0.5"),
    ("25.25 años", "0.04", "25.25"),
    ("inflación alta", "25", "4.5"),
]
comparison_cases = [
    ("1500 a 1750 vs 25%", "1500", "1750", "0.25"),
    ("+10% vs 10%", "100", "110", "0.10"),
    ("+5% vs 10%", "100", "105", "0.10"),
    ("+15% vs 10%", "100", "115", "0.10"),
]

js_factor_inputs = [{"inflationRate": float(rate), "years": float(years)} for _, rate, years in factor_cases]
js_comparison_inputs = [{"initialAmount": float(initial), "finalAmount": float(final), "cumulativeInflation": float(inflation)} for _, initial, final, inflation in comparison_cases]
probe = f"""
const auditFactors = {json.dumps(js_factor_inputs)}.map(x => InflationEngine.calculateCumulativeInflation(x).inflationFactor);
const auditReal = {json.dumps(js_comparison_inputs)}.map(x => InflationEngine.compareWithInflation(x).realChange);
JSON.stringify({{factors:auditFactors,real:auditReal}});
"""
process = subprocess.run(
    ["osascript", "-l", "JavaScript", "-e", config + "\n" + core + "\n" + probe],
    check=True, capture_output=True, text=True
)
actual = json.loads(process.stdout.strip())

maximum_relative_difference = Decimal(0)
print("REFERENCIAS_FACTOR")
for (name, rate, years), js_value in zip(factor_cases, actual["factors"]):
    expected = (Decimal(1) + Decimal(rate)) ** Decimal(years)
    observed = Decimal(str(js_value))
    difference = abs(observed - expected)
    relative = difference / abs(expected) if expected else difference
    maximum_relative_difference = max(maximum_relative_difference, relative)
    assert relative <= Decimal("5e-15")
    print(f"{name}: esperado={expected} js={observed} dif_abs={difference} dif_rel={relative}")

print("REFERENCIAS_FISHER")
for (name, initial, final, inflation), js_value in zip(comparison_cases, actual["real"]):
    nominal_factor = Decimal(final) / Decimal(initial)
    expected = nominal_factor / (Decimal(1) + Decimal(inflation)) - 1
    observed = Decimal(str(js_value))
    difference = abs(observed - expected)
    relative_scale = max(abs(expected), Decimal(1))
    relative = difference / relative_scale
    maximum_relative_difference = max(maximum_relative_difference, relative)
    assert relative <= Decimal("5e-15")
    print(f"{name}: esperado={expected} js={observed} dif_abs={difference} dif_esc={relative}")

print(f"AUDIT_OK: 14 referencias; diferencia relativa/escalada máxima={maximum_relative_difference}")
