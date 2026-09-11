#!/bin/sh
set -e

echo "=== Arrancando FastAPI (puerto 8000) ==="
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload