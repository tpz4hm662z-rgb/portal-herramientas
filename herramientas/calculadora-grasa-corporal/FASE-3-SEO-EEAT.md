# Fase 3 — SEO, metodología pública y EEAT

Fecha de revisión: 2026-08-14.

## Alcance

La calculadora y sus resultados continúan siendo el contenido principal. Esta fase
actúa después del flujo de cálculo: alinea metadatos, corrige el grafo JSON-LD,
publica la metodología científica ya aprobada, mejora las preguntas frecuentes,
explica el almacenamiento local y añade una salida impresa que excluye el historial.
No modifica el núcleo científico ni cambia fórmulas, rangos o redondeos.

## Decisiones de datos estructurados

- Se usa un único bloque JSON-LD con Organization, WebPage,
  WebApplication y BreadcrumbList, cada entidad con un identificador distinto.
- La miga visible Inicio > Calculadora de Grasa Corporal coincide con los dos
  elementos de BreadcrumbList.
- Se declara isAccessibleForFree porque la gratuidad es visible. No se
  inventan Offer, precio, valoración, reseña ni autoría sanitaria.
- Se retira FAQPage. La FAQ sigue visible, pero Google limita desde 2023 sus
  resultados enriquecidos a sitios sanitarios y gubernamentales reconocidos; no
  existe evidencia para presentar Imoancy como elegible.

Documentación consultada:

- Google Search Central, FAQ y HowTo:
  https://developers.google.com/search/blog/2023/08/howto-faq-changes
- Google Search Central, breadcrumbs:
  https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google Search Central, aplicaciones:
  https://developers.google.com/search/docs/appearance/structured-data/software-app
- Google Search Central, políticas generales:
  https://developers.google.com/search/docs/appearance/structured-data/sd-policies

## Fuentes científicas visibles

- CUN-BAE: Gómez-Ambrosi et al., Diabetes Care (2012),
  PMID 22179957, doi:10.2337/dc11-1334.
- RFM: Woolcott y Bergman, Scientific Reports (2018),
  doi:10.1038/s41598-018-29362-1.
- Cintura: manual oficial de antropometría NHANES/NCHS.

La página distingue el error poblacional publicado de CUN-BAE de un intervalo
individual, no mezcla métodos y no establece umbrales diagnósticos.

## Retirada quirúrgica del legado Navy

Archivos retirados:

- js/config.js — SHA-256 previo:
  53b6add2056e0be5d69f7756ce221b262c9516860ef57b64e08c858d033649e3
- js/core.js — SHA-256 previo:
  6f4c3817fd1060a875e2a038632fa95259d29756da16427298004e040e45292f

Ambos eran archivos rastreados de la interfaz Navy anterior. La página no los
cargaba, el controlador actual no los consumía y no existían referencias con su
ruta completa fuera de documentación y pruebas negativas. Los archivos homónimos
de otras herramientas son independientes y no se modifican.

## Privacidad, rendimiento e impresión

No se añaden librerías, fuentes, imágenes, peticiones ni identificadores
analíticos. Se mantiene una sola carga del identificador institucional GA4. Las
medidas corporales continúan fuera de URL y analítica; el historial solo se guarda
tras confirmación en localStorage.

En impresión se ocultan formularios, controles, navegación, paneles de guardado y
todo el bloque de evolución, para evitar imprimir por accidente el historial local.
