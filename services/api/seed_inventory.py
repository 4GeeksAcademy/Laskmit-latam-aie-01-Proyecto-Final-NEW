#!/usr/bin/env python3
"""Siembra las tablas de inventario con datos mínimos para desarrollo y demo.

Uso:
    cd services/api
    uv run python seed_inventory.py

Requiere DATABASE_URL configurado en .env.
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, select

# Fallback de imports para soportar ejecución desde distintos cwd.
try:
    from services.api.database import engine
    from services.api.models import Asset, AssetEntry, AssetExit
except ModuleNotFoundError:
    from database import engine
    from models import Asset, AssetEntry, AssetExit

load_dotenv()


SEED_USER_UUID = "seed-script"


def seed():
    print("🔧 Creando tablas si no existen...")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as db:
        # ── Assets ──────────────────────────────────────────────
        existing = db.exec(select(Asset)).all()
        if existing:
            print(f"⚠️  Ya existen {len(existing)} activos. Se omite el seed (ejecuta con base vacía).")
            return

        assets_data = [
            Asset(name='Portátil 14" Business', sku="NXV-IT-001", category="hardware", office="Valencia"),
            Asset(name='Portátil 14" Business', sku="NXV-IT-002", category="hardware", office="Miami"),
            Asset(name="Ratón ergonómico", sku="NXV-PER-001", category="peripherals", office="Valencia"),
            Asset(name="Hub USB-C", sku="NXV-PER-002", category="peripherals", office="Miami"),
            Asset(name="Resma de papel A4", sku="NXV-OFF-001", category="office_supplies", office="Valencia"),
            Asset(name="Cuaderno de formación en liderazgo", sku="NXV-TRN-001", category="training_materials", office="Valencia"),
        ]
        db.add_all(assets_data)
        db.commit()
        for a in assets_data:
            db.refresh(a)
        print(f"✅ {len(assets_data)} activos creados.")

        # Mapa SKU → id
        sku_map: dict[str, int] = {a.sku: a.id for a in assets_data}

        # ── AssetEntries ──────────────────────────────────────────
        entries_data = [
            AssetEntry(asset_id=sku_map["NXV-IT-001"], quantity=10, supplier="TechDistrib Valencia S.L.", office="Valencia", user_uuid=SEED_USER_UUID),
            AssetEntry(asset_id=sku_map["NXV-IT-001"], quantity=5, supplier="CompuGlobal España", office="Valencia", user_uuid=SEED_USER_UUID),
            AssetEntry(asset_id=sku_map["NXV-PER-002"], quantity=20, supplier="Office Depot Miami", office="Miami", user_uuid=SEED_USER_UUID),
            AssetEntry(asset_id=sku_map["NXV-OFF-001"], quantity=50, supplier="Papelera del Mediterráneo", office="Valencia", user_uuid=SEED_USER_UUID),
        ]
        db.add_all(entries_data)
        db.commit()
        print(f"✅ {len(entries_data)} entradas creadas.")

        # ── AssetExits ────────────────────────────────────────────
        exits_data = [
            AssetExit(asset_id=sku_map["NXV-IT-001"], quantity=2, exit_type="allocation", assigned_to="Ana Martínez", office="Valencia", user_uuid=SEED_USER_UUID),
            AssetExit(asset_id=sku_map["NXV-PER-002"], quantity=5, exit_type="allocation", assigned_to="John Smith", office="Miami", user_uuid=SEED_USER_UUID),
            AssetExit(asset_id=sku_map["NXV-OFF-001"], quantity=10, exit_type="consumption", assigned_to=None, office="Valencia", user_uuid=SEED_USER_UUID),
        ]
        db.add_all(exits_data)
        db.commit()
        print(f"✅ {len(exits_data)} salidas creadas.")

        # ── Verificación ──────────────────────────────────────────
        print("\n📊 Verificación de stock:")
        for asset in db.exec(select(Asset)).all():
            from sqlmodel import func
            total_entries = db.scalar(
                select(func.coalesce(func.sum(AssetEntry.quantity), 0)).where(AssetEntry.asset_id == asset.id, AssetEntry.office == asset.office)
            )
            total_exits = db.scalar(
                select(func.coalesce(func.sum(AssetExit.quantity), 0)).where(AssetExit.asset_id == asset.id, AssetExit.office == asset.office)
            )
            stock = (total_entries or 0) - (total_exits or 0)
            print(f"   {asset.sku:20s} ({asset.office:8s}): entradas={total_entries or 0}, salidas={total_exits or 0}, stock={stock}")

    print("\n🎉 Seed completado exitosamente.")


if __name__ == "__main__":
    seed()
    sys.exit(0)