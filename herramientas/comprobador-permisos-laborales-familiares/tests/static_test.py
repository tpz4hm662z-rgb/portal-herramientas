"""Contract checks for the new page and the narrowly scoped cluster integration."""
import json
import re
import subprocess
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
TOOL=ROOT/'herramientas/comprobador-permisos-laborales-familiares'
HTML=(TOOL/'index.html').read_text()
class Static(unittest.TestCase):
    def test_metadata_and_schema(self):
        self.assertEqual(len(re.findall(r'<h1[ >]',HTML)),1)
        self.assertEqual(len(re.findall('rel="canonical"',HTML)),1)
        self.assertNotIn('noindex',HTML)
        schemas=[json.loads(s) for s in re.findall(r'<script type="application/ld\+json">(.*?)</script>',HTML,re.S)]
        self.assertTrue(schemas)
        self.assertNotIn('aggregateRating',str(schemas))
    def test_sources_and_static_fallback(self):
        for key in ['et','dias','parentesco','inicio','continuidad','an32','an133']:
            self.assertIn('id="fuente-'+key+'"',HTML)
        for text in ['<noscript>','37.3.b','37.9','convenio','2026','CENDOJ','alta médica']:
            self.assertIn(text,HTML)
    def test_guide_intentions_unchanged(self):
        for slug in ['adaptacion-jornada-cuidado-hijos','reduccion-jornada-cuidado-hijo-despido-paro','excedencia-cuidado-hijo-reserva-puesto-reingreso']:
            path='guias/'+slug+'/index.html'
            before=subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT,text=True)
            after=(ROOT/path).read_text()
            restored=re.sub(r'<p class="enlace-permiso-familiar">.*?</p>\n?', '',after)
            self.assertEqual(before,restored)
    def test_no_personal_data_inputs_or_remote_scripts(self):
        self.assertNotRegex(HTML,r'<(?:input|textarea|form)\b')
        self.assertNotRegex(HTML,r'<script[^>]+src="https?://')
        js=(TOOL/'script.js').read_text()
        self.assertNotIn('JSON.stringify(state)',js)
        self.assertNotIn('sessionStorage',js)
    def test_lightweight_resources(self):
        total=sum((TOOL/p).stat().st_size for p in ['index.html','script.js','style.css','js/core.js'])
        self.assertLess(total,65000)
if __name__=='__main__':unittest.main()
