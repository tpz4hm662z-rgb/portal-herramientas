#!/usr/bin/env python3
"""Browser regression for horizontal overflow; standard library + local Chrome."""

import base64
import json
import os
from pathlib import Path
import shutil
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request
from urllib.parse import urlparse


BASE = Path(__file__).resolve().parents[1]
WIDTHS = (320, 375, 768, 1024, 1280, 1440)
CHROME_CANDIDATES = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    shutil.which("google-chrome"),
    shutil.which("chromium"),
)


class DevTools:
    def __init__(self, url):
        parsed = urlparse(url)
        self.socket = socket.create_connection((parsed.hostname, parsed.port))
        key = base64.b64encode(os.urandom(16)).decode()
        request = (
            f"GET {parsed.path} HTTP/1.1\r\n"
            f"Host: {parsed.hostname}:{parsed.port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n"
            "Origin: http://localhost\r\n\r\n"
        )
        self.socket.sendall(request.encode())
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.socket.recv(4096)
        if b" 101 " not in response.split(b"\r\n", 1)[0]:
            raise RuntimeError("Chrome rejected the DevTools WebSocket")

    def call(self, identifier, method, params):
        payload = json.dumps({"id": identifier, "method": method, "params": params}).encode()
        mask = os.urandom(4)
        header = bytearray([0x81])
        length = len(payload)
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.extend((0x80 | 126,))
            header.extend(struct.pack("!H", length))
        else:
            header.extend((0x80 | 127,))
            header.extend(struct.pack("!Q", length))
        header.extend(mask)
        header.extend(byte ^ mask[index % 4] for index, byte in enumerate(payload))
        self.socket.sendall(header)
        while True:
            message = self._receive()
            if message.get("id") == identifier:
                return message

    def _receive(self):
        header = self.socket.recv(2)
        length = header[1] & 0x7F
        if length == 126:
            length = struct.unpack("!H", self.socket.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self.socket.recv(8))[0]
        payload = b""
        while len(payload) < length:
            payload += self.socket.recv(length - len(payload))
        return json.loads(payload)


def main():
    chrome = next((candidate for candidate in CHROME_CANDIDATES if candidate and Path(candidate).exists()), None)
    if not chrome:
        raise SystemExit("FAIL: Chrome/Chromium no disponible para la regresión responsive")

    profile = tempfile.mkdtemp(prefix="mm-responsive-")
    process = subprocess.Popen(
        [chrome, "--headless=new", "--hide-scrollbars", "--disable-extensions",
         "--remote-debugging-port=9223", "--remote-allow-origins=*",
         f"--user-data-dir={profile}", (BASE / "index.html").as_uri()],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    failures = []
    try:
        target = None
        for _ in range(100):
            try:
                targets = json.load(urllib.request.urlopen("http://127.0.0.1:9223/json"))
                target = next(item for item in targets if item["type"] == "page" and item["url"].startswith("file:"))
                break
            except (OSError, StopIteration):
                time.sleep(0.1)
        if not target:
            raise RuntimeError("Chrome DevTools no inició correctamente")
        devtools = DevTools(target["webSocketDebuggerUrl"])

        expression = r'''(()=>{
          document.querySelectorAll("details").forEach(node => { node.open = true; });
          const results = document.querySelector("#mm-results");
          results.hidden = false;
          const mean = document.querySelector("#mm-mean-marker");
          const user = document.querySelector("#mm-user-marker");
          const combined = document.querySelector("#mm-combined-marker");
          mean.hidden = false; mean.style.left = "0%";
          user.hidden = false; user.style.left = "100%";
          combined.hidden = false; combined.style.left = "50%";
          const root = document.documentElement;
          const offenders = [...document.querySelectorAll("header *, main *, footer *")]
            .filter(node => !node.classList.contains("sr-only") && !node.classList.contains("salto-contenido"))
            .map(node => {
              const rect = node.getBoundingClientRect();
              return { node: node.id || node.className || node.tagName, left: rect.left, right: rect.right };
            })
            .filter(item => item.left < -0.5 || item.right > root.clientWidth + 0.5);
          return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, offenders };
        })()'''

        for index, width in enumerate(WIDTHS):
            command_id = 10 + index * 2
            devtools.call(command_id, "Emulation.setDeviceMetricsOverride", {
                "width": width, "height": 1000, "deviceScaleFactor": 1, "mobile": False,
            })
            time.sleep(0.25)
            response = devtools.call(command_id + 1, "Runtime.evaluate", {
                "expression": expression, "returnByValue": True,
            })
            result = response["result"]["result"].get("value")
            if not result:
                failures.append(f"{width}px: no se pudo medir el documento")
                continue
            if result["scrollWidth"] > result["clientWidth"]:
                failures.append(f"{width}px: scrollWidth {result['scrollWidth']} > clientWidth {result['clientWidth']}")
            if result["offenders"]:
                failures.append(f"{width}px: elementos fuera del viewport: {result['offenders']}")
            print(f"{width}px: scrollWidth={result['scrollWidth']}, clientWidth={result['clientWidth']}, offenders={len(result['offenders'])}")
    finally:
        process.terminate()
        process.wait(timeout=5)
        shutil.rmtree(profile, ignore_errors=True)

    for failure in failures:
        print("FAIL", failure)
    print(f"Responsive overflow: {len(WIDTHS) - len(failures)} PASS, {len(failures)} FAIL")
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
