from __future__ import annotations

import json
from contextlib import contextmanager
from typing import Any

from fastapi.testclient import TestClient

from services.api.routes import telemetry


class RecordingConnection:
    def __init__(self) -> None:
        self.executions: list[tuple[Any, dict[str, Any]]] = []

    def execute(self, statement: Any, parameters: dict[str, Any]):
        self.executions.append((statement, parameters))
        row_count = len([key for key in parameters if key.startswith("event_id_")])
        return type("Result", (), {"rowcount": row_count})()


class RecordingEngine:
    def __init__(self) -> None:
        self.connection = RecordingConnection()

    @contextmanager
    def begin(self):
        yield self.connection


def valid_event(**overrides: Any) -> dict[str, Any]:
    event = {
        "eventId": "123e4567-e89b-42d3-a456-426614174000",
        "timestamp": "2026-10-08T12:30:00.000Z",
        "sessionId": "123e4567-e89b-42d3-a456-426614174001",
        "userId": None,
        "event_type": "inbound_order_created",
        "schemaVersion": "1.0",
        "requestId": "123e4567-e89b-42d3-a456-426614174002",
        "properties": {"office": "valencia", "product_id": 42},
    }
    return {**event, **overrides}


def test_mixed_batch_persists_valid_events_with_one_bulk_insert(
    client: TestClient,
    monkeypatch,
) -> None:
    engine = RecordingEngine()
    monkeypatch.setattr(telemetry, "supabase_engine", engine)

    response = client.post(
        "/telemetry/events",
        json={"events": [valid_event(), {**valid_event(), "event_type": "INVALID TYPE"}]},
    )

    assert response.status_code == 200
    assert response.json() == {"received": 2, "stored": 1, "rejected": 1}
    assert len(engine.connection.executions) == 1

    statement, parameters = engine.connection.executions[0]
    assert "INSERT INTO public.telemetry_events" in str(statement)
    assert parameters["event_type_0"] == "inbound_order_created"
    assert parameters["service_0"] == telemetry.TELEMETRY_SERVICE
    assert parameters["user_id_0"] is None
    assert json.loads(parameters["tags_0"]) == {"office": "valencia", "product_id": 42}


def test_email_in_user_id_is_not_persisted(client: TestClient, monkeypatch) -> None:
    engine = RecordingEngine()
    monkeypatch.setattr(telemetry, "supabase_engine", engine)

    response = client.post(
        "/telemetry/events",
        json={"events": [valid_event(userId="operator@nexova.com")]},
    )

    assert response.status_code == 200
    assert response.json() == {"received": 1, "stored": 1, "rejected": 0}
    assert engine.connection.executions[0][1]["user_id_0"] is None


def test_invalid_batch_envelope_is_rejected_without_storage(client: TestClient, monkeypatch) -> None:
    engine = RecordingEngine()
    monkeypatch.setattr(telemetry, "supabase_engine", engine)

    response = client.post("/telemetry/events", json={"events": {"not": "an array"}})

    assert response.status_code == 422
    assert engine.connection.executions == []


def test_valid_events_report_storage_unavailable_as_retryable_error(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(telemetry, "supabase_engine", None)

    response = client.post("/telemetry/events", json={"events": [valid_event()]})

    assert response.status_code == 503
    assert response.json() == {"detail": "Telemetry storage unavailable"}