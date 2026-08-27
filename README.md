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
