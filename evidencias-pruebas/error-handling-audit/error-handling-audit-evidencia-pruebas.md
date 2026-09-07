# Evidencias de las pruebas efectuadas — Auditoría de gestión de errores

**Fecha de ejecución:** 2026-09-07T03:47:52+00:00  
**Rama:** `error-handling-audit`  
**Repositorio:** `4GeeksAcademy/Laskmit-latam-aie-01-Proyecto-Final-NEW`

---

## 1. Suites de pruebas automatizadas (backend)

Las suites existentes cubren los 13 hallazgos y verifican que no haya
regresiones en autenticación, gestor de incidencias, Talent Pipeline
y seeder.


### Backend — Suite completa de 16 pruebas

**Estado:** `PASS`

```text
................                                                         [100%]
=============================== warnings summary ===============================
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_change_password_requires_current_password_and_keeps_session
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_configuration_failure_keeps_generic_response_and_invalidates_token
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_failure_keeps_generic_response_and_invalidates_token
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_expired_token_is_rejected
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_forgot_password_does_not_enumerate_users
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_reset_password_is_single_use_and_updates_login
  /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/auth/services.py:103: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    created_at=datetime.utcnow(),

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
16 passed, 6 warnings in 6.56s

```

### Incident Manager — 7 tests (incluye ALTO-03 y MEDIO-05)

**Estado:** `PASS`

```text
============================= test session starts ==============================
platform linux -- Python 3.12.1, pytest-9.0.2, pluggy-1.6.0
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: anyio-4.12.1
collected 7 items

services/api/tests/test_incident_manager.py .......                      [100%]

============================== 7 passed in 0.90s ===============================

```

### Auth Password — 6 tests (incluye MEDIO-08)

**Estado:** `PASS`

```text
============================= test session starts ==============================
platform linux -- Python 3.12.1, pytest-9.0.2, pluggy-1.6.0
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: anyio-4.12.1
collected 6 items

services/api/tests/test_auth_password.py ......                          [100%]

=============================== warnings summary ===============================
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_change_password_requires_current_password_and_keeps_session
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_configuration_failure_keeps_generic_response_and_invalidates_token
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_failure_keeps_generic_response_and_invalidates_token
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_expired_token_is_rejected
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_forgot_password_does_not_enumerate_users
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_reset_password_is_single_use_and_updates_login
  /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/auth/services.py:103: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    created_at=datetime.utcnow(),

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================== 6 passed, 6 warnings in 6.46s =========================

```

### Analyze CLI — Exportación protegida (MEDIO-06)

**Estado:** `PASS`

```text
============================= test session starts ==============================
platform linux -- Python 3.12.1, pytest-9.0.2, pluggy-1.6.0
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: anyio-4.12.1
collected 1 item

services/api/tests/test_analyze_cli.py .                                 [100%]

============================== 1 passed in 0.02s ===============================

```

### Seed CLI — Seeder protegido (MEDIO-07)

**Estado:** `PASS`

```text
============================= test session starts ==============================
platform linux -- Python 3.12.1, pytest-9.0.2, pluggy-1.6.0
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: anyio-4.12.1
collected 2 items

services/api/tests/test_seed_cli.py ..                                   [100%]

============================== 2 passed in 0.19s ===============================

```

### UIs — Backoffice — ESLint

**Estado:** `PASS`

```text


```

### UIs — Backoffice — Next.js build

**Estado:** `PASS`

```text

> backoffice@0.1.0 build
> next build --webpack

▲ Next.js 16.3.0 (webpack)
- Environments: .env.local
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/uis/backoffice/package-lock.json

✓ Running next.config.ts took 45ms
- Experiments (use with caution):
  ✓ externalDir

  Creating an optimized production build ...
✓ Compiled successfully in 11.5s
  Running TypeScript ...
  Finished TypeScript in 3.5s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/14) ...
  Generating static pages using 1 worker (3/14) 
  Generating static pages using 1 worker (6/14) 
  Generating static pages using 1 worker (10/14) 
✓ Generating static pages using 1 worker (14/14) in 1068ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /account/change-password
├ ○ /account/profile
├ ○ /forgot-password
├ ○ /incidents
├ ○ /incidents-analyzer
├ ○ /login
├ ○ /register
├ ○ /reset-password
├ ○ /suppliers
├ ○ /talent-pipeline-tracker
└ ƒ /talent-pipeline-tracker/candidates/[id]


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

```

### UIs — Website — ESLint

**Estado:** `PASS`

```text


```

### UIs — Website — Next.js build

**Estado:** `PASS`

```text

> website@0.1.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/package-lock.json as the root directory.
 To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory for more information.
 Detected additional lockfiles: 
   * /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/uis/website/package-lock.json

✓ Running next.config.ts took 83ms

  Creating an optimized production build ...
✓ Compiled successfully in 11.4s
  Running TypeScript ...
  Finished TypeScript in 3.7s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/5) ...
  Generating static pages using 1 worker (1/5) 
  Generating static pages using 1 worker (2/5) 
  Generating static pages using 1 worker (3/5) 
✓ Generating static pages using 1 worker (5/5) in 216ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /registro


○  (Static)  prerendered as static content

```

### Exposición residual — 0 fugas de detail o códigos HTTP en UI

**Estado:** `PASS`

```text
No se encontraron patrones inseguros.

```

### Cliente externo — Talent Pipeline usa catálogo público

**Estado:** `PASS`

```text
getPublicErrorMessage definido en talentTrackerApi.ts

```

### Endpoint CSV — Errores inesperados registrados por logger

**Estado:** `PASS`

```text
logger.exception presente en routes/incidents.py

```

### Correo — Configuración separada del envío

**Estado:** `PASS`

```text
EmailConfigurationError definido en resend_client.py

```

### Seeder — Importable sin variables de entorno

**Estado:** `PASS`

```text
import ok

```

### Cliente estático — incidents-analyzer/app.js sintaxis

**Estado:** `PASS`

```text
Syntax OK

```

### Cliente estático — incidents-app.js sintaxis

**Estado:** `PASS`

```text
Syntax OK

```

### Control de cambios — Resumen de archivos modificados

**Estado:** `INFO`

```text
 README.md                                          |   2 +-
 memory-bank/progress.md                            |  58 +++++++++++
 scripts/analyze.py                                 |   8 +-
 services/api/clients/talentTrackerApi.ts           |  93 +++++++-----------
 services/api/incidents/__init__.py                 |   2 +-
 services/api/notifications/resend_client.py        |  37 ++++---
 services/api/routes/auth.py                        |  15 ++-
 services/api/routes/incidents.py                   |  14 ++-
 services/api/seed.py                               | 107 ++++++++++++---------
 services/api/tests/test_auth_password.py           |  17 +++-
 services/api/tests/test_incident_manager.py        |  23 +++++
 uis/backoffice/app/account/profile/page.tsx        |  23 ++++-
 .../CandidatesPageClient.tsx                       |  16 ++-
 .../components/CandidateDetailClient.tsx           |  19 +++-
 uis/backoffice/lib/api-client.ts                   |  72 ++++++++++----
 uis/backoffice/public/incidents-analyzer/app.js    |  20 +++-
 uis/backoffice/public/incidents-app.js             |  20 +++-
 uis/website/app/registro/RegistroForm.tsx          |  12 ++-
 18 files changed, 388 insertions(+), 170 deletions(-)

```

---

## Resumen global

| Indicador | Valor |
|:---|---:|
| Pruebas / chequeos ejecutados | **16** |
| Aprobados | **16** |
| Fallos | **0** |
| Informativos | **1** |

✅ Todos los chequeos pasaron correctamente.

---

*Generado automáticamente por el script de verificación integral.*  
*Timestamp: 2026-09-07T03:47:52+00:00*
