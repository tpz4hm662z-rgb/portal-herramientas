"""Contratos del sprint de higiene; sin red, despliegue ni dependencias nuevas."""
import json
import subprocess
import unittest
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from test_technical_cleanup import Page, ROOT


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


class Hygiene(unittest.TestCase):
    def test_public_links_do_not_target_the_home_filename_or_test_html(self):
        for file in ROOT.rglob('*.html'):
            if 'tests' in file.relative_to(ROOT).parts:
                continue
            page = Page(file.read_text())
            base = page.canonical[0] if page.canonical else 'https://imoancy.com/' + file.relative_to(ROOT).as_posix()
            for href in page.links:
                url = urlsplit(urljoin(base, href))
                if url.netloc == 'imoancy.com':
                    self.assertNotEqual(url.path, '/index.html', (file, href))
                    self.assertNotIn('tests', Path(url.path).parts, (file, href))

    def test_peso_ideal_has_one_complete_breadcrumb_matching_real_navigation(self):
        page = Page((ROOT / 'herramientas/calculadora-peso-ideal/index.html').read_text())
        crumbs = [x for x in objects(page.jsonld) if x.get('@type') == 'BreadcrumbList']
        self.assertEqual(len(crumbs), 1)
        entries = crumbs[0]['itemListElement']
        self.assertEqual([x['position'] for x in entries], [1, 2])
        self.assertEqual([x['item'] for x in entries], ['https://imoancy.com/', page.canonical[0]])
        self.assertIn(entries[0]['item'], page.links)
        self.assertTrue(all(x.get('name') for x in entries))

    def test_jekyll_config_filters_test_directories_without_hiding_public_files(self):
        # Parse YAML and glob using Ruby, as the existing Pages Jekyll builder does.
        # Full official EntryFilter was additionally exercised during this sprint.
        ruby = r'''
require 'yaml'; require 'json'
config = YAML.safe_load(File.read('_config.yml'))
abort 'Unexpected build setting' unless config.keys == ['exclude']
patterns = config.fetch('exclude')
['tests-public.html', 'tests-assets/style.css', 'herramientas/tests-public/index.html', 'herramientas/demo/tests-public/index.html'].each do |path|
  abort "Overbroad exclusion: #{path}" if patterns.any? { |pattern| File.fnmatch?(pattern, path) || path.start_with?(pattern) }
end
paths = Dir.glob('**/*').select { |p| File.file?(p) }
excluded = paths.select do |path|
  parts = path.split('/')
  ancestors = (1..parts.size).map { |n| parts.take(n).join('/') }
  ancestors.any? { |p| patterns.any? { |pattern| File.fnmatch?(pattern, p) || p.start_with?(pattern) } }
end
puts JSON.generate({excluded: excluded, tests: paths.select { |p| p.split('/').include?('tests') }})
'''
        result = json.loads(subprocess.check_output(['ruby', '-e', ruby], cwd=ROOT, text=True))
        self.assertTrue(result['tests'])
        self.assertEqual(set(result['excluded']), set(result['tests']))
        self.assertFalse((ROOT / '.nojekyll').exists(), 'Would bypass the tested Jekyll exclusions')


if __name__ == '__main__':
    unittest.main()
