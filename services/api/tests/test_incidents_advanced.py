from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from services.api.auth import dependencies as auth_deps
from services.api.main import app


class TestIncidentsAdvanced:
    """Pruebas adicionales para endpoints de incidencias (PASO 04).

    Complementa la cobertura de test_incident_manager.py con casos
    de validación de campos, límites y filtros combinados.
    """

    def setup_method(self) -> None:
        """Prepara entorno aislado: DB en memoria + autenticación automática."""
        self.db = TinyDB(storage=MemoryStorage)
        self.incidents = self.db.table("incidents")
        self.seed_keys = self.db.table("incident_seed_keys")
        self.table_patcher = patch(
            "services.api.incidents.service.get_incidents_table",
            return_value=self.incidents,
        )
        self.table_patcher.start()
        app.dependency_overrides[auth_deps.get_current_user] = lambda: {"id": 1}
        self.client = TestClient(app)

    def teardown_method(self) -> None:
        """Limpia parches y cierra DB."""
        app.dependency_overrides.clear()
        self.table_patcher.stop()
        self.db.close()

    def _create(self, **overrides) -> dict:
        """Helper para crear incidencias rápidamente con valores por defecto."""
        payload = {
            "title": "Fallo en Zendesk",
            "description": "Los tickets no se asignan al equipo.",
            "category": "technical_failure",
            "origin": "branch",
            "branch": "miami_office",
        }
        payload.update(overrides)
        return self.client.post("/api/incidents", json=payload)

    # ────────────────────────────────────────────
    # Validación de campos
    # ────────────────────────────────────────────

    def test_edge_case_title_max_length(self) -> None:
        """I1: Título de exactamente 120 caracteres → 201."""
        title = "X" * 120
        response = self._create(title=title)
        assert response.status_code == 201
        assert response.json()["title"] == title

    def test_failure_title_too_long(self) -> None:
        """I2: Título > 120 caracteres → 422."""
        title = "X" * 121
        response = self._create(title=title)
        assert response.status_code == 400

    def test_edge_case_description_minimum(self) -> None:
        """I3: Descripción de 1 carácter → 201."""
        response = self._create(description="A")
        assert response.status_code == 201
        assert response.json()["description"] == "A"

    def test_failure_invalid_category(self) -> None:
        """I4: Categoría inválida → 400."""
        response = self._create(category="non_existent_category")
        assert response.status_code == 400

    def test_failure_invalid_origin(self) -> None:
        """I5: Origen inválido → 400."""
        response = self._create(origin="invalid_origin")
        assert response.status_code == 400

    def test_failure_invalid_branch(self) -> None:
        """I6: Sucursal inválida → 400."""
        response = self._create(branch="invalid_branch")
        assert response.status_code == 400

    # ────────────────────────────────────────────
    # Filtros combinados
    # ────────────────────────────────────────────

    def test_edge_case_multiple_filters(self) -> None:
        """I7: Filtros combinados (origen + categoría + sucursal)."""
        self._create(title="Inc A", category="technical_failure", origin="branch", branch="miami_office")
        self._create(title="Inc B", category="client_complaint", origin="customer", branch="central")

        response = self.client.get(
            "/api/incidents?origin=branch&category=technical_failure&branch=miami_office"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Inc A"

    # ────────────────────────────────────────────
    # Obtener por ID
    # ────────────────────────────────────────────

    def test_happy_path_get_by_id(self) -> None:
        """I8: Obtener incidencia por ID existente → 200."""
        created = self._create().json()
        incident_id = created["id"]

        response = self.client.get(f"/api/incidents/{incident_id}")
        assert response.status_code == 200
        assert response.json()["id"] == incident_id
        assert response.json()["title"] == created["title"]

    def test_failure_get_nonexistent_id(self) -> None:
        """Verifica 404 para ID inexistente."""
        response = self.client.get("/api/incidents/99999")
        assert response.status_code == 404


if __name__ == "__main__":
    import unittest
    unittest.main()