# README — Hito 05 (Backend Inventario)

## Estado del hito
No implementado en este repositorio como servicio de inventario funcional. Existe contexto/documentacion, pero no se encuentran routers/modelos/schemas de inventario en `services/`.

## Que se hizo en el proyecto (relacionado al hito)
- Se incluyo el documento de contexto `CONTEXT-Hito-5-Inventario-Backend-nexova.es.md`.
- Se definio propuesta de arquitectura en `docs/ARCHITECTURE_PROPOSAL.md` con dominio de inventario a nivel conceptual.

## Que falta para considerarlo implementado
Segun el contexto del hito 5 deberian existir, al menos:
- Modelos `Asset`, `AssetEntry`, `AssetExit`.
- Router bajo prefijo `/inventory`.
- Endpoints:
  - `GET /inventory/products`
  - `POST /inventory/products`
  - `GET /inventory/products/{id}`
  - `POST /inventory/orders/inbound`
  - `POST /inventory/orders/outbound`
  - `GET /inventory/orders`

## Como verificar el estado actual
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `find services -maxdepth 3 -type f | sort`
3. Confirmar que no existen archivos como `services/api/models.py`, `services/api/schemas.py`, `services/api/routers/inventory.py`.

## Como correr para probar (situacion actual)
- No hay backend de inventario para levantar/probar en este estado.
- Lo ejecutable en `services/` actualmente corresponde al analizador de incidencias (sin-hito), no al hito 5.

## Archivos relacionados al hito
- `CONTEXT-Hito-5-Inventario-Backend-nexova.es.md`
- `docs/ARCHITECTURE_PROPOSAL.md`
