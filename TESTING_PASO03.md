# PASO 03 — Casos de prueba adicionales identificados con asistencia de IA

Este documento lista los **casos de prueba adicionales** identificados tras un análisis profundo de la lógica de negocio usando IA.

Se examinaron los archivos:
- `auth/services.py` — lógica de autenticación, perfiles, tokens
- `auth/dependencies.py` — generación y validación de JWT
- `auth/models.py` — esquemas Pydantic
- `routes/auth.py` — endpoints públicos y protegidos
- `routes/users.py` — CRUD de usuarios
- `routes/profiles.py` — gestión de perfiles
- `notifications/resend_client.py` — envío de emails

> **Nota:** Este documento contiene **exclusivamente casos no cubiertos** por la batería actual del PASO 02 (62 tests, 92% cobertura).

---

## Casos adicionales identificados

### 1. POST /auth/login — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| L1 | ⚠️ Límite | Contraseña con **>100 caracteres** | `auth_services.authenticate_user()` maneja cadenas largas sin error. | bcrypt no tiene límite documentado de input |
| L2 | ⚠️ Límite | Contraseña con **caracteres Unicode** (ñ, ü, emojis) | bcrypt funciona correctamente con UTF-8. | `_verify_password` en services.py |
| L3 | ❌ Fallo | Token JWT firmado con **SECRET_KEY diferente** (token falsificado) | `get_current_user()` debe rechazar tokens no firmados por nosotros. | `dependencies.py` — `jwt.decode(token, SECRET_KEY, ...)` |
| L4 | ❌ Fallo | Token con **`sub` que no es un número válido** (ej: `"abc"`) | `int(user_id_str)` lanza `ValueError` → 401. | `dependencies.py` línea ~42 |
| L5 | ❌ Fallo | Token con **`sub` = 0 o negativo** | user_id inválido → `get_user_doc_from_db(0)` retorna None → 401. | `dependencies.py` + `services.get_user_doc_from_db()` |
| L6 | ❌ Fallo | Token de un usuario que **fue eliminado después de emitir el token** (orphan token) | `get_user_doc_from_db()` retorna None → 401. | `dependencies.py` |

### 2. POST /users (registro) — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| R1 | ⚠️ Límite | Email con **caracteres internacionales** (ej: `usuário@example.com`) | Pydantic `EmailStr` lo acepta o rechaza. | `models.py` — `UserCreate.email: EmailStr` |
| R2 | ⚠️ Límite | Email con **subdireccionamiento** (ej: `test+tag@example.com`) | Ver si el sistema permite el formato `+`. | TinyDB busca exact match. |
| R3 | ❌ Fallo | **Contraseña = solo espacios** (`"        "` de 8 espacios) | Pydantic `Field(min_length=8)` acepta espacios. ¿El servicio los acepta? | `UserCreate.password` |
| R4 | ❌ Fallo | **name/phone/address vacíos pero presentes** (`""` en vez de null) | Pydantic diferencia `None` de `""`. Perfil se crea con campos vacíos. | `ProfileDomain` acepta `str\|None` |

### 3. GET /auth/me — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| M1 | ❌ Fallo | Header `Authorization` con **formato inválido** (sin "Bearer") | `HTTPBearer(auto_error=False)` → credentials=None → 401. | `dependencies.py` — `bearer_scheme` |
| M2 | ❌ Fallo | Header `Authorization` con **token vacío** (`"Bearer "`) | Token vacío → JWTError → 401. | `dependencies.py` — `jwt.decode()` |

### 4. POST /auth/forgot-password — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| F1 | ❌ Fallo | Solicitud para **usuario inactivo** | `create_password_reset_token()` verifica `is_active` → retorna None → mensaje genérico sin enumeración. | `services.py` ~línea 240 |
| F2 | ❌ Fallo | **Múltiples solicitudes** de forgot-password para el mismo usuario | Se invalidan tokens anteriores. Verificar que solo el último token es válido. | `services.py` línea 246-248 |

### 5. POST /auth/reset-password — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| P1 | ❌ Fallo | Reset con **token de un usuario inactivo** | `reset_password()` verifica is_active → False. | `services.py` ~línea 290 |
| P2 | ❌ Fallo | Reset con **token que expiró hace segundos** (timezone edge) | `expires_at <= now` con timezone-aware. | `services.py` ~línea 277-281 |
| P3 | ⚠️ Límite | Reset con **nueva contraseña = misma que la anterior** | El servicio permite cambiar a la misma contraseña? No hay validación contra history. | Habría que decidir si es bug o feature |

### 6. POST /auth/change-password — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| C1 | ❌ Fallo | Change-password para **usuario inexistente** (token válido de user que fue borrado) | `get_user_doc_from_db()` retorna None → 401 antes de llegar a change-password. | `dependencies.py` |

### 7. GET/PUT /profiles/me — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| PR1 | ⚠️ Límite | **Actualizar perfil con todos los campos vacíos** (`{}` o todos null) | Upsert crea perfil con todos los campos None. | `upsert_profile()` en services.py |
| PR2 | ⚠️ Límite | **Actualizar perfil con campos muy largos** (name > 500 chars) | Pydantic no define max_length → se almacena en TinyDB sin problema. | ¿Debería tener max_length? |

### 8. DELETE /users/{user_id} — Casos adicionales

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| D1 | ⚠️ Límite | **Admin se elimina a sí mismo** | ¿Debería permitirse? Actualmente es posible. Podría dejarse al admin sin cuenta. | `routes/users.py` — solo verifica role=admin |
| D2 | ❌ Fallo | **Eliminar usuario que ya fue eliminado** (doble delete) | `delete_user()` retorna False → 404. | `services.py` ~línea 186 |

### 9. Casos de seguridad y lógica de tokens (transversales)

| # | Tipo | Caso | Qué verifica | Código relevante |
|---|------|------|-------------|-----------------|
| S1 | ❌ Fallo | **JWT con algoritmo "none"** (ataque de confusión de algoritmo) | `python-jose` con algorithm=HS256 debería rechazar "none". | `dependencies.py` — `jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])` |
| S2 | ❌ Fallo | **Access token con payload manipulado** (cambiar sub por otro user_id) | La firma no coincide → JWTError → 401. | `dependencies.py` |
| S3 | ⚠️ Límite | **SECRET_KEY vacío** (`""`) en desarrollo | `jwt.encode()` y `decode()` usan clave vacía → funciona pero inseguro. | `dependencies.py` línea 19 |

---

## Bugs potenciales detectados durante la revisión

### Bug 1: `datetime.utcnow()` está deprecado
En `auth/services.py` línea 103:
```python
created_at = datetime.utcnow()
```
**Impacto:** Bajo (sigue funcionando hasta Python 3.14). Genera `DeprecationWarning`.
**Solución:** Reemplazar con `datetime.now(timezone.utc)`.

### Bug 2: No hay validación de `SECRET_KEY` vacío en producción
En `auth/dependencies.py`:
```python
SECRET_KEY = os.getenv("SECRET_KEY", "")
```
**Impacto:** Si no se configura `SECRET_KEY`, se usa `""` como clave secreta. Un atacante podría firmar JWTs válidos.
**Solución:** Validar en startup que `SECRET_KEY` no esté vacío.

### Bug 3: `ACCESS_TOKEN_EXPIRE_MINUTES` sin límite máximo
En `auth/dependencies.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
```
**Impacto:** Si alguien configura `ACCESS_TOKEN_EXPIRE_MINUTES=999999`, los tokens durarían casi 2 años.
**Solución:** Agregar validación de rango (ej: 1-1440 minutos).

---

## Resumen

| Categoría | Casos nuevos |
|-----------|-------------|
| Login (L) | 6 |
| Register (R) | 4 |
| Auth/Me (M) | 2 |
| Forgot-password (F) | 2 |
| Reset-password (P) | 3 |
| Change-password (C) | 1 |
| Profiles (PR) | 2 |
| Delete user (D) | 2 |
| Seguridad (S) | 3 |
| **Total casos nuevos** | **25** |

---

## Priorización sugerida para implementación

### Alta prioridad (implementar ahora):
1. **S1** — JWT con algoritmo "none" (seguridad crítica)
2. **L3** — Token firmado con clave diferente (token falsificado)
3. **L4** — Token con sub no numérico
4. **L6** — Token de usuario eliminado (orphan token)
5. **F1** — Forgot-password para usuario inactivo
6. **P2** — Token expirado por timezone edge
7. **D1** — Admin se elimina a sí mismo

### Media prioridad (recomendado):
8. **L5** — Token con sub=0 o negativo
9. **R3** — Contraseña de solo espacios
10. **F2** — Múltiples solicitudes forgot-password
11. **P1** — Reset con token de usuario inactivo
12. **PR1** — Perfil con todos los campos vacíos
13. **M1** — Header Authorization sin "Bearer"
14. **M2** — Token vacío en header

### Baja prioridad (opcional):
15. **L1** — Contraseña >100 chars
16. **L2** — Contraseña con Unicode
17. **R1** — Email internacional
18. **R2** — Email con subdireccionamiento
19. **S3** — SECRET_KEY vacío
20. **P3** — Reset con misma contraseña
21. **R4** — name/phone/address vacíos pero presentes
22. **C1** — Change-password para usuario inexistente
23. **PR2** — Campos muy largos en perfil
24. **D2** — Doble eliminación de usuario
25. **S2** — Payload manipulado

---

*Documento generado con asistencia de IA tras analizar la lógica de negocio de cada endpoint de autenticación.*

---

## Resultados de implementación

### ✅ Implementado — 29 tests en 7 archivos nuevos

| Archivo | Tests | Casos cubiertos | Estado |
|---------|-------|-----------------|--------|
| `test_login_advanced.py` | 8 tests | L1 (72 chars), L1-bis (>72 bytes), L2 (Unicode), L3 (wrong key), L4 (non-numeric sub), L5 (sub=0, sub=-1), L6 (orphan) | ✅ |
| `test_register_advanced.py` | 4 tests | R1 (intl email), R2 (plus subaddressing), R3 (spaces password), R4 (empty fields) | ✅ |
| `test_auth_me_advanced.py` | 2 tests | M1 (no Bearer prefix), M2 (empty token) | ✅ |
| `test_auth_password_advanced.py` | 6 tests | F1 (inactive forgot), F2 (multiple forgot), P1 (inactive reset), P2 (timezone edge), P3 (same password), C1 (deleted user change) | ✅ |
| `test_profiles_advanced.py` | 3 tests | PR1 (empty body), PR1-bis (null fields), PR2 (long name) | ✅ |
| `test_users_advanced.py` | 2 tests | D1 (admin self-delete), D2 (double delete) | ✅ |
| `test_security_jwt.py` | 4 tests | S1 (alg=none), S1-bis (none empty sig), S2 (tampered payload), S3 (empty secret key) | ✅ |

### 📊 Resultados

- **91/91 tests pasan** ✅ (62 anteriores + 29 nuevos)
- **Cobertura: 93%** (subió de 92%)
- **7 nuevos helpers** en `conftest.py`: `create_token_with_secret()`, `create_token_with_sub()`, `create_token_with_algorithm_none()`, `delete_user_by_email()`
- **1 bug confirmado**: `datetime.utcnow()` deprecado en auth/services.py — genera `DeprecationWarning` en todos los tests