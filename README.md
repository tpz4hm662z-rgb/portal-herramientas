# Imoancy

Portal estático de herramientas digitales gratuitas para personas y familias.

## Sitio oficial

https://imoancy.com/

## Desarrollo local

El portal utiliza HTML, CSS y JavaScript sin dependencias ni proceso de compilación. Para revisarlo localmente, sirve la raíz del repositorio con un servidor HTTP estático.

## Publicación

La publicación se realiza mediante GitHub Pages. `robots.txt` y `sitemap.xml` utilizan exclusivamente la URL oficial del portal.

### IndexNow automático

Cada push a `main` que modifica HTML activa `.github/workflows/indexnow.yml`. El flujo compara los commits del push y envía en un único lote solo páginas públicas con canonical válido de `imoancy.com`: portada, páginas raíz, herramientas y guías. Se excluyen tests, recursos internos, páginas `noindex`, rutas sin canonical válido y archivos eliminados. La clave pública existente se lee del archivo raíz cuyo nombre coincide con su contenido; no requiere secretos ni servicios externos.

Para probar la detección sin enviar nada, ejecuta:

```bash
python3 scripts/indexnow.py --before HEAD^ --after HEAD
```

Solo el workflow utiliza `--submit` para realizar la petición POST a la API actual de IndexNow.

## Catálogo del buscador

El buscador carga `assets/search-index.js` sin peticiones a un backend. Al añadir,
retirar o cambiar la metadata de una solución, ejecuta:

```bash
python3 scripts/build_search_index.py
python3 scripts/build_search_index.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/search.test.js
```

El generador toma las herramientas y guías indexables, sus títulos, descripciones y
canonical. El vocabulario adicional se mantiene en `ALIASES` dentro del generador;
no modifica el contenido SEO. Los tres experimentos existentes se identifican como
DEPENDE™. La búsqueda ignora acentos y palabras de enlace, puntúa coincidencias y
muestra hasta seis resultados de forma determinista.

GitHub Pages utiliza su compilación Jekyll habitual. `_config.yml` excluye `tests/**`
y `herramientas/*/tests/**` del sitio publicado, sin eliminar archivos del repositorio
ni afectar al servidor HTTP local o a GitHub Actions. Los HTML de pruebas mantienen
`noindex` como respaldo para otros servidores. No se bloquean en `robots.txt`.
