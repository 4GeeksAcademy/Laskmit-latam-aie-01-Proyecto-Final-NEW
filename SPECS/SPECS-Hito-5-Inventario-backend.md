# SPECS — Hito 5 (Inventario Backend — ORM + Doble Base de Datos)

## Identificación

- **Funcionalidad:** Gestión de inventario de activos (hardware, periféricos, materiales de oficina y formación) con ORM y doble base de datos.
- **Empresa:** Nexova (consultora de RH con oficinas en Valencia y Miami).
- **Backend objetivo:** FastAPI en `services/api`.
- **Persistencia vigente:** TinyDB (autenticación y usuarios — no modificar).
- **Nueva persistencia:** Supabase (PostgreSQL vía SQLModel — inventario y órdenes).
- **Stack vigente:** FastAPI, Python 3.11+, TinyDB, SQLModel, Pydantic v2.
- **Dependencias nuevas:** `sqlmodel`, `psycopg2-binary`.
- **Rama:** `inventory-backend-orm`.

## Objetivo

Construir una API de gestión de inventario que opere sobre **dos bases de datos simultáneas**:

1. **TinyDB** — conserva autenticación, usuarios, perfiles, proveedores e incidencias (sin cambios).
2. **Supabase (PostgreSQL)** — aloja activos (`Asset`), entradas (`AssetEntry`) y salidas (`AssetExit`) con SQLModel.

El `current_stock` se calcula siempre como suma de entradas menos suma de salidas, **nunca se almacena directamente**. Cada orden registra el UUID del usuario autenticado desde TinyDB. Todos los endpoints de inventario se agrupan bajo `/inventory` con un `APIRouter` dedicado.

---

## ¿Qué necesitas hacer en Supabase?

Supabase es el proveedor de la base de datos PostgreSQL donde vivirán los datos de inventario. **No se ejecuta SQL manual para crear tablas** — SQLModel (`metadata.create_all`) se encarga de eso al arrancar la aplicación. Pero sí necesitas crear el proyecto y obtener la cadena de conexión.

### 1. Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) e inicia sesión (o regístrate).
2. Crea una **nueva organización** (p. ej. "Nexova") si es la primera vez.
3. Dentro de la organización, haz clic en **"New project"**.
4. Completa los campos:
   - **Name:** `nexova-inventory` (o el nombre que prefieras).
   - **Database Password:** Elige una contraseña segura y **guárdala** — la necesitarás para la cadena de conexión.
   - **Region:** Elige la más cercana a tu ubicación (p. ej. `eu-west-1` para Valencia o `us-east-1` para Miami).
   - **Plan:** Free tier (es suficiente para desarrollo y pruebas).
5. Haz clic en **"Create new project"**.
6. Espera mientras Supabase aprovisiona la base de datos (~2 minutos).

### 2. Obtener la cadena de conexión (DATABASE_URL)

1. Una vez creado el proyecto, ve al **Dashboard** del proyecto.
2. En el panel lateral izquierdo, haz clic en **"Connect"** (icono de enchufe).
3. En la sección **"Connection parameters"**, verás varias pestañas. Selecciona:
   - **Mode:** `Transaction pooler` (recomendado para apps que usan conexiones cortas como FastAPI).
   - **Type:** `URI`
4. Copia la cadena que aparece. Tiene este formato:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
   > **Importante:** `[YOUR-PASSWORD]` aparece como placeholder. Debes **reemplazarlo** con la contraseña que elegiste al crear el proyecto. Si la contraseña contiene caracteres especiales, es posible que necesites URL-encodearlos (p. ej. `@` → `%40`, `#` → `%23`).

5. **Copia esa cadena completa** (con tu contraseña real) — la usarás como `DATABASE_URL` en el `.env`.

### 3. Configurar Network (si es necesario)

Por defecto, Supabase Free Tier permite conexiones desde cualquier IP. Si más adelante tu entorno restringe IPs, puedes añadirlas en **Project Settings → Database → IP Filtering**.

### 4. No crees tablas manualmente

**No ejecutes SQL manual en el SQL Editor de Supabase.** Las tablas `asset`, `assetentry` y `assetexit` se crearán automáticamente al arrancar la aplicación FastAPI gracias a la línea:

```python
SQLModel.metadata.create_all(engine)
```

Esto se ejecuta en el `@app.on_event("startup")` (o equivalente) de `main.py`.

### 5. Verificar la conexión desde Python

Una vez configurado, puedes verificar que la conexión funciona con:

```python
from sqlmodel import Session, create_engine, SQLModel

DATABASE_URL = "postgresql://postgres.xxxxx:password@pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL, echo=True)

# Esto debe ejecutarse sin errores:
SQLModel.metadata.create_all(engine)
```

Si ves las sentencias `CREATE TABLE` en la consola, la conexión funciona.

### Resumen de pasos en Supabase

| Paso | Acción |
|------|--------|
| 1 | Crear proyecto `nexova-inventory` en supabase.com |
| 2 | Ir a **Connect** → Transaction pooler → URI |
| 3 | Copiar `DATABASE_URL` y reemplazar `[YOUR-PASSWORD]` |
| 4 | Añadir `DATABASE_URL=<cadena>` al `.env` de `services/api/` |
| 5 | No crear tablas manualmente — SQLModel lo hará al arrancar |
| 6 | Ejecutar la app y verificar que las tablas aparecen en Supabase Table Editor |

---

## Estructura de archivos (dentro de `services/api/`)

```
services/api/
├── .env                          # AÑADIR: DATABASE_URL=<supabase-uri>
├── database.py                   # MODIFICAR: añadir motor SQLModel + get_db
├── models.py                     # AÑADIR: Asset, AssetEntry, AssetExit (SQLModel)
├── schemas.py                    # NUEVO: AssetCreate/Response, AssetEntryCreate/Response, AssetExitCreate/Response
├── main.py                       # MODIFICAR: importar router inventory, crear tablas al startup
└── routers/
    ├── __init__.py               # (sin cambios)
    ├── inventory.py              # NUEVO: APIRouter(prefix="/inventory")
    ├── auth.py                   # (sin cambios)
    ├── users.py                  # (sin cambios)
    ├── profiles.py               # (sin cambios)
    ├── suppliers.py              # (sin cambios)
    └── incidents.py              # (sin cambios)
```

---

## Modelos ORM — `models.py` (SQLModel)

### `Asset` (equivale a Product)

| Campo | Tipo SQLModel | Notas |
|-------|---------------|-------|
| `id` | `int` (PK) | `primary_key=True`, autoincremental |
| `name` | `str` | Ej.: `"Portátil 14\" Business"` |
| `sku` | `str` | Código único, ej.: `"NXV-IT-001"` |
| `category` | `str` | `"hardware"`, `"peripherals"`, `"office_supplies"`, `"training_materials"` |
| `office` | `str` | `"Valencia"` o `"Miami"` |

```python
class Asset(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    sku: str = Field(unique=True)
    category: str
    office: str
```

### `AssetEntry` (equivale a InboundOrder)

| Campo | Tipo SQLModel | Notas |
|-------|---------------|-------|
| `id` | `int` (PK) | `primary_key=True`, autoincremental |
| `asset_id` | `int` (FK → Asset) | `foreign_key="asset.id"` |
| `quantity` | `int` | Unidades recibidas |
| `supplier` | `str` | Nombre del proveedor |
| `office` | `str` | `"Valencia"` o `"Miami"` |
| `created_at` | `datetime` | `default_factory=datetime.now(timezone.utc)` |
| `user_uuid` | `str` | UUID del usuario de TinyDB que registró la entrada |

### `AssetExit` (equivale a OutboundOrder)

| Campo | Tipo SQLModel | Notas |
|-------|---------------|-------|
| `id` | `int` (PK) | `primary_key=True`, autoincremental |
| `asset_id` | `int` (FK → Asset) | `foreign_key="asset.id"` |
| `quantity` | `int` | Unidades asignadas o consumidas |
| `exit_type` | `str` | `"allocation"` o `"consumption"` |
| `assigned_to` | `str \| None` | Nombre/ID del empleado si `exit_type == "allocation"` |
| `office` | `str` | `"Valencia"` o `"Miami"` |
| `created_at` | `datetime` | `default_factory=datetime.now(timezone.utc)` |
| `user_uuid` | `str` | UUID del usuario de TinyDB que registró la salida |

> **Nota:** `user_uuid` es una cadena de texto (no una FK real). No se crea un modelo User en SQLModel ni se replica la tabla de usuarios de TinyDB en Supabase.

---

## Schemas Pydantic — `schemas.py` (NUEVO)

Archivo separado de `models.py`. Cada schema es una clase `BaseModel` independiente.

### `AssetCreate`

```python
class AssetCreate(BaseModel):
    name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    category: Literal["hardware", "peripherals", "office_supplies", "training_materials"]
    office: Literal["Valencia", "Miami"]
```

### `AssetResponse`

```python
class AssetResponse(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    office: str
    current_stock: int  # Campo calculado, no almacenado en ORM
```

### `AssetEntryCreate`

```python
class AssetEntryCreate(BaseModel):
    asset_id: int
    quantity: int = Field(gt=0)
    supplier: str = Field(min_length=1)
    office: Literal["Valencia", "Miami"]
```

### `AssetEntryResponse`

Incluye todos los campos de `AssetEntry` más el nombre del activo (opcional, para listados).

### `AssetExitCreate`

```python
class AssetExitCreate(BaseModel):
    asset_id: int
    quantity: int = Field(gt=0)
    exit_type: Literal["allocation", "consumption"]
    assigned_to: str | None = None
    office: Literal["Valencia", "Miami"]
```

Regla de validación: si `exit_type == "allocation"`, `assigned_to` es obligatorio. Si `exit_type == "consumption"`, `assigned_to` debe ser nulo.

### `AssetExitResponse`

Incluye todos los campos de `AssetExit` más el nombre del activo (opcional).

### `OrderResponse` (para el listado combinado)

Puedes definir un schema separado para `GET /inventory/orders` que incluya datos del activo (asset_name, asset_sku) y `user_uuid`.

---

## Configuración de bases de datos — `database.py` (MODIFICAR)

### TinyDB (existente — NO MODIFICAR)

```python
# Código existente de TinyDB se conserva intacto.
# Nada cambia para get_db(), get_suppliers_table(), get_incidents_table(), etc.
```

### Nueva conexión SQLModel — AÑADIR

```python
from sqlmodel import Session, create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, echo=False)  # echo=True para debug

def get_db() -> Session:
    """Dependencia FastAPI: produce una sesión SQLModel por petición."""
    with Session(engine) as session:
        yield session
```

> **Importante:** `get_db` para SQLModel se inyecta mediante `Depends()` en el router. No uses una sesión global. El nombre `get_db` no colisiona con la función `get_db()` de TinyDB porque están en contextos diferentes (una devuelve `TinyDB`, la otra `Session` de SQLModel). Si prefieres evitar ambigüedad, renómbrala a `get_supabase_session()`.

---

## Router de inventario — `routers/inventory.py` (NUEVO)

### Estructura

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session

router = APIRouter(prefix="/inventory", tags=["inventory"])
```

### Endpoints

#### `GET /inventory/products`

- **Autenticación:** No requerida (lectura pública).
- **Descripción:** Lista todos los activos con `current_stock` calculado.
- **Cálculo de stock:**
  ```python
  # Por cada Asset:
  total_entries = sum(asset.entries.quantity)  # SUM de AssetEntry donde asset_id = Asset.id
  total_exits = sum(asset.exits.quantity)       # SUM de AssetExit donde asset_id = Asset.id
  current_stock = total_entries - total_exits
  ```
- **Respuesta:** `list[AssetResponse]`

#### `POST /inventory/products`

- **Autenticación:** Requerida (`Depends(get_current_user)`).
- **Descripción:** Crea un nuevo activo.
- **Body:** `AssetCreate`
- **Reglas:**
  - El `sku` debe ser único. Si ya existe, devolver `HTTP 409 Conflict`.
  - El `current_stock` comienza en 0 al crearse. Solo se acumula stock mediante `AssetEntry`.
- **Respuesta:** `AssetResponse` con `current_stock = 0`.

#### `GET /inventory/products/{id}`

- **Autenticación:** No requerida.
- **Descripción:** Obtiene un activo con su stock actual.
- **Respuesta:** `AssetResponse` con `current_stock` calculado.
- **Errores:** `404` si el activo no existe.

#### `POST /inventory/orders/inbound`

- **Autenticación:** Requerida (`Depends(get_current_user)`).
- **Descripción:** Registra una entrada de activos (compra o recepción).
- **Body:** `AssetEntryCreate`
- **Reglas:**
  - El `asset_id` debe existir. Si no, `HTTP 404`.
  - El `user_uuid` se obtiene del JWT del usuario autenticado (de TinyDB).
  - La cantidad debe ser positiva.
- **Respuesta:** `AssetEntryResponse` (HTTP 201).

#### `POST /inventory/orders/outbound`

- **Autenticación:** Requerida (`Depends(get_current_user)`).
- **Descripción:** Registra una salida de activos (asignación o consumo).
- **Body:** `AssetExitCreate`
- **Reglas de negocio:**
  1. El `asset_id` debe existir. Si no, `HTTP 404`.
  2. El `user_uuid` se obtiene del JWT del usuario autenticado.
  3. **Validar stock suficiente antes de escribir:**
     - Calcular `current_stock` del activo en la misma oficina.
     - Si `quantity > current_stock`, devolver `HTTP 400` con mensaje:
       `"Insufficient stock for asset '{name}'. Available: {available}, requested: {quantity}."`
     - **No escribir nada en la base de datos si el stock es insuficiente.**
  4. Si `exit_type == "allocation"`, `assigned_to` debe tener valor → validar en el schema.
  5. Si `exit_type == "consumption"`, `assigned_to` debe ser `None` → validar en el schema.
- **Respuesta:** `AssetExitResponse` (HTTP 201).

#### `GET /inventory/orders`

- **Autenticación:** No requerida.
- **Descripción:** Lista todas las órdenes (entradas y salidas) con datos del activo y `user_uuid`.
- **Respuesta combinada:** Devuelve un array con entradas y salidas, cada una identificada con un campo `order_type: "inbound" | "outbound"`.
- **Problema N+1:** Usa `selectinload` o carga las relaciones del activo en la misma consulta para evitar consultas adicionales por cada orden.

---

## Modificaciones en `main.py`

Añadir al archivo existente:

```python
# Al inicio, después de los imports existentes:
from sqlmodel import SQLModel
from services.api.database import engine as supabase_engine  # el engine de Supabase

# En el cuerpo, después de crear app:
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(supabase_engine)

# Al final, registrar el router:
from services.api.routes.inventory import router as inventory_router
app.include_router(inventory_router)
```

---

## Reglas de negocio (resumen)

1. **`current_stock` siempre se calcula**, nunca se almacena como columna. Fórmula: `SUM(AssetEntry.quantity) - SUM(AssetExit.quantity)` para un mismo `asset_id` y `office`.
2. **Un activo empieza con stock 0** al crearse y solo acumula stock mediante entradas.
3. **Cada orden almacena el `user_uuid`** del usuario que la crea (obtenido del JWT de TinyDB).
4. **Stock negativo prohibido:** si una salida supera el stock disponible, se rechaza con `HTTP 400` antes de escribir.
5. **`assigned_to` obligatorio** cuando `exit_type = "allocation"`, nulo cuando `exit_type = "consumption"`.
6. **No tabla de usuarios en Supabase:** `user_uuid` es solo una cadena de referencia.
7. **Las dos oficinas coexisten en las mismas tablas:** el campo `office` filtra por ubicación.
8. **El stock se calcula por oficina:** una salida en Valencia descuenta stock de Valencia, no de Miami.

---

## Datos semilla

Crear un script `services/api/seed_inventory.py` (o añadir al `seed.py` existente) que inserte los siguientes registros.

### Assets

| name | sku | category | office |
|------|-----|----------|--------|
| Portátil 14" Business | NXV-IT-001 | hardware | Valencia |
| Portátil 14" Business | NXV-IT-002 | hardware | Miami |
| Ratón ergonómico | NXV-PER-001 | peripherals | Valencia |
| Hub USB-C | NXV-PER-002 | peripherals | Miami |
| Resma de papel A4 | NXV-OFF-001 | office_supplies | Valencia |
| Cuaderno de formación en liderazgo | NXV-TRN-001 | training_materials | Valencia |

### AssetEntries (mínimo 4)

- **NXV-IT-001** (Valencia): 10 uds, proveedor "TechDistrib Valencia S.L."
- **NXV-IT-001** (Valencia): 5 uds, proveedor "CompuGlobal España"
- **NXV-PER-002** (Miami): 20 uds, proveedor "Office Depot Miami"
- **NXV-OFF-001** (Valencia): 50 uds, proveedor "Papelera del Mediterráneo"

### AssetExits (mínimo 3)

- **NXV-IT-001** (Valencia): 2 uds, `allocation`, assigned_to "Ana Martínez"
- **NXV-PER-002** (Miami): 5 uds, `allocation`, assigned_to "John Smith"
- **NXV-OFF-001** (Valencia): 10 uds, `consumption`, assigned_to null

### Stock resultante (verificación)

| Asset | Entradas | Salidas | Stock Neto |
|-------|----------|---------|------------|
| NXV-IT-001 (Valencia) | 10 + 5 = 15 | 2 | **13** |
| NXV-IT-002 (Miami) | 0 | 0 | **0** |
| NXV-PER-001 (Valencia) | 0 | 0 | **0** |
| NXV-PER-002 (Miami) | 20 | 5 | **15** |
| NXV-OFF-001 (Valencia) | 50 | 10 | **40** |
| NXV-TRN-001 (Valencia) | 0 | 0 | **0** |

---

## Dependencias nuevas

Añadir a `pyproject.toml` e instalar:

```bash
cd services/api
uv add sqlmodel psycopg2-binary
```

---

## Variables de entorno — `.env`

Añadir al `.env` de `services/api/`:

```env
# --- Existente (autenticación TinyDB) ---
SECRET_KEY=your-secret-key-aqui
ACCESS_TOKEN_EXPIRE_MINUTES=30

# --- Nueva (conexión Supabase) ---
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

> **Importante:** `.env` ya está en `.gitignore`. Nunca subir credenciales al repositorio.

---

## Criterios de aceptación

- [ ] Dos conexiones de base de datos activas: TinyDB para auth, Supabase para inventario.
- [ ] Todos los endpoints bajo `/inventory` mediante `APIRouter` dedicado.
- [ ] `current_stock` se calcula siempre como entradas − salidas, por oficina. **No hay columna de stock en Asset.**
- [ ] Una `AssetExit` que supera el stock disponible se rechaza con `HTTP 400` antes de escribir.
- [ ] Cada orden registra el `user_uuid` del usuario autenticado (de TinyDB).
- [ ] Modelos ORM (`models.py`) y schemas Pydantic (`schemas.py`) en archivos separados.
- [ ] Los endpoints nunca devuelven objetos SQLModel directamente — siempre schemas Pydantic.
- [ ] La sesión SQLModel se inyecta por petición mediante `Depends()` — sin sesiones globales.
- [ ] `assigned_to` es obligatorio si `exit_type = "allocation"`, nulo si `exit_type = "consumption"`.
- [ ] Las tablas se crean automáticamente en Supabase al arrancar la app.
- [ ] `DATABASE_URL` está en `.env`; `.env` en `.gitignore` (ya está).
- [ ] Datos semilla presentes; `GET /inventory/products` refleja el stock neto calculado.

---

## Verificación manual

```bash
# 1. Iniciar la API
cd services/api
uv run uvicorn main:app --reload --port 8000

# 2. Probar listado de activos (debe devolver 6 activos con stock)
curl http://localhost:8000/inventory/products

# 3. Probar salida con stock insuficiente (debe devolver 400)
curl -X POST http://localhost:8000/inventory/orders/outbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"asset_id": 2, "quantity": 999, "exit_type": "allocation", "assigned_to": "Test", "office": "Miami"}'

# 4. Probar salida tipo allocation sin assigned_to (debe devolver error de validación)
curl -X POST http://localhost:8000/inventory/orders/outbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"asset_id": 2, "quantity": 1, "exit_type": "allocation", "office": "Miami"}'
```

---

## No regresión

La implementación es **aditiva**. No se modifican:

- `POST /auth/login`, `GET /auth/me`, `POST /users`, `PUT /profiles/me`
- El router `/suppliers`, `/incidents` y sus endpoints existentes
- Las dependencias `get_current_user`, el esquema JWT, el hash bcrypt
- La conexión TinyDB, sus tablas y datos
- `uis/backoffice`, `uis/website` y sus clientes HTTP

---

_Documento interno — 4Geeks Academy · Track de Ingeniería de IA_
_Hito 5 · Escenario Nexova_