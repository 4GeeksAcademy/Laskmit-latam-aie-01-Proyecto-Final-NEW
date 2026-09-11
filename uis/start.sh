#!/bin/sh
set -e

echo "=== Arrancando website (puerto 3000) ==="
cd /app/website && npm run dev -- --port 3000 &

echo "=== Arrancando backoffice (puerto 3001) ==="
cd /app/backoffice && npm run dev -- --port 3001 &

# Esperar a que cualquier proceso hijo termine
wait