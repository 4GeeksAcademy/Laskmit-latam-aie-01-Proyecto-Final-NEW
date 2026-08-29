from __future__ import annotations

from dataclasses import dataclass

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response
from tinydb.table import Document

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import dependencies as auth_deps
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


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


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