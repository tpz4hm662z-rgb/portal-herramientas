#!/usr/bin/env python3
from datetime import date
from math import isfinite
import json, sys

tests=[]
def check(name, condition): tests.append((name,bool(condition)))
def close(a,b,t=1e-10): return abs(a-b)<=t*max(1,abs(b))
def xnpv(rate, flows):
    first=date.fromisoformat(flows[0][0])
    return sum(amount/(1+rate)**((date.fromisoformat(day)-first).days/365) for day,amount in flows)
def bisect(flows, left=-.999999999, right=1_000_000):
    # Barrido logarítmico independiente seguido de bisección aritmética.
    from math import exp, log1p
    last=left; fl=xnpv(last,flows); lo=log1p(left); hi=log1p(right)
    for i in range(1,200001):
        current=exp(lo+(hi-lo)*i/200000)-1; fc=xnpv(current,flows)
        if fl*fc<0:
            a,b=last,current
            for _ in range(250):
                mid=(a+b)/2
                if xnpv(a,flows)*xnpv(mid,flows)<=0: b=mid
                else: a=mid
            return (a+b)/2
        last,fl=current,fc
    return None

# Fórmulas principales, recalculadas sin importar el motor JavaScript.
initial,final,income,costs=10000,10800,400,150
profit=final-initial; gross=final+income-initial; net=gross-costs
check("beneficio",profit==800); check("beneficio bruto",gross==1200); check("beneficio neto",net==1050)
check("ROI",close(profit/initial,.08)); check("ROI bruto",close(gross/initial,.12)); check("ROI neto",close(net/initial,.105)); check("multiplicador",close(final/initial,1.08))
days=(date(2024,1,1)-date(2021,1,1)).days; years=days/365
check("duración Actual/365",days==1095 and years==3)
check("CAGR ejemplo 1",close((12500/10000)**(1/years)-1,.07721734501594191))
check("pérdida -100%",(0-10000)/10000==-1); check("break-even",(10000-10000)/10000==0)
check("periodo inferior a año",close((110/100)**(365/182)-1,.2106338215370842))
check("Fisher",close((1.06/1.03)-1,.029126213592232997))
check("Fisher inflación negativa",isfinite((1.05/(1-.999999))-1))
simple=[("2021-01-01",-1000),("2022-01-01",1100)]
check("XNPV simple",close(xnpv(.1,simple),0))
check("XIRR simple",close(bisect(simple),.1,1e-9))
example3=[("2021-01-01",-10000),("2022-07-01",-2000),("2024-01-01",14000)]
check("XIRR ejemplo 3",close(bisect(example3),.05745784115675619,1e-9))
multiple=[("2021-01-01",-100),("2022-01-01",230),("2023-01-01",-132)]
check("múltiples raíces conocidas",close(xnpv(.1,multiple),0) and close(xnpv(.2,multiple),0))

failed=[name for name,ok in tests if not ok]
print(json.dumps({"total":len(tests),"passed":len(tests)-len(failed),"failed":len(failed),"failures":failed},ensure_ascii=False))
sys.exit(bool(failed))
