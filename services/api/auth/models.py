from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────────
# Enumeraciones cerradas
# ──────────────────────────────────────────────


class UserRole(str, Enum):
    """Roles válidos para un usuario del sistema.

    - admin: control total, puede gestionar usuarios y promocionar roles.
    - manager: puede operar con datos del negocio.
    - user: rol básico de acceso.
    """

    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


# ──────────────────────────────────────────────
# Modelos de dominio (TinyDB)
# ──────────────────────────────────────────────


class UserDomain(BaseModel):
    """Representación de un usuario en la tabla TinyDB 'users'.

    No incluye nombre visible ni datos de contacto (van en Profile).
    """

    email: EmailStr
    hashed_password: str
    is_active: bool = True
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProfileDomain(BaseModel):
    """Perfil vinculado 1:1 a un usuario.

    Almacena únicamente datos de contacto y nombre visible.
    """

    user_id: int
    name: str | None = None
    phone: str | None = None
    address: str | None = None


# ──────────────────────────────────────────────
# Esquemas de request / response
# ──────────────────────────────────────────────


class UserCreate(BaseModel):
    """Payload para POST /users.

    No permite especificar role: siempre se asigna 'user'.
    Admite campos opcionales de perfil para crear Profile en la misma operación.
    """

    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class UserResponse(BaseModel):
    """Respuesta pública de un usuario (nunca expone la contraseña)."""

    id: int
    email: EmailStr
    is_active: bool
    role: UserRole
    created_at: datetime


class UserUpdate(BaseModel):
    """Payload para PUT /users/{id}.

    Solo admin puede cambiar role.
    """

    email: EmailStr | None = None
    role: UserRole | None = None


class ProfileCreate(BaseModel):
    user_id: int
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class PasswordActionResponse(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthMeResponse(BaseModel):
    """Respuesta de GET /auth/me: credenciales + perfil."""

    email: EmailStr
    role: UserRole
    profile: ProfileResponse | None = None