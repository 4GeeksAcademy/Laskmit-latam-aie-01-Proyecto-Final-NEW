# AGENTS.md

## Lectura obligatoria al inicio de cada sesion
- `memory-bank/projectbrief.md`
- `memory-bank/techContext.md`
- `memory-bank/progress.md`
- `.agents/rules/*.md`

## Flujo obligatorio antes de cada commit
1. Revisar contexto de negocio y `memory-bank/`.
2. Confirmar alcance de cambios y verificar que no se modifican rutas protegidas sin autorizacion explicita.
3. Ejecutar validaciones del scope afectado (por ejemplo `npm run lint`, `npm run test`, `npm run build` o equivalentes).
4. Verificar criterios de aceptacion del hito contra resultados observables en UI/API.
5. Actualizar `memory-bank/progress.md` con estado real, riesgos y siguientes pasos.
6. Generar resumen de entrega con cambios, evidencia de validacion y pendientes.

## Rutas protegidas
No modificar sin confirmacion explicita del desarrollador:
- `memory-bank/`
- `.agents/`
- `docs/`
- `README.md`

## Reglas de integracion
- La logica de negocio existente se reutiliza por importacion desde su origen.
- No copiar/duplicar modulos de negocio para acelerar entregas.
- Cualquier API nueva debe vivir dentro de `services/`.
