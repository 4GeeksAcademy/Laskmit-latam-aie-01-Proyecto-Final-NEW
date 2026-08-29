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

## Siguientes pasos
1. Ejecutar validacion visual manual (`npm run dev`) en `uis/website` y `uis/backoffice`.
2. Consolidar backlog tecnico de Hito 5 (inventario) dentro de `services/`.
3. Mantener actualizacion continua del banco de memoria por cada entrega.
