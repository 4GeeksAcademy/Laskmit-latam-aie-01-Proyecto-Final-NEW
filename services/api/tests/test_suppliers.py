from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from services.api.auth import dependencies as auth_deps
from services.api.main import app


@pytest.fixture(autouse=True)
def _suppliers_db() -> TinyDB:
    """Crea una base de datos TinyDB en memoria para suppliers, aislada por test."""
    db = TinyDB(storage=MemoryStorage)
    db.table("suppliers")
    with patch(
        "services.api.routes.suppliers.get_suppliers_table",
        return_value=db.table("suppliers"),
    ):
        yield db
    db.close()


@pytest.fixture
def client() -> TestClient:
    """Cliente HTTP de prueba con secret key fija."""
    auth_deps.SECRET_KEY = "test-secret-key-for-testing"
    return TestClient(app)


@pytest.fixture
def admin_token(client: TestClient) -> str:
    """Crea un usuario admin y retorna su token JWT."""
    from services.api.auth import services as auth_services
    from services.api.auth.models import UserRole

    admin_email = "admin@suppliers-test.com"
    admin_password = "adminpass123"
    existing = auth_services.get_user_by_email(admin_email)
    if existing is None:
        auth_services.create_user(email=admin_email, password=admin_password, role=UserRole.ADMIN)

    response = client.post("/auth/login", json={"email": admin_email, "password": admin_password})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def user_token(client: TestClient) -> str:
    """Crea un usuario regular y retorna su token JWT."""
    from services.api.auth import services as auth_services

    user_email = "user@suppliers-test.com"
    user_password = "userpass123"
    existing = auth_services.get_user_by_email(user_email)
    if existing is None:
        auth_services.create_user(email=user_email, password=user_password)

    response = client.post("/auth/login", json={"email": user_email, "password": user_password})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_token}"}


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _valid_spain_payload() -> dict:
    """Payload válido para proveedor en Spain."""
    return {
        "name": "Proveedor Test Spain",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 1500.0,
        "currency": "EUR",
        "status": "active",
    }


def _valid_usa_payload() -> dict:
    """Payload válido para proveedor en USA."""
    return {
        "name": "Proveedor Test USA",
        "country": "USA",
        "categories": ["ats_software", "video_interview"],
        "monthly_rate": 2500.0,
        "currency": "USD",
        "status": "active",
    }


# ====================================================================
# POST /suppliers
# ====================================================================


class TestCreateSupplier:
    """POST /suppliers — Creación de proveedores."""

    def test_happy_path_spain_with_eur(self, client, admin_headers):
        """S1: Proveedor Spain con EUR → 201."""
        response = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Proveedor Test Spain"
        assert data["country"] == "Spain"
        assert data["currency"] == "EUR"
        assert data["status"] == "active"
        assert "id" in data
        assert "updated_at" in data

    def test_happy_path_usa_with_usd(self, client, admin_headers):
        """S2: Proveedor USA con USD → 201."""
        response = client.post("/suppliers", json=_valid_usa_payload(), headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["country"] == "USA"
        assert data["currency"] == "USD"

    def test_edge_case_without_optionals(self, client, admin_headers):
        """S3: Sin campos opcionales (email, notes, renewal) → 201."""
        payload = _valid_spain_payload()
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        # Opcionales deben ser None o no estar presentes
        assert data.get("contact_email") is None or "contact_email" not in data
        assert data.get("notes") is None or "notes" not in data

    def test_edge_case_all_categories(self, client, admin_headers):
        """S4: Con todas las categorías válidas → 201."""
        all_categories = [
            "job_boards", "ats_software", "assessment_tools", "training_platforms",
            "payroll_and_hr_software", "video_interview", "background_check",
            "office_and_facilities", "it_and_software_licenses",
        ]
        payload = {
            "name": "Full Categories Supplier",
            "country": "USA",
            "categories": all_categories,
            "monthly_rate": 5000.0,
            "currency": "USD",
            "status": "active",
        }
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 201
        assert len(response.json()["categories"]) == 9

    def test_failure_wrong_currency_spain(self, client, admin_headers):
        """S5: Spain con USD → 422 (regla de negocio)."""
        payload = _valid_spain_payload()
        payload["currency"] = "USD"
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 422

    def test_failure_wrong_currency_usa(self, client, admin_headers):
        """S6: USA con EUR → 422."""
        payload = _valid_usa_payload()
        payload["currency"] = "EUR"
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 422

    def test_failure_rate_zero(self, client, admin_headers):
        """S7: monthly_rate = 0 → 422."""
        payload = _valid_spain_payload()
        payload["monthly_rate"] = 0
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 422

    def test_failure_rate_negative(self, client, admin_headers):
        """S7-bis: monthly_rate negativo → 422."""
        payload = _valid_spain_payload()
        payload["monthly_rate"] = -100
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 422

    def test_failure_invalid_category(self, client, admin_headers):
        """S8: Categoría inválida → 422."""
        payload = _valid_spain_payload()
        payload["categories"] = ["invalid_category_123"]
        response = client.post("/suppliers", json=payload, headers=admin_headers)
        assert response.status_code == 422

    def test_failure_no_auth(self, client):
        """S9: Sin token → 401."""
        response = client.post("/suppliers", json=_valid_spain_payload())
        assert response.status_code == 401


# ====================================================================
# GET /suppliers
# ====================================================================


class TestListSuppliers:
    """GET /suppliers — Listado de proveedores."""

    def test_happy_path_list_all(self, client, admin_headers, _suppliers_db):
        """S10: Listar todos → 200 con todos los registros."""
        # Crear dos proveedores
        client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        client.post("/suppliers", json=_valid_usa_payload(), headers=admin_headers)

        response = client.get("/suppliers", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_happy_path_filter_by_country(self, client, admin_headers, _suppliers_db):
        """S11: Filtrar por country."""
        client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        client.post("/suppliers", json=_valid_usa_payload(), headers=admin_headers)

        response = client.get("/suppliers?country=Spain", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["country"] == "Spain"

    def test_happy_path_filter_by_category(self, client, admin_headers, _suppliers_db):
        """S12: Filtrar por category."""
        client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        client.post("/suppliers", json=_valid_usa_payload(), headers=admin_headers)

        response = client.get("/suppliers?category=ats_software", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "ats_software" in data[0]["categories"]

    def test_edge_case_empty_db(self, client, admin_headers):
        """S13: DB vacía → 200 con []."""
        response = client.get("/suppliers", headers=admin_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_failure_no_auth(self, client):
        """S14: Sin token → 401."""
        response = client.get("/suppliers")
        assert response.status_code == 401


# ====================================================================
# GET /suppliers/{id}
# ====================================================================


class TestGetSupplier:
    """GET /suppliers/{id} — Detalle de proveedor."""

    def test_happy_path_existing_id(self, client, admin_headers, _suppliers_db):
        """S15: ID existente → 200."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.get(f"/suppliers/{supplier_id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["id"] == supplier_id

    def test_failure_nonexistent_id(self, client, admin_headers):
        """S16: ID inexistente → 404."""
        response = client.get("/suppliers/99999", headers=admin_headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ====================================================================
# PATCH /suppliers/{id}/rate
# ====================================================================


class TestUpdateSupplierRate:
    """PATCH /suppliers/{id}/rate — Actualización de tarifa."""

    def test_happy_path_update_rate(self, client, admin_headers, _suppliers_db):
        """S17: Actualizar tarifa → 200 con nuevo rate y updated_at renovado."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]
        original_updated_at = created.json()["updated_at"]

        response = client.patch(
            f"/suppliers/{supplier_id}/rate",
            json={"monthly_rate": 3000.0},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["monthly_rate"] == 3000.0
        assert response.json()["updated_at"] != original_updated_at

    def test_failure_rate_zero(self, client, admin_headers, _suppliers_db):
        """S18: rate ≤ 0 → 422."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.patch(
            f"/suppliers/{supplier_id}/rate",
            json={"monthly_rate": 0},
            headers=admin_headers,
        )
        assert response.status_code == 422

    def test_failure_rate_negative(self, client, admin_headers, _suppliers_db):
        """S18-bis: rate negativo → 422."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.patch(
            f"/suppliers/{supplier_id}/rate",
            json={"monthly_rate": -50},
            headers=admin_headers,
        )
        assert response.status_code == 422

    def test_failure_nonexistent_id(self, client, admin_headers):
        """S19: ID inexistente → 404."""
        response = client.patch(
            "/suppliers/99999/rate",
            json={"monthly_rate": 1000.0},
            headers=admin_headers,
        )
        assert response.status_code == 404


# ====================================================================
# PATCH /suppliers/{id}/status
# ====================================================================


class TestUpdateSupplierStatus:
    """PATCH /suppliers/{id}/status — Cambio de estado."""

    def test_happy_path_update_status(self, client, admin_headers, _suppliers_db):
        """S20: Cambiar estado → 200."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.patch(
            f"/suppliers/{supplier_id}/status",
            json={"status": "suspended"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "suspended"

    def test_failure_invalid_status(self, client, admin_headers, _suppliers_db):
        """S21: Estado inválido → 422."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.patch(
            f"/suppliers/{supplier_id}/status",
            json={"status": "invalid_status"},
            headers=admin_headers,
        )
        assert response.status_code == 422

    def test_failure_nonexistent_id(self, client, admin_headers):
        """S22: ID inexistente → 404."""
        response = client.patch(
            "/suppliers/99999/status",
            json={"status": "suspended"},
            headers=admin_headers,
        )
        assert response.status_code == 404


# ====================================================================
# DELETE /suppliers/{id}
# ====================================================================


class TestDeleteSupplier:
    """DELETE /suppliers/{id} — Eliminación de proveedor."""

    def test_happy_path_delete(self, client, admin_headers, _suppliers_db):
        """S23: Eliminar existente → 200 + mensaje."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.delete(f"/suppliers/{supplier_id}", headers=admin_headers)
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verificar que ya no existe
        get_response = client.get(f"/suppliers/{supplier_id}", headers=admin_headers)
        assert get_response.status_code == 404

    def test_failure_nonexistent_id(self, client, admin_headers):
        """S24: ID inexistente → 404."""
        response = client.delete("/suppliers/99999", headers=admin_headers)
        assert response.status_code == 404

    def test_failure_no_auth(self, client, admin_headers, _suppliers_db):
        """S25: Sin token → 401."""
        created = client.post("/suppliers", json=_valid_spain_payload(), headers=admin_headers)
        supplier_id = created.json()["id"]

        response = client.delete(f"/suppliers/{supplier_id}")
        assert response.status_code == 401