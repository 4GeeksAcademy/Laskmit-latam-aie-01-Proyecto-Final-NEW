from __future__ import annotations

from services.api.auth import services as auth_services


class TestRegisterAdvanced:
    """POST /users — Casos adicionales del PASO 03"""

    def test_limit_international_email(self, client):
        """Caso límite: email con caracteres internacionales (R1)."""
        response = client.post(
            "/users",
            json={"email": "usuário@example.com", "password": "password123"},
        )
        # Pydantic EmailStr lo acepta o rechaza según configuración.
        # Cualquiera de los dos comportamientos es válido, solo verificamos que no crashea.
        assert response.status_code in (201, 422)

    def test_limit_email_with_plus_subaddressing(self, client):
        """Caso límite: email con subdireccionamiento (+) (R2)."""
        response = client.post(
            "/users",
            json={"email": "test+tag@example.com", "password": "password123"},
        )
        assert response.status_code in (201, 422)

    def test_failure_password_only_spaces(self, client):
        """Modo fallo: contraseña de solo espacios (R3)."""
        response = client.post(
            "/users",
            json={"email": "spaces@example.com", "password": "        "},  # 8 espacios
        )
        # Pydantic Field(min_length=8) acepta espacios, pero el servicio podría rechazarlos.
        # Si acepta (201), login con esa contraseña debe funcionar.
        if response.status_code == 201:
            login = client.post(
                "/auth/login",
                json={"email": "spaces@example.com", "password": "        "},
            )
            assert login.status_code == 200
        else:
            assert response.status_code == 422

    def test_failure_empty_profile_fields_present(self, client):
        """Modo fallo: name/phone/address vacíos pero presentes (R4)."""
        response = client.post(
            "/users",
            json={
                "email": "emptyfields@example.com",
                "password": "password123",
                "name": "",
                "phone": "",
                "address": "",
            },
        )
        # Pydantic acepta strings vacías como válidas.
        # El perfil se crea con campos vacíos.
        if response.status_code == 201:
            user_id = response.json()["id"]
            profile = auth_services.get_profile_by_user_id(user_id)
            if profile:
                # Los campos pueden ser None o "" según cómo se maneje.
                assert profile.name == "" or profile.name is None
        else:
            assert response.status_code in (201, 422)