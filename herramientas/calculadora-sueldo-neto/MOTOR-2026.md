# Motor Sueldo Neto PRO 2026

## Perímetro contractual

El motor calcula una estimación anual para una persona trabajadora por cuenta ajena del Régimen General, a tiempo completo, con alta durante los doce meses y tributación IRPF en territorio común. Admite contratos indefinidos y temporales para desempleo; 12 pagas con extras prorrateadas o 14 pagas separadas; complementos salariales ordinarios; horas extraordinarias ordinarias y de fuerza mayor; situaciones familiares 1, 2 y 3; descendientes, ascendientes, discapacidad, movilidad geográfica, pensión compensatoria, anualidades por alimentos y la comunicación transitoria de préstamo de vivienda.

No admite trabajo parcial, meses incompletos, regímenes especiales, autónomos, empleados de hogar, territorios forales, Ceuta/Melilla, dietas, indemnizaciones, atrasos, retribución en especie, incapacidad temporal ni regularización del tipo. Estos datos producen `UNSUPPORTED`, nunca un resultado aproximado. La estructura de auditoría reserva la regularización, pero su cálculo se difiere hasta completar una validación independiente específica.

## Flujo y redondeos

`normativa-2026.js` contiene exclusivamente parámetros y fuentes. `core.js` valida y ejecuta remuneración → bases → cuotas del trabajador → retención AEAT → distribución de pagas. No usa DOM, HTML, CSS, estado global mutable ni formato monetario.

Se conserva precisión en cálculos intermedios. `REDONDEAR1` se aplica a dos decimales con mitad hacia arriba donde el algoritmo AEAT declara una magnitud final; el porcentaje de retención se trunca, no redondea, a dos decimales. El importe anual de IRPF se redondea a céntimos. Las cuotas de Seguridad Social se exponen con precisión de cálculo y el total monetario puede presentarse redondeado por el consumidor.

En 14 pagas no se divide el neto anual entre catorce: las bases incluyen la prorrata de extras, la Seguridad Social se descuenta de las doce nóminas ordinarias y las dos extras soportan IRPF. Por falta de desglose contractual de las extras, el salario ordinario anual se reparte en catorce unidades iguales; las horas extra se asignan a las doce nóminas ordinarias.

## Contraste independiente AEAT (11-08-2026)

Los resultados se obtuvieron por POST al servicio oficial `https://www2.agenciatributaria.gob.es/wlpl/PRET-R200/mc`, con `EJER=2026`, `PER=0`, XML conforme a `AEATRetenciones2026.xsd`, trabajador activo, contrato general, nacimiento 1990 y las cotizaciones indicadas. Diferencia máxima aceptada: 0,01 € en magnitudes monetarias y 0,00 puntos en el tipo.

| Caso | Entrada relevante | AEAT base / tipo / importe | Imoancy | Diferencia |
|---|---|---|---|---|
| General | 30.000 €, situación 3, cot. 1.950 € | 26.050 / 16,42% / 4.926 € | igual | 0 |
| Bajo salario | 15.000 €, situación 3, cot. 1.111,03 € | 4.586,97 / 0% / 0 € | igual | 0 |
| Base alta | 60.000 €, situación 3, cot. 3.900 € | 54.100 / 24,44% / 14.664 € | igual | 0 |
| Solidaridad | 90.000 €, situación 3, cot. 4.038,16 € | 83.961,84 / 30,69% / 27.621 € | igual | 0 |
| Descendiente compartido | 30.000 €, nacido 2022 | 26.050 / 15,66% / 4.698 € | igual | 0 |
| Monoparental entero | 30.000 €, situación 1, nacido 2022 | 26.050 / 14,90% / 4.470 € | igual | 0 |

## Fuentes oficiales

- AEAT, *Algoritmo de cálculo del tipo de retención IRPF 2026*, versión 26-12-2025.
- AEAT, esquema `AEATRetenciones2026.xsd` y documentación del servicio web.
- Orden PJC/297/2026, artículos 4, 5, 16 y 17.
- Seguridad Social, bases y tipos del Régimen General 2026.

Los tests se pueden ejecutar con CommonJS (`node tests/sueldo-neto-core.test.js`) o abriendo `tests/sueldo-neto-core.browser.html`. La interfaz heredada no importa todavía este motor: su integración corresponde a la fase posterior.

## Extensión mensual de cotizaciones (Fase 1.1)

`calculateMonthlyContribution(input)` calcula exclusivamente las cotizaciones del trabajador correspondientes a un mes completo. Es una función pura, no modifica la entrada y reutiliza los parámetros 2026 del mismo módulo normativo. No anualiza los importes variables.

Contrato de entrada:

- `remuneracionOrdinariaMes`: salario ordinario efectivamente cobrado en la mensualidad, sin el complemento variable del mes ni horas extra. En 12 pagas incluye la parte de extras ya prorrateada en nómina; en 14 pagas representa únicamente la paga ordinaria.
- `prorrataPagasExtraMes`: parte proporcional de las pagas extraordinarias que se incorpora a la base aunque no se cobre ese mes. Debe ser cero con 12 pagas, evitando una doble prorrata, y positiva con 14 pagas.
- `complementosSalarialesMes`: suma de complementos ordinarios computables cobrados exclusivamente ese mes.
- `horasExtraOrdinariasMes` y `horasExtraFuerzaMayorMes`: importes mensuales separados. No se incorporan a la base ordinaria y soportan sus respectivas cotizaciones adicionales.
- `numeroPagas`: únicamente 12 o 14.
- `grupoCotizacion`: entero de 1 a 11, empleado para la base mínima del mes completo.
- `tipoContratoCotizacion`: `indefinido` o `temporal`, empleado solo para desempleo.
- `tiempoCompleto`: debe ser `true`; tiempo parcial y meses incompletos siguen fuera del perímetro.

La base de contingencias comunes antes de límites suma remuneración ordinaria, prorrata separada y complementos del mes. Después aplica la base mínima del grupo y la máxima de 5.101,20 €. Para desempleo y formación profesional se utiliza la base de contingencias profesionales, que incorpora además las horas extraordinarias y respeta los mismos topes. El MEI se calcula sobre la base de contingencias comunes. La solidaridad se calcula sobre la remuneración mensual computable para contingencias comunes que excede la máxima, aplicando progresivamente los tres tramos 2026 sin anualizar el exceso. El resultado separa contingencias comunes, desempleo, formación profesional, MEI, solidaridad y las dos clases de horas extra, además del total exacto.

La salida incluye `remuneracion`, `base`, `cuotas`, detalle de `solidaridad`, datos mínimos de `comparacion` y advertencias. `brutoCobradoMes` no incluye la prorrata de extras de 14 pagas porque esta solo se incorpora a la base del mes ordinario.

El cálculo mensual de cotizaciones no implica que la herramienta reproduzca una regularización mensual completa del IRPF. No calcula una retención mensual real ni debe presentarse como una nómina completa. Tampoco cubre tiempo parcial, alta incompleta, incidencias, conceptos excluidos o regímenes distintos del declarado.

La suite específica está en `tests/sueldo-neto-mensual.test.js` y se ejecuta también desde el runner de navegador. Incluye fronteras de bases y de los tres tramos de solidaridad, horas extra, entradas adversariales e invariantes. La regresión diferencial compara un complemento de 1.200 € concentrado en un mes con 100 € durante doce meses, evitando que futuras integraciones vuelvan a repartir automáticamente una variable mensual.
