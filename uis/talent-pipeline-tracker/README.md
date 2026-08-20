# Nexova Talent Pipeline Tracker

**Proyecto:** Hito 03 — Talent Pipeline Tracker  
**Empresa:** Nexova  
**Ubicación en el monorepo:** `uis/talent-pipeline-tracker/`

Aplicación interna de Nexova para el equipo de People & Talent. Permite listar candidaturas, filtrarlas por estado y etapa, registrar nuevas personas candidatas, revisar el detalle individual, actualizar el pipeline y gestionar notas internas.

---

## Cómo ejecutar

```bash
cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/uis/talent-pipeline-tracker

# Instalar dependencias (solo la primera vez)
npm install

# Servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Cómo probar

1. Verificar que `/` carga la tabla de candidaturas con estados y etapas legibles.
2. Probar filtros por `status` y `stage` mediante los controles de la UI.
3. Probar búsqueda por nombre o email.
4. Registrar una candidatura desde el formulario lateral y confirmar que el listado se actualiza.
5. Entrar al detalle de un candidato y cambiar su estado/etapa.
6. Editar datos del candidato desde el formulario de detalle.
7. Crear, listar y eliminar notas internas desde el detalle.
8. Ejecutar `npm run build` y `npm run lint` para validar compilación.

---

## Funcionalidad implementada

- Listado de candidaturas con filtros por query string y búsqueda por nombre o email.
- Formulario de alta de candidatura con validación local.
- Ruta de detalle por candidato en `/candidates/[id]`.
- Actualización de estado y etapa con `PATCH`.
- Edición completa con `PUT`.
- Listado, alta y borrado de notas internas.
- Estados de carga y error visibles en las operaciones asíncronas.

---

## Estructura principal

```
uis/talent-pipeline-tracker/
├── app/                     # Rutas App Router (Next.js)
├── components/              # Componentes de UI reutilizables
│   ├── CandidateTable.tsx
│   ├── CandidateForm.tsx
│   ├── CandidateDetailClient.tsx
│   └── CandidatesPageClient.tsx
├── lib/
│   └── formatters.ts        # Utilidades de formato
├── types/
│   └── talentTracker.ts     # Tipos específicos de la UI
├── next.config.ts
├── package.json
└── README.md
```

**Cliente compartido de API:**  
`Services/talentTrackerApi.ts` (ubicado en la raíz del monorepo, pendiente de migrar a `services/api/clients/` en una fase posterior).

---

## Notas técnicas

- **Framework:** Next.js 16 con App Router y TypeScript.
- **`next.config.ts`** habilita `experimental.externalDir` para importar el cliente HTTP compartido desde `Services/` (ruta relativa `../../../Services/` desde cualquier archivo dentro de `uis/talent-pipeline-tracker/`).
- La API base se toma de `NEXT_PUBLIC_API_URL` si existe; en caso contrario usa la URL pública del playground de 4Geeks.

---

## Validación

```bash
npm run build
npm run lint
```
