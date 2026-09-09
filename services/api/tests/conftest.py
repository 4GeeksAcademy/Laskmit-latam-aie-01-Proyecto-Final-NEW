from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from services.api.auth import dependencies as auth_deps
from services.api.auth import services as auth_services
from services.api.main import app


@pytest.fixture
def db() -> Generator[TinyDB, None, None]:
    """Base de datos TinyDB en memoria, aislada por test."""
    _db = TinyDB(storage=MemoryStorage)
    yield _db
    _db.close()


@pytest.fixture(autouse=True)
def override_db(db: TinyDB) -> Generator[None, None, None]:
    """Reemplaza get_db() en auth.services con la DB en memoria.

    Se aplica automáticamente a todos los tests.
    """
    import services.api.auth.services as svc

    original_get_db = svc.get_db
    svc.get_db = lambda: db  # type: ignore[method-assign]
    yield
    svc.get_db = original_get_db


@pytest.fixture
def client(db: TinyDB) -> TestClient:
    """Cliente HTTP de prueba con secret key fija."""
    auth_deps.SECRET_KEY = "test-secret-key-for-testing"
    return TestClient(app)


@pytest.fixture
def test_user_data() -> tuple[str, str]:
    """Credenciales del usuario de prueba regular."""
    return "test@example.com", "password123"


@pytest.fixture
def test_user(
    db: TinyDB,
    client: TestClient,
    test_user_data: tuple[str, str],
) -> tuple[str, str]:
    """Crea un usuario regular en la DB y retorna (email, password)."""
    email, password = test_user_data
    existing = auth_services.get_user_by_email(email)
    if existing is None:
        auth_services.create_user(email=email, password=password)
    return email, password


@pytest.fixture
def admin_user(
    db: TinyDB,
    client: TestClient,
) -> tuple[str, str]:
    """Crea un usuario admin en la DB y retorna (email, password)."""
    email = "admin@example.com"
    password = "adminpass123"
    existing = auth_services.get_user_by_email(email)
    if existing is None:
        from services.api.auth.models import UserRole
        auth_services.create_user(email=email, password=password, role=UserRole.ADMIN)
    return email, password


@pytest.fixture
def user_token(client: TestClient, test_user: tuple[str, str]) -> str:
    """Token JWT del usuario regular."""
    email, password = test_user
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def admin_token(client: TestClient, admin_user: tuple[str, str]) -> str:
    """Token JWT del usuario admin."""
    email, password = admin_user
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def user_headers(user_token: str) -> dict[str, str]:
    """Headers Authorization para el usuario regular."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    """Headers Authorization para el usuario admin."""
    return {"Authorization": f"Bearer {admin_token}"}


# ──────────────────────────────────────────────
# Helpers públicos para tests
# ──────────────────────────────────────────────


def create_expired_token(user_id: int) -> str:
    """Genera un JWT con expiración en el pasado."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    return jwt.encode(payload, auth_deps.SECRET_KEY, algorithm=auth_deps.ALGORITHM)


def create_malformed_token() -> str:
    """Genera un string que no es un JWT válido."""
    return "not.a.valid.jwt"


def create_token_with_secret(user_id: int, secret_key: str) -> str:
    """Genera un JWT firmado con una clave secreta específica."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    }
    return jwt.encode(payload, secret_key, algorithm=auth_deps.ALGORITHM)


def create_token_with_sub(sub: str, secret_key: str | None = None) -> str:
    """Genera un JWT con un sub arbitrario (no necesariamente numérico)."""
    if secret_key is None:
        secret_key = auth_deps.SECRET_KEY
    payload = {
        "sub": sub,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    }
    return jwt.encode(payload, secret_key, algorithm=auth_deps.ALGORITHM)


def create_token_with_algorithm_none(user_id: int) -> str:
    """Genera un JWT con algoritmo 'none' (ataque de confusión)."""
    import json
    import base64
    header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps({"sub": str(user_id), "exp": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()}).encode()).rstrip(b"=").decode()
    return f"{header}.{payload}."


def make_user_inactive(db: TinyDB, email: str) -> None:
    """Marca un usuario como inactivo en la DB."""
    users = db.table(auth_services.USERS_TABLE)
    for doc in users:
        if doc.get("email") == email:
            users.update({"is_active": False}, doc_ids=[doc.doc_id])
            return


def delete_user_by_email(db: TinyDB, email: str) -> int | None:
    """Elimina un usuario y su perfil de la DB. Retorna el user_id eliminado o None."""
    users = db.table(auth_services.USERS_TABLE)
    profiles = db.table(auth_services.PROFILES_TABLE)
    for doc in users:
        if doc.get("email") == email:
            user_id = doc.doc_id
            for pdoc in profiles:
                if pdoc.get("user_id") == user_id:
                    profiles.remove(doc_ids=[pdoc.doc_id])
            users.remove(doc_ids=[user_id])
            return user_id
    return None