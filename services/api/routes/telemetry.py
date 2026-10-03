"""Router de telemetría — endpoint stub para validación de eventos.

Endpoint temporal POST /telemetry/events que valida el formato del payload
y responde 200 sin persistir nada. En la Fase 3 será reemplazado por la
implementación real con almacenamiento en Supabase.

El modelo Pydantic TelemetryEvent se defne aquí y se reutilizará sin cambios
en la Fase 3 — refleja el envelope estándar del plan de telemetría.
"""
from __future__ import annotations

import logging
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel, Field

load_dotenv()

logger = logging.getLogger("api.telemetry")

# ── Variable de entorno: establecer el patrón desde el inicio ─────
# Aunque el stub no redirige tráfico, la variable se declara aquí para
# que en la Fase 3 baste con cambiar el valor sin tocar el código.
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
    """Respuesta del endpoint stub."""
    received: int


# ── Endpoint stub ──────────────────────────────────────────────────


@router.post("/events", response_model=TelemetryBatchResponse)
async def receive_events(payload: TelemetryBatch):
    """Recibe un lote de eventos de telemetría, valida el formato y responde 200.

    Este es un endpoint stub temporal. No persiste nada — solo registra
    en log la cantidad de eventos recibidos y sus event_type, y devuelve
    {'received': N}.

    En la Fase 3 este mismo endpoint (con el mismo modelo TelemetryEvent)
    se reemplazará por la implementación real con validación completa y
    persistencia en Supabase. El frontend no necesitará ningún cambio
    porque la URL se lee de NEXT_PUBLIC_TELEMETRY_ENDPOINT.
    """
    count = len(payload.events)
    event_types = [e.event_type for e in payload.events]

    logger.info(
        "Telemetry batch received: %d event(s) — %s",
        count,
        ", ".join(event_types),
    )

    return TelemetryBatchResponse(received=count)