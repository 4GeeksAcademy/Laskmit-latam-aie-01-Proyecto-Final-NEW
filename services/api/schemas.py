"""Schemas Pydantic para inventario (separados de los modelos ORM).

Ningún endpoint devuelve un objeto SQLModel directamente.
Todas las respuestas usan estos schemas Pydantic.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ── Asset (activo) ──────────────────────────────────────────────────


class AssetCreate(BaseModel):
    name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    category: Literal["hardware", "peripherals", "office_supplies", "training_materials"]
    office: Literal["Valencia", "Miami"]


class AssetResponse(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    office: str
    current_stock: int  # Calculado: SUM(entries) - SUM(exits)


# ── AssetEntry (orden de entrada) ───────────────────────────────────


class AssetEntryCreate(BaseModel):
    asset_id: int
    quantity: int = Field(gt=0)
    supplier: str = Field(min_length=1)
    office: Literal["Valencia", "Miami"]


class AssetEntryResponse(BaseModel):
    id: int
    asset_id: int
    quantity: int
    supplier: str
    office: str
    created_at: datetime
    user_uuid: str


# ── AssetExit (orden de salida) ─────────────────────────────────────


class AssetExitCreate(BaseModel):
    asset_id: int
    quantity: int = Field(gt=0)
    exit_type: Literal["allocation", "consumption"]
    assigned_to: str | None = None
    office: Literal["Valencia", "Miami"]

    @model_validator(mode="after")
    def validate_assigned_to(self) -> AssetExitCreate:
        if self.exit_type == "allocation" and not self.assigned_to:
            raise ValueError("assigned_to es obligatorio cuando exit_type es 'allocation'.")
        if self.exit_type == "consumption" and self.assigned_to is not None:
            raise ValueError("assigned_to debe ser nulo cuando exit_type es 'consumption'.")
        return self


class AssetExitResponse(BaseModel):
    id: int
    asset_id: int
    quantity: int
    exit_type: str
    assigned_to: str | None
    office: str
    created_at: datetime
    user_uuid: str


# ── Orden combinada (para listado GET /inventory/orders) ────────────


class OrderResponse(BaseModel):
    id: int
    order_type: Literal["inbound", "outbound"]
    asset_id: int
    asset_name: str
    asset_sku: str
    quantity: int
    office: str
    created_at: datetime
    user_uuid: str
    # Campos específicos de entrada
    supplier: str | None = None
    # Campos específicos de salida
    exit_type: str | None = None
    assigned_to: str | None = None