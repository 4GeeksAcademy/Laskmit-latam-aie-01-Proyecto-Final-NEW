# Tech Context

## Stack principal
- **Frontend Público**: Next.js 16 + TypeScript para `uis/website`
- **Frontend interno**: Next.js 16 + TypeScript para `uis/backoffice`. Dentro de él: 
  - `uis/backoffice/app/talent-pipeline-tracker`
  - `uis/backoffice/app/incidents-analyzer`
  - `uis/backoffice/app/suppliers`
- **Backend API**: FastAPI + uvicorn + TinyDB en `services/api/`. Rutas separadas: `routes/suppliers.py`, `routes/incidents.py`.
- **Cliente compartido**: `services/api/clients/talentTrackerApi.ts` (TypeScript) usado por las apps Next.js.
- **Scripts CLI**: Python en `scripts/analyze.py`.
- **Logica compartida**: TypeScript en `src/` (modelos, utilidades) y Python utilitario en `shared/`.
- **Datos**: CSV fuente en `data/raw/`, resultados en `data/process/`.
- **Gobernanza IA**: `AGENTS.md`, `.agents/` y `memory-bank/`.

## Decisiones de arquitectura
1. Separar experiencia publica (`uis/website`) de experiencia interna (`uis/backoffice`).
2. Las apps Next.js tienen su propio `package.json` y `next.config` (no monorepo manager centralizado).
3. Reutilizar modulos existentes por importacion desde origen (no copias).
4. La logica de analisis de incidencias esta centralizada en `shared/incidents_analysis.py` — usada tanto por CLI como por API.
5. Centralizar reglas operativas de agentes en `AGENTS.md` y `.agents/`.
6. Mantener banco de memoria actualizado para cada entrega.
7. Todas las apps Next.js verifican su build (`npm run build`) sin errores.

## Restricciones tecnicas
- No crear APIs fuera de `services/`.
- No duplicar codigo de logica de negocio.
- No modificar rutas protegidas sin aprobacion explicita.
- Toda decision nueva debe reflejarse en `memory-bank/progress.md`.
- Los cambios se trabajan en la rama `reordenamiento` (no main).


