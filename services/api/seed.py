from __future__ import annotations

from datetime import datetime, timezone
import os
import sys

from dotenv import load_dotenv
from passlib.hash import bcrypt as bcrypt_hasher
from pydantic import ValidationError
from tinydb import Query

# Fallback de imports para soportar ejecución desde distintos cwd.
try:
    from services.api.auth.models import UserDomain, UserRole
    from services.api.database import get_db, get_suppliers_table
    from services.api.models import SupplierCreate
except ModuleNotFoundError:
    from auth.models import UserDomain, UserRole
    from database import get_db, get_suppliers_table
    from models import SupplierCreate

# Cargar variables de entorno para obtener credenciales del admin.
load_dotenv()

# Dataset oficial solicitado por negocio para no iniciar con base vacía.
SUPPLIERS_SEED = [
    {
        "name": "LinkedIn Talent Solutions",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 1200.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-03-31",
        "contact_email": "account@linkedin.com",
        "notes": "Licencia corporativa para publicacion de ofertas y busqueda de candidatos.",
    },
    {
        "name": "InfoJobs Premium",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 490.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-06-30",
        "contact_email": "empresas@infojobs.net",
    },
    {
        "name": "Indeed Sponsored",
        "country": "USA",
        "categories": ["job_boards"],
        "monthly_rate": 850.0,
        "currency": "USD",
        "status": "active",
        "contact_email": "sales@indeed.com",
        "notes": "Campanas de pago por clic para perfiles de customer support en Miami.",
    },
    {
        "name": "Workable",
        "country": "Spain",
        "categories": ["ats_software"],
        "monthly_rate": 299.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-09-15",
        "contact_email": "support@workable.com",
        "notes": "ATS principal para el equipo de seleccion de Valencia.",
    },
    {
        "name": "Greenhouse",
        "country": "USA",
        "categories": ["ats_software"],
        "monthly_rate": 620.0,
        "currency": "USD",
        "status": "suspended",
        "contact_email": "accounts@greenhouse.io",
        "notes": "Suspendido tras no renovar. Sergio esta evaluando si migrar todo a Workable.",
    },
    {
        "name": "Thomas International",
        "country": "Spain",
        "categories": ["assessment_tools"],
        "monthly_rate": 380.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-12-01",
        "contact_email": "clientes@thomas.es",
        "notes": "Tests de personalidad y aptitud para procesos de mandos intermedios.",
    },
    {
        "name": "HireVue",
        "country": "USA",
        "categories": ["video_interview"],
        "monthly_rate": 540.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-08-31",
        "contact_email": "support@hirevue.com",
    },
    {
        "name": "Udemy Business",
        "country": "Spain",
        "categories": ["training_platforms"],
        "monthly_rate": 420.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2026-01-15",
        "contact_email": "business@udemy.com",
        "notes": "Licencias para el equipo interno. Gestionado por Elena Vargas.",
    },
    {
        "name": "Coursera for Teams",
        "country": "USA",
        "categories": ["training_platforms"],
        "monthly_rate": 399.0,
        "currency": "USD",
        "status": "suspended",
        "contact_email": "teams@coursera.com",
        "notes": "Suspendido por bajo uso. Revisar antes de Q4.",
    },
    {
        "name": "Sage HR",
        "country": "Spain",
        "categories": ["payroll_and_hr_software"],
        "monthly_rate": 310.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-10-01",
        "contact_email": "soporte@sage.com",
        "notes": "Software de nominas y gestion de personal para la sede de Valencia.",
    },
    {
        "name": "Gusto",
        "country": "USA",
        "categories": ["payroll_and_hr_software"],
        "monthly_rate": 280.0,
        "currency": "USD",
        "status": "active",
        "contact_email": "support@gusto.com",
        "notes": "Gestion de nominas para los empleados de la oficina de Miami.",
    },
    {
        "name": "Checkr",
        "country": "USA",
        "categories": ["background_check"],
        "monthly_rate": 195.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-11-30",
        "contact_email": "sales@checkr.com",
    },
    {
        "name": "Microsoft 365 Business",
        "country": "Spain",
        "categories": ["it_and_software_licenses"],
        "monthly_rate": 760.0,
        "currency": "EUR",
        "status": "active",
        "contact_email": "enterprise@microsoft.com",
        "notes": "Licencias para toda la plantilla de Valencia y Miami.",
    },
    {
        "name": "Regus Valencia",
        "country": "Spain",
        "categories": ["office_and_facilities"],
        "monthly_rate": 2400.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-07-01",
        "contact_email": "valencia@regus.com",
        "notes": "Alquiler de la oficina principal en Valencia. Incluye sala de reuniones.",
    },
    {
        "name": "WeWork Miami",
        "country": "USA",
        "categories": ["office_and_facilities"],
        "monthly_rate": 3100.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-09-30",
        "contact_email": "miami@wework.com",
    },
]


def _admin_credentials() -> tuple[str, str]:
    email = os.getenv("USUARIO_ADMINISTRADOR")
    password = os.getenv("CLAVE_ADMINISTRADOR")
    if not email or not password:
        raise ValueError("Administrator credentials are not configured.")
    return email, password


def main() -> int:
    try:
        admin_email, admin_password = _admin_credentials()
    except ValueError:
        print("Error: administrator credentials are not configured.", file=sys.stderr)
        return 1

    # ── 1. Crear/asegurar usuario administrador ──────────────────────
    try:
        db = get_db()
        users_table = db.table("users")
        user_query = Query()

        existing_admin = users_table.get(user_query.email == admin_email)
        if existing_admin:
            print(f"Admin user '{admin_email}' already exists. Skipping.")
        else:
            admin_domain = UserDomain(
                email=admin_email,
                hashed_password=bcrypt_hasher.hash(admin_password),
                role=UserRole.ADMIN,
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            users_table.insert(admin_domain.model_dump(mode="json"))
            print(f"Admin user '{admin_email}' created successfully.")
    except (OSError, ValueError, ValidationError):
        print("Error: unable to seed the administrator account.", file=sys.stderr)
        return 1

    # ── 2. Carga idempotente de proveedores ─────────────────────────
    suppliers_table = get_suppliers_table()
    supplier_query = Query()

    inserted = 0
    skipped = 0

    try:
        for raw_supplier in SUPPLIERS_SEED:
            # Reutiliza validación Pydantic para asegurar consistencia del seed.
            supplier = SupplierCreate.model_validate(raw_supplier)
            existing = suppliers_table.get(
                (supplier_query.name == supplier.name)
                & (supplier_query.country == supplier.country.value)
            )
            if existing:
                skipped += 1
                continue

            payload = supplier.model_dump(mode="json")
            # El timestamp inicial también lo define el backend.
            payload["updated_at"] = datetime.now(timezone.utc).isoformat()
            suppliers_table.insert(payload)
            inserted += 1
    except (OSError, ValueError, ValidationError):
        print("Error: unable to seed suppliers.", file=sys.stderr)
        return 1

    print(
        f"Seeder completed. total={len(SUPPLIERS_SEED)} inserted={inserted} skipped={skipped}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
