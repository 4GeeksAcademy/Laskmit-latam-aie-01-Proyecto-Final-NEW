# Nexova — Monorepo Corporativo

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Proyecto transversal del Programa de Carrera en Ingeniería de IA — 4Geeks Academy._

---

## Empresa

**Nexova Solutions** es una consultora de talento con operaciones en selección, soporte externalizado y formación corporativa. Este monorepo integra todos los proyectos desarrollados para Nexova a lo largo del programa.

---

## Proyectos del monorepo

| # | Proyecto | Tecnología | Ubicación | Estado |
|---|----------|-----------|-----------|--------|
| **Hito 1** | Web Corporativa | HTML + CSS + JS (vanilla) | `index.html`, `application.html`, `styles.css`, `validation.js` | ✅ |
| **Hito 2** | Lógica TypeScript | TypeScript | `src/` | ✅ |
| **Hito 3** | Talent Pipeline Tracker | Next.js 16 + TypeScript | `uis/talent-pipeline-tracker/` | ✅ |
| **Hito 4** | Infraestructura IA | Next.js + Python + Gobernanza | `uis/website/`, `uis/backoffice/` | ✅ |
| **Hito 5** | Backend Inventario | FastAPI (documentado) | — | ❌ No implementado |
| **Sin Hito 01** | Analizador de Incidencias | Python + HTML/JS | `services/api/` + `uis/incidents-analyzer/` | ✅ |
| **Sin Hito 02** | Directorio de Proveedores | FastAPI + TinyDB | `services/api/` + `uis/backoffice/` | ✅ |

---

## Estructura del repositorio

```text
/
├── README.md / README.es.md   # Documentación del proyecto
├── AGENTS.md                  # Protocolo operativo para agentes IA
├── index.html                 # Hito 1 — Sitio corporativo
├── application.html           # Hito 1 — Formulario de registro
├── styles.css                 # Hito 1 — Estilos compartidos
├── validation.js              # Hito 1 — Validación de formulario
├── src/                       # Hito 2 — Lógica TypeScript (modelos, utilidades)
├── uis/                       # Interfaces de usuario
│   ├── website/               #   Hito 4 — Sitio público (Next.js)
│   ├── backoffice/            #   Hito 4 — Portal interno (Next.js)
│   ├── talent-pipeline-tracker/  # Hito 3 — Tracker de candidatos (Next.js)
│   └── incidents-analyzer/    #   Sin Hito 01 — UI del analizador (HTML/JS)
├── services/
│   └── api/                   # FastAPI: incidencias + directorio proveedores
│       ├── main.py
│       ├── routes/            #   suppliers.py, incidents.py
│       └── clients/           #   talentTrackerApi.ts (cliente HTTP compartido)
├── data/
│   ├── raw/                   # Datos fuente (incidents-nexova.csv)
│   └── process/               # Resultados procesados (results.csv)
├── shared/                    # Módulos Python compartidos
├── scripts/                   # Scripts CLI (analyze.py, etc.)
├── memory-bank/               # Contexto persistente para agentes
├── .agents/                   # Reglas y skills para agentes
├── docs/                      # Documentación de arquitectura
├── SPECS/                     # Especificaciones por hito
└── ... (infra/, packages/, skills/, etc.)
```

---

## Cómo empezar

### Requisitos
- **Python 3.11+** para servicios y scripts
- **Node.js 22+** para apps Next.js
- **npm** para gestión de dependencias

### 1) Apps Next.js (website, backoffice, talent-pipeline-tracker)

Cada app tiene su propio `package.json`. Para ejecutar:

```bash
cd uis/<nombre-app>
npm install    # solo la primera vez
npm run dev
```

| App | Puerto típico |
|-----|--------------|
| `uis/website` | `3000` |
| `uis/backoffice` | `3001` |
| `uis/talent-pipeline-tracker` | `3002` |

### 2) API Backend (FastAPI)

```bash
cd services/api
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

### 3) Incidents Analyzer UI

Requiere la API corriendo en `localhost:8000`:

```bash
cd uis/incidents-analyzer
python -m http.server 5500
```

Abrir `http://localhost:5500`, seleccionar `data/raw/incidents-nexova.csv` y analizar.

### 4) Script CLI (analizador de incidencias)

```bash
python scripts/analyze.py data/raw/incidents-nexova.csv
```

---

## Documentación adicional

| Carpeta | Contenido |
|---------|-----------|
| `SPECS/` | Especificaciones detalladas de cada hito |
| `docs/` | Arquitectura y propuestas técnicas |
| `memory-bank/` | Contexto de negocio, técnico y progreso |
| `.agents/` | Reglas y skills reutilizables |
| `AGENTS.md` | Protocolo operativo para desarrollo con IA |

---

## Hitos realizados

| Hito | Descripción |
|------|-------------|
| 1 | Web corporativa Nexova con formulario de registro |
| 2 | Lógica de negocio en TypeScript (modelos, validaciones, búsqueda) |
| 3 | Talent Pipeline Tracker (Next.js + API playground 4Geeks) |
| 4 | Infraestructura IA: monorepo AI-ready, agentes, memoria persistente |
| Sin Hito 01 | Analizador de incidencias (script CLI + API + UI) |
| Sin Hito 02 | Directorio de proveedores (FastAPI + TinyDB + UI backoffice) |
| 10   | Tiempo real   | Dashboards en vivo, alertas, streaming           |

---

## Enlaces

- [4Geeks Academy — Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [Cómo empezar un proyecto de código](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contribuidores

Esta plantilla fue creada como parte del Programa de Carrera de Ingeniería de IA de 4Geeks Academy por [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) y [@alezanchezr](https://x.com/alesanchezr), junto a otros muchos colaboradores. Descubre más sobre nuestro [Curso de Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia) y sobre [otros cursos](https://4geeksacademy.com/es/comparar-programas).

Puedes encontrar otras plantillas y recursos similares en la [página de GitHub de 4Geeks Academy](https://github.com/4geeksacademy).

_Esta plantilla la mantiene 4Geeks Academy para el track de Ingeniería de IA. Uso exclusivo del programa._
