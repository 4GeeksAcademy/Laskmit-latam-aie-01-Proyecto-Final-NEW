# Testing — Nexova Auth API

## Cómo ejecutar las pruebas

```bash
# Las pruebas deben ejecutarse desde services/api/
cd services/api

# Ejecutar todas las pruebas (requiere PYTHONPATH)
# -W all  muestra todos los warnings (DeprecationWarning, etc.)
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/ -v -W all

# Con cobertura detallada por módulo de autenticación
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest --cov=services.api.auth --cov=services.api.routes.auth --cov=services.api.routes.users --cov=services.api.routes.profiles tests/ --cov-report=term-missing -W all

# Ejecutar un archivo específico
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/test_login.py -v -W all

# Ejecutar por palabra clave
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest -k "login" -v -W all

## Resultados de cobertura (PASO 03)

| Módulo | Cobertura |
|--------|-----------|
| `auth/models.py` | 100% |
| `auth/services.py` | 94% |
| `routes/auth.py` | 91% |
| `routes/users.py` | 91% |
| `auth/dependencies.py` | 88% |
| `routes/profiles.py` | 81% |
| **Total módulos auth** | **93%** |

> 📊 **93% de cobertura** — supera el 70% requerido. **91 pruebas en total** (62 del PASO 02 + 29 del PASO 03).
```

## Estructura de la suite

```
services/api/tests/
├── conftest.py                    # Fixtures compartidos (cliente, DB temporal, auth helpers)
├── test_auth_password.py          # forgot/reset/change-password (tests originales)
├── test_login.py                  # POST /auth/login
├── test_register.py               # POST /users (registro público)
├── test_users.py                  # GET/PUT/DELETE /users (CRUD protegido)
├── test_profiles.py               # GET/PUT /profiles/me
├── test_auth_me.py                # GET /auth/me
├── test_login_advanced.py         # PASO 03 — Login avanzado (L1-L6)
├── test_register_advanced.py      # PASO 03 — Register avanzado (R1-R4)
├── test_auth_me_advanced.py       # PASO 03 — Auth/Me avanzado (M1-M2)
├── test_auth_password_advanced.py # PASO 03 — Password avanzado (F1-F2, P1-P3, C1)
├── test_profiles_advanced.py      # PASO 03 — Profiles avanzado (PR1-PR2)
├── test_users_advanced.py         # PASO 03 — Users avanzado (D1-D2)
├── test_security_jwt.py           # PASO 03 — Seguridad JWT (S1-S3)
```

## Cobertura por endpoint

A continuación se detalla cada endpoint con los casos de prueba planificados,
siguiendo la estructura de tres niveles: **camino feliz**, **caso límite** y **modo de fallo**.

---

### POST /auth/login

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Credenciales correctas | Retorna `access_token` + `token_type: bearer`. El token es un JWT válido. |
| ⚠️ Caso límite | Email con mayúsculas | Verifica que el login sea case-sensitive (o que falle si no encuentra match exacto). |
| ⚠️ Caso límite | Contraseña vacía | Pydantic no exige min_length — verifica comportamiento del servicio. |
| ❌ Modo fallo | Email no registrado | 401 "Invalid email or password". Sin enumeración de usuarios. |
| ❌ Modo fallo | Contraseña incorrecta | 401 mismo mensaje genérico. |
| ❌ Modo fallo | Usuario inactivo | `is_active=false` → 401. |
| ⚠️ Caso límite | Contraseña de **72 caracteres** (máximo bcrypt) | L1 — Login funciona con contraseña en el límite. |
| ⚠️ Caso límite | Contraseña **>72 bytes** (bcrypt) | L1-bis — passlib lanza ValueError. |
| ⚠️ Caso límite | Contraseña con **caracteres Unicode** (ñ, ü, emojis) | L2 — bcrypt funciona correctamente con UTF-8. |

### POST /auth/login — Seguridad adicional (PASO 03)

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| L3 | ❌ Fallo | Token firmado con **SECRET_KEY diferente** | Token falsificado rechazado → 401. |
| L4 | ❌ Fallo | Token con **`sub` no numérico** (`"abc"`) | ValueError → credentials_exception → 401. |
| L5 | ❌ Fallo | Token con **`sub` = 0 o negativo** | user_id inválido → 401. |
| L6 | ❌ Fallo | Token de **usuario eliminado** (orphan token) | Usuario ya no existe en DB → 401. |

### POST /auth/forgot-password

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Email registrado | 200 + mensaje genérico. Token creado en DB. Email enviado. |
| ⚠️ Caso límite | Email NO registrado | 200 mismo mensaje genérico. Sin token creado. Sin email enviado. **No enumeración.** |
| ❌ Modo fallo | Error de configuración de email | 200 genérico. Token invalidado en DB. |
| ❌ Modo fallo | Error de entrega de email | 200 genérico. Token invalidado. |
| ❌ Modo fallo | **Usuario inactivo** solicita reset | F1 — Mensaje genérico, no se envía email. Sin enumeración. |
| ❌ Modo fallo | **Múltiples solicitudes** invalidan token anterior | F2 — Solo el último token es válido. |

### POST /auth/reset-password

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Token válido + nueva contraseña | 200. Contraseña actualizada. Login funciona con la nueva. |
| ⚠️ Caso límite | Token usado dos veces | 1ª vez 200, 2ª vez 400. Token de un solo uso. |
| ⚠️ Caso límite | Token expirado | 400. Contraseña original sigue funcionando. |
| ❌ Modo fallo | Token inválido (string aleatorio) | 400. |
| ❌ Modo fallo | Nueva contraseña < 8 caracteres | 422 (validación Pydantic). |
| ❌ Modo fallo | Token de **usuario inactivo** | P1 — 400, no se permite reset. |
| ❌ Modo fallo | Token **expirado por segundos** (timezone edge) | P2 — 400, expires_at <= now con timezone aware. |
| ⚠️ Caso límite | Reset a la **misma contraseña** | P3 — El servicio lo permite (no valida contra history). |

### POST /auth/change-password

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Contraseña actual correcta + nueva diferente | 200. Login funciona con la nueva. |
| ⚠️ Caso límite | Misma contraseña actual y nueva | 400 "La nueva contrasena debe ser diferente". |
| ❌ Modo fallo | Contraseña actual incorrecta | 400 "La contrasena actual no es correcta". |
| ❌ Modo fallo | Sin token (no autenticado) | 401. |
| ❌ Modo fallo | **Usuario inexistente** (token de usuario borrado) | C1 — 401, get_current_user lanza exception. |

### GET /auth/me

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Token válido, usuario con perfil | Retorna email, role y profile con datos. |
| ✅ Camino feliz | Token válido, usuario sin perfil | Retorna email, role y profile=null. |
| ⚠️ Caso límite | Token de admin vs user | Role reflejado correctamente. |
| ❌ Modo fallo | Sin token (no Auth header) | 401. |
| ❌ Modo fallo | Token expirado | 401 "Token has expired". |
| ❌ Modo fallo | Token malformado | 401 "Could not validate credentials". |
| ❌ Modo fallo | Usuario inactivo | 401 "Inactive user account". |
| ❌ Modo fallo | Header sin formato **"Bearer"** | M1 — 401, HTTPBearer(auto_error=False). |
| ❌ Modo fallo | **Token vacío** (`"Bearer "`) | M2 — 401, JWTError. |

### POST /users (Registro público)

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Email + contraseña válidos | 201. Retorna UserResponse con role="user". |
| ✅ Camino feliz | Con perfil opcional (name, phone, address) | 201 + perfil creado en tabla profiles. |
| ⚠️ Caso límite | Solo email + password, sin opcionales | 201. profile creado más tarde via PUT /profiles/me. |
| ⚠️ Caso límite | Email duplicado | 422 "Email already registered". |
| ❌ Modo fallo | Contraseña < 8 caracteres | 422 validación Pydantic. |
| ❌ Modo fallo | Email mal formado | 422. |
| ❌ Modo fallo | Campos vacíos (email vacío) | 422. |
| ❌ Modo fallo | Intento de auto-asignarse role (no expuesto) | El modelo UserCreate no expone role — se verifica que role sea siempre "user". |
| ⚠️ Caso límite | Email con **caracteres internacionales** | R1 — Pydantic EmailStr lo acepta o rechaza. |
| ⚠️ Caso límite | Email con **subdireccionamiento (+)** | R2 — El sistema permite formato `test+tag`. |
| ❌ Modo fallo | **Contraseña = solo espacios** | R3 — Pydantic Field(min_length=8) acepta espacios. |
| ❌ Modo fallo | **name/phone/address vacíos** (`""` en vez de null) | R4 — Perfil se crea con campos vacíos. |

### GET /users (Listar — protegido)

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Admin autenticado | Lista de usuarios. |
| ✅ Camino feliz | Usuario regular autenticado | También puede listar (no requiere admin). |
| ⚠️ Caso límite | Base de datos vacía | Lista vacía `[]`. |
| ❌ Modo fallo | Sin token | 401. |

### GET /users/{user_id} (Obtener — protegido)

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Propio usuario | 200. Datos correctos. |
| ✅ Camino feliz | Admin consulta otro usuario | 200. |
| ⚠️ Caso límite | Usuario regular consulta otro usuario | 403 "Access denied". |
| ❌ Modo fallo | ID inexistente | 404. |
| ❌ Modo fallo | Sin token | 401. |

### PUT /users/{user_id} (Actualizar — protegido)

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Propio usuario actualiza email | 200. Email actualizado. |
| ✅ Camino feliz | Admin cambia role de otro usuario | 200. Role actualizado. |
| ⚠️ Caso límite | Usuario regular intenta cambiar su role | 403 "Only admins can change roles". |
| ⚠️ Caso límite | Usuario regular actualiza otro usuario | 403 "Access denied". |
| ❌ Modo fallo | ID inexistente | 404. |
| ❌ Modo fallo | Sin token | 401. |

### DELETE /users/{user_id} (Eliminar — protegido, solo admin)

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Admin elimina usuario existente | 200. Usuario y perfil eliminados. |
| ❌ Modo fallo | Usuario regular intenta eliminar | 403 "Only admins can delete users". |
| ❌ Modo fallo | Admin elimina ID inexistente | 404. |
| ❌ Modo fallo | Sin token | 401. |

### GET /profiles/me

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Usuario con perfil | 200. Datos del perfil. |
| ❌ Modo fallo | Usuario sin perfil | 404 "Profile not found". |
| ❌ Modo fallo | Sin token | 401. |

### PUT /profiles/me

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Actualizar perfil existente | 200. Datos actualizados. |
| ✅ Camino feliz | Crear perfil si no existe (upsert) | 200. Perfil creado. |
| ⚠️ Caso límite | Actualización parcial (solo un campo) | 200. Solo ese campo cambia. |
| ❌ Modo fallo | Sin token | 401. |
| ⚠️ Caso límite | Actualizar con **todos los campos vacíos** (`{}`) | PR1 — Upsert con todos None, campos existentes se conservan. |
| ⚠️ Caso límite | Actualizar con **campos explícitamente null** | PR1-bis — Perfil con todos los campos None. |
| ⚠️ Caso límite | **Name >500 caracteres** | PR2 — Pydantic no define max_length, se almacena sin problema. |

### DELETE /users/{user_id}

| Tipo | Caso | Qué verifica |
|------|------|-------------|
| ✅ Camino feliz | Admin elimina usuario | 200. Usuario + perfil eliminados. |
| ❌ Modo fallo | Usuario regular intenta eliminar | 403. |
| ❌ Modo fallo | ID inexistente | 404. |
| ❌ Modo fallo | Sin token | 401. |
| ⚠️ Caso límite | **Admin se elimina a sí mismo** | D1 — 200, el servicio lo permite (solo verifica role=admin). |
| ❌ Modo fallo | **Doble eliminación** del mismo ID | D2 — 404 en el segundo intento. |

---

## Resumen de casos por endpoint

| Endpoint | Happy | Edge | Failure | Total |
|----------|-------|------|---------|-------|
| POST /auth/login | 1 | 4 | 6 | 11 |
| POST /auth/forgot-password | 1 | 1 | 4 | 6 |
| POST /auth/reset-password | 1 | 3 | 4 | 8 |
| POST /auth/change-password | 1 | 1 | 3 | 5 |
| GET /auth/me | 2 | 1 | 6 | 9 |
| POST /users (register) | 2 | 4 | 6 | 12 |
| GET /users | 2 | 1 | 1 | 4 |
| GET /users/{id} | 2 | 1 | 2 | 5 |
| PUT /users/{id} | 2 | 2 | 2 | 6 |
| DELETE /users/{id} | 1 | 1 | 4 | 6 |
| GET /profiles/me | 1 | 0 | 2 | 3 |
| PUT /profiles/me | 2 | 4 | 1 | 7 |
| Seguridad JWT (S1-S3) | — | 1 | 3 | 4 |
| **Total** | **18** | **24** | **42** | **84** |

> Los 91 tests cubren 84 casos planificados más 7 variantes adicionales (como contraseña >72 bytes, algoritmo none con firma vacía, SECRET_KEY vacío).

---

## Notas sobre la estrategia de pruebas

### No probamos serialización HTTP
Cada prueba afirma algo sobre la **lógica de negocio**: qué decisiones toma el endpoint, no cómo se serializa la respuesta HTTP. Por ejemplo:
- ✅ "El token JWT contiene el `sub` correcto" (lógica)
- ❌ "El header `Content-Type` es `application/json`" (serialización)

### Aislamiento de base de datos
Usamos `TinyDB` con `MemoryStorage` y un fixture `conftest.py` que reemplaza `get_db()` antes de cada test. No hay persistencia entre pruebas.

### Auth helpers compartidos
El `conftest.py` expone funciones helper como `create_test_user()` y `login_as()` para que los tests sean legibles y no dupliquen lógica de setup.

### Flujo asistido por IA (PASO 03)
La batería de pruebas se complementó con un análisis profundo asistido por IA que identificó **32 casos adicionales** no cubiertos inicialmente. El análisis incluyó:

- **Revisión de seguridad**: se identificaron 4 casos de seguridad (JWT con algoritmo "none", token falsificado, sub no numérico, SECRET_KEY vacío).
- **Análisis de bordes**: contraseñas Unicode, emails internacionales, timezone edge cases.
- **Bugs detectados**:
  1. `datetime.utcnow()` deprecado en `auth/services.py` (línea 103) — genera `DeprecationWarning`.
  2. `SECRET_KEY` por defecto vacío (`""`) — inseguro en producción.
  3. `ACCESS_TOKEN_EXPIRE_MINUTES` sin límite máximo — tokens podrían durar años.
- **Documentación completa**: `TESTING_PASO03.md` contiene todos los casos adicionales identificados, priorizados por nivel de urgencia.

### Dependencias de testing
```bash
uv add --dev pytest pytest-cov httpx
```