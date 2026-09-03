from __future__ import annotations

from dataclasses import dataclass

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
    from services.api.incidents import service as incident_service
    from services.api.models import (
        IncidentBranch,
        IncidentCategory,
        IncidentCreate,
        IncidentOrigin,
        IncidentResponse,
        IncidentStatus,
        IncidentStatusUpdate,
        IncidentSummary,
    )
    from shared.incidents_analysis import (
        InvalidCsvFormatError,
        analyze_csv_bytes,
        export_result_to_csv_bytes,
        result_to_summary_dict,
    )
except ModuleNotFoundError:
    from pathlib import Path
    import sys
    from auth import dependencies as auth_deps  # type: ignore[no-redef]
    from incidents import service as incident_service  # type: ignore[no-redef]
    from models import (
        IncidentBranch,
        IncidentCategory,
        IncidentCreate,
        IncidentOrigin,
        IncidentResponse,
        IncidentStatus,
        IncidentStatusUpdate,
        IncidentSummary,
    )

    repo_root = Path(__file__).resolve().parents[3]
    if str(repo_root) not in sys.path:
        sys.path.append(str(repo_root))
    from shared.incidents_analysis import (
        InvalidCsvFormatError,
        analyze_csv_bytes,
        export_result_to_csv_bytes,
        result_to_summary_dict,
    )


router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@dataclass
class LastAnalysisStore:
    source_filename: str
    export_csv_bytes: bytes
    summary: dict[str, object]


_last_analysis: LastAnalysisStore | None = None


class IncidentValidationError(Exception):
    def __init__(self, field: str | None, message: str) -> None:
        self.field = field
        self.message = message
        super().__init__(message)


def _validation_error(error: ValidationError) -> IncidentValidationError:
    first_error = error.errors()[0]
    location = first_error.get("loc", ())
    field = str(location[-1]) if location else None
    return IncidentValidationError(field, first_error["msg"])


def _parse_enum(value: str | None, enum_type, field: str):
    if value is None:
        return None
    try:
        return enum_type(value)
    except ValueError as error:
        raise IncidentValidationError(field, f"Selecciona un valor valido para {field}.") from error


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    raw_payload: dict = Body(...),
    current_user: Document = Depends(auth_deps.get_current_user),
) -> IncidentResponse:
    try:
        payload = IncidentCreate.model_validate(raw_payload)
    except ValidationError as error:
        raise _validation_error(error) from error
    return incident_service.create_incident(payload)


@router.get("", response_model=list[IncidentResponse])
def list_incidents(
    incident_status: str | None = Query(default=None, alias="status"),
    origin: str | None = Query(default=None),
    branch: str | None = Query(default=None),
    category: str | None = Query(default=None),
    current_user: Document = Depends(auth_deps.get_current_user),
) -> list[IncidentResponse]:
    return incident_service.list_incidents(
        status=_parse_enum(incident_status, IncidentStatus, "status"),
        origin=_parse_enum(origin, IncidentOrigin, "origin"),
        branch=_parse_enum(branch, IncidentBranch, "branch"),
        category=_parse_enum(category, IncidentCategory, "category"),
    )


@router.get("/summary", response_model=IncidentSummary)
def get_incident_summary(
    current_user: Document = Depends(auth_deps.get_current_user),
) -> IncidentSummary:
    return incident_service.get_incident_summary()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: int,
    raw_payload: dict = Body(...),
    current_user: Document = Depends(auth_deps.get_current_user),
) -> IncidentResponse:
    try:
        payload = IncidentStatusUpdate.model_validate(raw_payload)
    except ValidationError as error:
        raise _validation_error(error) from error
    try:
        updated = incident_service.update_incident_status(incident_id, payload.status)
    except incident_service.InvalidStatusTransitionError as error:
        raise IncidentValidationError("status", str(error)) from error
    if updated is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return updated


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    current_user: Document = Depends(auth_deps.get_current_user),
) -> IncidentResponse:
    incident = incident_service.get_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incident


@router.post("/analyze")
async def analyze_incidents(
    file: UploadFile = File(...),
    current_user: Document = Depends(auth_deps.get_current_user),
) -> JSONResponse:
    global _last_analysis

    if not file.filename:
        raise HTTPException(status_code=400, detail="A CSV file is required.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = analyze_csv_bytes(content)
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.") from error
    except InvalidCsvFormatError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {error}") from error

    summary = result_to_summary_dict(result)
    export_csv_bytes = export_result_to_csv_bytes(result)
    _last_analysis = LastAnalysisStore(
        source_filename=file.filename,
        export_csv_bytes=export_csv_bytes,
        summary=summary,
    )

    return JSONResponse(
        {
            "message": "Analysis completed",
            "source_file": file.filename,
            "summary": summary,
        }
    )


@router.get("/results/export")
def export_latest_result(
    current_user: Document = Depends(auth_deps.get_current_user),
) -> Response:
    if _last_analysis is None:
        raise HTTPException(status_code=404, detail="No analysis found. Run /api/incidents/analyze first.")

    return Response(
        content=_last_analysis.export_csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=incidents-results.csv",
        },
    )