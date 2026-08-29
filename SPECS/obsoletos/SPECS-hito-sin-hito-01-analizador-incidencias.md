# SPECS — Sin Hito (Analizador de Incidencias)

## Estructura de carpetas/archivos
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/
├── data/
│   ├── raw/
│   │   └── incidents-nexova.csv
│   └── process/
│       ├── results.csv
│       └── results-Fase-1.csv
├── scripts/
│   └── analyze.py
├── shared/
│   └── incidents_analysis.py
├── services/
│   └── api/
│       ├── main.py
│       ├── requirements.txt
│       └── README.md
└── uis/
    └── incidents-analyzer/
        ├── index.html
        ├── app.js
        ├── styles.css
        └── README.md
```

## Especificaciones de backend/API
En `services/api/main.py`:
- `GET /api/incidents/health`
  - Respuesta: estado del servicio.
- `POST /api/incidents/analyze`
  - Entrada: `multipart/form-data` con campo `file`.
  - Salida: JSON con resumen de metricas.
- `GET /api/incidents/results/export`
  - Salida: CSV descargable del ultimo analisis.

## Especificaciones de logica (modulo compartido)
En `shared/incidents_analysis.py`:
- Validaciones por reglas de negocio:
  - empresa faltante
  - categoria invalida/faltante
  - descripcion vacia/corta
  - agent_id invalido
  - status invalido
  - email invalido
  - closed sin score
  - score fuera de rango
- Calculos:
  - totales validos/invalidos
  - conteo por categoria
  - conteo por estado
  - promedio de satisfaccion
  - distribucion de scores 1..5
- Export:
  - conversion de resultado a filas CSV metrica por fila

## Especificaciones de frontend
En `uis/incidents-analyzer/index.html` + `uis/incidents-analyzer/app.js`:
- Selector de archivo CSV.
- Campo de configuracion de API base URL.
- Boton para analizar (POST a `/api/incidents/analyze`).
- Render de resultados en tarjetas/listas.
- Boton de descarga CSV (GET a `/api/incidents/results/export`).

## Funciones clave en frontend
- `analyzeCsv()`
- `renderSummary(summary)`
- `exportCsv()`
- `buildApiUrl(path)`

## Criterios de reconocimiento rapido
- La misma logica se reutiliza en script y API (`shared/incidents_analysis.py`).
- Existe flujo completo de carga > analisis > visualizacion > exportacion.
