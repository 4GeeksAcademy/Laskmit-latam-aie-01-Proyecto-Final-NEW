# README - Hito 04 (Ingenieria impulsada por IA)

## Objetivo del hito
Convertir el repositorio en un monorepo AI-ready con contexto persistente, reglas operativas para agentes y una skill reutilizable para controlar calidad de entrega.

## Entregables implementados
- Banco de memoria en `memory-bank/` con:
  - `projectbrief.md`
  - `techContext.md`
  - `progress.md`
- Protocolo operativo en `AGENTS.md`.
- Regla de desarrollo en `.agents/rules/monorepo-guardrails.md`.
- Skill reutilizable en `.agents/skills/pre-commit-delivery-check/SKILL.md`.
- Especificacion formal en `SPECS-hito-04.md`.

## Que cubre esta infraestructura
1. Obliga lectura de contexto de negocio y tecnico antes de tocar codigo.
2. Estandariza flujo obligatorio antes de commit.
3. Evita modificaciones riesgosas en rutas protegidas sin confirmacion.
4. Define criterio verificable para aprobar o rechazar una entrega.

## Estado de apps del hito
- `uis/website`: implementada en Next.js + TypeScript con ruta `/` basada en componentes React reutilizables.
- `uis/backoffice`: implementada en Next.js + TypeScript con layout propio e integracion visible de logica Hito 2 por importacion.

## Como correrlo
### 1) Website publico
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/website`
2. `npm install` (solo la primera vez o si hubo algun dano)
3. `npm run dev`
4. Abrir `http://localhost:3000`

### 2) Backoffice interno
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/backoffice`
2. `npm install` (solo la primera vez o si hubo algun dano)
3. `npm run dev`
4. Abrir `http://localhost:3001` si `3000` esta ocupado (Next asigna puerto automaticamente).

## Validaciones ejecutadas
- `cd uis/website && npm run lint`
- `cd uis/website && npm run build`
- `cd uis/backoffice && npm run lint`
- `cd uis/backoffice && npm run build`

Nota tecnica: en `uis/backoffice` se uso `next --webpack` para soportar importaciones externas del monorepo (`src/`).

## Revision de continuidad
- Hito 5 (Inventario backend): sigue mayormente en estado documental y debe implementarse dentro de `services/` siguiendo las reglas creadas.
- Analizador de incidencias: existe base funcional y debe mantenerse dentro de la misma gobernanza (memoria, reglas, skill pre-commit).
