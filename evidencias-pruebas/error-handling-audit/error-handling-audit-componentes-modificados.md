# Relación de componentes modificados — Auditoría de gestión de errores

**Rama:** `error-handling-audit`  
**Base (comparación):** `main`  
**Total archivos modificados:** 28 (entre modificados, movidos y nuevos)

> A continuación se listan solo los archivos con cambios de código significativos
> para la auditoría. Quedan excluidos movimientos de `SPECS/obsoletos/` y
> archivos nuevos de documentación (`SPECS/SPECS-sin-hito-07-*.md`, `memory-bank/`).

---

## 1. Backend — FastAPI (services/api)

### 1.1 `services/api/routes/incidents.py`

| Líneas | Cambio |
|--------|--------|
| +4 | Se añade `import logging` |
| +58 | Se crea `logger = logging.getLogger(__name__)` |
| 177–182 | Se envuelve `file.read()` en try/except `(OSError, RuntimeError)` → log warning + `400` genérico |
| 193–195 | Se cambia `except Exception` → `logger.exception()` + respuesta `500` genérica en lugar de devolver el error real |

**Hallazgos:** ALTO-03 (fuga de detalle de excepción en analyze), MEDIO-05 (excepción sin log al leer archivo)

### 1.2 `services/api/routes/auth.py`

| Líneas | Cambio |
|--------|--------|
| 20–23 | Se importa `EmailConfigurationError` adicionalmente |
| 36–39 | Lo mismo en el bloque fallback de imports |
| 78–82 | Se añade `except EmailConfigurationError` → invalida token + `logger.error` |
| 80 | Se añade `except EmailDeliveryError` (ya existía, se mantiene) con `logger.warning` |

**Hallazgos:** MEDIO-08 (error de configuración de correo no se manejaba por separado)

### 1.3 `services/api/notifications/resend_client.py`

| Líneas | Cambio |
|--------|--------|
| +8–9 | Se importa `ResendError` de la librería `resend` |
| +11–13 | Se define la clase `EmailConfigurationError(RuntimeError)` |
| 28–29 | Se valida `RESEND_API_KEY` al inicio; si falta → `EmailConfigurationError` |
| 30–33 | Se envuelve `_frontend_url()` en try/except `ValueError` → `EmailConfigurationError` |
| 35–51 | Se reestructura: primero se validan configuraciones, luego se envía el correo |
| 54 | Se cambia `except Exception` → `except ResendError` para no tragar errores de configuración |

**Hallazgos:** MEDIO-08 (separación entre error de configuración y error de envío)

### 1.4 `services/api/incidents/__init__.py`

| Línea | Cambio |
|-------|--------|
| 1 | `from services.api.incidents.service import ...` → `from .service import ...` |

**Motivo:** Corrección de import absoluto que rompía la ejecución con `ModuleNotFoundError`.

### 1.5 `services/api/seed.py`

| Líneas | Cambio |
|--------|--------|
| 3–4 | Se añaden `import os`, `import sys` |
| 9 | Se añade `from pydantic import ValidationError` |
| 186–189 | Se extrae lógica de credenciales a función `_admin_credentials()` |
| 193–199 | `main()` ahora retorna `int` (0 éxito, 1 error) con try/except `ValueError` |
| 203–224 | Se envuelve creación del admin en try/except `(OSError, ValueError, ValidationError)` |
| 230–247 | Se envuelve carga de proveedores en try/except similar |
| 251 | Se cambia `main()` por `raise SystemExit(main())` |

**Hallazgos:** MEDIO-07 (seeder protegido contra fallos de E/S y validación, código de salida adecuado)

### 1.6 `services/api/clients/talentTrackerApi.ts`

| Líneas | Cambio |
|--------|--------|
| 65–70 | Se elimina interfaz `ValidationErrorDetail` (ya no se parsea el body) |
| 121–138 | Se reemplaza `buildErrorFromBody()` por `getPublicErrorMessage(statusCode)` con mensajes fijos por código HTTP |
| 143–152 | Se envuelve `fetch()` en try/catch → error de conexión genérico |
| 157 | En `!response.ok`, se usa `getPublicErrorMessage` en lugar de parsear el body |
| 162–166 | Se valida `content-type` y si no es JSON → error genérico |
| 168–172 | Se envuelve `response.json()` en try/catch → error genérico |

**Hallazgos:** MEDIO-09 (Talent Pipeline filtra errores del playground externo)

### 1.7 `services/api/tests/test_auth_password.py`

| Líneas | Cambio |
|--------|--------|
| 14 | Se importa `EmailConfigurationError` |
| 142–156 | Nuevo test `test_email_configuration_failure_keeps_generic_response_and_invalidates_token` (simula error de configuración, verifica token invalidado) |

### 1.8 `services/api/tests/test_incident_manager.py`

| Líneas | Cambio |
|--------|--------|
| 100–112 | Nuevo test `test_analyze_hides_unexpected_error_details` (verifica que el mensaje interno no se filtre) |
| 114–124 | Nuevo test `test_analyze_returns_clean_error_for_invalid_csv` (verifica error 400 genérico) |

---

## 2. Scripts

### 2.1 `scripts/analyze.py`

| Líneas | Cambio |
|--------|--------|
| 105–110 | Se envuelve `mkdir` + `write_bytes` en try/except `OSError` con mensaje a stderr y retorno `1` |

**Hallazgos:** MEDIO-06 (exportación protegida contra fallos de E/S)

---

## 3. Frontend — Backoffice (uis/backoffice)

### 3.1 `uis/backoffice/lib/api-client.ts`

| Líneas | Cambio |
|--------|--------|
| +9 | Se añade `errorMessages?: Partial<Record<number, string>>` a `ApiRequestOptions` |
| 40–55 | Nueva función `getPublicErrorMessage(status)` con mensajes fijos por código HTTP |
| 58–60 | `parseError()` ahora recibe `errorMessages` opcional y usa el catálogo público como fallback |
| 73–76 | En `payload.error.message` se devuelve `fallback` en lugar del mensaje real |
| 78–82 | Se elimina `if (typeof payload.detail === "string")` que exponía detalles |
| 83–88 | En `Array.isArray(payload.detail)` se usa `fallback` en lugar de concatenar `.msg` |
| 95–100 | Se extraen opciones con destructuring incluyendo `errorMessages` |
| 126–131 | Se envuelve `fetch()` en try/catch con mensaje de conexión genérico |
| 134 | Se pasa `errorMessages` a `parseError()` |
| 156–159 | Se envuelve `response.json()` en try/catch con error genérico |
| 162 | `getErrorMessage()` usa `ApiError` en lugar de `Error` genérico |

**Hallazgos:** ALTO-01 (fuga de detalles de error en `payload.detail`), ALTO-02 (errores de red sin mensaje), MEDIO-03 (códigos HTTP expuestos en UI)

### 3.2 `uis/backoffice/app/account/profile/page.tsx`

| Líneas | Cambio |
|--------|--------|
| +29 | Nuevo estado `loadError` y `loadAttempt` |
| 37–38 | `loadProfile`: resetea loading/loadError al iniciar |
| 43–44 | En catch, usa `setLoadError` en lugar de `setError` (separa error de carga del error de envío) |
| 55 | Se añade `loadAttempt` como dependencia del useEffect para permitir reintento |
| 90–104 | Nueva pantalla de error con botón "Reintentar" cuando falla la carga del perfil |

**Hallazgos:** MEDIO-01 (el perfil no mostraba error si fallaba la carga, ni permitía reintentar)

### 3.3 `uis/backoffice/app/talent-pipeline-tracker/CandidatesPageClient.tsx`

| Líneas | Cambio |
|--------|--------|
| +6 | Se importa `ApiError` |
| 107 | Se cambia `error instanceof Error` → `error instanceof ApiError` |
| 215–224 | Estado de error ahora incluye botón "Reintentar" con `role="alert"` |

### 3.4 `uis/backoffice/app/talent-pipeline-tracker/components/CandidateDetailClient.tsx`

| Líneas | Cambio |
|--------|--------|
| +7 | Se importa `ApiError` |
| 46 | Se cambia `error instanceof Error` → `error instanceof ApiError` |
| 297–300 | Error de record ahora incluye botón "Reintentar candidatura" |
| 427–432 | Error de notas ahora incluye botón "Reintentar notas" |

### 3.5 `uis/backoffice/public/incidents-analyzer/app.js`

| Líneas | Cambio |
|--------|--------|
| (varias) | Se protegieron errores de fetch y parseo con mensajes genéricos |

### 3.6 `uis/backoffice/public/incidents-app.js`

| Líneas | Cambio |
|--------|--------|
| (varias) | Ídem anterior, mensajes de error genéricos |

---

## 4. Frontend — Website (uis/website)

### 4.1 `uis/website/app/registro/RegistroForm.tsx`

| Líneas | Cambio |
|--------|--------|
| 163–168 | En `!response.ok`, se reemplaza `throw new Error(...)` por mensajes fijos según código HTTP |
| 175–177 | En `catch`, se reemplaza `error instanceof Error ? error.message` por mensaje fijo de conexión |

**Hallazgos:** MEDIO-04 (el código HTTP se mostraba al usuario en error de registro)

---

## 5. Documentación

### 5.1 `README.md`

| Línea | Cambio |
|-------|--------|
| 54 | Se añade comentario "(ojo esto siempre hay que correrlo)" en la sección de dependencias de la API |

### 5.2 `SPECS/SPECS-sin-hito-07-error-handling-audit.md`

Archivo **nuevo** (194 líneas). Documento de especificaciones de la auditoría.

### 5.3 `memory-bank/progress.md`

Archivo **modificado** (58 líneas añadidas). Actualización del progreso.

---

## Resumen por hallazgo

| ID | Hallazgo | Archivos afectados |
|----|----------|-------------------|
| ALTO-01 | Fuga de detail de FastAPI en UI | `api-client.ts` |
| ALTO-02 | Error de red sin mensaje en UI | `api-client.ts` |
| ALTO-03 | Fuga de detalle de excepción en analyze | `routes/incidents.py` |
| MEDIO-01 | Profile sin estado de error ni reintento | `profile/page.tsx` |
| MEDIO-03 | Códigos HTTP expuestos en UI | `api-client.ts` |
| MEDIO-04 | Código HTTP expuesto en registro público | `RegistroForm.tsx` |
| MEDIO-05 | Excepción sin log al leer CSV | `routes/incidents.py` |
| MEDIO-06 | Exportación CLI sin protección E/S | `scripts/analyze.py` |
| MEDIO-07 | Seeder sin protección contra fallos | `seed.py` |
| MEDIO-08 | Error de configuración de correo no separado | `resend_client.py`, `routes/auth.py` |
| MEDIO-09 | Talent Pipeline expone errores del playground | `talentTrackerApi.ts` |
| — | Import roto en `incidents/__init__.py` | `incidents/__init__.py` (fix) |
| — | Tests para cubrir los hallazgos | `test_auth_password.py`, `test_incident_manager.py` |
| — | Componentes UI con reintento | `CandidatesPageClient.tsx`, `CandidateDetailClient.tsx`, `incidents-analyzer/app.js`, `incidents-app.js` |

---

*Documento generado el 2026-09-07.*