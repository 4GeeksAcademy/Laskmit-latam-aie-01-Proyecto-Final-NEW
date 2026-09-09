# Hito 5 — Inventario Backend: Evidencia de Pruebas

**Fecha:** 2026-09-09
**Proyecto:** Nexova — Nexova Operations API v1.3.0
**Base de datos:** Supabase (PostgreSQL vía SQLModel) + TinyDB (auth existente)
**Servidor:** `http://localhost:8000`
**Usuario de prueba:** `inventario@test.com`

---

## Resumen de resultados

| # | Prueba | Resultado Esperado | Resultado Obtenido | Estado |
|---|--------|--------------------|--------------------|--------|
| 1 | `GET /inventory/products` — Listar activos | `200` + 8 activos con stock calculado | 8 activos, stocks correctos | ✅ |
| 2 | `GET /inventory/products/1` — Detalle activo | `200` + stock=13 | `current_stock: 13` | ✅ |
| 3 | `GET /inventory/orders` — Listar órdenes | `200` + órdenes con datos del activo | 9 órdenes combinadas (inbound/outbound) | ✅ |
| 4 | `POST /inventory/products` — Crear activo (auth) | `201` + stock=0 | Monitor 27" 4K creado con stock=0 | ✅ |
| 5 | `POST /inventory/orders/inbound` — Entrada (auth) | `201` + user_uuid asignado | 15 uds con user_uuid="8" | ✅ |
| 6 | `POST /inventory/orders/outbound` — Salida (auth) | `201` + user_uuid asignado | 3 uds allocation con user_uuid="8" | ✅ |
| 7 | Stock insuficiente (qty=999, stock=12) | `400` + mensaje descriptivo | `"Insufficient stock for asset..."` | ✅ |
| 8 | `allocation` sin `assigned_to` | `422` + error de validación | `"assigned_to es obligatorio..."` | ✅ |
| 9 | `consumption` con `assigned_to` | `422` + error de validación | `"assigned_to debe ser nulo..."` | ✅ |
| 10 | Endpoint protegido sin token | `401` | `"Could not validate credentials"` | ✅ |

---

## Prueba 1: `GET /inventory/products` — Listar activos

```json
[
    {
        "id": 1,
        "name": "Portátil 14\" Business",
        "sku": "NXV-IT-001",
        "category": "hardware",
        "office": "Valencia",
        "current_stock": 13
    },
    {
        "id": 2,
        "name": "Portátil 14\" Business",
        "sku": "NXV-IT-002",
        "category": "hardware",
        "office": "Miami",
        "current_stock": 0
    },
    {
        "id": 3,
        "name": "Ratón ergonómico",
        "sku": "NXV-PER-001",
        "category": "peripherals",
        "office": "Valencia",
        "current_stock": 0
    },
    {
        "id": 4,
        "name": "Hub USB-C",
        "sku": "NXV-PER-002",
        "category": "peripherals",
        "office": "Miami",
        "current_stock": 15
    },
    {
        "id": 5,
        "name": "Resma de papel A4",
        "sku": "NXV-OFF-001",
        "category": "office_supplies",
        "office": "Valencia",
        "current_stock": 40
    },
    {
        "id": 6,
        "name": "Cuaderno de formación en liderazgo",
        "sku": "NXV-TRN-001",
        "category": "training_materials",
        "office": "Valencia",
        "current_stock": 0
    },
    {
        "id": 7,
        "name": "Teclado USB",
        "sku": "NXV-PER-003",
        "category": "peripherals",
        "office": "Valencia",
        "current_stock": 7
    },
    {
        "id": 8,
        "name": "Monitor 27\" 4K",
        "sku": "NXV-IT-010",
        "category": "hardware",
        "office": "Valencia",
        "current_stock": 12
    }
]
```

**Verificación de stocks:**

| SKU | Activo | Entradas | Salidas | Stock Neto | Estado |
|-----|--------|:--------:|:-------:|:----------:|:------:|
| NXV-IT-001 | Portátil 14" Business (Valencia) | 15 | 2 | **13** | ✅ |
| NXV-IT-002 | Portátil 14" Business (Miami) | 0 | 0 | **0** | ✅ |
| NXV-PER-001 | Ratón ergonómico (Valencia) | 0 | 0 | **0** | ✅ |
| NXV-PER-002 | Hub USB-C (Miami) | 20 | 5 | **15** | ✅ |
| NXV-OFF-001 | Resma de papel A4 (Valencia) | 50 | 10 | **40** | ✅ |
| NXV-TRN-001 | Cuaderno formación (Valencia) | 0 | 0 | **0** | ✅ |

---

## Prueba 2: `GET /inventory/products/1` — Detalle de activo

```json
{
    "id": 1,
    "name": "Portátil 14\" Business",
    "sku": "NXV-IT-001",
    "category": "hardware",
    "office": "Valencia",
    "current_stock": 13
}
```

---

## Prueba 3: `GET /inventory/orders` — Listar órdenes (con datos del activo)

```json
[
    { "order_type": "outbound", "id": 4, "asset_name": "Teclado USB", "asset_sku": "NXV-PER-003", "quantity": 3, "user_uuid": "7" },
    { "order_type": "inbound",  "id": 5, "asset_name": "Teclado USB", "asset_sku": "NXV-PER-003", "quantity": 10, "user_uuid": "7" },
    { "order_type": "outbound", "id": 3, "asset_name": "Resma de papel A4", "asset_sku": "NXV-OFF-001", "quantity": 10, "user_uuid": "seed-script" },
    { "order_type": "outbound", "id": 2, "asset_name": "Hub USB-C", "asset_sku": "NXV-PER-002", "quantity": 5, "user_uuid": "seed-script" },
    { "order_type": "outbound", "id": 1, "asset_name": "Portátil 14\" Business", "asset_sku": "NXV-IT-001", "quantity": 2, "user_uuid": "seed-script" },
    { "order_type": "inbound",  "id": 4, "asset_name": "Resma de papel A4", "asset_sku": "NXV-OFF-001", "quantity": 50, "user_uuid": "seed-script" },
    { "order_type": "inbound",  "id": 3, "asset_name": "Hub USB-C", "asset_sku": "NXV-PER-002", "quantity": 20, "user_uuid": "seed-script" },
    { "order_type": "inbound",  "id": 2, "asset_name": "Portátil 14\" Business", "asset_sku": "NXV-IT-001", "quantity": 5, "user_uuid": "seed-script" },
    { "order_type": "inbound",  "id": 1, "asset_name": "Portátil 14\" Business", "asset_sku": "NXV-IT-001", "quantity": 10, "user_uuid": "seed-script" }
]
```

---

## Prueba 4: `POST /inventory/products` — Crear activo (autenticado)

**Request:** `Monitor 27" 4K`, SKU `NXV-IT-010`, hardware, Valencia

**Response `201`:**
```json
{
    "id": 8,
    "name": "Monitor 27\" 4K",
    "sku": "NXV-IT-010",
    "category": "hardware",
    "office": "Valencia",
    "current_stock": 0
}
```

✅ El activo se crea con `current_stock = 0`. Solo acumula stock mediante entradas.

---

## Prueba 5: `POST /inventory/orders/inbound` — Registrar entrada (autenticado)

**Request:** `asset_id=8`, quantity=15, supplier="Dell Technologies", office="Valencia"

**Response `201`:**
```json
{
    "id": 6,
    "asset_id": 8,
    "quantity": 15,
    "supplier": "Dell Technologies",
    "office": "Valencia",
    "created_at": "2026-09-09T23:12:11.612334",
    "user_uuid": "8"
}
```

✅ La orden almacena el `user_uuid` del usuario autenticado (id=8).

---

## Prueba 6: `POST /inventory/orders/outbound` — Registrar salida (autenticado)

**Request:** `asset_id=8`, quantity=3, exit_type="allocation", assigned_to="Laura García"

**Response `201`:**
```json
{
    "id": 5,
    "asset_id": 8,
    "quantity": 3,
    "exit_type": "allocation",
    "assigned_to": "Laura García",
    "office": "Valencia",
    "created_at": "2026-09-09T23:12:12.475361",
    "user_uuid": "8"
}
```

✅ Stock post-operación: Monitor NXV-IT-010 ahora tiene `current_stock=12` (15-3).

---

## Prueba 7: Stock insuficiente — debe rechazar con `400`

**Request:** `asset_id=8`, quantity=999 (stock disponible=12)

**Response `400`:**
```json
{
    "detail": "Insufficient stock for asset 'Monitor 27\" 4K'. Available: 12, requested: 999."
}
```

✅ Se rechaza antes de escribir cualquier registro en la base de datos.

---

## Prueba 8: `allocation` sin `assigned_to` — debe rechazar con `422`

**Request:** `exit_type="allocation"` sin `assigned_to`

**Response `422`:**
```json
{
    "detail": [
        {
            "type": "value_error",
            "msg": "Value error, assigned_to es obligatorio cuando exit_type es 'allocation'."
        }
    ]
}
```

✅ Validación Pydantic en el schema.

---

## Prueba 9: `consumption` con `assigned_to` — debe rechazar con `422`

**Request:** `exit_type="consumption"` con `assigned_to="Alguien"`

**Response `422`:**
```json
{
    "detail": [
        {
            "type": "value_error",
            "msg": "Value error, assigned_to debe ser nulo cuando exit_type es 'consumption'."
        }
    ]
}
```

✅ Validación Pydantic en el schema.

---

## Prueba 10: Endpoint protegido sin token — debe rechazar con `401`

**Request:** `POST /inventory/products` sin header `Authorization`

**Response `401`:**
```json
{
    "detail": "Could not validate credentials"
}
```

✅ La autenticación protege correctamente los endpoints de escritura.

---

## Verificación de Criterios de Aceptación

| Criterio | Estado |
|----------|:------:|
| Dos conexiones de base de datos: TinyDB (auth) + Supabase (inventario) | ✅ |
| Todos los endpoints agrupados bajo `/inventory` con APIRouter dedicado | ✅ |
| `current_stock` calculado como SUM(entries) − SUM(exits), no almacenado | ✅ |
| Salida con stock insuficiente rechazada con `400` antes de escribir | ✅ |
| Cada orden registra `user_uuid` del usuario autenticado (TinyDB) | ✅ |
| Modelos ORM (models.py) y schemas Pydantic (schemas.py) en archivos separados | ✅ |
| Ningún endpoint devuelve objeto SQLModel directamente | ✅ |
| Sesión SQLModel inyectada por petición via `Depends(get_supabase_db)` | ✅ |
| `assigned_to` obligatorio si `exit_type=allocation`, nulo si `exit_type=consumption` | ✅ |
| Tablas creadas automáticamente en Supabase al arrancar la app | ✅ |
| `DATABASE_URL` en `.env`; `.env` en `.gitignore` | ✅ |
| Datos semilla presentes; `GET /inventory/products` refleja stock neto | ✅ |

---

**Conclusión:** Todas las pruebas pasaron satisfactoriamente. El backend de inventario cumple con todos los requisitos funcionales y reglas de negocio especificadas en el Hito 5.