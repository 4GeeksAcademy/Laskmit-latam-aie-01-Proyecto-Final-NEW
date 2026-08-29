# Nexova — Monorepo Corporativo

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Proyecto transversal del Programa de Carrera en Ingeniería de IA — 4Geeks Academy._

---

## Empresa

**Nexova Solutions** es una consultora de talento con operaciones en selección, soporte externalizado y formación corporativa. Este monorepo integra todos los proyectos desarrollados para Nexova a lo largo del programa.

---

## Estructura del repositorio

| Carpeta | Contenido |
|---------|-----------|
| `uis/backoffice/` | Aplicación Next.js principal — Backoffice interno de Nexova |
| `uis/backoffice/app/` | Rutas y páginas del backoffice |
| `uis/backoffice/app/suppliers/` | Directorio de proveedores |
| `uis/backoffice/app/talent-pipeline-tracker/` | Pipeline de candidaturas (People & Talent) |
| `uis/backoffice/app/incidents-analyzer/` | Analizador de incidencias de soporte |
| `uis/website/` | Sitio web público de Nexova |
| `services/api/` | API backend (FastAPI) con autenticación JWT |
| `services/api/auth/` | Módulo de autenticación: modelos, servicios y dependencias |
| `services/api/clients/` | Clientes API reutilizados por los frontends |
| `scripts/` | Utilidades y análisis de datos |
| `data/` | Datos de entrada, resultados y pipelines ETL |
| `infra/` | Configuración de infraestructura |
| `packages/shared/` | Tipos y utilidades compartidas |
| `SPECS/` | Tareas a realizar |
| `SPECS/obsoletos` | Documentación de tareas obsoletas. No leer |
| `docs/` | Arquitectura y propuestas técnicas |
| `memory-bank/` | Contexto de negocio, técnico y progreso |
| `agents/` | Reglas y skills reutilizables |
| `AGENTS.md` | Protocolo operativo para desarrollo con IA |

---

## Desarrollo

### Requisitos previos

- **Python 3.11+** y [uv](https://docs.astral.sh/uv/) (gestor de paquetes Python)
- **Node.js 20+** y npm

### 1. Backend — API (FastAPI)

El backend expone los endpoints de autenticación JWT, proveedores y analizador de incidencias.  
**Todas las rutas están protegidas excepto `POST /auth/login`, `POST /users` y `GET /api/incidents/health`.**

```bash
# Ir al directorio del servicio
cd services/api

# Instalar dependencias
pip install -r requirements.txt
# o con uv:
# uv sync

# Configurar variables de entorno (obligatorio para autenticación)
cp .env.example .env        # si existe; o crear .env manualmente
# Editar .env con los valores adecuados

# Iniciar servidor en modo desarrollo
python -m uvicorn main:app --reload --port 8000
```

> La API queda disponible en **http://localhost:8000**. pero hay que usar la direccion del puerto, agregandole /docs.
La última generada fué: https://urban-chainsaw-r4xqp67g99vvc5q6x-8000.app.github.dev/docs

> Para que funcione, directo la FASTAPI, y probar desde swagger:
En Codespaces, haz público el puerto 8000 desde la pestaña **Puertos** → Port Visibility → Public.

> **Variables de entorno.** El archivo `services/api/.env` debe contener:
> ```env
> SECRET_KEY=<clave_hex_64_caracteres>
> ACCESS_TOKEN_EXPIRE_MINUTES=30
> USUARIO_ADMINISTRADOR=usuarioadministrador
> CLAVE_ADMINISTRADOR=<contraseña_segura>
> ```
> Genera una `SECRET_KEY` segura con: `openssl rand -hex 32`.
> Estas variables se cargan automáticamente al iniciar la API (vía `python-dotenv`).

> **Primer usuario admin.** El registro vía `POST /users` siempre asigna `role=user`.  
> Para crear el administrador inicial, ejecuta el seeder (ver abajo).

> **Poblar la base de datos:** El seeder crea el usuario administrador (leyendo `USUARIO_ADMINISTRADOR` y `CLAVE_ADMINISTRADOR` del `.env`) y carga los 15 proveedores predefinidos.
> **Abre un nuevo terminal** (el primero está ocupado con el servidor) y ejecuta:
> ```bash
> cd services/api && python seed.py
> ```
> Cada vez que borres la base de datos o clonés el repositorio, tendrás que volver a ejecutarlo.

**Flujo de autenticación:**

| Paso | Acción | Endpoint | Auth |
|------|--------|----------|------|
| 1 | Crear cuenta | `POST /users` | ❌ Público |
| 2 | Iniciar sesión | `POST /auth/login` | ❌ Público |
| 3 | Usar API protegida | `GET /suppliers`, etc. | ✅ Bearer Token |

Tal como se indicó arriba, la documentación interactiva de los endpoints (explora y prueba desde el navegador):
- Swagger UI: http://localhost:8000/docs
NOTA:  Esta ruta debe ser la URL del puerto 8000 pero agregando /docs
- ReDoc: http://localhost:8000/redoc

### 2. Frontend — Backoffice (Next.js)

Aplicación principal de administración interna de Nexova.

```bash
cd uis/backoffice

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

> El backoffice se abre en **http://localhost:3000**.
>
> Para cambiar el puerto: `npm run dev -- --port 3001`

### Configuración de variables de entorno

Crea un archivo `.env.local` en `uis/backoffice/` con las URLs de las APIs que necesita cada módulo:

```bash
# API del Talent Pipeline Tracker (playground 4Geeks)
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1

# API del Backend local (FastAPI) para Suppliers e Incidencias
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Cada módulo usa la variable que le corresponde sin necesidad de cambios manuales:

| Módulo | Variable | API |
|--------|----------|-----|
| Talent Pipeline Tracker | `NEXT_PUBLIC_API_URL` | playground.4geeks.com |
| Suppliers | `NEXT_PUBLIC_API_BASE_URL` | localhost:8000 (FastAPI) |
| Incidencias | input en pantalla | localhost:8000 (FastAPI) |

### 3. Frontend — Sitio Web Público (Next.js)

```bash
cd uis/website

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

> El sitio web se abre en **http://localhost:3001** (o el puerto que se asigne al ejecutarlo junto al backoffice).
>
> Para usar un puerto específico: `npm run dev -- --port 3001`

### Resumen de puertos

| Servicio | Puerto por defecto | Comando de inicio |
|----------|-------------------|-------------------|
| API (FastAPI) | `8000` | `cd services/api && python -m uvicorn main:app --reload --port 8000` |
| Backoffice (Next.js) | `3000` | `cd uis/backoffice && npm run dev` |
| Sitio web (Next.js) | `3000` * | `cd uis/website && npm run dev` |

\* Al ejecutar ambos frontends simultáneamente, asigna puertos distintos con `npm run dev -- --port <puerto>`.


