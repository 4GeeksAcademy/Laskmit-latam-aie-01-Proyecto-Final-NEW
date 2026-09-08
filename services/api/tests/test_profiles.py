from __future__ import annotations

from services.api.auth import services as auth_services


class TestGetProfile:
    """GET /profiles/me"""

    def test_happy_path_user_with_profile(self, client, test_user, user_headers):
        """Camino feliz: usuario con perfil."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        auth_services.upsert_profile(user_doc.doc_id, name="Profile User", phone="+34999999999")

        response = client.get("/profiles/me", headers=user_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Profile User"
        assert data["phone"] == "+34999999999"

    def test_failure_no_profile(self, client, user_headers):
        """Modo fallo: usuario sin perfil → 404."""
        response = client.get("/profiles/me", headers=user_headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_failure_no_token(self, client):
        """Modo fallo: sin autenticación."""
        response = client.get("/profiles/me")
        assert response.status_code == 401


class TestUpdateProfile:
    """PUT /profiles/me"""

    def test_happy_path_create_profile(self, client, test_user, user_headers):
        """Camino feliz: crear perfil donde no existía (upsert)."""
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={"name": "New Profile", "phone": "+34123456789", "address": "Nueva Direccion"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Profile"
        assert data["phone"] == "+34123456789"

    def test_happy_path_update_existing_profile(self, client, test_user, user_headers):
        """Camino feliz: actualizar perfil existente."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        # Crear perfil primero.
        auth_services.upsert_profile(user_doc.doc_id, name="Original", phone="+34111111111")

        # Actualizar.
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={"name": "Updated Name", "address": "Updated Address"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["address"] == "Updated Address"
        # El campo que no se envió debe conservar su valor.
        assert data["phone"] == "+34111111111"

    def test_edge_case_partial_update(self, client, test_user, user_headers):
        """Caso límite: actualización parcial (solo un campo)."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        auth_services.upsert_profile(user_doc.doc_id, name="Partial", phone="+34222222222", address="Old")

        # Enviar solo phone.
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={"phone": "+34999999999"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Partial"  # No cambió.
        assert data["phone"] == "+34999999999"  # Cambió.
        assert data["address"] == "Old"  # No cambió.

    def test_failure_no_token(self, client):
        """Modo fallo: sin autenticación."""
        response = client.put(
            "/profiles/me",
            json={"name": "No Auth"},
        )
        assert response.status_code == 401