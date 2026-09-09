# Testing — PASO 04 (Actividad Extra)

## Backoffice API (Suppliers + Incidents) + Frontend Utility Functions

Este documento detalla el plan de pruebas para el **PASO 04** del proyecto **Building Bullet-Proof Applications**.

---

## 📋 Resumen del enfoque

| Componente | Framework | Elementos a probar | Casos |
|------------|-----------|-------------------|-------|
| **Backend** — Suppliers API | pytest | 6 endpoints (POST, GET, GET/{id}, PATCH rate, PATCH status, DELETE) | 20 |
| **Backend** — Incidents (adicional) | pytest | Endpoints existentes con nuevos casos límite | 6 |
| **Frontend** — Registro proveedores | Jest | Lógica de validación del formulario (`suppliers-page-client.tsx`) | 8 |
| **Frontend** — Registro candidatos | Jest | Funciones `validateForm`, `toPayload`, `sanitizeOptionalUrl`, `isValidOptionalUrl` (`CandidateForm.tsx`) | 10 |
| **Frontend** — Registro incidencias | Jest | Lógica de validación del formulario (`incident-manager.tsx`) + `queryFromFilters`, `formatDate` | 8 |
| **Frontend** — Utilidades adicionales | Jest | `isRenewalSoon`, `formatDateTime`, `formatExperienceYears` | 6 |
| **Total** | | | **58** |

---

## 🧪 Cómo ejecutar las pruebas

### Backend (pytest)

```bash
# Las pruebas deben ejecutarse desde services/api/
cd services/api

# Ejecutar todas las pruebas del PASO 04 (suppliers + incidents)
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/test_suppliers.py tests/test_incidents_advanced.py -v -W all

# Ejecutar la suite completa (incluyendo PASO 01-03)
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/ -v -W all

# Con cobertura
PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest --cov=services.api.routes.suppliers --cov=services.api.routes.incidents tests/ --cov-report=term-missing -W all
```

### Frontend (Jest)

```bash
# Instalar dependencias de testing si no están presentes
cd uis/backoffice
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom

# Ejecutar pruebas del frontend
npx jest --coverage

# O si se configura en package.json:
npm test
```

---

## 1️⃣ Backend — Suppliers API (test_suppliers.py)

**Archivo:** `services/api/tests/test_suppliers.py`

### POST /suppliers

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S1 | ✅ Camino feliz | Proveedor Spain con EUR | 201 + datos correctos + `updated_at` presente |
| S2 | ✅ Camino feliz | Proveedor USA con USD | 201 + datos correctos |
| S3 | ⚠️ Caso límite | Sin campos opcionales (email, notes, renewal) | 201, campos opcionales ausentes |
| S4 | ⚠️ Caso límite | Proveedor con todas las categorías | 201, 9 categorías válidas |
| S5 | ❌ Modo fallo | Moneda incorrecta para Spain (USD) | 422, regla de negocio país↔moneda |
| S6 | ❌ Modo fallo | Moneda incorrecta para USA (EUR) | 422, regla de negocio país↔moneda |
| S7 | ❌ Modo fallo | `monthly_rate` ≤ 0 | 422 |
| S8 | ❌ Modo fallo | Categoría inválida | 422 |
| S9 | ❌ Modo fallo | Sin autenticación (no token) | 401 |

### GET /suppliers

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S10 | ✅ Camino feliz | Listar todos | 200, lista completa |
| S11 | ✅ Camino feliz | Filtrar por country | 200, solo suppliers de ese país |
| S12 | ✅ Camino feliz | Filtrar por category | 200, solo suppliers con esa categoría |
| S13 | ⚠️ Caso límite | DB vacía | 200, lista vacía `[]` |
| S14 | ❌ Modo fallo | Sin token | 401 |

### GET /suppliers/{id}

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S15 | ✅ Camino feliz | ID existente | 200, datos del proveedor |
| S16 | ❌ Modo fallo | ID inexistente | 404 |

### PATCH /suppliers/{id}/rate

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S17 | ✅ Camino feliz | Actualizar tarifa | 200, `monthly_rate` cambiado, `updated_at` renovado |
| S18 | ❌ Modo fallo | `monthly_rate` ≤ 0 | 422 |
| S19 | ❌ Modo fallo | ID inexistente | 404 |

### PATCH /suppliers/{id}/status

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S20 | ✅ Camino feliz | Cambiar estado | 200, estado actualizado |
| S21 | ❌ Modo fallo | Estado inválido | 422 |
| S22 | ❌ Modo fallo | ID inexistente | 404 |

### DELETE /suppliers/{id}

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| S23 | ✅ Camino feliz | Eliminar existente | 200 + mensaje confirmación |
| S24 | ❌ Modo fallo | ID inexistente | 404 |
| S25 | ❌ Modo fallo | Sin token | 401 |

---

## 2️⃣ Backend — Incidents Advanced (test_incidents_advanced.py)

**Archivo:** `services/api/tests/test_incidents_advanced.py`

Ampliación de cobertura para los endpoints de incidencias.

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| I1 | ⚠️ Caso límite | Título de exactamente 120 caracteres | 201, límite superior aceptado |
| I2 | ❌ Modo fallo | Título > 120 caracteres | 422, validación Pydantic |
| I3 | ⚠️ Caso límite | Descripción mínima (1 carácter) | 201, campo obligatorio con mínimo |
| I4 | ❌ Modo fallo | Categoría inválida | 400, error de validación |
| I5 | ❌ Modo fallo | Origen inválido | 400, error de validación |
| I6 | ❌ Modo fallo | Sucursal inválida | 400, error de validación |
| I7 | ⚠️ Caso límite | Filtrar por múltiples parámetros | 200, combinación de filtros |
| I8 | ✅ Camino feliz | Obtener incidencia por ID existente | 200, datos correctos |

---

## 3️⃣ Frontend — Utilidades Backoffice (Jest)

### 3.1 Formulario de Proveedores (suppliers-page-client.tsx)

Funciones a probar: **`isRenewalSoon()`** y **validación de creación** (lógica inline en `handleCreateSupplier`).

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| F1 | ✅ Happy | `isRenewalSoon` con fecha dentro de 30 días | Retorna `true` |
| F2 | ⚠️ Edge | `isRenewalSoon` con fecha dentro de 60 días | Retorna `true` (límite exacto) |
| F3 | ✅ Happy | `isRenewalSoon` con fecha > 60 días | Retorna `false` |
| F4 | ⚠️ Edge | `isRenewalSoon` con fecha pasada | Retorna `false` |
| F5 | ❌ Fallo | `isRenewalSoon` con fecha inválida | Retorna `false` (no lanza error) |
| F6 | ⚠️ Edge | `isRenewalSoon` con `null`/`undefined` | Retorna `false` |
| F7 | ✅ Happy | Validación: nombre no vacío + categorías válidas + rate > 0 | Pasa validación |
| F8 | ❌ Fallo | Validación: categoría inválida | Falla con mensaje "Invalid category" |

### 3.2 Formulario de Candidatos (CandidateForm.tsx)

Funciones a probar: **`validateForm()`**, **`sanitizeOptionalUrl()`**, **`isValidOptionalUrl()`**, **`toPayload()`**.

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| C1 | ✅ Happy | `validateForm` con datos válidos | Retorna `{}` (sin errores) |
| C2 | ❌ Fallo | `validateForm` con nombre vacío | Error `full_name` obligatorio |
| C3 | ❌ Fallo | `validateForm` con email inválido | Error `email` formato |
| C4 | ❌ Fallo | `validateForm` con email vacío | Error `email` obligatorio |
| C5 | ⚠️ Edge | `validateForm` con experiencia negativa | Error `experience_years` |
| C6 | ❌ Fallo | `validateForm` con linkedin_url inválida | Error `linkedin_url` |
| C7 | ✅ Happy | `sanitizeOptionalUrl` con valor válido | Retorna el valor |
| C8 | ✅ Happy | `sanitizeOptionalUrl` con cadena vacía | Retorna `null` |
| C9 | ✅ Happy | `isValidOptionalUrl` con URL válida | Retorna `true` |
| C10 | ❌ Fallo | `isValidOptionalUrl` con URL malformada | Retorna `false` |
| C11 | ✅ Happy | `toPayload` convierte correctamente | Retorna `CandidateRecordInput` con tipos correctos |
| C12 | ⚠️ Edge | `toPayload` con valores vacíos | `linkedin_url` y `cv_url` como `null` |

### 3.3 Formulario de Incidencias (incident-manager.tsx)

Funciones a probar: **validación de `submitIncident`** (lógica inline), **`queryFromFilters()`**, **`formatDate()`**.

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| N1 | ✅ Happy | Validación: título + descripción válidos | Sin errores |
| N2 | ❌ Fallo | Validación: título vacío | Error `title` obligatorio |
| N3 | ❌ Fallo | Validación: título > 120 caracteres | Error `title` límite |
| N4 | ❌ Fallo | Validación: descripción vacía | Error `description` obligatorio |
| N5 | ✅ Happy | `queryFromFilters` con filtros activos | Query string correcta |
| N6 | ✅ Happy | `queryFromFilters` sin filtros | Cadena vacía |
| N7 | ✅ Happy | `formatDate` con fecha ISO | String formateado español |
| N8 | ⚠️ Edge | `formatDate` con fecha inválida | No lanza error |

### 3.4 Utilidades de Talent Pipeline (formatters.ts)

| # | Tipo | Caso | Qué verifica |
|---|------|------|-------------|
| T1 | ✅ Happy | `formatDateTime` con fecha ISO válida | String formateado |
| T2 | ⚠️ Edge | `formatDateTime` con fecha inválida | Retorna el valor original |
| T3 | ✅ Happy | `formatExperienceYears` con 1 año | "1 ano" |
| T4 | ✅ Happy | `formatExperienceYears` con >1 años | "{n} anos" |

---

## 4️⃣ Archivos de prueba a crear

### Backend (pytest)

| Archivo | Descripción |
|---------|-------------|
| `services/api/tests/test_suppliers.py` | Pruebas para todos los endpoints de Suppliers |
| `services/api/tests/test_incidents_advanced.py` | Pruebas adicionales para Incidents |

### Frontend (Jest)

| Archivo | Descripción |
|---------|-------------|
| `uis/backoffice/__tests__/suppliers-utils.test.ts` | Pruebas para `isRenewalSoon` y validación de creación |
| `uis/backoffice/__tests__/candidate-form.test.ts` | Pruebas para `validateForm`, `sanitizeOptionalUrl`, `isValidOptionalUrl`, `toPayload` |
| `uis/backoffice/__tests__/incident-utils.test.ts` | Pruebas para validación del formulario, `queryFromFilters`, `formatDate` |
| `uis/backoffice/__tests__/formatters.test.ts` | Pruebas para `formatDateTime`, `formatExperienceYears` |

---

## 5️⃣ Configuración de Jest

Se necesita añadir un archivo `jest.config.ts` en `uis/backoffice/` y actualizar `package.json`.

### jest.config.ts (propuesto)

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
```

### package.json — añadir script

```json
"scripts": {
  "test": "jest --coverage",
  ...
}
```

---

## 6️⃣ Objetivos de cobertura

| Módulo | Cobertura objetivo |
|--------|-------------------|
| `routes/suppliers.py` | ≥ 60% |
| `routes/incidents.py` | ≥ 60% (adicional sobre existente) |
| Frontend utilidades (Jest) | ≥ 60% |

---

## 7️⃣ Resumen de casos por módulo

| Módulo | Happy | Edge | Failure | Total |
|--------|-------|------|---------|-------|
| Suppliers API (backend) | 8 | 3 | 14 | 25 |
| Incidents Advanced (backend) | 1 | 4 | 3 | 8 |
| Frontend — Proveedores | 3 | 3 | 2 | 8 |
| Frontend — Candidatos | 5 | 3 | 4 | 12 |
| Frontend — Incidencias | 4 | 1 | 3 | 8 |
| Frontend — Formatters | 2 | 1 | 0 | 3 |
| **Total** | **23** | **15** | **26** | **64** |

---

## 8️⃣ Notas técnicas

### Backend
- Usar `TinyDB` con `MemoryStorage` para aislamiento (mismo patrón que `conftest.py`)
- Para Suppliers, se necesita un fixture que sobrescriba `get_suppliers_table()` con tabla en memoria
- Heredar la estructura de `conftest.py` (usar `client`, `test_user`, `admin_user`)

### Frontend
- Usar `ts-jest` para compilar TypeScript
- Las pruebas de validación son **puras** (no dependen de React ni del DOM)
- Extraer las funciones de validación como funciones exportables o reescribir los tests para acceder a la lógica
- Pattern: re-implementar la lógica de validación en los tests o crear pequeños módulos de utilidad extraíbles
- Para `formatDate` y `queryFromFilters`, extraer como funciones exportables

### Estrategia para probar lógica inline
Dado que varias validaciones están inline dentro de componentes React, se seguirá esta estrategia:

1. **Funciones ya exportables**: `isRenewalSoon`, `formatDateTime`, `formatExperienceYears`, `sanitizeOptionalUrl`, `isValidOptionalUrl`, `toPayload`, `validateForm` (CandidateForm) — se importan directamente.
2. **Lógica inline**: Se reimplementa como función independiente en el test para verificar el mismo algoritmo.
3. **Funciones a extraer**: `queryFromFilters` y `formatDate` pueden extraerse como funciones exportables en los tests.