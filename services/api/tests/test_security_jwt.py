from __future__ import annotations

import json

from services.api.auth import dependencies as auth_deps
from services.api.auth import services as auth_services
from services.api.tests.conftest import create_token_with_sub


class TestSecurityJWT:
    """Casos de seguridad y lógica de tokens — PASO 03"""

    def test_failure_jwt_algorithm_none(self, client, test_user):
        """Modo fallo: JWT con algoritmo 'none' (ataque de confusión) (S1).

        python-jose con algorithm=HS256 debe rechazar tokens con alg='none'.
        """
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        # Crear un JWT manual con algoritmo "none".
        import base64

        header = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()
        ).rstrip(b"=").decode()

        payload = base64.urlsafe_b64encode(
            json.dumps({
                "sub": str(user_doc.doc_id),
                "exp": "9999999999",
            }).encode()
        ).rstrip(b"=").decode()

        none_token = f"{header}.{payload}."

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {none_token}"},
        )
        assert response.status_code == 401

    def test_failure_jwt_algorithm_none_empty_signature(self, client, test_user):
        """Modo fallo: JWT con algoritmo 'none' y firma vacía (variante) (S1)."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        import base64

        header = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()
        ).rstrip(b"=").decode()

        payload = base64.urlsafe_b64encode(
            json.dumps({
                "sub": str(user_doc.doc_id),
                "exp": "9999999999",
            }).encode()
        ).rstrip(b"=").decode()

        # Variante: sin punto final.
        none_token = f"{header}.{payload}"

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {none_token}"},
        )
        assert response.status_code == 401

    def test_failure_tampered_payload(self, client, test_user):
        """Modo fallo: access token con payload manipulado (S2).

        Cambiar el sub por otro user_id invalida la firma.
        """
        email, password = test_user

        # Obtener token legítimo.
        login_resp = client.post("/auth/login", json={"email": email, "password": password})
        token = login_resp.json()["access_token"]

        # Manipular el payload: cambiar el sub.
        parts = token.split(".")
        import base64

        # Decodificar payload, modificar sub, recodificar.
        padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload_bytes = base64.urlsafe_b64decode(padded)
        payload_dict = json.loads(payload_bytes)
        payload_dict["sub"] = "99999"
        new_payload = base64.urlsafe_b64encode(
            json.dumps(payload_dict).encode()
        ).rstrip(b"=").decode()

        tampered_token = f"{parts[0]}.{new_payload}.{parts[2]}"

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )
        assert response.status_code == 401

    def test_limit_empty_secret_key(self, client, db, test_user):
        """Caso límite: SECRET_KEY vacío en desarrollo (S3).

        Verificamos que con clave vacía el sistema aún funciona
        (aunque es inseguro para producción).
        """
        # Guardar secret key original.
        original_key = auth_deps.SECRET_KEY

        try:
            auth_deps.SECRET_KEY = ""

            email, password = test_user
            login_resp = client.post("/auth/login", json={"email": email, "password": password})
            assert login_resp.status_code == 200
            token = login_resp.json()["access_token"]

            # El token firmado con clave vacía debe ser válido.
            me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_resp.status_code == 200
        finally:
            auth_deps.SECRET_KEY = original_key