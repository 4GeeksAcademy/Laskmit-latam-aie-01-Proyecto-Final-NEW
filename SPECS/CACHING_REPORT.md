# Informe de Optimización de Rendimiento: Caching

**Proyecto:** Nexova Operations Platform  
**Versión del informe:** 1.0  
**Fecha:** 2026-09-24  
**Referencia:** [Planteamiento-sin-hito-12-caching-optimisation.md](./Proyectos/Planteamiento-sin-hito-12-caching-optimisation.md)

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Decisiones en el Frontend](#2-decisiones-en-el-frontend)
   - 2.1 Lazy Loading — Componentes y rutas
   - 2.2 Memoización con `useMemo`
3. [Decisiones en el Backend](#3-decisiones-en-el-backend)
   - 3.1 Inventario de endpoints
   - 3.2 Endpoints candidatos a caching
   - 3.3 Implementación propuesta
4. [Intercambios Reconocidos (Freshness vs. Performance)](#4-intercambios-reconocidos)
5. [Qué No Se Cacheó y Por Qué](#5-qué-no-se-cacheó-y-por-qué)
6. [Resumen de Acciones Recomendadas](#6-resumen-de-acciones-recomendadas)

---

## 1. Resumen Ejecutivo

Se ha analizado la plataforma Nexova en su estado actual para identificar oportunidades de caching con mayor impacto. El análisis cubre:

- **Frontend**: Aplicación Next.js del backoffice (`uis/backoffice`) y sitio web corporativo (`uis/website`).
- **Backend**: API FastAPI (`services/api`) con endpoints que operan sobre TinyDB (proveedores, incidencias, usuarios) y SQLModel/Supabase (inventario).

**Hallazgo principal**: El frontend ya implementa Lazy Loading de forma extensiva mediante `next/dynamic` en la mayoría de sus páginas de gestión (incidencias, proveedores, inventario, talent pipeline). Sin embargo, existen oportunidades de mejora en memoización de cálculos y en caching de endpoints del backend que agregan datos o realizan consultas computacionalmente costosas.

---

## 2. Decisiones en el Frontend

### 2.1 Lazy Loading — Componentes y rutas

#### Estado actual

El backoffice ya implementa `next/dynamic` en **7 puntos** de entrada de página:

| Página | Componente diferido | ¿Ya implementado? |
|---|---|---|
| `/incidents` | `IncidentManager` | ✅ Sí, con `ssr: false` |
| `/suppliers` | `SuppliersPageClient` | ✅ Sí |
| `/backoffice/inventory/products` | `ProductsPageClient` | ✅ Sí |
| `/backoffice/inventory/orders` | `InboundOrderClient`, `OutboundOrderClient`, `OrdersHistoryClient` | ✅ Sí (3 dinámicos) |
| `/backoffice/inventory/orders/inbound` | `InboundOrderClient` | ✅ Sí |
| `/backoffice/inventory/orders/outbound` | `OutboundOrderClient` | ✅ Sí |
| `/talent-pipeline-tracker` | `CandidatesPageClient` | ✅ Sí |

#### Análisis y justificación de cada componente diferido

1. **`IncidentManager`** (`/incidents`)
   - **Justificación**: El gestor de incidencias incluye formularios de creación, filtros, tabla dinámica, sumario ejecutivo y lógica de transición de estados. Pesa ~8-12 KB de JS. No es necesario para la interacción inicial de la página (cabecera y navegación). Se difiere con `ssr: false` porque depende del navegador para ciertas interacciones de estado.

2. **`SuppliersPageClient`** (`/suppliers`)
   - **Justificación**: Contiene la lógica completa de CRUD de proveedores, filtros por país/categoría, actualización de tarifas y cambio de estado. Su bundle JS es significativo y solo se necesita cuando el usuario interactúa con el directorio.

3. **`ProductsPageClient`, `InboundOrderClient`, `OutboundOrderClient`, `OrdersHistoryClient`** (`/backoffice/inventory/*`)
   - **Justificación**: El módulo de inventario es el más pesado de la aplicación. Cada componente cliente maneja tablas dinámicas con datos calculados (stock en tiempo real), formularios de registro con validación cruzada (oficina vs. activo) y llamadas API específicas. Diferir su carga evita bloquear el hilo principal en la navegación inicial.

4. **`CandidatesPageClient`** (`/talent-pipeline-tracker`)
   - **Justificación**: Es el componente más reciente y potencialmente pesado por el manejo de pipeline de candidatos con filtros y búsqueda. El wrapper ya aplica `dynamic()` correctamente.

#### Recomendación adicional

Añadir Lazy Loading para los formularios de cambio de contraseña y perfil en `/account/change-password` y `/account/profile`. Actualmente no se ha verificado si están diferidos, pero por su naturaleza (solo se usan bajo demanda) son candidatos naturales.

---

### 2.2 Memoización con `useMemo`

#### Estado actual

Se ha identificado **1 uso existente** de `useMemo`:

- **`suppliers-page-client.tsx`**: La variable `queryString` se construye con `useMemo` dependiendo de `countryFilter` y `categoryFilter`. Esto evita recalcular la URL de consulta en cada renderizado, una optimización correcta y bien aplicada.

#### Oportunidades identificadas

1. **`suppliers-page-client.tsx` — Filtrado y ordenación de proveedores**
   ```tsx
   // Actual: se recorre el array completo en cada render
   const displayedSuppliers = useMemo(() => {
     return suppliers.filter(s => {
       // lógica de filtro local si aplica
       return true;
     });
   }, [suppliers, /* filtros adicionales */]);
   ```
   **Beneficio estimado**: Los proveedores se filtran dos veces (una en backend vía query params y otra localmente). Si se añade ordenación o filtrado adicional en cliente, `useMemo` evita recomputaciones en cada cambio de estado de formulario. **A implementar si se añade ordenación local.**

2. **`incident-manager.tsx` — Estados de transición disponibles**
   ```tsx
   const availableTransitions = useMemo(() => {
     return NEXT_STATUSES[incident.status] || [];
   }, [incident.status]);
   ```
   **Beneficio**: Evita la búsqueda en el objeto `NEXT_STATUSES` en cada render de la tabla de incidencias. Mejora marginal pero justificada por ejecutarse en cada fila de la tabla.

3. **`products-page-client.tsx` — Nivel de stock derivado**
   ```tsx
   const stockLevels = useMemo(() => {
     return new Map(products.map(p => [p.id, stockLevelClass(p.current_stock)]));
   }, [products]);
   ```
   **Beneficio**: `stockLevelClass` se llama por cada producto en cada render. Con `useMemo` solo se recalcula cuando cambia `products`. Implementación recomendada.

---

## 3. Decisiones en el Backend

### 3.1 Inventario de endpoints

| # | Método | Ruta | Tipo | Autenticación | Fuente datos | Coste estimado | Frecuencia | Estabilidad datos |
|---|---|---|---|---|---|---|---|---|
| 1 | GET | `/inventory/products` | Lectura | No | SQLModel (Postgres) | **Alto** — recorre todos los activos y calcula `SUM(entries) - SUM(exits)` por cada uno | Alta (dashboard) | Baja (cambia con cada orden) |
| 2 | GET | `/inventory/products/{id}` | Lectura | No | SQLModel (Postgres) | **Medio** — consulta activo + agregación de entradas/salidas | Media (detalle) | Baja |
| 3 | GET | `/inventory/orders` | Lectura | No | SQLModel (Postgres) | **Alto** — 2 joins y ordenación | Media (historial) | Baja |
| 4 | GET | `/suppliers` | Lectura | JWT | TinyDB | **Bajo-Medio** — lectura completa de tabla + filtros en Python | Alta (directorio) | Baja (CRUD manual) |
| 5 | GET | `/suppliers/{id}` | Lectura | JWT | TinyDB | **Bajo** — lookup por doc_id | Baja | Baja |
| 6 | GET | `/api/incidents` | Lectura | JWT | TinyDB | **Medio** — lectura completa + filtros + ordenación | Alta (seguimiento) | Media |
| 7 | GET | `/api/incidents/summary` | Lectura | JWT | TinyDB | **Medio-Alto** — recorre todas las incidencias para agregar counts | Alta (dashboard) | Media |
| 8 | GET | `/api/incidents/{id}` | Lectura | JWT | TinyDB | **Bajo** — lookup | Baja | Media |
| 9 | GET | `/api/incidents/results/export` | Lectura | JWT | Memoria | **Bajo** — devuelve objeto en memoria | Muy baja | N/A |
| 10 | POST | `/inventory/products` | Escritura | JWT | SQLModel | Medio | Baja | — |
| 11 | POST | `/inventory/orders/inbound` | Escritura | JWT | SQLModel | Medio | Baja | — |
| 12 | POST | `/inventory/orders/outbound` | Escritura | JWT | SQLModel | Medio (valida stock) | Baja | — |
| 13 | POST | `/suppliers` | Escritura | JWT | TinyDB | Bajo | Baja | — |
| 14 | PATCH | `/suppliers/{id}/rate` | Escritura | JWT | TinyDB | Bajo | Baja | — |
| 15 | PATCH | `/suppliers/{id}/status` | Escritura | JWT | TinyDB | Bajo | Baja | — |
| 16 | DELETE | `/suppliers/{id}` | Escritura | JWT | TinyDB | Bajo | Baja | — |
| 17 | POST | `/api/incidents` | Escritura | JWT | TinyDB | Bajo | Media | — |
| 18 | PATCH | `/api/incidents/{id}/status` | Escritura | JWT | TinyDB | Bajo | Media | — |
| 19 | POST | `/api/incidents/analyze` | Escritura | JWT | TinyDB | Alto (CSV parsing) | Muy baja | — |
| 20 | POST | `/auth/login` | Escritura | No | TinyDB | Medio (hash) | Alta | — |
| 21 | POST | `/users` | Escritura | No | TinyDB | Bajo | Baja | — |
| 22 | GET | `/auth/me` | Lectura | JWT | TinyDB | Bajo | Alta (cada navegación) | Baja (sesión) |

### 3.2 Endpoints candidatos a caching

Tras aplicar los criterios **coste × frecuencia × estabilidad**, se identifican los siguientes candidatos:

---

#### Candidato 1: `GET /inventory/products` (Inventario — listado de productos)

| Criterio | Valor |
|---|---|
| **Coste de operación** | **Alto**. Por cada producto ejecuta: `SELECT Asset` (todos) + por cada uno `SUM(AssetEntry.quantity)` + `SUM(AssetExit.quantity)`. Con 100+ activos y miles de movimientos, la latencia puede exceder 500ms. |
| **Frecuencia estimada** | Alta. El dashboard de inventario y la página de productos consultan este endpoint en cada carga y tras cada operación. |
| **Estabilidad de datos** | Baja-Media. Los datos cambian con cada orden de entrada/salida, pero estas operaciones son relativamente poco frecuentes (decenas al día, no por minuto). |
| **¿Candidato?** | **Sí**. TTL de 30 segundos permite absorber picos de consultas sin servir datos obsoletos por más de 30s. |

**Estrategia de invalidación**: Al crear una orden de entrada (`POST /inventory/orders/inbound`) o salida (`POST /inventory/orders/outbound`), invalidar la caché de `/inventory/products`.

**TTL propuesto**: 30 segundos.

---

#### Candidato 2: `GET /api/incidents/summary` (Incidencias — resumen ejecutivo)

| Criterio | Valor |
|---|---|
| **Coste de operación** | **Medio-Alto**. Recorre todas las incidencias en TinyDB para calcular counts por estado, origen, categoría y rama. Con cientos de incidencias puede tomar 200-400ms. |
| **Frecuencia estimada** | Alta. El dashboard de incidencias muestra el resumen en la parte superior y se refresca en cada visita y tras cada cambio de estado. |
| **Estabilidad de datos** | Media. Las incidencias se crean y cambian de estado varias veces al día. Un TTL de 60s es aceptable para el resumen ejecutivo. |
| **¿Candidato?** | **Sí**. El resumen es una vista agregada donde la frescura de 60s es perfectamente aceptable para un panel de control. |

**Estrategia de invalidación**: Al crear una incidencia (`POST /api/incidents`) o cambiar su estado (`PATCH /api/incidents/{id}/status`), invalidar la caché de `/api/incidents/summary`.

**TTL propuesto**: 60 segundos.

---

#### Candidato 3: `GET /suppliers` (Directorio de proveedores — listado con filtros)

| Criterio | Valor |
|---|---|
| **Coste de operación** | **Bajo-Medio**. TinyDB lee todo el archivo JSON en memoria y filtra en Python. Con ~50-100 proveedores es rápido (<50ms), pero el coste es la E/S de disco del archivo JSON. |
| **Frecuencia estimada** | Alta. El directorio es la página principal de compras. |
| **Estabilidad de datos** | Baja. Los proveedores se modifican con poca frecuencia (altas, bajas, cambios de tarifa). |
| **¿Candidato?** | **Sí, condicional**. Si el volumen de proveedores crece o la E/S de TinyDB se convierte en cuello de botella. Por ahora el coste no justifica la complejidad, pero se documenta como candidato futuro. |

**Estrategia de invalidación**: Al crear, actualizar o eliminar un proveedor, invalidar la caché de listado.

**TTL propuesto**: 120 segundos (los datos de proveedores cambian con poca frecuencia).

---

### 3.3 Implementación propuesta

Se propone una implementación en dos fases:

#### Fase 1: Caché en memoria con TTL (decorador genérico)

Crear un módulo `services/api/cache.py` con un decorador reutilizable:

```python
# services/api/cache.py
import time
import functools
from typing import Any, Callable

_cache_store: dict[str, tuple[float, Any]] = {}
_cache_ttl: dict[str, float] = {}

def cached(ttl_seconds: float = 60):
    """Decorador para cachear resultados de funciones síncronas en memoria."""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de caché a partir del nombre de la función y argumentos
            key_parts = [func.__name__]
            key_parts.extend(str(a) for a in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            now = time.time()
            if cache_key in _cache_store:
                stored_time, value = _cache_store[cache_key]
                ttl = _cache_ttl.get(cache_key, ttl_seconds)
                if now - stored_time < ttl:
                    return value

            # Calcular valor y almacenar
            value = func(*args, **kwargs)
            _cache_store[cache_key] = (now, value)
            _cache_ttl[cache_key] = ttl_seconds
            return value
        return wrapper
    return decorator

def invalidate_cache(pattern: str | None = None):
    """Invalida entradas de caché que contengan el patrón, o toda la caché si pattern es None."""
    global _cache_store, _cache_ttl
    if pattern is None:
        _cache_store.clear()
        _cache_ttl.clear()
    else:
        keys_to_delete = [k for k in _cache_store if pattern in k]
        for k in keys_to_delete:
            _cache_store.pop(k, None)
            _cache_ttl.pop(k, None)
```

#### Fase 2: Aplicar a endpoints seleccionados

**`GET /inventory/products`** — Cachear la respuesta completa:

```python
from services.api.cache import cached, invalidate_cache

@router.get("/products", response_model=list[AssetResponse])
def list_products(db: Session = Depends(get_supabase_db)):
    # ...existing code...
```

Se añadiría `@cached(ttl_seconds=30)` sobre la función, o se cachearía el resultado de la consulta a BD.

Invalidación en `create_inbound_order` y `create_outbound_order`:
```python
invalidate_cache("list_products")
```

**`GET /api/incidents/summary`** — Cachear el resumen:

```python
@router.get("/summary", response_model=IncidentSummary)
def get_incident_summary(...):
    # ...
```

Invalidación en `create_incident` y `update_incident_status`.

#### Middleware de timing (diagnóstico)

Añadir a `services/api/main.py` para medir latencias reales antes de implementar caché:

```python
import time
import logging
from fastapi import Request

logger = logging.getLogger("api.timing")

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} | {duration:.1f}ms")
    return response
```

---

## 4. Intercambios Reconocidos

### 4.1 Frescura vs. Rendimiento en `GET /inventory/products`

**Decisión**: TTL de 30 segundos para el listado de productos con stock calculado.

**Razonamiento**:
- El stock se calcula como `SUM(entries) - SUM(exits)`. En un almacén con decenas de productos, recalcular esto en cada petición es costoso.
- Las órdenes de entrada/salida son acciones manuales que realiza un operador. No ocurren con alta frecuencia (minutos/horas entre cada una).
- Un TTL de 30 segundos implica que, tras registrar una orden, el usuario podría ver el stock anterior hasta 30 segundos. Esto es aceptable porque:
  - La página de productos muestra un listado general, no una transacción en tiempo real.
  - Tras crear una orden, el usuario es redirigido al listado, y para entonces es muy probable que la caché ya se haya invalidado explícitamente.
  - El detalle individual de producto (`GET /inventory/products/{id}`) **no se cachea**, por lo que la consulta puntual de un activo siempre devuelve datos frescos.

**Intercambio**: Aceptamos hasta 30 segundos de posible desactualización en el listado general a cambio de reducir la carga en la base de datos y acelerar la respuesta del dashboard de inventario.

### 4.2 Frescura vs. Rendimiento en `GET /api/incidents/summary`

**Decisión**: TTL de 60 segundos para el resumen ejecutivo de incidencias.

**Razonamiento**:
- El resumen es una vista agregada (counts por estado, origen, categoría). No muestra datos individuales.
- Los gestores de incidencias no necesitan ver el recuento exacto al segundo; una diferencia de 60 segundos no cambia decisiones operativas.
- Si un usuario cambia el estado de una incidencia, la invalidación explícita refresca el resumen inmediatamente, excepto en el caso de que otro usuario haya creado una incidencia desde otra sesión (en ese caso, hasta 60s de retraso).

**Intercambio**: Aceptamos hasta 60 segundos de posible desfase en los agregados a cambio de reducir la lectura completa de la tabla TinyDB, que escala linealmente con el número de incidencias.

---

## 5. Qué No Se Cacheó y Por Qué

### 5.1 `GET /inventory/orders` (Historial de órdenes)

**Decisión: No cachear.**

**Justificación**:
- Es una consulta que se realiza con menor frecuencia (solo cuando el usuario navega al historial).
- Los resultados ya vienen ordenados por fecha descendente, y la página de historial se usa típicamente para consultar una orden específica tras crearla.
- El coste de la consulta es moderado (2 joins), pero al no tener alta frecuencia no justifica la complejidad de invalidación.
- **Si en el futuro** esta consulta se realiza con alta frecuencia (por ejemplo, polling automático), se reconsiderará.

### 5.2 Navegación del website corporativo (`uis/website`)

**Decisión: No se modificó.**

**Justificación**:
- El website (`Hero`, `Services`, `WhyNexova`, etc.) es contenido estático que no cambia entre peticiones. Next.js ya lo maneja eficientemente con SSR.
- Los componentes son ligeros y no realizan cálculos costosos.
- No hay estado de cliente que requiera memoización.

### 5.3 `POST /auth/login`

**Decisión: No cachear.**

**Justificación**:
- Es una operación de escritura (crea sesión/token).
- Los datos son sensibles y específicos del usuario.
- No tendría sentido cachear una credencial o token.

### 5.4 `GET /auth/me` y datos de perfil (`/profiles/me`, `/users/{id}`)

**Decisión: No cachear en backend.**

**Justificación**:
- Son datos **personales y de sesión**. Cachearlos en una clave compartida sería una **fuga de datos**.
- El frontend ya implementa una caché de sesión en localStorage con TTL de 5 minutos (ver `session-cache.ts`), lo cual es correcto porque:
  - La clave de caché está en el navegador del usuario.
  - El TTL es corto (5 min).
  - Se invalida al hacer logout.
- En backend, si se quisiera cachear, habría que hacerlo con clave por usuario (`auth_me:{user_id}`) y TTL muy corto (<30s), pero no aporta beneficio significativo.

### 5.5 `POST /api/incidents/analyze` (Análisis CSV)

**Decisión: No cachear.**

**Justificación**:
- Es una operación de escritura que se ejecuta una vez por archivo subido.
- La frecuencia de uso es muy baja (ocasional, cuando un gestor sube un CSV).
- Aunque el coste de cómputo es alto (parsing de CSV), no hay repetición de la misma consulta.

### 5.6 `GET /api/incidents` con filtros dinámicos

**Decisión: No cachear de forma general.**

**Justificación**:
- Los filtros (status, origin, branch, category) generan muchas combinaciones posibles de clave de caché.
- El riesgo de servir datos incorrectos (incidencias filtradas incorrectamente) supera el beneficio.
- Opción futura: cachear solo la combinación "sin filtros" (listado completo) con TTL de 30s y sin filtros.

---

## 6. Resumen de Acciones Recomendadas

| Prioridad | Acción | Componente/Endpoint | Beneficio esperado | Esfuerzo |
|---|---|---|---|---|
| 🔴 **Alta** | Implementar caché con TTL | `GET /inventory/products` | Reducción de 70-90% en latencia (de ~500ms a <10ms en hits de caché) | 2-3h |
| 🔴 **Alta** | Invalidación de caché en escrituras | `POST /inventory/orders/*` | Consistencia de datos operativa | 1h |
| 🟡 **Media** | Implementar caché con TTL | `GET /api/incidents/summary` | Reducción de 60-80% en latencia | 1-2h |
| 🟡 **Media** | Invalidación de caché en escrituras | `POST /api/incidents`, `PATCH .../status` | Consistencia del resumen | 1h |
| 🟡 **Media** | Añadir middleware de timing | `main.py` (backend) | Visibilidad de latencias reales para decisiones futuras | 0.5h |
| 🟢 **Baja** | Seed de datos para pruebas | `seed_inventory.py` (ampliar) | Volumen realista para medir impacto del caché | 1h |
| 🟢 **Baja** | `useMemo` para `stockLevels` | `products-page-client.tsx` | Mejora marginal en renders | 0.5h |
| 🟢 **Baja** | Caché en `GET /suppliers` | Backend (TinyDB) | Reduce latencia en listado de proveedores | 1h |

**Estado de implementación:**
| Prioridad | Acción | Estado |
|---|---|---|
| 🔴 Alta | Caché en `GET /inventory/products` + invalidación en órdenes | ✅ Implementado |
| 🟡 Media | Caché en `GET /api/incidents/summary` + invalidación | ✅ Implementado |
| 🟡 Media | Middleware de timing en `main.py` | ✅ Implementado |
| 🟢 Baja | Seed de datos de inventario | ✅ Ejecutado (8 activos existentes) |
| 🟢 Baja | `useMemo` para `stockLevels` en frontend | ✅ Implementado |
| 🟢 Baja | Caché en `GET /suppliers` (TTL 120s) + invalidación en escrituras | ✅ Implementado |

---

## 7. Línea Base de Tests (Before)

> **Propósito**: Esta sección registra el estado de los tests **antes** de implementar los cambios propuestos en este informe. Sirve como línea base para comparar tras las modificaciones y verificar que no se introdujeron regresiones.

Los tests se ejecutaron sobre la rama `caching-optimisation` antes de cualquier modificación relacionada con caching.

### 7.1 Backend — API (`services/api`)

**Comando:** `python -m pytest services/api/tests/ -v --tb=no`

| Métrica | Valor |
|---|---|
| **Suite de tests** | `services/api/tests/` (pytest) |
| **Tests totales** | 127 |
| **Tests pasados** | 127 ✅ |
| **Tests fallidos** | 0 ❌ |
| **Tiempo total** | 50.48 s |
| **Warnings** | 3 (deprecaciones, no bloqueantes) |

**Cobertura de archivos de test:**

| Archivo | Tests |
|---|---|
| `tests/test_register.py` | 3 |
| `tests/test_auth.py` | 16 |
| `tests/test_suppliers.py` | 39 |
| `tests/test_incidents.py` | 27 |
| `tests/test_users.py` | 23 |
| `tests/test_users_advanced.py` | 19 |

### 7.2 Frontend — Backoffice (`uis/backoffice`)

**Comando:** `npm test` → `jest --coverage`

| Métrica | Valor |
|---|---|
| **Suite de tests** | Jest |
| **Test suites** | 6 |
| **Tests totales** | 75 |
| **Tests pasados** | 75 ✅ |
| **Tests fallidos** | 0 ❌ |
| **Tiempo total** | 6.77 s |

**Archivos de test:**

| Archivo | Tests |
|---|---|
| `__tests__/formatters.test.ts` | — |
| `__tests__/suppliers-utils.test.ts` | — |
| `__tests__/inventory-components.test.ts` | — |
| `__tests__/incident-utils.test.ts` | — |
| `__tests__/candidate-form.test.ts` | — |
| `__tests__/inventory-api.test.ts` | — |

**Cobertura de código:**

| Archivo | % Stmts | % Branch | % Funcs | % Lines |
|---|---|---|---|---|
| `api-client.ts` | 5.19 | 0 | 0 | 5.19 |
| `auth.ts` | 40 | 0 | 0 | 40 |
| `inventory.ts` | 100 | 100 | 100 | 100 |
| **Global** | **21** | **0** | **35.29** | **21** |

### 7.3 Frontend — Website (`uis/website`)

| Métrica | Valor |
|---|---|
| **Tests** | No hay tests configurados ⏭️ |
| **DevDependencies** | Sin Jest ni framework de testing |

### 7.4 Resumen Global (Before)

| Componente | Tests totales | Pasados | Fallidos | Tiempo |
|---|---|---|---|---|
| Backend API | 127 | 127 ✅ | 0 | 50.48 s |
| Frontend Backoffice | 75 | 75 ✅ | 0 | 6.77 s |
| Frontend Website | — | — ⏭️ | — | — |
| **Total** | **202** | **202 ✅** | **0** | **57.25 s** |

> **Nota**: Esta línea base se actualizará en la sección [8. Línea Base de Tests (After)](#8-línea-base-de-tests-after) una vez implementados los cambios propuestos, para verificar que no se introdujeron regresiones.

---

## 8. Línea Base de Tests (After)

> Tests ejecutados tras implementar los cambios de caching descritos en las secciones anteriores. Resultados comparados contra la línea base de la sección [7](#7-línea-base-de-tests-before).

### 8.1 Backend — API (`services/api`)

**Comando:** `python -m pytest services/api/tests/ -v --tb=no`

| Métrica | Before | After | Diferencia |
|---|---|---|---|
| **Tests totales** | 127 | 127 | Sin cambio |
| **Tests pasados** | 127 ✅ | 127 ✅ | Sin cambio |
| **Tests fallidos** | 0 | 0 | Sin cambio |
| **Tiempo total** | 50.48 s | 50.79 s | +0.31 s |
| **Warnings** | 3 | 3 | Sin cambio |

**Archivos creados o modificados** (sin impacto en tests existentes):
- `services/api/cache.py` — Nuevo módulo de caché ✅
- `services/api/main.py` — Middleware de timing + import de `invalidate_cache` ✅
- `services/api/routers/inventory.py` — Caché en `list_products` + invalidación en órdenes ✅
- `services/api/incidents/service.py` — Caché en `get_incident_summary` + invalidación ✅
- `services/api/routes/suppliers.py` — Caché en `list_suppliers` (TTL 120s) + invalidación en escrituras ✅
- `uis/backoffice/app/backoffice/inventory/products/products-page-client.tsx` — `useMemo` para `stockLevels` ✅

**Tests ajustados por compatibilidad con caché:**
- `services/api/tests/conftest.py` — Se añadió fixture `_clear_cache` (autouse) ✅
- `services/api/tests/test_incident_manager.py` — Se añadió `invalidate_cache()` en `setUp` ✅

### 8.2 Frontend — Backoffice (`uis/backoffice`)

**Comando:** `npm test` → `jest --coverage`

| Métrica | Before | After | Diferencia |
|---|---|---|---|
| **Test suites** | 6 | 6 | Sin cambio |
| **Tests totales** | 75 | 75 | Sin cambio |
| **Tests pasados** | 75 ✅ | 75 ✅ | Sin cambio |
| **Tests fallidos** | 0 | 0 | Sin cambio |
| **Tiempo total** | 6.77 s | 2.15 s | −4.62 s |
| **Cobertura global** | 21% Stmts | 21% Stmts | Sin cambio |

### 8.3 Frontend — Website (`uis/website`)

| Métrica | Before | After | Diferencia |
|---|---|---|---|
| **Tests** | No hay tests configurados ⏭️ | No hay tests configurados ⏭️ | Sin cambio |

### 8.4 Resumen Global (After)

| Componente | Before | After | Diferencia |
|---|---|---|---|
| Backend API | 127 ✅ (50.48s) | 127 ✅ (50.79s) | Sin regresiones |
| Frontend Backoffice | 75 ✅ (6.77s) | 75 ✅ (2.15s) | Sin regresiones |
| Frontend Website | ⏭️ | ⏭️ | — |
| **Total** | **202 ✅ (57.25s)** | **202 ✅ (52.94s)** | **Sin regresiones** ✅

## 9. Criterios de éxito

1. **Latencia**: `GET /inventory/products` debe responder en <50ms en el percentil 95 tras implementar caché (vs. >300ms sin caché con datos realistas).
2. **Consistencia**: Un usuario que crea una orden de entrada debe ver el stock actualizado en <30s (máximo TTL) o inmediatamente si la invalidación funciona correctamente.
3. **Cobertura de invalidación**: Cada endpoint de escritura en inventario debe invalidar las claves de caché relevantes.
4. **Privacidad**: Ningún dato de sesión o personal debe aparecer en claves de caché compartidas.

---

*Fin del informe. Las decisiones documentadas aquí deben ser revisadas tras la implementación y monitorización en producción.*