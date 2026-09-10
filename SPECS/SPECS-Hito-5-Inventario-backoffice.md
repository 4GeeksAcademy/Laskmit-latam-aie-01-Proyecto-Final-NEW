# SPECS — Hito 5 (Inventario Backoffice)

## Identificación

- **Funcionalidad:** Interfaz de gestión de inventario de activos (hardware, periféricos, materiales de oficina y formación).
- **Empresa:** Nexova (consultora de RH con oficinas en Valencia y Miami).
- **Aplicación objetivo:** `uis/backoffice`.
- **Backend existente:** FastAPI en `services/api` — endpoints `/inventory` (activos, entradas, salidas).
- **Stack vigente:** Next.js 16 App Router, React 19, TypeScript 5 y Tailwind CSS 4.
- **Persistencia backend dual:** TinyDB (auth, proveedores, incidencias) + Supabase (inventario con SQLModel).
- **Dependencias existentes reutilizables:** `lib/api-client.ts` (cliente HTTP compartido), `lib/auth.ts` (gestión de token), `components/auth/auth-guard.tsx` (protección de rutas).
- **Rama:** `Hito-5-inventario-backoffice`.

## Objetivo

Construir una sección de inventario dentro del backoffice de Nexova que permita al personal autenticado:

1. **Consultar el stock disponible** de todos los activos (productos) con indicadores visuales de nivel de stock.
2. **Registrar órdenes de entrada** (compras o recepciones recibidas).
3. **Registrar órdenes de salida** (asignaciones a empleados o consumos), mostrando el stock disponible antes de enviar.
4. **Revisar el historial completo de órdenes** (entradas y salidas) en una vista de solo lectura.

Toda la sección se comunica exclusivamente con la API de inventario (`/inventory`) y requiere autenticación — redirige al login si el usuario no tiene sesión. No se crea una aplicación nueva; se añade la sección al backoffice existente.

## Alcance funcional

### Incluido

1. **Capa de integración con la API** — módulo `lib/inventory.ts` que centraliza todas las llamadas a `/inventory`. Ningún componente llama a `fetch` directamente. Usa el cliente HTTP compartido `api-client.ts` para autenticación y manejo de errores.
2. **Página de productos** — ruta `/backoffice/inventory/products`. Lista todos los activos con `current_stock` calculado, aplica código de color según nivel de stock, permite navegar a creación de órdenes desde cada fila.
3. **Formulario de orden de entrada** — ruta `/backoffice/inventory/orders/inbound`. Selector de productos por nombre, campos de cantidad, proveedor y oficina. Muestra confirmación en éxito o error legible en fallo.
4. **Formulario de orden de salida** — ruta `/backoffice/inventory/orders/outbound`. Selector de productos con `current_stock` reactivo. Muestra advertencia en cliente si cantidad supera stock. Gestiona `HTTP 400` (stock insuficiente) con mensaje inline.
5. **Página de historial de órdenes** — ruta `/backoffice/inventory/orders`. Tabla de solo lectura con todas las órdenes (entradas y salidas) combinadas, con distinción visual por tipo, nombre del activo, cantidad, fecha y `user_uuid`.
6. **Protección de rutas** — las cuatro páginas redirigen a `/login` si el usuario no está autenticado. Usa el `AuthGuard` existente.
7. **Manejo explícito de errores** — toda respuesta `4xx`/`5xx` de la API muestra un mensaje legible en la interfaz. No se ignoran errores en silencio ni se muestran objetos JSON en bruto.

### Fuera de alcance

- Edición, borrado o actualización de activos, entradas o salidas desde la UI. Las operaciones de escritura se limitan a crear órdenes de entrada y salida.
- Paginación, ordenamiento configurable o búsqueda de texto libre en productos u órdenes.
- Panel de métricas agregadas, gráficos o dashboard de inventario.
- Modificar los contratos de la API `/inventory` existente.
- Exportación de datos de inventario (CSV, PDF, etc.).
- Notificaciones, alertas automáticas de stock bajo o aprobaciones.
- Añadir autenticación adicional o reemplazar el sistema de auth existente.
- Modificar `uis/website` (debe permanecer público).
- Internacionalización nueva. Si el backoffice ya dispone de i18n, los textos nuevos deben integrarse en ella.

## Compatibilidad obligatoria y no regresión

La implementación es **aditiva**. No debe modificar:

- Los componentes existentes de autenticación (`auth-guard.tsx`, `auth-navigation.tsx`, `lib/auth.ts`, `lib/auth-types.ts`).
- El cliente HTTP compartido `lib/api-client.ts` — el nuevo módulo `lib/inventory.ts` lo consume, no lo modifica.
- Las páginas existentes del backoffice (proveedores, incidencias, talent pipeline, perfil, login, registro, dashboard).
- Los estilos globales (`globals.css`, `page.module.css`) y los módulos CSS existentes.
- El `layout.tsx` raíz — el `AuthGuard` ya protege todas las rutas del backoffice.
- Los endpoints del backend (`/inventory/*`) y sus esquemas.

El nuevo módulo `lib/inventory.ts` debe convivir con los módulos existentes `lib/api-client.ts`, `lib/auth.ts` y `lib/auth-types.ts` sin colisiones de tipos ni nombres.

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | Next.js 16 App Router | `uis/backoffice` existente |
| Lenguaje | TypeScript 5 | Tipado estricto |
| UI | Tailwind CSS 4 | Clases utilitarias + CSS modules existentes |
| Autenticación | JWT en `localStorage` | Lectura desde `lib/auth.ts` (clave `nexova_access_token`) |
| Cliente HTTP | `lib/api-client.ts` | `apiRequest<T>()` con inyección automática de token y manejo de errores |
| API backend | FastAPI `/inventory/*` | `services/api/routers/inventory.py` |

## Dominio y vocabulario de la interfaz

Los nombres de entidades y etiquetas en la interfaz deben coincidir con la terminología de dominio de Nexova. **No** se usan términos genéricos como "Product", "Entry Order" u "Order" sin referencia al contexto de inventario.

| Término de dominio | Uso en UI | Equivalente técnico |
|---|---|---|
| **Activo** | Nombre del producto/artículo en inventario | `Asset` |
| **SKU** | Código único del activo | `Asset.sku` |
| **Categoría** | Tipo de activo: Hardware, Periféricos, Material Oficina, Formación | `Asset.category` |
| **Stock actual** | Unidades disponibles calculadas (entradas - salidas) | `AssetResponse.current_stock` |
| **Orden de entrada** | Registro de recepción/compra de activos | `AssetEntry` (inbound) |
| **Orden de salida** | Registro de asignación o consumo de activos | `AssetExit` (outbound) |
| **Asignación** | Tipo de salida donde se entrega a un empleado | `exit_type = "allocation"` |
| **Consumo** | Tipo de salida donde se gasta el material sin asignación | `exit_type = "consumption"` |
| **Asignado a** | Empleado que recibe un activo (solo en asignaciones) | `assigned_to` |
| **Valencia / Miami** | Oficinas donde opera Nexova | `Asset.office`, filtro geográfico |

### Categorías válidas (traducción UI ↔ API)

| Etiqueta en UI | Valor en API |
|---|---|
| Hardware | `hardware` |
| Periféricos | `peripherals` |
| Material de oficina | `office_supplies` |
| Material de formación | `training_materials` |

## Estructura de archivos objetivo

```
uis/backoffice/
├── lib/
│   ├── inventory.ts                      # NUEVO: integración con API /inventory
│   ├── api-client.ts                     # EXISTENTE: sin cambios
│   ├── auth.ts                           # EXISTENTE: sin cambios
│   └── auth-types.ts                     # EXISTENTE: sin cambios
├── components/
│   └── auth/                             # EXISTENTE: sin cambios
│       ├── auth-guard.tsx
│       └── auth-navigation.tsx
└── app/
    ├── layout.tsx                        # EXISTENTE: sin cambios
    ├── page.tsx                          # EXISTENTE: sin cambios
    ├── login/                            # EXISTENTE
    ├── suppliers/                        # EXISTENTE
    ├── incidents/                        # EXISTENTE
    ├── ...
    └── backoffice/                       # NUEVA CARPETA
        └── inventory/
            ├── products/
            │   └── page.tsx              # NUEVO: lista de activos con stock
            ├── orders/
            │   ├── inbound/
            │   │   └── page.tsx           # NUEVO: formulario de entrada
            │   ├── outbound/
            │   │   └── page.tsx           # NUEVO: formulario de salida
            │   └── page.tsx               # NUEVO: historial de órdenes
            └── layout.tsx                # NUEVO (opcional): layout compartido
```

> **Nota:** La ruta `/backoffice/inventory/products` y `/backoffice/inventory/orders` siguen el patrón App Router de Next.js. Cada página puede ser un Server Component que importa un Client Component (siguiendo el patrón de `suppliers/page.tsx` → `suppliers-page-client.tsx`).

## Contrato de la API existente (referencia)

La implementación frontend debe consumir estos contratos **sin modificarlos**. La API vive en `services/api/routers/inventory.py`.

### `GET /inventory/products` — Público

Respuesta `200`:
```json
[
  {
    "id": 1,
    "name": "Portátil 14\" Business",
    "sku": "NXV-IT-001",
    "category": "hardware",
    "office": "Valencia",
    "current_stock": 13
  }
]
```

### `GET /inventory/products/{id}` — Público

Respuesta `200`:
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
Error: `404` si el activo no existe.

### `POST /inventory/products` — Protegido

Request:
```json
{
  "name": "Monitor 24\" 4K",
  "sku": "NXV-IT-005",
  "category": "hardware",
  "office": "Valencia"
}
```
Respuesta `201`: `AssetResponse` con `current_stock = 0`.
Error `409`: si el `sku` ya existe.

### `POST /inventory/orders/inbound` — Protegido

Request:
```json
{
  "asset_id": 1,
  "quantity": 10,
  "supplier": "TechDistrib Valencia S.L.",
  "office": "Valencia"
}
```
Respuesta `201`:
```json
{
  "id": 5,
  "asset_id": 1,
  "quantity": 10,
  "supplier": "TechDistrib Valencia S.L.",
  "office": "Valencia",
  "created_at": "2026-02-15T10:30:00Z",
  "user_uuid": "abc-123-def"
}
```
Errores: `404` si `asset_id` no existe, `422` si datos inválidos.

### `POST /inventory/orders/outbound` — Protegido

Request (asignación):
```json
{
  "asset_id": 1,
  "quantity": 2,
  "exit_type": "allocation",
  "assigned_to": "María González",
  "office": "Valencia"
}
```

Request (consumo):
```json
{
  "asset_id": 3,
  "quantity": 1,
  "exit_type": "consumption",
  "office": "Valencia"
}
```

Respuesta `201`:
```json
{
  "id": 4,
  "asset_id": 1,
  "quantity": 2,
  "exit_type": "allocation",
  "assigned_to": "María González",
  "office": "Valencia",
  "created_at": "2026-02-15T10:35:00Z",
  "user_uuid": "abc-123-def"
}
```

Errores:
- `400` si `quantity > current_stock` → mensaje: `"Insufficient stock for asset '{name}'. Available: {available}, requested: {quantity}."`
- `422` si `exit_type = "allocation"` sin `assigned_to`, o `exit_type = "consumption"` con `assigned_to`.
- `404` si `asset_id` no existe.

### `GET /inventory/orders` — Público

Respuesta `200` — array combinado de entradas y salidas:
```json
[
  {
    "id": 1,
    "order_type": "outbound",
    "quantity": 2,
    "exit_type": "allocation",
    "assigned_to": "Juan Pérez",
    "asset_id": 1,
    "asset_name": "Portátil 14\" Business",
    "asset_sku": "NXV-IT-001",
    "office": "Valencia",
    "created_at": "2026-02-10T09:00:00Z",
    "user_uuid": "usr-001"
  },
  {
    "id": 1,
    "order_type": "inbound",
    "quantity": 10,
    "supplier": "TechDistrib Valencia S.L.",
    "asset_id": 1,
    "asset_name": "Portátil 14\" Business",
    "asset_sku": "NXV-IT-001",
    "office": "Valencia",
    "created_at": "2026-02-05T08:00:00Z",
    "user_uuid": "usr-001"
  }
]
```

## Especificaciones de vistas

### 1. Módulo de integración — `lib/inventory.ts` (NUEVO)

Debe ser un módulo TypeScript que exporte funciones tipadas para cada operación con la API de inventario.

**Reglas:**
- Usa `apiRequest<T>()` de `lib/api-client.ts` para todas las llamadas HTTP. No uses `fetch` directamente.
- Todas las llamadas a endpoints protegidos (`POST /inventory/products`, `POST /inventory/orders/inbound`, `POST /inventory/orders/outbound`) deben pasar `authenticated: true` para que `apiRequest` inyecte el token automáticamente.
- Define tipos (`interface`) para cada respuesta de la API, incluyendo `current_stock`.
- Exporta funciones con nombres explícitos:
  - `getProducts()` → `GET /inventory/products` → `Promise<InventoryProduct[]>`
  - `getProduct(id)` → `GET /inventory/products/{id}` → `Promise<InventoryProduct>`
  - `createProduct(data)` → `POST /inventory/products` → `Promise<InventoryProduct>`
  - `createInboundOrder(data)` → `POST /inventory/orders/inbound` → `Promise<InboundOrder>`
  - `createOutboundOrder(data)` → `POST /inventory/orders/outbound` → `Promise<OutboundOrder>`
  - `getOrders()` → `GET /inventory/orders` → `Promise<OrderItem[]>`
- No importar `auth.ts` directamente; `apiRequest` ya gestiona el token.
- No añadir lógica de negocio (cálculo de stock, validaciones) — eso pertenece a la API o a los componentes.
- Gestiona el error parseado por `apiRequest` (que ya produce `ApiError` con `message` y `status`). Los componentes consumen ese mensaje.

### 2. Página de productos — `/backoffice/inventory/products`

**Comportamiento:**
- Carga la lista completa de activos desde `GET /inventory/products` al montar el componente.
- Muestra una tabla o tarjetas con los campos:
  - **Nombre del activo** (name)
  - **SKU** (sku)
  - **Categoría** (category) con etiqueta de dominio (Hardware, Periféricos, etc.)
  - **Oficina** (office: Valencia / Miami)
  - **Stock actual** (current_stock)
- **Indicadores visuales de nivel de stock:**
  - `current_stock === 0`: fondo rojo o icono "sin stock" — el activo está agotado.
  - `current_stock > 0 && current_stock <= 5`: fondo amarillo/naranja o icono "stock bajo" — necesita reposición próxima.
  - `current_stock > 5`: fondo verde o icono "stock saludable".
  - Los umbrales (`0 = agotado`, `1-5 = bajo`, `> 5 = saludable`) deben documentarse en un comentario en el código.
- Cada fila incluye botones o enlaces:
  - **"Registrar entrada"** → navega a `/backoffice/inventory/orders/inbound?asset_id={id}`
  - **"Registrar salida"** → navega a `/backoffice/inventory/orders/outbound?asset_id={id}`
- Estados: carga (`Cargando inventario...`), error recuperable con botón de reintento, vacío (`No hay activos registrados.`).

### 3. Formulario de orden de entrada — `/backoffice/inventory/orders/inbound`

**Comportamiento:**
- Selector de producto: `<select>` que carga todos los activos desde `GET /inventory/products` y los muestra por nombre. No se pide al usuario escribir un ID numérico.
- Si se recibe `?asset_id={id}` en la URL, precargar ese activo en el selector.
- Campos del formulario:
  - **Activo** (selector, obligatorio)
  - **Cantidad** (input numérico, obligatorio, mínimo 1)
  - **Proveedor** (input texto, obligatorio)
  - **Oficina** (selector: Valencia / Miami, obligatorio, valor por defecto "Valencia")
- Al enviar:
  - Validar campos obligatorios en cliente antes de llamar a la API.
  - Llamar a `createInboundOrder(data)`.
  - **En éxito (`201`):** limpiar el formulario, mostrar mensaje de confirmación (`"Orden de entrada registrada correctamente: {cantidad} unidades de {nombre_activo}"`). Opcionalmente mostrar enlace para crear otra.
  - **En error (`400`, `422`, `500`):** mostrar el mensaje de error de la API en un elemento visible junto al formulario (no solo en consola). Usar un `aria-live` para accesibilidad.
- Estados: carga durante envío (deshabilitar botón), error recuperable.

### 4. Formulario de orden de salida — `/backoffice/inventory/orders/outbound`

**Comportamiento:**
- Selector de producto: igual que en entrada, carga activos desde la API.
- Si se recibe `?asset_id={id}` en la URL, precargar ese activo en el selector.
- **Stock reactivo:** al cambiar la selección de producto, obtener `current_stock` del activo seleccionado (idealmente llamar a `GET /inventory/products/{id}` o usar el stock ya cargado) y mostrarlo en la interfaz: "Stock disponible: {cantidad} unidades".
- **Advertencia cliente:** si el usuario introduce una cantidad mayor al `current_stock` mostrado, mostrar una advertencia visual junto al campo de cantidad: "La cantidad solicitada ({quantity}) supera el stock disponible ({stock}).". Esta es una salvaguarda de UX — la API aplica la regla real.
- Campos del formulario:
  - **Activo** (selector, obligatorio)
  - **Stock disponible** (solo lectura, se actualiza reactivamente)
  - **Cantidad** (input numérico, obligatorio, mínimo 1)
  - **Tipo de salida** (selector: Asignación / Consumo)
  - **Asignado a** (input texto, obligatorio solo si tipo = Asignación; oculto o deshabilitado si tipo = Consumo)
  - **Oficina** (selector: Valencia / Miami, obligatorio)
- Al enviar:
  - Construir body según `exit_type`:
    - `allocation`: incluir `assigned_to`
    - `consumption`: NO incluir `assigned_to` (enviar `null`)
  - Llamar a `createOutboundOrder(data)`.
  - **En éxito (`201`):** limpiar formulario, mostrar confirmación.
  - **En `400` (stock insuficiente):** mostrar el mensaje de error de la API inline junto al campo de cantidad. No limpiar el formulario — permitir al usuario ajustar la cantidad y reintentar.
  - **En `422` (validación):** mostrar error de validación inline.
  - **En `500`:** mostrar mensaje genérico de indisponibilidad.
- Estados: carga durante envío, warning de stock visible antes de envío, error recuperable.

### 5. Página de historial de órdenes — `/backoffice/inventory/orders`

**Comportamiento:**
- Carga todas las órdenes desde `GET /inventory/orders` al montar el componente.
- Muestra una tabla con las columnas:
  - **Tipo** (Entrada / Salida) — con distinción visual: badge verde para entrada, badge azul/rojo para salida, o icono.
  - **Activo** (asset_name)
  - **SKU** (asset_sku)
  - **Cantidad**
  - **Detalle** — para entrada: proveedor; para salida: tipo (Asignación/Consumo) y asignado a (si aplica)
  - **Oficina**
  - **Fecha** (created_at, formateada legible)
  - **Registrado por** (user_uuid)
- Solo lectura: no hay acciones de borrado, edición ni creación desde esta vista.
- Las órdenes deben ordenarse por fecha descendente (más reciente primero).
- Estados: carga, error recuperable, vacío ("No hay órdenes registradas.").

### 6. Protección de rutas

Las cuatro páginas de inventario deben estar protegidas por el `AuthGuard` existente en `layout.tsx`. Como el `AuthGuard` ya envuelve toda la aplicación en el layout raíz, **las nuevas páginas quedan protegidas automáticamente**.

No obstante, verificar que:
- El `AuthGuard` existente protege rutas anidadas (cualquier ruta bajo `/backoffice/inventory/*`).
- Si un usuario no autenticado navega a cualquier ruta de inventario, es redirigido a `/login`.
- Tras iniciar sesión, la redirección post-login debe llevar al usuario a la ruta que intentaba acceder (o al dashboard `/`).

### 7. Manejo de errores transversal

Todas las vistas deben seguir estas reglas de error:

| Condición | Comportamiento en UI |
|-----------|---------------------|
| `4xx` de la API (error del negocio) | Mostrar `error.message` del `ApiError` en elemento visible. No convertir a fallo genérico. |
| `5xx` de la API (error del servidor) | Mostrar "El servicio no está disponible temporalmente. Inténtalo más tarde." |
| Error de red (servidor caído) | Mostrar "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo." |
| Error de validación `422` | Mostrar los detalles del error (campo y mensaje) si `ApiError.details` tiene información. |
| Timeout o fallo de parseo JSON | Mostrar "El servidor no respondió correctamente. Inténtalo de nuevo." |

Cada vista debe exponer los errores con `aria-live="polite"` para lectores de pantalla. Los mensajes de error persistentes deben incluir un botón de reintento cuando la operación sea recuperable (fallo de red, 5xx).

## Criterios de aceptación

### Checklist de verificación

- [ ] Existe un módulo `lib/inventory.ts` dedicado — no hay llamadas `fetch` directas dentro de los componentes.
- [ ] Todas las peticiones a endpoints protegidos incluyen la cabecera `Authorization` con el token del usuario actual (gestionado por `apiRequest`).
- [ ] La página de productos carga datos reales de `GET /inventory/products` y muestra `current_stock` con indicadores visuales de nivel de stock (verde/amarillo/rojo según umbrales documentados).
- [ ] La página de productos ofrece botones "Registrar entrada" y "Registrar salida" por cada activo.
- [ ] El formulario de orden de entrada envía correctamente a `POST /inventory/orders/inbound` y muestra confirmación o error legible — sin fallos silenciosos.
- [ ] El formulario de orden de entrada precarga el activo si recibe `?asset_id={id}` en la URL.
- [ ] El formulario de orden de salida muestra el `current_stock` del producto seleccionado de forma reactiva, antes de que el usuario envíe.
- [ ] El formulario de orden de salida muestra una advertencia en el cliente cuando la cantidad introducida supera el stock disponible.
- [ ] Una respuesta `400` del endpoint de salida muestra el mensaje de error de la API de forma visible en la interfaz, sin limpiar el formulario.
- [ ] El formulario de orden de salida oculta/deshabilita el campo "Asignado a" cuando el tipo de salida es "Consumo".
- [ ] La página de historial de órdenes muestra todas las órdenes con distinción visual entrada/salida, nombre de activo, SKU, cantidad, detalle, fecha y `user_uuid`.
- [ ] Las cuatro páginas redirigen a los usuarios no autenticados al login (protegidas por `AuthGuard` existente).
- [ ] Los nombres de entidades y etiquetas de campos en la interfaz coinciden con el vocabulario de dominio de Nexova (Activo, SKU, Stock actual, Orden de entrada, Orden de salida, Asignación, Consumo, Asignado a).
- [ ] Errores `4xx`/`5xx` se muestran como mensajes legibles, no como JSON en bruto.
- [ ] Estados de carga, error y vacío están implementados en cada vista.
- [ ] `.env.local` está en `.gitignore` y no contiene secretos comprometidos.

### No regresión

Verificar que después de añadir la sección de inventario:

- [ ] El login, registro y perfil funcionan sin cambios.
- [ ] La página de proveedores carga y opera correctamente.
- [ ] El gestor de incidencias funciona sin cambios.
- [ ] El Talent Pipeline Tracker funciona sin cambios.
- [ ] El dashboard (`/`) funciona sin cambios.
- [ ] `NEXT_PUBLIC_API_BASE_URL` sigue siendo la única variable para la API Nexova (no crear `NEXT_PUBLIC_INVENTORY_API_URL`).
- [ ] El `AuthGuard` existente no presenta regresiones en rutas nuevas (verificar que las rutas de inventario no requieren configuración adicional).

## Variables de entorno

Usar la misma variable existente para la API Nexova:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**No crear** una variable separada `NEXT_PUBLIC_INVENTORY_API_URL`. El módulo `lib/inventory.ts` debe usar `NEXT_PUBLIC_API_BASE_URL` (la misma que usa `api-client.ts`). La URL de la API de inventario es la misma que la API de autenticación, proveedores e incidencias — el prefijo `/inventory` distingue el recurso.

Verificar que `.env.local` está en `.gitignore`. No subir URLs de API ni tokens al repositorio.