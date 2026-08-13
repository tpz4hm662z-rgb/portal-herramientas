# Motor normativo Jubilación PRO v1.0

Revisión normativa: 13 de agosto de 2026. Versión del motor: 1.0.0.

## Auditoría heredada

La herramienta pública existente es una simulación de ahorro por interés compuesto, no una calculadora de pensión pública. Sus entradas son edad actual, edad objetivo, ahorro, aportación y rentabilidad. Usa capitalización mensual, escenarios fijos del 3/5/7 %, `Number`, HTML generado desde el DOM y `toLocaleString`. No modela LGSS, cotizaciones, carencia, base reguladora ni jubilación anticipada. Está totalmente acoplada al DOM y acepta valores mediante coerción. No se reutilizó ninguna fórmula heredada y los cuatro archivos públicos permanecen intactos en Fase 1.

## Alcance

Soportado: Régimen General estándar; fechas civiles; edad ordinaria y proyección explícita; carencia total y estado de carencia específica; porcentaje de base reguladora; anticipada voluntaria; anticipada involuntaria condicionada; jubilación demorada antes de causar pensión; escenarios; pensión bruta desde base reguladora conocida.

`REQUIRES_SPECIAL_ANALYSIS`: cálculo de base reguladora desde historial. Requiere índices IPC por mes, actualización de bases, integración de lagunas según situación, bases mínimas históricas y posibles exclusiones. Una lista nominal de bases no basta para un resultado legalmente fiable.

Fuera de alcance: regímenes especiales y RETA, mutualistas, discapacidad, profesiones con reducción, parcial, activa, flexible, Clases Pasivas, prorrata internacional, concurrencia de pensiones, complementos, brecha de género, fiscalidad, neto y periodos asimilados no declarados.

## Fuentes oficiales

- LGSS consolidada, RDL 8/2015: https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724 — arts. 205, 207, 208, 209 y 210; DT 7.ª, 9.ª y 40.ª.
- Seguridad Social, jubilación ordinaria: https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10963/28393/28396
- Seguridad Social, modalidades de jubilación: https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10963/28393
- Real Decreto 371/2023: https://www.boe.es/buscar/act.php?id=BOE-A-2023-11645
- Real Decreto-ley 11/2024: https://www.boe.es/buscar/act.php?id=BOE-A-2024-26917
- Real Decreto 416/2026: https://www.boe.es/buscar/act.php?id=BOE-A-2026-11474

## Convenciones y precisión

Todas las fechas son ISO civil estricta y se procesan en UTC. `asOfDate` es obligatorio; no existe `Date.now()`. La cotización se expresa en meses enteros. Si `continueContributing` es verdadero se añaden meses civiles completos entre la fecha de referencia y cada candidata, sin suponerlo silenciosamente. Si el umbral se alcanza después de los 65 pero antes de la edad superior, se devuelve el primer mes de concurrencia. Cuando la persona ya superó los 65 y el total actual no permite reconstruir en qué mes histórico cruzó el umbral, se devuelve `REQUIRES_SPECIAL_ANALYSIS` en lugar de inventar `asOfDate` como fecha ordinaria.

Los porcentajes se almacenan como tasas decimales (`0.0021` equivale a 0,21 %). La escala se acumula en unidades millonésimas y se limita exactamente a 1. La base reguladora aportada se considera mensual; la pensión ordinaria se expresa en 14 pagas y no aplica máximos, mínimos, IRPF ni complementos.

## Carencia

La carencia total son 180 meses. `specificCarenceMet` puede ser `true`, `false` o desconocido. Como alternativa auditable, `specificCarenceMonths` acepta meses enteros: 24 o más acredita el umbral contractual y menos de 24 lo incumple. Si ambos datos se aportan y se contradicen, el input es inválido. Sin ninguno, el motor devuelve `SPECIFIC_CARENCE_UNKNOWN`; no confirma el derecho completo.

## Anticipación

Las tablas completas de los arts. 207 y 208 se encuentran versionadas en `normativa-2026.js`. Cada mes o fracción cuenta como mes. Los tramos son `<462`, `462–497`, `498–533` y `>=534` meses. Para la edad ordinaria de referencia se aplica la ficción de continuidad del art. 207.2/208.2; para el porcentaje se conserva la cotización real de la fecha anticipada.

La voluntaria exige 420 meses y hasta 24 meses de anticipo, pero permanece `POTENTIALLY_ELIGIBLE` porque la cuantía mínima por situación familiar no se evalúa. La involuntaria exige 396 meses y hasta 48 meses; solo pasa a `OK` cuando se declaran expresamente causa habilitante, inscripción, carencia específica y requisitos legales adicionales. Las declaraciones del usuario no constituyen validación jurídica.

## Base reguladora avanzada

Los parámetros legales 2026–2037 y la comparación más favorable 2026–2044 están documentados en normativa. La API detecta lagunas y devuelve `REQUIRES_SPECIAL_ANALYSIS`; tampoco calcula sin serie IPC. No se estiman bases desde salario.

## Jubilación demorada (Fase 1.1)

La demora se mide desde `ordinaryRetirementDate` hasta `deferredRetirementDate`, pero el incentivo usa `effectiveContributionMonthsDuringDeferral`: meses completos de cotización efectiva declarados, que nunca pueden superar los meses civiles completos. La carencia ordinaria debe confirmarse para emitir `OK`; si se desconoce, el resultado es `POTENTIALLY_ELIGIBLE`. Haber causado ya la pensión, jubilación activa/flexible/parcial y acceso desde situación asimilada no se confunden con demora y quedan fuera de alcance.

El porcentaje adicional es 4 % por cada año completo. Para hechos causantes desde el 1 de abril de 2025, y solo a partir del segundo año completo, una fracción superior a seis meses e inferior al año añade 2 %; seis meses exactos no cumplen la literalidad del art. 210.2 vigente. Antes de esa fecha solo cuentan años completos.

El tanto alzado reproduce la fórmula oficial `800 × (pensión inicial anual / 500)^(1 / 1,65)` por año reconocido, con factor `1,1` desde 44 años y 6 meses cotizados en la fecha ordinaria. La pensión utilizada queda limitada al máximo anual. Desde el 1 de abril de 2025 se reconoce media unidad en la misma fracción superior a seis meses, a partir del segundo año. Se exige pensión inicial, máximo vigente, cotización en la fecha ordinaria y exclusión expresa de concurrencia y prorrata internacional; de otro modo no se inventa cifra.

La opción mixta existe desde el 18 de mayo de 2023 y exige dos años completos. El RD 371/2023 original reparte entre 2 y 10 años completos asignando la mitad entera inferior a porcentaje y el resto a tanto alzado; desde 11 años, cinco van a tanto alzado y el resto a porcentaje; las fracciones se ignoran. Entre el 1 de abril de 2025 y el 27 de agosto de 2026, el criterio oficial de la DGOSS permite mantener esa fórmula salvo para demoras de al menos dos años completos y seis meses adicionales, supuesto sin fórmula reglamentaria adaptada: el motor devuelve `REQUIRES_SPECIAL_ANALYSIS`. Desde el 28 de agosto de 2026 se aplica el RD 416/2026: entre 2 años y 8 años y 6 meses conserva el reparto de años y asigna el semestre completo al tanto alzado; desde 9 años asigna cinco años al tanto alzado, el resto al porcentaje y el semestre completo al porcentaje. No se redondean fracciones.

Si el incremento porcentual proyectado rebasa la pensión máxima, el motor devuelve `REQUIRES_SPECIAL_ANALYSIS` porque intervienen las reglas legales del exceso; solo cifra la pensión cuando el máximo aportado no resulta afectado. Cada llamada selecciona exactamente una modalidad y `compareRetirementTiming` no recomienda ninguna.

## API

Funciones puras: `calculateOrdinaryRetirement`, `calculatePensionPercentage`, `calculateEarlyRetirementMonths`, `calculateVoluntaryEarlyRetirement`, `calculateInvoluntaryEarlyRetirement`, `calculateEarlyRetirementScenario`, `calculateEarliestRetirement`, `calculateRetirementPension`, `calculateBaseRegulatory`, `calculateDeferredPercentageBonus`, `calculateDeferredLumpSum`, `calculateDeferredMixedOption`, `calculateDeferredRetirement`, `compareRetirementTiming` y `calculateRetirement`. Se exponen además primitivas civiles auditables.

## Estados y warnings

Estados: `OK`, `INVALID_INPUT`, `OUT_OF_SCOPE`, `REQUIRES_SPECIAL_ANALYSIS`, `MINIMUM_CONTRIBUTION_NOT_MET`, `SPECIFIC_CARENCE_UNKNOWN`, `POTENTIALLY_ELIGIBLE` y `NOT_ELIGIBLE`.

Warnings estructurados: proyección de cotizaciones; base aportada por usuario; máximo no aplicado; mínimo no evaluado; carencia específica no confirmada; causa involuntaria no verificada; e historial que requiere IPC/lagunas.

## Mantenimiento y tests

Las tablas están `deepFreeze`, se validan sin huecos y deben revisarse cuando cambie LGSS. La suite cubre calendario, bisiestos, proyección, carencia, escalas, tablas y fronteras, modalidades, pensión, demora, fechas de vigencia, adversariales, pureza e inmutabilidad. Las referencias Decimal son independientes del motor JavaScript.

## Integración de interfaz (Fase 2)

La interfaz heredada era una calculadora de ahorro: solicitaba edades, ahorro, aportación y rentabilidad; ejecutaba capitalización mensual y escenarios fijos del 3/5/7 % dentro de `script.js`; renderizaba mediante `innerHTML`. Esa lógica se retiró íntegramente y no se reutilizó como cálculo de Seguridad Social.

La integración respeta `normativa-2026.js → core.js → script.js → DOM`. La capa de UI solo convierte años y meses a meses enteros, recoge declaraciones explícitas, llama a APIs del motor y formatea resultados. No contiene edades, carencias, coeficientes, porcentajes ni fechas normativas.

`asOfDate` se rellena inicialmente con la fecha civil local actual como dato técnico visible y editable. No se usa como default económico o jurídico, no entra en el motor mediante `Date.now()` y no se envía a analítica. El botón Limpiar conserva únicamente esa fecha técnica; borra las declaraciones y datos personales/económicos.

La UI no persiste datos ni usa backend, `fetch`, XHR, `localStorage` o `sessionStorage`. Los nodos dinámicos se construyen con `createElement` y `textContent`. GA4 conserva una sola carga y los eventos propios se limitan a nombre de herramienta y tipo genérico de escenario.

## Matriz de contraste oficial

| Entrada reproducible | Resultado oficial publicado | Imoancy | Diferencia |
|---|---|---|---|
| Hecho causante 2026, 459 meses | Edad ordinaria 65 años | 65 años | 0 |
| Hecho causante 2026, 458 meses | Edad superior 66 años y 10 meses, salvo que el umbral se alcance antes continuando la cotización | Misma regla y búsqueda mensual de concurrencia | 0 |
| Desde 2027, 462 meses | Edad ordinaria 65 años | 65 años | 0 |
| 2026, 180 meses | 50 % | 50 % | 0 |
| 2026, 181 meses | 50,21 % | 50,21 % | 0 |
| Voluntaria, 24 meses, tramo menor de 38a6m | Reducción 21 % | 21 % | 0 |
| Voluntaria, 12 meses, tramo 38a6m–41a6m | Reducción 5,25 % | 5,25 % | 0 |
| Involuntaria, 48 meses, tramo menor de 38a6m | Reducción 30 % | 30 % | 0 |
| Involuntaria, 24 meses, tramo mayor o igual a 44a6m | Reducción 12 % | 12 % | 0 |
| Base reguladora 2026 | 302 mejores bases de 304 / 352,33 y comparación legal favorable | Parámetros registrados; cálculo suspendido sin IPC/lagunas | No se emite cifra |

Los resultados oficiales proceden de las tablas literales de la LGSS y de las páginas informativas de la Seguridad Social. No se automatizaron simuladores que requieran identificación personal.
