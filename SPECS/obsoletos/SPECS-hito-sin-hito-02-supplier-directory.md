# SPECS — Sin Hito 02 (Supplier Directory)

## Estructura objetivo de carpetas/archivos
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/
├── services/
│   └── api/
│       ├── main.py
│       ├── models.py
│       ├── database.py
│       ├── seed.py
│       └── routes/
│           └── suppliers.py
└── uis/
    └── backoffice/
        └── (pagina/componentes del directorio de proveedores)
```

## Modelo de datos (Pydantic)
Proveedor con estructura exacta del contexto Nexova:
- `name`: `str` (requerido)
- `country`: `Literal["Spain", "USA"]` (requerido)
- `categories`: `list[str]` (requerido, minimo 1, solo categorias validas)
- `monthly_rate`: `float` (requerido, mayor que 0)
- `currency`: `Literal["EUR", "USD"]` (requerido)
- `updated_at`: `datetime` (generado por sistema)
- `status`: `Literal["active", "suspended"]` (requerido)
- `contract_renewal_date`: `date | None` (opcional)
- `contact_email`: `EmailStr | None` (opcional)
- `notes`: `str | None` (opcional)

### Categorias validas
- `job_boards`
- `ats_software`
- `assessment_tools`
- `training_platforms`
- `payroll_and_hr_software`
- `video_interview`
- `background_check`
- `office_and_facilities`
- `it_and_software_licenses`

### Estados validos
- `active`
- `suspended`

### Reglas de negocio obligatorias
- Moneda por pais:
  - si `country == "Spain"` entonces `currency == "EUR"`
  - si `country == "USA"` entonces `currency == "USD"`
- Toda entrada invalida debe fallar con 422 antes de persistir.
- Actualizacion de tarifa debe regenerar `updated_at`.

## Seeder
Archivo: `services/api/seed.py`

Requisitos:
- Cargar exactamente los proveedores de `SUPPLIERS_SEED` definidos en el CONTEXT.
- Ser idempotente:
  - verificar existencia antes de insertar
  - no duplicar datos al re-ejecutar
- Mostrar resumen en consola:
  - total revisados
  - total insertados
  - total omitidos por ya existentes
- Ejecutable con:
  - `uv run seed`

## API (FastAPI)
Archivo de rutas: `services/api/routes/suppliers.py`

### `POST /suppliers`
- Crea proveedor nuevo.
- Valida estructura y reglas de negocio.
- Responde `201` con objeto creado e ID TinyDB.
- Responde `422` si hay entrada invalida.

### `GET /suppliers`
- Lista proveedores.
- Query params opcionales:
  - `country`
  - `category`
- Sin query params retorna todos.

### `GET /suppliers/{id}`
- Retorna detalle por ID.
- Responde `404` si no existe.

### `PATCH /suppliers/{id}/rate`
- Actualiza solo `monthly_rate`.
- Rechaza `<= 0` con `422`.
- Regenera `updated_at` automaticamente.
- Responde `404` si ID no existe.

### `PATCH /suppliers/{id}/status`
- Actualiza solo `status`.
- Acepta solo `active` o `suspended`.
- Responde `422` si estado invalido.
- Responde `404` si ID no existe.

### `DELETE /suppliers/{id}`
- Elimina proveedor del directorio.
- Responde `404` si ID no existe.

## Persistencia TinyDB
Archivo: `services/api/database.py`

- Definir ruta estable del archivo JSON para persistencia.
- Reutilizar una tabla principal para proveedores.
- Mantener datos luego de reiniciar el servidor.

## Smoke test del servicio
Archivo: `services/api/smoke_test_suppliers.py`

- Ejecutar desde `services/api` con:
  - `python smoke_test_suppliers.py`
- Verifica rápidamente flujo crítico:
  - listado general
  - validación 422 en payload inválido
  - creación
  - actualización de tarifa
  - actualización de estado
  - filtros por país y categoría
  - eliminación + verificación 404 posterior

## Frontend Backoffice
Ubicacion: `uis/backoffice`

Funcionalidades requeridas:
- Pagina de directorio accesible desde menu.
- Tabla/lista de proveedores con:
  - `name`, `country`, `categories`, `monthly_rate`, `currency`, `status`
- Filtros por pais y categoria sin recarga de pagina.
- Formulario para alta de proveedor (POST /suppliers).
- Accion por fila para actualizar tarifa (PATCH /rate).
- Accion por fila para cambiar estado (PATCH /status).
- Distincion visual de `active` vs `suspended`.
- Destaque visual para renovaciones en proximos 60 dias (`contract_renewal_date`).

## Criterios de aceptacion
### Modelo y validacion
- `status` fuera de conjunto permitido -> `422`.
- `monthly_rate <= 0` -> `422`.
- `updated_at` no lo envia cliente; lo genera backend.
- `country/currency` inconsistente -> `422`.

### Seeder
- `uv run seed` ejecuta sin errores.
- Carga dataset inicial completo.
- Re-ejecucion no duplica.
- Imprime cantidad insertada.

### Endpoints
- `POST /suppliers` crea y retorna ID.
- `GET /suppliers` retorna todos sin filtros.
- `GET /suppliers?country=X` filtra por pais.
- `GET /suppliers?category=Y` filtra por categoria.
- `GET /suppliers/{id}` retorna 404 inexistente.
- `PATCH /suppliers/{id}/rate` actualiza tarifa y timestamp.
- `PATCH /suppliers/{id}/status` valida estado permitido.
- `DELETE /suppliers/{id}` retorna 404 inexistente.
- Smoke test `python smoke_test_suppliers.py` reporta PASS en todos los checks.

### Frontend
- Consumo real de API para listado y acciones.
- Filtros funcionales sin recarga.
- Manejo visible de errores de validacion del servidor.
- Refresco inmediato de cambios de tarifa/estado.

## Checklist de implementacion sugerido
1. Crear `database.py` y conexion TinyDB.
2. Definir modelos Pydantic de entrada/salida en `models.py`.
3. Implementar rutas CRUD y filtros en `routes/suppliers.py`.
4. Integrar router en `main.py`.
5. Implementar `seed.py` idempotente con dataset oficial.
6. Construir pagina de directorio en `uis/backoffice`.
7. Validar flujo completo API + UI + persistencia.
