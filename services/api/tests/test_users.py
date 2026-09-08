from __future__ import annotations

from services.api.auth import services as auth_services


class TestListUsers:
    """GET /users"""

    def test_happy_path_admin_can_list(self, client, admin_headers, test_user):
        """Camino feliz: admin autenticado lista usuarios."""
        response = client.get("/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        emails = [u["email"] for u in data]
        assert "test@example.com" in emails

    def test_happy_path_regular_user_can_list(self, client, user_headers):
        """Camino feliz: usuario regular también puede listar."""
        response = client.get("/users", headers=user_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_failure_no_token(self, client):
        """Modo fallo: sin autenticación."""
        response = client.get("/users")
        assert response.status_code == 401


class TestGetUser:
    """GET /users/{user_id}"""

    def test_happy_path_own_user(self, client, test_user, user_token, user_headers):
        """Camino feliz: usuario obtiene sus propios datos."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        user_id = user_doc.doc_id

        response = client.get(f"/users/{user_id}", headers=user_headers)
        assert response.status_code == 200
        assert response.json()["email"] == email

    def test_happy_path_admin_gets_other_user(self, client, admin_headers, test_user):
        """Camino feliz: admin obtiene datos de otro usuario."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        user_id = user_doc.doc_id

        response = client.get(f"/users/{user_id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["email"] == email

    def test_edge_case_regular_user_gets_other_user(self, client, test_user, user_headers):
        """Caso límite: usuario regular intenta ver otro usuario → 403."""
        auth_services.create_user("other@example.com", "password123")
        other_doc = auth_services.get_user_doc_by_email("other@example.com")

        response = client.get(f"/users/{other_doc.doc_id}", headers=user_headers)
        assert response.status_code == 403

    def test_failure_nonexistent_user(self, client, admin_headers):
        """Modo fallo: ID que no existe."""
        response = client.get("/users/99999", headers=admin_headers)
        assert response.status_code == 404

    def test_failure_no_token(self, client):
        """Modo fallo: sin autenticación."""
        response = client.get("/users/1")
        assert response.status_code == 401


class TestUpdateUser:
    """PUT /users/{user_id}"""

    def test_happy_path_update_own_email(self, client, test_user, user_headers):
        """Camino feliz: usuario actualiza su propio email."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        response = client.put(
            f"/users/{user_doc.doc_id}",
            headers=user_headers,
            json={"email": "updated@example.com"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == "updated@example.com"

    def test_happy_path_admin_changes_role(self, client, admin_headers, test_user):
        """Camino feliz: admin cambia role de otro usuario."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        response = client.put(
            f"/users/{user_doc.doc_id}",
            headers=admin_headers,
            json={"role": "manager"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "manager"

    def test_edge_case_regular_user_cannot_change_role(self, client, test_user, user_headers):
        """Caso límite: usuario regular intenta cambiar su propio role → 403."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        response = client.put(
            f"/users/{user_doc.doc_id}",
            headers=user_headers,
            json={"role": "admin"},
        )
        assert response.status_code == 403
        assert "admins" in response.json()["detail"].lower()

    def test_edge_case_regular_user_updates_other(self, client, test_user, user_headers):
        """Caso límite: usuario regular actualiza otro usuario → 403."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        other = auth_services.create_user("other2@example.com", "password123")

        response = client.put(
            f"/users/{other.id}",
            headers=user_headers,
            json={"email": "hacked@example.com"},
        )
        assert response.status_code == 403

    def test_failure_nonexistent_user(self, client, admin_headers):
        """Modo fallo: ID inexistente."""
        response = client.put(
            "/users/99999",
            headers=admin_headers,
            json={"email": "ghost@example.com"},
        )
        assert response.status_code == 404

    def test_failure_no_token(self, client, test_user):
        """Modo fallo: sin autenticación."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        response = client.put(
            f"/users/{user_doc.doc_id}",
            json={"email": "nologin@example.com"},
        )
        assert response.status_code == 401


class TestDeleteUser:
    """DELETE /users/{user_id}"""

    def test_happy_path_admin_deletes_user(self, client, db, admin_headers, test_user):
        """Camino feliz: admin elimina usuario → 200, usuario + perfil eliminados."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        user_id = user_doc.doc_id

        # Crear un perfil para verificar que también se elimina.
        auth_services.upsert_profile(user_id, name="To Delete")

        response = client.delete(f"/users/{user_id}", headers=admin_headers)
        assert response.status_code == 200

        # Verificar que el usuario ya no existe.
        assert auth_services.get_user_by_id(user_id) is None
        # Verificar que el perfil también se eliminó.
        assert auth_services.get_profile_by_user_id(user_id) is None

    def test_failure_regular_user_cannot_delete(self, client, test_user, user_headers):
        """Modo fallo: usuario regular intenta eliminar → 403."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)

        response = client.delete(f"/users/{user_doc.doc_id}", headers=user_headers)
        assert response.status_code == 403
        assert "admins" in response.json()["detail"].lower()

    def test_failure_nonexistent_user(self, client, admin_headers):
        """Modo fallo: admin elimina ID inexistente → 404."""
        response = client.delete("/users/99999", headers=admin_headers)
        assert response.status_code == 404

    def test_failure_no_token(self, client, test_user):
        """Modo fallo: sin autenticación."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        response = client.delete(f"/users/{user_doc.doc_id}")
        assert response.status_code == 401