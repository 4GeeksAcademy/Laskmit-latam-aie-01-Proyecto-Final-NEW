# Reordenamiento, nuevas consignas 

## Modificaciones manuales realizadas por el desarrollador humano en archivos.

Estos cambios están en el commit: "reordenamiento nuevas consignas".  

### Archivo: /CONTEXT.md

- Se agregó archivo /CONTEXT.md

### Archivo: /AGENTS.md

- Se modificó la sección '## Lectura obligatoria al inicio de cada sesion'
- Se modificó la seccción '## Flujo obligatorio antes de cada commit'
- Se modificó la sección '## Rutas protegidas'


### Archivo: /README.md

- Se elimina la sección '## Proyectos del monorepo'
- Se elimina la sección '## Estructura del repositorio'
- Se elimina la sección '## Cómo empezar'
- Se elimina la sección '## Hitos realizados'

### Archivo: /README.es.md

Eliminado porque es una copia de README.md

### Archivo: /memory-bank/projectbrief.md

Se modificó el primer objetivo para que sea mas explícito.

### Archivo: /memory-bank/techContext.md

- En 'Stack principal' se modificó el Frontend, dejando explícito el **Frontend Público** y el **Frontend interno** para mantener coherencia con el objetivo del projectbrief.md
- En 'Decisiones de arquitectura' se eliminó el siguiente párrafo: **7. El UI de incidencias (`uis/incidents-analyzer/`) detecta automaticamente la URL de la API en Codespaces.** para mantener coherencia con el objetivo del projectbrief.md
- En 'Decisiones de arquitectura' se eliminó la sección **## Riesgos actuales** para mantener coherencia con el objetivo del projectbrief.md

## Tarea

Corregir la aplicación de manera que: 
- `uis/talent-pipeline-tracker` esté en `uis/backoffice/app/talent-pipeline-tracker`
- `uis/incidents-analyzer/` esté en `uis/backoffice/app/incidents-analyzer`
- Agrega en `uis/backoffice/app/layout.tsx` las rutas:
  - `talent-pipeline-tracker`
  - `incidents-analyzer`
- Corrige el /README.md de acuerdo a los cambios



