# SPECS - Sin Hito 07 (Auditoría de gestión de errores)

## Identificación

- **Proyecto:** Gestión de errores transversal.
- **Tipo de entrega:** Informe de auditoría de solo lectura.
- **Fecha de auditoría:** 2026-09-06.
- **Aplicaciones revisadas:** `uis/backoffice` y `uis/website`.
- **Backend revisado:** FastAPI en `services/api`.
- **Scripts y lógica compartida revisados:** `scripts`, `shared` y `src`.
- **Stack vigente:** Next.js 16, React 19, TypeScript 5, FastAPI, Python 3.11 o superior y TinyDB.

## Objetivo

Identificar los defectos actuales de gestión de errores que pueden dejar operaciones sin respuesta clara, mostrar detalles técnicos al usuario, devolver respuestas no estructuradas o terminar scripts sin un diagnóstico operativo adecuado.

Este documento registra el estado observado del repositorio. No contiene cambios de código ni propone funcionalidades nuevas.

## Alcance y metodología

La auditoría tomó como inventario base el `README.md` de la raíz y revisó el código ejecutable vigente en:

- `uis/backoffice/app`, sus componentes y clientes HTTP.
- `uis/website/app` y su formulario público de registro.
- `services/api/routes`, `services/api/auth`, `services/api/incidents`, `services/api/notifications`, persistencia y seeders.
- `scripts`, `shared` y `src`.

Se buscaron llamadas `fetch`, operaciones `await`, parseo JSON/CSV, acceso a archivos, bloques `catch` y `except`, mensajes renderizados, salidas por `stderr`, códigos de salida y posibles exposiciones mediante `console`, `print` o respuestas HTTP.

Se excluyeron dependencias, artefactos de build, metadatos generados, datos y `SPECS/obsoletos`. Los archivos JavaScript heredados de `uis/backoffice/public` se revisaron como superficie residual, porque la ruta Next.js vigente no los importa.

La severidad se asigna así:

- **CRÍTICO:** exposición confirmada de secretos o indisponibilidad general.
- **ALTO:** defecto transversal o flujo principal que puede mostrar información técnica o dejar datos en un estado inseguro.
- **MEDIO:** operación recuperable con comunicación o control insuficiente.
- **BAJO:** código residual o riesgo de impacto limitado.

## Resumen ejecutivo

No se identificaron hallazgos críticos ni una filtración confirmada de contraseñas, JWT, claves API o cadenas de conexión. Tampoco se encontraron bloques `except: pass`, `catch` realmente vacíos en flujos activos ni scripts principales que, tras capturar un fallo crítico, devuelvan código `0`.

Se registran **13 hallazgos**: 4 altos, 8 medios y 1 bajo.

| Categoría | Alto | Medio | Bajo | Total |
|---|---:|---:|---:|---:|
| Exposición de errores en crudo | 2 | 1 | 1 | 4 |
| Catch demasiado amplio | 1 | 1 | 0 | 2 |
| Try/catch ausente | 0 | 4 | 0 | 4 |
| Estados de carga/error ausentes en la UI | 1 | 0 | 0 | 1 |
| Sin llamada a la acción para el usuario | 0 | 2 | 0 | 2 |
| Fallos silenciosos | 0 | 0 | 0 | 0 |
| Filtración de datos sensibles confirmada | 0 | 0 | 0 | 0 |
| Sin `sys.exit` en fallo de script | 0 | 0 | 0 | 0 |
| **Total** | **4** | **8** | **1** | **13** |

## Hallazgos

### ALTO-01 - El cliente HTTP compartido propaga mensajes del backend a toda la UI

- **Ruta y líneas:** `uis/backoffice/lib/api-client.ts:39-55, 126`.
- **Categoría:** EXPOSICIÓN DE ERRORES EN CRUDO.
- **Problema:** `parseError` convierte cualquier `detail` o `error.message` recibido en el mensaje público de `ApiError`, y `getErrorMessage` devuelve después `Error.message` sin normalización. Cualquier detalle técnico emitido por FastAPI puede terminar en login, registro, perfil, proveedores o analizador de incidencias.
- **Corrección sugerida:** mapear por operación y código HTTP a mensajes públicos controlados; conservar detalles del servidor solo para observabilidad segura.

### ALTO-02 - Talent Pipeline muestra errores técnicos y códigos HTTP del servicio externo

- **Ruta y líneas:** `services/api/clients/talentTrackerApi.ts:119-149`; `uis/backoffice/app/talent-pipeline-tracker/CandidatesPageClient.tsx:101-108, 134-142`; `uis/backoffice/app/talent-pipeline-tracker/components/CandidateDetailClient.tsx:43-45`.
- **Categoría:** EXPOSICIÓN DE ERRORES EN CRUDO.
- **Problema:** el cliente acepta literalmente `detail` del servicio externo o genera `Error <status>`, mientras las pantallas renderizan `error.message`. El usuario puede ver mensajes del proveedor, códigos HTTP o errores de infraestructura.
- **Corrección sugerida:** traducir respuestas externas a un catálogo de errores de dominio antes de entregarlas a los componentes.

### ALTO-03 - El analizador CSV captura cualquier excepción y devuelve su texto al cliente

- **Ruta y líneas:** `services/api/routes/incidents.py:178-184`.
- **Categoría:** CATCH DEMASIADO AMPLIO.
- **Problema:** después de dos excepciones conocidas, `except Exception` convierte cualquier defecto inesperado en un `400` con `str(error)`. Esto oculta fallos internos como errores del archivo y puede revelar rutas, nombres internos o datos incluidos en la excepción.
- **Corrección sugerida:** capturar solo errores de entrada conocidos; registrar internamente los inesperados y devolver un `500` estructurado con mensaje público fijo.

### ALTO-04 - El perfil queda editable después de fallar su carga inicial

- **Ruta y líneas:** `uis/backoffice/app/account/profile/page.tsx:29-45, 82-116`.
- **Categoría:** ESTADOS DE CARGA/ERROR AUSENTES EN LA UI.
- **Problema:** si falla `GET /auth/me`, termina la carga y se muestra el formulario con valores vacíos y el botón de guardar activo. El usuario puede confundir el fallo con un perfil vacío e intentar sobrescribir datos.
- **Corrección sugerida:** renderizar un estado de error excluyente con botón de reintento y no habilitar el formulario hasta obtener el perfil.

### MEDIO-01 - El registro público muestra códigos HTTP y mensajes de red del navegador

- **Ruta y líneas:** `uis/website/app/registro/RegistroForm.tsx:156-172`.
- **Categoría:** EXPOSICIÓN DE ERRORES EN CRUDO.
- **Problema:** una respuesta no exitosa crea `Error del servidor: <status>` y el `catch` muestra literalmente `error.message`; un fallo de red puede aparecer como `Failed to fetch`.
- **Corrección sugerida:** presentar un mensaje estable y legible, diferenciando como máximo validación, indisponibilidad y fallo de conexión.

### MEDIO-02 - Las respuestas JSON exitosas no tienen traducción de errores de parseo

- **Ruta y líneas:** `uis/backoffice/lib/api-client.ts:117-122`; `services/api/clients/talentTrackerApi.ts:158-166`.
- **Categoría:** TRY/CATCH AUSENTE.
- **Problema:** un `2xx` con cuerpo vacío o JSON malformado lanza `SyntaxError`; los consumidores terminan mostrando ese mensaje técnico mediante los helpers actuales.
- **Corrección sugerida:** validar `Content-Type` y cuerpo esperado, capturar el fallo de parseo y lanzar un error de aplicación con mensaje público controlado.

### MEDIO-03 - El listado de candidaturas no ofrece recuperación explícita

- **Ruta y líneas:** `uis/backoffice/app/talent-pipeline-tracker/CandidatesPageClient.tsx:89-119, 200-205`.
- **Categoría:** SIN LLAMADA A LA ACCIÓN PARA EL USUARIO.
- **Problema:** el estado de error muestra texto, pero no incluye botón para repetir la consulta, volver a una vista segura o contactar soporte.
- **Corrección sugerida:** añadir `Reintentar` conectado a la recarga ya representada por `refreshToken` y mantener los filtros seleccionados.

### MEDIO-04 - Los errores de detalle y notas no permiten reintentar

- **Ruta y líneas:** `uis/backoffice/app/talent-pipeline-tracker/components/CandidateDetailClient.tsx:72-106, 294-303, 390-402`.
- **Categoría:** SIN LLAMADA A LA ACCIÓN PARA EL USUARIO.
- **Problema:** `loadRecord` y `loadNotes` tienen estados de error, pero la vista solo muestra el mensaje. El enlace al listado permite abandonar la ficha, pero no recuperar la operación; las notas tampoco ofrecen una salida propia.
- **Corrección sugerida:** incluir acciones `Reintentar candidatura` y `Reintentar notas` que invoquen las funciones de carga existentes.

### MEDIO-05 - La lectura del archivo subido queda fuera del manejo específico

- **Ruta y líneas:** `services/api/routes/incidents.py:170-184`.
- **Categoría:** TRY/CATCH AUSENTE.
- **Problema:** `await file.read()` ocurre antes del bloque protegido. Un error de lectura produce la respuesta por defecto del framework, no el JSON limpio y estructurado exigido por el proyecto.
- **Corrección sugerida:** capturar errores de lectura alrededor de esa operación, registrar la causa y devolver una respuesta pública fija con el código apropiado.

### MEDIO-06 - La exportación del script de análisis no controla fallos de I/O

- **Ruta y líneas:** `scripts/analyze.py:101-109`.
- **Categoría:** TRY/CATCH AUSENTE.
- **Problema:** `mkdir` y `write_bytes` están fuera del bloque que traduce errores. Un directorio sin permisos o un disco lleno genera traceback en lugar de un mensaje breve en `stderr`; el proceso sí termina con código no cero por la excepción no capturada.
- **Corrección sugerida:** envolver únicamente la creación y escritura, informar por `stderr` y retornar `1`.

### MEDIO-07 - El seeder principal no traduce fallos de configuración o persistencia

- **Ruta y líneas:** `services/api/seed.py:24-32, 194-242`.
- **Categoría:** TRY/CATCH AUSENTE.
- **Problema:** la ausencia de variables se eleva durante la importación y las operaciones TinyDB del seeder no tienen frontera de manejo. El fallo termina con código no cero, pero imprime un traceback con rutas internas y carece de un diagnóstico CLI estable.
- **Corrección sugerida:** validar configuración dentro de `main`, capturar errores esperables de configuración, validación e I/O en su operación concreta, escribir un mensaje sanitizado en `stderr` y devolver `1`.

### MEDIO-08 - El cliente de correo captura configuración, construcción y envío en un único bloque

- **Ruta y líneas:** `services/api/notifications/resend_client.py:22-45`.
- **Categoría:** CATCH DEMASIADO AMPLIO.
- **Problema:** un único `except Exception` engloba lectura de configuración, validación de URL, construcción del mensaje y llamada a Resend. Aunque el error público queda sanitizado, se pierde la distinción operativa entre configuración inválida y caída del proveedor.
- **Corrección sugerida:** validar configuración fuera del envío y capturar en torno a `resend.Emails.send` las excepciones conocidas del SDK, encadenando un error de dominio sin secretos.

### BAJO-01 - El cliente estático heredado conserva parseo y mensajes inseguros

- **Ruta y líneas:** `uis/backoffice/public/incidents-analyzer/app.js:129-147`; comportamiento duplicado en `uis/backoffice/public/incidents-app.js:129-147`.
- **Categoría:** EXPOSICIÓN DE ERRORES EN CRUDO.
- **Problema:** ejecuta `response.json()` antes de comprobar el estado y muestra `payload.detail` o `error.message`. No se encontró una importación activa desde la ruta Next.js actual, pero el archivo queda publicable como recurso estático y puede volver a usarse por error.
- **Corrección sugerida:** eliminar el duplicado si está retirado o alinearlo con el cliente vigente y mensajes sanitizados antes de volver a exponerlo.

## Fortalezas observadas

1. El gestor de incidencias implementa estados de carga, éxito, vacío y error, con reintentos explícitos para listado y resumen.
2. Los formularios asíncronos principales usan `finally` para restablecer sus indicadores de carga.
3. `scripts/analyze.py` y `scripts/seed_incidents.py` retornan `1` en los fallos críticos que ya capturan y usan `SystemExit(main())`.
4. `scripts/seed_incidents.py` distingue errores descartables por fila de errores críticos del proceso completo.
5. El flujo de recuperación de contraseña no enumera cuentas y sanitiza el fallo de Resend antes de responder.
6. No se encontraron logs que impriman contraseñas, JWT, tokens de restablecimiento ni `RESEND_API_KEY`.

## Orden recomendado de corrección

1. Definir el contrato común de error público y evitar que `detail` o `Error.message` crucen directamente a la UI.
2. Corregir el endpoint CSV para separar errores de entrada de fallos internos.
3. Hacer excluyente y recuperable el error de carga del perfil.
4. Añadir reintentos a las cargas de Talent Pipeline y normalizar su cliente externo.
5. Proteger parseos JSON y operaciones de lectura/escritura.
6. Acotar el manejo del proveedor de correo y retirar o actualizar los clientes estáticos heredados.

## Criterios de aceptación para la futura implementación

- Ninguna pantalla muestra códigos HTTP, `SyntaxError`, `Failed to fetch`, tracebacks ni texto arbitrario de servicios externos.
- Toda carga de datos muestra estados visibles de carga, éxito, vacío cuando corresponda y error recuperable.
- Cada error visible ofrece reintento, navegación segura o una instrucción de soporte.
- Los errores inesperados del backend responden JSON estructurado y no incluyen `str(exception)`.
- Los errores de cliente se registran sin secretos y se traducen a mensajes de dominio antes de llegar a componentes.
- Las operaciones CLI de I/O escriben diagnósticos sanitizados en `stderr` y finalizan con código distinto de cero.
- Los bloques `try/catch` y `try/except` rodean la operación peligrosa concreta.
- Se mantienen sin regresiones autenticación, proveedores, analizador y gestor de incidencias, Talent Pipeline y registro público.

## Validación requerida después de implementar

- Pruebas unitarias del parser de errores para respuestas JSON, no JSON, vacías, `4xx`, `5xx` y fallos de red.
- Pruebas de componentes para carga, éxito, vacío, error y reintento en perfil y Talent Pipeline.
- Pruebas API que confirmen el esquema sanitizado de errores y que los detalles internos no aparecen en la respuesta.
- Pruebas CLI con archivo inexistente, permisos denegados, CSV inválido y fallo de escritura, comprobando `stderr` y código de salida.
- `npm run lint` y `npm run build` en `uis/backoffice` y `uis/website`.
- Suite de pruebas de `services/api` y ejecución controlada de los scripts afectados.

## Estado de la entrega

- [x] Repositorio auditado sin modificar código de aplicación.
- [x] Hallazgos clasificados y priorizados.
- [x] Correcciones sugeridas sin implementación.
- [x] Ausencia de filtraciones sensibles confirmadas documentada.
- [ ] Cambios de código pendientes de revisión y aprobación del desarrollador.
