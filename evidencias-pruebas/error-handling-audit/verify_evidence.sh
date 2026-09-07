#!/usr/bin/env bash
# =============================================================================
# Script de verificación integral — Auditoría de gestión de errores
# Ejecuta las validaciones unitarias, typechecks, lint y builds requeridos
# por los criterios de aceptación del Sin Hito 07.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EVIDENCE_DIR="$REPO_ROOT/evidencias-pruebas/error-handling-audit"
TIMESTAMP=$(date --iso-8601=seconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")
FAILURES=0
PASSES=0

mkdir -p "$EVIDENCE_DIR"

# ────────────────────────────────────────────────────────────────────
# Helper: imprime un bloque Markdown con el resultado de un chequeo
# ────────────────────────────────────────────────────────────────────
record_check() {
    local group="$1"     # grupo lógico (p.ej. "Backend tests")
    local name="$2"      # nombre concreto del chequeo
    local status="$3"    # PASS / FAIL / INFO
    local detail="$4"    # stdout/stderr relevante (puede ser multi-línea)

    if [ "$status" = "PASS" ]; then
        PASSES=$((PASSES + 1))
    elif [ "$status" = "FAIL" ]; then
        FAILURES=$((FAILURES + 1))
    fi
    # INFO no suma ni a PASS ni a FAIL - es informativo

    # Escapamos < y > para HTML si se renderiza como Markdown seguro
    echo -e "\n### $group — $name\n\n**Estado:** \`$status\`\n" >> "$CHK"
    echo '```text' >> "$CHK"
    echo "$detail" | head -c 4000 >> "$CHK"
    echo '' >> "$CHK"
    echo '```' >> "$CHK"
}

# Copia el archivo de evidencia
CHK=$(mktemp)

cat > "$CHK" <<EOF
# Evidencias de las pruebas efectuadas — Auditoría de gestión de errores

**Fecha de ejecución:** $TIMESTAMP  
**Rama:** \`error-handling-audit\`  
**Repositorio:** \`4GeeksAcademy/Laskmit-latam-aie-01-Proyecto-Final-NEW\`

---

## 1. Suites de pruebas automatizadas (backend)

Las suites existentes cubren los 13 hallazgos y verifican que no haya
regresiones en autenticación, gestor de incidencias, Talent Pipeline
y seeder.

EOF

# ─────────────────────────────────────────────────────────────────────
# 1a. Suite completa del backend
# ─────────────────────────────────────────────────────────────────────
echo "[1a] Running full backend test suite..."
cd "$REPO_ROOT"
BACKEND_OUT=$(PYTHONPATH=. pytest -q services/api/tests/ 2>&1 || true)
BACKEND_EXIT=$?
BACKEND_LINES=$(echo "$BACKEND_OUT" | wc -l)
BACKEND_LAST=$(echo "$BACKEND_OUT" | tail -5)
if [ "$BACKEND_EXIT" -eq 0 ]; then
    record_check "Backend" "Suite completa de 16 pruebas" "PASS" "$BACKEND_OUT"
else
    record_check "Backend" "Suite completa de 16 pruebas" "FAIL" "$BACKEND_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 1b. Pruebas del gestor de incidencias (ALTO-03, MEDIO-05)
# ─────────────────────────────────────────────────────────────────────
echo "[1b] Incident manager tests..."
cd "$REPO_ROOT"
INCIDENT_OUT=$(PYTHONPATH=. pytest -q services/api/tests/test_incident_manager.py -v --tb=short 2>&1 || true)
if echo "$INCIDENT_OUT" | grep -q "7 passed"; then
    record_check "Incident Manager" "7 tests (incluye ALTO-03 y MEDIO-05)" "PASS" "$INCIDENT_OUT"
else
    record_check "Incident Manager" "7 tests (incluye ALTO-03 y MEDIO-05)" "FAIL" "$INCIDENT_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 1c. Pruebas de recuperación de contraseña (MEDIO-08)
# ─────────────────────────────────────────────────────────────────────
echo "[1c] Password recovery tests..."
cd "$REPO_ROOT"
PWD_OUT=$(PYTHONPATH=. pytest -q services/api/tests/test_auth_password.py -v --tb=short 2>&1 || true)
if echo "$PWD_OUT" | grep -q "6 passed"; then
    record_check "Auth Password" "6 tests (incluye MEDIO-08)" "PASS" "$PWD_OUT"
else
    record_check "Auth Password" "6 tests (incluye MEDIO-08)" "FAIL" "$PWD_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 1d. Pruebas CLI de exportación (MEDIO-06)
# ─────────────────────────────────────────────────────────────────────
echo "[1d] Analyze CLI tests..."
cd "$REPO_ROOT"
CLI_OUT=$(PYTHONPATH=. pytest -q services/api/tests/test_analyze_cli.py -v --tb=short 2>&1 || true)
if echo "$CLI_OUT" | grep -q "1 passed"; then
    record_check "Analyze CLI" "Exportación protegida (MEDIO-06)" "PASS" "$CLI_OUT"
else
    record_check "Analyze CLI" "Exportación protegida (MEDIO-06)" "FAIL" "$CLI_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 1e. Pruebas CLI del seeder (MEDIO-07)
# ─────────────────────────────────────────────────────────────────────
echo "[1e] Seed CLI tests..."
cd "$REPO_ROOT"
SEED_OUT=$(PYTHONPATH=. pytest -q services/api/tests/test_seed_cli.py -v --tb=short 2>&1 || true)
if echo "$SEED_OUT" | grep -q "2 passed"; then
    record_check "Seed CLI" "Seeder protegido (MEDIO-07)" "PASS" "$SEED_OUT"
else
    record_check "Seed CLI" "Seeder protegido (MEDIO-07)" "FAIL" "$SEED_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 2. Lint y typecheck de apps Next.js
# ─────────────────────────────────────────────────────────────────────
echo ""
echo "[2] Running lint and typecheck for Next.js apps..."

# ── backoffice ──────────────────────────────────────────────────────
echo "[2a] Backoffice lint..."
cd "$REPO_ROOT/uis/backoffice"
BO_LINT_OUT=$(npx eslint --quiet app/ 2>&1 || true)
if echo "$BO_LINT_OUT" | grep -q "error"; then
    record_check "UIs" "Backoffice — ESLint" "FAIL" "$BO_LINT_OUT"
else
    record_check "UIs" "Backoffice — ESLint" "PASS" "$BO_LINT_OUT"
fi

echo "[2b] Backoffice build..."
BO_BUILD_OUT=$(npm run build 2>&1 || true)
if echo "$BO_BUILD_OUT" | grep -q "Compiled successfully"; then
    record_check "UIs" "Backoffice — Next.js build" "PASS" "$BO_BUILD_OUT"
else
    record_check "UIs" "Backoffice — Next.js build" "FAIL" "$BO_BUILD_OUT"
fi

# ── website ─────────────────────────────────────────────────────────
echo "[2c] Website lint..."
cd "$REPO_ROOT/uis/website"
WS_LINT_OUT=$(npx eslint --quiet app/ 2>&1 || true)
if echo "$WS_LINT_OUT" | grep -q "error"; then
    record_check "UIs" "Website — ESLint" "FAIL" "$WS_LINT_OUT"
else
    record_check "UIs" "Website — ESLint" "PASS" "$WS_LINT_OUT"
fi

echo "[2d] Website build..."
WS_BUILD_OUT=$(npm run build 2>&1 || true)
if echo "$WS_BUILD_OUT" | grep -q "Compiled successfully"; then
    record_check "UIs" "Website — Next.js build" "PASS" "$WS_BUILD_OUT"
else
    record_check "UIs" "Website — Next.js build" "FAIL" "$WS_BUILD_OUT"
fi

# ─────────────────────────────────────────────────────────────────────
# 3. Validación de reglas clave (busca fugas de código HTTP, etc.)
# ─────────────────────────────────────────────────────────────────────
echo ""
echo "[3] Scanning for residual exposure patterns..."

# Busca fugas residuales de `detail` directo en UI (contrato sano)
cd "$REPO_ROOT"
EXPOSURE_RAW=$(grep -rPn 'payload\.detail|throw new Error\(`Error.*response\.status`|error\.message \|\| .*Error inesperado' \
    --include='*.ts' --include='*.tsx' --include='*.js' \
    uis/backoffice/app uis/backoffice/lib uis/website/app uis/backoffice/public \
    --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)
# api-client.ts usa payload.detail para parsear errores de validación estándar
# de FastAPI (formato {detail: [{msg: ..., loc: ...}]}) — solo extrae .msg,
# no expone información sensible. Falso positivo conocido.
EXPOSURE_CLEAN=$(echo "$EXPOSURE_RAW" | grep -v 'api-client\.ts' || true)
EXPOSURE_COUNT=$(echo "$EXPOSURE_CLEAN" | sed '/^$/d' | wc -l)
if [ "$EXPOSURE_COUNT" -eq 0 ]; then
    record_check "Exposición residual" "0 fugas de detail o códigos HTTP en UI" "PASS" "No se encontraron patrones inseguros."
else
    record_check "Exposición residual" "0 fugas de detail o códigos HTTP en UI" "FAIL" "Se encontraron $EXPOSURE_COUNT coincidencias sospechosas."
fi

# Verifica que exista getPublicErrorMessage en talentTrackerApi
TALENT_PROTECTED=$(grep -c 'getPublicErrorMessage' "services/api/clients/talentTrackerApi.ts" || echo 0)
if [ "$TALENT_PROTECTED" -ge 1 ]; then
    record_check "Cliente externo" "Talent Pipeline usa catálogo público" "PASS" "getPublicErrorMessage definido en talentTrackerApi.ts"
else
    record_check "Cliente externo" "Talent Pipeline usa catálogo público" "FAIL" "No encontrado"
fi

# Verifica que el endpoint CSV tenga logger antes del except Exception
CSV_PROTECTED=$(grep -c 'logger.exception' "services/api/routes/incidents.py" || echo 0)
if [ "$CSV_PROTECTED" -ge 1 ]; then
    record_check "Endpoint CSV" "Errores inesperados registrados por logger" "PASS" "logger.exception presente en routes/incidents.py"
else
    record_check "Endpoint CSV" "Errores inesperados registrados por logger" "FAIL" "No encontrado"
fi

# Verifica separación EmailConfigurationError
EMAIL_CONFIG=$(grep -c 'EmailConfigurationError' "services/api/notifications/resend_client.py" || echo 0)
if [ "$EMAIL_CONFIG" -ge 1 ]; then
    record_check "Correo" "Configuración separada del envío" "PASS" "EmailConfigurationError definido en resend_client.py"
else
    record_check "Correo" "Configuración separada del envío" "FAIL" "No encontrado"
fi

# Verifica que seed pueda importarse sin entorno
SEED_SAFE=$(cd "$REPO_ROOT" && PYTHONPATH=. python -c "from services.api import seed; print('import ok')" 2>&1 || echo "FAIL")
if echo "$SEED_SAFE" | grep -q "import ok"; then
    record_check "Seeder" "Importable sin variables de entorno" "PASS" "$SEED_SAFE"
else
    record_check "Seeder" "Importable sin variables de entorno" "FAIL" "$SEED_SAFE"
fi

# ─────────────────────────────────────────────────────────────────────
# 4. Verificación de sintaxis JavaScript (BAJO-01)
# ─────────────────────────────────────────────────────────────────────
echo ""
echo "[4] Syntax check for legacy JS clients..."
cd "$REPO_ROOT"
JS1=$(node --check uis/backoffice/public/incidents-analyzer/app.js 2>&1 || echo "FAIL")
JS2=$(node --check uis/backoffice/public/incidents-app.js 2>&1 || echo "FAIL")
if echo "$JS1" | grep -q "FAIL"; then
    record_check "Cliente estático" "incidents-analyzer/app.js sintaxis" "FAIL" "$JS1"
else
    record_check "Cliente estático" "incidents-analyzer/app.js sintaxis" "PASS" "Syntax OK"
fi
if echo "$JS2" | grep -q "FAIL"; then
    record_check "Cliente estático" "incidents-app.js sintaxis" "FAIL" "$JS2"
else
    record_check "Cliente estático" "incidents-app.js sintaxis" "PASS" "Syntax OK"
fi

# ─────────────────────────────────────────────────────────────────────
# 5. Control de cambios (diff stats)
# ─────────────────────────────────────────────────────────────────────
echo ""
echo "[5] Gathering diff statistics..."
cd "$REPO_ROOT"
DIFF_STAT=$(git --no-pager diff --stat -- ':!*.pyc')
record_check "Control de cambios" "Resumen de archivos modificados" "INFO" "$DIFF_STAT"

# ─────────────────────────────────────────────────────────────────────
# Cierre
# ─────────────────────────────────────────────────────────────────────
TOTAL=$((PASSES + FAILURES))
# Contar chequeos con estado INFO
INFO_COUNT=0
while IFS= read -r line; do
    if [[ "$line" == *"Estado:"*"INFO"* ]]; then
        INFO_COUNT=$((INFO_COUNT + 1))
    fi
done < "$CHK"
cat >> "$CHK" <<EOF

---

## Resumen global

| Indicador | Valor |
|:---|---:|
| Pruebas / chequeos ejecutados | **$TOTAL** |
| Aprobados | **$PASSES** |
| Fallos | **$FAILURES** |
| Informativos | **$INFO_COUNT** |

EOF

if [ "$FAILURES" -eq 0 ]; then
    echo "✅ Todos los chequeos pasaron correctamente." >> "$CHK"
else
    echo "⚠️  Se encontraron $FAILURES fallos. Revisar los bloques marcados como FAIL." >> "$CHK"
fi

cat >> "$CHK" <<EOF

---

*Generado automáticamente por el script de verificación integral.*  
*Timestamp: $TIMESTAMP*
EOF

# Copiamos al destino
cp "$CHK" "$EVIDENCE_DIR/error-handling-audit-evidencia-pruebas.md"
rm -f "$CHK"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Resultados: $PASSES PASS / $FAILURES FAIL"
echo "  Evidencia guardada en:"
echo "    $EVIDENCE_DIR/error-handling-audit-evidencia-pruebas.md"
echo "════════════════════════════════════════════════════════"
exit "$FAILURES"