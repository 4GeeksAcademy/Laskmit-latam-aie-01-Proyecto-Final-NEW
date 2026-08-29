# Nexova Incidents API

Backend para la Fase 2 del analizador de incidencias.

## Endpoints

- `POST /api/incidents/analyze`
  - Entrada: `multipart/form-data` con el campo `file` (CSV UTF-8)
  - Salida: resumen JSON del análisis
- `GET /api/incidents/results/export`
  - Salida: descarga CSV con una fila por métrica
- `GET /api/incidents/health`
  - Salida: estado de salud del servicio

## Requisitos

- Python 3.11+

## Ejecución

### Local

```bash
cd services/api
python -m uvicorn main:app --reload --port 8000
```

### Codespaces

```bash
cd services/api
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

> 🌐 En Codespaces haz público el puerto 8000 desde la pestaña **Puertos** de VS Code
> (click derecho → Port Visibility → Public) para que el frontend pueda conectarse.

La API quedará en `http://localhost:8000` (local) o en una URL pública `https://<nombre>-8000.preview.app.github.dev` (Codespaces).

## Smoke test de Suppliers

Para validar rápidamente el flujo principal del directorio de proveedores:

```bash
cd services/api
python smoke_test_suppliers.py
```

El script verifica:
- listado general
- validación 422 en payload inválido
- creación de proveedor
- actualización de tarifa
- actualización de estado
- filtros por país y categoría
- eliminación y validación 404 posterior
