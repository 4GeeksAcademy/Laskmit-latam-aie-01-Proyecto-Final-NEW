from __future__ import annotations

from services.api.auth import services as auth_services
from services.api.tests.conftest import create_expired_token, create_malformed_token, make_user_inactive


class TestAuthMe:
    """GET /auth/me"""

    def test_happy_path_with_profile(self, client, test_user, user_token, db):
        """Camino feliz: token válido, usuario con perfil."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        user_id = user_doc.doc_id
        auth_services.upsert_profile(user_id, name="Test User", phone="+34111111111")

        response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert data["role"] == "user"
        assert data["profile"] is not None
        assert data["profile"]["name"] == "Test User"
        assert data["profile"]["phone"] == "+34111111111"

    def test_happy_path_without_profile(self, client, user_token, test_user):
        """Camino feliz: token válido, usuario sin perfil → profile=null."""
        response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})

        assert response.status_code == 200
        data = response.json()
        assert data["profile"] is None

    def test_edge_case_admin_user(self, client, admin_token, admin_user):
        """Caso límite: usuario admin → role='admin'."""
        email, _ = admin_user
        response = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})

        assert response.status_code == 200
        assert response.json()["role"] == "admin"
        assert response.json()["email"] == email

    def test_failure_no_token(self, client):
        """Modo fallo: sin header Authorization."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_failure_expired_token(self, client, test_user):
        """Modo fallo: token expirado."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        expired = create_expired_token(user_doc.doc_id)

        response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})

        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    def test_failure_malformed_token(self, client):
        """Modo fallo: token que no es un JWT válido."""
        bad_token = create_malformed_token()
        response = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_token}"})

        assert response.status_code == 401
        detail = response.json()["detail"].lower()
        assert "validate" in detail or "credentials" in detail

    def test_failure_inactive_user(self, client, db, test_user):
        """Modo fallo: usuario inactivo."""
        email, password = test_user
        # Primero obtener token (mientras está activo).
        login_resp = client.post("/auth/login", json={"email": email, "password": password})
        token = login_resp.json()["access_token"]

        # Desactivar usuario.
        make_user_inactive(db, email)

        response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()