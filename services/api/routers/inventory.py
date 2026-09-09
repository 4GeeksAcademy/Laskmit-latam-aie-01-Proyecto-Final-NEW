"""Router de inventario — todos los endpoints bajo /inventory."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

try:
    from services.api.auth.dependencies import get_current_user
    from services.api.database import get_supabase_db
    from services.api.models import Asset, AssetEntry, AssetExit
    from services.api.schemas import (
        AssetCreate,
        AssetEntryCreate,
        AssetEntryResponse,
        AssetExitCreate,
        AssetExitResponse,
        AssetResponse,
        OrderResponse,
    )
except ModuleNotFoundError:
    from auth.dependencies import get_current_user  # type: ignore[no-redef]
    from database import get_supabase_db  # type: ignore[no-redef]
    from models import Asset, AssetEntry, AssetExit  # type: ignore[no-redef]
    from schemas import (  # type: ignore[no-redef]
        AssetCreate,
        AssetEntryCreate,
        AssetEntryResponse,
        AssetExitCreate,
        AssetExitResponse,
        AssetResponse,
        OrderResponse,
    )

router = APIRouter(prefix="/inventory", tags=["inventory"])


# ── Helpers ─────────────────────────────────────────────────────────


def _compute_stock(asset_id: int, office: str, db: Session) -> int:
    """Calcula current_stock = SUM(entries) - SUM(exits) para un activo y oficina."""
    total_entries = db.scalar(
        select(func.coalesce(func.sum(AssetEntry.quantity), 0)).where(
            AssetEntry.asset_id == asset_id,
            AssetEntry.office == office,
        )
    )
    total_exits = db.scalar(
        select(func.coalesce(func.sum(AssetExit.quantity), 0)).where(
            AssetExit.asset_id == asset_id,
            AssetExit.office == office,
        )
    )
    return (total_entries or 0) - (total_exits or 0)


# ── Endpoints ───────────────────────────────────────────────────────


@router.get("/products", response_model=list[AssetResponse])
def list_products(db: Session = Depends(get_supabase_db)):
    """Lista todos los activos con current_stock calculado."""
    assets = db.exec(select(Asset)).all()
    result = []
    for asset in assets:
        stock = _compute_stock(asset.id, asset.office, db)
        result.append(
            AssetResponse(
                id=asset.id,
                name=asset.name,
                sku=asset.sku,
                category=asset.category,
                office=asset.office,
                current_stock=stock,
            )
        )
    return result


@router.post("/products", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: AssetCreate,
    db: Session = Depends(get_supabase_db),
    current_user=Depends(get_current_user),
):
    """Crea un nuevo activo (requiere autenticación)."""
    # Verificar SKU único
    existing = db.exec(select(Asset).where(Asset.sku == payload.sku)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un activo con SKU '{payload.sku}'.",
        )

    asset = Asset(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        office=payload.office,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return AssetResponse(
        id=asset.id,
        name=asset.name,
        sku=asset.sku,
        category=asset.category,
        office=asset.office,
        current_stock=0,
    )


@router.get("/products/{asset_id}", response_model=AssetResponse)
def get_product(asset_id: int, db: Session = Depends(get_supabase_db)):
    """Obtiene un activo con su stock actual."""
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activo no encontrado.")

    stock = _compute_stock(asset.id, asset.office, db)
    return AssetResponse(
        id=asset.id,
        name=asset.name,
        sku=asset.sku,
        category=asset.category,
        office=asset.office,
        current_stock=stock,
    )


@router.post("/orders/inbound", response_model=AssetEntryResponse, status_code=status.HTTP_201_CREATED)
def create_inbound_order(
    payload: AssetEntryCreate,
    db: Session = Depends(get_supabase_db),
    current_user=Depends(get_current_user),
):
    """Registra una orden de entrada (requiere autenticación)."""
    asset = db.get(Asset, payload.asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activo con id {payload.asset_id} no encontrado.",
        )

    entry = AssetEntry(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        supplier=payload.supplier,
        office=payload.office,
        user_uuid=str(current_user.doc_id),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return AssetEntryResponse(
        id=entry.id,
        asset_id=entry.asset_id,
        quantity=entry.quantity,
        supplier=entry.supplier,
        office=entry.office,
        created_at=entry.created_at,
        user_uuid=entry.user_uuid,
    )


@router.post("/orders/outbound", response_model=AssetExitResponse, status_code=status.HTTP_201_CREATED)
def create_outbound_order(
    payload: AssetExitCreate,
    db: Session = Depends(get_supabase_db),
    current_user=Depends(get_current_user),
):
    """Registra una orden de salida (requiere autenticación). Valida stock suficiente."""
    asset = db.get(Asset, payload.asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activo con id {payload.asset_id} no encontrado.",
        )

    # Validar stock suficiente
    available = _compute_stock(asset.id, payload.office, db)
    if payload.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for asset '{asset.name}'. "
                f"Available: {available}, requested: {payload.quantity}."
            ),
        )

    exit_order = AssetExit(
        asset_id=payload.asset_id,
        quantity=payload.quantity,
        exit_type=payload.exit_type,
        assigned_to=payload.assigned_to,
        office=payload.office,
        user_uuid=str(current_user.doc_id),
    )
    db.add(exit_order)
    db.commit()
    db.refresh(exit_order)

    return AssetExitResponse(
        id=exit_order.id,
        asset_id=exit_order.asset_id,
        quantity=exit_order.quantity,
        exit_type=exit_order.exit_type,
        assigned_to=exit_order.assigned_to,
        office=exit_order.office,
        created_at=exit_order.created_at,
        user_uuid=exit_order.user_uuid,
    )


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_supabase_db)):
    """Lista todas las órdenes (entradas y salidas) con datos del activo.

    Carga los datos relacionados en la misma consulta para evitar el problema N+1.
    """
    entries = db.exec(
        select(AssetEntry, Asset).join(Asset, AssetEntry.asset_id == Asset.id)
    ).all()
    exits = db.exec(
        select(AssetExit, Asset).join(Asset, AssetExit.asset_id == Asset.id)
    ).all()

    orders: list[OrderResponse] = []

    for entry_row, asset in entries:
        orders.append(
            OrderResponse(
                id=entry_row.id,
                order_type="inbound",
                asset_id=asset.id,
                asset_name=asset.name,
                asset_sku=asset.sku,
                quantity=entry_row.quantity,
                office=entry_row.office,
                created_at=entry_row.created_at,
                user_uuid=entry_row.user_uuid,
                supplier=entry_row.supplier,
                exit_type=None,
                assigned_to=None,
            )
        )

    for exit_row, asset in exits:
        orders.append(
            OrderResponse(
                id=exit_row.id,
                order_type="outbound",
                asset_id=asset.id,
                asset_name=asset.name,
                asset_sku=asset.sku,
                quantity=exit_row.quantity,
                office=exit_row.office,
                created_at=exit_row.created_at,
                user_uuid=exit_row.user_uuid,
                supplier=None,
                exit_type=exit_row.exit_type,
                assigned_to=exit_row.assigned_to,
            )
        )

    # Ordenar por created_at descendente (más reciente primero)
    orders.sort(key=lambda o: o.created_at, reverse=True)
    return orders