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

### Preparación inicial (solo la primera vez)

Ejecuta estos comandos desde la raíz del repositorio:

```bash
# Dependencias de la API
cd services/api
pip install -r requirements.txt

# Dependencias del backoffice
cd ../../uis/backoffice
npm install

# Dependencias del sitio público
cd ../website
npm install
```

Crea `services/api/.env` con las variables de autenticación:

```env
SECRET_KEY=<clave_hex_64_caracteres>
ACCESS_TOKEN_EXPIRE_MINUTES=30
USUARIO_ADMINISTRADOR=usuarioadministrador
CLAVE_ADMINISTRADOR=<contraseña_segura>
```

Genera una `SECRET_KEY` con `openssl rand -hex 32`. No publiques ni subas este archivo al repositorio.

### Terminal 1 — Backend API (FastAPI)

Abre la **Terminal 1**. Primero, ejecuta el seeder en esta terminal:

```bash
cd services/api
python seed.py
```

El seeder crea el administrador definido en `.env` y carga los 15 proveedores iniciales. El comando termina por sí solo; ejecútalo después de clonar el repositorio o de borrar la base de datos.

Cuando el seeder termine, inicia la API en la **misma Terminal 1**:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Deja la Terminal 1 ejecutándose mientras utilizas los frontends. El registro mediante `POST /users` siempre crea usuarios con el rol `user`; el seeder crea el administrador inicial.

El backend expone autenticación JWT, proveedores y análisis de incidencias. Todas las rutas están protegidas excepto `POST /auth/login`, `POST /users` y `GET /api/incidents/health`.

#### URL de la API en GitHub Codespaces

No configures el frontend con `http://localhost:8000` cuando lo abras desde el navegador mediante Codespaces. En ese caso, `localhost` puede apuntar a tu computadora y no al contenedor.

1. Con la API en ejecución, abre la pestaña **Puertos** de VS Code.
2. Busca el puerto `8000` y cambia **Visibilidad del puerto** a **Público**. Esto evita que las peticiones del navegador reciban la pantalla de autenticación de GitHub en lugar de la respuesta JSON de FastAPI.
3. En la misma fila, copia la **Dirección reenviada**. Tendrá una forma similar a `https://<nombre-del-codespace>-8000.app.github.dev`.
4. Comprueba la API abriendo `<URL_API>/api/incidents/health` o Swagger en `<URL_API>/docs`.

La dirección cambia si recreas el Codespace. Cópiala siempre desde la pestaña **Puertos**; no reutilices una URL antigua.

Para ejecución local fuera de Codespaces, la URL base sí es `http://localhost:8000`.

**Flujo de autenticación:**

| Paso | Acción | Endpoint | Auth |
|------|--------|----------|------|
| 1 | Crear cuenta | `POST /users` | ❌ Público |
| 2 | Iniciar sesión | `POST /auth/login` | ❌ Público |
| 3 | Usar API protegida | `GET /suppliers`, etc. | ✅ Bearer Token |

Documentación interactiva:

- Codespaces: `<URL_API>/docs` (Swagger) y `<URL_API>/redoc` (ReDoc).
- Entorno local: `http://localhost:8000/docs` y `http://localhost:8000/redoc`.

### Terminal 2 — Frontend Backoffice (Next.js)

Aplicación principal de administración interna de Nexova.

Crea `uis/backoffice/.env.local` antes de iniciar Next.js. En `NEXT_PUBLIC_API_BASE_URL`, pega la dirección reenviada del puerto `8000` copiada en el paso anterior, **sin** `/docs` y **sin** una barra `/` al final:

```env
# API del Talent Pipeline Tracker (playground 4Geeks)
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1

# Codespaces: URL pública reenviada del puerto 8000
NEXT_PUBLIC_API_BASE_URL=https://<nombre-del-codespace>-8000.app.github.dev
```

Si trabajas fuera de Codespaces, usa `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

Abre una **Terminal 2** para iniciar el backoffice y déjala ejecutándose:

```bash
cd uis/backoffice
npm run dev -- --port 3000
```

Desde **Puertos**, abre la dirección reenviada del puerto `3000`. Si modificas `.env.local`, detén Next.js con `Ctrl+C` y vuelve a ejecutar el comando para que tome el nuevo valor.

Cada módulo usa estas variables:

| Módulo | Variable | API |
|--------|----------|-----|
| Talent Pipeline Tracker | `NEXT_PUBLIC_API_URL` | playground.4geeks.com |
| Autenticación y perfil | `NEXT_PUBLIC_API_BASE_URL` | FastAPI, puerto `8000` |
| Suppliers | `NEXT_PUBLIC_API_BASE_URL` | FastAPI, puerto `8000` |
| Incidencias | `NEXT_PUBLIC_API_BASE_URL` | FastAPI, puerto `8000` |

### Terminal 3 — Sitio Web Público (Next.js)

Sin detener la API ni el backoffice, abre una **Terminal 3** y déjala ejecutándose:

```bash
cd uis/website
npm run dev -- --port 3001
```

Desde **Puertos**, abre la dirección reenviada del puerto `3001`.

### Resumen: proyecto completo en ejecución

| Terminal | Servicio | Puerto | Debe permanecer ejecutándose |
|----------|----------|--------|------------------------------|
| Terminal 1 | API FastAPI | `8000` | Sí |
| Terminal 2 | Backoffice Next.js | `3000` | Sí |
| Terminal 3 | Website Next.js | `3001` | Sí |

En Codespaces, accede a cada servicio mediante su **Dirección reenviada** en la pestaña **Puertos**. Para que el backoffice consuma FastAPI, el puerto `8000` debe ser público y `NEXT_PUBLIC_API_BASE_URL` debe contener esa dirección reenviada.


