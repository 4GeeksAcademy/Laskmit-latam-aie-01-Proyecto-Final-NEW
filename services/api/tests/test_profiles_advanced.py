from __future__ import annotations

from services.api.auth import services as auth_services


class TestProfileAdvanced:
    """GET/PUT /profiles/me — Casos adicionales del PASO 03"""

    def test_limit_update_profile_all_empty_fields(self, client, test_user, user_headers):
        """Caso límite: actualizar perfil con todos los campos vacíos (PR1)."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        # Crear perfil primero.
        auth_services.upsert_profile(user_doc.doc_id, name="Original", phone="+34111111111", address="Address")

        # Actualizar con todos los campos None (solo enviar body vacío).
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={},  # Sin campos → upsert con todos None
        )
        assert response.status_code == 200
        data = response.json()
        # Los campos existentes deben conservarse (partial update).
        assert data["name"] == "Original"

    def test_limit_update_profile_with_null_fields(self, client, test_user, user_headers):
        """Caso límite: actualizar perfil con todos los campos explícitamente null (PR1)."""
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={"name": None, "phone": None, "address": None},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] is None
        assert data["phone"] is None
        assert data["address"] is None

    def test_limit_very_long_name_in_profile(self, client, test_user, user_headers):
        """Caso límite: name con >500 caracteres (PR2)."""
        long_name = "A" * 1000
        response = client.put(
            "/profiles/me",
            headers=user_headers,
            json={"name": long_name},
        )
        # Pydantic no define max_length, debe aceptarlo.
        assert response.status_code == 200
        assert response.json()["name"] == long_name