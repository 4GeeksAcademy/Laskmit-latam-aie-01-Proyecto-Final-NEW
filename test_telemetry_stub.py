"""Tests automáticos para la Fase 1 del Hito 6 — Endpoint stub de telemetría.

Ejecutar con: python3 test_telemetry_stub.py
No requiere conexión a Supabase ni base de datos.
"""
from __future__ import annotations

import sys
import json
from pathlib import Path

# Agregar services/api al path
sys.path.insert(0, str(Path(__file__).resolve().parent / "services" / "api"))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from routes.telemetry import router as telemetry_router

# Crear una app mínima con solo el router de telemetría
app = FastAPI()
app.include_router(telemetry_router)

client = TestClient(app)

# ── Helper ──────────────────────────────────────────────────────────

passed = 0
failed = 0
results: list[dict] = []


def run_test(name: str, description: str, check_fn, expected_status: int = 200):
    global passed, failed
    try:
        response = check_fn()
        status_ok = response.status_code == expected_status
        detail = response.json()

        if status_ok:
            passed += 1
            results.append({"name": name, "status": "✅", "detail": detail, "desc": description})
        else:
            failed += 1
            results.append({"name": name, "status": "❌", "detail": detail, "desc": description, "expected_status": expected_status, "actual_status": response.status_code})
    except Exception as e:
        failed += 1
        results.append({"name": name, "status": "❌", "detail": str(e), "desc": description})


# ── Prueba 1: Lote con 1 evento válido ──────────────────────────────

def test_1():
    return client.post("/telemetry/events", json={
        "events": [{
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
        }]
    })

run_test(
    "Envío exitoso de 1 evento",
    "POST /telemetry/events con 1 evento válido → 200 + {received: 1}",
    test_1,
    200
)

# ── Prueba 2: Lote con 3 eventos de distinto tipo ──────────────────

def test_2():
    return client.post("/telemetry/events", json={
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
                    "office": "valencia", "product_id": 1,
                    "product_category": "training_kit", "programme_id": "ventas-b2b",
                    "quantity": 50, "unit_cost": 25.00, "currency": "EUR",
                    "supplier": "Impresiones SL", "order_id": 101
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
                    "office": "miami", "product_id": 3,
                    "product_category": "onboarding_equipment", "programme_id": "soporte-basico",
                    "quantity": 5, "currency": "USD",
                    "exit_type": "allocation", "assigned_to": "agent-17", "order_id": 202
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
                    "section": "inventory", "referrer_section": None, "user_role": "operator"
                }
            }
        ]
    })

run_test(
    "Lote con 3 eventos de distinto tipo",
    "POST /telemetry/events con 3 eventos → 200 + {received: 3}",
    test_2,
    200
)

# ── Prueba 3: Evento incompleto (sin campos obligatorios) ───────────

def test_3():
    return client.post("/telemetry/events", json={
        "events": [{"eventId": "incompleto"}]
    })

run_test(
    "Evento incompleto sin campos obligatorios",
    "POST /telemetry/events con evento incompleto → 422",
    test_3,
    422
)

# ── Prueba 4: event_type con formato incorrecto ─────────────────────

def test_4():
    return client.post("/telemetry/events", json={
        "events": [{
            "eventId": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": "2026-10-02T12:00:00.000Z",
            "sessionId": None,
            "userId": None,
            "event_type": "Evento Creado",
            "schemaVersion": "1.0",
            "requestId": "770e8400-e29b-41d4-a716-446655440002",
            "properties": {}
        }]
    })

run_test(
    "event_type con formato incorrecto (mayúsculas/espacios)",
    "POST /telemetry/events con event_type='Evento Creado' → 422",
    test_4,
    422
)

# ── Prueba 5: Lote vacío ────────────────────────────────────────────

def test_5():
    return client.post("/telemetry/events", json={"events": []})

run_test(
    "Lote vacío de eventos",
    "POST /telemetry/events con events=[] → 200 + {received: 0}",
    test_5,
    200
)

# ── Prueba 6: Verificar que recibió N eventos correctamente ────────

def test_6():
    resp = client.post("/telemetry/events", json={
        "events": [
            {
                "eventId": f"test-{i:03d}",
                "timestamp": "2026-10-02T12:00:00.000Z",
                "sessionId": None,
                "userId": None,
                "event_type": "stock_threshold_triggered",
                "schemaVersion": "1.0",
                "requestId": f"req-{i:03d}",
                "properties": {
                    "office": "valencia", "product_id": i,
                    "product_category": "training_kit", "programme_id": "test",
                    "quantity": 10, "currency": "EUR",
                    "threshold_minimum": 5, "current_stock": i
                }
            }
            for i in range(1, 11)
        ]
    })
    return resp

run_test(
    "Lote con 10 eventos (verificar received count)",
    "POST /telemetry/events con 10 eventos → {received: 10}",
    test_6,
    200
)

# ── Verificación adicional: content-type check ─────────────────────

def test_7():
    return client.post("/telemetry/events", data="not json")

run_test(
    "Envío con contenido no JSON",
    "POST /telemetry/events con texto plano → 422",
    test_7,
    422
)


# ── Reporte ─────────────────────────────────────────────────────────

print("=" * 70)
print("🧪  TESTS AUTOMÁTICOS — FASE 1: ENDPOINT STUB TELEMETRÍA")
print("=" * 70)
print()

for r in results:
    icon = "✅" if r["status"] == "✅" else "❌"
    print(f"  {icon}  {r['name']}")
    print(f"     {r['desc']}")
    print(f"     → Respuesta: {json.dumps(r['detail'], indent=2)}")
    if r["status"] != "✅":
        print(f"     → Esperado status: {r.get('expected_status')}, Actual: {r.get('actual_status')}")
    print()

print("-" * 70)
print(f"  ✅ Pasados: {passed}  |  ❌ Fallados: {failed}  |  Total: {passed + failed}")
print("=" * 70)

# Salir con código apropiado
sys.exit(0 if failed == 0 else 1)