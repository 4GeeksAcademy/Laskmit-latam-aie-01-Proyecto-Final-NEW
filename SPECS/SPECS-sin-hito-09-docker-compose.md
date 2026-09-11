# SPECS - Sin Hito 09 (Docker Compose - Contenedorización del Monorepo)

## Identificación

- **Funcionalidad:** DOCKER-01 - Contenedorización completa del monorepo para entornos de desarrollo reproducibles.
- **Aplicaciones a dockerizar:**
  - `/uis/website` — Sitio público (Next.js 16, puerto 3000).
  - `/uis/backoffice` — Panel interno de administración (Next.js 16, puerto 3001).
  - `/services/api` — Backend FastAPI (puerto 8000).
- **Tecnologías involucradas:** Docker Engine, Docker Compose v2, Node 22 (Alpine), Python 3.11+ (slim), Next.js 16, FastAPI, Uvicorn.
- **Stack vigente:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, FastAPI, Python 3.11+, TinyDB, Supabase (SQLModel).
- **Archivos a crear:**
  - `docker-compose.yml` en la raíz del repositorio.
  - `uis/Dockerfile` — Dockerfile para el contenedor de interfaces (website + backoffice).
  - `uis/.dockerignore` — Exclusiones para el build de interfaces.
  - `uis/start.sh` — Script de arranque que lanza ambos Next.js en un mismo contenedor.
  - `services/Dockerfile` — Dockerfile para el backend FastAPI.
  - `services/.dockerignore` — Exclusiones para el build del backend.
  - `services/start.sh` — Script de arranque del servidor Uvicorn con `--reload` (opcional si se usa CMD directo).
  - `.env` en la raíz (ya existe, verificar que contiene todas las variables necesarias).
- **Dependencia funcional:** Ninguno de los servicios actuales debe modificarse en su lógica interna. Solo se añade la infraestructura de contenedores.

## Objetivo

Eliminar la fricción de puesta en marcha para nuevos desarrolladores. Actualmente, cada incorporación requiere instalar manualmente versiones específicas de Node y Python, resolver conflictos de dependencias globales y seguir pasos de configuración no documentados. El proyecto dockeriza todo el entorno de desarrollo para que `docker compose up` desde la raíz del repositorio levante la plataforma completa sin pasos adicionales.

El entorno de desarrollo debe definirse en código, versionarse junto al proyecto y ejecutarse de forma idéntica en cualquier máquina del equipo, sin configuración manual.

## Alcance funcional

### Incluido

1. **Contenedor de interfaces** (`/uis/`): Un único contenedor que ejecuta simultáneamente:
   - `/uis/website` en el puerto **3000** con recarga en caliente (`next dev`).
   - `/uis/backoffice` en el puerto **3001** con recarga en caliente (`next dev --webpack`).
2. **Contenedor del backend** (`/services/`): Un contenedor que ejecuta:
   - FastAPI con Uvicorn en el puerto **8000** con recarga en caliente (`--reload`).
3. **Orquestación con Docker Compose**: Archivo `docker-compose.yml` en la raíz que:
   - Define ambos servicios en una misma red Docker con nombre explícito.
   - Expone los puertos correctos al host.
   - Configura bind mounts para que los cambios en el código del host se reflejen inmediatamente sin reconstruir imágenes.
   - Carga todas las variables de entorno desde un archivo `.env` en la raíz.
4. **Archivos `.dockerignore`**: En `/uis/` y `/services/` para optimizar los builds.
5. **Comunicación entre servicios**: Los frontends se conectan al backend usando el nombre del servicio Docker (`backend`) como host, no `localhost`.

### Fuera de alcance

- Modificar la lógica interna, rutas, componentes, endpoints o tests del código existente.
- Crear perfiles de producción o `docker-compose.prod.yml`.
- Agregar servicios adicionales (bases de datos, colas, cachés) que no estén ya presentes.
- Implementar health checks, redes separadas por servicio, volúmenes nombrados o políticas de reinicio.
- Dockerizar scripts de soporte (`/scripts/`) ni lógica compartida (`/shared/`, `/src/`).
- Migrar a gestores de procesos tipo PM2, supervisord o similares dentro del contenedor.
- Agregar HTTPS o proxy reverso (Nginx, Traefik) en esta entrega.
- Modificar `.gitignore` más allá de verificar que `.env` está excluido.
- Cambiar la URL por defecto de `uis/website` que apunta a `https://playground.4geeks.com/tracker/api/v1` (no forma parte de la red Docker).

## Estructura de archivos a crear

```
/
├── docker-compose.yml          # Orquestación de servicios
├── .env                        # Variables de entorno (ya existe, verificar contenido)
├── uis/
│   ├── Dockerfile              # Build del contenedor de interfaces
│   ├── .dockerignore           # Exclusiones para el build de interfaces
│   └── start.sh                # Script que arranca website (3000) y backoffice (3001)
└── services/
    ├── Dockerfile              # Build del contenedor del backend
    ├── .dockerignore           # Exclusiones para el build del backend
    └── start.sh                # Script que arranca Uvicorn con --reload
```

## Especificación detallada de cada archivo

### 1. `docker-compose.yml` (raíz del repositorio)

Debe definir exactamente **dos servicios** y **una red**:

#### Servicio `frontends` (interfaces)

| Propiedad | Valor |
|---|---|
| `build.context` | `./uis` |
| `container_name` | `nexova-frontends` |
| `ports` | `"3000:3000"` (website), `"3001:3001"` (backoffice) |
| `env_file` | `.env` |
| `volumes` | Bind mount de `./uis:/app` para recarga en caliente |
| `command` | `sh /app/start.sh` |
| `networks` | `nexova-network` |
| `depends_on` | `backend` |

El bind mount debe montar el código fuente del host dentro del contenedor en `/app` para que `next dev` detecte cambios y recargue automáticamente.

#### Servicio `backend` (API)

| Propiedad | Valor |
|---|---|
| `build.context` | `./services` |
| `container_name` | `nexova-backend` |
| `ports` | `"8000:8000"` |
| `env_file` | `.env` |
| `volumes` | Bind mount de `./services/api:/app` para recarga en caliente |
| `working_dir` | `/app` |
| `command` | `sh /app/start.sh` |
| `networks` | `nexova-network` |

#### Red

- Nombre explícito: `nexova-network` (definido en el top-level `networks:`).
- Driver: `bridge` (por defecto).

**Reglas obligatorias:**

1. Los servicios se comunican internamente por nombre de servicio Docker (`backend`), no por `localhost` ni por IP hardcodeada.
2. No debe haber secretos, API keys ni contraseñas hardcodeadas en el YAML. Todas las variables sensibles se cargan desde `.env`.
3. El archivo `.env` debe estar en `.gitignore` (verificar que ya lo está).

### 2. `uis/Dockerfile`

- **Imagen base:** `node:22-alpine` (o `node:22-alpine3.21`).
- **Directorio de trabajo:** `/app`.
- **Pasos:**
  1. Copiar `website/package.json` y `website/package-lock.json` a `/app/website/`.
  2. Copiar `backoffice/package.json` y `backoffice/package-lock.json` a `/app/backoffice/`.
  3. Instalar dependencias de website: `cd /app/website && npm ci`.
  4. Instalar dependencias de backoffice: `cd /app/backoffice && npm ci`.
  5. Copiar el resto del código fuente (`website/`, `backoffice/`, `start.sh`).
  6. Exponer puertos `3000` y `3001`.
  7. `CMD` por defecto: `["sh", "/app/start.sh"]`.

Justificación de la separación de `npm ci`: Se copian los `package.json` antes del resto del código para aprovechar la cache de capas de Docker. Mientras no cambien las dependencias, esta capa no se reconstruye.

### 3. `uis/.dockerignore`

Debe excluir al menos:

```
node_modules/
.next/
.env*
*.log
.git
.gitignore
__tests__/
coverage/
README.md
AGENTS.md
CLAUDE.md
```

### 4. `uis/start.sh`

Script shell que arranca ambas aplicaciones Next.js en segundo plano y espera a que terminen:

```bash
#!/bin/sh
set -e

echo "=== Arrancando website (puerto 3000) ==="
cd /app/website && npm run dev &

echo "=== Arrancando backoffice (puerto 3001) ==="
cd /app/backoffice && npm run dev &

# Esperar a que cualquier proceso hijo termine
wait
```

**Importante:** Asegurarse de que el script tiene permisos de ejecución (`chmod +x`).

### 5. `services/Dockerfile`

- **Imagen base:** `python:3.11-slim` (o `3.12-slim`).
- **Instalación de uv:**
  ```dockerfile
  COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
  ```
  O instalar vía `pip install uv`.
- **Directorio de trabajo:** `/app`.
- **Pasos:**
  1. Copiar `api/requirements.txt` a `/app/`.
  2. Instalar dependencias: `uv pip install -r requirements.txt` (uv requiere `--system` o un virtualenv; se recomienda `uv pip install --system -r requirements.txt`).
  3. Copiar el código fuente de `api/` a `/app/`.
  4. Exponer puerto `8000`.
  5. `CMD` por defecto: `["sh", "/app/start.sh"]`.

**Alternativa sin uv:** Si se prefiere evitar uv, usar `pip install --no-cache-dir -r requirements.txt`. En ese caso el Dockerfile quedaría más simple pero no reflejaría la herramienta que el proyecto ya usa (se observa `uv.lock` en `services/api/`).

### 6. `services/.dockerignore`

Debe excluir al menos:

```
__pycache__/
*.pyc
.env*
tests/
*.log
.git
.gitignore
.venv/
__pycache__/
.pytest_cache/
.coverage
htmlcov/
*.egg-info/
README.md
```

### 7. `services/start.sh`

Script shell que arranca Uvicorn con recarga en caliente:

```bash
#!/bin/sh
set -e

echo "=== Arrancando FastAPI (puerto 8000) ==="
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Importante:** Usar `exec` para que el proceso de Uvicorn reemplace al shell y reciba correctamente las señales de Docker.

### 8. `.env` (verificar contenido)

El archivo `.env` ya existe en la raíz. Debe contener **todas** las variables de entorno que los servicios necesitan. Entre las que se han identificado en el código actual:

| Variable | Descripción | ¿Obligatoria? |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL base de la API para backoffice | Sí, debe apuntar a `http://backend:8000` |
| `NEXT_PUBLIC_API_URL` | URL base de la API para website | Sí, valor por defecto externo |
| `PASSWORD_RESET_FRONTEND_URL` | URL base para enlaces de reseteo de contraseña | Sí, debe apuntar a `http://localhost:3000` |
| `RESEND_API_KEY` | API key del servicio Resend | Sí (sensible) |
| `DATABASE_URL` | URL de conexión a Supabase/PostgreSQL | Depende del entorno |
| `SUPABASE_URL` | URL de Supabase | Según configuración |
| `SUPABASE_KEY` | Clave de Supabase | Según configuración |

**Reglas obligatorias:**

1. `NEXT_PUBLIC_API_BASE_URL` en el contenedor frontends debe resolverse a `http://backend:8000` (nombre del servicio Docker), **no** a `http://localhost:8000`. Esta es la variable crítica para la comunicación entre servicios.
2. No hardcodear ningún valor secreto en `docker-compose.yml` ni en los Dockerfiles.
3. `.env` debe estar en `.gitignore`. **Ya está presente** en `.gitignore`.

## Compatibilidad obligatoria y no regresión

La contenedorización es una capa de infraestructura que no debe alterar el comportamiento interno de ninguna aplicación existente:

- Los endpoints de la API (`/auth/login`, `/auth/me`, `/users`, `/profiles/me`, `/suppliers`, `/incidents`, `/inventory`) deben funcionar idénticamente dentro del contenedor.
- Los formularios, vistas y flujos de autenticación del backoffice deben operar sin cambios, solo consumiendo la API a través de la nueva URL (`http://backend:8000` en lugar de `http://localhost:8000`).
- El sitio público (`/uis/website`) debe seguir funcionando sin cambios en su lógica; su conexión externa a `playground.4geeks.com` no se ve afectada.
- No se deben modificar archivos existentes de `uis/website/`, `uis/backoffice/` ni `services/api/` salvo que sea estrictamente necesario para ajustar URLs de conexión entre servicios (y esos cambios deben documentarse explícitamente).

### Puntos de atención por URLs de conexión

Identificar y actualizar (si es necesario) todas las URLs donde los servicios se referencian entre sí:

1. **`uis/backoffice/lib/api-client.ts` línea 37:** `return "http://localhost:8000"` es el fallback si no existe `NEXT_PUBLIC_API_BASE_URL`. En el contenedor, **debe** definirse `NEXT_PUBLIC_API_BASE_URL=http://backend:8000` en `.env`. El fallback a `localhost:8000` permanece solo para desarrollo local sin Docker.
2. **`uis/backoffice/public/incidents-analyzer/app.js` y `incidents-app.js`:** Archivos JS legacy que tienen hardcodeado `http://localhost:8000`. Estos archivos no se importan desde las rutas actuales de Next.js (son superficie residual), pero si se usan, deben actualizarse para leer la variable de entorno o usar el nombre del servicio.
3. **`services/api/notifications/resend_client.py` línea 20:** `PASSWORD_RESET_FRONTEND_URL` por defecto es `http://localhost:3000`. Esto es correcto desde la perspectiva del host, ya que el enlace de reseteo se envía por email al usuario, quien lo abre en su navegador en `localhost:3000`. **No debe cambiarse** a `http://frontends:3000`.
4. **`uis/website/app/registro/RegistroForm.tsx`:** Usa `NEXT_PUBLIC_API_URL` con fallback a `https://playground.4geeks.com/tracker/api/v1`. Este formulario no se conecta a la API interna de Nexova, por lo que no necesita cambios.

## Verificación y criterios de aceptación

1. **`docker compose up` desde la raíz** levanta la plataforma completa sin errores y sin pasos adicionales de configuración.
2. **Bind mounts funcionando**: Los cambios en el código del host se reflejan en el navegador sin reconstruir la imagen:
   - Modificar un componente de backoffice → recarga instantánea en `http://localhost:3001`.
   - Modificar una ruta de FastAPI → recarga instantánea (Uvicorn `--reload`).
3. **Servicio de interfaces arranca ambas aplicaciones** en puertos distintos (3000 y 3001) desde un único contenedor.
4. **Comunicación por nombre de servicio:** El backoffice se conecta a `http://backend:8000`, no a `http://localhost:8000`.
5. **Sin secretos hardcodeados:** No hay API keys, contraseñas ni tokens en `docker-compose.yml` ni en ningún Dockerfile.
6. **`.env` está en `.gitignore`** y no aparece en el historial de commits (verificar con `git check-ignore .env` y `git log --oneline .env`).
7. **Existen archivos `.dockerignore`** en `/uis/` y `/services/` con las exclusiones mínimas especificadas.

## Pruebas recomendadas

| Prueba | Comando | Resultado esperado |
|---|---|---|
| Build sin errores | `docker compose build` | Ambos builds completan sin error |
| Levantar servicios | `docker compose up -d` | Contenedores `nexova-frontends` y `nexova-backend` en estado `Up` |
| Verificar contenedores | `docker compose ps` | Dos servicios listados |
| Website accesible | `curl -o /dev/null -w "%{http_code}" http://localhost:3000` | `200` |
| Backoffice accesible | `curl -o /dev/null -w "%{http_code}" http://localhost:3001` | `200` |
| API accesible | `curl -o /dev/null -w "%{http_code}" http://localhost:8000/docs` | `200` o `302` |
| Comunicación interna | Acceder a backoffice → debería cargar datos de la API sin errores de conexión | Sin errores CORS ni de red |
| Recarga en caliente | Modificar un archivo .tsx en backoffice y observar | El navegador refleja el cambio |
| Logs sin errores | `docker compose logs --tail=50` | Sin trazas de error de conexión ni dependencias faltantes |
| Detener servicios | `docker compose down` | Contenedores eliminados, red eliminada |

## Plan de ejecución paso a paso

### Paso 1: Preparación del entorno

1. Verificar que Docker está instalado y en ejecución:
   ```bash
   docker --version
   docker compose version
   ```
2. Verificar que `.env` contiene todas las variables necesarias y que `NEXT_PUBLIC_API_BASE_URL` apunta a `http://backend:8000`.

### Paso 2: Creación de archivos

1. Crear `uis/Dockerfile` siguiendo la especificación.
2. Crear `uis/.dockerignore`.
3. Crear `uis/start.sh` y darle permisos de ejecución (`chmod +x uis/start.sh`).
4. Crear `services/Dockerfile` siguiendo la especificación.
5. Crear `services/.dockerignore`.
6. Crear `services/start.sh` y darle permisos de ejecución (`chmod +x services/start.sh`).
7. Crear `docker-compose.yml` en la raíz siguiendo la especificación.

### Paso 3: Build y levantamiento

1. Construir las imágenes:
   ```bash
   docker compose build
   ```
2. Levantar los servicios:
   ```bash
   docker compose up -d
   ```
3. Verificar que ambos contenedores están corriendo:
   ```bash
   docker compose ps
   ```

### Paso 4: Verificación funcional

1. Abrir `http://localhost:3000` (website público).
2. Abrir `http://localhost:3001` (backoffice).
3. Abrir `http://localhost:8000/docs` (documentación Swagger de la API).
4. Verificar que el backoffice carga datos desde la API sin errores de conexión.
5. Modificar un archivo del backoffice y confirmar recarga en caliente.
6. Modificar una ruta de la API y confirmar recarga en caliente.

### Paso 5: Captura de evidencias (para PR)

Para documentar la entrega, capturar:

1. **Salida de `docker compose ps`** que muestre ambos contenedores en estado `Up`:
   ```bash
   docker compose ps
   ```
2. **Salida de `docker compose up`** (primer arranque) que muestre los logs sin errores:
   ```bash
   docker compose up 2>&1 | head -50
   ```
   O usar `docker compose logs` después del arranque en detached mode.

3. **(Opcional) Verificación de red interna:** Demostrar que los contenedores se comunican por nombre de servicio:
   ```bash
   # Desde el contenedor frontends, resolver el nombre "backend"
   docker exec nexova-frontends sh -c "getent hosts backend" 2>/dev/null || \
   docker compose exec frontends ping -c 1 backend
   ```

## Glosario

| Término | Definición |
|---|---|
| **Bind mount** | Montaje de un directorio del host dentro del contenedor. Los cambios en el host se reflejan en el contenedor al instante. |
| **Recarga en caliente (hot reload)** | Capacidad del servidor de desarrollo de detectar cambios en el código y recompilar/reiniciar sin intervención manual. |
| **Nombre de servicio Docker** | Hostname por el que un servicio es accesible desde otros servicios dentro de la misma red Docker. Se define implícitamente por la clave del servicio en `docker-compose.yml`. |
| **Docker Compose** | Herramienta para definir y ejecutar aplicaciones multi-contenedor en Docker. |
| **uv** | Gestor de paquetes y proyectos Python, alternativa rápida a pip, escrito en Rust. |