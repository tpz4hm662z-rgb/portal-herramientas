# Grasa Corporal PRO — decisiones de Fase 2

- La primera visita conserva cuatro campos y CUN-BAE como resultado dominante. Cintura, guardado e historial solo aparecen por acción explícita.
- El contraste RFM utiliza una sola lectura elegida de forma explícita. La segunda lectura es opcional y solo sirve para comprobar la repetibilidad: se muestra la diferencia, pero nunca se promedian ni se aplica un umbral clínico.
- Un guardado genera registros Fase 1 separados por método con el mismo instante. Así CUN-BAE y RFM nunca se mezclan ni promedian.
- La interpretación longitudinal es determinista: observados, estimaciones, variables de cada ecuación, comparabilidad y límites. No atribuye cambios a músculo o grasa real.
- El almacenamiento tolera ausencia, bloqueo, corrupción y cuota llena sin afectar al cálculo. Las versiones anteriores estructuralmente válidas se conservan, pero no se comparan con otra versión.
- No se envían valores personales a GA4. El controlador no genera eventos de edad, sexo, altura, peso, cintura, porcentaje ni historial.
- Exportación/importación se aplaza: el formato ya está versionado, pero primero se valida la experiencia central. La interfaz advierte que almacenamiento local no equivale a sincronización ni permanencia.
- No se incluyen gráficos con pocos datos, categorías, objetivos, PDF, recomendaciones de pérdida ni diagnósticos.

## Auditoría adversarial Fase 2.1

- La publicación original de RFM trabajó con la variable única de cintura de NHANES. El manual NHANES registra una lectura a 0,1 cm; ante una alerta extrema se verifica la medición/entrada, pero no define dos lecturas ni su promedio. Por tanto, el promedio doméstico automático era un protocolo propio no validado y se sustituyó por selección explícita de una lectura.
- El protocolo visible se alinea con NHANES/RFM: persona de pie, ropa apartada, brazos cruzados con manos en hombros opuestos, punto justo sobre el borde lateral superior del ilion derecho en la línea media axilar, cinta paralela al suelo y ajustada sin comprimir, lectura al final de una espiración normal en cm a 0,1 cm.
- La comparabilidad exige método, versión científica y versión del motor idénticos. Un cambio del sexo usado selecciona coeficientes distintos y suprime el delta estimado. La edad y la altura pueden cambiar como entradas del mismo método, pero la explicación debe identificarlas para no atribuir todo el resultado al peso o la cintura.
- Los deltas longitudinales muestran los enteros inicial/final y describen expresamente cambios internos ocultos o saltos por frontera de redondeo. No se introduce ningún umbral de significación clínica.
- Los registros heredados se validan por estructura, rangos fisiológicos, masas y fecha ISO. El almacenamiento aísla fechas futuras o anteriores a 2000, documentos sobredimensionados, arrays desmesurados y duplicados sin impedir el cálculo principal.
- El resultado y las secciones opcionales reciben foco al abrirse; cerrar el contraste devuelve el foco a su botón. Se retiró `aria-live` de regiones extensas para evitar anuncios duplicados.

Fuentes primarias revisadas: Woolcott y Bergman, *Scientific Reports* 2018, doi:10.1038/s41598-018-29362-1; CDC/NCHS, *NHANES 2005–2006 Anthropometry and Physical Activity Monitor Procedures Manual*, sección 3.3.1.7; CDC/NCHS, código de datos `BMX_D` (`BMXWAIST`).
