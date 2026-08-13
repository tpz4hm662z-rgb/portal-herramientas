"""Auditoría final independiente de matemáticas, meses y extremos IEEE-754."""
from decimal import Decimal, getcontext
from pathlib import Path
import json, subprocess

getcontext().prec=80
root=Path(__file__).resolve().parents[1]
config=(root/"js/config.js").read_text(encoding="utf-8")
core=(root/"js/core.js").read_text(encoding="utf-8")

factor_cases=[
 ("cero",Decimal("0"),Decimal("40")),
 ("positiva",Decimal("0.03"),Decimal("10")),
 ("deflacion",Decimal("-0.02"),Decimal("10")),
 ("cerca menos cien",Decimal("-0.999999"),Decimal("1")),
 ("un mes",Decimal("0.12"),Decimal(1)/Decimal(12)),
 ("doce meses",Decimal("0.12"),Decimal("1")),
 ("dieciocho meses",Decimal("0.04"),Decimal("1.5")),
 ("fraccionario",Decimal("0.025"),Decimal("25.25")),
 ("periodo cero",Decimal("999"),Decimal("0")),
 ("cantidad pequena",Decimal("0.07"),Decimal("0.01")),
 ("inflacion alta",Decimal("25"),Decimal("4.5")),
]
inputs=[{"amount":float(Decimal("0") if name=="cero" else Decimal("1e-100") if name=="cantidad pequena" else Decimal("10000")),"inflationRate":float(rate),"years":float(years)} for name,rate,years in factor_cases]
comparisons=[
 {"initialAmount":1500,"finalAmount":1750,"cumulativeInflation":.25},
 {"initialAmount":100,"finalAmount":110,"cumulativeInflation":.1},
 {"initialAmount":100,"finalAmount":100,"cumulativeInflation":0},
 {"initialAmount":100,"finalAmount":100,"cumulativeInflation":-.1},
 {"initialAmount":1e-100,"finalAmount":1.1e-100,"cumulativeInflation":.03},
]
probe=f'''const A={json.dumps(inputs)}.map(x=>InflationEngine.calculatePurchasingPower(x));
const B={json.dumps(comparisons)}.map(x=>InflationEngine.compareWithInflation(x));
const C=[
 InflationEngine.calculatePurchasingPower({{amount:0,inflationRate:Number.MAX_VALUE,years:Number.MAX_VALUE}}),
 InflationEngine.calculateCumulativeInflation({{inflationRate:-.9999999999999999,years:1000}}),
 InflationEngine.calculatePurchasingPower({{amount:Number.MAX_VALUE,inflationRate:1,years:1}}),
 InflationEngine.calculatePurchasingPower({{amount:-0,inflationRate:-0,years:-0}})
]; JSON.stringify({{A,B,C}});'''
run=subprocess.run(["osascript","-l","JavaScript","-e",config+"\n"+core+"\n"+probe],capture_output=True,text=True,check=True)
actual=json.loads(run.stdout.strip())

checks=0
def check(condition,message):
 global checks
 if not condition: raise AssertionError(message)
 checks+=1
def close(observed,expected,tolerance=Decimal("3e-14")):
 observed=Decimal(str(observed)); scale=max(abs(expected),Decimal(1)); check(abs(observed-expected)<=tolerance*scale,f"{observed} != {expected}")

for (name,rate,years),given,result in zip(factor_cases,inputs,actual["A"]):
 # Decimal reproduce aquí el número binario que realmente cruza la API JS,
 # no el literal humano previo a su conversión IEEE-754.
 input_rate=Decimal.from_float(given["inflationRate"]); input_years=Decimal.from_float(given["years"])
 factor=(Decimal(1)+input_rate)**input_years
 amount=Decimal.from_float(given["amount"]); cumulative=factor-1; future=amount*factor; real=amount/factor; power=Decimal(1)/factor-1
 check(result["status"]=="OK",name); close(result["inflationFactor"],factor); close(result["cumulativeInflation"],cumulative); close(result["futureEquivalent"],future); close(result["realValue"],real); close(result["purchasingPowerChange"],power)

for given,result in zip(comparisons,actual["B"]):
 initial=Decimal(str(given["initialAmount"])); final=Decimal(str(given["finalAmount"])); inflation=Decimal(str(given["cumulativeInflation"])); nominal=final/initial-1; real=(1+nominal)/(1+inflation)-1
 check(result["status"]=="OK","comparison"); close(result["nominalChange"],nominal); close(result["realChange"],real)

check(actual["C"][0]["status"]=="INVALID_INPUT","zero times overflow")
check(actual["C"][1]["status"]=="INVALID_INPUT","underflow")
check(actual["C"][2]["status"]=="INVALID_INPUT","monetary overflow")
check(actual["C"][3]["status"]=="OK","negative zero")
factor=Decimal("1.03")**10
check(factor-1 != -(Decimal(1)/factor-1),"inflation is not symmetric purchasing-power loss")
check((Decimal("1.1")/Decimal("1.1")-1)==0,"Fisher equality")
print(json.dumps({"total":checks,"passed":checks,"failed":0},ensure_ascii=False))
