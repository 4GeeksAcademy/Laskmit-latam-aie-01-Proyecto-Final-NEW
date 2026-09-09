from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel

try:
    from services.api.database import engine as supabase_engine
except ModuleNotFoundError:
    from database import engine as supabase_engine  # type: ignore[no-redef]

try:
    from services.api.routes.suppliers import router as suppliers_router
except ModuleNotFoundError:
    from routes.suppliers import router as suppliers_router

try:
    from services.api.routes.incidents import IncidentValidationError, router as incidents_router
except ModuleNotFoundError:
    from routes.incidents import IncidentValidationError, router as incidents_router

try:
    from services.api.routes.auth import router as auth_router
except ModuleNotFoundError:
    from routes.auth import router as auth_router  # type: ignore[no-redef]

try:
    from services.api.routes.users import router as users_router
except ModuleNotFoundError:
    from routes.users import router as users_router  # type: ignore[no-redef]

try:
    from services.api.routes.profiles import router as profiles_router
except ModuleNotFoundError:
    from routes.profiles import router as profiles_router  # type: ignore[no-redef]

try:
    from services.api.routers.inventory import router as inventory_router
except ModuleNotFoundError:
    from routers.inventory import router as inventory_router  # type: ignore[no-redef]  # type: ignore[no-redef]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas en Supabase si no existen
    SQLModel.metadata.create_all(supabase_engine)
    yield


app = FastAPI(title="Nexova Operations API", version="1.3.0", lifespan=lifespan)


@app.exception_handler(IncidentValidationError)
async def incident_validation_error_handler(
    request: Request,
    error: IncidentValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": {"field": error.field, "message": error.message}},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suppliers_router)
app.include_router(incidents_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(inventory_router)
