from __future__ import annotations

from services.api.auth import services as auth_services


class TestRegister:
    """POST /users (registro público)"""

    def test_happy_path_creates_user_with_role_user(self, client):
        """Camino feliz: email+password válidos → 201, role='user'."""
        response = client.post(
            "/users",
            json={"email": "newuser@example.com", "password": "password123"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["role"] == "user"
        assert data["is_active"] is True
        assert "id" in data
        # Verificar que no se expone la contraseña.
        assert "password" not in data
        assert "hashed_password" not in data

    def test_happy_path_with_optional_profile(self, client):
        """Camino feliz: con name, phone, address → 201 + perfil creado."""
        response = client.post(
            "/users",
            json={
                "email": "withprofile@example.com",
                "password": "password123",
                "name": "Juan Perez",
                "phone": "+34123456789",
                "address": "Calle Falsa 123",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "withprofile@example.com"

        # Verificar que el perfil se creó.
        profile = auth_services.get_profile_by_user_id(data["id"])
        assert profile is not None
        assert profile.name == "Juan Perez"
        assert profile.phone == "+34123456789"
        assert profile.address == "Calle Falsa 123"

    def test_edge_case_duplicate_email(self, client, test_user):
        """Caso límite: email duplicado → 422."""
        email, _ = test_user
        response = client.post(
            "/users",
            json={"email": email, "password": "otherpass123"},
        )

        assert response.status_code == 422
        assert "already registered" in response.json()["detail"].lower()

    def test_edge_case_password_exactly_8_chars(self, client):
        """Caso límite: contraseña de exactamente 8 caracteres (mínimo)."""
        response = client.post(
            "/users",
            json={"email": "minpass@example.com", "password": "12345678"},
        )

        assert response.status_code == 201

    def test_failure_password_too_short(self, client):
        """Modo fallo: contraseña < 8 caracteres."""
        response = client.post(
            "/users",
            json={"email": "shortpass@example.com", "password": "1234567"},
        )

        assert response.status_code == 422

    def test_failure_invalid_email_format(self, client):
        """Modo fallo: email mal formado."""
        response = client.post(
            "/users",
            json={"email": "not-an-email", "password": "password123"},
        )

        assert response.status_code == 422

    def test_failure_role_not_exposed_in_request(self, client):
        """Verifica que UserCreate no expone 'role' (siempre se asigna 'user')."""
        response = client.post(
            "/users",
            json={
                "email": "norole@example.com",
                "password": "password123",
                "role": "admin",
            },
        )

        # Si Pydantic rechaza campos extra → 422 (strict). Si los ignora → 201 con role="user".
        # Cualquiera de los dos comportamientos es válido; verificamos que nunca se asigna admin.
        if response.status_code == 201:
            assert response.json()["role"] == "user"