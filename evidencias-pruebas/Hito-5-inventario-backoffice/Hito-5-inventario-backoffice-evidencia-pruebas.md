# Hito 5 — Inventario Backoffice: Evidencia de Pruebas

> **Fecha de ejecución:** 2026-09-10
> **Entorno:** Backoffice (Next.js + Jest)
> **Total de pruebas:** 32 pruebas de frontend — **32 pasaron, 0 fallaron**
> **Cobertura del módulo `lib/inventory.ts`:** 100% (statements, branches, functions, lines)
> **Suite completa:** 75 pruebas — **75 pasaron, 0 fallaron**

---

## Resumen de casos ejecutados

### Módulo `lib/inventory.ts` — API integration (15 pruebas)

| # | Estado | Tipo | Caso | Verificación |
|---|--------|------|------|-------------|
| F1 | ✅ | Camino feliz | `getProducts()` responde con lista | Retorna `InventoryPro
duct[]` |
| F2 | ✅ | Modo fallo | `getProducts()` responde 500 | Lanza `ApiError` con status 500 |
| F3 | ✅ | Camino feliz | `getProduct(id)` responde con producto | Retorna `InventoryProduct` |
| F4 | ✅ | Modo fallo | `getProduct(id)` responde 404 | Lanza `ApiError` con status 404 |
| F5 | ✅ | Camino feliz | `createProduct(data)` responde 201 | Retorna `InventoryProduct` con `current_stock = 0` |
| F6 | ✅ | Modo fallo | `createProduct(data)` SKU duplicado 409 | Lanza `ApiError` con status 409 |
| F7 | ✅ | Modo fallo | `createProduct(data)` sin token 401 | Lanza `ApiError` con status 401 |
| F8 | ✅ | Camino feliz | `createInboundOrder(data)` responde 201 | Retorna `InboundOrderResponse` |
| F9 | ✅ | Modo fallo | `createInboundOrder(data)` asset_id inexistente 404 | Lanza `ApiError` con status 404 |
| F10 | ✅ | Modo fallo | `createInboundOrder(data)` campos inválidos 422 | Lanza `ApiError` con status 422 |
| F11 | ✅ | Camino feliz | `createOutboundOrder(data)` responde 201 | Retorna `OutboundOrderResponse` |
| F12 | ✅ | Modo fallo | `createOutboundOrder(data)` stock insuficiente 400 | Lanza `ApiError` con status 400 |
| F13 | ✅ | Modo fallo | `createOutboundOrder(data)` asset_id inexistente 404 | Lanza `ApiError` con status 404 |
| F14 | ✅ | Camino feliz | `getOrders()` responde con historial | Retorna `OrderItem[]` |
| F15 | ✅ | Caso límite | `getOrders()` array vacío | Retorna `[]` |

### `stockLevelClass()` — ProductsPageClient (5 pruebas)

| # | Estado | Tipo | Caso | Verificación |
|---|--------|------|------|-------------|
| V1 | ✅ | Camino feliz | `stock = 0` | Clase contiene `stockEmpty` |
| V2 | ✅ | Camino feliz | `stock = 1` | Clase contiene `stockLow` |
| V3 | ✅ | Camino feliz | `stock = 5` | Clase contiene `stockLow` (límite superior) |
| V4 | ✅ | Camino feliz | `stock = 6` | Clase contiene `stockHealthy` |
| V5 | ✅ | Camino feliz | `stock = 100` | Clase contiene `stockHealthy` |

### `exceedsStock` — OutboundOrderClient (4 pruebas)

| # | Estado | Tipo | Caso | Verificación |
|---|--------|------|------|-------------|
| W1 | ✅ | Camino feliz | Cantidad ≤ stock disponible | `exceedsStock` es `false` |
| W2 | ✅ | Caso límite | Cantidad > stock disponible | `exceedsStock` es `true` |
| W3 | ✅ | Caso límite | Stock `null` (cargando) | `exceedsStock` es `false` |
| W4 | ✅ | Caso límite | Cantidad = 0 (no emitida aún) | `exceedsStock` es `false` |

### `formatDate()`, `orderTypeLabel()`, `detailText()` — OrdersHistoryClient (8 pruebas)

| # | Estado | Tipo | Caso | Verificación |
|---|--------|------|------|-------------|
| D1 | ✅ | Camino feliz | `formatDate()` fecha ISO válida | Retorna string con formato localizado `es-ES` |
| D2 | ✅ | Modo fallo | `formatDate()` fecha ISO inválida | Retorna "Invalid Date" (no lanza excepción) |
| D3 | ✅ | Camino feliz | `orderTypeLabel()` `order_type = "inbound"` | Retorna `"Entrada"` |
| D4 | ✅ | Camino feliz | `orderTypeLabel()` `order_type = "outbound"` | Retorna `"Salida"` |
| D5 | ✅ | Camino feliz | `detailText()` inbound con supplier | `"Proveedor: TechDistrib"` |
| D6 | ✅ | Camino feliz | `detailText()` inbound sin supplier | `"Proveedor: —"` |
| D7 | ✅ | Camino feliz | `detailText()` outbound allocation con assigned_to | `"Asignación — Asignado a: Ana Martínez"` |
| D8 | ✅ | Camino feliz | `detailText()` outbound consumption | `"Consumo"` |

---

## Estadísticas de cobertura

```
---------------|---------|----------|---------|---------|-------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------|---------|----------|---------|---------|-------------------
All files      |   21.42 |        0 |   35.29 |   21.42 |
 api-client.ts |    5.33 |        0 |       0 |    5.33 |
 auth.ts       |      40 |        0 |       0 |      40 |
 inventory.ts  |     100 |      100 |     100 |     100 |
---------------|---------|----------|---------|---------|-------------------
```

> El módulo `lib/inventory.ts` — el núcleo de las pruebas — alcanza **100% de cobertura** en statements, branches, functions y lines.

---

## Comando de ejecución

```bash
cd uis/backoffice
npx jest --testPathPatterns="inventory" --verbose
```

**Resultado:**
```
Test Suites: 2 passed, 2 total
Tests:       32 passed, 32 total
```

**Suite completa:**
```bash
npx jest --coverage
```

**Resultado:**
```
Test Suites: 6 passed, 6 total
Tests:       75 passed, 75 total
```

---

## Archivos de prueba

| Archivo | Pruebas | Propósito |
|---------|---------|-----------|
| `__tests__/inventory-api.test.ts` | 15 (F1–F15) | Mock de `apiRequest` para simular respuestas HTTP |
| `__tests__/inventory-components.test.ts` | 17 (V1–V5, W1–W4, D1–D8) | Tests de funciones visuales y utilidades inline |

---

*Fin del reporte de evidencias — Hito 5 Inventario Backoffice*
