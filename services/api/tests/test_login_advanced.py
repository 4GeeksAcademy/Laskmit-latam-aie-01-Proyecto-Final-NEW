from __future__ import annotations

from services.api.auth import dependencies as auth_deps
from services.api.auth import services as auth_services
from services.api.tests.conftest import (
    create_token_with_secret,
    create_token_with_sub,
    delete_user_by_email,
)


class TestLoginAdvanced:
    """POST /auth/login — Casos adicionales del PASO 03"""

    def test_limit_long_password(self, client, test_user):
        """Caso límite: contraseña con 72 caracteres (máximo bcrypt) (L1)."""
        email, _ = test_user
        # bcrypt tiene un límite de 72 bytes.
        max_password = "a" * 72

        # Crear usuario con contraseña larga.
        auth_services.create_user("longpass@example.com", max_password)

        response = client.post(
            "/auth/login",
            json={"email": "longpass@example.com", "password": max_password},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_limit_password_beyond_bcrypt_limit(self):
        """Caso límite: contraseña >72 bytes (limitación de passlib/bcrypt) (L1-bis).

        passlib lanza ValueError porque bcrypt solo acepta 72 bytes.
        Esto es una limitación del wrapper Python, no del algoritmo bcrypt en C.
        """
        import pytest
        long_pass = "a" * 73
        with pytest.raises(ValueError, match="password cannot be longer than 72"):
            auth_services.create_user("beyond72@example.com", long_pass)

    def test_limit_password_with_unicode(self, client, test_user):
        """Caso límite: contraseña con caracteres Unicode como ñ, ü, emojis (L2)."""
        unicode_password = "contraseña_ü_😀_ñ_123"

        # Crear usuario con contraseña Unicode.
        auth_services.create_user("unicode@example.com", unicode_password)

        response = client.post(
            "/auth/login",
            json={"email": "unicode@example.com", "password": unicode_password},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_failure_wrong_secret_key(self, client, test_user):
        """Modo fallo: token firmado con SECRET_KEY diferente (L3)."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        # Crear token con clave diferente.
        forged_token = create_token_with_secret(user_doc.doc_id, "different-secret-key")

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {forged_token}"},
        )
        assert response.status_code == 401

    def test_failure_token_with_non_numeric_sub(self, client):
        """Modo fallo: token con sub que no es número (L4)."""
        bad_token = create_token_with_sub("abc123")

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == 401

    def test_failure_token_with_sub_zero(self, client):
        """Modo fallo: token con sub=0 (L5)."""
        bad_token = create_token_with_sub("0")

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == 401

    def test_failure_token_with_negative_sub(self, client):
        """Modo fallo: token con sub negativo (L5)."""
        bad_token = create_token_with_sub("-1")

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == 401

    def test_failure_orphan_token_deleted_user(self, client, db, test_user):
        """Modo fallo: token de usuario eliminado después de emitir el token (L6)."""
        email, password = test_user

        # Login para obtener token.
        login_resp = client.post("/auth/login", json={"email": email, "password": password})
        token = login_resp.json()["access_token"]

        # Eliminar el usuario.
        delete_user_by_email(db, email)

        # Intentar usar el token.
        response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401