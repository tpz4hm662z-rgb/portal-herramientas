# Atlas de sol — cierre local e informe A–V

Cierre: **9 de septiembre de 2026**. Investigación original: 8 de septiembre. Estado: **solo local**, sin commit, push, despliegue, envío IndexNow ni modificación de producción.

## Estado recuperado y trabajo de esta última sesión

Al retomar ya estaban creados el motor, la interfaz, la comparación A/B, el atlas mensual, la exportación PNG, los enlaces de configuración, el consentimiento, las pruebas y la portada. Home, buscador y sitemap tenían sus cambios locales preparados. Se conservaron esos archivos y los `.DS_Store` ajenos a la tarea.

La última ejecución de navegador había sido rechazada por la revisión automática al agotarse la cuota. Había quedado sin registrar la repetición posterior a las correcciones de legibilidad y del estado sin JavaScript. El motor, la regresión general y los nueve contratos estáticos ya tenían resultados correctos.

Esta sesión ha completado esa ejecución, ampliado la inspección visual a 1920 px y a las secciones inferiores, comprobado teclado y ampliación de texto, y realizado otra revisión adversarial independiente. Esta encontró un fallo: la reproducción se cortaba a las 22:00, aunque A Coruña en junio puede conservar exposición solar en el modelo hasta las 22:15. Se corrigió exclusivamente el recorrido, alineándolo con las 23:45 del deslizador y sincronizando el reinicio en 00:00. Se añadió su regresión y se confirmó **24/24** en navegador. No se cambió la candidata ni se añadieron funciones.

Cambios de esta última sesión en el repositorio: `script.js` (recorrido), `tests/browser_test.py` (caso 24 y anchura 1920) y este informe. También se actualizó `/tmp/atlas-final-audit.py`, fuera del repositorio. El resto corresponde al trabajo local anterior conservado.

## A. La idea

Un atlas en español para comparar cómo entraría el sol directo por dos orientaciones de una misma ventana y cómo cambia durante el día y en doce fechas del año.

## B. Por qué esta

La investigación ya concluida comparó, entre otras, elección de velocidad de fibra, compatibilidad USB-C, TV a escala, acceso de sofás, equipaje y capacidad de mesas. Fibra tenía cercanía comercial pero calculadoras equivalentes; USB-C dependía de especificaciones que el usuario suele desconocer; TV y equipaje tenían experiencias muy similares; sofás y aforo introducían importantes límites geométricos o de seguridad. El sol combinaba visualización, comparación inmediata y un modelo abordable con supuestos explícitos. El detalle y los descartes están en [INVESTIGACION.md](INVESTIGACION.md).

## C. Evidencia

**Hechos:** existen artículos inmobiliarios sobre orientación y simuladores interiores competentes. [Fotocasa](https://www.fotocasa.es/fotocasa-life/compraventa/mejor-orientacion-buscar-una-vivienda-segun-ciudad/) mantiene contenido sobre esta decisión; [SunPathly Room](https://sunpathly.com/room) es un competidor directo; [Callejear](https://callejear.com/herramientas/orientacion-solar/) ofrece orientación solar en español. También se localizó [Suncarta](https://suncarta.com/tools/window-sunlight-calculator/).

**Señales:** conversaciones de [AskSpain sobre persianas](https://www.reddit.com/r/askspain/comments/1v3y19u/a_qu%C3%A9_hora_se_supone_que_hay_que_cerrar_las/) y [luz en una vivienda](https://www.reddit.com/r/askspain/comments/14xkoq8) muestran preguntas domésticas reales. No miden demanda SEO.

**Hipótesis:** una comparación sencilla A/B puede responder mejor a parte de esa necesidad. No se han medido volumen de búsqueda, CPC, visitas, ingresos o conversiones. No se ha certificado una posición de Google España ni crecimiento de búsquedas. La oportunidad exacta sigue sin demostración cuantitativa.

## D. Hipótesis viral

Una persona podría enviar una lámina o una configuración a quien comparte una decisión sobre vivienda. La comparación da contenido a la conversación. No hay evidencia de viralidad, exportaciones reales ni enlaces obtenidos.

## E. Defensa frente a IA

Cambiar hora, orientación y medidas modifica una geometría visible, conserva un estado comparativo y produce una lámina reproducible. Una respuesta textual aislada no reproduce cómodamente ese recorrido. No hay una barrera tecnológica exclusiva: una IA o un competidor pueden construir algo similar.

## F. Producto

La página abre un ejemplo explícito: Madrid, sur frente a oeste, 21 de junio de 2026. El visitante elige ciudad y rumbos, mueve la hora o reproduce el día, cambia de mes y compara escenas, intervalos y duración. Las medidas y el horizonte simplificado están bajo un desplegable. Puede consultar la tabla anual, guardar el PNG, copiar el enlace o reiniciar. La guía explica cómo leer la orientación y los límites; enlaza a cortinas y revisión de actas de comunidad.

## G. Momento más potente

Pasar de junio a diciembre manteniendo la misma ventana y observar el desplazamiento de la mancha, con la otra orientación al lado. Es una diferencia comprensible sin aprender acimut o declinación. Que produzca sorpresa o fidelidad sigue siendo una valoración de producto, no un resultado de usuarios.

## H. Diseño

Composición editorial, tipografía del sistema y Georgia, fondo claro, tinta oscura y color dorado reservado al sol directo. SVG axonométricos y controles sincronizados. En móvil se mantienen ambas escenas; se corrigieron encuadre, textos pequeños, alineación de selectores y totales mensuales. Estos últimos incluyen A/B y una disposición vertical que evita partir las duraciones. La tabla proporciona otra lectura del gráfico. Los estilos se cargan únicamente en esta URL; no se ha rediseñado el sitio.

## I. Información y fuentes

| Fuente primaria | Qué sustenta |
| --- | --- |
| [NOAA, ecuaciones](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) | Aproximación de año fraccional, ecuación del tiempo, declinación y posición solar. |
| [NOAA, detalles](https://gml.noaa.gov/grad/solcalc/calcdetails.html) | Límites entre cálculo y observación; se advierte que su calculadora ya no recibe mantenimiento. |
| [IGN](https://astronomia.ign.es/hora-salidas-y-puestas-de-sol) | Contexto de horas oficiales y horizonte. Sus amaneceres no son una referencia idéntica a nuestro centro solar geométrico sin refracción. |
| [AEMET](https://www.aemet.es/es/eltiempo/observacion/radiacion/ayuda) | Separación entre radiación directa, difusa y efectos atmosféricos. |
| [Informe NREL SPA](https://docs.nlr.gov/docs/fy08osti/34302.pdf) | Contraste independiente de un caso numérico publicado. No se utiliza su código ni se afirma implementar SPA. |

La prueba con el ejemplo NREL admite 0,6° en ese punto. **No certifica un error máximo de 0,6° en todas las fechas o ubicaciones.** La proyección rectangular y su recorte son geometría propia, con casos analíticos independientes y comprobaciones de invariantes.

## J. SEO

- URL preparada: `https://imoancy.com/herramientas/simulador-sol-ventana/`.
- Title: **Simulador de sol en tu ventana: compara orientaciones | Imoancy**.
- Description: **Mira cómo entraría el sol por una ventana, compara dos orientaciones y explora el año. Simulación visual para ciudades de España, sin registro ni dirección.**
- H1: **Mira cómo cambia el sol en tu ventana.**
- Intención: entender cuándo y dónde podría entrar sol directo, comparando orientaciones.
- Variantes pertinentes: «cuándo entra el sol por mi ventana», «sol ventana norte», «orientación este oeste», «sol en casa invierno verano», «simulador orientación solar». Son consultas de trabajo, no volúmenes ni autocompletados certificados.

Canonical único, `index, follow`, Open Graph con PNG existente, WebPage y BreadcrumbList coherentes, contenido estático y fuentes accesibles sin JavaScript. No se han añadido FAQ, valoraciones ficticias ni marcado de aplicación con atributos inventados. La configuración compartida usa fragmentos, no nuevas páginas indexables. No se identificó una herramienta existente con la misma intención.

El SEO técnico está preparado localmente. El valor SEO potencial es incierto: hay competencia editorial fuerte para orientación de vivienda y herramientas especializadas para simulación. No se promete primera posición ni tráfico suficiente para rentabilizar publicidad.

## K. Shareability

PNG de 1200 × 940 con dos escenas, fecha, hora, ciudad aproximada, medidas, duraciones y supuestos. Enlace versionado que recupera la configuración al abrirlo o navegar a él. No requiere cuenta ni escribe direcciones en la URL. La imagen tiene contexto para circular fuera de la página; no contiene un diagnóstico térmico. El resultado es reutilizable, pero no existe evidencia de que las personas prefieran compartirlo.

## L. Monetización

Publicidad display relacionada con vivienda, ventanas o protección solar sería una vía futura. El contexto tiene proximidad comercial; la sesión individual no equivale a intención de compra. No se han investigado ingresos, acuerdos o afiliación en profundidad y no se han insertado anuncios. Monetización y backlinks deben considerarse hipótesis.

## M. GA4

Se mantiene el patrón de opt-in independiente utilizado en cortinas y permisos: sin cargar gtag antes de aceptar, preferencia local y posibilidad de revocación. Medición `G-QH8MJ6LVHN`.

| Evento | Significado / parámetros específicos |
| --- | --- |
| `page_view`, `solar_view` | Llegada medida tras consentimiento; título en page_view. |
| `solar_start` | Primera acción medida. |
| `solar_explore` | Familia de control: city, bearing, month, time, geometry u obstruction; se limita la repetición consecutiva. |
| `solar_result` | Primera actualización válida medida, no lectura o comprensión demostrada del resultado. |
| `solar_repeat` | Reinicio del ejemplo. |
| `solar_share` | Imagen o enlace; iniciar una exportación/copia no acredita compartirla con otra persona. |
| `solar_related_click` | Destino cortinas o actas. |

Parámetros comunes: identificador de herramienta, canonical fijo y referrer vacío. No se envían ciudad, coordenadas, rumbos, medidas, resultados ni fragmento. Se corrigió el consumo de indicadores antes de consentir: aceptar no reconstruye acciones anteriores y la siguiente interacción sí se mide. Las pruebas interceptan la red; **no se ha verificado recepción real en GA4 ni se han enviado eventos de prueba a producción**.

## N. Privacidad

No hay geolocalización, dirección postal, nombre, registro, backend propio ni consulta a mapas. Las entradas permanecen en memoria y solo se incorporan al enlace o PNG por acción explícita. localStorage guarda exclusivamente la preferencia analítica de esta herramienta; no se usa sessionStorage para respuestas. La aplicación funciona si el almacenamiento está bloqueado. El consentimiento deniega funciones publicitarias y Google Signals. La infraestructura ordinaria del alojamiento y, al consentir, el proveedor analítico siguen recibiendo las solicitudes técnicas correspondientes.

## O. Arquitectura

HTML estático; CSS exclusivo; motor UMD puro en `js/core.js`; interacción y exportación en `script.js`. Cálculo astronómico, validación, proyección, recorte y resúmenes están separados de la interfaz. Caché de posiciones solares y perfiles evita recalcular el año al mover la hora. Sin librerías de gráficos, mapas, fuentes externas ni bundler nuevo. Los enlaces de configuración tienen versión y una lista estricta de campos admitidos.

## P. Performance

| Recurso | Bytes sin comprimir | Gzip estimado local |
| --- | ---: | ---: |
| HTML | 19.762 | 6.866 |
| CSS | 18.436 | 4.848 |
| UI JS | 24.133 | 8.651 |
| Motor JS | 14.897 | 4.683 |
| **Inicial propio** | **77.228** | **25.048** |
| Portada PNG | 135.672 | — |

Además se usan isotipo y favicon existentes, 2.367 bytes sin comprimir. La portada no se descarga para mostrar la interfaz. Las cifras gzip son compresión calculada, no configuración comprobada del servidor de producción.

En Chrome local, sin limitación de red o CPU, la pasada visual registró FCP 56 ms y suma de desplazamientos observados 0 durante la carga inicial. En 96 cambios de hora consecutivos, el trabajo JS síncrono tuvo mediana 0,1 ms y máximo 0,5 ms, **sin incluir el pintado**. Son observaciones de laboratorio local, no Lighthouse, INP o Core Web Vitals de usuarios. El pequeño cambio posterior del límite de reproducción no cambia recursos ni cálculo de posiciones; la suite funcional final lo verifica.

## Q. Accesibilidad y responsive

- Inspección de 320, 360, 390, 768, 1440 y 1920 px: sin desbordamiento horizontal del documento. Revisadas escenas, atlas, exportación y secciones editoriales/guardar/consentimiento; también medidas desplegadas en la suite.
- Cuatro pasadas Axe: 320 y 1440 px, junio y diciembre, reglas WCAG 2 A/AA y 2.1 AA: **0 infracciones detectadas**.
- Teclado: deslizador cambia 15 minutos por flecha, mantiene foco y anuncia hora local. Contorno visible de 3 px. Controles nativos, labels, landmarks, títulos y descripciones SVG distintos, tabla y estados dinámicos.
- Entradas inválidas ocultan los resultados a interacción y tecnología asistiva; compartir se desactiva y reinicio sigue accesible. Se limpia aria-invalid al recuperar validez.
- Sin reproducción automática inicial; preferencia reduced motion respetada. El recorrido explícito se ralentiza y se detiene al ocultar la pestaña.
- Ampliación de texto raíz al 200 % y estrés CSS zoom 200 % sin overflow a 1440 px. Reflow comprobado hasta 320 px. Un experimento previo con CSS zoom 400 % desbordó, pero esa inyección no cambia las media queries como el zoom real del navegador; no se presenta como prueba certificada de zoom nativo 400 %.

**Límites de la auditoría:** no se han utilizado VoiceOver/NVDA con una persona usuaria, un dispositivo móvil físico ni Safari/Firefox. Axe y emulación no acreditan accesibilidad completa. A 320 px las escenas son pequeñas: la comparación sigue siendo legible con sus textos, pero no sirve para inspección arquitectónica de detalle.

## R. Tests y resultados registrados

| Suite | Aprobados | Fallidos |
| --- | ---: | ---: |
| Motor Atlas (Node) | 54 | 0 |
| Navegador Atlas, ejecución final | 24 | 0 |
| SEO/integración estática Atlas | 9 | 0 |
| Regresión Python de raíz | 10 | 0 |
| Buscador | 16 | 0 |
| Malla SEO financiera, comprobaciones internas | 42 | 0 |
| Sueldo neto core, comprobaciones internas | 14 | 0 |
| Sueldo neto mensual, comprobaciones internas | 46 | 0 |

El comando combinado Node informa 73/73 unidades del runner: 54 de Atlas, 16 de búsqueda y tres archivos legacy, cuyos contadores internos se desglosan arriba. No se suman esos 73 de nuevo. La suite de navegador final no omitió Axe. No se afirma haber ejecutado todas las suites particulares de las otras 39 herramientas.

Motor: barrido de **138.240 proyecciones** (15 ciudades × 12 meses × 8 rumbos × 96 momentos) y **2.500 geometrías válidas adicionales**. Casos independientes de proyección, recorte, signos, horizonte, suelo frente a pared, huecos entre intervalos, simetría A/B, invalidación y fechas península/Canarias. Norte de verano conserva dos intervalos separados; norte invernal no inventa exposición; rayos rasantes y horas nocturnas no generan polígonos absurdos.

Navegador: estados iniciales, cambios, límites, campos vacíos, exactos e inválidos, recuperación, reinicio, tabla, PNG, enlaces compartidos y corruptos, anclas editoriales, consentimiento/revocación/tardío, almacenamiento bloqueado, recursos, fallback sin JS y sin motor, responsive, Axe y recorrido completo de A Coruña.

Comandos reproducibles desde la raíz, con Node disponible en PATH y servidor local en 8765:

```sh
node --test tests/*.test.js herramientas/simulador-sol-ventana/tests/core.test.js
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py'
PYTHONDONTWRITEBYTECODE=1 python3 herramientas/simulador-sol-ventana/tests/static_test.py
PYTHONDONTWRITEBYTECODE=1 /tmp/imoancy-seo-venv/bin/python herramientas/simulador-sol-ventana/tests/browser_test.py
python3 scripts/build_search_index.py --check
node --check herramientas/simulador-sol-ventana/script.js
node --check herramientas/simulador-sol-ventana/js/core.js
git diff --check
```

El navegador usa Chrome instalado, Playwright local y `/tmp/imoancy-axe.min.js`; las rutas pueden configurarse con las variables indicadas en el test. Catálogo sincronizado, sintaxis y diff correctos. Las capturas y mediciones complementarias están en `/tmp/atlas-final-*.png` y `/tmp/atlas-final-audit.json`; son artefactos temporales, no recursos necesarios para publicar.

## S. Revisión adversarial y correcciones

Durante el cierre previo se corrigieron: colisión entre versión y ancho de ventana en el enlace, favicon inexistente, contraste insuficiente de numerales, error que podía quedar oculto al cambiar ciudad, reinicio inaccesible en estado inválido, aria-invalid obsoleto, consumo de eventos antes del consentimiento y anclas que restablecían los ajustes. También se corrigieron encuadre/legibilidad móvil, proporciones de exportación y referencia del norte; se eliminaron un rayo decorativo y travesaños no modelados. Sin JS ya no permanece un mensaje de carga indefinida.

La nueva revisión independiente, después de considerar terminado el producto, encontró el corte de reproducción a las 22:00. Se corrigió y el caso 24 comprueba 21:45 → 22:00 → 22:15 → 23:45, parada y reinicio en 00:00. El revisor confirmó el cierre del único fallo señalado.

La evaluación competitiva fue adversarial: SunPathly ya simula interiores; un buen diseño por sí solo no demuestra superioridad. La comparación en español es una diferenciación de experiencia, no una novedad fundamental ni una defensa difícil de copiar.

## T. Limitaciones y riesgos pendientes

Quince ciudades aproximadas; doce días de referencia de **2026**; ventana rectangular centrada, pared de 3 m, habitación rectangular y suelo horizontal. No se modelan marcos, profundidad del muro, muebles, reflexiones, vidrio, toldos, balcones, árboles o edificios reales. La barrera de horizonte es uniforme. El día 21 no siempre coincide con solsticio o equinoccio. No hay medias mensuales ni tiempo meteorológico.

La posición es geométrica, sin refracción; los intervalos se muestrean cada 15 minutos y acumulan incertidumbre de orientación, posición y geometría. Las horas con exposición de ventana no equivalen a horas de mancha en el suelo. Ninguna equivale a luminosidad útil, radiación recibida, calor, temperatura, confort o ahorro.

No se ha contrastado contra habitaciones medidas. Sigue pendiente probar si personas sin conocimientos solares entienden correctamente sus límites y encuentran ventaja frente a alternativas. Tampoco se conocen tráfico, repetición, backlinks o rendimiento publicitario. El año fijo requiere una decisión editorial futura: conservar el atlas de referencia o actualizarlo con validación; no cambiarlo silenciosamente sin revisar horarios y enlaces compartidos. Falta validación en navegadores/dispositivos reales adicionales y cualquier comprobación de producción, excluida expresamente del alcance.

## U. Diff e integración real

**Cuatro archivos existentes modificados:**

| Archivo | Cambio |
| --- | --- |
| `index.html` de raíz | Una tarjeta en vivienda y una entrada ItemList. |
| `scripts/build_search_index.py` | Alias de recuperación para el atlas. |
| `assets/search-index.js` | Una entrada regenerada. |
| `sitemaps/sitemap-herramientas.xml` | Un canonical nuevo. |

**Diez archivos nuevos frente a HEAD**, todos en `herramientas/simulador-sol-ventana/`:

`index.html`, `style.css`, `script.js`, `js/core.js`, `portada.png`, `tests/core.test.js`, `tests/browser_test.py`, `tests/static_test.py`, `INVESTIGACION.md`, `REVISION.md`.

Inventario comprobado contra archivos reales: **40 herramientas + 19 guías = 59 soluciones**. Home/ItemList, catálogo generado y sitemap coinciden, sin duplicar la nueva URL. El sitemap principal ya incluye el de herramientas y no necesita cambios. En Chrome local, «sol ventana» y «sombra» encuentran el atlas; «orientación» lo sitúa primero; «cortinas» conserva su resultado. Home a 390/1440, ancla vivienda, tarjeta nueva y tarjeta de cortinas sin errores ni overflow. Enlaces contextuales y destinos legales existen localmente.

No se modificaron reglas de otras herramientas, otras URLs, hojas globales ni producción. Los `.DS_Store` presentes se conservan y quedan fuera del trabajo. La integración está preparada para una publicación hipotética; no ejecutada.

## V. Veredicto

**PUBLICAR CON RESERVAS.**

El producto aporta una utilidad real que un artículo no reproduce: comparar en vivo dos orientaciones y observar sus diferencias sin entregar una dirección. Tiene un resultado guardable, límites físicos visibles, integración completa y una batería local de pruebas que no deja fallos conocidos del alcance implementado.

Las reservas importan: no es una idea inédita; SunPathly es un rival competente; el uso de ciudades aproximadas limita decisiones sobre una vivienda concreta; no hay validación de usuarios, demanda SEO medida o evidencia de compartición. Su acabado merece una publicación experimental, pero **no demuestra todavía un flagship comercial ni una oportunidad excepcional de posicionamiento**. Publicarlo tendría sentido para aprender con uso real y explícito consentimiento, sin presentarlo como simulación profesional o inversión SEO ya validada.

Este veredicto es una recomendación. La fase local queda cerrada; no se ha publicado nada.
