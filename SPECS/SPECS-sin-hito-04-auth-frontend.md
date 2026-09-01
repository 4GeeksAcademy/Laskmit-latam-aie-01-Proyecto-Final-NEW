# SPECS - Sin Hito 04 (Auth Frontend)

## Identificacion

- **Funcionalidad:** AUTH-02 - Flujos de autenticacion y vistas protegidas en frontend.
- **Aplicacion objetivo:** `uis/backoffice`.
- **Aplicacion excluida:** `uis/website`, que debe permanecer completamente publica.
- **Backend existente:** FastAPI en `services/api`.
- **Stack vigente:** Next.js 16 App Router, React 19, TypeScript 5 y Tailwind CSS 4.

## Objetivo

Integrar registro, inicio de sesion, consulta y edicion de perfil, cierre de sesion y proteccion de las vistas internas de Nexova usando el JWT emitido por la API existente. La solucion debe reutilizar las aplicaciones actuales, centralizar el ciclo de vida del token y evitar duplicar llamadas o reglas de autenticacion entre modulos.

## Alcance funcional

### Incluido

1. Vista publica de inicio de sesion en `/login`.
2. Vista publica de registro en `/register`.
3. Vista protegida de perfil en `/account/profile`.
4. Proteccion en cliente de todas las vistas actuales de `uis/backoffice`.
5. Navegacion autenticada con acceso al perfil y accion de cierre de sesion.
6. Cliente HTTP compartido para la API Nexova con inyeccion del token y manejo uniforme de errores.
7. Incorporacion del token en todas las llamadas protegidas de proveedores e incidencias.
8. Limpieza de sesion y redireccion a `/login` ante cualquier respuesta `401` de la API Nexova.

### Fuera de alcance

- Modificar el esquema JWT o los endpoints de `services/api`.
- Crear una aplicacion de autenticacion independiente.
- Proteger `uis/website` o agregarle comprobaciones de sesion.
- Guardar el token en cookies, implementar sesiones de servidor o usar middleware de Next.js para leer `localStorage`.
- Agregar autenticacion al servicio externo de Talent Pipeline si ese servicio no acepta el JWT de Nexova. La vista del modulo si queda protegida por la sesion del backoffice.
- Implementar recuperacion de contrasena, verificacion de email, renovacion de token o administracion de roles.

## Contrato de la API existente

La implementacion frontend debe consumir estos contratos sin modificarlos.

### `POST /auth/login` - Publico

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Respuesta exitosa `200`:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Credenciales invalidas o usuario inactivo: `401` con un campo `detail`.

### `POST /users` - Publico

Request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nombre opcional",
  "phone": "+34123456789",
  "address": "Direccion opcional"
}
```

- `email` y `password` son obligatorios.
- La contrasena debe tener al menos 8 caracteres.
- `name`, `phone` y `address` son opcionales.
- El frontend no debe enviar `role`.
- Registro correcto: `201`.
- Email duplicado o datos invalidos: `422`.

Despues del `201`, el frontend debe llamar a `POST /auth/login` con las mismas credenciales. Solo se considera completado el registro cuando tambien se obtiene y almacena el token.

### `GET /auth/me` - Protegido

Header requerido:

```text
Authorization: Bearer <jwt>
```

Respuesta exitosa `200`:

```json
{
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "id": 1,
    "user_id": 1,
    "name": "Nombre opcional",
    "phone": "+34123456789",
    "address": "Direccion opcional"
  }
}
```

`profile` puede ser `null`. Los roles validos son `admin`, `manager` y `user`.

### `PUT /profiles/me` - Protegido

Request parcial o completo:

```json
{
  "name": "Nombre actualizado",
  "phone": "+34987654321",
  "address": "Direccion actualizada"
}
```

La API realiza alta o actualizacion del perfil y devuelve el perfil persistido. El email y el rol no se editan desde esta vista.

## Variables de entorno

Usar una unica variable para la API Nexova:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- Eliminar la resolucion de URL repetida en cada modulo y centralizarla en el cliente HTTP.
- Quitar la barra final antes de construir rutas.
- Se permite conservar la deteccion de URL de Codespaces como fallback centralizado.
- `NEXT_PUBLIC_API_URL` continua reservado para el servicio externo de Talent Pipeline y no debe mezclarse con `NEXT_PUBLIC_API_BASE_URL`.
- No incluir secretos ni el JWT en variables de entorno.

## Arquitectura frontend requerida

### Estructura objetivo

La ubicacion exacta puede adaptarse a las convenciones existentes, pero las responsabilidades deben quedar separadas de forma equivalente:

```text
uis/backoffice/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── account/
│   │   └── profile/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   └── auth/
│       ├── auth-guard.tsx
│       └── auth-navigation.tsx
└── lib/
    ├── api-client.ts
    ├── auth.ts
    └── auth-types.ts
```

No se debe copiar logica de autenticacion en las paginas. Las paginas consumen el cliente y las utilidades compartidas del backoffice.

### Cliente HTTP de la API Nexova

Debe existir una unica funcion generica para las solicitudes a FastAPI que:

1. Construya la URL desde `NEXT_PUBLIC_API_BASE_URL`.
2. Acepte JSON, `FormData` y respuestas de descarga sin imponer `Content-Type` incorrecto.
3. Lea el JWT desde `localStorage` solo en el navegador cuando la solicitud sea protegida.
4. Agregue `Authorization: Bearer <token>` a toda solicitud protegida.
5. No agregue el header a `POST /auth/login`, `POST /users` ni `GET /api/incidents/health`.
6. Convierta los errores FastAPI con `detail` de tipo texto o lista en un error tipado y legible.
7. Ante `401` en una llamada protegida, elimine el token y redirija a `/login`.
8. No convierta un `403` en cierre de sesion; debe mostrar un mensaje de permisos insuficientes.
9. No registre el JWT, la contrasena ni el header `Authorization` en consola.

Las llamadas existentes de Suppliers e Incidents Analyzer deben migrarse a este cliente. Para exportar incidencias no se puede usar una navegacion directa con `window.open`, porque no permite agregar `Authorization`; se debe solicitar el archivo con `fetch`, convertirlo a `Blob` y disparar su descarga mediante una URL temporal.

El cliente existente de Talent Pipeline apunta a un servicio externo. Debe conservar su URL y contrato actuales salvo que ese backend documente soporte para el JWT de Nexova.

### Gestion del token

- Definir una sola constante para la clave de `localStorage`, por ejemplo `nexova_access_token`.
- Guardar exclusivamente `access_token`; `token_type` no necesita persistirse.
- Guardar el token solo despues de una respuesta de login valida.
- Eliminar cualquier token previo cuando el login falle con `401`.
- Eliminar el token al cerrar sesion o cuando una solicitud protegida responda `401`.
- No interpretar la mera existencia del token como sesion valida: comprobarlo con `GET /auth/me` al entrar en una vista protegida.
- No almacenar contrasenas, perfil ni datos sensibles adicionales en `localStorage`.
- No decodificar el JWT para tomar decisiones de autorizacion. La API es la fuente de verdad.

## Proteccion de rutas

La proteccion debe ejecutarse en un componente cliente porque `localStorage` no esta disponible durante el renderizado de servidor.

### Rutas publicas de `uis/backoffice`

| Ruta | Comportamiento |
|---|---|
| `/login` | Accesible sin token. Con sesion valida, redirige a `/`. |
| `/register` | Accesible sin token. Con sesion valida, redirige a `/`. |

### Rutas protegidas de `uis/backoffice`

| Ruta | Alcance |
|---|---|
| `/` | Dashboard interno |
| `/suppliers` | Directorio y operaciones de proveedores |
| `/talent-pipeline-tracker` | Listado de candidatos |
| `/talent-pipeline-tracker/candidates/[id]` | Detalle de candidato |
| `/incidents-analyzer` | Analisis y exportacion de incidencias |
| `/account/profile` | Consulta y edicion de cuenta |

Toda ruta nueva del backoffice debe ser protegida por defecto y declararse publica de forma explicita si corresponde.

### Estados de la guarda

1. **Comprobando:** mientras se accede a `localStorage` y se valida `GET /auth/me`, mostrar un estado de carga accesible. No renderizar contenido protegido para evitar parpadeos o exposicion transitoria.
2. **No autenticado:** si no hay token, redirigir con `router.replace("/login")`.
3. **Token invalido o vencido:** el `401` elimina el token y redirige a `/login`.
4. **Autenticado:** renderizar la vista y la navegacion privada.
5. **Fallo no relacionado con autenticacion:** no borrar el token. Mostrar un estado recuperable con opcion de reintento.

No usar `middleware.ts` para esta comprobacion mientras el token viva unicamente en `localStorage`.

## Requisitos de las vistas

### `/login`

- Campos: email y contrasena.
- Usar controles asociados a `label`, tipos `email` y `password`, y atributos de autocompletado apropiados.
- Validar campos obligatorios antes de enviar.
- Deshabilitar envios repetidos y mostrar estado de carga.
- En exito: guardar el token y redirigir con `router.replace("/")`.
- En `401`: mostrar un mensaje claro de credenciales invalidas sin revelar si el email existe.
- Ofrecer enlace a `/register`.
- El mensaje de error debe exponerse con `aria-live`.

### `/register`

- Campos obligatorios: email, contrasena y confirmacion de contrasena.
- Campos opcionales: nombre, telefono y direccion.
- Validar formato de email, minimo de 8 caracteres y coincidencia de contrasenas.
- No enviar `confirmPassword` ni campos opcionales vacios a la API.
- Mapear errores `422` de FastAPI a los campos usando `detail[].loc` cuando este disponible; usar un error general cuando `detail` sea texto.
- Tras crear el usuario, iniciar sesion automaticamente con las mismas credenciales.
- Si el registro se completa pero el login automatico falla, no guardar token y mostrar una accion para ir a `/login` sin volver a registrar al usuario.
- Ofrecer enlace a `/login`.

### `/account/profile`

- Cargar los datos con `GET /auth/me`.
- Mostrar email y rol como datos de solo lectura.
- Permitir editar `name`, `phone` y `address`.
- Si `profile` es `null`, inicializar los campos vacios; `PUT /profiles/me` creara el perfil.
- Enviar exclusivamente los campos editables.
- Mostrar estados de carga, guardado, error y confirmacion de actualizacion.
- Reemplazar el formulario con los datos confirmados por la respuesta de la API despues de guardar.

### Navegacion y logout

- La navegacion privada no debe mostrarse en `/login` ni `/register`.
- Debe incluir acceso visible a `/account/profile` y una accion de cierre de sesion.
- Logout elimina el token y usa `router.replace("/login")`.
- El historial no debe devolver al usuario a una vista autenticada utilizable; la guarda debe redirigir de nuevo si intenta volver.

## Integracion de modulos existentes

### Suppliers

Todas las operaciones bajo `/suppliers` deben usar el cliente autenticado, incluyendo listado, alta, actualizacion de tarifa, cambio de estado y eliminacion. Los filtros no deben perderse por la migracion.

### Incidents Analyzer

- `POST /api/incidents/analyze` debe incluir el token sin establecer manualmente `Content-Type`, para que el navegador genere el boundary de `FormData`.
- `GET /api/incidents/results/export` debe incluir el token y descargar la respuesta como archivo.
- `GET /api/incidents/health` permanece publico.
- La URL base no debe depender de un campo editable por el usuario; debe provenir de la configuracion central.

### Talent Pipeline Tracker

La pagina y su detalle requieren sesion valida en el backoffice. Sus solicitudes al API externo conservan el contrato actual y no deben recibir automaticamente el JWT de Nexova para evitar filtrar credenciales a otro origen.

## Seguridad y privacidad

- El requisito de `localStorage` implica exposicion ante XSS; por ello no se debe renderizar HTML no confiable ni usar `dangerouslySetInnerHTML` con datos externos.
- Todas las URLs desplegadas deben usar HTTPS.
- El frontend no sustituye las autorizaciones del backend. Ocultar una vista o accion no concede ni revoca permisos.
- No mostrar detalles internos de excepciones ni trazas de la API.
- No enviar el token a dominios distintos de la API Nexova configurada.
- Limpiar las URL temporales creadas para descargas mediante `URL.revokeObjectURL`.

## Experiencia de usuario y accesibilidad

- Mantener el lenguaje visual existente de Nexova y sus fuentes actuales.
- Los formularios deben funcionar con teclado y conservar un orden de foco logico.
- Los errores de campo deben estar asociados mediante `aria-describedby`.
- El foco debe desplazarse al resumen de error o al primer campo invalido despues de un envio fallido.
- Los estados de carga no deben provocar cambios de layout abruptos.
- El diseno debe funcionar en movil y escritorio sin desbordes ni superposiciones.

## Tipos TypeScript minimos

Definir y reutilizar tipos equivalentes a:

```ts
type UserRole = "admin" | "manager" | "user";

interface AuthToken {
  access_token: string;
  token_type: "bearer";
}

interface UserProfile {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

interface CurrentUser {
  email: string;
  role: UserRole;
  profile: UserProfile | null;
}
```

No usar `any` para respuestas de autenticacion, perfil ni errores de FastAPI.

## Estrategia de pruebas

### Pruebas automatizadas minimas

Si el repositorio incorpora un runner de pruebas frontend, cubrir como minimo:

1. Persistencia y eliminacion del token.
2. Inyeccion del header `Authorization` solo para la API Nexova protegida.
3. Limpieza de sesion ante `401`, pero no ante `403` o `500`.
4. Redireccion de la guarda sin token y renderizado con token validado.
5. Secuencia registro -> login -> redireccion.
6. Mapeo de errores `422` a campos del registro.

No se debe agregar una libreria de pruebas unicamente para cumplir este apartado si el proyecto aun no tiene runner; en ese caso, ejecutar la matriz manual completa y documentar la evidencia.

### Matriz manual de extremo a extremo

Con FastAPI y `uis/backoffice` ejecutandose:

| Caso | Resultado esperado |
|---|---|
| Abrir una ruta protegida sin token | Redireccion a `/login`, sin contenido privado visible |
| Registrar un usuario valido con perfil | `POST /users` y login automatico correctos; token almacenado |
| Registrar un email existente | Error comprensible; no se guarda token |
| Iniciar sesion con credenciales validas | Token almacenado y redireccion a `/` |
| Iniciar sesion con credenciales invalidas | Mensaje generico; token ausente |
| Recargar una ruta protegida con token valido | La sesion se valida y la vista permanece accesible |
| Usar un token alterado o vencido | Token eliminado y redireccion a `/login` |
| Consultar perfil | Email, rol y datos del perfil coinciden con `GET /auth/me` |
| Editar perfil | `PUT /profiles/me` persiste y la UI refleja la respuesta |
| Operar proveedores | Cada solicitud protegida incluye Bearer token |
| Analizar y exportar incidencias | Ambas solicitudes incluyen Bearer token; descarga correcta |
| Recibir `403` | Se informa falta de permisos sin cerrar sesion |
| Cerrar sesion | Token eliminado y redireccion a `/login` |
| Abrir `uis/website` sin token | Funciona igual que antes, sin redirecciones ni acceso a `localStorage` |

## Criterios de aceptacion

- [ ] `/login` autentica contra `POST /auth/login`, almacena `access_token` y redirige al dashboard.
- [ ] `/register` crea el usuario mediante `POST /users`, inicia sesion y redirige al dashboard.
- [ ] Los errores de login y registro son claros, accesibles y no exponen informacion sensible.
- [ ] `/account/profile` obtiene email, rol y perfil desde `GET /auth/me`.
- [ ] `/account/profile` actualiza nombre, telefono y direccion mediante `PUT /profiles/me`.
- [ ] Todas las rutas internas enumeradas redirigen a `/login` cuando no existe una sesion valida.
- [ ] No se muestra contenido protegido durante la validacion inicial.
- [ ] Todas las llamadas protegidas a la API Nexova incluyen `Authorization: Bearer <token>`.
- [ ] Cualquier `401` protegido elimina la sesion y redirige a `/login`.
- [ ] Un `403` muestra un error de permisos y conserva la sesion.
- [ ] Logout elimina el token y redirige correctamente.
- [ ] La exportacion de incidencias funciona mediante una solicitud autenticada y descarga `Blob`.
- [ ] El JWT nunca se envia al API externo de Talent Pipeline.
- [ ] `uis/website` conserva su comportamiento publico y no contiene guardas de autenticacion.
- [ ] La URL de la API Nexova y el manejo de errores no estan duplicados entre modulos.
- [ ] `npm run lint` y `npm run build` finalizan sin errores en `uis/backoffice`.
- [ ] `npm run lint` y `npm run build` finalizan sin errores en `uis/website`, como control de no regresion.
- [ ] La matriz manual de extremo a extremo queda documentada con resultados observados.

## Restricciones de implementacion

- Mantener Next.js 16, React 19, TypeScript 5 y Tailwind CSS 4; no migrar de framework ni agregar un proveedor de autenticacion externo.
- No usar middleware para leer `localStorage`.
- No crear APIs fuera de `services/` ni modificar el backend salvo que una discrepancia demostrable del contrato bloquee el flujo.
- Reutilizar la logica existente mediante importaciones; no copiar clientes HTTP o utilidades por pagina.
- No modificar `memory-bank/`, `.agents/`, `docs/` o `README.md` sin autorizacion explicita.
- Antes de completar la implementacion, solicitar autorizacion para actualizar `memory-bank/progress.md`, ya que el flujo del repositorio lo exige y esa ruta esta protegida.

## Evidencia requerida para el Pull Request

La descripcion del PR contra `main` debe incluir:

1. Lista de vistas protegidas: `/`, `/suppliers`, `/talent-pipeline-tracker`, `/talent-pipeline-tracker/candidates/[id]`, `/incidents-analyzer` y `/account/profile`.
2. Confirmacion explicita de que `uis/website` permanece publico y no fue afectado.
3. Resumen del flujo registro -> login -> perfil -> logout.
4. Evidencia de `401` sin token y con token invalido.
5. Evidencia de las validaciones `lint` y `build` de ambas aplicaciones Next.js.
6. Capturas o registro de la matriz manual para login, registro, perfil, proveedores e incidencias.