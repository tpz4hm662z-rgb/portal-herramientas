"""Permanent publishing contracts; no browser, network or generated file writes.

Run: PYTHONDONTWRITEBYTECODE=1 python3 herramientas/simulador-sol-ventana/tests/static_test.py
Inventory assertions use actual pages so adding a future tool does not invalidate
this feature's tests. The publication candidate has 40 tools and 19 guides.
"""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import struct
import unittest
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
TOOL = ROOT / 'herramientas/simulador-sol-ventana'
ORIGIN = 'https://imoancy.com'
CANONICAL = ORIGIN + '/herramientas/simulador-sol-ventana/'
TITLE = 'Simulador de sol en tu ventana: compara orientaciones | Imoancy'
DESCRIPTION = ('Mira cómo entraría el sol por una ventana, compara dos orientaciones '
               'y explora el año. Simulación visual para ciudades de España, sin registro ni dirección.')
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.meta, self.canonical, self.ids, self.links = {}, [], [], []
        self.resources, self.scripts, self.schemas, self.headings = [], [], [], []
        self.title, self.noscript = '', ''
        self._heading = None
        self._title = self._noscript = False
        self._schema = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'title':
            self._title = True
        if tag == 'h1':
            self._heading = ''
        if tag == 'br' and self._heading is not None:
            self._heading += ' '
        if tag == 'noscript':
            self._noscript = True
        if tag == 'meta':
            key = attrs.get('name') or attrs.get('property')
            self.meta.setdefault(key, []).append(attrs.get('content', ''))
            if key in ('og:image', 'twitter:image'):
                self.resources.append(attrs['content'])
        if tag == 'link':
            relations = attrs.get('rel', '').split()
            if 'canonical' in relations:
                self.canonical.append(attrs.get('href'))
            if any(rel in relations for rel in ('stylesheet', 'icon', 'apple-touch-icon', 'preload')):
                self.resources.append(attrs['href'])
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag in ('img', 'script') and 'src' in attrs:
            self.resources.append(attrs['src'])
        if tag == 'script':
            if 'src' in attrs:
                self.scripts.append(attrs)
            elif attrs.get('type') == 'application/ld+json':
                self._schema = ''

    def handle_data(self, data):
        if self._title:
            self.title += data
        if self._heading is not None:
            self._heading += data
        if self._noscript:
            self.noscript += data
        if self._schema is not None:
            self._schema += data

    def handle_endtag(self, tag):
        if tag == 'title':
            self._title = False
        if tag == 'h1':
            self.headings.append(' '.join(self._heading.split()))
            self._heading = None
        if tag == 'noscript':
            self._noscript = False
        if tag == 'script' and self._schema is not None:
            self.schemas.append(json.loads(self._schema))
            self._schema = None


def nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from nodes(child)


def local_path(url):
    parsed = urlsplit(url)
    path = ROOT / unquote(parsed.path.lstrip('/'))
    return path / 'index.html' if parsed.path.endswith('/') else path


class Static(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (TOOL / 'index.html').read_text()
        cls.page = Page(cls.html)
        cls.home = Page((ROOT / 'index.html').read_text())
        cls.tool_urls = {ORIGIN + '/' + file.relative_to(ROOT).as_posix().removesuffix('index.html')
                         for file in (ROOT / 'herramientas').glob('*/index.html')}
        cls.guide_urls = {ORIGIN + '/' + file.relative_to(ROOT).as_posix().removesuffix('index.html')
                          for file in (ROOT / 'guias').glob('*/index.html')}

    def test_unique_metadata_matches_approved_search_intent(self):
        self.assertEqual(self.page.title, TITLE)
        self.assertEqual(self.page.meta.get('description'), [DESCRIPTION])
        self.assertEqual(self.page.headings, ['Mira cómo cambia el sol en tu ventana.'])
        self.assertEqual(self.page.canonical, [CANONICAL])
        self.assertEqual(self.page.meta.get('robots'), ['index, follow'])
        self.assertEqual(self.page.meta.get('og:url'), [CANONICAL])
        self.assertEqual(len(self.page.ids), len(set(self.page.ids)))

    def test_schema_describes_this_page_and_valid_breadcrumbs(self):
        schema_nodes = list(nodes(self.page.schemas))
        pages = [node for node in schema_nodes if node.get('@type') == 'WebPage']
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0]['url'], CANONICAL)
        self.assertEqual(pages[0]['name'], TITLE)
        self.assertEqual(pages[0]['description'], DESCRIPTION)
        crumbs = [node for node in schema_nodes if node.get('@type') == 'BreadcrumbList']
        self.assertEqual(len(crumbs), 1)
        self.assertEqual(pages[0]['breadcrumb']['@id'], crumbs[0]['@id'])
        entries = crumbs[0]['itemListElement']
        self.assertEqual([entry['position'] for entry in entries], [1, 2, 3])
        self.assertEqual([entry['item'] for entry in entries], [ORIGIN + '/', ORIGIN + '/#vivienda', CANONICAL])
        self.assertFalse(any('aggregateRating' in node or 'review' in node for node in schema_nodes))
        for app in (node for node in schema_nodes if node.get('@type') in ('WebApplication', 'SoftwareApplication')):
            self.assertEqual(app['url'], CANONICAL)
            self.assertTrue(app['name'])

    def test_local_resources_exist_without_preconsent_remote_scripts(self):
        self.assertTrue(self.page.resources)
        for resource in self.page.resources:
            resolved = urljoin(CANONICAL, resource)
            with self.subTest(resource=resource):
                self.assertEqual(urlsplit(resolved).netloc, 'imoancy.com')
                self.assertTrue(local_path(resolved).is_file(), str(local_path(resolved)))
                self.assertGreater(local_path(resolved).stat().st_size, 0)
        self.assertEqual([script['src'] for script in self.page.scripts], ['js/core.js', 'script.js'])
        self.assertTrue(all('defer' in script for script in self.page.scripts))
        for resource in re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)', (TOOL / 'style.css').read_text()):
            if not resource.startswith('data:'):
                resolved = urljoin(CANONICAL + 'style.css', resource)
                self.assertEqual(urlsplit(resolved).netloc, 'imoancy.com')
                self.assertTrue(local_path(resolved).is_file(), resource)

    def test_social_preview_is_a_real_image_of_usable_size(self):
        previews = self.page.meta.get('og:image', [])
        self.assertEqual(len(previews), 1)
        path = local_path(previews[0])
        self.assertTrue(path.is_file(), str(path))
        header = path.read_bytes()[:24]
        self.assertEqual(header[:8], b'\x89PNG\r\n\x1a\n')
        width, height = struct.unpack('>II', header[16:24])
        self.assertGreaterEqual(width, 600)
        self.assertGreaterEqual(height, 315)

    def test_internal_links_and_fragments_have_real_destinations(self):
        for href in self.page.links:
            resolved = urljoin(CANONICAL, href)
            parsed = urlsplit(resolved)
            if parsed.netloc != 'imoancy.com':
                continue
            with self.subTest(href=href):
                path = local_path(resolved)
                self.assertTrue(path.is_file(), str(path))
                if parsed.fragment:
                    self.assertIn(unquote(parsed.fragment), Page(path.read_text()).ids)
        self.assertIn(ORIGIN + '/herramientas/calculadora-tela-cortinas/', self.page.links)
        self.assertIn(ORIGIN + '/guias/actas-comunidad-antes-comprar-piso/', self.page.links)

    def test_home_inventory_tracks_actual_tools_without_duplicates(self):
        lists = [node for node in nodes(self.home.schemas)
                 if node.get('@type') == 'ItemList' and node.get('@id') == ORIGIN + '/#herramientas']
        self.assertEqual(len(lists), 1)
        entries = lists[0]['itemListElement']
        destinations = [entry['url'] for entry in entries]
        self.assertEqual(lists[0]['numberOfItems'], len(self.tool_urls))
        self.assertEqual(len(entries), len(self.tool_urls))
        self.assertEqual(set(destinations), self.tool_urls)
        self.assertEqual(len(destinations), len(set(destinations)))
        self.assertEqual([entry['position'] for entry in entries], list(range(1, len(entries) + 1)))
        self.assertEqual(destinations.count(CANONICAL), 1)
        self.assertEqual(self.home.links.count(CANONICAL), 1)

    def test_search_catalog_matches_metadata_and_actual_inventory(self):
        spec = importlib.util.spec_from_file_location('atlas_search_catalog', ROOT / 'scripts/build_search_index.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        source = (ROOT / 'assets/search-index.js').read_text()
        self.assertEqual(source, builder.build())
        records = json.loads(source.split(' = ', 1)[1].removesuffix(';\n'))
        expected = {urlsplit(url).path for url in self.tool_urls | self.guide_urls}
        self.assertEqual({record['url'] for record in records}, expected)
        self.assertEqual(len(records), len(expected))
        own = [record for record in records if record['url'] == urlsplit(CANONICAL).path]
        self.assertEqual(len(own), 1)
        self.assertEqual(own[0]['title'], TITLE.removesuffix(' | Imoancy'))
        self.assertEqual(own[0]['description'], DESCRIPTION)
        self.assertEqual(own[0]['type'], 'Herramienta')
        for word in ('sol', 'ventana', 'orientacion', 'invierno', 'verano'):
            self.assertIn(word, own[0]['terms'].split())

    def test_sitemap_exposes_one_canonical_only(self):
        maps = [node.text for node in ET.parse(ROOT / 'sitemap.xml').findall('.//s:loc', NS)]
        self.assertIn(ORIGIN + '/sitemaps/sitemap-herramientas.xml', maps)
        urls = []
        for url in maps:
            urls.extend(node.text for node in ET.parse(local_path(url)).findall('.//s:loc', NS))
        self.assertEqual(urls.count(CANONICAL), 1)
        self.assertFalse(any(url.startswith(CANONICAL) and url != CANONICAL for url in urls))
        tools = [node.text for node in ET.parse(ROOT / 'sitemaps/sitemap-herramientas.xml').findall('.//s:loc', NS)]
        self.assertEqual(set(tools), self.tool_urls)
        self.assertEqual(len(tools), len(set(tools)))
        robots = (ROOT / 'robots.txt').read_text()
        self.assertIn('Sitemap: ' + ORIGIN + '/sitemap.xml', robots)

    def test_useful_static_methodology_and_no_script_fallback(self):
        self.assertIn('JavaScript', self.page.noscript)
        self.assertTrue({'metodo', 'sources-title', 'explorar'}.issubset(self.page.ids))
        for source in ('gml.noaa.gov/grad/solcalc/solareqns.PDF', 'astronomia.ign.es', 'www.aemet.es'):
            self.assertTrue(any(source in href for href in self.page.links), source)
        for concept in ('15 minutos', 'no medias mensuales', 'norte geográfico', 'radiación difusa', '2026'):
            self.assertIn(concept, self.html)


if __name__ == '__main__':
    unittest.main()
