from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from scripts.seed_incidents import seed_incidents
from services.api.auth import dependencies as auth_dependencies
from services.api.main import app


class IncidentManagerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.db = TinyDB(storage=MemoryStorage)
        self.incidents = self.db.table("incidents")
        self.seed_keys = self.db.table("incident_seed_keys")
        self.table_patcher = patch(
            "services.api.incidents.service.get_incidents_table",
            return_value=self.incidents,
        )
        self.table_patcher.start()
        app.dependency_overrides[auth_dependencies.get_current_user] = lambda: {"id": 1}
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        self.table_patcher.stop()
        self.db.close()

    def _create(self, **overrides):
        payload = {
            "title": "Fallo en Zendesk",
            "description": "Los tickets no se asignan al equipo.",
            "category": "technical_failure",
            "origin": "branch",
            "branch": "miami_office",
        }
        payload.update(overrides)
        return self.client.post("/api/incidents", json=payload)

    def test_create_list_filter_and_summary(self) -> None:
        created = self._create()
        self._create(title="Queja de cliente", category="client_complaint", origin="customer", branch="central")

        filtered = self.client.get("/api/incidents?origin=branch&category=technical_failure")
        summary = self.client.get("/api/incidents/summary")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["status"], "open")
        self.assertEqual(created.json()["created_at"], created.json()["updated_at"])
        self.assertEqual(len(filtered.json()), 1)
        self.assertEqual(summary.json()["total"], 2)
        self.assertEqual(summary.json()["by_status"]["open"], 2)
        self.assertEqual(summary.json()["by_category"]["sla_breach"], 0)

    def test_validation_and_lifecycle(self) -> None:
        invalid = self._create(title="   ")
        created = self._create().json()
        incident_id = created["id"]
        invalid_transition = self.client.patch(
            f"/api/incidents/{incident_id}/status",
            json={"status": "resolved"},
        )
        progressing = self.client.patch(
            f"/api/incidents/{incident_id}/status",
            json={"status": "in_progress"},
        )
        resolved = self.client.patch(
            f"/api/incidents/{incident_id}/status",
            json={"status": "resolved"},
        )
        final_change = self.client.patch(
            f"/api/incidents/{incident_id}/status",
            json={"status": "discarded"},
        )

        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(invalid.json()["error"]["field"], "title")
        self.assertEqual(invalid_transition.status_code, 400)
        self.assertEqual(progressing.status_code, 200)
        self.assertEqual(resolved.status_code, 200)
        self.assertEqual(final_change.status_code, 400)

    def test_empty_missing_and_invalid_filter(self) -> None:
        self.assertEqual(self.client.get("/api/incidents").json(), [])
        summary = self.client.get("/api/incidents/summary").json()
        self.assertEqual(summary["total"], 0)
        self.assertEqual(self.client.get("/api/incidents/999").status_code, 404)
        self.assertEqual(self.client.get("/api/incidents?status=unknown").status_code, 400)

    def test_manager_endpoints_require_authentication(self) -> None:
        app.dependency_overrides.pop(auth_dependencies.get_current_user)
        response = self.client.get("/api/incidents")
        self.assertEqual(response.status_code, 401)

    def test_historical_seed_is_idempotent(self) -> None:
        csv_path = Path(__file__).resolve().parents[3] / "data" / "raw" / "incidents-nexova.csv"
        first = seed_incidents(csv_path, self.incidents, self.seed_keys)
        second = seed_incidents(csv_path, self.incidents, self.seed_keys)

        self.assertEqual(first.inserted, 96)
        self.assertEqual(first.discarded, first.read - 96)
        self.assertEqual(second.inserted, 0)
        self.assertEqual(second.skipped, 96)
        self.assertEqual(len(self.incidents), 96)

        summary = self.client.get("/api/incidents/summary").json()
        self.assertEqual(summary["by_status"], {
            "open": 27,
            "in_progress": 0,
            "resolved": 56,
            "discarded": 13,
        })
        self.assertEqual(summary["by_category"]["technical_failure"], 49)
        self.assertEqual(summary["by_category"]["process_error"], 35)
        self.assertEqual(summary["by_category"]["client_complaint"], 12)
        self.assertEqual(summary["by_origin"]["customer"], 96)
        self.assertEqual(summary["by_branch"]["central"], 96)


if __name__ == "__main__":
    unittest.main()