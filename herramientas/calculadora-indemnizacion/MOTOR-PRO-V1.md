# Motor de Indemnización PRO v1.0 — Fase 1

Estado: motor aislado, no conectado a la interfaz. Revisión normativa: 13-08-2026.

## Auditoría de la calculadora heredada

La versión pública recibe salario bruto mensual, dos fechas y `objetivo` o `improcedente`. `script.js` convierte el salario con `(mensual × 12) / 365`, calcula la antigüedad como milisegundos divididos entre `365 días` y multiplica por 20 o 33 días/año.

Hallazgos:

- no aplica los topes de 360/720 días;
- no aplica la disposición transitoria para contratos anteriores al 12-02-2012;
- no prorratea por meses ni computa ambos días conforme al criterio de la calculadora CGPJ;
- no incorpora correctamente pagas extraordinarias salvo que el usuario ya las haya prorrateado sin que el modelo lo exprese;
- usa `Date` local y milisegundos, con riesgo de zona horaria/DST;
- mezcla validación, cálculo, DOM y formato monetario;
- `Number("")` convierte una ausencia en cero y el control de fechas se basa en el año 1950 como constante no normativa;
- no ofrece desglose, trazabilidad, estado de soporte ni advertencias;
- el selector HTML comienza en objetivo, pero `reiniciar()` selecciona improcedente.

No existían `js/config.js`, motor separado, tests ni documentación dentro de esta herramienta. `index.html`, `style.css` y `script.js` no se han modificado en esta fase.

## Fuentes oficiales verificadas

| Regla | Fuente oficial | Referencia |
|---|---|---|
| Improcedente: 33 días/año, prorrateo mensual, 24 mensualidades | BOE, Estatuto de los Trabajadores consolidado | art. 56.1 |
| Régimen anterior/posterior al 12-02-2012; 45/33; 720/1260 días | BOE, Estatuto de los Trabajadores consolidado | DT 11.2 |
| Objetivo: 20 días/año, prorrateo mensual, 12 mensualidades | BOE, Estatuto de los Trabajadores consolidado | art. 53.1.b |
| Colectivo: indemnización y remisión a la forma del art. 53.1 | BOE, Estatuto de los Trabajadores consolidado | arts. 51.4 y 53.1.b |
| Temporal: doce días salvo exclusiones, más regímenes históricos | BOE, Estatuto de los Trabajadores consolidado | art. 49.1.c y transitorias históricas |
| Salario diario/mensual/anual bruto; mensual con extras prorrateadas; cómputo por meses | CGPJ, calculadora oficial y guía v0.6 | herramienta y guía legal/jurisprudencial |

Enlaces consultados:

- [Estatuto de los Trabajadores — BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430)
- [Calculadora oficial — CGPJ](https://www.poderjudicial.es/cgpj/es/Servicios/Utilidades/Calculo-de-indemnizaciones-por-extincion-de-contrato-de-trabajo/)
- [Guía práctica legal y jurisprudencial v0.6 — CGPJ](https://www.poderjudicial.es/stfls/CGPJ/UTILIDADES/Guia_pr%C3%A1ctica_legal_y_jurisprudencial_calculo_indemnizaciones_v06_actualizada_a_julio_2026.pdf)

El texto consolidado del BOE mostraba última actualización publicada el 04-12-2025. La página del CGPJ ofrecía la guía v0.6 actualizada a julio de 2026. Los parámetros aplicados, sus referencias y la fecha de consulta quedan además congelados en `js/normativa-2026.js`.

## Alcance decidido

| Supuesto | Estado v1 | Decisión |
|---|---|---|
| Despido improcedente | `SUPPORTED` | Regla actual y DT 11.2 completas |
| Extinción objetiva procedente | `SUPPORTED` | 20 días/año, tope 360 |
| Despido colectivo procedente | `SUPPORTED` | Solo mínimo legal base 20/360; siempre advierte |
| Fin de contrato temporal | `REQUIRES_SPECIAL_ANALYSIS` | Modalidad, exclusiones, fecha histórica y encadenamiento pueden cambiar el derecho o la tasa |
| Extinción indemnizada por voluntad del trabajador | `REQUIRES_SPECIAL_ANALYSIS` | Requiere calificación jurídica del incumplimiento y tratamiento propio |
| Movilidad geográfica | `OUT_OF_SCOPE` | No se incorpora automáticamente aunque la calcule el CGPJ |
| Modificación sustancial | `OUT_OF_SCOPE` | Tope y presupuesto jurídico propios |
| Despido nulo | `OUT_OF_SCOPE` | No es una simple indemnización tasada |
| Fijo-discontinuo/periodos no computables | `OUT_OF_SCOPE` | Requiere periodos efectivos; el CGPJ ofrece un formulario específico |

También quedan fuera salarios de tramitación, daños, indemnizaciones adicionales, derechos fundamentales, fiscalidad, FOGASA, desempleo, finiquito, readmisión, mejoras de convenio y relaciones especiales.

## Contrato de entrada

`calculateIndemnity(input)` exige:

```js
{
  terminationType: "UNFAIR_DISMISSAL",
  servicePattern: "CONTINUOUS",
  startDate: "2020-01-01",
  endDate: "2021-01-01",
  salary: { type: "ANNUAL", amount: 36500 }
}
```

Modalidades salariales:

- `ANNUAL`: bruto anual.
- `MONTHLY_PRORATED`: bruto mensual que ya incluye la parte proporcional de extras.
- `MONTHLY_PLUS_EXTRA_PAYMENTS`: mensual ordinario × 12 más una lista explícita de importes brutos anuales de pagas extra.
- `DAILY`: bruto diario.

No se aceptan strings numéricos, vacíos, `NaN`, infinitos, importes no positivos ni extras negativas. Las fechas deben ser fechas civiles ISO estrictas. El final ha de ser posterior al inicio. No se redondean importes dentro del motor.

## Reglas matemáticas

El salario diario es `bruto anual / 365`. En salario diario se conserva la cifra suministrada; en mensual prorrateado, el bruto anual es `mensual × 12`; con extras explícitas es `mensual × 12 + suma(extras)`.

La antigüedad se computa en UTC por meses civiles. Se cuentan ambos días de la relación y cualquier fracción residual se eleva a un mes según la comparación de los días del mes usada por el CGPJ, sin convertir artificialmente finales de mes en aniversarios: 31-03→30-04 es 1 mes y 30-04→31-05 son 2. Del 01-01-2020 al 01-01-2021 son 367 días inclusivos y 13 meses. No se usa `días / 365` para la antigüedad.

Improcedente post-2012:

```text
días brutos = meses × 33 / 12
días indemnizables = min(días brutos, 720)
```

Improcedente transitorio:

```text
pre = meses anteriores al 12-02-2012 × 45 / 12
post = meses desde el 12-02-2012 × 33 / 12

si pre > 720: resultado = min(pre, 1260), sin incremento post
si pre <= 720: resultado = min(pre + post, 720)
```

El día 12-02-2012 se asigna al tramo posterior. Cada tramo prorratea por separado cualquier fracción mensual: en periodos muy cortos alrededor del corte la suma de meses de tramo puede superar los meses informativos del periodo total. Es el comportamiento observado en el CGPJ (11-02-2012 a 12-03-2012: un mes pre y dos meses post).

Objetivo/colectivo base:

```text
días brutos = meses × 20 / 12
días indemnizables = min(días brutos, 360)
```

La cuantía es `días indemnizables × salario diario`.

## Salida y trazabilidad

Estados: `OK`, `INVALID_INPUT`, `UNSUPPORTED_CASE` y `REQUIRES_SPECIAL_ANALYSIS`. Una salida válida contiene versión normativa, periodo civil, meses computados, normalización salarial, tramos con fechas/tasa/días brutos/días admitidos, tope, indicación de aplicación del tope, cuantía bruta y advertencias. Un caso no soportado no devuelve cero ni una estimación parcial.

## Contraste con CGPJ

Se enviaron consultas al formulario oficial el 13-08-2026 con bruto anual de 36.500 € (100 €/día):

| Inicio | Fin | Meses CGPJ | Supuesto | CGPJ | Motor |
|---|---:|---:|---|---:|---:|
| 01-01-2020 | 01-01-2021 | 13 | improcedente | 3.575,00 € | 3.575,00 € |
| 01-01-2020 | 01-01-2021 | 13 | objetivo | 2.166,67 € mostrado | 2.166,666… € sin redondeo visual |
| 01-01-2020 | 01-01-2021 | 13 | colectivo base | 2.166,67 € mostrado | 2.166,666… € sin redondeo visual |
| 15-01-2023 | 14-01-2024 | 12 | improcedente | 3.300,00 € | 3.300,00 € |
| 15-01-2023 | 15-01-2024 | 13 | improcedente | 3.575,00 € | 3.575,00 € |
| 12-02-2011 | 12-02-2013 | 25 | improcedente transitorio | 8.075,00 € | 8.075,00 € |
| 12-02-2012 | 01-01-2040 | 335 | improcedente, tope 720 | 72.000,00 € | 72.000,00 € |
| 01-01-2010 | 01-01-2011 | 13 | improcedente pre-2012 | 4.875,00 € | 4.875,00 € |
| 12-02-1992 | 12-02-2020 | 337 | tramo pre superior a 720 | 90.000,00 € | 90.000,00 € |
| 01-01-1970 | 01-01-2020 | 601 | tope absoluto 1260 | 126.000,00 € | 126.000,00 € |
| 01-01-2020 | 01-01-2021 | 13 | improcedente, 100 €/día | 3.575,00 € | 3.575,00 € |
| 01-01-2020 | 01-01-2021 | 13 | improcedente, 3.041,666… €/mes | 3.575,00 € | 3.575,00 € |
| 28-02-2024 | 01-03-2024 | 1 | improcedente, cruce bisiesto | 275,00 € | 275,00 € |
| 31-03-2024 | 30-04-2024 | 1 | improcedente, fin de mes desigual | 275,00 € | 275,00 € |
| 30-04-2024 | 31-05-2024 | 2 | improcedente, fin de mes inclusivo | 550,00 € | 550,00 € |
| 11-02-2012 | 12-03-2012 | 2 totales | transición, tramos redondeados 1 + 2 | 925,00 € | 925,00 € |
| 12-02-2011 | 12-02-2012 | 13 | transición, 12 pre + 1 post | 4.775,00 € | 4.775,00 € |

La matriz de congelación se amplió a 25 consultas reproducibles (incluyendo 01-01→31-01, 01-01→01-02, 31-01→01-02, 29-02→01-03, 31-03→30-04, 30-04→31-05, un año más un día, corte corto 2012, topes y formatos salariales). Todas coincidieron. La auditoría encontró y corrigió el cómputo inicial erróneo de 31-03→30-04 como dos meses: el CGPJ devuelve uno. La diferencia de presentación del objetivo/colectivo es deliberada: Fase 1 no realiza redondeo visual.

### Componentes salariales

El importe suministrado debe representar el salario regulador bruto que el usuario o un profesional haya determinado. El motor no decide qué conceptos de una nómina son salariales. Complementos, variables, bonus, salario en especie, horas extraordinarias y percepciones extrasalariales pueden exigir promedios, exclusiones o análisis individual. Tampoco presume que dos pagas extra sean iguales a una mensualidad.

### Naturaleza de la hipótesis

Seleccionar un tipo solo pide calcular su consecuencia económica. El motor no declara que un despido sea procedente, improcedente o nulo, ni valora una carta, hechos o prueba judicial.

## Pruebas y mantenimiento

- `tests/core.test.js`: fronteras temporales, bisiestos, meses parciales, topes, transición, salarios, estados, entradas hostiles, inmutabilidad y overflow.
- `tests/reference_decimal.py`: oráculo independiente con aritmética `Decimal` para cifras post-2012, objetivo, salarios, fronteras 360/720/1260 y transición.
- `tests/freeze-audit.test.js`: 94 ataques adicionales sobre fechas, corte, topes, equivalencias, inputs hostiles, IEEE-754 y ausencia de estado compartido.
- `tests/run-jxa.js`: ejecuta la suite sin depender de Node; el motor sigue siendo compatible con CommonJS y navegador.

Antes de cambiar una regla debe actualizarse `normativa-2026.js`, su fuente oficial, esta matriz de alcance y los tests. La conexión con UI pertenece a otra fase.

## Auditoría adversarial de congelación

La auditoría de 13-08-2026 partió de los hashes originales y encontró dos defectos importantes reales: el cómputo de 31-03→30-04 no coincidía con el mes único del CGPJ, y la API pública `calculateServiceMonths()` no controlaba objetos `Date` inválidos. Se aplicaron guardas y fórmula mínimas con regresiones. La suite de congelación final contiene 56 pruebas base/regresión y 94 pruebas adversariales adicionales; las referencias independientes contienen 31 casos Decimal. Los resultados fueron idénticos bajo UTC, Europe/Madrid, America/New_York y Pacific/Auckland.
