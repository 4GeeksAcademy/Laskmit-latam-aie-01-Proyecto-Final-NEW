from __future__ import annotations

from services.api.tests.conftest import create_malformed_token


class TestAuthMeAdvanced:
    """GET /auth/me — Casos adicionales del PASO 03"""

    def test_failure_header_without_bearer_prefix(self, client, user_token):
        """Modo fallo: header Authorization sin formato 'Bearer' (M1)."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": user_token},  # Sin "Bearer " delante
        )
        assert response.status_code == 401

    def test_failure_empty_token_in_header(self, client):
        """Modo fallo: header Authorization con token vacío (M2)."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer "},  # Token vacío
        )
        assert response.status_code == 401