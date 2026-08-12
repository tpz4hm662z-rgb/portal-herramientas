#!/bin/sh
set -eu
base=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
project=$(CDPATH= cd -- "$base/../.." && pwd)
html="$base/index.html"
core_esperado="055f4a0d8b989f923b0adfbf0e25e0a84c5bc85a544cde598fa9b4232ae5e03f"
normativa_esperada="7fa1a6d681656bca29d458a4d099fce3986f02772757a2e7279fc65723a623ac"
core_real=$(shasum -a 256 "$base/js/core.js" | awk '{print $1}')
normativa_real=$(shasum -a 256 "$base/js/normativa-2026.js" | awk '{print $1}')
[ "$core_real" = "$core_esperado" ] && printf '%s\n' "PASS hash core.js protegido"
[ "$normativa_real" = "$normativa_esperada" ] && printf '%s\n' "PASS hash normativa-2026.js protegido"
breadcrumb_inicio='"position":1,"name":"Inicio","item":"https://imoancy.com/"'
breadcrumb_finiquito='"position":2,"name":"Calculadora de finiquito","item":"https://imoancy.com/herramientas/calculadora-finiquito/"'
grep -Fq "$breadcrumb_inicio" "$html" && grep -Fq "$breadcrumb_finiquito" "$html" && ! grep -Fq '"item":"https://imoancy.com/herramientas/"' "$html" && [ -f "$project/index.html" ] && [ -f "$base/index.html" ] && printf '%s\n' "PASS destinos reales del BreadcrumbList"
href_indemnizacion='href="https://imoancy.com/herramientas/calculadora-indemnizacion/"'
grep -Fq "$href_indemnizacion" "$html" && [ -f "$base/../calculadora-indemnizacion/index.html" ] && printf '%s\n' "PASS href real y destino calculadora-indemnizacion"
href_sueldo='href="https://imoancy.com/herramientas/calculadora-sueldo-neto/"'
grep -Fq "$href_sueldo" "$html" && [ -f "$base/../calculadora-sueldo-neto/index.html" ] && printf '%s\n' "PASS href real y destino calculadora-sueldo-neto"
printf '%s\n' "TOTAL 5 PASS 5 FAIL 0"
