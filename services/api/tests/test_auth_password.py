from __future__ import annotations

from datetime import datetime, timedelta, timezone
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from services.api.auth import dependencies as auth_dependencies
from services.api.auth import services as auth_services
from services.api.main import app
from services.api.notifications.resend_client import EmailDeliveryError


class AuthPasswordEndpointsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.db = TinyDB(storage=MemoryStorage)
        self.db_patcher = patch("services.api.auth.services.get_db", return_value=self.db)
        self.db_patcher.start()
        auth_dependencies.SECRET_KEY = "test-secret-key"
        auth_services.create_user("user@example.com", "password123")
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.db_patcher.stop()
        self.db.close()

    def _request_reset_token(self) -> str:
        with patch("services.api.routes.auth.send_password_reset_email") as send_email:
            response = self.client.post(
                "/auth/forgot-password",
                json={"email": "user@example.com"},
            )
        self.assertEqual(response.status_code, 200)
        return send_email.call_args.args[1]

    def _login(self, password: str) -> str:
        response = self.client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": password},
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["access_token"]

    def test_forgot_password_does_not_enumerate_users(self) -> None:
        with patch("services.api.routes.auth.send_password_reset_email") as send_email:
            existing = self.client.post(
                "/auth/forgot-password",
                json={"email": "user@example.com"},
            )
            missing = self.client.post(
                "/auth/forgot-password",
                json={"email": "missing@example.com"},
            )

        self.assertEqual(existing.status_code, 200)
        self.assertEqual(existing.json(), missing.json())
        send_email.assert_called_once()
        original_token = send_email.call_args.args[1]
        stored = self.db.table(auth_services.PASSWORD_RESET_TOKENS_TABLE).all()[0]
        self.assertNotEqual(stored["token_hash"], original_token)
        self.assertNotIn(original_token, str(stored))

    def test_reset_password_is_single_use_and_updates_login(self) -> None:
        token = self._request_reset_token()
        reset = self.client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "new-password-123"},
        )
        reused = self.client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "another-password"},
        )
        old_login = self.client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "password123"},
        )

        self.assertEqual(reset.status_code, 200)
        self.assertEqual(reused.status_code, 400)
        self.assertEqual(old_login.status_code, 401)
        self._login("new-password-123")

    def test_expired_token_is_rejected(self) -> None:
        token = self._request_reset_token()
        tokens = self.db.table(auth_services.PASSWORD_RESET_TOKENS_TABLE)
        token_doc = tokens.all()[0]
        tokens.update(
            {"expires_at": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()},
            doc_ids=[token_doc.doc_id],
        )

        response = self.client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "new-password-123"},
        )
        self.assertEqual(response.status_code, 400)

    def test_change_password_requires_current_password_and_keeps_session(self) -> None:
        access_token = self._login("password123")
        headers = {"Authorization": f"Bearer {access_token}"}

        incorrect = self.client.post(
            "/auth/change-password",
            headers=headers,
            json={"current_password": "incorrect", "new_password": "new-password-123"},
        )
        same = self.client.post(
            "/auth/change-password",
            headers=headers,
            json={"current_password": "password123", "new_password": "password123"},
        )
        changed = self.client.post(
            "/auth/change-password",
            headers=headers,
            json={"current_password": "password123", "new_password": "new-password-123"},
        )
        me = self.client.get("/auth/me", headers=headers)

        self.assertEqual(incorrect.status_code, 400)
        self.assertEqual(same.status_code, 400)
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(me.status_code, 200)
        self._login("new-password-123")

    def test_email_failure_keeps_generic_response_and_invalidates_token(self) -> None:
        with patch(
            "services.api.routes.auth.send_password_reset_email",
            side_effect=EmailDeliveryError("provider error"),
        ):
            response = self.client.post(
                "/auth/forgot-password",
                json={"email": "user@example.com"},
            )

        stored = self.db.table(auth_services.PASSWORD_RESET_TOKENS_TABLE).all()[0]
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(stored["used_at"])


if __name__ == "__main__":
    unittest.main()
