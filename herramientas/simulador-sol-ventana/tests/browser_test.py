"""Local browser verification. External requests and clipboard writes are intercepted.

TEST_BASE_URL defaults to http://127.0.0.1:8765. Use AXE_PATH for an existing
axe-core script; no package is downloaded and no analytics event is transmitted.
"""
import json
import os
from pathlib import Path
import re
import struct
import unittest
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import sync_playwright

BASE = os.environ.get('TEST_BASE_URL', os.environ.get('TEST_BASE', 'http://127.0.0.1:8765')).rstrip('/')
TOOL_PATH = '/herramientas/simulador-sol-ventana/'
URL = BASE + TOOL_PATH
CANONICAL = 'https://imoancy.com' + TOOL_PATH
AXE_PATH = Path(os.environ.get('AXE_PATH', '/tmp/imoancy-axe.min.js'))
NUMERIC_FIELDS = ['month', 'minute', 'roomWidth', 'roomDepth', 'windowWidth', 'sill', 'windowHeight', 'obstruction']
CLIPBOARD_STUB = """Object.defineProperty(navigator, 'clipboard', { configurable: true,
  value: {writeText: async value => {window.__copiedLink = value;}} });"""


def duration_minutes(text):
    """Read a visible duration without imposing typography or whitespace."""
    hours = re.search(r'(\d+)\s*h', text)
    minutes = re.search(r'(\d+)\s*min', text)
    if hours or minutes:
        return (int(hours.group(1)) * 60 if hours else 0) + (int(minutes.group(1)) if minutes else 0)
    if text.strip() == '0':
        return 0
    raise AssertionError('Unrecognised duration: ' + repr(text))


class Browser(unittest.TestCase):
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
        self.external = []
        self.errors = []
        self.context = self.browser.new_context(viewport={'width': 390, 'height': 844}, locale='es-ES', reduced_motion='reduce')
        self.context.route('**/*', self.intercept)
        self.context.add_init_script(CLIPBOARD_STUB)
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(URL, wait_until='domcontentloaded')
        self.page.locator('#studio').wait_for(state='visible')

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], 'Unexpected JavaScript errors')
        finally:
            self.context.close()

    def intercept(self, route):
        if urlsplit(route.request.url).netloc == urlsplit(BASE).netloc:
            route.continue_()
        else:
            self.external.append(route.request.url)
            route.fulfill(status=200, content_type='text/javascript', body='')

    def current_state(self):
        return self.page.evaluate("""() => {
          const value = id => document.getElementById(id).value;
          const state = {city:value('city'), bearingA:Number(value('angleA')), bearingB:Number(value('angleB'))};
          for (const id of ['month','minute','roomWidth','roomDepth','windowWidth','sill','windowHeight','obstruction']) state[id]=Number(value(id));
          return state;
        }""")

    def expected(self):
        return self.page.evaluate('(state) => SolarWindow.calculate(state)', self.current_state())

    def change_range(self, selector, value):
        self.page.locator(selector).evaluate("(element, value) => {element.value = String(value); element.dispatchEvent(new Event('input',{bubbles:true})); element.dispatchEvent(new Event('change',{bubbles:true}));}", value)

    def open_geometry(self):
        if self.page.locator('#geometry-panel').get_attribute('open') is None:
            self.page.locator('#geometry-panel > summary').click()

    def assert_metrics(self):
        result = self.expected()
        self.assertTrue(result['valid'])
        for side in ['a', 'b']:
            self.assertEqual(duration_minutes(self.page.locator('#hours-' + side).inner_text()), result[side]['facadeMinutes'])
            self.assertEqual(duration_minutes(self.page.locator('#floor-' + side).inner_text()), result[side]['floorMinutes'])
        return result

    def events(self):
        return self.page.evaluate("() => (window.dataLayer || []).filter(x => x[0] === 'event').map(x => [x[1], x[2]])")

    def test_01_initial_model_matches_visible_results_without_consent(self):
        self.assertEqual(self.page.locator('#city option').count(), 15)
        self.assertEqual(self.page.locator('#month option').count(), 12)
        self.assertEqual(self.page.locator('#scene-a svg').count(), 1)
        self.assertEqual(self.page.locator('#scene-b svg').count(), 1)
        self.assertTrue(self.page.locator('#scene-a svg title').text_content())
        self.assert_metrics()
        self.assertEqual(self.external, [])
        self.assertEqual(self.events(), [])
        self.assertEqual(self.page.evaluate('Object.keys(localStorage)'), [])

    def test_02_orientation_and_season_change_the_actual_geometry(self):
        before = self.page.locator('#scene-a').inner_html()
        self.page.select_option('#bearingA', '0')
        self.page.select_option('#month', '12')
        result = self.assert_metrics()
        self.assertEqual(result['a']['facadeMinutes'], 0)
        self.assertNotEqual(self.page.locator('#scene-a').inner_html(), before)
        self.page.select_option('#month', '6')
        result = self.assert_metrics()
        self.assertGreater(result['a']['facadeMinutes'], 0)
        self.assertEqual(len(result['a']['intervals']), 2)
        visible_times = re.findall(r'\d{1,2}:\d{2}', self.page.locator('#intervals-a').inner_text())
        self.assertEqual(len(visible_times), 4, 'The break between morning and evening must remain visible')

    def test_03_keyboard_time_and_exact_angle(self):
        self.page.locator('#minute').focus()
        self.page.keyboard.press('ArrowRight')
        self.assertEqual(self.page.locator('#minute').input_value(), '855')
        self.assertIn('14:15', self.page.locator('#clock').inner_text())
        self.open_geometry()
        self.page.locator('#angleA').fill('137')
        self.page.locator('#angleA').press('Tab')
        self.assertEqual(self.expected()['state']['bearingA'], 137)
        self.assertIn('137', self.page.locator('#degrees-a').inner_text())
        self.assert_metrics()

    def test_04_impossible_geometry_is_not_presented_or_shared_as_valid(self):
        self.open_geometry()
        self.page.locator('#roomWidth').fill('2')
        self.page.locator('#windowWidth').fill('4')
        self.page.locator('#windowWidth').press('Tab')
        self.assertTrue(self.page.locator('#input-error').is_visible())
        self.assertEqual(self.page.locator('#input-error').get_attribute('role'), 'alert')
        self.assertTrue(self.page.locator('#studio').evaluate("e => e.classList.contains('is-invalid')"))
        self.page.locator('#copy-link').evaluate('element => element.click()')
        self.assertIsNone(self.page.evaluate('window.__copiedLink || null'))
        self.page.locator('#windowWidth').fill('1.5')
        self.page.locator('#windowWidth').press('Tab')
        self.assertFalse(self.page.locator('#input-error').is_visible())
        self.assert_metrics()
        self.page.locator('#windowHeight').fill('2.5')
        self.page.locator('#windowHeight').press('Tab')
        self.assertTrue(self.page.locator('#input-error').is_visible(), 'Window top exceeds 3 m')

    def test_05_empty_numeric_field_does_not_become_zero(self):
        self.open_geometry()
        self.page.locator('#sill').fill('')
        self.page.locator('#sill').press('Tab')
        self.assertTrue(self.page.locator('#input-error').is_visible())
        self.page.locator('#sill').fill('0')
        self.page.locator('#sill').press('Tab')
        self.assertFalse(self.page.locator('#input-error').is_visible())
        self.assert_metrics()

    def test_06_reset_restores_every_control_and_stops_play(self):
        self.page.select_option('#city', 'santa-cruz')
        self.page.select_option('#bearingA', '90')
        self.page.select_option('#month', '1')
        self.page.locator('#play').click()
        self.assertEqual(self.page.locator('#play').get_attribute('aria-pressed'), 'true')
        self.page.locator('#reset').click()
        self.assertEqual(self.page.locator('#play').get_attribute('aria-pressed'), 'false')
        self.assertEqual(self.current_state(), self.page.evaluate('SolarWindow.DEFAULTS'))
        self.assert_metrics()

    def test_07_annual_chart_and_accessible_table_match_all_twelve_months(self):
        self.assertEqual(self.page.locator('#annual-chart button[data-month]').count(), 12)
        self.assertEqual(self.page.locator('#annual-data tr').count(), 12)
        annual = self.expected()
        rows = self.page.locator('#annual-data tr').evaluate_all('(rows) => rows.map(row => [...row.querySelectorAll("td")].map(cell => cell.textContent))')
        for index, cells in enumerate(rows):
            numbers = cells[-4:]
            expected = [annual['annualA'][index]['facadeMinutes'], annual['annualA'][index]['floorMinutes'], annual['annualB'][index]['facadeMinutes'], annual['annualB'][index]['floorMinutes']]
            self.assertEqual([duration_minutes(text) for text in numbers], expected)
        self.page.locator('#annual-chart button[data-month="12"]').click()
        self.assertEqual(self.page.locator('#month').input_value(), '12')
        self.assertEqual(self.page.locator('#annual-chart button[aria-pressed="true"]').count(), 1)
        self.assert_metrics()

    def test_08_share_link_round_trip_preserves_configuration_without_server_parameters(self):
        self.page.select_option('#city', 'palma')
        self.page.select_option('#bearingA', '90')
        self.page.select_option('#month', '10')
        self.change_range('#minute', 1125)
        self.open_geometry()
        self.page.locator('#windowWidth').fill('1.7')
        self.page.locator('#windowWidth').press('Tab')
        expected = self.current_state()
        self.page.locator('#copy-link').click()
        self.page.wait_for_function('Boolean(window.__copiedLink)')
        link = self.page.evaluate('window.__copiedLink')
        parsed = urlsplit(link)
        # Preview links intentionally stay on localhost; deployed links use canonical.
        expected_origin = URL if urlsplit(BASE).hostname in ['localhost', '127.0.0.1'] else CANONICAL
        self.assertEqual(parsed.scheme + '://' + parsed.netloc + parsed.path, expected_origin)
        self.assertEqual(parsed.query, '')
        self.assertEqual(parse_qs(parsed.fragment).get('v'), ['1'])
        self.page.goto(URL + '#' + parsed.fragment, wait_until='domcontentloaded')
        # A changed fragment alone is a same-document navigation: reload as a recipient would.
        self.page.reload(wait_until='domcontentloaded')
        self.page.locator('#studio').wait_for(state='visible')
        self.assertEqual(self.current_state(), expected)
        self.assert_metrics()
        self.assertEqual(self.external, [])

    def test_09_malformed_and_oversized_links_recover_without_injection(self):
        for fragment in ['v=1&m=13', 'v=1&c=unknown', 'v=1&a=360', 'v=1&m=1&m=2', 'v=2', 'v=1&c=' + 'x' * 10000, 'v=1&c=%3Cscript%3Ewindow.__injected%3D1%3C%2Fscript%3E']:
            self.page.goto(URL + '#' + fragment, wait_until='domcontentloaded')
            self.page.reload(wait_until='domcontentloaded')
            self.page.locator('#studio').wait_for(state='visible')
            self.assertTrue(self.expected()['valid'])
            self.assertEqual(self.current_state(), self.page.evaluate('SolarWindow.DEFAULTS'))
            self.assertIsNone(self.page.evaluate('window.__injected || null'))
        self.assertEqual(self.external, [])

    def test_10_export_is_a_real_readable_png(self):
        with self.page.expect_download() as event:
            self.page.locator('#save-image').click()
        download = event.value
        self.assertTrue(download.suggested_filename.endswith('.png'))
        data = Path(download.path()).read_bytes()
        self.assertEqual(data[:8], b'\x89PNG\r\n\x1a\n')
        self.assertEqual(struct.unpack('>II', data[16:24]), (1200, 940))
        self.assertGreater(len(data), 10000)
        self.assertEqual(self.external, [])

    def test_11_consent_events_have_only_allowlisted_parameters_and_revoke(self):
        self.assertEqual(self.events(), [])
        self.page.locator('#analytics-allow').click()
        self.page.select_option('#city', 'valencia')
        self.page.select_option('#bearingA', '90')
        self.page.select_option('#month', '12')
        self.change_range('#minute', 1005)
        self.page.locator('#copy-link').click()
        self.page.locator('#reset').click()
        self.page.locator('[data-related="cortinas"]').evaluate('a => a.addEventListener("click", event => event.preventDefault())')
        self.page.locator('[data-related="cortinas"]').click()
        events = self.events()
        names = {event[0] for event in events}
        self.assertTrue({'page_view', 'solar_view', 'solar_start', 'solar_explore', 'solar_result', 'solar_repeat', 'solar_share', 'solar_related_click'} <= names, names)
        allowed = {'tool_id', 'page_location', 'page_referrer', 'page_title', 'title', 'action', 'method', 'destination'}
        for name, params in events:
            self.assertTrue(set(params) <= allowed, (name, params))
            self.assertEqual(params.get('page_location'), CANONICAL)
            self.assertEqual(params.get('page_referrer'), '')
            if 'action' in params:
                self.assertIn(params['action'], ['city', 'bearing', 'month', 'time', 'geometry', 'obstruction'])
            if 'method' in params:
                self.assertIn(params['method'], ['image', 'link'])
            if 'destination' in params:
                self.assertIn(params['destination'], ['cortinas', 'actas'])
        serialized = json.dumps(events)
        for forbidden in ['valencia', 'bearingA', 'bearingB', 'roomWidth', 'facadeMinutes', '#v=1']:
            self.assertNotIn(forbidden, serialized)
        self.page.locator('#analytics-deny').click()
        count = len(self.events())
        self.page.select_option('#city', 'bilbao')
        self.page.locator('#copy-link').click()
        self.assertEqual(len(self.events()), count)
        self.assertEqual(self.page.locator('#analytics-deny').get_attribute('aria-pressed'), 'true')
        stored = self.page.evaluate('Object.entries(localStorage)')
        self.assertEqual(len(stored), 1)
        self.assertIn(stored[0][1], ['denied', 'false', '0'])
        self.assertEqual(self.page.evaluate('Object.keys(sessionStorage)'), [])

    def test_12_unavailable_storage_does_not_break_the_model_or_consent(self):
        self.context.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new Error('Storage unavailable in test');}})")
        self.page.reload(wait_until='domcontentloaded')
        self.page.locator('#studio').wait_for(state='visible')
        self.page.select_option('#month', '12')
        self.assert_metrics()
        self.page.locator('#analytics-allow').click()
        self.page.locator('#analytics-deny').click()
        self.assert_metrics()

    def test_13_mobile_tablet_desktop_no_horizontal_overflow(self):
        for width in [320, 390, 768, 1440, 1920]:
            self.page.set_viewport_size({'width': width, 'height': 900})
            self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'), str(width))
            self.assertTrue(self.page.locator('#scene-a svg').is_visible())
            self.assertTrue(self.page.locator('#scene-b svg').is_visible())
            self.open_geometry()
            self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'open geometry ' + str(width))
            self.page.select_option('#city', 'santa-cruz')
            self.page.select_option('#month', '12')
            self.assert_metrics()

    def test_14_canary_time_and_geometry_use_selected_city(self):
        self.page.select_option('#city', 'santa-cruz')
        self.page.select_option('#month', '6')
        result = self.assert_metrics()
        self.assertEqual(self.page.locator('#clock').inner_text().strip(), '14:00')
        date = self.page.evaluate("SolarWindow.localDate('santa-cruz', 6, 840).toISOString()")
        self.assertEqual(date, '2026-06-21T13:00:00.000Z')
        self.assertEqual(result['state']['city'], 'santa-cruz')

    def test_15_without_javascript_the_guide_and_sources_remain_available(self):
        context = self.browser.new_context(java_script_enabled=False)
        context.route('**/*', self.intercept)
        page = context.new_page()
        try:
            page.goto(URL, wait_until='domcontentloaded')
            self.assertFalse(page.locator('#studio').is_visible())
            self.assertTrue(page.locator('#metodo').is_visible())
            self.assertTrue(page.locator('.sources').is_visible())
            self.assertIn('JavaScript', page.locator('body noscript').inner_text())
            self.assertFalse(page.locator('#load-state').is_visible(), 'No loading state when JavaScript is disabled')
            self.assertEqual(page.locator('h1').count(), 1)
        finally:
            context.close()

    def test_16_missing_core_preserves_a_readable_fallback(self):
        self.page.route('**/js/core.js', lambda route: route.abort())
        self.page.reload(wait_until='domcontentloaded')
        self.assertFalse(self.page.locator('#studio').is_visible())
        self.assertTrue(self.page.locator('#metodo').is_visible())
        self.assertTrue(self.page.locator('#load-state').is_visible())
        self.assertTrue(self.page.locator('#load-state').inner_text().strip())

    def test_17_resources_metadata_and_dom_ids(self):
        self.assertEqual(self.page.locator('link[rel="canonical"]').get_attribute('href'), CANONICAL)
        self.assertNotIn('noindex', self.page.locator('meta[name="robots"]').get_attribute('content'))
        ids = self.page.locator('[id]').evaluate_all('(elements) => elements.map(element => element.id)')
        self.assertEqual(len(ids), len(set(ids)), 'SVG IDs must be unique between scenes')
        for resource in ['style.css', 'script.js', 'js/core.js']:
            self.assertEqual(self.page.request.get(URL + resource).status, 200)
        self.assertEqual(self.page.locator('.related a[data-related]').count(), 2)
        for href in self.page.locator('.related a').evaluate_all('(elements) => elements.map(element => element.href)'):
            self.assertEqual(self.page.request.get(BASE + urlsplit(href).path).status, 200)

    @unittest.skipUnless(AXE_PATH.is_file(), 'Set AXE_PATH to an existing axe-core script for accessibility checks')
    def test_18_accessibility_at_mobile_and_desktop(self):
        self.page.add_script_tag(path=str(AXE_PATH))
        for width in [320, 1440]:
            self.page.set_viewport_size({'width': width, 'height': 900})
            for month in ['6', '12']:
                self.page.select_option('#month', month)
                result = self.page.evaluate("async () => {const result = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}}); return result.violations.map(v => ({id:v.id, nodes:v.nodes.map(n => n.target)}));}")
                self.assertEqual(result, [], (width, month, result))

    def test_19_changing_city_cannot_silently_revalidate_impossible_visible_measurements(self):
        self.open_geometry()
        self.page.locator('#windowWidth').fill('4')
        self.assertTrue(self.page.locator('#input-error').is_visible())
        self.page.select_option('#city', 'palma')
        visible_valid = self.page.evaluate('(state) => SolarWindow.validateState(state).valid', self.current_state())
        self.assertTrue(visible_valid or self.page.locator('#input-error').is_visible(), 'Visible invalid measurements must remain invalid or be explicitly restored')
        if not visible_valid:
            self.assertTrue(self.page.locator('#copy-link').is_disabled())

    def test_20_reset_remains_reachable_when_measurements_are_invalid(self):
        self.open_geometry()
        self.page.locator('#windowWidth').fill('4')
        self.assertTrue(self.page.locator('#input-error').is_visible())
        self.page.locator('#reset').click()
        self.assertFalse(self.page.locator('#input-error').is_visible())
        self.assertEqual(self.current_state(), self.page.evaluate('SolarWindow.DEFAULTS'))
        self.assertTrue(self.page.locator('#copy-link').is_enabled())
        self.assert_metrics()

    def test_21_selecting_a_valid_orientation_clears_previous_exact_angle_error(self):
        self.open_geometry()
        self.page.locator('#angleA').fill('999')
        self.assertTrue(self.page.locator('#input-error').is_visible())
        self.assertEqual(self.page.locator('#angleA').get_attribute('aria-invalid'), 'true')
        self.page.select_option('#bearingA', '90')
        self.assertFalse(self.page.locator('#input-error').is_visible())
        self.assertEqual(self.page.locator('#angleA').input_value(), '90')
        self.assertNotEqual(self.page.locator('#angleA').get_attribute('aria-invalid'), 'true')
        self.assertTrue(self.page.locator('#copy-link').is_enabled())
        self.assert_metrics()

    def test_22_document_anchors_preserve_state_and_configuration_fragments_update_it(self):
        self.page.select_option('#city', 'valencia')
        self.page.select_option('#month', '10')
        self.page.select_option('#bearingA', '90')
        expected = self.current_state()
        self.page.locator('.masthead a[href="#metodo"]').click()
        self.page.wait_for_function('location.hash === "#metodo"')
        self.assertEqual(self.current_state(), expected)
        self.page.locator('.hero a[href="#explorar"]').click()
        self.page.wait_for_function('location.hash === "#explorar"')
        self.assertEqual(self.current_state(), expected)
        self.assertNotIn('no válidos', self.page.locator('#share-status').inner_text())
        # This is deliberately a same-document navigation; a recipient's fresh load
        # is covered separately by test_08.
        self.page.goto(URL + '#v=1&c=sevilla&m=12&a=135&b=270&n=1.7', wait_until='domcontentloaded')
        self.page.wait_for_function('document.getElementById("city").value === "sevilla"')
        self.assertEqual(self.current_state()['month'], 12)
        self.assertEqual(self.current_state()['bearingA'], 135)
        self.assertEqual(self.current_state()['windowWidth'], 1.7)
        self.assert_metrics()

    def test_23_interactions_before_consent_do_not_consume_or_replay_analytics(self):
        self.page.select_option('#city', 'palma')
        self.page.select_option('#city', 'barcelona')
        self.assertEqual(self.events(), [])
        self.assertEqual(self.external, [])
        self.page.locator('#analytics-allow').click()
        self.assertEqual([name for name, _ in self.events()], ['page_view', 'solar_view'])
        # The first consented action uses the same family as the earlier actions.
        self.page.select_option('#city', 'malaga')
        events = self.events()
        names = [name for name, _ in events]
        self.assertEqual(names.count('solar_start'), 1)
        self.assertEqual(names.count('solar_explore'), 1)
        self.assertEqual(names.count('solar_result'), 1)
        explore = [params for name, params in events if name == 'solar_explore']
        self.assertEqual(explore[0]['action'], 'city')
        for previous_city in ['palma', 'barcelona']:
            self.assertNotIn(previous_city, json.dumps(events))

    def test_24_playback_includes_late_summer_sun_and_stops_at_the_slider_limit(self):
        self.page.select_option('#city', 'a-coruna')
        self.page.select_option('#month', '6')
        self.change_range('#minute', 1305)  # 21:45: do not jump back to the morning.
        self.page.clock.install()
        self.page.locator('#play').click()
        self.assertEqual(self.page.locator('#minute').input_value(), '1305')
        self.page.clock.run_for(1100)
        self.assertEqual(self.page.locator('#clock').inner_text(), '22:00')
        self.assertEqual(self.page.locator('#play').get_attribute('aria-pressed'), 'true')
        result = self.assert_metrics()
        self.assertEqual(result['b']['intervals'][-1]['end'], 1335)
        self.page.clock.run_for(1100)
        self.assertEqual(self.page.locator('#clock').inner_text(), '22:15')
        self.page.clock.run_for(6 * 1100)
        self.assertEqual(self.page.locator('#minute').input_value(), '1425')
        self.assertEqual(self.page.locator('#clock').inner_text(), '23:45')
        self.assertEqual(self.page.locator('#play').get_attribute('aria-pressed'), 'false')
        self.page.locator('#play').click()
        self.assertEqual(self.page.locator('#minute').input_value(), '0')
        self.assertEqual(self.page.locator('#clock').inner_text(), '00:00')
        self.page.locator('#play').click()
        self.assert_metrics()


if __name__ == '__main__':
    unittest.main()
