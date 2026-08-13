# Rentabilidad de Inversiones PRO v1.0 — Fase 1

Motor puro en `js/core.js`, desacoplado de la interfaz heredada. Las tasas son decimales (0.07 = 7 %) y todos los importes/resultados son números sin formato.

## Semántica

- `profit`: valor final menos inversión inicial.
- `grossProfit`: valor final más ingresos menos inversión inicial.
- `netProfit`: beneficio bruto menos costes.
- Los tres retornos usan la inversión inicial como denominador.
- `multiple` es estrictamente `finalValue / initialInvestment`; no incorpora ingresos.
- `cagr` usa estrictamente el valor terminal y solo existe sin flujos intermedios. Un valor terminal cero no tiene CAGR real finita y devuelve `null`.
- Con flujos fechados, `xirr` sustituye al CAGR como tasa nominal anualizada. El valor terminal de una inversión abierta se expresa como flujo positivo virtual, sin implicar una venta.
- Las diferencias usan días civiles UTC y el año financiero fijo de 365 días, compatible con XIRR/XNPV de Excel. Los años bisiestos sí afectan a los días transcurridos.

## API

`calculateInvestmentReturn(input)`, `xnpv(rate, cashFlows)`, `calculateXirr(cashFlows)` y `normalizeCashFlows(cashFlows)`.

Los flujos tienen `{ date: "YYYY-MM-DD", amount }`; aportaciones son negativas y cobros positivos. Se ordenan y se agregan por fecha sin mutar la entrada.

## Resolución XIRR

Se prueban iteraciones Newton controladas desde varias semillas y, de forma independiente, se recorre uniformemente `log(1+r)` dentro de los límites configurados. Cada cambio de signo se resuelve por bisección también en espacio logarítmico. Las raíces se verifican contra XNPV, se deduplican y se devuelven todas si hay más de una (`MULTIPLE_XIRR`), sin elegir una arbitrariamente.

La densidad del barrido incluye como regresión dos raíces anuales conocidas al 10 % y 11 %. No constituye una garantía para separaciones arbitrariamente pequeñas.

Limitación inevitable: en un intervalo continuo finito ningún muestreo puede demostrar que no existen raíces pares tangenciales ni raíces extremadamente próximas entre muestras. Newton multisemilla reduce ese riesgo; los límites y densidad están centralizados y la API declara `XIRR_NOT_FOUND` fuera de la región fiable, nunca inventa una tasa.
