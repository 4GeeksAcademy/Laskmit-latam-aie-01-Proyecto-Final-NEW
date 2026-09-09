from __future__ import annotations

from services.api.auth import services as auth_services
from services.api.tests.conftest import delete_user_by_email


class TestDeleteUserAdvanced:
    """DELETE /users/{user_id} — Casos adicionales del PASO 03"""

    def test_edge_admin_deletes_themselves(self, client, db, admin_headers, admin_user):
        """Caso límite: admin se elimina a sí mismo (D1)."""
        email, _ = admin_user
        admin_doc = auth_services.get_user_doc_by_email(email)
        admin_id = admin_doc.doc_id

        response = client.delete(f"/users/{admin_id}", headers=admin_headers)
        # El servicio permite que admin se elimine a sí mismo (solo verifica role=admin).
        assert response.status_code == 200

        # Verificar que el admin ya no existe.
        assert auth_services.get_user_by_id(admin_id) is None

    def test_failure_double_delete(self, client, db, admin_headers, test_user):
        """Modo fallo: eliminar usuario que ya fue eliminado (D2)."""
        email, _ = test_user
        user_doc = auth_services.get_user_doc_by_email(email)
        user_id = user_doc.doc_id

        # Primera eliminación.
        response1 = client.delete(f"/users/{user_id}", headers=admin_headers)
        assert response1.status_code == 200

        # Segunda eliminación del mismo ID.
        response2 = client.delete(f"/users/{user_id}", headers=admin_headers)
        assert response2.status_code == 404