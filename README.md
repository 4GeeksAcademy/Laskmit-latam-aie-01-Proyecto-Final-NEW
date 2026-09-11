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
| **Docker Engine** | 24+ | Motor de contenedores |
| **Docker Compose** | v2 | Orquestación multi-contenedor (incluido en Docker Desktop) |

> ✅ **Ya no necesitas instalar Node.js, Python ni npm localmente.** Todo se ejecuta dentro de contenedores Docker con las versiones correctas.

---

## 🐳 Cómo ejecutar el repositorio (Docker Compose)

Con **un solo comando** desde la raíz del repositorio levantas los tres servicios que antes requerían tres terminales separadas:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API (FastAPI) | `8000` | Backend con autenticación JWT + doble base de datos |
| Backoffice (Next.js) | `3000` | Panel interno de administración |
| Sitio web público (Next.js) | `3001` | Sitio público de Nexova |

### ▶️ Primera vez (solo al clonar el repositorio)

1. **Asegúrate de tener Docker instalado y en ejecución:**

   ```bash
   docker --version
   docker compose version
   ```

2. **Asegúrate de que el archivo `.env` en la raíz existe.** Este archivo contiene las variables de entorno (no se sube a Git). Debe incluir al menos:

   ```env
   SECRET_KEY=<clave_hex_64_caracteres>
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   USUARIO_ADMINISTRADOR=usuarioadministrador
   CLAVE_ADMINISTRADOR=<contraseña_segura>
   RESEND_API_KEY=<tu_api_key_de_resend>
   RESEND_FROM_EMAIL=<email_remitente>
   PASSWORD_RESET_FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_API_BASE_URL=http://backend:8000
   ```

   - `SECRET_KEY`: genérala con `openssl rand -hex 32`
   - `DATABASE_URL`: opcional, solo si vas a usar inventario con Supabase

   > ⚠️ **No definas `NEXT_PUBLIC_API_BASE_URL` en `.env`.** Las variables `NEXT_PUBLIC_` se incrustan literalmente en el JavaScript que recibe el navegador. El `api-client.ts` detecta automáticamente la URL correcta de la API: en local usa `http://localhost:8000` (puerto expuesto por Docker) y en Codespaces construye automáticamente la URL pública del puerto 8000.

3. **Ejecuta los seeders** (solo la primera vez):

   ```bash
   # Primero construye la imagen del backend para poder ejecutar los seeders
   docker compose build backend

   # Seed de admin + proveedores
   docker compose run --rm backend python seed.py

   # Seed de inventario (solo si DATABASE_URL está configurada)
   docker compose run --rm backend python seed_inventory.py
   ```

### ▶️ Cada vez que quieras usar la plataforma

**Opción A — Ver los logs en vivo (modo foreground):**

```bash
docker compose up
```

La terminal se bloquea mostrando los logs de los tres servicios. Para detener todo: `Ctrl+C`.

**Opción B — Ejecutar en segundo plano (modo detached):**

```bash
docker compose up -d
```

La terminal queda libre. Los contenedores siguen corriendo en segundo plano.

### 📖 Diferencias entre `docker compose up` y `docker compose up -d`

| Situación | Usa |
|---|---|
| Quieres ver los logs en vivo mientras desarrollas | `docker compose up` |
| Quieres liberar la terminal para otros comandos | `docker compose up -d` |
| Recién clonaste el repo y quieres probar que todo funciona | `docker compose up` (ves errores de inmediato) |
| Ya sabes que funciona y solo quieres tenerlo corriendo | `docker compose up -d` |

### 📋 Comandos útiles

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs de todos los servicios en vivo (Ctrl+C para salir, los contenedores siguen)
docker compose logs -f

# Ver solo logs de un servicio específico
docker compose logs backend

# Ver últimas líneas de logs
docker compose logs --tail=50

# Detener todo
docker compose down

# Reconstruir imágenes después de cambios en Dockerfile
docker compose build

# Reconstruir y levantar de nuevo
docker compose up -d --build
```

### 🌐 URLs de los servicios

| Servicio | URL |
|----------|-----|
| Sitio web público | `http://localhost:3000` |
| Backoffice | `http://localhost:3001` |
| API (FastAPI) | `http://localhost:8000` |
| Documentación Swagger | `http://localhost:8000/docs` |

### 🔄 Recarga en caliente (hot reload)

Los bind mounts están configurados. Cualquier cambio que hagas en el código del host se refleja al instante:
- Modificas un archivo del backoffice → el navegador recarga en `http://localhost:3001`.
- Modificas una ruta de la API → Uvicorn reinicia automáticamente.
- **No necesitas reconstruir las imágenes** mientras desarrollas.

---

## Endpoints disponibles de la API

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

## Rutas del backoffice

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

## Seeders (datos iniciales)

Ejecútalos solo la primera vez después de clonar el repositorio, usando Docker Compose:

```bash
# Seed de admin + proveedores
docker compose run --rm backend python seed.py

# Seed de inventario (solo si DATABASE_URL está configurada en .env)
docker compose run --rm backend python seed_inventory.py
```

---

## Notas importantes

- `.env` en la raíz no se sube al repositorio (está en `.gitignore`).
- Si modificas `.env`, detén los contenedores con `docker compose down` y vuelve a levantarlos con `docker compose up -d`.
- El backend usa **dos bases de datos**: TinyDB (local, dentro del contenedor) y Supabase (PostgreSQL, cloud). La de Supabase solo es necesaria para el módulo de inventario.
- Los bind mounts hacen que los cambios en el código se reflejen al instante — **no necesitas reconstruir las imágenes** mientras desarrollas.
- Si modificas un `Dockerfile` o un `package.json`, entonces sí necesitas reconstruir: `docker compose build`.
- Para probar la API de inventario sin frontend, usa los comandos curl de `evidencias-pruebas/Hito-5-inventario-backend/`.


