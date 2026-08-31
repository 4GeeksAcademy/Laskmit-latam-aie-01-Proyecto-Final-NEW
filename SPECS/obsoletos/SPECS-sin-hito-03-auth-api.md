# SPECS — Sin Hito 03 (Auth API)

## Rama
`auth-api`

## Estructura objetivo de carpetas/archivos

```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/
├── services/
│   └── api/
│       ├── .env                          # Variables de entorno (SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES)
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── models.py                 # Modelos Pydantic: User, Profile, Token y esquemas
│       │   ├── services.py               # Lógica CRUD de usuarios y perfiles sobre TinyDB
│       │   └── dependencies.py           # get_current_user, oauth2_scheme
│       ├── routes/
│       │   ├── __init__.py               # Actualizar para exportar nuevos routers
│       │   ├── auth.py                   # POST /auth/login, GET /auth/me
│       │   ├── users.py                  # CRUD /users
│       │   └── profiles.py               # GET /profiles/me, PUT /profiles/me
│       ├── main.py                       # Se actualiza para incluir nuevos routers
│       ├── pyproject.toml                # Se actualiza con nuevas dependencias
│       └── requirements.txt              # Se actualiza con nuevas dependencias
```

## Dependencias nuevas

Añadir al `pyproject.toml` y `requirements.txt` e instalar con `uv add`:

```bash
uv add "python-jose[cryptography]" "libpass[bcrypt]"
```

- `python-jose[cryptography]` — firma y verificación de tokens JWT (HMAC-SHA256).
- `libpass[bcrypt]` — hasheo de contraseñas con esquema bcrypt (fork activo de passlib).

> **Nota:** El import en Python sigue siendo `from passlib.hash import bcrypt` (libpass es un fork drop-in de passlib).

## Modelos de datos (Pydantic)

### User — Tabla TinyDB `users`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `int` | Generado por TinyDB (doc_id) |
| `email` | `EmailStr` | Único, requerido |
| `hashed_password` | `str` | Almacenado ya hasheado con bcrypt |
| `is_active` | `bool` | Default `True` |
| `role` | `Literal["admin", "manager", "user"]` | Default `"user"`. Validar con Enum |
| `created_at` | `datetime` | Generado por sistema |

### Profile — Tabla TinyDB `profiles`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `int` | Generado por TinyDB (doc_id) |
| `user_id` | `int` | Referencia al doc_id de User (relación 1:1) |
| `name` | `str \| None` | Nombre visible |
| `phone` | `str \| None` | Teléfono de contacto |
| `address` | `str \| None` | Dirección física |

### Esquemas de request/response (Pydantic)

- **`UserCreate`**: `email`, `password`. Además acepta campos opcionales de perfil: `name`, `phone`, `address` (si se incluyen, crea el Profile vinculado en la misma operación).
  - **No acepta `role`**. Aunque el cliente envíe un campo `role` en el body, este es ignorado. El rol siempre se asigna como `"user"` forzosamente.
  - La única forma de crear usuarios `admin` o `manager` es que un admin existente los promocione vía `PUT /users/{id}`.
- **`UserResponse`**: `id`, `email`, `is_active`, `role`, `created_at`.
- **`UserUpdate`**: `email` (opcional), `role` (opcional, solo admin puede cambiarlo).
- **`ProfileCreate`**: `user_id`, `name`, `phone`, `address`.
- **`ProfileResponse`**: `id`, `user_id`, `name`, `phone`, `address`.
- **`ProfileUpdate`**: `name` (opcional), `phone` (opcional), `address` (opcional).
- **`LoginRequest`**: `email`, `password`.
- **`Token`**: `access_token` (str), `token_type` (str, default `"bearer"`).

## API (FastAPI)

### Endpoints de autenticación — `/auth`

#### `POST /auth/login`
- **Público** (sin autenticación).
- Acepta `LoginRequest` (email y password).
- Busca usuario por email en TinyDB.
- Verifica contraseña con bcrypt.
- Genera token JWT con:
  - `sub`: ID del usuario (doc_id de TinyDB)
  - `exp`: timestamp de expiración (`ACCESS_TOKEN_EXPIRE_MINUTES`)
- Devuelve `Token` firmado.
- Responde `401` si credenciales inválidas o usuario inactivo.

#### `GET /auth/me`
- **Protegida** (requiere `get_current_user`).
- Devuelve `email`, `role` del usuario autenticado más el `Profile` vinculado (name, phone, address).

### Endpoints de usuarios — `/users`

#### `POST /users`
- **Público** (no requiere autenticación).
- Acepta `UserCreate` con `email` y `password`. No acepta `role`; incluso si se envía en el body, se ignora y se fuerza `"user"`.
- Valida que el email no exista ya en TinyDB.
- Hashea la contraseña con bcrypt antes de guardar.
- Si se incluyen `name`, `phone` o `address`, crea el `Profile` vinculado en la misma transacción.
- Responde `201 Created` con `UserResponse`.
- Responde `422` si el email ya existe o datos inválidos.

#### `GET /users`
- **Protegida** (requiere `get_current_user`).
- Lista todos los usuarios.
- Responde con `list[UserResponse]`.

#### `GET /users/{id}`
- **Protegida** (requiere `get_current_user`).
- Obtiene usuario por ID (doc_id de TinyDB).
- Responde `404` si no existe.
- Responde `403` si el usuario autenticado no es el propietario ni admin.

#### `PUT /users/{id}`
- **Protegida** (requiere `get_current_user`).
- Actualiza email y/o role.
- Solo un usuario admin puede cambiar el `role` de otro usuario.
- Responde `404` si no existe.
- Responde `403` si el usuario autenticado no es el propietario ni admin.

#### `DELETE /users/{id}`
- **Protegida** (requiere `get_current_user`).
- Elimina el usuario y su perfil vinculado de TinyDB.
- Responde `404` si no existe.
- Responde `403` si el usuario autenticado no es el propietario ni admin.

### Endpoints de perfil — `/profiles`

#### `GET /profiles/me`
- **Protegida** (requiere `get_current_user`).
- Devuelve el perfil del usuario autenticado.
- Responde `404` si no tiene perfil.

#### `PUT /profiles/me`
- **Protegida** (requiere `get_current_user`).
- Actualiza `name`, `phone` y/o `address` del perfil del usuario autenticado.
- Solo el dueño del perfil puede modificarlo (se verifica por `user_id`).
- Responde `403` si otro usuario intenta modificarlo.

### Protección de rutas existentes

Aplicar `get_current_user` como dependencia a **al menos 5 rutas existentes** fuera de `/users` y `/auth`.

**Rutas de proveedores (`/suppliers`) — todas protegidas:**
- `POST /suppliers` — crear proveedor
- `GET /suppliers` — listar proveedores
- `GET /suppliers/{id}` — detalle de proveedor
- `PATCH /suppliers/{id}/rate` — actualizar tarifa
- `PATCH /suppliers/{id}/status` — actualizar estado
- `DELETE /suppliers/{id}` — eliminar proveedor

**Rutas de incidencias (`/api/incidents`):**
- `POST /api/incidents/analyze` — analizar CSV (proteger)
- `GET /api/incidents/results/export` — exportar resultados (proteger)

**Ruta pública (sin proteger):**
- `GET /api/incidents/health` — health check (permanece público)

## Variables de entorno

Crear archivo `services/api/.env`:

```env
SECRET_KEY=<string_aleatorio_seguro_de_32_caracteres_hex>
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

- **`SECRET_KEY`**: clave de firma HMAC-SHA256 para JWT. Generar con `openssl rand -hex 32`.
- **`ACCESS_TOKEN_EXPIRE_MINUTES`**: ventana de expiración del token en minutos (default `30`).

Ambas variables se leen desde el entorno en tiempo de ejecución mediante `os.getenv()` o `python-dotenv`. **Nunca hardcodear valores.**

## Dependencia `get_current_user`

- Extrae token de la cabecera `Authorization: Bearer <token>` mediante `OAuth2PasswordBearer(tokenUrl="/auth/login")`.
- Decodifica y valida el JWT con `python-jose` usando `SECRET_KEY`.
- Recupera el usuario desde TinyDB usando el `sub` (ID del usuario) del payload del token.
- Lanza `HTTPException(401)` si:
  - No hay token en la cabecera.
  - Token expirado (`ExpiredSignatureError`).
  - Token mal formado o firma inválida (`JWTError`).
  - Usuario no encontrado o `is_active == False`.

## Criterios de aceptación

- [ ] El CRUD de usuarios está completamente implementado y accesible vía API bajo `/users`.
- [ ] Cada `User` tiene un `Profile` vinculado; `name`, `phone` y `address` se almacenan en `Profile`, no en `User`.
- [ ] El campo `role` acepta únicamente `admin`, `manager` o `user`; los nuevos usuarios vía `POST /users` usan `user` por defecto.
- [ ] Las contraseñas se hashean con bcrypt al crear usuario y se verifican correctamente en login — el texto plano nunca toca la base de datos.
- [ ] `POST /auth/login` devuelve un token JWT válido y firmado.
- [ ] `GET /auth/me` devuelve email, role y perfil del usuario autenticado.
- [ ] La dependencia `get_current_user` decodifica el token correctamente e identifica al usuario.
- [ ] Las rutas protegidas devuelven `401 Unauthorized` al ser llamadas sin un token válido.
- [ ] Las rutas protegidas devuelven `403 Forbidden` cuando un usuario intenta acceder a un recurso que no le pertenece.
- [ ] La expiración del token y la clave de firma se leen desde variables de entorno (`.env`), no están hardcodeadas.
- [ ] Las rutas de auth están bajo `/auth`, las de usuarios bajo `/users` y las de perfil bajo `/profiles` — estructura limpia y coherente.
- [ ] Al menos 5 rutas existentes fuera de `/users` y `/auth` están protegidas con `get_current_user`.
- [ ] `User` y `Profile` permanecen en TinyDB (sin tablas de usuarios en PostgreSQL/Supabase).
- [ ] Las rutas protegidas del monorepo siguen funcionando correctamente cuando se llaman con un token válido (sin regresiones).
- [ ] `GET /api/incidents/health` permanece público (sin autenticación).
- [ ] Flujo completo verificado manualmente en `/docs`: registro → login → copiar token → usar ruta protegida.
- [ ] Llamar a una ruta protegida sin token devuelve `401`.
- [ ] Llamar a una ruta protegida con token expirado o mal formado devuelve `401`.

## Restricciones

- **No usar autenticación basada en sesiones ni cookies.** Este proyecto implementa únicamente auth JWT stateless.
- **No almacenar contraseñas en texto plano.** Usar `libpass[bcrypt]` con import `from passlib.hash import bcrypt`.
- `User` y `Profile` se almacenan **solo en TinyDB**. No crear tablas de usuarios ni perfiles en Supabase/PostgreSQL. Las tablas PostgreSQL de otros módulos guardan solo el `id` de TinyDB como `user_uuid`.
- La `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES` deben leerse de variables de entorno. Nunca hardcodearlas.
- No modificar `memory-bank/`, `.agents/`, `docs/` ni `README.md` sin autorización explícita del desarrollador.
- Actualizar `memory-bank/progress.md` al completar la tarea con estado real, riesgos y siguientes pasos.
- Identificar qué llamadas del frontend dejan de funcionar al proteger las rutas, para contemplar su modificación posterior.

## Resumen de rutas: protegidas vs públicas

| Ruta | Protegida |
|---|---|
| `POST /auth/login` | ❌ Pública |
| `GET /auth/me` | ✅ Sí |
| `POST /users` | ❌ Pública |
| `GET /users` | ✅ Sí |
| `GET /users/{id}` | ✅ Sí |
| `PUT /users/{id}` | ✅ Sí |
| `DELETE /users/{id}` | ✅ Sí |
| `GET /profiles/me` | ✅ Sí |
| `PUT /profiles/me` | ✅ Sí |
| `POST /suppliers` | ✅ Sí |
| `GET /suppliers` | ✅ Sí |
| `GET /suppliers/{id}` | ✅ Sí |
| `PATCH /suppliers/{id}/rate` | ✅ Sí |
| `PATCH /suppliers/{id}/status` | ✅ Sí |
| `DELETE /suppliers/{id}` | ✅ Sí |
| `POST /api/incidents/analyze` | ✅ Sí |
| `GET /api/incidents/results/export` | ✅ Sí |
| `GET /api/incidents/health` | ❌ Pública |