from __future__ import annotations

from datetime import datetime, timezone

from tinydb.table import Document

try:
    from services.api.database import get_incidents_table
    from services.api.models import (
        IncidentBranch,
        IncidentCategory,
        IncidentCreate,
        IncidentOrigin,
        IncidentResponse,
        IncidentStatus,
        IncidentSummary,
    )
except ModuleNotFoundError:
    from database import get_incidents_table
    from models import (
        IncidentBranch,
        IncidentCategory,
        IncidentCreate,
        IncidentOrigin,
        IncidentResponse,
        IncidentStatus,
        IncidentSummary,
    )


VALID_TRANSITIONS = {
    IncidentStatus.OPEN: {IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED, IncidentStatus.DISCARDED},
    IncidentStatus.RESOLVED: set(),
    IncidentStatus.DISCARDED: set(),
}


class InvalidStatusTransitionError(ValueError):
    pass


def _to_response(document: Document) -> IncidentResponse:
    payload = dict(document)
    payload["id"] = document.doc_id
    return IncidentResponse.model_validate(payload)


def create_incident(incident: IncidentCreate) -> IncidentResponse:
    incidents = get_incidents_table()
    now = datetime.now(timezone.utc).isoformat()
    payload = incident.model_dump(mode="json")
    payload.update(status=IncidentStatus.OPEN.value, created_at=now, updated_at=now)
    incident_id = incidents.insert(payload)
    created = incidents.get(doc_id=incident_id)
    if created is None:
        raise RuntimeError("Incident could not be created.")
    return _to_response(created)


def list_incidents(
    status: IncidentStatus | None = None,
    origin: IncidentOrigin | None = None,
    branch: IncidentBranch | None = None,
    category: IncidentCategory | None = None,
) -> list[IncidentResponse]:
    filtered: list[IncidentResponse] = []
    for document in get_incidents_table():
        if status is not None and document.get("status") != status.value:
            continue
        if origin is not None and document.get("origin") != origin.value:
            continue
        if branch is not None and document.get("branch") != branch.value:
            continue
        if category is not None and document.get("category") != category.value:
            continue
        filtered.append(_to_response(document))
    return sorted(filtered, key=lambda incident: (incident.created_at, incident.id), reverse=True)


def get_incident(incident_id: int) -> IncidentResponse | None:
    document = get_incidents_table().get(doc_id=incident_id)
    return _to_response(document) if document is not None else None


def update_incident_status(incident_id: int, new_status: IncidentStatus) -> IncidentResponse | None:
    incidents = get_incidents_table()
    existing = incidents.get(doc_id=incident_id)
    if existing is None:
        return None

    current_status = IncidentStatus(existing["status"])
    if new_status not in VALID_TRANSITIONS[current_status]:
        raise InvalidStatusTransitionError(
            f"No se puede cambiar el estado de {current_status.value} a {new_status.value}."
        )

    incidents.update(
        {"status": new_status.value, "updated_at": datetime.now(timezone.utc).isoformat()},
        doc_ids=[incident_id],
    )
    updated = incidents.get(doc_id=incident_id)
    if updated is None:
        raise RuntimeError("Incident could not be updated.")
    return _to_response(updated)


def get_incident_summary() -> IncidentSummary:
    by_status = {value: 0 for value in IncidentStatus}
    by_category = {value: 0 for value in IncidentCategory}
    by_origin = {value: 0 for value in IncidentOrigin}
    by_branch = {value: 0 for value in IncidentBranch}
    documents = get_incidents_table().all()

    for document in documents:
        by_status[IncidentStatus(document["status"])] += 1
        by_category[IncidentCategory(document["category"])] += 1
        by_origin[IncidentOrigin(document["origin"])] += 1
        by_branch[IncidentBranch(document["branch"])] += 1

    return IncidentSummary(
        total=len(documents),
        by_status=by_status,
        by_category=by_category,
        by_origin=by_origin,
        by_branch=by_branch,
    )