from __future__ import annotations

from jose import jwt

from services.api.auth import dependencies as auth_deps
from services.api.auth import services as auth_services
from services.api.tests.conftest import create_expired_token, make_user_inactive


class TestLogin:
    """POST /auth/login"""

    def test_happy_path_returns_jwt_token(self, client, test_user):
        """Camino feliz: credenciales correctas → token JWT."""
        email, password = test_user
        response = client.post("/auth/login", json={"email": email, "password": password})

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Verificar que el token es un JWT válido con el subject correcto.
        payload = jwt.decode(
            data["access_token"],
            auth_deps.SECRET_KEY,
            algorithms=[auth_deps.ALGORITHM],
        )
        assert payload["sub"] is not None
        assert int(payload["sub"]) > 0  # user_id positivo

    def test_edge_case_email_with_unexpected_case(self, client, test_user):
        """Caso límite: email con diferente capitalización."""
        email, password = test_user
        response = client.post("/auth/login", json={"email": email.upper(), "password": password})

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_edge_case_password_empty_string(self, client, test_user):
        """Caso límite: contraseña vacía (cadena vacía)."""
        email, _ = test_user
        response = client.post("/auth/login", json={"email": email, "password": ""})
        assert response.status_code == 401

    def test_failure_wrong_password(self, client, test_user):
        """Modo fallo: contraseña incorrecta."""
        email, _ = test_user
        response = client.post("/auth/login", json={"email": email, "password": "wrongpassword"})

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_failure_unregistered_email(self, client):
        """Modo fallo: email no registrado."""
        response = client.post("/auth/login", json={"email": "nobody@example.com", "password": "anypass"})

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_failure_inactive_user(self, client, db, test_user):
        """Modo fallo: usuario inactivo (is_active=False)."""
        email, password = test_user
        make_user_inactive(db, email)
        response = client.post("/auth/login", json={"email": email, "password": password})

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_failure_message_does_not_enumerate_users(self, client):
        """Verifica que el mensaje de error es genérico (no enumera usuarios)."""
        response_registered = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrong"},
        )
        response_missing = client.post(
            "/auth/login",
            json={"email": "notexist@example.com", "password": "wrong"},
        )

        assert response_registered.json()["detail"] == response_missing.json()["detail"]