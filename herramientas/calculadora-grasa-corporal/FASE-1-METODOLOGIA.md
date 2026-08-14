# Grasa Corporal PRO v1.0 — Fase 1

## Auditoría de la implementación encontrada

El directorio correcto ya contenía una calculadora funcional basada en **U.S. Navy**, no CUN-BAE. `js/script.js` reúne controlador DOM, validación, ecuaciones, redondeo, clasificación, recomendaciones, analítica y presentación. Las ecuaciones heredadas calculan densidad corporal y aplican Siri (`495/densidad − 450`): hombres con altura y `cintura − cuello`; mujeres con altura y `cintura + cadera − cuello`. Los inputs son sexo, edad 18–100, altura 120–230 cm, peso 30–350 kg, cuello 20–70 cm, cintura 40–220 cm y cadera 50–220 cm para mujeres. Los outputs son porcentaje a una décima, masa grasa, denominada `masaMagra` aunque el texto aclara masa libre de grasa, clasificación y recomendaciones.

La aritmética derivada es conceptualmente correcta (`masa grasa = peso × porcentaje/100`; masa libre de grasa = peso − masa grasa), pero se calcula después de redondear el porcentaje, introduciendo una pérdida innecesaria de precisión interna. Hay comprobaciones DOM de rangos y de argumentos logarítmicos positivos; sin embargo, las funciones científicas no forman una frontera autónoma que rechace por sí sola strings, vacíos, `NaN`, `Infinity` o combinaciones no representadas. No había tests de esta herramienta.

Las tablas embebidas etiquetan “grasa esencial”, “nivel atlético”, “buena condición física”, “promedio saludable”, “elevado” y “muy elevado”, y generan consejos según la categoría. No incluyen una fuente primaria suficiente que legitime esos cortes como interpretación individual. También existe falsa precisión visual de 0,1 puntos y riesgo de que las recomendaciones parezcan prescriptivas. El nuevo núcleo no importa esas clasificaciones ni recomendaciones.

Para preservar la herramienta existente durante esta fase, no se han modificado `index.html`, `css/style.css`, `js/config.js`, `js/core.js` ni `js/script.js`. El núcleo puro nuevo queda preparado en paralelo; su conexión con la interfaz no forma parte de Fase 1.

## Decisión

Método rápido principal: **CUN-BAE**. Estima porcentaje de grasa a partir de IMC, edad y sexo en adultos de 18–80 años. Se elige por adecuación al flujo sin cinta y por proceder de una cohorte adulta grande de ambos sexos; no porque sea una medición clínica ni porque supere universalmente a todas las alternativas.

Segundo método independiente: **RFM**, opcional con cintura, desde 20 años. Aporta información de distribución central que CUN-BAE no observa. No se promedian resultados. Si discrepan se muestran como dos estimaciones y se revisa especialmente el protocolo de cintura.

La visualización autorizada es `≈ N %` (entero). Internamente se conserva el resultado completo para reproducibilidad, masas derivadas y comparación. El SEE/RMSE poblacional no se convierte en un intervalo individual.

## Métodos auditados

| Método | Ecuación y población original | Referencia | Decisión |
|---|---|---|---|
| CUN-BAE | Ecuación polinómica implementada en `science-engine.js`; edad, sexo e IMC. Desarrollo: 6.510 adultos blancos, 67 % mujeres, 18–80 años, amplio rango de adiposidad; pletismografía por desplazamiento de aire. Validación separada n=1.149. SEE publicado 4,66 puntos porcentuales. | Gómez-Ambrosi et al. (2012), doi:10.2337/dc11-1334 | Principal rápido. Incertidumbre importante fuera de población blanca/adulta y en individuos concretos. |
| Deurenberg | `%GC = 1,20×IMC + 0,23×edad − 10,8×sexo(mujer=0,hombre=1) − 5,4`. 1.229 personas (521 hombres, 708 mujeres), 7–83 años, IMC 13,9–40,9; densitometría. Adultos: R² 0,79, SEE 4,1; ligera sobreestimación en obesidad. | Deurenberg et al. (1991), doi:10.1079/BJN19910073 | Descartado como principal: menor ajuste, referencia de dos compartimentos y sesgo comunicado en obesidad. Útil como antecedente, no como resultado adicional. |
| RFM | `64 − 20×altura/cintura + 12×sexo(mujer=1)`. NHANES: desarrollo n=12.581 (1999–2004), validación n=3.456 (2005–2006), ≥20 años; mujeres y hombres mexicano-, europeo- y afroamericanos; DXA. Precisión de validación 4,9 pp mujeres y 4,2 pp hombres; peor en personas magras y con edad avanzada. | Woolcott & Bergman (2018), doi:10.1038/s41598-018-29362-1 | Secundario con cinta. Mejor evidencia y más simple que Navy para población civil, pero muy sensible a técnica de cintura. |
| U.S. Navy | Fórmulas logarítmicas sexo-específicas con altura, cuello, abdomen y, en mujeres, cadera. Desarrollo en 602 hombres y 214 mujeres de la Navy, 18–44 años; pesaje hidrostático/Siri. Cross-validation: SEM 3,63 pp hombres y 3,82 pp mujeres en muestra Navy. | Hodgdon & Beckett, NHRC 84-11 y 84-29 (1984); National Academies review (1992). | Motor heredado de la UI, pero no incluido en el nuevo núcleo: población militar joven y protocolos/múltiples perímetros aumentan error operativo doméstico. No hay ventaja suficiente frente a RFM para la futura comprobación con cinta. |

También se consideraron BAI y ecuaciones de pliegues. BAI no ofrece ventaja consistente al ajustar por sexo; los pliegues requieren técnica y calibre, incompatibles con una web generalista.

## Límites y afirmaciones

Outputs autorizados: porcentaje **estimado**, masa grasa estimada, masa libre de grasa estimada e IMC complementario (CUN-BAE). Masa libre de grasa no significa músculo.

No afirmar: porcentaje real o diagnóstico; intervalo individual; “ideal”; categorías atleta/fitness/esencial/normal/obesidad basadas solo en este resultado; peso que se deba perder; peso objetivo; recomendación terapéutica; ni que una variación pequeña sea un cambio corporal real. Se retira conceptualmente la tabla Gallagher del nuevo motor: convierte asociaciones poblacionales con IMC en una clasificación individual que no responde al objetivo de estimar ni seguir cambios.

No usar en menores, embarazo, edema o estados de hidratación/composición atípica, amputaciones, culturismo/deportistas muy musculados, ni asumir transportabilidad a poblaciones no representadas. CUN-BAE queda limitado técnicamente a 18–80 y RFM a ≥20; la UI futura debe explicar estas exclusiones.

## Seguimiento local preparado

`tracking-schema.js` define un registro versionado con: id, instante ISO, método y versiones, protocolo/nota de condiciones, observados (sexo, edad, altura, peso y cintura si aplica) y estimados sin redondear (porcentaje, masa grasa, masa libre de grasa e IMC). No se guardan actividad, objetivo, categorías, recomendaciones ni datos de cuenta porque no participan en la ecuación.

Persistencia futura: un único documento local `{schemaVersion, records}`; máximo 1.000 registros; validación completa al leer; ignorar y ofrecer exportación del contenido corrupto antes de resetear; migraciones explícitas por versión; eliminación por id, borrado total y exportación JSON. Ninguna escritura remota. La frase de privacidad prevista es: “Tus mediciones se guardan únicamente en este dispositivo y navegador”. Esta fase no accede todavía a `localStorage`.

Las comparaciones separan observados, estimados y `interpretation: null`. Solo se calculan deltas estimados si coinciden `method.id` y `method.version`; un cambio de versión/método corta la serie científica. Deben compararse primera/anterior mediante la misma función. Las condiciones y el protocolo deben repetirse; ni siquiera la compatibilidad matemática prueba cambio corporal real.

## Referencias primarias y de autoridad

1. Gómez-Ambrosi J et al. *Clinical usefulness of a new equation for estimating body fat*. Diabetes Care. 2012;35:383–388. PMID 22179957; PMCID PMC3263863.
2. Deurenberg P et al. *Body mass index as a measure of body fatness: age- and sex-specific prediction formulas*. Br J Nutr. 1991;65:105–114. PMID 2043597.
3. Woolcott OO, Bergman RN. *Relative fat mass as a new estimator of whole-body fat percentage*. Sci Rep. 2018;8:10980.
4. Hodgdon JA, Beckett MB. *Prediction of percent body fat for U.S. Navy men/women from body circumferences and height*. NHRC reports 84-11/84-29, 1984.
5. National Research Council. *Body Composition and Physical Performance*, chapter 4. National Academies Press, 1992 (evaluación y cross-validation de ecuaciones militares).
6. Tinsley GM et al. *Tracking changes in body composition*. Br J Nutr. 2022;127:1656–1674. doi:10.1017/S0007114521002579.

## Núcleo y ejecución

Núcleo científico puro: `js/science-config.js` y `js/science-engine.js`. Es independiente del DOM y no tiene dependencias externas. Esquema/comparación: `js/tracking-schema.js`. Tests: `osascript -l JavaScript tests/run-jxa.js .`.

Los SHA-256 definitivos se documentan en `SCIENTIFIC-CORE-SHA256.txt` después de la última ejecución PASS. Cambiar un archivo del núcleo exige revisión científica, tests y hashes nuevos.
