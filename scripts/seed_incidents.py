from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, time, timezone
from pathlib import Path

from tinydb import Query
from tinydb.table import Table

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from services.api.database import get_incident_seed_keys_table, get_incidents_table
from shared.incidents_analysis import REQUIRED_FIELDS, normalize, validate_record


STATUS_MAP = {
    "OPEN": "open",
    "CLOSED": "resolved",
    "DISCARDED": "discarded",
}

CATEGORY_MAP = {
    "TECHNICAL": "technical_failure",
    "BILLING": "process_error",
    "ACCESS": "technical_failure",
    "HR_QUERY": "process_error",
    "COMPLAINT": "client_complaint",
}


@dataclass
class SeedReport:
    read: int = 0
    valid: int = 0
    inserted: int = 0
    skipped: int = 0
    discarded: int = 0
    discard_reasons: Counter[str] = field(default_factory=Counter)


def _parse_created_at(raw_date: str) -> str:
    parsed_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
    return datetime.combine(parsed_date, time.min, tzinfo=timezone.utc).isoformat()


def _seed_key(record: dict[str, str], title: str, created_at: str) -> str:
    ticket_id = normalize(record.get("ticket_id"))
    source_key = ticket_id or f"{title}|{created_at}"
    return hashlib.sha256(source_key.encode("utf-8")).hexdigest()


def seed_incidents(
    csv_path: Path,
    incidents_table: Table | None = None,
    seed_keys_table: Table | None = None,
) -> SeedReport:
    incidents = incidents_table if incidents_table is not None else get_incidents_table()
    seed_keys = seed_keys_table if seed_keys_table is not None else get_incident_seed_keys_table()
    report = SeedReport()

    with csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        if not reader.fieldnames:
            raise ValueError("CSV file is missing a header row.")
        missing = [field_name for field_name in REQUIRED_FIELDS if field_name not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSV file is missing required columns: {', '.join(missing)}")

        for record in reader:
            report.read += 1
            is_valid, reasons, _ = validate_record(record)
            if not is_valid:
                report.discarded += 1
                report.discard_reasons.update(reasons)
                continue

            description = record.get("description", "")
            title = description[:120].strip()
            if not title:
                report.discarded += 1
                report.discard_reasons.update(["invalid_title"])
                continue

            try:
                created_at = _parse_created_at(normalize(record.get("date")))
                status = STATUS_MAP[normalize(record.get("status"))]
                category = CATEGORY_MAP[normalize(record.get("category"))]
            except ValueError:
                report.discarded += 1
                report.discard_reasons.update(["invalid_date"])
                continue
            except KeyError:
                report.discarded += 1
                report.discard_reasons.update(["unmapped_value"])
                continue

            report.valid += 1
            key_hash = _seed_key(record, title, created_at)
            if seed_keys.contains(Query().key_hash == key_hash):
                report.skipped += 1
                continue

            incidents.insert(
                {
                    "title": title,
                    "description": description,
                    "category": category,
                    "status": status,
                    "origin": "customer",
                    "branch": "central",
                    "created_at": created_at,
                    "updated_at": created_at,
                }
            )
            seed_keys.insert({"key_hash": key_hash})
            report.inserted += 1

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Carga el historico de incidencias de Nexova.")
    parser.add_argument(
        "csv_path",
        nargs="?",
        type=Path,
        default=REPO_ROOT / "data" / "raw" / "incidents-nexova.csv",
    )
    args = parser.parse_args()

    try:
        report = seed_incidents(args.csv_path)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"Seed failed: {error}", file=sys.stderr)
        return 1

    print(f"Filas leidas: {report.read}")
    print(f"Filas validas: {report.valid}")
    print(f"Filas insertadas: {report.inserted}")
    print(f"Filas omitidas: {report.skipped}")
    print(f"Filas descartadas: {report.discarded}")
    if report.discard_reasons:
        print("Motivos de descarte:")
        for reason, count in sorted(report.discard_reasons.items()):
            print(f"- {reason}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())