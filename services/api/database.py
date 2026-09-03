from __future__ import annotations

from pathlib import Path

from tinydb import TinyDB

# Ubicaciones físicas del archivo JSON persistente de TinyDB.
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "suppliers_db.json"
SUPPLIERS_TABLE_NAME = "suppliers"
INCIDENTS_TABLE_NAME = "incidents"
INCIDENT_SEED_KEYS_TABLE_NAME = "incident_seed_keys"


def get_db() -> TinyDB:
    # Crea carpeta de datos en caliente si no existe.
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return TinyDB(DB_PATH)


def get_suppliers_table():
    # Tabla principal donde vive el directorio de proveedores.
    return get_db().table(SUPPLIERS_TABLE_NAME)


def get_incidents_table():
    return get_db().table(INCIDENTS_TABLE_NAME)


def get_incident_seed_keys_table():
    return get_db().table(INCIDENT_SEED_KEYS_TABLE_NAME)
