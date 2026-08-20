# SPECS — Hito 03 (Talent Pipeline Tracker)

## Estructura de carpetas/archivos
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/talent-pipeline-tracker/
├── app/
│   ├── CandidatesPageClient.tsx
│   ├── candidates/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── CandidateDetailClient.tsx
│   ├── CandidateForm.tsx
│   └── CandidateTable.tsx
├── lib/
│   └── formatters.ts
├── types/
│   └── talentTracker.ts
├── next.config.ts
├── package.json
└── CONTEXT-Hito-3-nexova.es.md

/workspaces/Laskmit-latam-aie-01-Proyecto-Final/Services/
└── talentTrackerApi.ts
```

## Paginas/componentes
- `app/page.tsx`
  - Renderiza `CandidatesPageClient` dentro de `Suspense`.
- `app/CandidatesPageClient.tsx`
  - Gestiona filtros por URL (`status`, `stage`, `search`).
  - Consume API para listar registros.
  - Renderiza resumen, filtros, tabla y formulario de alta.
- `app/candidates/[id]/page.tsx`
  - Renderiza la vista de detalle dinamica del candidato.
- `components/CandidateTable.tsx`
  - Renderiza el listado con nombre, puesto, estado, etapa, notas y accion de detalle.
- `components/CandidateForm.tsx`
  - Reutiliza validacion y campos para alta y edicion de candidaturas.
- `components/CandidateDetailClient.tsx`
  - Carga el detalle del candidato.
  - Permite actualizar `status` y `stage`.
  - Permite editar la candidatura completa.
  - Lista, crea y elimina notas internas.
- `lib/formatters.ts`
  - Centraliza formateo de fechas y experiencia.
- `types/talentTracker.ts`
  - Define tipos de UI para estado asincrono, filtros, formularios y feedback.

## API consumida (cliente HTTP)
En `Services/talentTrackerApi.ts`:
- Base URL: `https://playground.4geeks.com/tracker/api/v1`
- Endpoints consumidos:
  - `GET /records?status=&stage=&search=&page=&limit=`
  - `GET /records/:id`
  - `POST /records`
  - `PUT /records/:id`
  - `PATCH /records/:id`
  - `GET /records/:id/notes`
  - `POST /records/:id/notes`
  - `DELETE /records/:id/notes/:note_id`
- Funciones exportadas:
  - `listCandidateRecords(params)`
  - `getCandidateRecord(id)`
  - `createCandidateRecord(payload)`
  - `replaceCandidateRecord(id, payload)`
  - `patchCandidateRecord(id, payload)`
  - `getCandidateNotes(id)`
  - `addCandidateNote(id, content)`
  - `deleteCandidateNote(id, noteId)`
- Tipos:
  - `CandidateRecord`
  - `CandidateNote`
  - `CandidateRecordInput`
  - `CandidateRecordPatch`
  - `CandidateStatus`
  - `CandidateStage`
- Mapeos de etiquetas:
  - `STATUS_LABELS`
  - `STAGE_LABELS`
- Manejo de errores:
  - `ApiError` con `statusCode` y detalle de validacion.

## Especificacion funcional cubierta
- Listado de candidaturas.
- Filtros por estado y etapa.
- Busqueda por nombre/email.
- Etiquetas de UI legibles para valores de API.
- Navegacion Next.js entre listado y detalle sin recarga completa.
- Alta de candidaturas con validacion local.
- Edicion completa de candidaturas existentes.
- Actualizacion de estado y etapa desde detalle.
- CRUD parcial de notas: listar, crear y eliminar.
- Estados visibles de carga, exito y error en operaciones asincronas.
- UI contextualizada para Nexova y la vacante de Asistente de Direccion.

## Validacion ejecutada
- `npm run build` en `uis/talent-pipeline-tracker`.
- `npm run lint` en `uis/talent-pipeline-tracker`.

## Criterios de reconocimiento rapido
- Existe cliente API tipado en `Services/talentTrackerApi.ts`.
- La vista principal depende de query params y recarga datos en cambios.
- Existe una ruta dinamica `app/candidates/[id]/page.tsx`.
- El detalle permite editar candidatura y gestionar notas internas.
- La app compila y pasa lint en limpio.
