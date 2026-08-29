from __future__ import annotations

from datetime import datetime

from passlib.hash import bcrypt
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.database import get_db
except ModuleNotFoundError:
    from database import get_db

try:
    from services.api.auth.models import (
        ProfileDomain,
        ProfileResponse,
        UserDomain,
        UserResponse,
        UserRole,
    )
except ModuleNotFoundError:
    from auth.models import (
        ProfileDomain,
        ProfileResponse,
        UserDomain,
        UserResponse,
        UserRole,
    )


USERS_TABLE = "users"
PROFILES_TABLE = "profiles"


# ──────────────────────────────────────────────
# Funciones auxiliares
# ──────────────────────────────────────────────


def _hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt."""
    return bcrypt.hash(password)


def _verify_password(password: str, hashed: str) -> bool:
    """Verifica una contraseña contra su hash bcrypt."""
    return bcrypt.verify(password, hashed)


def _user_to_response(doc: Document) -> UserResponse:
    """Convierte un documento TinyDB a UserResponse."""
    payload = dict(doc)
    payload["id"] = doc.doc_id
    return UserResponse.model_validate(payload)


def _profile_to_response(doc: Document) -> ProfileResponse:
    """Convierte un documento TinyDB a ProfileResponse."""
    payload = dict(doc)
    payload["id"] = doc.doc_id
    return ProfileResponse.model_validate(payload)


# ──────────────────────────────────────────────
# Servicios de usuario
# ──────────────────────────────────────────────


def create_user(
    email: str,
    password: str,
    name: str | None = None,
    phone: str | None = None,
    address: str | None = None,
    role: UserRole = UserRole.USER,
) -> UserResponse:
    """Crea un nuevo usuario y opcionalmente su perfil.

    Por defecto asigna role='user'. El seed script puede pasar
    role=UserRole.ADMIN para crear el administrador inicial.
    Hashea la contraseña antes de persistir.
    """
    db = get_db()
    users = db.table(USERS_TABLE)

    user_domain = UserDomain(
        email=email,
        hashed_password=_hash_password(password),
        role=role,
        created_at=datetime.utcnow(),
    )
    created_id = users.insert(user_domain.model_dump(mode="json"))
    created_doc = users.get(doc_id=created_id)

    if created_doc is None:
        raise RuntimeError("Failed to create user.")

    # Si se proporcionaron datos de perfil, crearlo vinculado.
    if name or phone or address:
        profiles = db.table(PROFILES_TABLE)
        profile_domain = ProfileDomain(
            user_id=created_id,
            name=name,
            phone=phone,
            address=address,
        )
        profiles.insert(profile_domain.model_dump(mode="json"))

    return _user_to_response(created_doc)


def get_user_by_id(user_id: int) -> UserResponse | None:
    """Obtiene un usuario por su doc_id de TinyDB."""
    users = get_db().table(USERS_TABLE)
    doc = users.get(doc_id=user_id)
    if doc is None:
        return None
    return _user_to_response(doc)


def get_user_by_email(email: str) -> UserResponse | None:
    """Obtiene un usuario por su email."""
    users = get_db().table(USERS_TABLE)
    for doc in users:
        if doc.get("email") == email:
            return _user_to_response(doc)
    return None


def get_user_doc_by_email(email: str) -> Document | None:
    """Obtiene el documento TinyDB crudo de un usuario por email.

    Devuelve el Document (con doc_id) para poder acceder a hashed_password.
    """
    users = get_db().table(USERS_TABLE)
    for doc in users:
        if doc.get("email") == email:
            return doc
    return None


def list_users() -> list[UserResponse]:
    """Lista todos los usuarios."""
    users = get_db().table(USERS_TABLE)
    return [_user_to_response(doc) for doc in users]


def update_user(
    user_id: int,
    email: str | None = None,
    role: UserRole | None = None,
) -> UserResponse | None:
    """Actualiza campos de un usuario.

    Solo email y role son actualizables. Retorna None si no existe.
    """
    users = get_db().table(USERS_TABLE)
    existing = users.get(doc_id=user_id)
    if existing is None:
        return None

    update_data: dict[str, object] = {}
    if email is not None:
        update_data["email"] = email
    if role is not None:
        update_data["role"] = role.value

    if update_data:
        users.update(update_data, doc_ids=[user_id])

    updated = users.get(doc_id=user_id)
    if updated is None:
        return None
    return _user_to_response(updated)


def delete_user(user_id: int) -> bool:
    """Elimina un usuario y su perfil vinculado.

    Retorna True si existía, False si no.
    """
    users = get_db().table(USERS_TABLE)
    existing = users.get(doc_id=user_id)
    if existing is None:
        return False

    # Eliminar perfil vinculado si existe.
    profiles = get_db().table(PROFILES_TABLE)
    for pdoc in profiles:
        if pdoc.get("user_id") == user_id:
            profiles.remove(doc_ids=[pdoc.doc_id])

    users.remove(doc_ids=[user_id])
    return True


def get_user_doc_from_db(user_id: int) -> Document | None:
    """Obtiene el documento TinyDB crudo de un usuario por su doc_id.

    Necesario para dependencies.py que necesita acceder a hashed_password y role.
    """
    users = get_db().table(USERS_TABLE)
    return users.get(doc_id=user_id)


def authenticate_user(email: str, password: str) -> Document | None:
    """Autentica un usuario por email y contraseña.

    Retorna el Document de TinyDB si las credenciales son válidas y el usuario está activo.
    Retorna None si falla.
    """
    doc = get_user_doc_by_email(email)
    if doc is None:
        return None
    if not doc.get("is_active", True):
        return None
    if not _verify_password(password, doc["hashed_password"]):
        return None
    return doc


# ──────────────────────────────────────────────
# Servicios de perfil
# ──────────────────────────────────────────────


def get_profile_by_user_id(user_id: int) -> ProfileResponse | None:
    """Obtiene el perfil de un usuario por su user_id."""
    profiles = get_db().table(PROFILES_TABLE)
    for doc in profiles:
        if doc.get("user_id") == user_id:
            return _profile_to_response(doc)
    return None


def upsert_profile(user_id: int, name: str | None = None, phone: str | None = None, address: str | None = None) -> ProfileResponse:
    """Crea o actualiza el perfil de un usuario.

    Retorna el perfil resultante.
    """
    profiles = get_db().table(PROFILES_TABLE)

    # Buscar perfil existente.
    existing_doc = None
    for doc in profiles:
        if doc.get("user_id") == user_id:
            existing_doc = doc
            break

    update_data: dict[str, object] = {"user_id": user_id}
    if name is not None:
        update_data["name"] = name
    if phone is not None:
        update_data["phone"] = phone
    if address is not None:
        update_data["address"] = address

    if existing_doc is not None:
        # Actualizar existente.
        profiles.update(update_data, doc_ids=[existing_doc.doc_id])
        updated = profiles.get(doc_id=existing_doc.doc_id)
    else:
        # Crear nuevo.
        created_id = profiles.insert(update_data)
        updated = profiles.get(doc_id=created_id)

    if updated is None:
        raise RuntimeError("Failed to upsert profile.")

    return _profile_to_response(updated)