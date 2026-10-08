"""Recepción y almacenamiento de lotes de telemetría."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from dotenv import load_dotenv
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import text

try:
    from services.api.database import engine as supabase_engine
except ModuleNotFoundError:
    from database import engine as supabase_engine  # type: ignore[no-redef]

load_dotenv()

logger = logging.getLogger("api.telemetry")

TELEMETRY_SERVICE = os.getenv("TELEMETRY_SERVICE", "nexova-backoffice")
TELEMETRY_ENDPOINT: str = os.getenv("TELEMETRY_ENDPOINT", "")  # noqa: F841

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


# ── Modelo Pydantic del evento ─────────────────────────────────────
# Este modelo refleja el envelope estándar definido en el plan de
# telemetría (docs/telemetry/telemetry-plan.md) y se reutilizará en
# la Fase 3 sin cambios. Los campos marcados como opcionales (None)
# son userId y sessionId, que pueden ser null.
# ───────────────────────────────────────────────────────────────────


class TelemetryEvent(BaseModel):
    """Envelope estándar de un evento de telemetría.

    Todos los eventos del sistema usan esta estructura. Los componentes
    que llaman a track() no pasan eventId, timestamp, sessionId, userId,
    schemaVersion ni requestId manualmente — el TelemetryService los
    genera automáticamente.
    """
    eventId: str = Field(
        ...,
        description="UUID v4 generado en el punto de emisión.",
    )
    timestamp: str = Field(
        ...,
        description="ISO 8601 en UTC del momento exacto de captura.",
    )
    sessionId: str | None = Field(
        None,
        description="UUID de la sesión del usuario. null en batch/sin sesión.",
    )
    userId: str | None = Field(
        None,
        description="ID del usuario autenticado. null si no hay sesión.",
    )
    event_type: str = Field(
        ...,
        description="Tipo de evento en formato 'entidad_accion' (verbos en pasado).",
        pattern=r"^[a-z]+(_[a-z]+)+$",
    )
    schemaVersion: str = Field(
        ...,
        description="Versión del esquema (semver). Actual: 1.0.",
        pattern=r"^\d+\.\d+$",
    )
    requestId: str = Field(
        ...,
        description="UUID de correlación frontend-backend-logs.",
    )
    properties: dict[str, Any] = Field(
        ...,
        description="Payload específico del evento. Solo claves del allowlist.",
    )


class TelemetryBatch(BaseModel):
    """Payload del endpoint: lote de eventos enviados por el frontend."""
    events: list[TelemetryEvent]


class TelemetryBatchResponse(BaseModel):
    """Resumen de aceptación y persistencia del lote."""
    received: int
    stored: int
    rejected: int


def _event_to_row(raw: Any) -> dict[str, Any]:
    event = TelemetryEvent.model_validate(raw)
    timestamp = datetime.fromisoformat(event.timestamp.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ValueError("timestamp must include a timezone")

    user_id = event.userId
    if user_id is not None and "@" in user_id:
        user_id = None

    return {
        "event_id": UUID(event.eventId),
        "timestamp": timestamp.astimezone(timezone.utc),
        "session_id": UUID(event.sessionId) if event.sessionId else None,
        "user_id": user_id,
        "event_type": event.event_type,
        "schema_version": event.schemaVersion,
        "request_id": UUID(event.requestId),
        "tags": json.dumps(event.properties),
        "service": TELEMETRY_SERVICE,
    }


def _bulk_insert(rows: list[dict[str, Any]]) -> int:
    if supabase_engine is None:
        raise RuntimeError("Telemetry database is not configured")

    columns = (
        "event_id", "timestamp", "session_id", "user_id", "event_type",
        "schema_version", "request_id", "tags", "service",
    )
    bind_rows: list[str] = []
    parameters: dict[str, Any] = {}
    for row_index, row in enumerate(rows):
        binds = []
        for column in columns:
            bind_name = f"{column}_{row_index}"
            binds.append(f"CAST(:{bind_name} AS JSONB)" if column == "tags" else f":{bind_name}")
            parameters[bind_name] = row[column]
        bind_rows.append(f"({', '.join(binds)})")

    statement = text(
        "INSERT INTO public.telemetry_events "
        f"({', '.join(columns)}) VALUES {', '.join(bind_rows)}"
    )
    with supabase_engine.begin() as connection:
        result = connection.execute(statement, parameters)

    rowcount = result.rowcount
    return rowcount if rowcount is not None and rowcount >= 0 else len(rows)


@router.post("/events", response_model=TelemetryBatchResponse)
async def receive_events(payload: dict[str, Any] = Body(...)):
    raw_events = payload.get("events")
    if not isinstance(raw_events, list):
        raise HTTPException(status_code=422, detail="'events' must be an array")

    rows: list[dict[str, Any]] = []
    for raw_event in raw_events:
        try:
            rows.append(_event_to_row(raw_event))
        except (ValidationError, ValueError, TypeError):
            continue

    rejected = len(raw_events) - len(rows)
    if rows:
        try:
            from starlette.concurrency import run_in_threadpool

            stored = await run_in_threadpool(_bulk_insert, rows)
        except Exception as error:
            logger.exception("Failed to persist telemetry batch")
            raise HTTPException(status_code=503, detail="Telemetry storage unavailable") from error
    else:
        stored = 0

    logger.info(
        "Telemetry batch processed: received=%d stored=%d rejected=%d",
        len(raw_events),
        stored,
        rejected,
    )

    return TelemetryBatchResponse(received=len(raw_events), stored=stored, rejected=rejected)