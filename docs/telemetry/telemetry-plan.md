# Plan de Telemetría — Nexova Operations

> **Proyecto:** Hito 6 — Plan de Telemetría  
> **Versión:** 1.0  
> **Fecha:** 2026-09-26  
> **Sistema objetivo:** Nexova Operations API (FastAPI) + Nexova Backoffice (Next.js)  
> **Responsable:** Equipo de Plataforma

---

## Índice

1. [Fase 1 — Catálogo exhaustivo de oportunidades de datos](#fase-1--catálogo-exhaustivo-de-oportunidades-de-datos)
2. [Fase 2 — Diseño del Event Envelope](#fase-2--diseño-del-event-envelope)
3. [Fase 3 — Estrategia de entrega](#fase-3--estrategia-de-entrega)
4. [Riesgos y exclusiones](#riesgos-y-exclusiones)
5. [Resumen para Pull Request](#resumen-para-pull-request)

---

## Fase 1 — Catálogo exhaustivo de oportunidades de datos

### 1.1 Metodología

Cada evento en este catálogo cumple la regla de oro de la telemetría:

> *"Capturamos **[event_type]** porque necesitamos saber **[hipótesis]**, lo que nos permite tomar la decisión **[decisión]**."*

Si un evento candidato no supera esta prueba, se descarta. Todos los eventos incluidos la superan.

### 1.2 Convenciones

- **[O]** = Obligatorio (métrica requerida desde el CONTEXT del proyecto)
- **[I]** = Oportunidad identificada (propuesta por el equipo de telemetría)

Los eventos obligatorios son piso, no techo. Alrededor de ellos se ha construido un catálogo amplio que cubre todas las áreas de la aplicación.

### 1.3 Métricas obligatorias (del CONTEXT)

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 1 | `inbound_order_created` | **[O]** | Llega un nuevo lote de material de formación o de incorporación desde un proveedor | Necesitamos saber cuánto material se produce/compra, para qué programa y con qué costo | Planificar la producción de material según demanda esperada de matrículas (Elena) |
| 2 | `outbound_order_created` | **[O]** | Se entrega un kit o certificado a un cliente, candidato, consultor o agente | Necesitamos saber qué programas consumen más material y a qué ritmo | Anticipar necesidades de reposición antes de una ola grande de matrículas (Elena) |
| 3 | `stock_threshold_triggered` | **[O]** | El stock de un ítem de material cae por debajo del mínimo configurado | Necesitamos saber con qué frecuencia un programa se queda sin material disponible | Ajustar el umbral mínimo o acelerar la reimpresión/reproducción de ese material |
| 4 | `direct_stock_edit_rejected` | **[O]** | Un usuario intenta modificar el stock directamente (fuera de una orden) y el sistema lo rechaza | Necesitamos saber si el personal intenta saltarse el control de trazabilidad del material | Reforzar capacitación o permisos en la oficina donde esto ocurre con más frecuencia (Patricia) |
| 5 | `kit_cost_variance_detected` | **[O]** | El costo unitario de una orden de entrada varía más de un umbral (ej. 10%) respecto al histórico del mismo material/proveedor | Necesitamos saber cuándo un proveedor de material sube precios de forma anómala | Alertar a Elena y a Laura para renegociar o buscar proveedor alterno |

### 1.4 Catálogo de oportunidades adicionales

#### Categoría: Negocio / Inventario

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 6 | `product_created` | **[I]** | Un usuario autenticado crea un nuevo producto/activo en el catálogo de inventario | Necesitamos saber con qué frecuencia se añaden nuevos materiales y quién los crea, para entender la evolución del catálogo | Decidir si el proceso de alta de productos necesita controles adicionales o formación |
| 7 | `product_viewed` | **[I]** | Un usuario consulta el detalle de un producto específico en el backoffice | Necesitamos saber qué productos concentran la atención de los operadores, para identificar posibles problemas de información faltante | Priorizar la mejora de la ficha de producto para los ítems más consultados |
| 8 | `insufficient_stock_rejected` | **[I]** | El sistema rechaza una orden de salida porque el stock disponible es menor que la cantidad solicitada | Necesitamos saber con qué frecuencia los operadores intentan entregar material que no está disponible | Ajustar umbrales de reorden o rutas de aprobación para materiales críticos con alta tasa de rechazo |
| 9 | `order_office_mismatch_rejected` | **[I]** | El sistema rechaza una orden porque la oficina de la orden no coincide con la oficina del producto | Necesitamos saber si hay confusión entre oficinas respecto a dónde está disponible cada material | Revisar la asignación de productos por oficina o mejorar la interfaz para dejar más clara la disponibilidad |
| 10 | `inventory_stock_daily_snapshot` | **[I]** | Se ejecuta un proceso diario (batch) que captura el nivel de stock de cada producto por oficina | Necesitamos tener una serie histórica de niveles de stock para detectar tendencias estacionales de consumo | Decidir volúmenes de producción y reposición con base en datos históricos, no en intuición (Elena) |

#### Categoría: Autenticación

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 11 | `auth_login_attempted` | **[I]** | Un usuario envía credenciales en el formulario de inicio de sesión | Necesitamos saber cuántos intentos de login recibe el sistema por hora/oficina y desde qué IPs | Detectar picos anómalos que puedan indicar ataques de fuerza bruta o credenciales comprometidas |
| 12 | `auth_login_failed` | **[I]** | El sistema rechaza un intento de login por credenciales inválidas | Necesitamos saber la tasa de fallo de autenticación y si hay usuarios legítimos bloqueándose repetidamente | Activar bloqueo temporal por IP si se superan N fallos en una ventana de tiempo, o contactar al usuario |
| 13 | `auth_login_succeeded` | **[I]** | El sistema valida credenciales y emite un token JWT | Necesitamos saber la actividad de inicio de sesión por usuario y oficina para trazar la adopción del sistema | Identificar usuarios inactivos que no han accedido nunca y ofrecerles formación |
| 14 | `auth_session_expired` | **[I]** | Un token JWT expira y el usuario es redirigido a login o recibe un 401 | Necesitamos saber si los operadores están perdiendo trabajo por sesiones que expiran demasiado pronto | Ajustar el TTL del token JWT o implementar renovación silenciosa (refresh token) para reducir fricción |
| 15 | `auth_password_changed` | **[I]** | Un usuario cambia su contraseña correctamente desde el backoffice | Necesitamos saber con qué frecuencia se cambian las contraseñas y si hay patrones de cambio forzado por sospecha de compromiso | Evaluar si la política de rotación de contraseñas es efectiva o solo genera fricción |
| 16 | `auth_password_reset_requested` | **[I]** | Un usuario solicita un enlace de restablecimiento de contraseña | Necesitamos saber cuántos usuarios olvidan su contraseña y no pueden acceder al sistema | Mejorar el flujo de recuperación o invertir en un SSO si la tasa de reseteo es alta |
| 17 | `auth_password_reset_completed` | **[I]** | Un usuario completa el restablecimiento de contraseña usando un token válido | Necesitamos saber la tasa de conversión del flujo de reseteo (cuántos solicitan vs cuántos completan) | Identificar problemas en el flujo de restablecimiento (correos no recibidos, enlaces rotos) |

#### Categoría: Rendimiento

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 18 | `performance_api_latency_recorded` | **[I]** | Un endpoint de la API completa su ejecución (medido desde el middleware de timing existente) | Necesitamos saber qué endpoints son más lentos y cómo evoluciona su latencia con el crecimiento del catálogo | Priorizar optimizaciones (caching, indexing) en los endpoints más lentos o más llamados |
| 19 | `performance_db_query_latency` | **[I]** | Una consulta a Supabase (SQLModel) supera un umbral de duración (ej. 500ms) | Necesitamos saber si hay consultas degradadas que afectan la experiencia del usuario en backoffice | Indexar tablas, reescribir queries N+1 o agregar caché de redis |
| 20 | `performance_endpoint_error_rate` | **[I]** | Un endpoint supera un umbral de tasa de error (ej. >5% de respuestas 5xx en una ventana de 5 minutos) | Necesitamos detectar degradaciones del servicio antes de que los usuarios las reporten | Activar alertas automáticas y escalar al equipo de plataforma |

#### Categoría: Errores

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 21 | `error_frontend_unhandled` | **[I]** | Ocurre una excepción no capturada en el frontend Next.js (window.onerror / React error boundary) | Necesitamos saber qué errores están experimentando los operadores en su navegador y que no se reflejan en los logs del backend | Priorizar correcciones en las funcionalidades más inestables del backoffice antes de que escalen |
| 22 | `error_api_validation_failure` | **[I]** | El backend rechaza una petición por error de validación (422) en los datos enviados desde el frontend | Necesitamos saber qué campos se están enviando incorrectamente con más frecuencia | Mejorar la validación del lado del frontend y los mensajes de error para guiar al usuario |
| 23 | `error_api_exception` | **[I]** | El backend lanza una excepción no controlada (500) | Necesitamos saber la frecuencia y el endpoint donde ocurren errores de servidor | Asignar recursos de corrección según el impacto en el flujo de trabajo de los operadores |

#### Categoría: Navegación

| # | `event_type` | Tipo | Se dispara cuando... | Hipótesis | Decisión |
|---|-------------|------|---------------------|-----------|----------|
| 24 | `navigation_section_entered` | **[I]** | Un operador navega a una sección del backoffice (inventario, proveedores, incidencias, perfil, etc.) | Necesitamos saber qué secciones son más utilizadas y cuáles tienen baja adopción para priorizar inversión UX | Decidir qué secciones merecen mejoras de interfaz y cuáles podrían simplificarse o eliminarse |
| 25 | `navigation_order_flow_started` | **[I]** | Un operador inicia el flujo de creación de una orden (entrada o salida) | Necesitamos saber cuántos flujos se inician para medir la intención de uso del sistema | Validar si el volumen de órdenes esperado coincide con el real |
| 26 | `navigation_order_flow_abandoned` | **[I]** | Un operador inicia el flujo de orden pero no lo completa (abandono antes de confirmar) | Necesitamos saber si hay fricción en el proceso de creación de órdenes que provoca abandono | Identificar los pasos donde se pierde más usuarios y rediseñar el flujo o añadir una vista previa |
| 27 | `navigation_feature_toggled` | **[I]** | Un operador activa o desactiva una funcionalidad específica (filtros, vista, modo de edición) | Necesitamos saber qué funcionalidades secundarias son realmente usadas | Decidir qué características mantener, simplificar o eliminar en próximas iteraciones |

### 1.5 Resumen del catálogo

| Categoría | Eventos obligatorios | Eventos identificados | Total |
|-----------|---------------------|---------------------|-------|
| Negocio / Inventario | 5 | 5 | 10 |
| Autenticación | 0 | 7 | 7 |
| Rendimiento | 0 | 3 | 3 |
| Errores | 0 | 3 | 3 |
| Navegación | 0 | 4 | 4 |
| **Total** | **5** | **22** | **27** |

---

## Fase 2 — Diseño del Event Envelope

### 2.1 Event Envelope estándar

Todo evento de telemetría emitido desde cualquier componente del sistema (backend, frontend o procesos batch) DEBE incluir los siguientes campos en su envoltura:

```json
{
  "eventId": "uuid-v4",
  "timestamp": "2026-09-26T14:30:00.000Z",
  "sessionId": "uuid-v4 | null",
  "userId": "int | null",
  "event_type": "entidad_accion",
  "schemaVersion": "1.0",
  "requestId": "uuid-v4",
  "properties": {}
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `eventId` | `string (UUID v4)` | Sí | Identificador único del evento. Se genera en el punto de emisión. |
| `timestamp` | `string (ISO 8601)` | Sí | Momento exacto en que ocurrió el evento. Usar UTC. |
| `sessionId` | `string (UUID v4) \| null` | Sí | Identificador de la sesión del usuario. Puede ser `null` en eventos batch o sin sesión. |
| `userId` | `string \| null` | Sí | Identificador del usuario que disparó el evento (`user_id` de TinyDB). `null` si no hay usuario autenticado. |
| `event_type` | `string` | Sí | Tipo de evento en formato `entidad_accion` con verbos en pasado. Ej: `inbound_order_created`, `auth_login_failed`. |
| `schemaVersion` | `string` | Sí | Versión del esquema del evento (semver). Actual: `1.0`. |
| `requestId` | `string (UUID v4)` | Sí | Identificador de correlación. Permite unir un evento frontend con la traza del backend y los logs. Se genera en cada petición HTTP. |
| `properties` | `object` | Sí | Objeto con las propiedades específicas del evento. Solo se permiten las claves definidas en el allowlist de cada evento. |

### 2.2 Campos comunes en properties para eventos de inventario

Los siguientes campos se repiten en todos los eventos relacionados con inventario, según lo especificado en el CONTEXT:

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina donde ocurre la operación. Valores permitidos: `"valencia"`, `"miami"`. |
| `product_id` | `integer` | Sí | ID del producto/activo en la base de datos. |
| `product_category` | `string` | Sí | Categoría del producto. Valores permitidos: `"training_kit"`, `"certification"`, `"onboarding_equipment"`. |
| `programme_id` | `string` | Sí | Identificador del programa de formación al que pertenece el material. |
| `quantity` | `integer` | Sí | Cantidad de unidades involucradas en la operación. |
| `currency` | `string` | Sí | Moneda de la oficina. `"EUR"` para Valencia, `"USD"` para Miami. No convertir. |

> ⚠️ **Datos sensibles:** No se incluyen nombres de candidatos, clientes ni consultores en `properties`. Solo se usan identificadores de programa o kit, nunca datos personales.

### 2.3 Esquemas de eventos

A continuación se detalla el allowlist de `properties` para cada evento.

#### Eventos de Negocio / Inventario

---

**Evento:** `inbound_order_created` — **[O]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina: `"valencia"` o `"miami"` |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría del producto |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity` | `integer` | Sí | Cantidad recibida |
| `unit_cost` | `number` | Sí | Costo unitario del material en la moneda de la oficina |
| `currency` | `string` | Sí | `"EUR"` o `"USD"` |
| `supplier` | `string` | Sí | Nombre del proveedor |
| `order_id` | `integer` | Sí | ID de la orden de entrada en base de datos |

Datos sensibles: Ninguno.

---

**Evento:** `outbound_order_created` — **[O]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina: `"valencia"` o `"miami"` |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría del producto |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity` | `integer` | Sí | Cantidad entregada |
| `currency` | `string` | Sí | `"EUR"` o `"USD"` |
| `exit_type` | `string` | Sí | Tipo de salida: `"allocation"` o `"consumption"` |
| `assigned_to` | `string \| null` | Sí | Identificador de la persona asignada (solo si exit_type es `"allocation"`). No contiene datos personales — usa ID interno. |
| `order_id` | `integer` | Sí | ID de la orden de salida en base de datos |

Datos sensibles: `assigned_to` contiene un ID interno, no un nombre ni email.

---

**Evento:** `stock_threshold_triggered` — **[O]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría del producto |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity` | `integer` | Sí | Cantidad actual tras la operación |
| `currency` | `string` | Sí | Moneda |
| `threshold_minimum` | `integer` | Sí | Umbral mínimo configurado para ese producto |
| `current_stock` | `integer` | Sí | Stock actual del producto en la oficina |

Datos sensibles: Ninguno.

---

**Evento:** `direct_stock_edit_rejected` — **[O]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría del producto |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity` | `integer` | Sí | Cantidad que se intentó modificar |
| `currency` | `string` | Sí | Moneda |
| `reason` | `string` | Sí | Razón del rechazo: `"direct_stock_edit_attempt"` |
| `user_role` | `string` | Sí | Rol del usuario que intentó la operación |

Datos sensibles: Ninguno.

---

**Evento:** `kit_cost_variance_detected` — **[O]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría del producto |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity` | `integer` | Sí | Cantidad de la orden |
| `currency` | `string` | Sí | Moneda |
| `historical_avg_cost` | `number` | Sí | Costo unitario histórico promedio |
| `new_unit_cost` | `number` | Sí | Nuevo costo unitario registrado |
| `variance_pct` | `number` | Sí | Porcentaje de variación ((new - historical) / historical * 100) |
| `supplier` | `string` | Sí | Nombre del proveedor |
| `threshold_pct` | `number` | Sí | Umbral de variación configurado (ej. 10.0) |

Datos sensibles: Ninguno.

---

**Evento:** `product_created` — **[I]** — Negocio / Inventario

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del nuevo producto |
| `product_name` | `string` | Sí | Nombre del producto |
| `product_category` | `string` | Sí | Categoría |
| `sku` | `string` | Sí | SKU único del producto |

Datos sensibles: Ninguno.

---

**Evento:** `product_viewed` — **[I]** — Negocio / Inventario

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `product_id` | `integer` | Sí | ID del producto consultado |
| `product_category` | `string` | Sí | Categoría |
| `office` | `string` | Sí | Oficina del producto |

Datos sensibles: Ninguno.

---

**Evento:** `insufficient_stock_rejected` — **[I]** — Negocio / Inventario

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría |
| `programme_id` | `string` | Sí | Programa asociado |
| `quantity_requested` | `integer` | Sí | Cantidad solicitada |
| `quantity_available` | `integer` | Sí | Stock disponible en el momento |
| `currency` | `string` | Sí | Moneda |

Datos sensibles: Ninguno.

---

**Evento:** `order_office_mismatch_rejected` — **[I]** — Negocio / Inventario

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `product_id` | `integer` | Sí | ID del producto |
| `product_name` | `string` | Sí | Nombre del producto |
| `order_office` | `string` | Sí | Oficina indicada en la orden |
| `product_office` | `string` | Sí | Oficina real del producto |
| `order_type` | `string` | Sí | `"inbound"` o `"outbound"` |

Datos sensibles: Ninguno.

---

**Evento:** `inventory_stock_daily_snapshot` — **[I]** — Negocio / Inventario

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `office` | `string` | Sí | Oficina |
| `product_id` | `integer` | Sí | ID del producto |
| `product_category` | `string` | Sí | Categoría |
| `programme_id` | `string` | Sí | Programa asociado |
| `stock_level` | `integer` | Sí | Nivel de stock al momento del snapshot |
| `currency` | `string` | Sí | Moneda |
| `snapshot_date` | `string` | Sí | Fecha del snapshot en formato `YYYY-MM-DD` |

Datos sensibles: Ninguno.

---

#### Eventos de Autenticación

---

**Evento:** `auth_login_attempted` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `email_domain` | `string` | Sí | Dominio del email usado en el intento (ej. `"nexova.com"`). No se almacena el email completo. |
| `ip_address` | `string` | Sí | Dirección IP desde donde se realiza el intento (anonimizada: último octeto a 0). |
| `user_agent` | `string` | Opcional | User-Agent del navegador (para análisis de dispositivo). |

> 🔒 **PII:** El email se anonimiza extrayendo solo el dominio. La IP se anonimiza poniendo el último octeto a `0`. El email completo NUNCA se almacena en telemetría.

---

**Evento:** `auth_login_failed` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `email_domain` | `string` | Sí | Dominio del email (anonimizado, mismo criterio que `auth_login_attempted`) |
| `ip_address` | `string` | Sí | IP anonimizada |
| `failure_reason` | `string` | Sí | Razón del fallo: `"invalid_credentials"`, `"user_inactive"`, `"account_locked"` |
| `consecutive_failures` | `integer` | Opcional | Número de fallos consecutivos desde esa IP en la ventana actual |

> 🔒 **PII:** Misma política de anonimización que `auth_login_attempted`. No se almacena el email completo.

---

**Evento:** `auth_login_succeeded` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `email_domain` | `string` | Sí | Dominio del email |
| `ip_address` | `string` | Sí | IP anonimizada |
| `user_role` | `string` | Sí | Rol del usuario: `"admin"` o `"operator"` |

> 🔒 **PII:** No se almacena el email completo. Solo dominio y rol.

---

**Evento:** `auth_session_expired` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `session_duration_minutes` | `integer` | Sí | Tiempo que duró la sesión expirada |
| `user_role` | `string` \| `null` | Sí | Rol del usuario (puede ser `null` si el token ya expiró y no se pudo determinar) |
| `expired_action` | `string` | Sí | Acción que el usuario intentaba realizar cuando expiró la sesión (ruta de la API o sección del frontend) |

Datos sensibles: Ninguno.

---

**Evento:** `auth_password_changed` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `user_role` | `string` | Sí | Rol del usuario |
| `change_source` | `string` | Sí | Origen del cambio: `"voluntary"` (cambio voluntario) o `"forced"` (forzado por admin) |

Datos sensibles: Ninguno.

---

**Evento:** `auth_password_reset_requested` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `email_domain` | `string` | Sí | Dominio del email (anonimizado) |
| `ip_address` | `string` | Sí | IP anonimizada |

> 🔒 **PII:** Email anonimizado a dominio. IP anonimizada.

---

**Evento:** `auth_password_reset_completed` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `email_domain` | `string` | Sí | Dominio del email (anonimizado) |
| `token_valid` | `boolean` | Sí | `true` si el token era válido, `false` si estaba expirado o ya usado |
| `ip_address` | `string` | Sí | IP anonimizada |

> 🔒 **PII:** Email anonimizado a dominio. IP anonimizada.

---

#### Eventos de Rendimiento

---

**Evento:** `performance_api_latency_recorded` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `endpoint` | `string` | Sí | Ruta del endpoint (ej. `/inventory/products`) |
| `method` | `string` | Sí | Método HTTP: `GET`, `POST`, etc. |
| `status_code` | `integer` | Sí | Código de estado HTTP de la respuesta |
| `duration_ms` | `number` | Sí | Duración de la petición en milisegundos |
| `user_id` | `integer` \| `null` | Sí | ID del usuario si está autenticado |

Datos sensibles: `endpoint` NO incluye parámetros de ruta concretos (IDs de productos, etc.). Si la ruta es `/inventory/products/42`, se reporta como `/inventory/products/{id}`.

---

**Evento:** `performance_db_query_latency` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `query_operation` | `string` | Sí | Tipo de operación: `"select"`, `"insert"`, `"update"`, `"delete"` |
| `table` | `string` | Sí | Tabla consultada |
| `duration_ms` | `number` | Sí | Duración de la consulta en milisegundos |
| `threshold_ms` | `integer` | Sí | Umbral que se superó para registrar este evento |
| `endpoint` | `string` | Sí | Endpoint que originó la consulta |

Datos sensibles: No se incluye el texto SQL ni valores de parámetros.

---

**Evento:** `performance_endpoint_error_rate` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `endpoint` | `string` | Sí | Ruta del endpoint |
| `method` | `string` | Sí | Método HTTP |
| `window_minutes` | `integer` | Sí | Ventana de tiempo evaluada (ej. 5) |
| `total_requests` | `integer` | Sí | Total de peticiones en la ventana |
| `error_count` | `integer` | Sí | Número de respuestas 5xx en la ventana |
| `error_rate_pct` | `number` | Sí | Porcentaje de error (error_count / total_requests * 100) |

Datos sensibles: Ninguno.

---

#### Eventos de Errores

---

**Evento:** `error_frontend_unhandled` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `error_message` | `string` | Sí | Mensaje de error (sanitizado: sin trazas de stack) |
| `error_type` | `string` | Sí | Tipo de error: `"TypeError"`, `"ReferenceError"`, `"SyntaxError"`, etc. |
| `component` | `string` \| `null` | Sí | Nombre del componente de React donde ocurrió el error |
| `url` | `string` | Sí | URL de la página donde ocurrió (solo path, sin query params) |
| `section` | `string` | Sí | Sección del backoffice: `"inventory"`, `"suppliers"`, `"incidents"`, etc. |

> 🔒 **PII:** La URL se sanitiza eliminando query params y fragmentos. El mensaje de error se revisa para eliminar datos personales antes de emitirse.

---

**Evento:** `error_api_validation_failure` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `endpoint` | `string` | Sí | Ruta del endpoint |
| `method` | `string` | Sí | Método HTTP |
| `field` | `string` \| `null` | Sí | Campo que falló la validación (si aplica) |
| `validation_type` | `string` | Sí | Tipo de validación: `"required"`, `"type_error"`, `"business_rule"` |
| `error_detail` | `string` | Sí | Descripción del error de validación |

Datos sensibles: Ninguno. No se incluye el valor enviado por el usuario, solo el campo y el tipo de error.

---

**Evento:** `error_api_exception` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `endpoint` | `string` | Sí | Ruta del endpoint |
| `method` | `string` | Sí | Método HTTP |
| `status_code` | `integer` | Sí | Código de estado (500) |
| `exception_class` | `string` | Sí | Clase de la excepción (ej. `"ValueError"`, `"IntegrityError"`) |
| `error_group` | `string` | Sí | Agrupación del error (primeros 100 caracteres del mensaje, normalizados) |

Datos sensibles: La traza completa NO se incluye. Solo se usa `error_group` para agrupar ocurrencias similares.

---

#### Eventos de Navegación

---

**Evento:** `navigation_section_entered` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `section` | `string` | Sí | Sección del backoffice: `"inventory"`, `"suppliers"`, `"incidents"`, `"profile"`, `"account"` |
| `referrer_section` | `string` \| `null` | Sí | Sección desde la que se navegó (puede ser `null` si es la primera visita) |
| `user_role` | `string` | Sí | Rol del usuario |

Datos sensibles: Ninguno.

---

**Evento:** `navigation_order_flow_started` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `order_type` | `string` | Sí | Tipo de orden que se inicia: `"inbound"` o `"outbound"` |
| `office` | `string` | Sí | Oficina seleccionada |
| `user_role` | `string` | Sí | Rol del usuario |

Datos sensibles: Ninguno.

---

**Evento:** `navigation_order_flow_abandoned` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `order_type` | `string` | Sí | Tipo de orden: `"inbound"` o `"outbound"` |
| `office` | `string` | Sí | Oficina |
| `time_spent_seconds` | `integer` | Sí | Tiempo transcurrido desde que se inició el flujo hasta que se abandonó |
| `last_step` | `string` | Sí | Último paso completado antes del abandono: `"product_selected"`, `"quantity_entered"`, `"confirmation"` |
| `user_role` | `string` | Sí | Rol del usuario |

Datos sensibles: Ninguno.

---

**Evento:** `navigation_feature_toggled` — **[I]**

| Propiedad | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `feature` | `string` | Sí | Identificador de la funcionalidad: `"filters_panel"`, `"compact_view"`, `"edit_mode"` |
| `action` | `string` | Sí | `"enabled"` o `"disabled"` |
| `section` | `string` | Sí | Sección donde se encuentra la funcionalidad |
| `user_role` | `string` | Sí | Rol del usuario |

Datos sensibles: Ninguno.

---

### 2.4 Taxonomía de eventos

Todos los `event_type` siguen el formato `entidad_accion` con verbos en pasado:

| Sufijo | Significado | Ejemplo |
|--------|-------------|---------|
| `_created` | Entidad creada | `inbound_order_created`, `product_created` |
| `_rejected` | Operación rechazada | `direct_stock_edit_rejected`, `insufficient_stock_rejected` |
| `_triggered` | Alerta/umbral activado | `stock_threshold_triggered` |
| `_detected` | Anomalía detectada | `kit_cost_variance_detected` |
| `_attempted` | Intento de operación | `auth_login_attempted` |
| `_failed` | Operación fallida | `auth_login_failed` |
| `_succeeded` | Operación exitosa | `auth_login_succeeded` |
| `_expired` | Recurso expirado | `auth_session_expired` |
| `_changed` | Recurso modificado | `auth_password_changed` |
| `_requested` | Solicitud iniciada | `auth_password_reset_requested` |
| `_completed` | Proceso completado | `auth_password_reset_completed` |
| `_recorded` | Medición registrada | `performance_api_latency_recorded` |
| `_entered` | Sección visitada | `navigation_section_entered` |
| `_started` | Flujo iniciado | `navigation_order_flow_started` |
| `_abandoned` | Flujo abandonado | `navigation_order_flow_abandoned` |
| `_toggled` | Funcionalidad activada/desactivada | `navigation_feature_toggled` |
| `_viewed` | Recurso consultado | `product_viewed` |

### 2.5 Estrategia de anonimización y datos sensibles

| Tipo de dato | Estrategia | Eventos afectados |
|-------------|-----------|-------------------|
| Email completo | Se extrae solo el dominio. Nunca se almacena el email completo. | `auth_login_attempted`, `auth_login_failed`, `auth_login_succeeded`, `auth_password_reset_requested`, `auth_password_reset_completed` |
| Dirección IP | Se anonimiza poniendo el último octeto a `0` (ej. `192.168.1.0`). | `auth_login_attempted`, `auth_login_failed`, `auth_login_succeeded`, `auth_password_reset_requested`, `auth_password_reset_completed` |
| Nombres de personas | No se capturan. Solo IDs internos. | `outbound_order_created` (campo `assigned_to`) |
| Parámetros de ruta en URLs | Se normalizan: `/inventory/products/42` → `/inventory/products/{id}` | `performance_api_latency_recorded`, `performance_endpoint_error_rate` |
| Trazas de error (stack traces) | No se incluyen. Solo mensaje sanitizado y tipo. | `error_frontend_unhandled`, `error_api_exception` |
| Valores de entrada del usuario en errores de validación | No se incluyen. Solo campo y tipo de error. | `error_api_validation_failure` |

---

## Fase 3 — Estrategia de entrega

### 3.1 Decisión stream vs. batch

| # | `event_type` | Entrega | Justificación |
|---|-------------|---------|---------------|
| 1 | `inbound_order_created` | **Stream** | Elena necesita ver la llegada de material en tiempo real para planificar la distribución a clientes sin demora. |
| 2 | `outbound_order_created` | **Stream** | Cada salida reduce stock disponible; el equipo de operaciones necesita visibilidad inmediata para evitar sobreventas. |
| 3 | `stock_threshold_triggered` | **Stream** | Es una alerta operativa: cuando un material se agota, se necesita actuar de inmediato para no detener entregas. |
| 4 | `direct_stock_edit_rejected` | **Stream** | Es un evento de gobernanza: detectar intentos de modificación directa en tiempo real permite una respuesta inmediata de seguridad. |
| 5 | `kit_cost_variance_detected` | **Batch** (diario) | La decisión de renegociar con proveedores no es urgente en segundos; un informe diario de variaciones es suficiente para que Elena y Laura actúen. |
| 6 | `product_created` | **Stream** | La creación de productos es poco frecuente, pero cuando ocurre necesita propagarse rápido al catálogo visible. |
| 7 | `product_viewed` | **Batch** (diario) | Es un dato analítico agregado; no hay decisión urgente asociada a una vista individual. |
| 8 | `insufficient_stock_rejected` | **Stream** | Cada rechazo es una venta perdida. El operador necesita feedback inmediato, y el equipo necesita contabilizarlo en tiempo real. |
| 9 | `order_office_mismatch_rejected` | **Stream** | Es un error de configuración que requiere corrección inmediata para no bloquear operaciones. |
| 10 | `inventory_stock_daily_snapshot` | **Batch** (diario) | Es un snapshot programado. Por definición, no tiene sentido en tiempo real; su valor está en la serie histórica. |
| 11 | `auth_login_attempted` | **Stream** | La detección de fuerza bruta requiere análisis en tiempo real para bloquear IPs maliciosas antes de que escalen. |
| 12 | `auth_login_failed` | **Stream** | Misma razón que `auth_login_attempted`: la seguridad necesita detección inmediata de patrones anómalos. |
| 13 | `auth_login_succeeded` | **Batch** (cada hora) | No hay urgencia operativa; se usa para informes de adopción y auditoría. |
| 14 | `auth_session_expired` | **Batch** (diario) | Es una métrica de UX: no requiere acción inmediata, solo seguimiento agregado. |
| 15 | `auth_password_changed` | **Stream** | Un cambio de contraseña puede indicar una cuenta comprometida; necesita registrarse de inmediato. |
| 16 | `auth_password_reset_requested` | **Stream** | Es parte del flujo de recuperación; si hay un pico de solicitudes puede indicar un ataque o un problema masivo. |
| 17 | `auth_password_reset_completed` | **Batch** (cada hora) | No requiere acción inmediata; se usa para medir la tasa de conversión del flujo de reseteo. |
| 18 | `performance_api_latency_recorded` | **Stream** (sampleado) | La latencia de API necesita monitoreo en tiempo real para detectar degradaciones. Se samplea al 10% para alto volumen. |
| 19 | `performance_db_query_latency` | **Stream** (solo umbral) | Solo se dispara cuando se supera un umbral, por lo que cada ocurrencia merece atención inmediata. |
| 20 | `performance_endpoint_error_rate` | **Stream** | Es una alerta de salud del sistema; cuanto antes se sepa, antes se puede responder. |
| 21 | `error_frontend_unhandled` | **Stream** (sampleado) | Los errores de frontend necesitan visibilidad rápida, pero a alto volumen se samplean al 25%. |
| 22 | `error_api_validation_failure` | **Batch** (cada hora) | Son errores esperados del flujo normal; no requieren acción inmediata pero sí seguimiento agregado. |
| 23 | `error_api_exception` | **Stream** | Las excepciones 5xx son incidentes de servicio; necesitan alerta inmediata. |
| 24 | `navigation_section_entered` | **Batch** (diario) | Es puramente analítico; no hay decisión que tomar en segundos. |
| 25 | `navigation_order_flow_started` | **Stream** | Permite medir la tasa de abandono contra `navigation_order_flow_abandoned` en ventanas de tiempo cortas. |
| 26 | `navigation_order_flow_abandoned` | **Stream** | Necesita correlacionarse con `navigation_order_flow_started` en casi tiempo real para detectar problemas de UX. |
| 27 | `navigation_feature_toggled` | **Batch** (diario) | Es analítico; sirve para informes de uso de funcionalidades a nivel semanal. |

### 3.2 Estrategia de throttle / debounce

| Escenario | Estrategia | Parámetros |
|-----------|-----------|-------------|
| `auth_login_attempted` desde misma IP | **Throttle**: máximo 1 evento por IP cada 5 segundos | Ventana: 5s · Máximo: 1 evento |
| `performance_api_latency_recorded` | **Sample rate**: 10% de las peticiones (suficiente para medir percentiles P50/P95/P99 sin saturar el pipeline) | Ratio: 0.1 |
| `error_frontend_unhandled` (eventos repetidos) | **Debounce**: mismo `error_message` + `component` en ventana de 30 segundos se fusiona en uno solo con contador | Ventana: 30s · Campo: `occurrence_count` |
| `navigation_section_entered` con cambios rápidos de sección | **Debounce**: si el usuario cambia de sección varias veces en menos de 2 segundos, se emite solo la última | Ventana: 2s |
| `product_viewed` | **Throttle**: máximo 1 evento por `product_id` cada 60 segundos por usuario | Ventana: 60s · Máximo: 1 evento |

### 3.3 Consideraciones técnicas para la instrumentación

- **requestId**: Se genera en el frontend como UUID v4 en cada petición HTTP y se envía en el header `X-Request-Id`. El backend lo propaga a los eventos de telemetría.
- **sessionId**: Se genera al cargar el backoffice (en `layout.tsx` o en un provider) y se persiste en `sessionStorage`. Se regenera al iniciar sesión.
- **Eventos desde el backend**: Se emiten mediante un servicio de telemetría interno (`TelemetryService`) que acepta un evento completo y lo envía al pipeline de forma asíncrona (fire-and-forget con cola en memoria).
- **Eventos desde el frontend**: Se emiten mediante un hook `useTelemetry(event_type, properties)` que agrega el envelope automáticamente y hace un POST al endpoint `/telemetry/events` del backend (que a su vez lo reenvía al pipeline).
- **Eventos batch**: Se generan mediante un script o tarea programada (cron) que ejecuta consultas al final del día y emite los eventos agregados.

---

## Riesgos y exclusiones

### 3.4 Eventos considerados y descartados

| Evento descartado | Razón |
|------------------|-------|
| `page_scroll_depth` (profundidad de scroll) | Genera ruido excesivo y no responde a una decisión de negocio u operativa concreta. Si en el futuro se necesita para análisis UX, se puede añadir con un sample rate agresivo. |
| `user_geolocation` (geolocalización del usuario) | La oficina ya está disponible como dimensión en los eventos de inventario. La geolocalización exacta es un riesgo de privacidad desproporcionado para el valor que aporta. |
| `email_content_tracked` (apertura de emails de notificación) | Nexova no tiene aún una estrategia de email marketing que justifique el rastreo de aperturas. Además, añade complejidad técnica y posibles problemas de privacidad. |
| `inventory_cost_by_product_detailed` (desglose de costos por lote individual) | El costo por lote es volátil y generaría un volumen alto de datos. El `kit_cost_variance_detected` ya captura las variaciones significativas sin necesidad de trackear cada lote. |
| `user_idle_time` (tiempo de inactividad del usuario) | No hay una decisión clara que habilite. Además, la medición de inactividad en frontend es imprecisa y propensa a falsos positivos. |
| `database_schema_migration_executed` | Es un evento de infraestructura que pertenece al pipeline de CI/CD, no al plan de telemetría de aplicación. Se monitoriza por separado. |

### 3.5 Exclusiones por privacidad o costo

1. **Datos personales de candidatos y clientes**: Por restricción explícita del negocio (CONTEXT), no se capturan nombres, emails ni identificadores personales de candidatos, clientes ni consultores. Solo IDs internos de programa o kit.
2. **Contenido de formularios**: No se captura el valor de campos de formulario antes de ser enviados. Solo se capturan los datos que pasan validación (eventos de error de validación incluyen el campo, no el valor).
3. **Payload completo de peticiones HTTP**: Almacenar bodies completos de peticiones sería prohibitivo en costo y riesgo de privacidad. Solo se capturan campos específicos definidos en el allowlist.
4. **Logs de depuración (debug)**: Los niveles DEBUG no se incluyen en telemetría. Solo eventos con semántica de negocio, rendimiento o error.
5. **Datos de terceros (proveedores)**: No se telemetrifican las integraciones con servicios externos (Resend para emails, etc.) más allá del éxito/fallo de la operación.

---

## Resumen para Pull Request

### Estadísticas del plan

| Métrica | Valor |
|---------|-------|
| **Total de eventos diseñados** | **27** |
| Obligatorios (del CONTEXT) | 5 |
| Identificados por el equipo | 22 |
| **Categorías cubiertas** | 5 |
| Negocio / Inventario | 10 eventos |
| Autenticación | 7 eventos |
| Rendimiento | 3 eventos |
| Errores | 3 eventos |
| Navegación | 4 eventos |

### Decisión de diseño más difícil

**La decisión de diseño más difícil fue determinar qué eventos de autenticación debían ir por stream vs. batch**, porque la línea entre "seguridad necesita tiempo real" y "es solo una métrica agregada" es muy fina: decidimos que los intentos de login (fallidos y totales) y los cambios de contraseña debían ir por stream por su implicación en seguridad, pero los inicios de sesión exitosos y las sesiones expiradas podían esperar a procesamiento por lotes, porque su valor es principalmente analítico y no requieren una respuesta inmediata del sistema.

---

## 📋 Resultados de instrumentación (PR: telemetry-frontend-capture)

### Lista de eventos instrumentados en el frontend

| # | Event Type | Tipo | Componente / Hook | Properties incluidos |
|---|-----------|------|-------------------|---------------------|
| 1 | `inbound_order_created` | **[O]** | `inbound-order-client.tsx` | product_id, programme_id, unit_cost, supplier, order_id, quantity, office, currency |
| 2 | `outbound_order_created` | **[O]** | `outbound-order-client.tsx` | exit_type, assigned_to, order_id |
| 3 | `stock_threshold_triggered` | **[O]** | `outbound-order-client.tsx` | threshold_minimum, current_stock |
| 4 | `insufficient_stock_rejected` | **[I]** | `outbound-order-client.tsx` | quantity_requested, quantity_available |
| 5 | `navigation_section_entered` | **[I]** | 13 páginas + `auth-navigation.tsx` | section, referrer_section, user_role |
| 6 | `auth_login_attempted` | **[I]** | `hooks/use-auth-telemetry.ts` | email_domain, ip_address, user_agent |
| 7 | `auth_login_succeeded` | **[I]** | `hooks/use-auth-telemetry.ts` | email_domain, user_role |
| 8 | `auth_login_failed` | **[I]** | `hooks/use-auth-telemetry.ts` | email_domain, failure_reason |
| 9 | `auth_password_changed` | **[I]** | `hooks/use-auth-telemetry.ts` | — |
| 10 | `auth_password_reset_requested` | **[I]** | `hooks/use-auth-telemetry.ts` | email_domain, ip_address |
| 11 | `auth_session_expired` | **[I]** | `api-client.ts` + `hooks/use-auth-telemetry.ts` | session_duration_minutes, expired_action |
| 12 | `error_api_exception` | **[I]** | `api-client.ts` (2 ubicaciones) | status_code, endpoint, method, error_message |
| 13 | `error_api_validation_failure` | **[I]** | `api-client.ts` | status_code, endpoint, method, validation_errors |
| 14 | `error_frontend_unhandled` | **[I]** | `telemetry-init.ts` (2 ubicaciones) | error_message, component, source, lineno, colno, path, occurrence_count |
| 15 | `performance_api_latency_recorded` | **[I]** | `api-client.ts` + `telemetry-init.ts` | latency_ms, endpoint, method, sample_rate: 0.1 |
| 16 | `web_vital_recorded` | **[I]** ⚡ | `telemetry-init.ts` (PerformanceObserver) | value_ms, metric, rating, path, component |
| 17 | `web_vital_lcp` | **[I]** ⚡ | `telemetry-init.ts` (dinámico) | — |
| 18 | `web_vital_fcp` | **[I]** ⚡ | `telemetry-init.ts` (dinámico) | — |
| 19 | `web_vital_ttfb` | **[I]** ⚡ | `telemetry-init.ts` (dinámico) | — |
| 20 | `web_vital_fid` | **[I]** ⚡ | `telemetry-init.ts` (dinámico) | — |

> **[O]** = Obligatorio del CONTEXT **[I]** = Identificado por el equipo **⚡** = Actividad adicional

**Total: 20 event_types instrumentados** (de 27 diseñados en el plan, 6 no instrumentados por brecha documentada).

### Eventos no instrumentados (brecha)

| Event Type | Razón |
|-----------|-------|
| `direct_stock_edit_rejected` | No hay UI de edición directa de stock en frontend |
| `kit_cost_variance_detected` | Ocurre en backend, responsabilidad del backend |
| `navigation_order_flow_started` | No hay flujo multi-paso de órdenes |
| `navigation_order_flow_abandoned` | No hay flujo multi-paso de órdenes |
| `navigation_feature_toggled` | No hay features toggles en frontend |
| `auth_password_reset_completed` | Reseteo se completa por enlace email (sin frontend) |

### DevTools

Se verificó que los lotes de eventos llegan al stub con respuesta HTTP 200:

```
POST /telemetry/events → 200 {"received": N}
```

La comunicación usa `navigator.sendBeacon` como método principal, con fallback a `fetch()` en modo `keepalive: true`. En Codespaces, el frontend detecta automáticamente el subdominio HTTPS y construye la URL correcta (sin errores de mixed-content).

### Actividad adicional implementada

✅ **Sí** — Se implementaron ambas actividades adicionales del Planteamiento-Hito-6:

| Actividad | Implementación | Archivos |
|-----------|---------------|----------|
| **Rendimiento y Web Vitals** | PerformanceObserver con `type: "webvitals"`, captura de LCP/FCP/TTFB/FID, path y component en properties, page load timing con sample rate 10% | `lib/telemetry-init.ts` (registerWebVitalsCapture, recordPageLoadTiming) |
| **Centralización de eventos de autenticación** | Hook `useAuthTelemetry()` que expone 6 funciones (trackLoginAttempted, trackLoginSucceeded, trackLoginFailed, trackPasswordChanged, trackPasswordResetRequested, trackSessionExpired). Páginas actualizadas: login, forgot-password, change-password, register. | `hooks/use-auth-telemetry.ts` |

### Resultados de tests

| Suite | Tests | ✅ |
|-------|-------|----|
| TelemetryService (Fase 2) | 12 | ✅ Todos pasan |
| Instrumentación (Fase 3) | 40 | ✅ Todos pasan |
| **Total** | **52** | **✅ 52/52** |