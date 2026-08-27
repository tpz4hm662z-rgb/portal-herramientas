#!/usr/bin/env python3
"""Detecta páginas públicas modificadas y, opcionalmente, las notifica a IndexNow."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

HOST = "imoancy.com"
ORIGIN = f"https://{HOST}"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_PATTERN = re.compile(r"^[A-Za-z0-9-]{8,128}$")


class PageMetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.canonical: str | None = None
        self.noindex = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): (value or "") for name, value in attrs}
        if tag.lower() == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href")
        if tag.lower() == "meta" and values.get("name", "").lower() == "robots":
            directives = {part.strip().lower() for part in values.get("content", "").split(",")}
            self.noindex = "noindex" in directives


def expected_public_path(file_path: str) -> str | None:
    path = Path(file_path)
    parts = path.parts
    if len(parts) == 1 and path.suffix == ".html":
        return "/" if path.name == "index.html" else f"/{path.name}"
    if parts == ("guias", "index.html"):
        return "/guias/"
    if len(parts) == 3 and parts[0] in {"herramientas", "guias"} and parts[2] == "index.html":
        return f"/{parts[0]}/{parts[1]}/"
    return None


def canonical_for_file(repository: Path, file_path: str) -> str | None:
    expected_path = expected_public_path(file_path)
    page = repository / file_path
    if expected_path is None or not page.is_file():
        return None
    parser = PageMetadataParser()
    parser.feed(page.read_text(encoding="utf-8"))
    if parser.noindex or not parser.canonical:
        return None
    parsed = urlsplit(parser.canonical)
    if parsed.scheme != "https" or parsed.netloc != HOST or parsed.query or parsed.fragment:
        return None
    if parsed.path != expected_path:
        return None
    return parser.canonical


def resolve_revision(repository: Path, revision: str) -> str:
    if not re.fullmatch(r"[0-9A-Za-z^~._/-]+", revision) or revision.startswith("-"):
        raise ValueError("La revisión Git no es válida.")
    result = subprocess.run(
        ["git", "rev-parse", "--verify", f"{revision}^{{commit}}"],
        cwd=repository,
        check=True,
        text=True,
        capture_output=True,
    )
    sha = result.stdout.strip()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Git no devolvió un SHA válido.")
    return sha


def changed_html_files(repository: Path, before: str, after: str) -> list[str]:
    after = resolve_revision(repository, after)
    before = resolve_revision(repository, f"{after}^") if set(before) == {"0"} else resolve_revision(repository, before)
    command = [
        "git", "diff", "--name-only", "--diff-filter=AMCR", before, after, "--", "*.html"
    ]
    result = subprocess.run(command, cwd=repository, check=True, text=True, capture_output=True)
    return sorted({line.strip() for line in result.stdout.splitlines() if line.strip()})


def discover_key(repository: Path) -> tuple[str, str]:
    matches: list[tuple[str, str]] = []
    for candidate in repository.glob("*.txt"):
        value = candidate.read_text(encoding="utf-8").strip()
        if KEY_PATTERN.fullmatch(value) and candidate.stem == value:
            matches.append((value, f"{ORIGIN}/{candidate.name}"))
    if len(matches) != 1:
        raise RuntimeError("Se esperaba exactamente un archivo de clave IndexNow válido en la raíz.")
    return matches[0]


def build_payload(repository: Path, before: str, after: str) -> dict[str, object] | None:
    urls = sorted(filter(None, (
        canonical_for_file(repository, path)
        for path in changed_html_files(repository, before, after)
    )))
    if not urls:
        return None
    key, key_location = discover_key(repository)
    return {"host": HOST, "key": key, "keyLocation": key_location, "urlList": urls}


def submit(payload: dict[str, object]) -> int:
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"IndexNow respondió HTTP {error.code}.") from error


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", required=True)
    parser.add_argument("--after", required=True)
    parser.add_argument("--submit", action="store_true", help="Envía el lote; sin esta opción solo lo muestra.")
    parser.add_argument("--repository", type=Path, default=Path.cwd())
    args = parser.parse_args()

    payload = build_payload(args.repository.resolve(), args.before, args.after)
    if payload is None:
        print("IndexNow: no hay páginas públicas indexables nuevas o modificadas.")
        return 0
    if not args.submit:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        print("IndexNow: dry-run; no se ha enviado ninguna notificación.")
        return 0
    status = submit(payload)
    if status not in {200, 202}:
        raise RuntimeError(f"Respuesta IndexNow inesperada: HTTP {status}.")
    print(f"IndexNow: {len(payload['urlList'])} URL(s) notificadas; HTTP {status}.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, subprocess.CalledProcessError) as error:
        print(f"IndexNow: ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
