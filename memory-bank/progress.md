# Progress

## Hito 4 — Estado
- [x] Creada infraestructura base de agentes: `AGENTS.md`, `.agents/rules/`, `.agents/skills/`.
- [x] Creado banco de memoria: `memory-bank/projectbrief.md`, `memory-bank/techContext.md`, `memory-bank/progress.md`.
- [x] Documentacion del hito creada (`README` y `SPECS`).
- [x] Scaffold de `uis/website` finalizado y validado (`npm run lint`, `npm run build`).
- [x] Scaffold de `uis/backoffice` finalizado y validado (`npm run lint`, `npm run build`).
- [x] Integracion visible en UI de logica Hito 2 importada desde `src/utils/transformations.ts`.

## Reorganización del monorepo — Fases 1-3 (completadas)

### Fase 1 — Apps a uis
- [x] Movidas `apps/website → uis/website`, `apps/backoffice → uis/backoffice`, `apps/talent-pipeline-tracker → uis/talent-pipeline-tracker`
- [x] Renombrado `uis/web → uis/incidents-analyzer`
- [x] Eliminado directorio `apps/` vacío
- [x] Actualizados READMEs y SPECS con nuevas rutas
- [x] Verificados builds de las 3 apps Next.js

### Fase 2 — API y cliente compartido
- [x] Movido `Services/talentTrackerApi.ts → services/api/clients/talentTrackerApi.ts`
- [x] Simplificado `services/api/main.py` (usa routers separados)
- [x] Creado `services/api/routes/incidents.py`
- [x] Actualizadas 5 importaciones en Next.js
- [x] Actualizado `pyproject.toml` con paquetes

### Fase 3 — Datos y scripts
- [x] Movidos CSVs a `data/raw/` y `data/process/`
- [x] Eliminado `src/index.html` (duplicado de raíz)
- [x] Actualizado `scripts/analyze.py` para exportar a `data/process/results.csv`
- [x] Actualizadas referencias en READMEs y SPECS

### Fase 4 — READMEs raíz
- [x] Reescribir root `README.md` con contenido Nexova
- [x] Reescribir root `README.es.md` con contenido Nexova

### Fase 5 — SPECS y memory-bank
- [x] Actualizado `memory-bank/progress.md` con fases completadas
- [x] Actualizado `memory-bank/techContext.md` con estructura actual
- [x] Corregida ruta `uis/web/ → uis/incidents-analyzer/` en SPECS pendientes

## Revision de continuidad (Hito 5 y analizador de incidencias)
- Hito 5: actualmente documentado, sin implementacion completa de endpoints de inventario.
- Analizador de incidencias: existe implementacion base, CLI + API + UI. Debe seguir flujo de gobernanza antes de nuevos cambios.

## Gestor centralizado de incidencias — Implementado
- [x] Modelo persistente TinyDB con dominio cerrado, timestamps UTC y ciclo de vida validado.
- [x] Endpoints protegidos de alta, listado con filtros, detalle, cambio de estado y resumen.
- [x] Conservados `/api/incidents/health`, `/analyze` y `/results/export` sin cambios de contrato.
- [x] Seed idempotente desde `data/raw/incidents-nexova.csv`, reutilizando `shared/incidents_analysis.py`.
- [x] Verificados 96 registros validos: estados 27/56/13 y categorias 49/35/12.
- [x] Vista `/incidents` integrada en backoffice con formulario, filtros, listado, transiciones y resumen.
- [x] Pruebas backend: 10 aprobadas; quedan 5 advertencias preexistentes por `datetime.utcnow()` en AUTH-03.
- [x] `uis/backoffice`: lint sin errores (1 advertencia preexistente en Talent Pipeline) y build aprobado.
- [x] `uis/website`: lint sin errores (1 advertencia preexistente en registro) y build aprobado.
- [x] Comprobacion HTTP: health `200`, gestor sin token `401` y ruta frontend `/incidents` `200`.

## Auditoría de gestión de errores — Implementada (Sin Hito 07)

Los 13 hallazgos del informe de auditoría fueron corregidos siguiendo el orden recomendado del SPECS:

### Hallazgos corregidos

| Hallazgo | Severidad | Cambio |
|---|---|---|
| ALTO-01 — Cliente HTTP comparte mensajes del backend | ALTO | `api-client.ts`: mapeo público por código HTTP, parseo JSON protegido, `getErrorMessage` con fallback fijo |
| ALTO-02 — Talent Pipeline expone errores externos | ALTO | `talentTrackerApi.ts`: catálogo público por estado, red protegida |capturada, JSON inválido con mensaje fijo |
| ALTO-03 — CSV captura `Exception` y muestra `str(error)` | ALTO | `routes/incidents.py`: la lectura de archivo protegida, `except Exception` → logger + `500` fijo |
| ALTO-04 — Perfil editable sin carga | ALTO | `profile/page.tsx`: estado de error excluyente con `Reintentar` y formulario inhabilitado |
| MEDIO-01 — Registro público muestra códigos HTTP | MEDIO | `RegistroForm.tsx`: mensajes públicos por estado, fallo de red genérico |
| MEDIO-02 — JSON exitoso sin parseo protegido | MEDIO | `api-client.ts` y `talentTrackerApi.ts`: captura en `response.json()` con `ApiError` estable |
| MEDIO-03 — Listado candidaturas sin reintento | MEDIO | `CandidatesPageClient.tsx`: botón `Reintentar` que refresca usando `refreshToken` |
| MEDIO-04 — Detalle/notas sin reintento | MEDIO | `CandidateDetailClient.tsx`: botones `Reintentar candidatura` y `Reintentar notas` |
| MEDIO-05 — Lectura archivo CSV sin manejo | MEDIO | `routes/incidents.py`: `try/except (OSError, RuntimeError)` antes del análisis |
| MEDIO-06 — Exportación CLI falla sin diagnóstico | MEDIO | `scripts/analyze.py`: `try/except OSError` en `mkdir` + `write_bytes`, stderr sanitizado y código `1` |
| MEDIO-07 — Seeder no traduce fallos | MEDIO | `seed.py`: validación en `main()`, capturas por operación (configuración/validación/I/O), stderr fijo |
| MEDIO-08 — Correo captura todo en un bloque | MEDIO | `resend_client.py`: validación separada (`EmailConfigurationError`), captura acotada a `ResendError` |
| BAJO-01 — Cliente estático heredado inseguro | BAJO | `app.js` y `incidents-app.js`: mensajes públicos por estado, parseo protegido, red sanitizada |

### Pruebas añadidas
- `test_incident_manager.py`: 3 nuevas pruebas de errores (`test_analyze_hides_unexpected_error_details`, `test_analyze_returns_clean_error_for_invalid_csv`, idempotencia del seed)
- `test_analyze_cli.py`: 1 prueba de fallo de exportación con stderr sanitizado
- `test_seed_cli.py`: 2 pruebas de configuración ausente y fallo de base de datos
- `test_auth_password.py`: 1 prueba de `EmailConfigurationError`

### Validación
- [x] Backend: 16 pruebas aprobadas (0 errores, advertencias `utcnow()` preexistentes)
- [x] `uis/backoffice`: lint 0 errores (1 advertencia `summary` preexistente), build exitoso
- [x] `uis/website`: lint 0 errores (1 advertencia `router` preexistente), build exitoso
- [x] 16 archivos modificados, +363 -168 líneas
- [x] No se modificaron rutas protegidas
- [x] Script de verificación autónomo creado: `evidencias-pruebas/error-handling-audit/verify_evidence.sh`
- [x] Archivo de evidencia generado: `error-handling-audit-evidencia-pruebas.md`

### Resultado final de verificación: 16 PASS / 0 FAIL

| Verificación | Estado |
|---|---|
| Backend — Suite completa (16 tests) | PASS |
| Incident Manager (7 tests) | PASS |
| Auth Password (6 tests) | PASS |
| Analyze CLI exportación (1 test) | PASS |
| Seed CLI protegido (2 tests) | PASS |
| Backoffice — ESLint | PASS |
| Backoffice — Next.js build (12 rutas) | PASS |
| Website — ESLint | PASS |
| Website — Next.js build (3 rutas) | PASS |
| Exposición residual — 0 fugas | PASS |
| Talent Pipeline — catálogo público | PASS |
| Endpoint CSV — logger.exception | PASS |
| Correo — Config vs envío separados | PASS |
| Seeder — importable sin env vars | PASS |
| Clientes JS legacy — sintaxis OK | PASS |
| Control de cambios — 16 archivos | INFO |

## Siguientes pasos
1. Completar la matriz visual autenticada y adjuntar capturas del formulario, listado y resumen al PR.
2. Consolidar backlog tecnico de Hito 5 (inventario) dentro de `services/`.
3. Corregir en un cambio separado las advertencias preexistentes de AUTH-03, Talent Pipeline y registro web.
