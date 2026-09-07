# Auditoría final: tela para cortinas

Fecha: 7 de septiembre de 2026. Cambios locales, sin commit, push ni despliegue.

## Alcance e integración

- Una nueva página HTML indexable: `/herramientas/calculadora-tela-cortinas/`.
- Canonical único, título y descripción específicos, H1 único, Open Graph y Twitter.
- JSON-LD WebPage, WebApplication y BreadcrumbList; sin valoraciones inventadas.
- Tarjeta en Vivienda de la portada; ItemList actualizado a 38 herramientas.
- Dos enlaces contextuales desde la guía de presupuestos de reforma y la herramienta de costura de vaqueros.
- URL en `sitemaps/sitemap-herramientas.xml`, ya incluido en el índice principal. Catálogo interno regenerado y sinónimos añadidos.
- Guía, fórmulas, ejemplos y fuentes legibles sin JavaScript. No se han creado otras páginas de intención equivalente.

La investigación y sus límites están en `RESEARCH.md`. No se pudo certificar el #1 de Google debido al CAPTCHA. El orden del buscador disponible no se presenta como una comprobación de posiciones de Google. Tampoco hay volúmenes de Keyword Planner, datos de Search Console ni RPM medidos.

## Pruebas completadas

**60 pruebas automatizadas aprobadas:**

- 23 del motor, con 180 combinaciones deterministas adicionales dentro de una prueba: cobertura, cortes, encogimiento, orillos, uniones, case recto, reserva inicial, redondeo, precio y límites.
- 16 del buscador existente, incluida recuperación de todas las herramientas por su título.
- 10 de integridad del portal: sitemap, canonical, enlaces y fragmentos, datos estructurados, catálogo, ItemList y noindex de páginas de pruebas.
- 11 de integración en Chrome: valores decimales en español; estados inválidos sin conservar una compra anterior; altura insuficiente; patrones no compatibles; comparación sin reutilizar el precio de otra tela; copia y alternativa manual; impresión; consentimiento y eventos GA4; teclado y móvil; JavaScript ausente, almacenamiento bloqueado y fallo de carga del motor.

Comandos de reproducción desde la raíz del repositorio:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build_search_index.py --check
node --test herramientas/calculadora-tela-cortinas/tests/core.test.js tests/search.test.js
node --check herramientas/calculadora-tela-cortinas/script.js
git diff --check
```

Para la integración de navegador, servir la raíz en una terminal y ejecutar en otra:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
python herramientas/calculadora-tela-cortinas/tests/browser_test.py
```

El segundo comando necesita Playwright para Python y Chrome. Admite `CHROME_PATH` y `TEST_BASE_URL`. En esta sesión se usó un entorno temporal `/tmp/imoancy-seo-venv`; el ejecutable Node incluido en Playwright permitió ejecutar las pruebas JS sin añadir dependencias al portal. Las pruebas interceptan las peticiones de Google y no envían eventos a producción.

## Accesibilidad, presentación y carga

- Revisión visual de escritorio a 1440 px, móvil a 390 px y PDF de impresión.
- Sin desbordamiento horizontal del documento a 320, 390, 768 y 1440 px. La tabla de ejemplos tiene desplazamiento propio y se puede manejar con teclado.
- axe-core 4.10.3: **cero infracciones** con reglas WCAG 2 A/AA, WCAG 2.1 AA y buenas prácticas, en escritorio, móvil, ajustes avanzados abiertos y formulario con error.
- Los elementos SVG y la flecha decorativa requirieron comprobar el contraste manualmente: ratios 6,82:1, 6,18:1, 6,33:1 y 6,71:1 sobre sus fondos. Superan 4,5:1. La auditoría automática no equivale a una certificación de accesibilidad.
- Carga inicial sin analítica ni anuncios: **123.194 bytes transferidos**, incluidos HTML, CSS, motor, interfaz, logo y favicon. Sin fuentes remotas ni bibliotecas de interfaz.
- Tres simulaciones de Chrome a 390 × 844 px, caché desactivada, CPU ×4, latencia de 150 ms y descarga limitada a 200.000 bytes/s: LCP **652 / 636 / 652 ms**, CLS **0 / 0 / 0**.
- Son resultados de laboratorio contra servidor local. No son Core Web Vitals de usuarios reales ni una prueba del rendimiento tras activar publicidad. No se ha medido INP de campo.

## Correcciones de auditoría

- Un margen de unión vacío o inválido, oculto en doble ancho, ya no bloquea un cálculo donde no interviene; vuelve a validarse al seleccionar tiras.
- El ejemplo escrito de encogimiento usa `270 ÷ 0,95 ≈ 284,21 cm`, coherente con el motor.
- Tras calcular en móvil, el foco y el desplazamiento llevan al resultado de forma inmediata.
- Las tablas desplazables son accesibles por teclado y tienen nombre de región.
- El grupo de ejemplos tiene rol accesible compatible con su etiqueta.
- La impresión elimina el recorte producido por el borde redondeado de la tarjeta.
- Si no carga el motor, se conserva la ayuda estática y se impide un envío que pudiera provocar otro error.

## Medición y publicidad

GA4 usa el identificador existente `G-QH8MJ6LVHN`. Permanece desactivado hasta que el visitante lo permite; se puede revocar y la herramienta funciona sin almacenamiento local. Eventos: `curtain_start`, `curtain_calculate`, `curtain_error`, `curtain_compare`, `curtain_example` y `curtain_export`. Los parámetros son identificadores y categorías de uso; no se envían medidas, precios, resultados ni texto copiado. Los cálculos iniciales de ejemplo no generan un evento de cálculo de usuario.

Se han preparado dos ubicaciones publicitarias ocultas, después de la herramienta y de la guía. **No se ha activado AdSense**: el repositorio no contiene un identificador de editor ni bloques publicitarios reales. No se generan anuncios, peticiones publicitarias, espacios vacíos ni identificadores inventados. El potencial económico sigue siendo una hipótesis, no un ingreso implementado o validado.

## Límites de cálculo visibles

Una o dos hojas iguales por cálculo, una capa de tejido, tiras completas por hoja y encogimiento uniforme en ambos ejes. No se optimizan medias tiras ni retales entre ventanas. El case de medio salto y el estampado girado se bloquean, y el doble ancho requiere confirmar que el tejido admite esa orientación. El plan es de compra y reparto; el usuario debe presentar y comprobar el dibujo antes de cortar.
