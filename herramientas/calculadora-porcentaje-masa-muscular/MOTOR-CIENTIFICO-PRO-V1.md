# Motor científico PRO v1.0

El motor estima masa muscular esquelética corporal total mediante la ecuación
antropométrica sencilla de Lee et al. No mide masa magra, no sustituye MRI/DXA
y no diagnostica ni clasifica clínicamente.

## Modelo

`SMM_kg = 0.244 × peso_kg + 7.80 × altura_m + 6.6 × sexo − 0.098 × edad + ajuste_poblacional − 3.3`

`sexo` vale 1 para hombre y 0 para mujer. Las entradas internas son kg, metros
y años completos. La conversión desde centímetros es una función independiente.
Los coeficientes poblacionales son 0 kg (blanco/hispano), −1,2 kg (asiático) y
+1,4 kg (afroamericano). Omitir el grupo o seleccionar uno no cubierto nunca
activa ni infiere un ajuste.

La edad admitida es 20–81 años. Fuera de ella no se calcula. Con IMC menor que
30 el estado es `primary`; desde 30 es `extended_bmi`, con advertencia porque el
modelo original se desarrolló principalmente en adultos no obesos. El SEE
publicado (~2,8 kg) se conserva solo como metadato: no es un intervalo personal.

Se usa la ecuación sencilla porque la variante antropométrica avanzada requiere
perímetros y pliegues que PRO v1.0 no recoge. El error del modelo, la población
de desarrollo y las diferencias frente a mediciones instrumentales impiden una
interpretación diagnóstica; por eso `clinicalInterpretation` siempre es `null`.

## Referencias MRI

La referencia descriptiva está separada en `js/reference-data.js` y no participa
en la ecuación. Reproduce la Tabla 1 de Janssen et al., *J Appl Physiol* 2000;
89(1):81–88, DOI `10.1152/jappl.2000.89.1.81`: MRI de cuerpo completo en 468
adultos sanos de 18–88 años. Conserva las franjas publicadas, sin interpolación.
El grupo ≥70 se marca como evidencia limitada porque la cohorte era
principalmente menor de 70 años.

## Ejecución de pruebas

En macOS, sin Node:

`osascript -l JavaScript tests/run-jxa.js .`

Con Node disponible:

`node --test tests/scientific-core.test.js`
