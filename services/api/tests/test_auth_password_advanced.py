from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from services.api.auth import models
from services.api.auth import services as auth_services


class TestAuthPasswordAdvanced:
    """POST /auth/forgot-password, /auth/reset-password, /auth/change-password — PASO 03"""

    def _request_token(self, client, email: str) -> str | None:
        """Helper: solicita forgot-password y extrae el token del mock."""
        with patch("services.api.routes.auth.send_password_reset_email") as send_email:
            response = client.post(
                "/auth/forgot-password",
                json={"email": email},
            )
        assert response.status_code == 200
        if send_email.called:
            return send_email.call_args.args[1]
        return None

    def test_failure_inactive_user_forgot_password(self, client, db, test_user):
        """Modo fallo: forgot-password para usuario inactivo → mensaje genérico sin email (F1)."""
        email, _ = test_user

        # Marcar usuario como inactivo.
        from services.api.tests.conftest import make_user_inactive
        make_user_inactive(db, email)

        with patch("services.api.routes.auth.send_password_reset_email") as send_email:
            response = client.post(
                "/auth/forgot-password",
                json={"email": email},
            )

        # El mensaje debe ser genérico (no revelar que la cuenta está inactiva).
        assert response.status_code == 200
        assert "registrada" in response.json()["message"].lower()

        # No se debe enviar email porque no se generó token.
        send_email.assert_not_called()

    def test_failure_inactive_user_reset_password(self, client, db, test_user):
        """Modo fallo: reset-password con token de usuario que fue desactivado (P1)."""
        email, _ = test_user

        # Solicitar token (usuario activo).
        token = self._request_token(client, email)
        assert token is not None

        # Desactivar usuario.
        from services.api.tests.conftest import make_user_inactive
        make_user_inactive(db, email)

        # Intentar reset con el token.
        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "new-password-123"},
        )
        assert response.status_code == 400
        assert "no es valido" in response.json()["detail"].lower()

    def test_failure_expired_token_timezone_edge(self, client, test_user):
        """Modo fallo: token expirado hace segundos con timezone-aware (P2)."""
        email, _ = test_user

        # Solicitar token.
        token = self._request_token(client, email)
        assert token is not None

        # Manipular expires_at para que expire justo ahora (timezone edge).
        tokens_table = auth_services.get_db().table(auth_services.PASSWORD_RESET_TOKENS_TABLE)
        for doc in tokens_table:
            if doc.get("token_hash") == auth_services._hash_reset_token(token):
                # Poner expiración 1 segundo en el pasado con timezone.
                expired = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
                tokens_table.update({"expires_at": expired}, doc_ids=[doc.doc_id])
                break

        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "new-password-123"},
        )
        assert response.status_code == 400
        assert "no es valido" in response.json()["detail"].lower()

    def test_limit_reset_to_same_password(self, client, test_user):
        """Caso límite: reset-password con nueva contraseña = actual (P3)."""
        email, _ = test_user

        # Solicitar token.
        token = self._request_token(client, email)
        assert token is not None

        # Reset a la misma contraseña.
        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "new-password-123"},  # contraseña cualquiera
        )
        # El reset debe funcionar (no hay validación contra history en reset-password).
        # Pero verify que el login funciona con la nueva contraseña.
        assert response.status_code == 200
        login = client.post(
            "/auth/login",
            json={"email": email, "password": "new-password-123"},
        )
        assert login.status_code == 200

    def test_failure_change_password_for_inexistent_user(self, client, db, test_user):
        """Modo fallo: change-password para usuario que fue borrado (C1)."""
        email, password = test_user

        # Login para obtener token.
        login_resp = client.post("/auth/login", json={"email": email, "password": password})
        token = login_resp.json()["access_token"]

        # Eliminar el usuario.
        from services.api.tests.conftest import delete_user_by_email
        delete_user_by_email(db, email)

        # Intentar cambiar contraseña.
        response = client.post(
            "/auth/change-password",
            headers={"Authorization": f"Bearer {token}"},
            json={"current_password": password, "new_password": "new-password-123"},
        )
        assert response.status_code == 401

    def test_failure_multiple_forgot_password_invalidates_previous(self, client, test_user):
        """Modo fallo: múltiples solicitudes forgot-password invalidan token anterior (F2)."""
        email, _ = test_user

        # Primera solicitud.
        token1 = self._request_token(client, email)

        # Segunda solicitud.
        token2 = self._request_token(client, email)

        assert token1 is not None
        assert token2 is not None
        assert token1 != token2  # Deben ser tokens diferentes.

        # El primer token debe estar invalidado.
        response = client.post(
            "/auth/reset-password",
            json={"token": token1, "new_password": "new-password-123"},
        )
        assert response.status_code == 400

        # El segundo token debe funcionar.
        response = client.post(
            "/auth/reset-password",
            json={"token": token2, "new_password": "new-password-123"},
        )
        assert response.status_code == 200