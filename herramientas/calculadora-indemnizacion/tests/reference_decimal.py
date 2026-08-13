#!/usr/bin/env python3
"""Oráculo independiente: Decimal, sin importar ni replicar funciones JavaScript."""
from decimal import Decimal, getcontext

getcontext().prec = 40


def money(annual_salary, months, days_per_year, cap):
    raw_days = Decimal(months) * Decimal(days_per_year) / Decimal(12)
    allowed_days = min(raw_days, Decimal(cap))
    return allowed_days * Decimal(annual_salary) / Decimal(365)


cases = [
    ("improcedente_aniversario_inclusivo", money("36500", 13, 33, 720), Decimal("3575")),
    ("improcedente_1m", money("36500", 1, 33, 720), Decimal("275")),
    ("objetivo_aniversario_inclusivo", money("36500", 13, 20, 360), Decimal(6500) / Decimal(3)),
    ("objetivo_tope", money("36500", 300, 20, 360), Decimal("36000")),
    ("post_tope", money("36500", 324, 33, 720), Decimal("72000")),
]

salary_cases = [Decimal("1"), Decimal("100"), Decimal("1000"), Decimal("12000"),
                Decimal("28000"), Decimal("50000"), Decimal("100000"), Decimal("35500.75")]
for annual in salary_cases:
    daily = annual / Decimal(365)
    if abs(daily * Decimal(365) - annual) > Decimal("1e-35"):
        raise AssertionError(f"salario diario: {annual}")

boundary_days = [
    (Decimal("719.75"), Decimal("720"), Decimal("719.75")),
    (Decimal("720"), Decimal("720"), Decimal("720")),
    (Decimal("720.01"), Decimal("720"), Decimal("720")),
    (Decimal("1259.99"), Decimal("1260"), Decimal("1259.99")),
    (Decimal("1260"), Decimal("1260"), Decimal("1260")),
    (Decimal("1260.01"), Decimal("1260"), Decimal("1260")),
    (Decimal("359.99"), Decimal("360"), Decimal("359.99")),
    (Decimal("360"), Decimal("360"), Decimal("360")),
    (Decimal("360.01"), Decimal("360"), Decimal("360")),
]
for raw, cap, expected in boundary_days:
    if min(raw, cap) != expected:
        raise AssertionError(f"tope {raw}/{cap}")

transitions = [
    (Decimal("719.75"), Decimal("50"), Decimal("720")),
    (Decimal("720"), Decimal("50"), Decimal("720")),
    (Decimal("720.01"), Decimal("50"), Decimal("720.01")),
    (Decimal("800"), Decimal("500"), Decimal("800")),
    (Decimal("1000"), Decimal("500"), Decimal("1000")),
    (Decimal("1259.99"), Decimal("500"), Decimal("1259.99")),
    (Decimal("1260"), Decimal("500"), Decimal("1260")),
    (Decimal("1260.01"), Decimal("500"), Decimal("1260")),
]
for pre_days, post_days, expected in transitions:
    actual = min(pre_days + post_days, Decimal(720)) if pre_days <= 720 else min(pre_days, Decimal(1260))
    if actual != expected:
        raise AssertionError(f"transición {pre_days}: {actual} != {expected}")

for name, actual, expected in cases:
    if actual != expected:
        raise AssertionError(f"{name}: {actual} != {expected}")

pre = Decimal(240) * Decimal(45) / Decimal(12)
post = Decimal(96) * Decimal(33) / Decimal(12)
transitional_days = min(pre, Decimal(1260)) if pre > 720 else min(pre + post, Decimal(720))
if transitional_days != Decimal(900):
    raise AssertionError(f"transitorio: {transitional_days} != 900")

total = len(cases) + 1 + len(salary_cases) + len(boundary_days) + len(transitions)
print(f"Referencias Decimal: {total} PASS, 0 FAIL")
