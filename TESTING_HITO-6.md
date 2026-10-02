# Testing — Hito 6 (Telemetría: Captura Frontend)

## 📋 Resumen

Este documento detalla el plan de pruebas para el **Hito 6: Telemetría — Captura en el frontend**. Las pruebas están organizadas por fases, reflejando el orden de implementación del proyecto.

---

## ⚙️ Nota sobre Supabase / DATABASE_URL

El backend de Nexova depende de Supabase para los endpoints de inventario. Durante las pruebas de la **Fase 1 y Fase 2** de este hito **no se necesita Supabase** — el stub de telemetría funciona de forma totalmente independiente.

Para evitar que el servidor FastAPI falle al arrancar intentando conectar a Supabase, la variable `DATABASE_URL` en el archivo `.env` de la raíz está temporalmente **comentada**:

```bash
# .env (raíz del repositorio)
# DATABASE_URL=postgresql://postgres.zptpkvnhnfgyiwqixjre:...
```

Con esto, `supabase_engine = None` y el router de inventario simplemente no se incluye. El resto de la aplicación (telemetría, auth, suppliers, incidents) funciona con normalidad.

> ⚠️ **Importante:** Al finalizar las pruebas del Hito 6, **hay que descomentar esta línea** para restaurar el funcionamiento del inventario y demás funcionalidades que dependen de Supabase.

---

## 📦 Fase 1 — Endpoint stub en FastAPI

### 🎯 Objetivo

Verificar que el endpoint `POST /telemetry/events` existe, acepta el modelo `TelemetryEvent`, valida el formato del payload y responde `{ "received": N }`.

### 🔧 Prerrequisitos

1. Tener las dependencias instaladas:
   ```bash
   cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
   pip install -r requirements.txt
   ```

2. Tener la variable `TELEMETRY_ENDPOINT` configurada en `.env` (raíz del repositorio):
   ```
   TELEMETRY_ENDPOINT=http://localhost:8000/telemetry/events
   ```

3. Arrancar el servidor FastAPI (puerto 8000):
   ```bash
   cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
   uvicorn main:app --reload --port 8000
   ```

### 🧪 Prueba 1 — Envío exitoso de un lote con 1 evento

```bash
curl -s -X POST http://localhost:8000/telemetry/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventId": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2026-10-02T12:00:00.000Z",
        "sessionId": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "user-42",
        "event_type": "inbound_order_created",
        "schemaVersion": "1.0",
        "requestId": "770e8400-e29b-41d4-a716-446655440002",
        "properties": {
          "office": "valencia",
          "product_id": 1,
          "product_category": "training_kit",
          "programme_id": "ventas-b2b",
          "quantity": 100,
          "unit_cost": 25.50,
          "currency": "EUR",
          "supplier": "Impresiones SL",
          "order_id": 42
        }
      }
    ]
  }' | python3 -m json.tool
```

**✅ Resultado esperado:**
```json
{
    "received": 1
}
```
Código HTTP: **200**

---

### 🧪 Prueba 2 — Lote con múltiples eventos (3 eventos de distinto tipo)

```bash
curl -s -X POST http://localhost:8000/telemetry/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventId": "a0000000-0000-0000-0000-000000000001",
        "timestamp": "2026-10-02T12:00:00.000Z",
        "sessionId": "b0000000-0000-0000-0000-000000000001",
        "userId": "user-1",
        "event_type": "inbound_order_created",
        "schemaVersion": "1.0",
        "requestId": "c0000000-0000-0000-0000-000000000001",
        "properties": {
          "office": "valencia",
          "product_id": 1,
          "product_category": "training_kit",
          "programme_id": "ventas-b2b",
          "quantity": 50,
          "unit_cost": 25.00,
          "currency": "EUR",
          "supplier": "Impresiones SL",
          "order_id": 101
        }
      },
      {
        "eventId": "a0000000-0000-0000-0000-000000000002",
        "timestamp": "2026-10-02T12:05:00.000Z",
        "sessionId": "b0000000-0000-0000-0000-000000000001",
        "userId": "user-1",
        "event_type": "outbound_order_created",
        "schemaVersion": "1.0",
        "requestId": "c0000000-0000-0000-0000-000000000002",
        "properties": {
          "office": "miami",
          "product_id": 3,
          "product_category": "onboarding_equipment",
          "programme_id": "soporte-basico",
          "quantity": 5,
          "currency": "USD",
          "exit_type": "allocation",
          "assigned_to": "agent-17",
          "order_id": 202
        }
      },
      {
        "eventId": "a0000000-0000-0000-0000-000000000003",
        "timestamp": "2026-10-02T12:10:00.000Z",
        "sessionId": "b0000000-0000-0000-0000-000000000001",
        "userId": "user-1",
        "event_type": "navigation_section_entered",
        "schemaVersion": "1.0",
        "requestId": "c0000000-0000-0000-0000-000000000003",
        "properties": {
          "section": "inventory",
          "referrer_section": null,
          "user_role": "operator"
        }
      }
    ]
  }' | python3 -m json.tool
```

**✅ Resultado esperado:**
```json
{
    "received": 3
}
```
Código HTTP: **200**

---

### 🧪 Prueba 3 — Error de validación: evento sin campos obligatorios

```bash
curl -s -X POST http://localhost:8000/telemetry/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventId": "incompleto"
      }
    ]
  }' | python3 -m json.tool
```

**✅ Resultado esperado:** Código HTTP **422** (error de validación Pydantic), con detalle indicando los campos faltantes (`timestamp`, `event_type`, `schemaVersion`, `requestId`, `properties`).

---

### 🧪 Prueba 4 — Error de validación: event_type con formato incorrecto

```bash
curl -s -X POST http://localhost:8000/telemetry/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventId": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2026-10-02T12:00:00.000Z",
        "sessionId": null,
        "userId": null,
        "event_type": "Evento Creado",
        "schemaVersion": "1.0",
        "requestId": "770e8400-e29b-41d4-a716-446655440002",
        "properties": {}
      }
    ]
  }' | python3 -m json.tool
```

**✅ Resultado esperado:** Código HTTP **422** (el patrón `^[a-z]+_[a-z]+$` no permite mayúsculas ni espacios).

---

### 🧪 Prueba 5 — Lote vacío (array de eventos vacío)

```bash
curl -s -X POST http://localhost:8000/telemetry/events \
  -H "Content-Type: application/json" \
  -d '{"events": []}' | python3 -m json.tool
```

**✅ Resultado esperado:**
```json
{
    "received": 0
}
```
Código HTTP: **200**

---

### 🧪 Prueba 6 — Verificación en los logs del servidor

Mientras realizas las pruebas anteriores, en la terminal donde corre `uvicorn` deberías ver líneas como:

```
INFO:api.telemetry:Telemetry batch received: 1 event(s) — inbound_order_created
INFO:api.telemetry:Telemetry batch received: 3 event(s) — inbound_order_created, outbound_order_created, navigation_section_entered
INFO:     127.0.0.1:54321 - "POST /telemetry/events HTTP/1.1" 200
```

---

### 🧪 Prueba 7 — Comprobar que la URL se lee desde variable de entorno

Verifica que el backend use la variable `TELEMETRY_ENDPOINT` desde `.env`:

```bash
grep TELEMETRY_ENDPOINT /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/.env
```

**✅ Resultado esperado:**
```
TELEMETRY_ENDPOINT=http://localhost:8000/telemetry/events
```

Y que no esté hardcodeada en el código:

```bash
grep -rn "telemetry/events" /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/ \
  --include="*.py" | grep -v "os.getenv" | grep -v TELEMETRY_ENDPOINT | grep -v ".env"
```

**✅ Resultado esperado:** Solo deben aparecer referencias a la variable de entorno o al archivo `.env`, no URLs literales.

---

### 🧪 Prueba 8 — Comprobar que el frontend tiene su variable de entorno

```bash
cat /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/uis/backoffice/.env.local
```

**✅ Resultado esperado:**
```
NEXT_PUBLIC_TELEMETRY_ENDPOINT=http://localhost:8000/telemetry/events
```

---

---

## 📊 Resultados de los tests automáticos (Fase 1)

Los tests se ejecutaron con un script Python (`test_telemetry_stub.py`) que usa `FastAPI TestClient` — sin necesidad de servidor en ejecución.

### Resumen

| Total | ✅ Pasados | ❌ Fallados |
|-------|-----------|------------|
| 7     | **7**     | **0**      |

### Detalle de cada prueba

| # | Test | Resultado | Verifica |
|---|------|-----------|----------|
| 1 | Envío exitoso de 1 evento | ✅ `{"received": 1}` | Endpoint acepta evento bien formado |
| 2 | Lote con 3 eventos de distinto tipo | ✅ `{"received": 3}` | Endpoint acepta múltiples eventos simultáneos |
| 3 | Evento incompleto sin campos obligatorios | ✅ **422** | Pydantic rechaza eventos con campos faltantes |
| 4 | `event_type` con formato incorrecto | ✅ **422** | Validación de patrón `^[a-z]+(_[a-z]+)+$` funciona |
| 5 | Lote vacío (`{"events": []}`) | ✅ `{"received": 0}` | Endpoint tolera array vacío |
| 6 | Lote con 10 eventos | ✅ `{"received": 10}` | Conteo correcto de N eventos |
| 7 | Contenido no JSON (texto plano) | ✅ **422** | Rechaza payloads malformados |

### Nota sobre el patrón regex de `event_type`

Durante las pruebas se detectó que los `event_type` del plan de telemetría usan múltiples guiones bajos (ej. `inbound_order_created`, `stock_threshold_triggered`). El patrón original `^[a-z]+_[a-z]+$` solo permitía **exactamente un guion bajo**. Se corrigió a `^[a-z]+(_[a-z]+)+$` para aceptar uno o más segmentos. ⚙️

---

## ✅ Checklist Fase 1 — Resultados

| # | Criterio | Estado |
|---|----------|--------|
| 1 | El endpoint `POST /telemetry/events` existe y responde 200 con `{"received": N}` | ✅ |
| 2 | Acepta un lote de 1 evento devolviendo `{"received": 1}` | ✅ |
| 3 | Acepta un lote de múltiples eventos devolviendo `{"received": N}` | ✅ |
| 4 | Rechaza con 422 eventos sin campos obligatorios | ✅ |
| 5 | Rechaza con 422 `event_type` con formato incorrecto | ✅ |
| 6 | Acepta lote vacío (`{"events": []}`) → `{"received": 0}` | ✅ |
| 7 | Los logs del servidor muestran cuántos eventos y qué `event_type` se recibieron | ✅ |
| 8 | La URL del endpoint se lee desde `TELEMETRY_ENDPOINT` — no está hardcodeada | ✅ |
| 9 | El frontend tiene `NEXT_PUBLIC_TELEMETRY_ENDPOINT` en `.env.local` | ✅ |

**Todos los criterios cumplidos.** 🎉

---

## 🚀 Fases posteriores (para referencia)

| Fase | Descripción | Archivos |
|------|-------------|----------|
| **Fase 2** | TelemetryService en frontend (cola local, batch+debounce, sendBeacon, backoff) | `uis/backoffice/lib/telemetry.ts` |
| **Fase 3** | Instrumentación de métricas obligatorias + piso técnico transversal | `uis/backoffice/` (múltiples componentes) |
| **Act. adicional** | Web Vitals + eventos de autenticación | `uis/backoffice/` |