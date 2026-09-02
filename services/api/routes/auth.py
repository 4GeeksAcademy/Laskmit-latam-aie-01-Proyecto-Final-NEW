from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
    from services.api.auth import services as auth_services
    from services.api.auth.models import (
        AuthMeResponse,
        ChangePasswordRequest,
        ForgotPasswordRequest,
        LoginRequest,
        PasswordActionResponse,
        ResetPasswordRequest,
        Token,
    )
    from services.api.notifications.resend_client import EmailDeliveryError, send_password_reset_email
except ModuleNotFoundError:
    from auth import dependencies as auth_deps  # type: ignore[no-redef]
    from auth import services as auth_services  # type: ignore[no-redef]
    from auth.models import (  # type: ignore[no-redef]
        AuthMeResponse,
        ChangePasswordRequest,
        ForgotPasswordRequest,
        LoginRequest,
        PasswordActionResponse,
        ResetPasswordRequest,
        Token,
    )
    from notifications.resend_client import EmailDeliveryError, send_password_reset_email  # type: ignore[no-redef]

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

FORGOT_PASSWORD_MESSAGE = "Si esa direccion esta registrada, recibiras un enlace en breve."
PASSWORD_UPDATED_MESSAGE = "Contrasena actualizada correctamente."
INVALID_RESET_TOKEN_MESSAGE = "El enlace de restablecimiento no es valido o ha expirado."


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


@router.post("/forgot-password", response_model=PasswordActionResponse)
def forgot_password(payload: ForgotPasswordRequest) -> PasswordActionResponse:
    """Solicita un enlace sin revelar si la cuenta existe."""
    reset_data = auth_services.create_password_reset_token(str(payload.email))
    if reset_data is not None:
        token, expires_at = reset_data
        try:
            send_password_reset_email(str(payload.email), token, expires_at)
        except EmailDeliveryError:
            auth_services.invalidate_password_reset_token(token)
            logger.warning("Password reset email delivery failed.")

    return PasswordActionResponse(message=FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=PasswordActionResponse)
def reset_password(payload: ResetPasswordRequest) -> PasswordActionResponse:
    """Restablece una contrasena mediante un token de un solo uso."""
    if not auth_services.reset_password(payload.token, payload.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_RESET_TOKEN_MESSAGE,
        )
    return PasswordActionResponse(message=PASSWORD_UPDATED_MESSAGE)


@router.post("/change-password", response_model=PasswordActionResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> PasswordActionResponse:
    """Cambia la contrasena del usuario autenticado."""
    result = auth_services.change_password(
        current_user.doc_id,
        payload.current_password,
        payload.new_password,
    )
    if result == "invalid_current":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena actual no es correcta.",
        )
    if result == "same_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contrasena debe ser diferente de la actual.",
        )
    return PasswordActionResponse(message=PASSWORD_UPDATED_MESSAGE)


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