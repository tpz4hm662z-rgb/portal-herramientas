import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "indexnow.py"
SPEC = importlib.util.spec_from_file_location("indexnow", MODULE_PATH)
INDEXNOW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INDEXNOW)


class IndexNowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        key = "60396c0b964747ddb5da82636d6972dd"
        (self.root / f"{key}.txt").write_text(key, encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def page(self, path, canonical, robots="index, follow"):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            f'<meta name="robots" content="{robots}"><link rel="canonical" href="{canonical}">',
            encoding="utf-8",
        )

    def test_maps_real_tool_and_guide_pages(self):
        self.page("herramientas/calculadora-demo/index.html", "https://imoancy.com/herramientas/calculadora-demo/")
        self.page("guias/guia-demo/index.html", "https://imoancy.com/guias/guia-demo/")
        with mock.patch.object(INDEXNOW, "changed_html_files", return_value=[
            "herramientas/calculadora-demo/index.html", "guias/guia-demo/index.html"
        ]):
            payload = INDEXNOW.build_payload(self.root, "a" * 40, "b" * 40)
        self.assertEqual(payload["urlList"], [
            "https://imoancy.com/guias/guia-demo/",
            "https://imoancy.com/herramientas/calculadora-demo/",
        ])

    def test_excludes_internal_non_pages_noindex_and_invalid_canonical(self):
        self.page("herramientas/demo/index.html", "https://imoancy.com/otra-ruta/")
        self.page("guias/oculta/index.html", "https://imoancy.com/guias/oculta/", "noindex, follow")
        with mock.patch.object(INDEXNOW, "changed_html_files", return_value=[
            ".DS_Store", "tests/fixture.html", "herramientas/demo/script.js",
            "herramientas/demo/index.html", "guias/oculta/index.html"
        ]):
            self.assertIsNone(INDEXNOW.build_payload(self.root, "a" * 40, "b" * 40))

    def test_key_filename_must_match_its_content(self):
        (self.root / "60396c0b964747ddb5da82636d6972dd.txt").write_text("different-key", encoding="utf-8")
        with self.assertRaises(RuntimeError):
            INDEXNOW.discover_key(self.root)


if __name__ == "__main__":
    unittest.main()
