# Calculadora de Inflación PRO v1.0 — Fase 1

Motor matemático puro, creado y congelado desacoplado de la interfaz heredada. `js/core.js` no lee ni escribe DOM ni formatea moneda o porcentajes. Desde la Fase 2, `index.html` lo carga como dependencia de la nueva capa de interfaz, sin alterar su aislamiento interno. Las tasas se expresan como decimales: `0.03` equivale al 3 % y `-0.02` a una deflación del 2 %.

## API pública

- `calculateCumulativeInflation({ inflationRate, years })`
- `calculatePurchasingPower({ amount, inflationRate, years })`
- `calculateRealValue({ amount, inflationRate, years })`
- `compareWithInflation({ initialAmount, finalAmount, cumulativeInflation })`
- `compareWithInflation({ initialAmount, finalAmount, inflationRate, years })`
- `calculateInflationImpact(mode, input)`, despachador para los tres modos definidos en `MODE`.

Todos los éxitos tienen `status: "OK"`. Los errores tienen `status: "INVALID_INPUT"` y una lista congelada `errors` con pares `{ field, code }`. La API, sus catálogos, resultados y errores están congelados; ninguna función muta la entrada.

## Fórmulas y significado

Con tasa anual `i` y periodo `n`:

```text
factor = (1 + i)^n
inflación acumulada = factor - 1
equivalente futuro = importe × factor
valor real = importe ÷ factor
cambio de poder adquisitivo = 1 ÷ factor - 1
```

La comparación usa el cociente exacto de Fisher:

```text
cambio nominal = importe final ÷ importe inicial - 1
cambio real = (1 + cambio nominal) ÷ (1 + inflación acumulada) - 1
```

No se redondea durante el cálculo. Internamente el factor anual se evalúa mediante `log1p` y `exp`, lo que mejora la estabilidad con tasas pequeñas y periodos fraccionarios.

## Dominios y validación

- Importes generales: números finitos mayores o iguales que cero.
- Comparación: importe inicial estrictamente positivo e importe final mayor o igual que cero.
- Inflación anual y acumulada: números finitos estrictamente mayores que `-1`. Por tanto, cero y la deflación superior al -100 % son válidos; -100 % o menos no lo son.
- Años: números finitos mayores o iguales que cero, incluidos cero y periodos decimales.
- No se convierten strings, booleanos ni objetos. `undefined`, `null` y `""` son ausencia, nunca cero.
- `-0` pertenece al dominio de cero de JavaScript y se acepta como cero; puede conservar su signo IEEE-754 en algún campo numérico, sin cambiar ninguna interpretación matemática o estado.
- No hay máximos comerciales arbitrarios. Si una combinación válida en dominio excede o cae por debajo de lo representable por IEEE-754, el resultado es `INVALID_INPUT`; nunca se devuelve éxito con `NaN` o infinito.

## Estados semánticos

Los ejes son independientes y no duplican el `status` técnico:

- Precio: `INFLATION`, `DEFLATION`, `NO_PRICE_CHANGE`.
- Poder adquisitivo: `PURCHASING_POWER_GAINED`, `PURCHASING_POWER_LOST`, `PURCHASING_POWER_UNCHANGED`.
- Comparación: `ABOVE_INFLATION`, `BELOW_INFLATION`, `MATCHES_INFLATION`.

Solo para clasificar tasas adimensionales numéricamente próximas a cero se usa el umbral `1e-12`, relativo a `max(1, |tasa|)`. En la zona relevante para `MATCHES_INFLATION` esto equivale a una banda absoluta simétrica de `1e-12` sobre `realChange`. La clasificación no depende de la escala monetaria y el valor calculado no se altera.

## Pruebas y límites conocidos

`tests/core.test.js` contiene 96 comprobaciones portables: las 83 originales y 13 escenarios adversariales de congelación. Cubren ejemplos, cero, deflación extrema, periodos decimales, validación hostil, IEEE-754, Fisher, identidades algebraicas, una matriz inversa bidireccional de 120 combinaciones, composición, finitud, determinismo e inmutabilidad. `tests/browser-runner.html` permite ejecutarlas en un navegador sin dependencias. `tests/final_math_audit.py` contrasta la API JavaScript real con 14 referencias independientes calculadas mediante `Decimal` a 70 dígitos.

El modelo supone una inflación constante cuando recibe tasa anual. No modela una serie temporal de IPC, cambios de cesta, impuestos, rentas ni fuentes externas; son decisiones deliberadamente fuera de la Fase 1. Tampoco garantiza exactitud decimal contable: usa la aritmética binaria estándar de JavaScript y delega el redondeo de presentación a una fase posterior.
