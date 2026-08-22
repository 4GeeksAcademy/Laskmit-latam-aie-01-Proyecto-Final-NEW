# SPECS - Hito 04 (Ingenieria impulsada por IA)

## Alcance funcional

### 1) Infraestructura de agentes
- Debe existir `memory-bank/` con:
  - `projectbrief.md`
  - `techContext.md`
  - `progress.md`
- Debe existir `AGENTS.md` con:
  - lectura obligatoria inicial de contexto,
  - flujo pre-commit de al menos 4 pasos,
  - rutas protegidas.
- Debe existir `.agents/rules/` con al menos una regla y alcance explicito.
- Debe existir `.agents/skills/` con al menos una skill de objetivo unico, inputs claros y criterios verificables.

### 2) Estructura de aplicaciones
- `uis/website` para web publica en Next.js + TypeScript.
- `uis/backoffice` para aplicacion interna con layout propio.
- Integracion de logica Hito 2 en backoffice mediante importacion desde origen (sin copia).

### 3) Servicios
- Cualquier API nueva debe residir en `services/`.

## Criterios de aceptacion
- [x] Banco de memoria con contexto de negocio y tecnico.
- [x] `AGENTS.md` con flujo ordenado pre-commit.
- [x] Regla de desarrollo con alcance explicito en `.agents/rules/`.
- [x] Skill con objetivo unico, inputs y criterios verificables.
- [x] `uis/website` compila y valida sin errores (`npm run lint`, `npm run build`).
- [x] Ruta `/` de `uis/website` renderiza web corporativa por secciones con componentes TypeScript reutilizables.
- [x] `uis/backoffice` existe, tiene layout propio y compila sin errores (`npm run lint`, `npm run build`).
- [x] Integracion visible de logica Hito 2 en `uis/backoffice` por importacion desde `src/utils/transformations.ts`.
- [x] No se copio logica de negocio; se reutilizo via import directo.

## Restricciones
- No modificar rutas protegidas sin confirmacion.
- No duplicar logica de negocio existente.
- Actualizar `memory-bank/progress.md` en cada entrega relevante.

## Evidencia minima requerida
- Salida de comandos de validacion (`dev`, `lint`, `test`, `build`) segun scope.
- Verificacion visible de UI para website/backoffice.
- Diff o referencias de importacion real de logica de negocio sin copiado.
