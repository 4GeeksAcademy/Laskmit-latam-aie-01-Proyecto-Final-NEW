# Testing — Hito 5 (Inventario Backend + Backoffice)

## 📋 Resumen

Este documento detalla el plan de pruebas para el **Hito 5: Gestión de Inventario**. Cubre tanto el backend (FastAPI + SQLModel + Supabase) como el frontend (Next.js en el backoffice).

## 🧪 Cómo ejecutar las pruebas

### Backend (pytest)

```bash
# Desde services/api/
cd services/api

# Ejecutar SOLO los tests de inventario (requiere PYTHONPATH)
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/test_inventory.py -v -W all

# Con cobertura
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest --cov=services.api.routers.inventory --cov=services.api.schemas tests/test_inventory.py --cov-report=term-missing -W all

# Suite completa (todos los hitos)
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/ -v -W all
```

> ⚠️ **Importante:** Los tests de inventario usan **SQLite en memoria** (`sqlite://`) como reemplazo de Supabase. No requieren `DATABASE_URL` configurada en `.env`.

### Frontend (Jest)

```bash
# Desde uis/backoffice/
cd uis/backoffice

# Ejecutar todos los tests del frontend
npx jest --coverage

# Solo tests de inventario
npx jest --testPathPattern="inventory" --coverage
```

---

## Tabla de contenidos

1. [Backend — API de Inventario (pytest)](#1-backend--api-de-inventario-pytest)
2. [Frontend — Utilidades (Jest)](#2-frontend--utilidades-jest)
3. [Resumen de casos](#3-resumen-de-casos)
4. [Notas técnicas para la implementación de las pruebas](#4-notas-técnicas-para-la-implementación-de-las-pruebas)

---

## 1️⃣ Backend — API de Inventario (pytest)

**Archivo destino:** `services/api/tests/test_inventory.py`

### Fixtures necesarios

Los tests requieren los siguientes fixtures (definir en `conftest.py` o en el propio archivo):

| Fixture | Descripción |
|---------|-------------|
| `supabase_db` | Engine SQLModel con SQLite en memoria (`sqlite://`), tablas creadas con `SQLModel.metadata.create_all` |
| `supabase_session` | Sesión SQLModel aislada por test, con rollback automático |
| `auth_headers` | Headers `Authorization: Bearer <token>` con token de admin válido |
| `seed_assets` | 2-3 activos de prueba insertados en la sesión |

### Casos de prueba

---

#### GET /inventory/products — Listar activos

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| P1 | ✅ Camino feliz | Listar con activos existentes | 200. Retorna lista con todos los activos. Cada elemento tiene `current_stock` calculado. |
| P2 | ✅ Camino feliz | `current_stock` se calcula correctamente | 200. Activo con 10 entries - 2 exits = stock 8. |
| P3 | ⚠️ Caso límite | Base de datos vacía (0 activos) | 200. Lista vacía `[]`. |
| P4 | ⚠️ Caso límite | Activo sin entries ni exits | 200. `current_stock` = 0. |
| P5 | ❌ Modo fallo | Sin autenticación (endpoint público) | 200. **El endpoint es público**, debe funcionar sin token. |

---

#### POST /inventory/products — Crear activo

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| C1 | ✅ Camino feliz | Crear activo válido | 201. `AssetResponse` con `current_stock = 0`. |
| C2 | ✅ Camino feliz | Activo con categoría "hardware" en oficina "Valencia" | 201. Datos correctos. |
| C3 | ✅ Camino feliz | Activo con categoría "peripherals" en oficina "Miami" | 201. Datos correctos. |
| C4 | ⚠️ Caso límite | Nombre con 1 carácter | 201. `min_length=1` acepta 1 carácter. |
| C5 | ❌ Modo fallo | SKU duplicado | 409 "Ya existe un activo con SKU '...'". |
| C6 | ❌ Modo fallo | Categoría inválida (no está en `Literal`) | 422. Pydantic rechaza valores fuera del `Literal`. |
| C7 | ❌ Modo fallo | Oficina inválida (no es "Valencia" ni "Miami") | 422. |
| C8 | ❌ Modo fallo | `name` vacío (`""`) | 422. `min_length=1`. |
| C9 | ❌ Modo fallo | `sku` vacío (`""`) | 422. `min_length=1`. |
| C10 | ❌ Modo fallo | Sin token de autenticación | 401. Endpoint protegido. |
| C11 | ❌ Modo fallo | Token inválido/expirado | 401. |

---

#### GET /inventory/products/{asset_id} — Obtener activo por ID

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| G1 | ✅ Camino feliz | ID existente con stock calculado | 200. `AssetResponse` con `current_stock` correcto. |
| G2 | ⚠️ Caso límite | ID existente sin movimientos | 200. `current_stock = 0`. |
| G3 | ❌ Modo fallo | ID inexistente | 404 "Activo no encontrado." |
| G4 | ❌ Modo fallo | ID negativo | 404 (no existe). |
| G5 | ⚠️ Caso límite | Sin autenticación (endpoint público) | 200. Debe funcionar sin token. |

---

#### POST /inventory/orders/inbound — Registrar orden de entrada

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| I1 | ✅ Camino feliz | Entrada válida con todos los campos | 201. `AssetEntryResponse` con `id`, `quantity`, `supplier`, `office`, `created_at`, `user_uuid`. |
| I2 | ✅ Camino feliz | Entrada en oficina "Valencia" | 201. Datos correctos. |
| I3 | ✅ Camino feliz | Entrada en oficina "Miami" | 201. Datos correctos. |
| I4 | ⚠️ Caso límite | `quantity = 1` (mínimo positivo) | 201. `Field(gt=0)` acepta 1. |
| I5 | ⚠️ Caso límite | `supplier` con 1 carácter | 201. `min_length=1` acepta 1 carácter. |
| I6 | ❌ Modo fallo | `asset_id` inexistente | 404 "Activo con id X no encontrado." |
| I7 | ❌ Modo fallo | `quantity = 0` | 422. `Field(gt=0)` rechaza 0. |
| I8 | ❌ Modo fallo | `quantity` negativo | 422. |
| I9 | ❌ Modo fallo | `supplier` vacío (`""`) | 422. `min_length=1`. |
| I10 | ❌ Modo fallo | Oficina inválida (no es "Valencia" ni "Miami") | 422. |
| I11 | ❌ Modo fallo | Sin token de autenticación | 401. |
| I12 | ❌ Modo fallo | Token inválido/expirado | 401. |
| I13 | ⚠️ Caso límite | Múltiples entradas para el mismo activo | 201 cada una. Stock se acumula: 10 + 5 = 15. |

---

#### POST /inventory/orders/outbound — Registrar orden de salida

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| O1 | ✅ Camino feliz | Salida tipo "allocation" con `assigned_to` válido | 201. `AssetExitResponse` con todos los campos. |
| O2 | ✅ Camino feliz | Salida tipo "consumption" sin `assigned_to` | 201. `assigned_to = null`. |
| O3 | ✅ Camino feliz | Salida en oficina "Valencia" | 201. |
| O4 | ✅ Camino feliz | Salida en oficina "Miami" | 201. |
| O5 | ⚠️ Caso límite | `quantity = 1` (mínimo positivo) | 201. |
| O6 | ❌ Modo fallo | `asset_id` inexistente | 404. |
| O7 | ❌ Modo fallo | `quantity = 0` | 422. |
| O8 | ❌ Modo fallo | `quantity` negativo | 422. |
| O9 | ❌ Modo fallo | Oficina inválida | 422. |
| O10 | ❌ Modo fallo | Sin token | 401. |
| O11 | ❌ Modo fallo | Token inválido | 401. |

**Reglas de validación de negocio (`exit_type`):**

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| O12 | ❌ Modo fallo | `exit_type = "allocation"` sin `assigned_to` | 422. **Regla de negocio:** asignación requiere destinatario. |
| O13 | ❌ Modo fallo | `exit_type = "consumption"` con `assigned_to` presente | 422. **Regla de negocio:** consumo no admite destinatario. |
| O14 | ❌ Modo fallo | `exit_type` inválido (no es "allocation" ni "consumption") | 422. |
| O15 | ⚠️ Caso límite | `assigned_to` con 1 carácter en allocation | 201. No hay `min_length` en `assigned_to`. |

**Validación de stock:**

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| O16 | ❌ Modo fallo | Cantidad **supera el stock disponible** | 400 "Insufficient stock for asset '...'. Available: X, requested: Y." |
| O17 | ✅ Camino feliz | Cantidad **exactamente igual** al stock disponible | 201. Stock se agota (queda 0). |
| O18 | ⚠️ Caso límite | Salida exitosa → stock se reduce correctamente | Verificar que GET /inventory/products/{id} refleja el nuevo stock tras la salida. |
| O19 | ❌ Modo fallo | Stock insuficiente **en una oficina específica** mientras hay stock en otra | 400. El cálculo de stock es por oficina. |

---

#### GET /inventory/orders — Listar historial de órdenes

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| H1 | ✅ Camino feliz | Órdenes mezcladas (entradas + salidas) | 200. Lista combina ambos tipos. Cada elemento tiene `order_type: "inbound" | "outbound"`. |
| H2 | ✅ Camino feliz | Orden descendente por `created_at` | 200. La más reciente primero. |
| H3 | ✅ Camino feliz | Cada orden incluye `asset_name` y `asset_sku` | 200. Datos del activo relacionados presentes. |
| H4 | ✅ Camino feliz | Cada orden incluye `user_uuid` | 200. |
| H5 | ⚠️ Caso límite | Solo entradas, sin salidas | 200. Lista solo con `order_type: "inbound"`. |
| H6 | ⚠️ Caso límite | Solo salidas, sin entradas | 200. Lista solo con `order_type: "outbound"`. |
| H7 | ⚠️ Caso límite | Base de datos vacía | 200. Lista vacía `[]`. |
| H8 | ❌ Modo fallo | Sin autenticación (endpoint público) | 200. Debe funcionar sin token. |

---

#### Función interna: `_compute_stock()`

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S1 | ✅ Camino feliz | Solo entradas, sin salidas | Stock = SUM(entries). |
| S2 | ✅ Camino feliz | Entradas y salidas combinadas | Stock = SUM(entries) - SUM(exits). |
| S3 | ⚠️ Caso límite | Sin entries ni exits | Stock = 0. |
| S4 | ⚠️ Caso límite | Mismas entradas que salidas | Stock = 0. |
| S5 | ⚠️ Caso límite | Más salidas que entradas (stock negativo) | Stock podría ser negativo (la validación está en el endpoint outbound). |
| S6 | ✅ Camino feliz | Cálculo por oficina específica | Stock separado para Valencia vs Miami. |

---

## 2️⃣ Frontend — Utilidades (Jest)

### 2.1 Módulo `lib/inventory.ts`

**Archivo destino:** `uis/backoffice/__tests__/inventory-api.test.ts`

**Mock necesario:** Mockear `api-client.ts` para simular respuestas HTTP sin depender del backend.

| # | Función | Tipo | Caso | Qué verifica |
|---|---------|------|------|-------------|
| F1 | `getProducts()` | ✅ Camino feliz | API responde con lista de productos | Retorna array tipado `InventoryProduct[]`. |
| F2 | `getProducts()` | ❌ Modo fallo | API responde 500 | Lanza `ApiError` con mensaje. |
| F3 | `getProduct(id)` | ✅ Camino feliz | API responde con producto | Retorna `InventoryProduct`. |
| F4 | `getProduct(id)` | ❌ Modo fallo | API responde 404 | Lanza `ApiError`. |
| F5 | `createProduct(data)` | ✅ Camino feliz | API responde 201 | Retorna `InventoryProduct` con `current_stock = 0`. |
| F6 | `createProduct(data)` | ❌ Modo fallo | SKU duplicado (409) | Lanza `ApiError`. |
| F7 | `createProduct(data)` | ❌ Modo fallo | Sin token (401) | Lanza `ApiError`. |
| F8 | `createInboundOrder(data)` | ✅ Camino feliz | API responde 201 | Retorna `InboundOrderResponse`. |
| F9 | `createInboundOrder(data)` | ❌ Modo fallo | `asset_id` inexistente (404) | Lanza `ApiError`. |
| F10 | `createInboundOrder(data)` | ❌ Modo fallo | Campos inválidos (422) | Lanza `ApiError`. |
| F11 | `createOutboundOrder(data)` | ✅ Camino feliz | API responde 201 | Retorna `OutboundOrderResponse`. |
| F12 | `createOutboundOrder(data)` | ❌ Modo fallo | Stock insuficiente (400) | Lanza `ApiError`. |
| F13 | `createOutboundOrder(data)` | ❌ Modo fallo | `asset_id` inexistente (404) | Lanza `ApiError`. |
| F14 | `getOrders()` | ✅ Camino feliz | API responde con historial | Retorna `OrderItem[]`. |
| F15 | `getOrders()` | ⚠️ Caso límite | Array vacío | Retorna `[]`. |

### 2.2 Componente ProductsPageClient — `stockLevelClass()`

**Archivo destino:** `uis/backoffice/__tests__/inventory-components.test.ts`

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| V1 | ✅ Camino feliz | `stock = 0` | Clase contiene `stockEmpty`. |
| V2 | ✅ Camino feliz | `stock = 1` | Clase contiene `stockLow` (umbral bajo). |
| V3 | ✅ Camino feliz | `stock = 5` | Clase contiene `stockLow` (límite superior del umbral bajo). |
| V4 | ✅ Camino feliz | `stock = 6` | Clase contiene `stockHealthy`. |
| V5 | ✅ Camino feliz | `stock = 100` | Clase contiene `stockHealthy`. |

### 2.3 Componente OutboundOrderClient — Validación visual

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| W1 | ✅ Camino feliz | Cantidad ≤ stock disponible | `exceedsStock` es `false`. |
| W2 | ⚠️ Caso límite | Cantidad > stock disponible | `exceedsStock` es `true`. |
| W3 | ⚠️ Caso límite | Stock `null` (cargando) | `exceedsStock` es `false`. |
| W4 | ⚠️ Caso límite | Cantidad = 0 (no emitida aún) | `exceedsStock` es `false`. |

### 2.4 Componente OrdersHistoryClient — Funciones de formato

| # | Función | Tipo | Caso | Qué verifica |
|---|---------|------|------|-------------|
| D1 | `formatDate()` | ✅ Camino feliz | Fecha ISO válida | Retorna string con formato localizado `es-ES`. |
| D2 | `formatDate()` | ❌ Modo fallo | Fecha ISO inválida | Retorna el mismo string sin formato (try/catch). |
| D3 | `orderTypeLabel()` | ✅ Camino feliz | `order_type = "inbound"` | Retorna `"Entrada"`. |
| D4 | `orderTypeLabel()` | ✅ Camino feliz | `order_type = "outbound"` | Retorna `"Salida"`. |
| D5 | `detailText()` | ✅ Camino feliz | Inbound con supplier | `"Proveedor: TechDistrib"`. |
| D6 | `detailText()` | ✅ Camino feliz | Inbound sin supplier | `"Proveedor: —"`. |
| D7 | `detailText()` | ✅ Camino feliz | Outbound allocation con assigned_to | `"Asignación — Asignado a: Ana Martínez"`. |
| D8 | `detailText()` | ✅ Camino feliz | Outbound consumption | `"Consumo"`. |

---

## 3️⃣ Resumen de casos

### Backend (pytest)

| Endpoint / Función | Happy | Edge | Failure | Total |
|--------------------|-------|------|---------|-------|
| GET /inventory/products | 2 | 2 | 1 | 5 |
| POST /inventory/products | 3 | 1 | 7 | 11 |
| GET /inventory/products/{id} | 1 | 1 | 3 | 5 |
| POST /inventory/orders/inbound | 3 | 2 | 8 | 13 |
| POST /inventory/orders/outbound | 4 | 1 | 14 | 19 |
| GET /inventory/orders | 4 | 3 | 1 | 8 |
| `_compute_stock()` (tests unitarios) | 2 | 4 | 0 | 6 |
| **Total backend** | **19** | **14** | **34** | **67** |

### Frontend (Jest)

| Módulo / Componente | Happy | Edge | Failure | Total |
|--------------------|-------|------|---------|-------|
| `lib/inventory.ts` | 5 | 1 | 9 | 15 |
| `stockLevelClass()` | 4 | 1 | 0 | 5 |
| `exceedsStock` (outbound) | 1 | 3 | 0 | 4 |
| `formatDate`, `orderTypeLabel`, `detailText` | 6 | 1 | 1 | 8 |
| **Total frontend** | **16** | **6** | **10** | **32** |

### Totales generales

| Área | Happy | Edge | Failure | Total |
|------|-------|------|---------|-------|
| Backend (pytest) | 19 | 14 | 34 | **67** |
| Frontend (Jest) | 16 | 6 | 10 | **32** |
| **Total Hito 5** | **35** | **20** | **44** | **99** |

---

## 4️⃣ Notas técnicas para la implementación de las pruebas

### Backend — Estrategia de base de datos

Los tests de inventario **no deben** conectarse a Supabase real. Usa **SQLite en memoria** como reemplazo:

```python
@pytest.fixture
def supabase_db():
    """Engine SQLModel con SQLite en memoria."""
    engine = create_engine("sqlite://", echo=False)
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def supabase_session(supabase_db):
    """Sesión SQLModel aislada por test."""
    with Session(supabase_db) as session:
        yield session
```

### Backend — Override de dependencia

Reemplaza `get_supabase_db` en el router de inventario para usar la sesión en memoria:

```python
@pytest.fixture(autouse=True)
def override_get_supabase_db(supabase_session):
    """Reemplaza la dependencia get_supabase_db con la sesión en memoria."""
    from services.api.routers import inventory as inventory_router

    original = inventory_router.get_supabase_db
    inventory_router.get_supabase_db = lambda: supabase_session
    yield
    inventory_router.get_supabase_db = original
```

### Backend — Helper para crear datos de prueba

```python
def create_test_asset(session, name="Portátil Test", sku="TST-001",
                      category="hardware", office="Valencia"):
    """Crea un activo de prueba y devuelve su ID."""
    asset = Asset(name=name, sku=sku, category=category, office=office)
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset.id


def create_test_entry(session, asset_id, quantity=10, supplier="Test Supplier",
                      office="Valencia", user_uuid="test-user"):
    """Crea una entrada de prueba."""
    entry = AssetEntry(asset_id=asset_id, quantity=quantity,
                       supplier=supplier, office=office, user_uuid=user_uuid)
    session.add(entry)
    session.commit()
    return entry
```

### Frontend — Mock de `apiRequest`

```typescript
// Mock del módulo api-client
jest.mock("../../lib/api-client", () => ({
  apiRequest: jest.fn(),
  getErrorMessage: jest.fn((err) => err.message || "Error desconocido"),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public details: any[] = [],
      public field: string | null = null,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));
```

### Frontend — Datos de prueba (fixtures)

```typescript
const mockProducts: InventoryProduct[] = [
  { id: 1, name: 'Portátil 14" Business', sku: "NXV-IT-001",
    category: "hardware", office: "Valencia", current_stock: 8 },
  { id: 2, name: "Ratón ergonómico", sku: "NXV-PER-001",
    category: "peripherals", office: "Valencia", current_stock: 0 },
  { id: 3, name: "Hub USB-C", sku: "NXV-PER-002",
    category: "peripherals", office: "Miami", current_stock: 15 },
];

const mockOrders: OrderItem[] = [
  { id: 1, order_type: "inbound", asset_id: 1, asset_name: 'Portátil 14" Business',
    asset_sku: "NXV-IT-001", quantity: 10, office: "Valencia",
    created_at: "2025-01-15T10:00:00Z", user_uuid: "u1", supplier: "TechDistrib" },
  { id: 2, order_type: "outbound", asset_id: 1, asset_name: 'Portátil 14" Business',
    asset_sku: "NXV-IT-001", quantity: 2, office: "Valencia",
    created_at: "2025-01-16T14:00:00Z", user_uuid: "u2",
    exit_type: "allocation", assigned_to: "Ana Martínez" },
];
```