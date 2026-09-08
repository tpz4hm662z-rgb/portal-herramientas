"""Run against a local root server. All external requests are intercepted (no GA hits)."""
import json
import os
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8765')
URL=BASE+'/herramientas/comprobador-permisos-laborales-familiares/'
class Browser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start()
        cls.browser=cls.p.chromium.launch(executable_path=os.environ.get('CHROME_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless=True)
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':390,'height':844},locale='es-ES')
        self.page=self.context.new_page();self.errors=[];self.external=[]
        self.page.on('pageerror',lambda err:self.errors.append(str(err)))
        def route(r):
            if r.request.url.startswith(BASE):r.continue_()
            else:self.external.append(r.request.url);r.fulfill(status=200,content_type='text/javascript',body='')
        self.page.route('**/*',route);self.page.goto(URL)
    def tearDown(self):
        self.assertEqual(self.errors,[]);self.context.close()
    def answer(self,*answers):
        for a in answers:self.page.locator('[data-answer="'+a+'"]').click()
    def assertResult(self,status):
        self.assertTrue(self.page.locator('#result').is_visible());self.assertEqual(self.page.locator('#result').get_attribute('data-status'),status)
    def test_01_mother_and_no_consent(self):
        self.answer('hospitalizacion','directa','madre_padre','actual');self.assertResult('determinable')
        self.assertIn('5 días',self.page.locator('#result-days').inner_text());self.assertEqual(self.external,[])
        self.assertEqual(self.page.evaluate('Object.keys(localStorage)'),[])
    def test_02_conditioned_after_discharge_not_started(self):
        self.answer('hospitalizacion','directa','madre_padre','alta','reposo','no');self.assertResult('condicionada')
        self.assertIn('No podemos determinar',self.page.locator('#result-explanation').inner_text())
        self.assertIn('fechas',self.page.locator('#checklist').inner_text())
        self.assertTrue(self.page.locator('#result-title').evaluate('(e)=>e===document.activeElement'))
    def test_03_continuation_not_five_extra(self):
        self.answer('hospitalizacion','afinidad','suegro','alta','reposo','si');self.assertResult('determinable')
        self.assertIn('no son cinco días adicionales',self.page.locator('#result-explanation').inner_text())
    def test_04_death_displacement(self):
        self.answer('fallecimiento','afinidad','hermano_conyuge','si');self.assertResult('determinable')
        self.assertIn('4 días',self.page.locator('#result-days').inner_text())
    def test_05_partner_relative_death_excluded(self):
        self.answer('fallecimiento','pareja_familia','padre_pareja');self.assertResult('fuera')
        self.assertIn('convenio',self.page.locator('#result-explanation').inner_text())
    def test_06_nephew_as_cohabitant(self):
        self.answer('grave','directa','sobrino','si','si','si');self.assertResult('determinable')
        self.assertIn('convivencia',self.page.locator('#result-explanation').inner_text())
    def test_07_operation_without_rest(self):
        self.answer('operacion','no');self.assertResult('fuera')
        self.assertEqual(self.page.locator('#summary li').count(),2)
    def test_08_edit_clears_previous_result(self):
        self.answer('hospitalizacion','directa','madre_padre','alta','reposo','si')
        self.page.get_by_role('button',name='Cambiar: ¿Qué ha ocurrido?',exact=True).click()
        self.assertFalse(self.page.locator('#result').is_visible());self.answer('fallecimiento','directa','madre_padre','no')
        self.assertIn('2 días',self.page.locator('#result-days').inner_text());self.assertEqual(self.page.locator('#summary li').count(),4)
    def test_09_back_reset_keyboard(self):
        self.page.locator('[data-answer=hospitalizacion]').focus();self.page.keyboard.press('Enter')
        self.assertTrue(self.page.locator('#question-title').evaluate('(e)=>e===document.activeElement'))
        self.page.keyboard.press('Tab');self.assertTrue(self.page.locator('[data-answer=pareja]').evaluate('(e)=>e===document.activeElement'))
        self.page.locator('#back').click();self.assertIn('Qué ha ocurrido',self.page.locator('#question-title').inner_text())
        self.answer('operacion','no');self.page.locator('#result-reset').click();self.assertFalse(self.page.locator('#summary-panel').is_visible())
    def test_10_analytics_allowlist_and_revocation(self):
        self.assertEqual(self.external,[]);self.page.locator('#analytics-allow').click()
        self.answer('fallecimiento','directa','hermano','no')
        self.page.locator('[data-related=adaptacion]').evaluate('(a)=>a.addEventListener("click",e=>e.preventDefault())')
        self.page.locator('[data-related=adaptacion]').click()
        events=self.page.evaluate('dataLayer.filter(x=>x[0]==="event").map(x=>[x[1],x[2]])')
        names=[e[0] for e in events]
        for name in ['page_view','permisos_view','permisos_start','permisos_complete','permisos_related_click']:self.assertIn(name,names)
        allowed={'tool_id','page_location','page_referrer','page_title','motivo','destination'}
        for name,params in events:self.assertTrue(set(params)<=allowed)
        self.assertNotIn('hermano',json.dumps(events));self.assertNotIn('relacion',json.dumps(events))
        self.page.locator('#analytics-deny').click()
        count=self.page.evaluate('dataLayer.filter(x=>x[0]==="event").length')
        self.page.locator('#result-reset').click();self.answer('operacion','no')
        self.assertEqual(count,self.page.evaluate('dataLayer.filter(x=>x[0]==="event").length'))
        self.assertEqual(self.page.evaluate('Object.keys(localStorage)'),['imoancy_permisos_analytics'])
    def test_11_responsive_and_reduced_motion(self):
        self.page.emulate_media(reduced_motion='reduce')
        for width in [320,390,768,1440]:
            self.page.set_viewport_size({'width':width,'height':900})
            self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        self.answer('hospitalizacion','afinidad','suegro','alta','cuidados')
        for width in [320,390,768,1440]:
            self.page.set_viewport_size({'width':width,'height':900});self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    def test_12_without_javascript(self):
        ctx=self.browser.new_context(java_script_enabled=False)
        p=ctx.new_page();p.goto(URL);self.assertTrue(p.locator('#fuentes').is_visible());self.assertEqual(p.locator('h1').count(),1);self.assertIn('JavaScript',p.locator('noscript').inner_text());ctx.close()
    def test_13_storage_unavailable(self):
        self.page.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked")}})')
        self.page.reload();self.answer('operacion','no');self.assertResult('fuera');self.page.locator('#analytics-allow').click()
    def test_14_missing_engine_fallback(self):
        self.page.route('**/js/core.js',lambda r:r.abort());self.page.reload();self.assertIn('No se pudo cargar',self.page.locator('#question-help').inner_text());self.assertTrue(self.page.locator('#fuentes').is_visible())
    def test_15_resources_canonical_and_unique_ids(self):
        self.assertEqual(self.page.locator('link[rel=canonical]').get_attribute('href'),'https://imoancy.com/herramientas/comprobador-permisos-laborales-familiares/')
        self.assertNotIn('noindex',self.page.locator('meta[name=robots]').get_attribute('content'))
        ids=self.page.locator('[id]').evaluate_all('(els)=>els.map(e=>e.id)');self.assertEqual(len(ids),len(set(ids)))
        self.assertEqual(self.page.request.get(URL+'style.css').status,200);self.assertEqual(self.page.request.get(URL+'js/core.js').status,200)
    def test_16_search_real_phrases(self):
        self.page.goto(BASE)
        for phrase in ['permiso hospitalización suegra','operación hermano','fallecimiento familiar','permiso sobrino']:
            self.page.locator('#buscador').fill(phrase)
            self.assertIn('/herramientas/comprobador-permisos-laborales-familiares/',self.page.locator('#resultados-busqueda a').evaluate_all('(a)=>a.map(x=>x.getAttribute("href"))'))
if __name__=='__main__':unittest.main()
