# Dockerfile para el contenedor del backend FastAPI
# Basado en Python slim para imagen ligera
FROM python:3.11-slim

# Instalar uv (gestor de paquetes Python ultrarrápido)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /repo/services/api

# Copiar solo requirements.txt primero para aprovechar la caché de capas
COPY api/requirements.txt ./requirements.txt

# Instalar dependencias con uv (--system para usar el Python del contenedor)
RUN uv pip install --system -r requirements.txt

# NOTA: El código fuente se monta por bind mount desde docker-compose.yml.
# No se copia en el build porque el mount sobreescribe /repo.
# En ejecución directa sin Compose, montar el repositorio raíz en /repo.

# Exponer el puerto del servidor
EXPOSE 8000

# Comando por defecto (sobreescrito por docker-compose.yml)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]