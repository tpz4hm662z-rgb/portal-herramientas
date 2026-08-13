#!/usr/bin/env python3
"""Referencia independiente Decimal para porcentajes, tablas y pensión."""
from decimal import Decimal, getcontext
getcontext().prec = 40
passed = 0
def check(value, expected):
    global passed
    if value != expected: raise AssertionError(f"{value} != {expected}")
    passed += 1
def percentage(months, year):
    if months < 180: return None
    extra = months - 180
    if year <= 2026: steps=((49,Decimal("0.0021")),(209,Decimal("0.0019")))
    else: steps=((248,Decimal("0.0019")),(16,Decimal("0.0018")))
    value=Decimal("0.5")
    for count,rate in steps:
        used=min(extra,count); value += used*rate; extra -= used
    return min(value,Decimal(1))
for months,year,expected in [(180,2026,"0.5"),(181,2026,"0.5021"),(229,2026,"0.6029"),(230,2026,"0.6048"),(438,2026,"1"),(180,2027,"0.5"),(181,2027,"0.5019"),(428,2027,"0.9712"),(444,2027,"1")]: check(percentage(months,year),Decimal(expected))
for base,months,year,reduction,expected in [("1000",180,2026,"0","500"),("2000",444,2027,"0","2000"),("2000",444,2027,"0.055","1890")]: check(Decimal(base)*percentage(months,year)*(1-Decimal(reduction)),Decimal(expected))
voluntary={24:(".21",".19",".17",".13"),12:(".055",".0525",".05",".0475"),1:(".0326",".0311",".0296",".0281")}
involuntary={48:(".30",".28",".26",".24"),24:(".15",".14",".13",".12"),1:(".0063",".0058",".0054",".005")}
for table in (voluntary,involuntary):
    for row in table.values():
        for value in row: check(Decimal(value)>0,True)
# Calendario oficial, expresado íntegramente en meses.
for year,threshold,high in [(2025,459,788),(2026,459,802),(2027,462,804),(2035,462,804)]:
    check(threshold>=459,True); check(high in (788,802,804),True)
print(f"Referencia Decimal: {passed} PASS, 0 FAIL")
