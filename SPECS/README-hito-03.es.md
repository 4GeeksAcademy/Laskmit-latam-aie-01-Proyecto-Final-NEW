# README — Hito 03 (Talent Pipeline Tracker)

## Estado del hito
Implementado completamente como app Next.js con App Router para gestionar el pipeline de candidaturas de Nexova.

## Que se hizo en el proyecto
- Se completo la app en `uis/talent-pipeline-tracker/` con una UI adaptada al contexto de Nexova.
- Se implemento la vista principal `/` con:
  - listado de candidaturas
  - filtro por estado usando query param `status`
  - filtro por etapa usando query param `stage`
  - busqueda por nombre o email usando query param `search`
  - estado de carga, exito y error para la carga del listado
- Se agrego el formulario de alta de candidatura con validacion previa y feedback de exito/error.
- Se implemento la vista de detalle `/candidates/[id]` con:
  - carga completa del candidato por ID
  - actualizacion de estado con `PATCH /records/:id`
  - actualizacion de etapa con `PATCH /records/:id`
  - formulario de edicion con `PUT /records/:id`
  - listado de notas internas
  - alta de nota con `POST /records/:id/notes`
  - eliminacion de nota con `DELETE /records/:id/notes/:note_id`
- Se reorganizo el codigo en `components`, `lib`, `types` y `Services`.
- Se amplio el cliente API en `Services/talentTrackerApi.ts` con operaciones CRUD y tipos TypeScript.

## Como correrlo
1. ``
2. `npm install` (solo se corre la primera vez o si hubo algun dano)
3. `npm run dev`
4. Abrir `http://localhost:3000`

## Como probar que funciona
- Verificar que `/` carga la tabla de candidaturas y muestra estados legibles.
- Probar filtro de estado: cambia `status` y confirma actualizacion sin recarga completa.
- Probar filtro de etapa: cambia `stage` y confirma actualizacion sin recarga completa.
- Probar busqueda: cambia `search` y confirma filtrado por nombre o email.
- Registrar una candidatura desde el formulario lateral y confirmar refresco del listado.
- Entrar en el detalle de una candidatura desde el boton de accion de la tabla.
- Cambiar estado y etapa desde el detalle y verificar feedback inmediato.
- Editar datos del candidato desde el formulario de detalle y validar persistencia.
- Crear una nota interna y luego eliminarla.
- Ejecutar `npm run build` y `npm run lint` para validar compilacion y analisis estatico.

## Evidencia de estado actual
- La app compila correctamente con `npm run build`.
- El proyecto pasa `npm run lint` sin errores.
- Next.js se configuro con `experimental.externalDir` para permitir el uso del cliente compartido en `Services/` dentro del monorepo.

## Archivos principales del hito
- `uis/talent-pipeline-tracker/app/page.tsx`
- `uis/talent-pipeline-tracker/app/CandidatesPageClient.tsx`
- `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx`
- `uis/talent-pipeline-tracker/components/CandidateForm.tsx`
- `uis/talent-pipeline-tracker/components/CandidateTable.tsx`
- `uis/talent-pipeline-tracker/components/CandidateDetailClient.tsx`
- `uis/talent-pipeline-tracker/types/talentTracker.ts`
- `uis/talent-pipeline-tracker/lib/formatters.ts`
- `Services/talentTrackerApi.ts`
- `uis/talent-pipeline-tracker/next.config.ts`
