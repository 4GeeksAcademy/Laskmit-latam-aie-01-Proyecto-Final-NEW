from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.database import get_suppliers_table
    from services.api.models import (
        SupplierCategory,
        SupplierCountry,
        SupplierCreate,
        SupplierRateUpdate,
        SupplierResponse,
        SupplierStatusUpdate,
    )
    from services.api.auth import dependencies as auth_deps
except ModuleNotFoundError:
    from database import get_suppliers_table
    from models import (
        SupplierCategory,
        SupplierCountry,
        SupplierCreate,
        SupplierRateUpdate,
        SupplierResponse,
        SupplierStatusUpdate,
    )
    from auth import dependencies as auth_deps  # type: ignore[no-redef]

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _to_response(document: Document) -> SupplierResponse:
    # TinyDB usa doc_id; aquí lo mapeamos al campo id de la API.
    payload = dict(document)
    payload["id"] = document.doc_id
    return SupplierResponse.model_validate(payload)


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, current_user: Document = Depends(auth_deps.get_current_user)) -> SupplierResponse:
    # Crea proveedor nuevo y registra updated_at desde el backend.
    suppliers_table = get_suppliers_table()
    now = datetime.now(timezone.utc)

    payload = supplier.model_dump(mode="json")
    payload["updated_at"] = now.isoformat()

    created_id = suppliers_table.insert(payload)
    created_doc = suppliers_table.get(doc_id=created_id)
    if created_doc is None:
        raise HTTPException(status_code=500, detail="Failed to create supplier.")

    return _to_response(created_doc)


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    country: SupplierCountry | None = Query(default=None),
    category: SupplierCategory | None = Query(default=None),
    current_user: Document = Depends(auth_deps.get_current_user),
) -> list[SupplierResponse]:
    # Listado completo con filtros opcionales por país y categoría.
    suppliers_table = get_suppliers_table()
    documents = list(suppliers_table)

    filtered_docs: list[Document] = []
    for document in documents:
        if country is not None and document.get("country") != country.value:
            continue
        if category is not None and category.value not in document.get("categories", []):
            continue
        filtered_docs.append(document)

    return [_to_response(document) for document in filtered_docs]


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, current_user: Document = Depends(auth_deps.get_current_user)) -> SupplierResponse:
    # Recupera detalle por ID o responde 404 si no existe.
    suppliers_table = get_suppliers_table()
    document = suppliers_table.get(doc_id=supplier_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    return _to_response(document)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate, current_user: Document = Depends(auth_deps.get_current_user)) -> SupplierResponse:
    # Actualiza tarifa y refresca updated_at para trazabilidad.
    suppliers_table = get_suppliers_table()
    existing = suppliers_table.get(doc_id=supplier_id)

    if existing is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    now = datetime.now(timezone.utc)
    suppliers_table.update(
        {
            "monthly_rate": payload.monthly_rate,
            "updated_at": now.isoformat(),
        },
        doc_ids=[supplier_id],
    )

    updated = suppliers_table.get(doc_id=supplier_id)
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update supplier rate.")

    return _to_response(updated)


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate, current_user: Document = Depends(auth_deps.get_current_user)) -> SupplierResponse:
    # Cambia únicamente el estado operativo del proveedor.
    suppliers_table = get_suppliers_table()
    existing = suppliers_table.get(doc_id=supplier_id)

    if existing is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    suppliers_table.update(
        {
            "status": payload.status.value,
        },
        doc_ids=[supplier_id],
    )

    updated = suppliers_table.get(doc_id=supplier_id)
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to update supplier status.")

    return _to_response(updated)


@router.delete("/{supplier_id}", status_code=status.HTTP_200_OK)
def delete_supplier(supplier_id: int, current_user: Document = Depends(auth_deps.get_current_user)) -> dict[str, str]:
    # Borra proveedor del directorio; si no existe retorna 404.
    suppliers_table = get_suppliers_table()
    existing = suppliers_table.get(doc_id=supplier_id)

    if existing is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    suppliers_table.remove(doc_ids=[supplier_id])
    return {"message": "Supplier deleted."}
