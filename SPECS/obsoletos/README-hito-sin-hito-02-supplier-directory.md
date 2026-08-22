# README — Sin Hito 02 (Supplier Directory)

## Estado del proyecto
Definido para implementacion con FastAPI + TinyDB + Pydantic (backend) y UI de backoffice (frontend) dentro del monorepo.

## Que se tiene que implementar en el proyecto
### Backend (API)
- Crear la API de proveedores en `services/api/` con:
  - `main.py`
  - `models.py`
  - `database.py`
  - `routes/suppliers.py`
  - `seed.py`
- Aplicar validaciones de negocio del contexto Nexova:
  - `country`: solo `Spain` o `USA`
  - `status`: solo `active` o `suspended`
  - `monthly_rate`: valor numerico mayor que 0
  - coherencia `country`/`currency`:
    - `Spain` -> `EUR`
    - `USA` -> `USD`
  - `categories`: lista no vacia y con categorias validas
- Registrar `updated_at` automaticamente cuando se modifica `monthly_rate`.

### Seeder
- Cargar los 15 proveedores iniciales definidos en el CONTEXT.
- Permitir ejecucion con `uv run seed`.
- Evitar duplicados al ejecutar multiples veces.
- Reportar en consola cantidad de registros insertados.

### Endpoints requeridos
- `POST /suppliers`
- `GET /suppliers`
- `GET /suppliers/{id}`
- `PATCH /suppliers/{id}/rate`
- `PATCH /suppliers/{id}/status`
- `DELETE /suppliers/{id}`

### Frontend (Backoffice)
- Crear pagina de directorio de proveedores en `uis/backoffice`.
- Mostrar listado con campos principales:
  - `name`, `country`, `categories`, `monthly_rate`, `currency`, `status`
- Agregar filtros por `country` y `category` sin recargar pagina.
- Implementar formulario de alta (POST /suppliers) con manejo de errores 422.
- Permitir actualizar tarifa y estado desde la interfaz.
- Diferenciar visualmente proveedores `active` y `suspended`.
- Destacar renovaciones con `contract_renewal_date` en proximos 60 dias.

## Como correrlo (objetivo esperado)
### 1) Backend
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/services/api`
2. `uv run seed`
3. `uv run uvicorn main:app --reload --port 8000`
4. (Opcional) Ejecutar smoke test rapido de endpoints:
  - `python smoke_test_suppliers.py`

### 2) Frontend
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/backoffice`
2. Ejecutar el comando de desarrollo definido por la app de backoffice.
    npm install   # solo si es primera vez o faltan dependencias
    npm run dev para correrlo
3. Configurar la base URL de API a `http://localhost:8000`.

## Como probar que funciona
- Seeder:
  - primera ejecucion inserta proveedores del contexto
  - ejecuciones repetidas no duplican registros
- API:
  - `GET /suppliers` devuelve todos
  - `GET /suppliers?country=Spain` filtra por pais
  - `GET /suppliers?category=ats_software` filtra por categoria
  - `PATCH /suppliers/{id}/rate` actualiza `monthly_rate` y `updated_at`
  - `PATCH /suppliers/{id}/status` acepta solo `active|suspended`
  - `GET /suppliers/{id}` y `DELETE /suppliers/{id}` devuelven 404 si no existe
  - smoke test automatizado disponible con `python smoke_test_suppliers.py`
- UI:
  - listado y filtros actualizan sin recargar
  - alta, cambio de tarifa y cambio de estado se reflejan al instante
  - estados activos/suspendidos se distinguen visualmente

## Archivos principales del hito
- `services/api/main.py`
- `services/api/models.py`
- `services/api/database.py`
- `services/api/routes/suppliers.py`
- `services/api/seed.py`
- `uis/backoffice/` (pagina de directorio y componentes asociados)
