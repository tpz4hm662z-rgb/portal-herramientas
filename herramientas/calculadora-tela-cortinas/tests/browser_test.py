"""Browser integration tests. Run with a Python environment containing Playwright:

python3 -m http.server 8765 --bind 127.0.0.1
python browser_test.py

CHROME_PATH and TEST_BASE_URL can override the local browser and server.
All Google Analytics traffic is intercepted; no production events are sent.
"""
import json
import os
import unittest
from playwright.sync_api import sync_playwright

BASE = os.environ.get('TEST_BASE_URL', 'http://127.0.0.1:8765')
URL = BASE + '/herramientas/calculadora-tela-cortinas/'


class CurtainBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get('CHROME_PATH', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
            headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1280, 'height': 900}, locale='es-ES')
        self.page = self.context.new_page()
        self.errors = []
        self.external = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))

        def route(request):
            if not request.request.url.startswith(BASE):
                self.external.append(request.request.url)
                request.fulfill(status=200, content_type='text/javascript', body='')
            else:
                request.continue_()

        self.page.route('**/*', route)
        self.page.goto(URL, wait_until='networkidle')

    def tearDown(self):
        self.assertEqual(self.errors, [], 'Unexpected browser errors')
        self.context.close()

    def calculate(self):
        self.page.locator('button[type=submit]').click()

    def test_default_units_and_monetary_rounding(self):
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '4,20')
        self.page.locator('#pricePerMeter').fill('15,50')
        self.assertFalse(self.page.locator('#result').is_visible())
        self.calculate()
        self.assertIn('65,10', self.page.locator('#fabric-cost').inner_text())
        self.assertEqual(self.page.locator('#cut-list tr').count(), 2)
        self.assertIn('210 cm de largo', self.page.locator('#cut-list').inner_text())

    def test_presets_vertical_pattern_and_single_panel(self):
        self.page.locator('[data-preset=narrow]').click()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '10,80')
        self.assertIn('4 tira(s)', self.page.locator('#cut-count').inner_text())
        self.page.locator('[data-preset=pattern]').click()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '13,50')
        self.assertIn('64 cm', self.page.locator('#cut-caption').inner_text())
        self.page.locator('[data-preset=wide]').click()
        self.page.locator('#panels').select_option('1')
        self.calculate()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '4,10')

    def test_invalid_input_never_keeps_a_purchase_or_export(self):
        for invalid in ['', '0', '-100', 'Infinity', '200cm', '1,2,3', '<script>1</script>']:
            self.page.locator('#trackWidth').fill(invalid)
            self.calculate()
            self.assertTrue(self.page.locator('#form-error').is_visible(), invalid)
            self.assertFalse(self.page.locator('#result').is_visible(), invalid)
            self.assertFalse(self.page.locator('#comparison').is_visible(), invalid)
            self.assertEqual(self.page.locator('#trackWidth').get_attribute('aria-invalid'), 'true')
        self.page.locator('#trackWidth').fill('200')
        self.calculate()
        self.assertFalse(self.page.locator('#form-error').is_visible())
        self.assertTrue(self.page.locator('#result').is_visible())

    def test_height_fit_shrinkage_and_unsupported_patterns(self):
        self.page.locator('#finishedHeight').fill('280')
        self.calculate()
        self.assertIn('no alcanza', self.page.locator('#form-error').inner_text())
        self.page.locator('#finishedHeight').fill('240')
        self.page.locator('#advanced').evaluate('(el) => el.open = true')
        self.page.locator('#shrinkage').fill('5')
        self.calculate()
        self.assertIn('no alcanza', self.page.locator('#form-error').inner_text())
        self.page.locator('#fabricWidth').fill('300')
        self.calculate()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '4,50')
        self.page.locator('#pattern').select_option('half-drop')
        self.calculate()
        self.assertIn('medio salto', self.page.locator('#form-error').inner_text())
        self.page.locator('#pattern').select_option('straight')
        self.page.locator('#repeat').fill('64')
        self.calculate()
        self.assertIn('tiras verticales', self.page.locator('#form-error').inner_text())
        self.page.locator('#orientation').select_option('vertical')
        self.calculate()
        self.assertTrue(self.page.locator('#result').is_visible())

    def test_comparison_does_not_reuse_different_fabric_price(self):
        self.page.locator('#pricePerMeter').fill('20')
        self.calculate()
        self.page.get_by_role('button', name='Usar tela de 140 cm por tiras').click()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '10,80')
        self.assertEqual(self.page.locator('#pricePerMeter').input_value(), '')
        self.assertIn('Añade precio', self.page.locator('#fabric-cost').inner_text())

    def test_irrelevant_hidden_seam_does_not_block_double_width(self):
        self.page.locator('#advanced').evaluate('(el) => el.open = true')
        self.page.locator('#orientation').select_option('vertical')
        self.page.locator('#seamAllowance').fill('')
        self.page.locator('#orientation').select_option('railroaded')
        self.calculate()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '4,20')
        self.assertFalse(self.page.locator('#form-error').is_visible())
        self.page.locator('#orientation').select_option('vertical')
        self.calculate()
        self.assertTrue(self.page.locator('#seamAllowance').is_visible())
        self.assertEqual(self.page.locator('#seamAllowance').get_attribute('aria-invalid'), 'true')

    def test_copy_fallback_and_print_contain_the_complete_result(self):
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:()=>Promise.reject(new Error('blocked'))}})")
        self.page.locator('#copy-result').click()
        summary = self.page.locator('#summary-text').input_value()
        for expected in ['4,20 m', '280 cm', 'Riel: 200', 'Alto terminado: 240', 'CORTES:', 'Reserva', 'fabricante']:
            self.assertIn(expected, summary)
        self.page.evaluate('window.print = () => { window.testPrinted = true; }')
        self.page.locator('#print-result').click()
        self.assertTrue(self.page.evaluate('window.testPrinted'))
        self.page.emulate_media(media='print')
        self.assertTrue(self.page.locator('#result').is_visible())
        self.assertTrue(self.page.locator('.print-source').is_visible())
        self.assertFalse(self.page.locator('.form-card').is_visible())

    def test_consent_and_analytics_exclude_input_values(self):
        self.assertEqual(self.external, [])
        self.assertEqual(self.page.evaluate('typeof window.dataLayer'), 'undefined')
        self.page.locator('#analytics-allow').click()
        self.page.wait_for_function('window.dataLayer && window.dataLayer.length >= 3')
        self.page.locator('#trackWidth').fill('217')
        self.page.locator('#pricePerMeter').fill('19,83')
        self.calculate()
        events = self.page.evaluate('window.dataLayer.map(x => Array.from(x))')
        calculation = [row for row in events if row[:2] == ['event', 'curtain_calculate']]
        self.assertEqual(len(calculation), 1)
        self.assertEqual(calculation[0][2], {'tool_id': 'tela_cortinas', 'orientation': 'railroaded', 'pattern': 'plain'})
        event_payloads = [row for row in events if row[0] == 'event']
        self.assertNotIn('19.83', json.dumps(event_payloads))
        self.assertNotIn('217', json.dumps(event_payloads))
        self.assertTrue(any('googletagmanager' in url for url in self.external))
        self.page.locator('#analytics-deny').click()
        count = self.page.evaluate('window.dataLayer.length')
        self.page.locator('#trackWidth').fill('218')
        self.calculate()
        self.assertEqual(self.page.evaluate('window.dataLayer.length'), count)
        self.assertTrue(self.page.evaluate("window['ga-disable-G-QH8MJ6LVHN']"))
        self.assertEqual(self.page.evaluate("localStorage.getItem('imoancy_curtain_analytics')"), 'denied')

    def test_mobile_accessibility_and_static_seo(self):
        for width in [320, 390, 768, 1440]:
            self.page.set_viewport_size({'width': width, 'height': 900})
            self.page.locator('#advanced').evaluate('(el) => el.open = true')
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'), str(width))
        self.page.set_viewport_size({'width': 390, 'height': 844})
        self.calculate()
        self.assertEqual(self.page.evaluate('document.activeElement.id'), 'result-heading')
        self.assertLess(self.page.locator('#result-heading').bounding_box()['y'], 200)
        self.page.locator('#ejemplos .table-scroll').focus()
        self.page.keyboard.press('ArrowRight')
        self.page.wait_for_function("document.querySelector('#ejemplos .table-scroll').scrollLeft > 0")
        for field in self.page.locator('input,select,textarea').all():
            self.assertGreater(self.page.locator('label[for="' + field.get_attribute('id') + '"]').count(), 0)
        self.assertEqual(self.page.locator('h1').count(), 1)
        self.assertEqual(self.page.locator('link[rel=canonical]').get_attribute('href'), URL.replace(BASE, 'https://imoancy.com'))
        graph = json.loads(self.page.locator('script[type="application/ld+json"]').inner_text())['@graph']
        self.assertEqual({item['@type'] for item in graph}, {'WebPage', 'WebApplication', 'BreadcrumbList'})
        self.assertEqual(self.page.locator('.ad-placement:visible').count(), 0)

    def test_without_javascript_and_with_blocked_storage(self):
        nojs = self.browser.new_context(java_script_enabled=False)
        page = nojs.new_page()
        page.goto(URL)
        self.assertTrue(page.locator('noscript').is_visible())
        self.assertIn('4,20 m', page.locator('#ejemplos').inner_text())
        self.assertIn('Fórmulas', page.locator('#metodo').inner_text())
        nojs.close()
        self.page.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new Error('blocked')}})")
        self.page.reload()
        self.assertEqual(self.page.locator('#purchase-meters').inner_text(), '4,20')
        self.page.locator('#analytics-allow').click()
        self.assertIn('activada', self.page.locator('#analytics-status').inner_text())

    def test_missing_engine_keeps_static_help_without_failing_on_input(self):
        self.page.route('**/calculadora-tela-cortinas/js/core.js', lambda route: route.fulfill(status=200, content_type='text/javascript', body=''))
        self.page.reload()
        self.assertIn('No se ha podido cargar', self.page.locator('#form-error').inner_text())
        self.assertTrue(self.page.locator('button[type=submit]').is_disabled())
        self.page.locator('#trackWidth').fill('210')
        self.page.locator('#curtain-form').dispatch_event('submit')
        self.assertFalse(self.page.locator('#result').is_visible())
        self.assertIn('4,20 m', self.page.locator('#ejemplos').inner_text())


if __name__ == '__main__':
    unittest.main(verbosity=2)
