# Revisión del comprobador de permisos laborales por familiar

Fecha de consulta y revisión: **7 de septiembre de 2026**. Implementación local; sin publicación ni IndexNow. Orientación del mínimo del Estatuto de los Trabajadores, no resolución individual ni régimen de funcionarios. Una sola URL pública prevista: `/herramientas/comprobador-permisos-laborales-familiares/`.

## Fuentes, procedencia y alcance

Se reintentó el acceso a Poder Judicial/CENDOJ: devolvió HTTP 403. No se atribuyen a una descarga directa de CENDOJ los textos siguientes alojados por terceros.

| Fuente consultada | Procedencia y uso |
| --- | --- |
| [ET, artículo 37](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430#a37) | BOE, texto consolidado. 37.3.b: cinco días, hechos y vínculos incluidos; b bis: dos días por fallecimiento, otros dos por desplazamiento necesario. Aviso y justificación. 37.9 es una vía distinta, no calculada. |
| [Código Civil, 915–919](https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#a915) y [108](https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#a108) | BOE: cómputo de grados y efectos de la filiación adoptiva. |
| [Tabla de parentesco de Canarias](https://www.gobiernodecanarias.org/hacienda/intervencion/servicios/guia_rrhh/libro7/vii2f.jsp) y [criterios de Madrid](https://www.comunidad.madrid/educacion/criterios-comunes-pas) | Fuentes institucionales utilizadas exclusivamente para relaciones/grados, nunca para importar sus días de permiso de empleo público. Afinidad: suegros, ambos sentidos de cuñado, yerno/nuera, abuelos/nietos del cónyuge, cónyuges de nietos, hijastro y cónyuge de progenitor. |
| [STS 1084/2025, 13-11, rc 128/2024](https://fesmcugt.b-cdn.net/app/uploads/2025/12/Sentencia-1084-2025-Permisos-Retribuidos-Dias-Laborales.pdf) | PDF judicial reproducido por UGT. Contact Center; interpretación de días laborables del mínimo ET. Laborables según calendario individual, no lunes a viernes. |
| [STS 126/2026, 04-02, ECLI ES:TS:2026:702](https://www.oulegoabogados.com/wp-content/uploads/2026/05/STS-126-2026.pdf) | PDF judicial reproducido por Oulego Abogados. RACE, ausencia de regulación convencional específica. No impone necesariamente inicio inmediato; no se extrapola a autorizar todo inicio posterior al alta. |
| [STS 443/2026, 22-04, ECLI ES:TS:2026:1885](https://www.iberley.es/jurisprudencia/sentencia-social-tribunal-supremo-sala-lo-social-22-4-26-1840741840) | Texto judicial reproducido por Iberley. Hinojosa Packaging/artes gráficas. Continuación con reposo prescrito tras alta hospitalaria, sin alta médica, hasta completar cinco días. Reitera STS 140/2026 de 5 de febrero, rc 236/2024 (Campofrío); esta última se ha contrastado a través de su reproducción en la resolución posterior, no como descarga independiente. |
| [SAN 32/2026, 19-02, ECLI ES:AN:2026:591](https://www.supercontable.com/informacion/laboral/san_32-2026_permiso_hospitalizacion_puede_mantenerse_.html) | Reproducción de Supercontable. Contexto Repsol. Se han leído fundamentos y fallo, no inferido una regla del titular. Continuidad e inicio después del alta son problemas distintos. No se convierte en prohibición universal. |
| [SAN 133/2026, 15-07](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-17492) | **Resolución íntegra en BOE**, publicada el 10 de agosto. Contact Center: anula restricción temporal/continuidad de la cláusula examinada. Texto indica posibilidad de recurso; no se afirma firmeza. No habilita una distribución universal a elección. |
| [STS 373/2026, 15-04, rc 104/2025](https://www.iberley.es/jurisprudencia/sentencia-social-tribunal-supremo-sala-lo-social-15-4-26-1840740865) | Reproducción judicial secundaria, Serveo. Corrobora no exigir a familiares expresamente incluidos la convivencia/cuidado efectivo reservados a otros convivientes. Base principal del motor: literal ET. No se reproduce el error de fecha que aparece al citarla en otro texto. |
| [Comentario institucional BOE de 2025](https://www.boe.es/biblioteca_juridica/anuarios_derecho/articulo.php?id=ANU-L-2025-00000002867) | Doctrina, no norma ni sentencia: apoyo contextual sobre familiares expresamente incluidos frente a otros convivientes. |

La búsqueda adicional localizó referencias a STS 629/2026 sobre mejora convencional por desplazamiento, y noticias sobre resoluciones de juzgados de Guadalajara/Palencia. No se codifican reglas nuevas a partir de esas noticias sin contraste suficiente del texto y alcance; una noticia con fechas/citas inconsistentes se descartó como fundamento. No se afirma que esta búsqueda sea un inventario exhaustivo de toda jurisprudencia.

## Motor y límites deliberados

`js/core.js` no depende del DOM. Valida el recorrido completo, rechaza claves/valores extraños y respuestas antiguas incompatibles. La interfaz no replica reglas: muestra preguntas y resultados del motor. `answer`, `rewind` y `reset` producen nuevos estados.

| Rama | Resultado | Fundamento / límite |
| --- | --- | --- |
| Hospitalización actual y vínculo incluido | Determinable, referencia 5 días | ET 37.3.b; no saldo pendiente ni garantía de consumir cinco tras desaparición de la causa. |
| Enfermedad/accidente grave vigente | Determinable, referencia 5 | Se presupone justificación de gravedad; la herramienta no diagnostica. |
| Operación sin ingreso con reposo prescrito, causa vigente | Determinable, referencia 5 | Requisito de reposo del ET. |
| Operación sin ingreso sin reposo | Fuera de esta vía | Puede existir otro hecho causante o convenio mejorado. |
| Cónyuge, pareja de hecho, consanguinidad/afinidad hasta segundo grado | Incluidos en cuidados y fallecimiento | ET y fuentes de parentesco. |
| Consanguíneo de pareja de hecho hasta segundo grado | Cuidados sí; fallecimiento fuera por ese vínculo | No confundir con afinidad matrimonial. |
| Tío/sobrino/primo y otra persona no incluida | Cuidados por vía de convivencia + cuidado efectivo si concurren | Tercero/cuarto grado no entra automáticamente como familiar. |
| Fallecimiento incluido | Determinable 2 o 4 con desplazamiento necesario | ET 37.3.b bis; sin umbral kilométrico inventado. |
| Permiso iniciado, alta hospitalaria, reposo prescrito, sin alta médica | Determinable: continuar hasta completar 5 | STS 443/2026; nunca cinco adicionales. |
| Alta hospitalaria, permiso no iniciado o inicio desconocido | **Condicionada** | No se autoriza ni prohíbe universalmente el inicio. |
| Alta y cuidados sin constancia de reposo/sin alta médica | **Condicionada** | Falta verificar persistencia y documentación. |
| Alta médica y recuperación, o estado posterior desconocido | **Condicionada** | No garantiza días pendientes; fecha, causa, días consumidos y convenio. |
| Reposo, gravedad vigente/ingreso, vínculo, convivencia, cuidado o desplazamiento desconocidos | **Condicionada** | Explica el requisito pendiente. |
| Causa grave/operación ya no vigente | **Condicionada** | No decide disfrute actual o saldo retrospectivo. |

Las relaciones sin acreditar, acogimiento, tutela y otras relaciones no identificadas no reciben una exclusión jurídica automática. Pueden acreditarse por la vía de convivencia/cuidado cuando corresponda. El desplazamiento solo se pregunta en fallecimiento. Las preguntas de alta solo aparecen tras elegir hospitalización y una vía incluida.

Siempre hay advertencia de convenio, contrato/acuerdo u otras mejoras. No calcula fraccionamiento, fechas, reingresos, acumulación de permisos, nacimiento ni urgencias del 37.9. Las sentencias con hechos y convenios diferentes no se presentan como contradictorias.

## Canibalización e integración

Auditoría anterior y posterior: título, H1, descripción, contenido y enlaces. No había una URL que cubriera sustancialmente hospitalización/operación/enfermedad/fallecimiento de familiar.

Intenciones preservadas: baja voluntaria + nuevo trabajo + paro; excedencia voluntaria + otro empleo + paro; reducción por hijo + despido/paro; adaptación por hijos; turno de mañana por hijos; excedencia por hijo + reingreso; fin de contrato estando de baja; vacaciones pendientes + paro; compatibilidad paro/trabajo; cálculo de finiquito, indemnización, sueldo neto y jubilación.

Solo se añade un párrafo a cada guía de adaptación, reducción y excedencia por hijo: enlace a permiso puntual frente a soluciones de cuidado sostenido. Una prueba compara el archivo completo con HEAD tras retirar ese párrafo: idéntico. Desde la herramienta se aclara que las tres guías tratan de hijos, no de cualquier familiar. No se fuerza enlace a paro, baja o finiquito.

Home: una tarjeta en trabajo/salario y una entrada ItemList, contador 38→39. Buscador: alias, índice generado. Sitemap de herramientas: una URL. Sin modificación de estilos globales ni de URLs existentes.

## Medición y privacidad

GA4 `G-QH8MJ6LVHN`, desactivado hasta elección afirmativa. Solo persiste la preferencia `imoancy_permisos_analytics`; las respuestas quedan en memoria y nunca van a URL/almacenamiento. Revocación detiene eventos manuales y actualiza consentimiento. Sin campos de texto ni documentos.

Eventos: `page_view` (título), `permisos_view`, `permisos_start`, `permisos_complete` (los dos últimos: `motivo=cuidados|fallecimiento`), `permisos_related_click` (`destination=adaptacion|reduccion|excedencia`). Comunes: `tool_id`, canonical fijo como `page_location`, `page_referrer` vacío. No envía parentesco, diagnóstico, grado, días, respuestas ni clasificación jurídica. Pruebas interceptan tráfico externo: no generan visitas reales.

## Pruebas y auditoría

- Motor Node: **125/125**; explora además **593 recorridos terminales** (407 condicionados), todas las relaciones, estados incompletos/imposibles, cambio y reinicio.
- Navegador Playwright: **16/16**, incluidos móvil 320/390/768/1440, teclado/foco, cambios, sin JS, fallo de motor, almacenamiento bloqueado, consentimiento/revocación, eventos y búsquedas reales.
- Contratos estáticos propios: **5/5**, metadatos/schema, fuentes, preservación exacta de guías, ausencia de entradas personales/scripts remotos estáticos y peso conjunto inferior a 65 KB sin comprimir.
- Suite Python general: **10/10**, sitemap/canonical/enlaces/inventario/IndexNow en modo prueba, sin envío.
- Regresión Node: **43/43** entradas TAP de buscador, SEO financiero, sueldo neto, finiquito y cortinas. El archivo de finiquito ejecuta internamente **244 aserciones**.
- Regresión en navegador: finiquito SEO **26/26**; indemnización motor **56/56**, freeze **94/94**, adversarial **30/30**.
- Axe WCAG 2 A/AA y 2.1 AA: **4 auditorías, 0 infracciones** (inicio/resultado condicionado × 320/1440). No equivale a certificación de accesibilidad.
- Tres guías enlazantes comprobadas a 390 px; enlace nuevo presente, sin desbordamiento ni errores JS en recorridos comprobados.
- Revisión visual mediante captura móvil. Se corrigió una región de tabla desplazable sin foco; ahora tiene tabindex y nombre accesible. Se explicitó “laborables” en la cifra del resultado.
- Incidencias del arnés resueltas: dos scripts antiguos precisaban navegador/core precargado, no ejecución Node aislada; la prueba de clic GA evitó navegación real para inspeccionar el evento. No exigieron modificar productos existentes.

Comandos reproducibles (Node/Python con Playwright disponibles):

```sh
node --test herramientas/comprobador-permisos-laborales-familiares/tests/core.test.js
python3 herramientas/comprobador-permisos-laborales-familiares/tests/static_test.py
python3 herramientas/comprobador-permisos-laborales-familiares/tests/browser_test.py
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.js herramientas/calculadora-finiquito/tests/core.test.js herramientas/calculadora-tela-cortinas/tests/core.test.js
python3 scripts/build_search_index.py --check
git diff --check
```

El navegador necesita servidor raíz en `http://127.0.0.1:8765` o `TEST_BASE_URL`; `CHROME_PATH` permite configurar Chrome. El barrido final de axe/regresiones se ejecutó con un arnés temporal externo al repositorio.

## Mantenimiento pendiente de la futura publicación

Revisar cambios del artículo 37 y sentencias que modifiquen el alcance de continuidad/inicio; conservar fecha y procedencia. Verificar firmeza de SAN 133/2026 antes de afirmarla. No se ha verificado producción ni se declara la URL publicada. No se añadieron anuncios ni nuevas dependencias.
