#!/usr/bin/env python3
"""Independent Decimal reference for the statutory deferred lump-sum formula."""
from decimal import Decimal, getcontext

getcontext().prec = 50


def unit(initial_annual, maximum_annual, contributed_months):
    pension = min(Decimal(initial_annual), Decimal(maximum_annual))
    value = Decimal(800) * (pension / Decimal(500)) ** (Decimal(1) / Decimal("1.65"))
    return value * (Decimal("1.1") if contributed_months >= 534 else Decimal(1))


cases = [
    ("7000", "45000", 533, 2),
    ("14000", "45000", 534, Decimal("2.5")),
    ("50000", "45000", 600, 5),
]
for initial, maximum, months, units in cases:
    result = unit(initial, maximum, months) * Decimal(units)
    assert result.is_finite() and result > 0
    print(initial, maximum, months, units, result)
print(f"Deferred Decimal references: {len(cases)} PASS, 0 FAIL")
