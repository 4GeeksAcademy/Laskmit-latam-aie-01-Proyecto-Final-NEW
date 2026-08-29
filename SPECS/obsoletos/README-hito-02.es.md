# README — Hito 02 (Fundamentos de Programacion)

## Estado del hito
Implementado en TypeScript con modelos, utilidades y demo de prueba.

## Que se hizo en el proyecto
- Definicion de tipos de negocio en `src/types/models.ts`:
  - `Candidate`, `Vacancy`, `SelectionProcess` y enums asociados.
- Implementacion de utilidades en `src/utils/`:
  - filtros y ordenamientos (`collections.ts`)
  - busquedas lineal/binaria (`search.ts`)
  - scoring, ranking y agregaciones (`transformations.ts`)
  - validaciones de entidades (`validations.ts`)
- Script de demostracion integral en `src/demo.ts` con datos de ejemplo y ejecucion de funciones.

## Como correrlo
### Prueba de compilacion
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `npx tsc src/demo.ts --moduleResolution bundler --module esnext --target es2020 --outDir /tmp/hito2-build`

### Prueba funcional (recomendada)
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `npx --yes tsx src/demo.ts`

## Como probar que funciona
- Debes ver salida en consola con:
  - validacion de candidatos y vacante
  - resultados de filtros por skills/seniority/disponibilidad
  - ordenamientos por salario y experiencia
  - busquedas por ID/email/salario binario
  - score y ranking de candidatos
  - agregaciones (status, salario promedio, top skills, fill rate)

## Observaciones tecnicas
- La compilacion TypeScript es correcta con `moduleResolution bundler`.
- Si se intenta ejecutar el JS compilado directamente con Node ESM, puede requerir ajuste de resolucion de imports por extensiones.

## Archivos principales del hito
- `src/types/models.ts`
- `src/utils/collections.ts`
- `src/utils/search.ts`
- `src/utils/transformations.ts`
- `src/utils/validations.ts`
- `src/demo.ts`
