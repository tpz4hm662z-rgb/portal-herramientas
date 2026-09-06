"""Integridad del catálogo, enlaces, indexación y datos estructurados públicos."""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import urljoin, urlparse, unquote
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('search_catalog', ROOT / 'scripts/build_search_index.py')
CATALOG = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CATALOG)


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links, self.ids, self.robots, self.canonical, self.jsonld = [], set(), [], [], []
        self.script = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs['href'])
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content', ''))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.script = ''

    def handle_data(self, data):
        if self.script is not None:
            self.script += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.jsonld.append(json.loads(self.script))
            self.script = None


class Integrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.urls = []
        index = ET.parse(ROOT / 'sitemap.xml')
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        for loc in index.findall('.//s:loc', ns):
            path = ROOT / urlparse(loc.text).path.lstrip('/')
            cls.urls.extend(x.text for x in ET.parse(path).findall('.//s:loc', ns))
        cls.pages = {}
        for url in cls.urls:
            path = ROOT / urlparse(url).path.lstrip('/')
            if url.endswith('/'):
                path /= 'index.html'
            cls.pages[url] = Page(path.read_text())

    def test_sitemaps_unique_and_complete(self):
        self.assertEqual(len(self.urls), len(set(self.urls)))
        expected = {str(p.relative_to(ROOT)).removesuffix('index.html') for folder in ('guias', 'herramientas') for p in (ROOT / folder).glob('*/index.html')}
        self.assertTrue({'https://imoancy.com/' + p for p in expected}.issubset(self.urls))

    def test_canonical_and_noindex(self):
        for url, page in self.pages.items():
            with self.subTest(url=url):
                self.assertEqual(page.canonical, [url])
                self.assertNotIn('noindex', ','.join(page.robots))

    def test_internal_destinations_and_fragments(self):
        for url, page in self.pages.items():
            for link in page.links:
                dest = urlparse(urljoin(url, link))
                if dest.netloc != 'imoancy.com':
                    continue
                path = ROOT / unquote(dest.path.lstrip('/'))
                if dest.path.endswith('/'):
                    path /= 'index.html'
                with self.subTest(source=url, link=link):
                    self.assertTrue(path.is_file(), str(path))
                    if dest.fragment and path.suffix == '.html':
                        self.assertIn(unquote(dest.fragment), Page(path.read_text()).ids)

    def test_test_pages_noindex(self):
        for file in ROOT.rglob('*.html'):
            if 'tests' in file.relative_to(ROOT).parts:
                with self.subTest(file=file):
                    self.assertIn('noindex', ','.join(Page(file.read_text()).robots))

    def test_search_catalog_current_and_complete(self):
        content = (ROOT / 'assets/search-index.js').read_text()
        self.assertEqual(content, CATALOG.build())
        items = json.loads(content.split(' = ', 1)[1].removesuffix(';\n'))
        expected = {urlparse(url).path for url in self.urls if urlparse(url).path.count('/') == 3 and url.endswith('/')}
        self.assertEqual({item['url'] for item in items}, expected)
        self.assertEqual(len(items), len({item['url'] for item in items}))
        self.assertTrue(all(item['type'] in ('Guía', 'Herramienta', 'DEPENDE™') for item in items))

    def test_home_static_paths_to_every_solution(self):
        links = set(self.pages['https://imoancy.com/'].links)
        for url in self.urls:
            if urlparse(url).path.count('/') == 3 and url.endswith('/'):
                self.assertIn(url, links)

    def test_item_lists_match_actual_links(self):
        def walk(value):
            if isinstance(value, dict):
                if value.get('@type') == 'ItemList':
                    yield value
                for child in value.values():
                    yield from walk(child)
            elif isinstance(value, list):
                for child in value:
                    yield from walk(child)
        for url in ('https://imoancy.com/', 'https://imoancy.com/guias/'):
            page = self.pages[url]
            for itemlist in walk(page.jsonld):
                entries = itemlist['itemListElement']
                if 'numberOfItems' in itemlist:
                    self.assertEqual(itemlist['numberOfItems'], len(entries))
                for entry in entries:
                    dest = entry.get('url') or entry.get('item')
                    if isinstance(dest, dict):
                        dest = dest.get('url') or dest.get('@id')
                    self.assertIn(dest, page.links)


if __name__ == '__main__':
    unittest.main()
