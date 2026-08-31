from __future__ import annotations

from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from services.api.routes.suppliers import router as suppliers_router
except ModuleNotFoundError:
    from routes.suppliers import router as suppliers_router

try:
    from services.api.routes.incidents import router as incidents_router
except ModuleNotFoundError:
    from routes.incidents import router as incidents_router

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


app = FastAPI(title="Nexova Operations API", version="1.2.0")

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
