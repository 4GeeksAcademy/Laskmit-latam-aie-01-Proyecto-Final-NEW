from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from tinydb.table import Document

# Cargar variables de entorno desde .env.
load_dotenv()

# Fallback de imports para soportar ejecución desde raíz o desde services/api.
try:
    from services.api.auth import services
except ModuleNotFoundError:
    from auth import services  # type: ignore[no-redef]


# Configuración desde variables de entorno.
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Esquema OAuth2: extrae el token del header Authorization: Bearer <token>.
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: int) -> str:
    """Genera un token JWT firmado con el user_id como subject (sub).

    La expiración se lee desde la variable de entorno ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    from datetime import datetime, timedelta, timezone

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Document:
    """Dependencia reutilizable que identifica al usuario a partir del token JWT.

    1. Extrae y decodifica el token desde el header Authorization: Bearer <token>.
    2. Recupera el usuario desde TinyDB usando el 'sub' (user_id).
    3. Verifica que el usuario exista y esté activo.

    Lanza HTTPException(401) si algo falla.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise credentials_exception
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValueError):
        raise credentials_exception

    user_doc = services.get_user_doc_from_db(user_id)
    if user_doc is None:
        raise credentials_exception

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_doc


def get_current_active_admin(current_user: Document = Depends(get_current_user)) -> Document:
    """Verifica que el usuario autenticado sea admin.

    Útil para rutas que solo deben permitir administradores.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires admin privileges",
        )
    return current_user