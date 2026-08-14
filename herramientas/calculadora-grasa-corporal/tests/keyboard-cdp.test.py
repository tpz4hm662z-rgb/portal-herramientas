#!/usr/bin/env python3
"""Recorrido de teclado real mediante Chrome DevTools Protocol, sin dependencias externas."""
import base64
import json
import os
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from urllib.parse import urlparse

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


class WebSocket:
    def __init__(self, url):
        parsed = urlparse(url)
        self.socket = socket.create_connection((parsed.hostname, parsed.port), timeout=5)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET {parsed.path} HTTP/1.1\r\nHost: {parsed.hostname}:{parsed.port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.socket.sendall(request.encode("ascii"))
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.socket.recv(4096)
        if b" 101 " not in response.split(b"\r\n", 1)[0]:
            raise RuntimeError("Chrome rechazó WebSocket CDP")

    def _exact(self, length):
        data = b""
        while len(data) < length:
            chunk = self.socket.recv(length - len(data))
            if not chunk:
                raise RuntimeError("WebSocket CDP cerrado")
            data += chunk
        return data

    def send(self, payload, opcode=1):
        data = payload.encode("utf-8") if isinstance(payload, str) else payload
        mask = os.urandom(4)
        length = len(data)
        header = bytearray([0x80 | opcode])
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.append(0x80 | 126); header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127); header.extend(struct.pack("!Q", length))
        masked = bytes(value ^ mask[index % 4] for index, value in enumerate(data))
        self.socket.sendall(bytes(header) + mask + masked)

    def receive(self):
        first, second = self._exact(2)
        opcode = first & 0x0F
        length = second & 0x7F
        if length == 126:
            length = struct.unpack("!H", self._exact(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self._exact(8))[0]
        if second & 0x80:
            mask = self._exact(4)
        else:
            mask = None
        data = self._exact(length)
        if mask:
            data = bytes(value ^ mask[index % 4] for index, value in enumerate(data))
        if opcode == 9:
            self.send(data, opcode=10)
            return self.receive()
        if opcode == 8:
            raise RuntimeError("Chrome cerró WebSocket CDP")
        return json.loads(data.decode("utf-8"))


class CDP:
    def __init__(self, websocket_url):
        self.ws = WebSocket(websocket_url)
        self.next_id = 0

    def call(self, method, params=None):
        self.next_id += 1
        message_id = self.next_id
        self.ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
        while True:
            response = self.ws.receive()
            if response.get("id") == message_id:
                if "error" in response:
                    raise RuntimeError(response["error"])
                return response.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True})
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"].get("text", "Error JS"))
        return result.get("result", {}).get("value")

    def key(self, key, code, virtual_key):
        common = {"key": key, "code": code, "windowsVirtualKeyCode": virtual_key, "nativeVirtualKeyCode": virtual_key}
        self.call("Input.dispatchKeyEvent", dict(common, type="rawKeyDown"))
        if key == "Enter":
            self.call("Input.dispatchKeyEvent", dict(common, type="char", text="\r", unmodifiedText="\r"))
        self.call("Input.dispatchKeyEvent", dict(common, type="keyUp"))


def wait_for(cdp, expression, timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if cdp.evaluate(expression):
                return
        except Exception:
            pass
        time.sleep(0.05)
    raise RuntimeError("Tiempo agotado: " + expression)


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: keyboard-cdp.test.py URL_DE_INDEX")
    profile = tempfile.mkdtemp(prefix="imoancy-cdp-")
    process = subprocess.Popen([
        CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--disable-background-networking",
        "--disable-component-update", "--disable-sync", "--no-default-browser-check", "--metrics-recording-only",
        "--disable-features=OptimizationGuideModelDownloading,MediaRouter", "--remote-allow-origins=*",
        "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    passed = 0

    def check(condition, message):
        nonlocal passed
        if not condition:
            raise AssertionError(message)
        passed += 1

    try:
        active_port = os.path.join(profile, "DevToolsActivePort")
        deadline = time.time() + 8
        while not os.path.exists(active_port) and time.time() < deadline:
            time.sleep(0.05)
        with open(active_port, encoding="utf-8") as handle:
            port = int(handle.readline().strip())
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5) as response:
            targets = json.load(response)
        target = next(item for item in targets if item.get("type") == "page" and item.get("url") == "about:blank")
        cdp = CDP(target["webSocketDebuggerUrl"])
        cdp.call("Page.enable")
        cdp.call("Page.navigate", {"url": sys.argv[1]})
        wait_for(cdp, "document.readyState !== 'loading' && Boolean(window.ImoancyBodyFatScience)")
        cdp.evaluate("localStorage.removeItem('imoancy.body-fat-pro.history.v1')")

        check(cdp.evaluate("document.querySelectorAll('h1').length") == 1, "un único H1 en navegador real")
        check(cdp.evaluate("document.querySelectorAll('#preguntas-frecuentes details').length") == 12, "doce FAQ visibles")
        check(cdp.evaluate("document.getElementById('protocoloCintura').textContent.trim()===document.getElementById('protocoloCinturaEducativo').textContent.trim()"), "protocolo NHANES idéntico")
        check(cdp.evaluate("""(()=>{const x=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];return x.length===4&&new Set(x.map(y=>y['@id'])).size===4})()"""), "JSON-LD sin colisiones")
        check(cdp.evaluate("document.querySelectorAll('.migas-pan li').length") == 2, "breadcrumb visible")
        check(cdp.evaluate("!Array.from(document.scripts).some(s=>/\\/js\\/(config|core)\\.js$/.test(new URL(s.src||location.href).pathname))"), "Navy no cargado")
        cdp.call("Emulation.setDeviceMetricsOverride", {"width": 320, "height": 568, "deviceScaleFactor": 1, "mobile": True})
        check(cdp.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth"), "sin overflow a 320 px")
        cdp.call("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        check(cdp.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth"), "sin overflow a 1440 px")
        cdp.call("Emulation.setEmulatedMedia", {"media": "print"})
        print_state = cdp.evaluate("({history:getComputedStyle(document.getElementById('evolucion')).display,calculator:getComputedStyle(document.getElementById('calculadora')).display,button:getComputedStyle(document.getElementById('botonCalcular')).display,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth})")
        check(print_state["history"] == "none", "impresión oculta historial privado")
        check(print_state["calculator"] == "none", "impresión oculta formulario")
        check(print_state["button"] == "none", "impresión oculta controles")
        check(print_state["overflow"], "impresión sin overflow horizontal")
        cdp.call("Emulation.setEmulatedMedia", {"media": "screen"})

        cdp.call("Emulation.setEmulatedMedia", {"media": "screen", "features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        check(cdp.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), "preferencia de movimiento reducido activa")
        check(cdp.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == "auto", "movimiento reducido anula scroll suave en CSS")
        cdp.evaluate("window.__originalScrollIntoView=Element.prototype.scrollIntoView; Element.prototype.scrollIntoView=function(options){window.__lastScrollOptions=options||{}}")

        cdp.evaluate("document.getElementById('sexo').focus()")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "edad", "Tab sexo→edad")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "altura", "Tab edad→altura")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "peso", "Tab altura→peso")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "botonCalcular", "Tab peso→calcular")

        cdp.evaluate("[['sexo','hombre'],['edad','35'],['altura','180'],['peso','83.7']].forEach(([id,value])=>document.getElementById(id).value=value); document.getElementById('botonCalcular').focus()")
        cdp.key("Enter", "Enter", 13)
        calculate_state = cdp.evaluate("({active:document.activeElement.id,hidden:document.getElementById('resultados').classList.contains('oculto'),status:document.getElementById('estadoCalculadora').textContent})")
        check(calculate_state["active"] == "titulo-resultados", "Enter calcula y enfoca resultado: " + json.dumps(calculate_state))
        check(cdp.evaluate("window.__lastScrollOptions && window.__lastScrollOptions.behavior") == "auto", "movimiento reducido anula scroll suave dinámico")
        cdp.evaluate("Element.prototype.scrollIntoView=window.__originalScrollIntoView; delete window.__originalScrollIntoView; delete window.__lastScrollOptions")
        cdp.call("Emulation.setEmulatedMedia", {"media": "screen", "features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]})
        cdp.evaluate("document.getElementById('botonMostrarCintura').focus()")
        cdp.key("Enter", "Enter", 13); check(cdp.evaluate("document.activeElement.id") == "titulo-cintura", "Enter abre cintura")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "cinturaUno", "Tab entra en primera cintura")
        cdp.evaluate("document.getElementById('cerrarCintura').focus()")
        cdp.key("Enter", "Enter", 13); check(cdp.evaluate("document.activeElement.id") == "botonMostrarCintura", "Cerrar devuelve foco")

        cdp.evaluate("document.getElementById('botonGuardar').focus()")
        cdp.key("Enter", "Enter", 13); check(cdp.evaluate("document.activeElement.id") == "titulo-guardar", "Enter abre guardado")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "confirmarGuardar", "Tab llega a confirmar")
        cdp.key("Tab", "Tab", 9); check(cdp.evaluate("document.activeElement.id") == "cancelarGuardar", "Tab llega a cancelar")
        cdp.key("Enter", "Enter", 13); check(cdp.evaluate("document.activeElement.id") == "botonGuardar", "Cancelar devuelve foco")
        cdp.key("Enter", "Enter", 13); cdp.key("Tab", "Tab", 9); cdp.key("Enter", "Enter", 13)
        check(cdp.evaluate("document.activeElement.id") == "titulo-evolucion", "Guardar enfoca evolución")

        cdp.call("Page.reload")
        wait_for(cdp, "document.readyState !== 'loading' && Boolean(window.ImoancyBodyFatScience) && !document.getElementById('avisoHistorial').classList.contains('oculto')")
        cdp.evaluate("document.getElementById('botonVerEvolucion').focus()")
        cdp.key("Enter", "Enter", 13)
        check(cdp.evaluate("document.activeElement.id") == "titulo-evolucion", "Abrir historial con Enter enfoca evolución")
        cdp.evaluate("window.confirm=()=>true; document.querySelector('.boton-eliminar').focus()")
        cdp.key("Enter", "Enter", 13)
        check(cdp.evaluate("document.activeElement.id") == "titulo-evolucion", "Eliminar último registro conserva foco")

        cdp.evaluate("[['sexo','hombre'],['edad','35'],['altura','180'],['peso','83.7']].forEach(([id,value])=>document.getElementById(id).value=value); document.getElementById('botonCalcular').focus()")
        cdp.key("Enter", "Enter", 13)
        cdp.evaluate("document.getElementById('botonGuardar').focus()")
        cdp.key("Enter", "Enter", 13); cdp.key("Tab", "Tab", 9); cdp.key("Enter", "Enter", 13)
        cdp.evaluate("document.getElementById('borrarHistorial').focus()")
        cdp.key("Enter", "Enter", 13)
        check(cdp.evaluate("document.activeElement.id === 'titulo-evolucion' && document.querySelectorAll('.medicion-historial').length === 0"), "Borrar historial con Enter devuelve foco")

        cdp.evaluate("document.getElementById('botonReiniciar').click(); document.getElementById('botonCalcular').focus()")
        cdp.key("Enter", "Enter", 13)
        check(cdp.evaluate("document.activeElement.id") == "sexo", "Error con teclado enfoca primer campo inválido")
        print(f"Keyboard CDP: {passed} PASS, 0 FAIL")
        return 0
    finally:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print("Keyboard CDP: FAIL " + str(error))
        raise
