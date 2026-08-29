from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
    from services.api.auth import services as auth_services
    from services.api.auth.models import AuthMeResponse, LoginRequest, Token
except ModuleNotFoundError:
    from auth import dependencies as auth_deps  # type: ignore[no-redef]
    from auth import services as auth_services  # type: ignore[no-redef]
    from auth.models import AuthMeResponse, LoginRequest, Token  # type: ignore[no-redef]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest) -> Token:
    """Autentica al usuario y devuelve un token JWT.

    Público. No requiere autenticación previa.
    """
    user_doc = auth_services.authenticate_user(payload.email, payload.password)
    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_deps.create_access_token(user_doc.doc_id)
    return Token(access_token=token)


@router.get("/me", response_model=AuthMeResponse)
def get_me(current_user: Document = Depends(auth_deps.get_current_user)) -> AuthMeResponse:
    """Devuelve email, role y perfil del usuario autenticado.

    Protegida: requiere token JWT válido.
    """
    profile = auth_services.get_profile_by_user_id(current_user.doc_id)

    return AuthMeResponse(
        email=current_user["email"],
        role=current_user["role"],
        profile=profile,
    )