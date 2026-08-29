from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
    from services.api.auth import services as auth_services
    from services.api.auth.models import ProfileResponse, ProfileUpdate
except ModuleNotFoundError:
    from auth import dependencies as auth_deps  # type: ignore[no-redef]
    from auth import services as auth_services  # type: ignore[no-redef]
    from auth.models import ProfileResponse, ProfileUpdate  # type: ignore[no-redef]

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: Document = Depends(auth_deps.get_current_user),
) -> ProfileResponse:
    """Devuelve el perfil del usuario autenticado. Protegida."""
    profile = auth_services.get_profile_by_user_id(current_user.doc_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> ProfileResponse:
    """Actualiza name, phone y/o address del perfil del usuario autenticado. Protegida.

    Solo el dueño del perfil puede modificarlo.
    """
    return auth_services.upsert_profile(
        user_id=current_user.doc_id,
        name=payload.name,
        phone=payload.phone,
        address=payload.address,
    )