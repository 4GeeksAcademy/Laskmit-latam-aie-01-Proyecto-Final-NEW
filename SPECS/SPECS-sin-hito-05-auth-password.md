# SPECS - Sin Hito 05 (Auth Password)

## Identificacion

- **Funcionalidad:** AUTH-03 - Recuperacion y cambio de contrasena.
- **Aplicacion frontend objetivo:** `uis/backoffice`.
- **Backend objetivo:** FastAPI en `services/api`.
- **Servicio de correo seleccionado:** Resend.
- **Persistencia vigente:** TinyDB.
- **Stack vigente:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, FastAPI y Python 3.11 o superior.
- **Dependencia funcional:** AUTH-02 debe continuar operando sin regresiones.

## Objetivo

Agregar dos modalidades seguras para actualizar la contrasena de un usuario:

1. Recuperacion sin sesion cuando el usuario olvido su contrasena, mediante un enlace enviado por email y un token de un solo uso con expiracion corta.
2. Cambio voluntario desde una sesion autenticada, verificando primero la contrasena actual.

La solucion debe extender la autenticacion existente sin reemplazar ni alterar el comportamiento observable de registro, login, consulta y edicion de perfil, logout, proteccion de rutas, proveedores, analisis de incidencias, Talent Pipeline Tracker ni la web publica.

## Alcance funcional

### Incluido

1. `POST /auth/forgot-password`, siempre con respuesta publica no enumerable.
2. `POST /auth/reset-password`, con validacion de expiracion y uso unico del token.
3. `POST /auth/change-password`, protegido mediante el Bearer token existente.
4. Envio del enlace de recuperacion mediante Resend.
5. Persistencia en TinyDB del hash y estado de cada token de restablecimiento.
6. Vista publica `/forgot-password`.
7. Vista publica `/reset-password`.
8. Vista protegida `/account/change-password`.
9. Enlace visible desde `/login` hacia `/forgot-password`.
10. Acceso al cambio de contrasena desde la navegacion autenticada o desde la vista de perfil.
11. Pruebas de los nuevos flujos y controles de no regresion de AUTH-02.

### Fuera de alcance

- Cambiar el formato, duracion o mecanismo de los JWT de sesion existentes.
- Revocar automaticamente sesiones ya emitidas despues de cambiar o restablecer la contrasena.
- Modificar roles, permisos, registro de usuarios o datos de perfil.
- Agregar verificacion de email, autenticacion multifactor, inicio de sesion social o renovacion de tokens.
- Permitir que un administrador cambie la contrasena de otro usuario.
- Agregar los opcionales de rate limiting o auditoria en esta entrega.
- Modificar `uis/website`, que debe permanecer completamente publica.
- Enviar el JWT de Nexova al servicio externo de Talent Pipeline.

## Compatibilidad obligatoria y no regresion

AUTH-03 es una ampliacion aditiva. Se deben reutilizar `services/api/auth`, el router `/auth`, la dependencia `get_current_user`, el hash bcrypt existente y el cliente `uis/backoffice/lib/api-client.ts` desde sus ubicaciones actuales.

Deben conservarse sin cambios de contrato ni de comportamiento:

- `POST /auth/login` y el formato `{ access_token, token_type }`.
- `GET /auth/me`.
- `POST /users` y el login automatico posterior al registro.
- `PUT /profiles/me` y las operaciones administrativas de usuarios existentes.
- La clave `nexova_access_token` y el ciclo de vida actual del JWT en `localStorage`.
- El cierre de sesion y la limpieza del token ante respuestas protegidas `401`.
- La distincion actual entre `401`, `403` y otros errores del cliente HTTP.
- Todas las rutas y operaciones de Suppliers e Incidents Analyzer.
- Las vistas y el cliente externo de Talent Pipeline Tracker.
- La accesibilidad publica y el comportamiento de `uis/website`.

No se debe copiar logica de autenticacion, hashing, acceso a TinyDB ni construccion de URLs en paginas o modulos paralelos.

## Contratos nuevos de API

### `POST /auth/forgot-password` - Publico

Request:

```json
{
  "email": "user@example.com"
}
```

Respuesta `200` para una direccion registrada, no registrada o inactiva:

```json
{
  "message": "Si esa direccion esta registrada, recibiras un enlace en breve."
}
```

Reglas:

1. Validar el formato del email mediante Pydantic.
2. Buscar el email de forma normalizada y coherente con el registro existente.
3. Si existe un usuario activo, generar un token criptograficamente aleatorio, persistir unicamente su hash y enviar el token original dentro del enlace de Resend.
4. Si el usuario no existe o esta inactivo, no generar un token ni enviar un correo.
5. Devolver el mismo codigo, cuerpo y mensaje en todos esos casos.
6. No registrar el token original, la API key, contrasenas ni datos completos del proveedor de correo.
7. Deshabilitar solicitudes repetidas en el frontend mientras una peticion este en curso y despues de obtener confirmacion.

Una falla de entrega de Resend debe registrarse de forma segura para operacion, sin convertir la respuesta en una senal que permita distinguir si el email existe. La API mantiene la respuesta generica `200`; la verificacion de entrega se realiza mediante pruebas controladas y logs sin secretos.

### `POST /auth/reset-password` - Publico

Request:

```json
{
  "token": "<reset-token>",
  "new_password": "new-password-123"
}
```

Respuesta exitosa `200`:

```json
{
  "message": "Contrasena actualizada correctamente."
}
```

Token invalido, vencido, utilizado o asociado a un usuario inexistente/inactivo: `400` con un mensaje generico equivalente a:

```json
{
  "detail": "El enlace de restablecimiento no es valido o ha expirado."
}
```

Reglas:

1. Exigir una contrasena de al menos 8 caracteres, manteniendo la politica actual de registro.
2. Hashear el token recibido con el mismo algoritmo usado al persistirlo y buscar por ese hash; nunca buscar ni guardar el token en texto plano.
3. Verificar que el registro exista, no este usado y tenga `expires_at` posterior al instante actual en UTC.
4. Hashear la nueva contrasena con el helper bcrypt existente y actualizar `hashed_password` del usuario.
5. Marcar el token como usado solo como parte del restablecimiento exitoso.
6. Invalidar tambien los demas tokens de restablecimiento pendientes del mismo usuario despues del exito.
7. No iniciar sesion automaticamente ni emitir un JWT de acceso.
8. No revelar por el error si fallo la firma/hash, la expiracion, el estado de uso o la cuenta asociada.

### `POST /auth/change-password` - Protegido

Header requerido:

```text
Authorization: Bearer <jwt>
```

Request:

```json
{
  "current_password": "current-password-123",
  "new_password": "new-password-456"
}
```

Respuesta exitosa `200`:

```json
{
  "message": "Contrasena actualizada correctamente."
}
```

Reglas:

1. Identificar al usuario exclusivamente mediante `get_current_user`; no aceptar email ni `user_id` en el payload.
2. Exigir una nueva contrasena de al menos 8 caracteres.
3. Verificar `current_password` contra `hashed_password` usando el helper bcrypt existente.
4. Responder `400` si la contrasena actual es incorrecta.
5. Responder `400` si la nueva contrasena coincide con la actual.
6. Hashear y persistir la nueva contrasena; nunca guardar texto plano.
7. Conservar la sesion actual y no emitir un JWT nuevo.
8. Aplicar el manejo existente de `401` cuando el Bearer token falte, sea invalido, este vencido o pertenezca a un usuario inactivo.

## Modelos de datos y persistencia

### Modelos de request y response

Agregar modelos Pydantic equivalentes a:

```python
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)

class PasswordActionResponse(BaseModel):
    message: str
```

Los nombres definitivos pueden seguir la convencion local, pero los campos y validaciones publicas deben respetar el contrato.

### Tabla de tokens de restablecimiento

Crear una tabla TinyDB dedicada, por ejemplo `password_reset_tokens`, con registros equivalentes a:

```json
{
  "user_id": 1,
  "token_hash": "<sha256-hex>",
  "created_at": "2026-09-01T12:00:00+00:00",
  "expires_at": "2026-09-01T12:30:00+00:00",
  "used_at": null
}
```

Requisitos:

- Generar al menos 32 bytes aleatorios mediante `secrets` y codificarlos de forma segura para URL.
- Usar SHA-256 para persistir una representacion irreversible del token aleatorio.
- Trabajar con fechas conscientes de zona horaria y UTC.
- Duracion configurable entre 15 y 60 minutos; valor por defecto recomendado: 30 minutos.
- El token original solo puede existir temporalmente para construir el enlace del correo.
- La verificacion y actualizacion del usuario deben vivir en los servicios de autenticacion existentes.
- Tras un reset exitoso no debe quedar ningun token pendiente reutilizable para ese usuario.
- Los registros vencidos o usados pueden conservarse durante el ejercicio, pero nunca deben aceptarse; su limpieza programada queda fuera de alcance.

## Integracion con Resend

Resend se mantiene como proveedor seleccionado porque ya existe la cuenta y la variable `RESEND_API_KEY`. No se recomienda cambiar a SendGrid para este alcance: hacerlo agregaria configuracion y validacion de otro proveedor sin aportar una ventaja funcional al requisito.

El cliente de correo debe residir dentro de `services/api` y exponer una responsabilidad acotada para enviar el mensaje de restablecimiento. El router no debe conocer detalles del SDK ni realizar llamadas HTTP directas al proveedor.

El email debe incluir:

- Motivo del mensaje.
- Enlace absoluto `${PASSWORD_RESET_FRONTEND_URL}/reset-password?token=<token-codificado>`.
- Tiempo de validez del enlace.
- Aviso para ignorar el mensaje si el usuario no solicito el cambio.
- Version legible en movil; puede ser texto plano en el alcance obligatorio.

No incluir en el email la contrasena actual, la nueva contrasena ni informacion sensible de la cuenta.

## Variables de entorno

Backend:

```env
SECRET_KEY=<existing-session-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=<resend-api-key>
RESEND_FROM_EMAIL=onboarding@resend.dev
PASSWORD_RESET_FRONTEND_URL=http://localhost:3000
PASSWORD_RESET_EXPIRE_MINUTES=30
```

Frontend, sin cambios respecto de AUTH-02:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Reglas:

- `RESEND_API_KEY` es el nombre obligatorio de la clave ya configurada y nunca debe exponerse con prefijo `NEXT_PUBLIC_`.
- `RESEND_FROM_EMAIL` debe contener un remitente permitido por Resend. El remitente de onboarding se admite en desarrollo dentro de las restricciones vigentes del proveedor; produccion debe usar un dominio verificado.
- `PASSWORD_RESET_FRONTEND_URL` debe ser un origen confiable configurado por el servidor, sin barra final. No construir el enlace desde headers aportados por el cliente.
- `PASSWORD_RESET_EXPIRE_MINUTES` debe validarse al iniciar o al usar la configuracion y permanecer dentro del rango de 15 a 60 minutos.
- No agregar valores secretos reales a archivos versionados.
- Actualizar ambos gestores de dependencias del backend (`pyproject.toml` y `requirements.txt`) de forma coherente si se incorpora el SDK oficial de Resend.

## Arquitectura backend requerida

La ubicacion exacta puede adaptarse a las convenciones actuales, manteniendo responsabilidades equivalentes:

```text
services/api/
├── auth/
│   ├── models.py
│   └── services.py
├── routes/
│   └── auth.py
└── email/
    ├── __init__.py
    └── resend_client.py
```

Responsabilidades:

1. `auth/models.py`: payloads y respuestas tipadas.
2. `auth/services.py`: generacion, hash, persistencia, validacion e invalidacion de tokens; verificacion y actualizacion de contrasenas.
3. `routes/auth.py`: contratos HTTP, dependencias y traduccion uniforme de errores.
4. Cliente Resend: construccion y envio del mensaje usando exclusivamente configuracion de entorno.

No crear una API fuera de `services/`, no duplicar `_hash_password` o `_verify_password` y no mover los endpoints existentes.

## Arquitectura frontend requerida

Extender la estructura vigente de `uis/backoffice`:

```text
uis/backoffice/
├── app/
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   └── account/
│       └── change-password/
│           └── page.tsx
├── components/
│   └── auth/
│       └── auth-guard.tsx
└── lib/
    ├── api-client.ts
    └── auth-types.ts
```

Las paginas deben consumir `apiRequest`; no deben duplicar deteccion de URL, parseo de errores, headers ni acceso al JWT.

### Clasificacion de rutas en la guarda

Agregar a la lista publica existente:

- `/forgot-password`
- `/reset-password`

Mantener `/login` y `/register` como publicas. `/account/change-password` queda protegida por defecto.

Comportamiento con una sesion valida:

- `/forgot-password` y `/reset-password` deben poder renderizarse aunque exista un JWT en `localStorage`; no redirigir automaticamente al dashboard desde esas dos rutas.
- `/login` y `/register` conservan la redireccion actual al dashboard cuando la sesion es valida.
- La navegacion privada no se muestra en las vistas publicas de recuperacion.

Esta distincion evita que un usuario con una sesion abierta en otro contexto quede bloqueado al usar un enlace de restablecimiento.

## Requisitos de las vistas

### `/forgot-password`

- Campo email con `label`, `type="email"`, `autoComplete="email"` y validacion de obligatorio/formato.
- Llamar a `POST /auth/forgot-password` con `authenticated: false`.
- Mostrar siempre el mensaje generico de confirmacion despues de una respuesta `200`.
- No indicar si la cuenta existe ni si se envio un correo.
- Deshabilitar el formulario durante el envio y mantenerlo deshabilitado tras el exito para impedir duplicados accidentales.
- Ante un error de red, permitir reintentar con un mensaje que tampoco revele existencia de cuenta.
- Incluir enlace de regreso a `/login`.

### `/reset-password`

- Leer `token` desde el query string mediante las APIs de Next.js App Router.
- No guardar el token en `localStorage`, cookies, estado global ni logs.
- Campos nueva contrasena y confirmacion, ambos con `autoComplete="new-password"`.
- Validar minimo de 8 caracteres y coincidencia antes de llamar a la API.
- Llamar a `POST /auth/reset-password` con `authenticated: false`.
- Si falta el token, no enviar el formulario; mostrar enlace a `/forgot-password`.
- En exito, redirigir con `router.replace("/login?passwordReset=success")`.
- `/login` debe mostrar una confirmacion accesible cuando reciba ese indicador, sin incluir el token en la nueva URL.
- Para cualquier `400` por token invalido, usado o vencido, mostrar un error claro y un enlace visible a `/forgot-password`.
- Evitar envios repetidos mientras la solicitud esta en curso.

### `/account/change-password`

- Ruta protegida por la guarda actual.
- Campos contrasena actual, nueva contrasena y confirmacion.
- Usar `autoComplete="current-password"` para la actual y `autoComplete="new-password"` para las nuevas.
- Validar campos obligatorios, minimo de 8 caracteres, coincidencia de confirmacion y diferencia entre contrasena actual y nueva.
- Llamar a `POST /auth/change-password` mediante el cliente autenticado existente.
- Mostrar feedback accesible de carga, error y exito.
- En exito, limpiar los tres campos sin cerrar la sesion.
- En `400`, mostrar un mensaje util sin exponer hashes ni detalles internos.
- En `401`, conservar el comportamiento actual del cliente: limpiar el JWT y redirigir a `/login`.

### `/login` y navegacion

- Agregar un enlace visible `¿Olvidaste tu contrasena?` hacia `/forgot-password` junto al campo o formulario de contrasena.
- Interpretar `passwordReset=success` unicamente como un mensaje visual; no debe modificar el token ni omitir la autenticacion.
- Agregar acceso visible a `/account/change-password` desde la navegacion autenticada o desde `/account/profile`.
- Mantener todos los enlaces, acciones y rutas existentes.

## Seguridad y privacidad

- El token de reset debe tener alta entropia, expiracion corta, persistencia hasheada y uso unico.
- La respuesta de solicitud debe impedir enumeracion de usuarios por codigo y contenido.
- No incluir el token de reset ni contrasenas en logs, analitica, mensajes de error o trazas de frontend.
- No reutilizar el JWT de sesion como token de restablecimiento.
- No incluir `user_id`, email o rol dentro del enlace cuando no sean necesarios.
- Comparar contrasenas exclusivamente mediante bcrypt y tokens por su hash.
- No devolver nunca `hashed_password` ni registros de tokens en respuestas API.
- Usar HTTPS en entornos desplegados.
- Codificar el token al construir la URL y tratar el query string como entrada no confiable.
- No usar `dangerouslySetInnerHTML` con contenido externo.
- La API sigue siendo la fuente de verdad para autenticacion y autorizacion.

## Experiencia de usuario y accesibilidad

- Mantener el lenguaje visual, componentes y estilos de los formularios AUTH-02.
- Asociar todos los controles con `label` y los errores de campo mediante `aria-describedby`.
- Exponer confirmaciones con `role="status"` o `aria-live="polite"` y errores con `role="alert"`.
- Llevar el foco al primer campo invalido o al resumen de error tras un fallo de validacion.
- Conservar valores no sensibles utiles tras errores; las contrasenas pueden limpiarse por seguridad.
- Mostrar estados de carga sin cambios abruptos de layout.
- Garantizar uso por teclado y ausencia de desbordes o superposiciones en movil y escritorio.
- El correo debe ser comprensible sin depender de imagenes, color o estilos HTML.

## Tipos TypeScript minimos

Definir y reutilizar tipos equivalentes a:

```ts
interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

interface PasswordActionResponse {
  message: string;
}
```

No usar `any` para payloads, respuestas ni errores de estos flujos.

## Estrategia de pruebas

### Pruebas automatizadas backend minimas

1. Solicitud con usuario registrado devuelve `200`, persiste solo el hash y solicita el envio a Resend.
2. Solicitud con usuario inexistente devuelve exactamente el mismo `200` y no llama a Resend.
3. Nunca se persiste ni registra el token original.
4. Token valido actualiza el hash de contrasena y queda inutilizable.
5. Segundo uso del mismo token devuelve `400`.
6. Token vencido, alterado o desconocido devuelve `400` generico.
7. Reset invalida los demas tokens pendientes del mismo usuario.
8. La contrasena nueva permite login y la anterior deja de permitirlo.
9. Cambio autenticado verifica la contrasena actual y conserva la sesion.
10. Cambio con contrasena actual incorrecta o nueva igual devuelve `400`.
11. Cambio sin JWT o con JWT invalido devuelve `401` mediante la dependencia existente.
12. Fallas simuladas de Resend no filtran la existencia de la cuenta en la respuesta publica.

Las pruebas no deben enviar correos reales: el cliente Resend se sustituye por un doble de prueba. Debe existir ademas una comprobacion manual controlada de entrega real.

### Pruebas frontend minimas

Si el repositorio incorpora un runner frontend, cubrir:

1. Las dos rutas de recuperacion se renderizan como publicas sin navegacion privada.
2. Una sesion valida no bloquea la apertura de `/reset-password`.
3. Confirmacion generica de `/forgot-password` y bloqueo de duplicados.
4. Lectura del token de URL y payload correcto de reset.
5. Validacion local de minimo y coincidencia de contrasenas.
6. Redireccion a login y mensaje de exito despues del reset.
7. Error de token con enlace de regreso a `/forgot-password`.
8. Envio autenticado y feedback de `/account/change-password`.
9. Enlace de recuperacion visible en login.

No agregar una libreria de pruebas unicamente para cumplir este apartado si el frontend aun no dispone de runner; en ese caso, ejecutar y documentar la matriz manual completa.

### Matriz manual de extremo a extremo

Con FastAPI, `uis/backoffice` y una cuenta Resend de desarrollo configurados:

| Caso | Resultado esperado |
|---|---|
| Solicitar reset con email registrado | `200`, mensaje generico y email real recibido con enlace correcto |
| Solicitar reset con email no registrado | Mismo `200` y mismo mensaje; ninguna diferencia visible |
| Enviar dos veces el formulario ya confirmado | La UI impide la segunda solicitud accidental |
| Abrir enlace valido | Formulario disponible y token leido de la URL |
| Restablecer con contrasenas distintas | No llama a la API y muestra error asociado |
| Restablecer con token valido | Actualiza contrasena y redirige a `/login` con confirmacion |
| Reutilizar el mismo enlace | `400`, error claro y enlace a `/forgot-password` |
| Usar token vencido o alterado | `400` con el mismo error generico |
| Login con contrasena anterior tras reset | `401` generico |
| Login con contrasena nueva tras reset | Login y redireccion existentes funcionan |
| Cambiar contrasena con sesion valida | Verifica la actual, actualiza y mantiene la sesion |
| Cambiar con contrasena actual incorrecta | `400`, no modifica la contrasena |
| Abrir cambio de contrasena sin sesion | Redireccion a `/login`, sin contenido protegido visible |
| Recibir `401` durante el cambio | Token de sesion eliminado y redireccion a `/login` |
| Registro, perfil y logout | Conservan el comportamiento de AUTH-02 |
| Suppliers e Incidents Analyzer | Todas sus operaciones existentes siguen funcionando autenticadas |
| Talent Pipeline Tracker | Sus vistas funcionan y no reciben el JWT Nexova en el API externo |
| Abrir `uis/website` | Continua publica y sin comprobaciones de sesion |

## Opcionales evaluables, no incluidos

### Plantilla HTML de email

Puede agregarse despues mediante una plantilla del lado servidor con version HTML y texto plano. Debe usar estilos inline compatibles con clientes de correo, boton/enlace visible, diseno responsivo y contenido escapado. No debe construirse con HTML aportado por el usuario.

### Rate limiting

Puede limitarse `POST /auth/forgot-password` por combinacion de IP y hash normalizado del email, por ejemplo cinco solicitudes por hora. Aun al superar el limite, la respuesta visible debe conservar el mensaje generico para no introducir enumeracion. En un despliegue distribuido se requiere un almacen compartido como Redis; una tabla TinyDB solo es adecuada para el entorno educativo de una unica instancia.

### Registro de auditoria

Puede crearse una tabla de eventos que registre tipo de evento, timestamp UTC, resultado general y direccion IP minimizada o hasheada segun la politica de privacidad. Nunca debe almacenar tokens, contrasenas, headers `Authorization` ni la API key. La retencion y acceso a esos datos deben definirse antes de habilitarlo.

## Criterios de aceptacion

- [ ] `POST /auth/forgot-password` devuelve siempre el mismo `200` y mensaje para cuentas registradas, inexistentes o inactivas.
- [ ] Una solicitud para una cuenta registrada y activa envia un email real mediante Resend.
- [ ] El enlace usa una URL frontend configurada por entorno y contiene un token aleatorio apto para URL.
- [ ] Solo el hash SHA-256 del token se persiste en TinyDB.
- [ ] El token expira dentro de la ventana configurable de 15 a 60 minutos.
- [ ] `POST /auth/reset-password` rechaza con `400` generico tokens invalidos, vencidos o usados.
- [ ] Un reset exitoso actualiza el hash bcrypt e invalida todos los tokens pendientes del usuario.
- [ ] Un token no puede utilizarse dos veces.
- [ ] La contrasena anterior deja de autenticar y la nueva permite usar el login existente.
- [ ] `POST /auth/change-password` exige Bearer token y obtiene el usuario desde la sesion.
- [ ] El cambio rechaza con `400` una contrasena actual incorrecta o una nueva igual a la actual.
- [ ] El cambio exitoso mantiene la sesion vigente y no emite otro JWT.
- [ ] `/forgot-password` muestra siempre la confirmacion generica y evita duplicados.
- [ ] `/reset-password` lee el token de la URL, valida la confirmacion y redirige a login tras el exito.
- [ ] Un token invalido en `/reset-password` produce un error claro y enlace a `/forgot-password`.
- [ ] `/account/change-password` esta protegida, valida sus tres campos y muestra feedback accesible.
- [ ] `/login` incluye un enlace visible a `/forgot-password` y muestra la confirmacion posterior al reset.
- [ ] La navegacion autenticada ofrece acceso al cambio de contrasena sin eliminar opciones existentes.
- [ ] `RESEND_API_KEY` nunca aparece con valor real en codigo, logs ni archivos versionados.
- [ ] Los contratos y flujos de AUTH-02 mantienen su comportamiento previo.
- [ ] Suppliers, Incidents Analyzer y Talent Pipeline Tracker superan pruebas de no regresion.
- [ ] `uis/website` permanece publica y sin cambios funcionales.
- [ ] Las pruebas backend del scope finalizan sin errores.
- [ ] `npm run lint` y `npm run build` finalizan sin errores en `uis/backoffice`.
- [ ] `npm run lint` y `npm run build` finalizan sin errores en `uis/website` como control de no regresion.
- [ ] La matriz manual queda documentada con resultados observados y sin exponer secretos.

## Restricciones de implementacion

- Mantener FastAPI, TinyDB, bcrypt, Next.js 16, React 19, TypeScript 5 y Tailwind CSS 4.
- Usar Resend como proveedor; cualquier cambio a SendGrid requiere una decision explicita posterior.
- No crear APIs fuera de `services/`.
- Reutilizar modulos existentes por importacion desde su origen; no copiar logica de negocio.
- No alterar contratos o comportamiento de funcionalidades ya implementadas.
- No modificar `memory-bank/`, `.agents/`, `docs/` o `README.md` sin autorizacion explicita.
- Antes de completar la futura implementacion, solicitar autorizacion para actualizar `memory-bank/progress.md`, ya que el flujo del repositorio lo exige y esa ruta esta protegida.

## Evidencia requerida para el Pull Request

La descripcion del PR contra `main` debe incluir:

1. Contratos y ejemplos observados de los tres endpoints nuevos.
2. Evidencia de respuesta indistinguible para emails registrados y no registrados.
3. Evidencia controlada de entrega real mediante Resend, ocultando destinatario, token y API key.
4. Pruebas de expiracion, alteracion y segundo uso del token.
5. Prueba de login con contrasena anterior y nueva despues del reset.
6. Prueba de cambio autenticado correcto e incorrecto.
7. Capturas de las tres vistas nuevas y del enlace agregado en login.
8. Resultado de pruebas backend, lint y build del backoffice.
9. Evidencia de no regresion de AUTH-02, modulos internos y `uis/website`.
10. Confirmacion explicita de que ningun secreto ni token fue incluido en codigo, logs, capturas o commits.
