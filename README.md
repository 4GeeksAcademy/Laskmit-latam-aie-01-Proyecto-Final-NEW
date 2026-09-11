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
| `uis/backoffice/app/suppliers/` | Directorio de proveedores |
| `uis/backoffice/app/talent-pipeline-tracker/` | Pipeline de candidaturas (People & Talent) |
| `uis/backoffice/app/incidents-analyzer/` | Analizador de incidencias de soporte |
| `uis/backoffice/app/incidents/` | Gestor centralizado de incidencias |
| `uis/backoffice/app/backoffice/inventory/` | **Gestión de inventario** (productos, órdenes entrada/salida) |
| `uis/website/` | Sitio web público de Nexova |
| `services/api/` | API backend (FastAPI) con autenticación JWT + doble base de datos |
| `services/api/auth/` | Módulo de autenticación: modelos, servicios y dependencias |
| `services/api/clients/` | Clientes API reutilizados por los frontends |
| `services/api/routers/inventory.py` | **API de inventario** (activos, entradas, salidas sobre Supabase) |
| `scripts/` | Utilidades, seed de incidencias y análisis de datos |
| `data/` | Datos de entrada, resultados y pipelines ETL |
| `shared/` | Lógica compartida Python (ej. análisis de incidencias) |
| `infra/` | Configuración de infraestructura |
| `packages/shared/` | Tipos y utilidades compartidas |
| `SPECS/` | Especificaciones técnicas de cada hito |
| `SPECS/obsoletos/` | Documentación de tareas obsoletas. No leer |
| `docs/` | Arquitectura y propuestas técnicas |
| `memory-bank/` | Contexto de negocio, técnico y progreso |
| `agents/` | Reglas y skills reutilizables |
| `evidencias-pruebas/` | Reportes de pruebas funcionales de cada hito |

---

## Requisitos previos

| Herramienta | Versión mínima | Para qué |
|-------------|---------------|----------|
| **Python** | 3.11+ | Backend FastAPI |
| **pip** | — | Gestor de paquetes Python |
| **Node.js** | 20+ | Frontends Next.js |
| **npm** | — | Gestor de paquetes JavaScript |

---

---

## 🪟 Cómo usar los terminales

Necesitas **tres terminales separadas**, una para cada servicio. No pueden compartir la misma terminal porque cada servicio se queda ejecutándose permanentemente.

| Terminal | Servicio | Puerto | Se queda ejecutándose |
|----------|----------|--------|-----------------------|
| **Terminal A** | API (FastAPI) | `8000` | ✅ Sí, siempre |
| **Terminal B** | Backoffice (Next.js) | `3000` | ✅ Sí, siempre |
| **Terminal C** | Sitio web público (Next.js) | `3001` | ✅ Sí, siempre |

> ⚠️ **Importante:** cada servicio debe correr en su propia terminal. No los arranques en la misma terminal porque el primero se bloquearía al ejecutar el segundo.

Para crear una terminal nueva en VS Code: **Terminal → New Terminal** (o `Ctrl+Shift+Ñ`).

---

## 🟢 Terminal A — Backend API (FastAPI)

Este es el **primer servicio que debe arrancar**. Sin él, los frontends no tienen datos que mostrar.

Base de datos dual: **TinyDB** para autenticación, usuarios, proveedores e incidencias. **Supabase (PostgreSQL vía SQLModel)** para inventario (activos, entradas, salidas).

### ▶️ Primera vez (solo al clonar el repositorio)

En **Terminal A**, ejecuta:

```bash
cd services/api
pip install -r requirements.txt
```

Luego crea el archivo `services/api/.env` con este contenido (nunca lo subas al repositorio):

```env
SECRET_KEY=<clave_hex_64_caracteres>
ACCESS_TOKEN_EXPIRE_MINUTES=30
USUARIO_ADMINISTRADOR=usuarioadministrador
CLAVE_ADMINISTRADOR=<contraseña_segura>
DATABASE_URL=postgresql://postgres.xxxxx:password@pooler.supabase.com:6543/postgres
```

- `SECRET_KEY`: genérala con `openssl rand -hex 32`
- `DATABASE_URL`: solo si vas a usar inventario; el resto funciona sin ella
- `USUARIO_ADMINISTRADOR` / `CLAVE_ADMINISTRADOR`: credenciales del admin inicial

> ⚠️ Si la contraseña de Supabase tiene `@`, `#` u otros caracteres especiales, haz URL-encode (ej. `@` → `%40`)

Después, ejecuta los **seeders** también en Terminal A (solo la primera vez):

```bash
cd services/api
python seed.py              # Crea admin + 15 proveedores
python seed_inventory.py    # 6 activos + 4 entradas + 3 salidas (solo si DATABASE_URL está configurada)
```

### ▶️ Cada vez que quieras usar la API

En **Terminal A**, ejecuta:

```bash
cd services/api
python -m uvicorn main:app --reload --port 8000
```
SI ES EN CODESPACES ....
En Codespaces añade `--host 0.0.0.0` al final y haz público el puerto 8000 (pestaña Puertos → click derecho → Port Visibility → Public).

**Deja esta Terminal A corriendo.** Mientras esté activa, la API responde en:

- Local: `http://localhost:8000`
- Codespaces: `https://<nombre-del-codespace>-8000.app.github.dev`

Documentación interactiva: entra a `/docs` (Swagger) o `/redoc` (ReDoc).

### Endpoints disponibles

| Grupo | Ejemplos de rutas | Auth |
|-------|-------------------|------|
| Autenticación | `POST /auth/login`, `GET /auth/me` | Login: público |
| Usuarios | `POST /users`, `GET/PUT /profiles/me` | Registro: público |
| Proveedores | `GET/POST /suppliers`, `PUT/DELETE /suppliers/{id}` | Protegido |
| Incidencias (analizador) | `POST /api/incidents/analyze`, `GET /api/incidents/health` | Analyze: protegido |
| Incidencias (gestor) | `GET/POST /api/incidents`, `PATCH /api/incidents/{id}` | Protegido |
| **Inventario** | `GET /inventory/products`, `POST /inventory/orders/inbound`, etc. | Lectura: público / Escritura: protegido |

### Flujo de autenticación

| Paso | Acción | Endpoint | Auth |
|------|--------|----------|------|
| 1 | Crear cuenta | `POST /users` | ❌ Público |
| 2 | Iniciar sesión | `POST /auth/login` | ❌ Público |
| 3 | Usar API protegida | Cualquier endpoint protegido | ✅ Bearer Token |

---

## 🟢 Terminal B — Frontend Backoffice (Next.js)

Abre una **nueva terminal** (`Ctrl+Shift+Ñ` o Terminal → New Terminal). Esta es la **Terminal B**. No uses la Terminal A porque ahí sigue corriendo la API.

### ▶️ Primera vez (solo al clonar el repositorio)

En **Terminal B**, ejecuta:

```bash
cd uis/backoffice
npm install
```

Luego crea `uis/backoffice/.env.local`. La variable `NEXT_PUBLIC_API_BASE_URL` debe apuntar a la API (la URL que copiaste de la pestaña Puertos):

```env
# API del Talent Pipeline Tracker (playground 4Geeks — externo)
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1

# API Nexova (FastAPI) — cambiar según entorno
# Codespaces:
NEXT_PUBLIC_API_BASE_URL=https://<nombre-del-codespace>-8000.app.github.dev
# Local:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

> ❌ No crees `NEXT_PUBLIC_INVENTORY_API_URL`. Todo usa `NEXT_PUBLIC_API_BASE_URL`. El prefijo `/inventory` distingue el recurso.

### ▶️ Cada vez que quieras usar el backoffice

En **Terminal B**, ejecuta:

```bash
cd uis/backoffice
npm run dev -- --port 3000
```

**Deja esta Terminal B corriendo.** Abre el puerto 3000 desde la pestaña Puertos.

### Rutas del backoffice

| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/login` | Auth | Inicio de sesión |
| `/register` | Auth | Registro de cuenta |
| `/account/profile` | Perfil | Consulta y edición de perfil |
| `/` | Dashboard | Página principal |
| `/suppliers` | Proveedores | Directorio y operaciones |
| `/talent-pipeline-tracker` | Talent Pipeline | Candidatos y procesos |
| `/incidents-analyzer` | Incidencias | Analizador CSV |
| `/incidents` | Incidencias | Gestor centralizado |
| **`/backoffice/inventory/products`** | **Inventario** | **Lista de activos con stock** |
| **`/backoffice/inventory/orders/inbound`** | **Inventario** | **Registrar orden de entrada** |
| **`/backoffice/inventory/orders/outbound`** | **Inventario** | **Registrar orden de salida** |
| **`/backoffice/inventory/orders`** | **Inventario** | **Historial de órdenes** |

Todas requieren iniciar sesión excepto `/login` y `/register`.

---

## 🟢 Terminal C — Sitio Web Público (Next.js)

Abre una **tercera terminal** (`Ctrl+Shift+Ñ`). Esta es la **Terminal C**. La API (Terminal A) y el backoffice (Terminal B) deben seguir corriendo.

### ▶️ Primera vez (solo al clonar el repositorio)

En **Terminal C**, ejecuta:

```bash
cd uis/website
npm install
```

### ▶️ Cada vez que quieras usarlo

En **Terminal C**, ejecuta:

```bash
cd uis/website
npm run dev -- --port 3001
```

**Deja esta Terminal C corriendo.** Abre el puerto 3001 desde la pestaña Puertos.

---

## Seeders (datos iniciales)

Ejecútalos en **Terminal A** (la de la API) antes de arrancar el servidor, solo la primera vez después de clonar el repositorio:

```bash
cd services/api
python seed.py                  # Crea admin + 15 proveedores en TinyDB
python seed_inventory.py        # 6 activos + 4 entradas + 3 salidas en Supabase (solo si DATABASE_URL existe)
```

---

## Notas importantes

- `.env` y `.env.local` no se suben al repositorio (están en `.gitignore`).
- Si modificas `.env.local` del backoffice, **detén** la Terminal B con `Ctrl+C` y vuelve a ejecutar `npm run dev`.
- La URL de Codespaces cambia si recreas el contenedor. Cópiala siempre desde la pestaña **Puertos**.
- El backend usa **dos bases de datos**: TinyDB (local, archivos `db/`) y Supabase (PostgreSQL, cloud). La de Supabase solo es necesaria para el módulo de inventario.
- Para probar la API de inventario sin frontend, usa los comandos curl de `evidencias-pruebas/Hito-5-inventario-backend/`.


