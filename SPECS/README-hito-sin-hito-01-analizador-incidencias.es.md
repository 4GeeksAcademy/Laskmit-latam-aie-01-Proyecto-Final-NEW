# README — Sin Hito (Analizador de Incidencias)

## Estado del proyecto
Implementado y funcional en dos capas:
- Fase 1: script CLI en Python.
- Fase 2: API FastAPI + UI web estatica.

## Que se hizo en el proyecto
### Fase 1 (script)
- Script principal: `scripts/analyze.py`.
- Lee CSV, valida registros y calcula metricas.
- Imprime resumen en consola y permite exportar CSV.

### Logica compartida
- Modulo reutilizable: `shared/incidents_analysis.py`.
- Centraliza validaciones, agregaciones, resumen y export.
- Evita duplicacion entre script y API.

### Fase 2 (backend)
- API en `services/api/main.py` con endpoints:
  - `GET /api/incidents/health`
  - `POST /api/incidents/analyze`
  - `GET /api/incidents/results/export`

### Fase 2 (frontend)
- UI en `uis/incidents-analyzer/`:
  - carga de archivo CSV
  - visualizacion de resumen
  - descarga de resultados
  - configuracion de URL base de API

## Como correrlo
### 1) Script CLI (Fase 1)
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `.venv/bin/python scripts/analyze.py scripts/incidents-nexova.csv`
3. Responder `y` o `n` a la exportacion.

### 2) Backend API (Fase 2)
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `.venv/bin/uvicorn services.api.main:app --reload --port 8000`

### 3) Frontend Web (Fase 2)
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/incidents-analyzer`
2. `python -m http.server 5500`
3. Abrir `http://localhost:5500`
4. Dejar API base URL en `http://localhost:8000` (o ajustar segun puerto).

## Como probar que funciona
### Validacion del script (comprobado)
Con `scripts/incidents-nexova.csv` produce:
- 100 registros totales
- 96 validos
- 4 invalidos
- promedio satisfaccion 3.84

### Validacion de API (comprobado)
- `GET /api/incidents/health` retorna `{"status":"ok"}`.
- `POST /api/incidents/analyze` con el CSV retorna resumen JSON con los mismos totales.
- `GET /api/incidents/results/export` retorna CSV con metricas.

### Validacion de UI
- Permite cargar CSV y mostrar metricas generales.
- Permite descargar CSV desde boton de export.

## Archivos principales
- `scripts/analyze.py`
- `scripts/incidents-nexova.csv`
- `shared/incidents_analysis.py`
- `services/api/main.py`
- `services/api/requirements.txt`
- `uis/incidents-analyzer/index.html`
- `uis/incidents-analyzer/app.js`
- `uis/incidents-analyzer/styles.css`
