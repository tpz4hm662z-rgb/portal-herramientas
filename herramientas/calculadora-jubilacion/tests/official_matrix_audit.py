#!/usr/bin/env python3
"""Contrasta las 288 celdas directamente contra la tabla LGSS publicada en BOE."""
import json, subprocess, sys
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen

BASE=Path(__file__).resolve().parents[1]
URL="https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724"
class Text(HTMLParser):
    def __init__(self): super().__init__(); self.values=[]
    def handle_data(self,data):
        value=" ".join(data.split())
        if value:self.values.append(value)
parser=Text(); parser.feed(urlopen(URL,timeout=30).read().decode("utf-8","ignore"))

def official(article,max_months):
    start=parser.values.index(article)
    marker=parser.values.index("Meses que se adelanta la jubilación",start)
    cells=parser.values[marker+5:marker+5+max_months*5]
    if len(cells)!=max_months*5: raise AssertionError("tabla oficial incompleta")
    result={}
    for i in range(0,len(cells),5):
        month=int(cells[i]); result[month]=[Decimal(x.replace(",","."))/100 for x in cells[i+1:i+5]]
    if set(result)!=set(range(1,max_months+1)):raise AssertionError("meses oficiales incompletos")
    return result

process=subprocess.run(["osascript","-l","JavaScript",str(BASE/"tests/dump-normativa-jxa.js"),str(BASE)],text=True,capture_output=True,check=True)
lines=(process.stdout+"\n"+process.stderr).splitlines()
engine=json.loads(next(line for line in lines if line.startswith('{"voluntary"')))
cases=[("voluntary","Artículo 208. Jubilación anticipada por voluntad del interesado.",24),("involuntary","Artículo 207. Jubilación anticipada por causa no imputable al trabajador.",48)]
passed=0
for key,article,count in cases:
    expected=official(article,count); actual={row["monthsEarly"]:[Decimal(str(x)) for x in row["rates"]] for row in engine[key]}
    for month in range(1,count+1):
        for band in range(4):
            if abs(actual[month][band]-expected[month][band])>Decimal("1e-15"):raise AssertionError(f"{key} mes {month} tramo {band}: {actual[month][band]} != {expected[month][band]}")
            passed+=1
print(f"Matriz oficial: {passed}/288 PASS, 0 FAIL")
