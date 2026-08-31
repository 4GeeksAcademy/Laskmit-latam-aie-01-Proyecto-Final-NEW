from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
    from services.api.auth import services as auth_services
    from services.api.auth.models import UserCreate, UserResponse, UserUpdate
except ModuleNotFoundError:
    from auth import dependencies as auth_deps  # type: ignore[no-redef]
    from auth import services as auth_services  # type: ignore[no-redef]
    from auth.models import UserCreate, UserResponse, UserUpdate  # type: ignore[no-redef]

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> UserResponse:
    """Registra un nuevo usuario.

    Público. El role siempre se asigna como 'user', ignorando cualquier intento de auto-asignarse otro rol.
    Si se incluyen name/phone/address, crea el Profile vinculado en la misma operación.
    """
    # Verificar que el email no exista ya.
    existing = auth_services.get_user_by_email(payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email already registered",
        )

    return auth_services.create_user(
        email=payload.email,
        password=payload.password,
        name=payload.name,
        phone=payload.phone,
        address=payload.address,
    )


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: Document = Depends(auth_deps.get_current_user),
) -> list[UserResponse]:
    """Lista todos los usuarios. Protegida."""
    return auth_services.list_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> UserResponse:
    """Obtiene un usuario por ID. Protegida.

    Solo el propio usuario o un admin pueden acceder.
    """
    if current_user.doc_id != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only view your own profile",
        )

    user = auth_services.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> UserResponse:
    """Actualiza email y/o role de un usuario. Protegida.

    Solo el propio usuario o un admin pueden actualizar.
    Solo un admin puede cambiar el role.
    """
    if current_user.doc_id != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only update your own profile",
        )

    # Solo admin puede cambiar el role.
    if payload.role is not None and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change roles",
        )

    updated = auth_services.update_user(
        user_id=user_id,
        email=payload.email,
        role=payload.role,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> dict[str, str]:
    """Elimina un usuario y su perfil vinculado. Protegida.

    Solo admin puede eliminar usuarios.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users",
        )

    deleted = auth_services.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted."}