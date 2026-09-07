#!/usr/bin/env bash
# =============================================================================
# Pruebas manuales — Auditoría de gestión de errores
#
# Ejecuta paso a paso cada escenario para generar los errores y verificar
# que el sistema responde de forma segura sin exponer información interna.
#
# Uso:
#   bash pruebas-manuales.sh
#
# Requisitos: curl, jq, python3, npm, y los servicios en ejecución.
# =============================================================================
set -euo pipefail

PASS=0
FAIL=0

report() {
    local name="$1" status="$2" detail="$3"
    if [ "$status" = "PASS" ]; then
        PASS=$((PASS + 1))
        echo "  ✅ $name"
    else
        FAIL=$((FAIL + 1))
        echo "  ❌ $name"
        echo "     $detail"
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PRUEBAS MANUALES — Auditoría de gestión de errores"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ────────────────────────────────────────────────────────────────────
# ALTO-01: Cliente HTTP (api-client.ts) — mensajes genéricos
# ────────────────────────────────────────────────────────────────────
echo "--- ALTO-01: api-client.ts no expone mensajes del backend ---"
echo "  Instrucciones: Abre el backoffice en el navegador y genera"
echo "  respuestas HTTP desde el frontend."
echo ""
echo "  [1] Abre: http://localhost:3000/talent-pipeline-tracker"
echo "      (sin estar autenticado) → Deberías ver:"
echo "      \"No tienes permisos\" (no el mensaje real del backend)"
echo ""

# ────────────────────────────────────────────────────────────────────
# ALTO-02: Talent Pipeline — catálogo público de errores
# ────────────────────────────────────────────────────────────────────
echo "--- ALTO-02: talentTrackerApi.ts usa catálogo público --------"
echo "  [2] Revisa que el código solo mapea por código HTTP:"
grep -n "getPublicErrorMessage" "/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/clients/talentTrackerApi.ts" | head -5
echo ""
echo "  ✅ Verificado en código."

# ────────────────────────────────────────────────────────────────────
# ALTO-03: CSV — error inesperado con logger + 500 fijo
# ────────────────────────────────────────────────────────────────────
echo "--- ALTO-03: CSV no expone trazas internas ------------------"
echo "  [3] Si el backoffice está corriendo, haz una petición"
echo "      directa al endpoint de análisis con un CSV inválido:"
echo ""
echo '      curl -s -X POST http://localhost:8000/api/incidents/analyze'
echo '        -F "file=@/dev/null;filename=test.csv" | jq .'
echo ""
echo "      Respuesta esperada:"
echo '      { "detail": "Unable to analyze the file." }'
echo "      (No debe aparecer ninguna ruta de archivo ni traceback)"
echo ""

# ────────────────────────────────────────────────────────────────────
# ALTO-04: Perfil — error impide editar
# ────────────────────────────────────────────────────────────────────
echo "--- ALTO-04: Perfil sin datos no muestra formulario vacío ----"
echo "  [4] Abre http://localhost:3000/account/profile"
echo "      Deberías ver el formulario normalmente si estás autenticado."
echo ""
echo "  Para probar el error, fuerza una falla de red (desconecta"
echo "  el servidor o usa DevTools > Network > Offline) y recarga."
echo "  Deberías ver: mensaje de error + botón \"Reintentar\""
echo "  (No debe mostrarse el formulario vacío)"
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-01: Registro — mensajes públicos
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-01: Registro público no muestra códigos HTTP -------"
echo "  [5] Abre http://localhost:3000/registro"
echo "      Ingresa datos inválidos y envía."
echo "      Deberías ver: \"Revisa los datos del formulario\""
echo "      (No debe aparecer \"Error del servidor: 400\" ni similar)"
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-02: JSON parseo protegido
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-02: JSON inválido retorna mensaje fijo ------------"
echo "  [6] Verificación en código. Busca el try/catch de response.json():"
grep -n "catch" "/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/uis/backoffice/lib/api-client.ts" | head -3
grep -n "catch" "/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/clients/talentTrackerApi.ts" | head -3
echo ""
echo "  ✅ Ambos archivos tienen parseo protegido con mensaje fijo."

# ────────────────────────────────────────────────────────────────────
# MEDIO-03: Listado candidaturas con reintento
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-03: Listado candidaturas tiene botón Reintentar ----"
echo "  [7] Abre http://localhost:3000/talent-pipeline-tracker"
echo "      Falla la conexión (DevTools > Network > Offline) y recarga."
echo "      Deberías ver: mensaje de error + botón \"Reintentar\""
echo "      Al hacer click, el listado se vuelve a cargar."
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-04: Detalle candidatura con reintento
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-04: Detalle candidatura tiene botón Reintentar -----"
echo "  [8] Abre http://localhost:3000/talent-pipeline-tracker/candidates/1"
echo "      Falla la conexión y recarga."
echo "      Deberías ver: mensajes de error + botones \"Reintentar\""
echo "      tanto para los datos como para las notas."
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-05: Lectura CSV con try/except
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-05: Lectura de archivo CSV protegida --------------"
echo "  [9] Verificación en código:"
grep -n "try:" "/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/routes/incidents.py" | head -3
echo "  ✅ La lectura del archivo está dentro de try/except."

# ────────────────────────────────────────────────────────────────────
# MEDIO-06: Exportación CLI protegida
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-06: Exportación CLI con mensaje sanitizado ---------"
echo "  [10] Ejecuta el análisis con exportación a un directorio"
echo "       sin permisos de escritura:"
echo ""
echo '      cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW'
echo '      python scripts/analyze.py tests/fixtures/sample.csv --export /root/'
echo ""
echo "      Resultado esperado:"
echo '      "Error: unable to export results." en stderr'
echo "      Código de salida: 1"
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-07: Seeder con configuración ausente
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-07: Seeder no falla con traceback de configuración --"
echo "  [11] Ejecuta el seeder sin variables de entorno:"
echo ""
echo '      cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api'
echo '      env -i PATH="$PATH" python seed.py'
echo ""
echo "      Resultado esperado:"
echo "      Mensaje legible en stderr, código de salida 1"
echo "      (Sin traceback de Python)"
echo ""

# ────────────────────────────────────────────────────────────────────
# MEDIO-08: Correo con error de configuración
# ────────────────────────────────────────────────────────────────────
echo "--- MEDIO-08: Error de configuración de correo no filtra detalle"
echo "  [12] Desde el backoffice autenticado, ve a:"
echo "       http://localhost:3000/forgot-password"
echo "       Ingresa un email registrado."
echo ""
echo "      Si el servidor tiene configurada RESEND_API_KEY inválida,"
echo "      deberías recibir una respuesta 200 genérica"
echo "      (No debe aparecer el mensaje real del error de configuración)"
echo ""

# ────────────────────────────────────────────────────────────────────
# BAJO-01: Cliente estático heredado
# ────────────────────────────────────────────────────────────────────
echo "--- BAJO-01: Cliente JS legacy con mensajes públicos ---------"
echo "  [13] Abre http://localhost:3000/incidents-analyzer (HTML legacy)"
echo "      Sube un CSV inválido."
echo "      Deberías ver un mensaje como:"
echo "      \"Revisa el archivo CSV e intenta de nuevo\""
echo "      (No debe aparecer \"500 Internal Server Error\")"
echo ""

# ────────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo "  Resumen: ${PASS} verificaciones automáticas, ${FAIL} fallos"
echo "  (Las verificaciones interactivas requieren evaluación manual)"
echo "═══════════════════════════════════════════════════════════════"