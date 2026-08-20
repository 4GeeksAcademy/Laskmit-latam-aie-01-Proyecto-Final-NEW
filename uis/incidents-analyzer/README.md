# Nexova Incidents Analyzer UI

**Proyecto:** Sin Hito 01 — Analizador de Incidencias (Frontend)  
**Empresa:** Nexova  
**Ubicación en el monorepo:** `uis/incidents-analyzer/`

Frontend web para cargar archivos CSV de incidencias, visualizar el resumen del análisis y descargar los resultados exportados.

> ⚠️ **Requiere que la API esté corriendo** para funcionar.  
> Ver instrucciones completas abajo.

---

## Cómo ejecutar (Codespaces / local)

Necesitas **dos terminales** corriendo al mismo tiempo:

### Terminal 1 — API Backend (FastAPI)

```bash
cd services/api
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

### Terminal 2 — Frontend (HTTP server)

```bash
cd uis/incidents-analyzer
python -m http.server 5500
```

> ⚠️ **En Codespaces:** El frontend se carga por HTTPS pero la API corre en HTTP.  
> El frontend **detecta automáticamente** la URL pública del puerto 8000.  
> Si no funciona, haz público el puerto 8000 desde la pestaña **Puertos** de VS Code
> (click derecho → Port Visibility → Public) y verifica que el campo "API base URL"
> muestre la URL correcta (`https://<nombre>-8000.preview.app.github.dev`).

---

## Cómo probar

1. Asegúrate de que ambos servidores estén corriendo (Terminal 1 + Terminal 2).
2. Abre `http://localhost:5500` (o la URL pública del puerto 5500 en Codespaces).
3. Verifica que el campo **API base URL** tenga la URL correcta.
4. Selecciona un archivo CSV de incidencias **(ej: `scripts/incidents-nexova.csv`)**.
   > ⚠️ No uses `results.csv` de la raíz — ese es un archivo de resultados, no de entrada.
5. Haz clic en **Analizar archivo** — debe mostrar el resumen con métricas.
6. Haz clic en **Descargar CSV** para exportar los resultados.

---

## Funcionalidad

- Selector de archivo CSV con campo configurable de API base URL (auto-detect en Codespaces).
- Envío a `POST /api/incidents/analyze` como `multipart/form-data`.
- Renderizado del resumen en tarjetas y listas.
- Botón de descarga CSV desde `GET /api/incidents/results/export`.

---

## Configuración

- Campo `API base URL`: por defecto `http://localhost:8000`
- Botón `Analizar archivo`: envía `multipart/form-data` a `POST /api/incidents/analyze`
- Botón `Descargar CSV`: llama `GET /api/incidents/results/export`

---

## Archivos principales

```
uis/incidents-analyzer/
├── index.html    # Página principal
├── app.js        # Lógica frontend (fetch a la API, render)
├── styles.css    # Estilos
└── README.md
```
