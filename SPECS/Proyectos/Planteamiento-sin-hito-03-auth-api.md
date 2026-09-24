# AUTH-01 — Implementar autenticación y protección de rutas

En esta solución tenemos endpoints que sirven datos al frontend, consultan la base de datos y procesan registros — pero en este momento, cualquier persona que conozca una URL puede llamarlos.

La API actualmente no tiene capa de autenticación. Esta tarea incluye:
	Un módulo users con CRUD completo (crear, leer, actualizar, eliminar) solo para credenciales — email y contraseña.
	Un módulo profiles con enlace uno a uno a cada usuario — el nombre visible y los datos de contacto viven en Profile, no en User.
	Un endpoint de login que valide credenciales y devuelva un token JWT firmado.
	Una dependencia reutilizable get_current_user que decodifique el token e identifique al usuario.
	Aplicación de esa dependencia a todas las rutas que no deben ser de acceso público.

Almacena User y Profile solo en TinyDB — El JWT debe llevar el id del usuario en TinyDB; otros módulos lo referencian como user_uuid.

Usa OAuth2PasswordBearer de FastAPI y python-jose para la firma del token. Las contraseñas deben estar hasheadas — nunca almacenadas ni comparadas en texto plano. El token debe llevar como mínimo el ID del usuario y expirar tras una ventana configurable.

Todas las rutas relacionadas con autenticación deben vivir bajo /auth. Las rutas de gestión de usuarios bajo /users. Las rutas de perfil bajo /profiles.

Esto es una cuestión de seguridad, no una feature: el trabajo que hagas aquí protege todo lo que se construyó antes y todo lo que vendrá después. Hay que hacerlo bien.

Nota: Una vez que se protejan las rutas, puede que algunas llamadas del frontend dejen de funcionar temporalmente — es algo esperado. El frontend se actualizará para enviar el token en una fase posterior. Por ahora, el foco está en asegurar la API para evitar fuga de datos y accesos indebidos.  De todos modos, debemos identificar cuales han dejado de funcionar para tener en cuentra su modificación posterior.

Conocimiento complementario: cómo funciona la autenticación JWT en FastAPI
Para implementar auth con JWT, este es el modelo mental: cuando un usuario hace login, el servidor firma un pequeño payload JSON (los "claims") usando una clave secreta y devuelve el resultado como una cadena de token. En las solicitudes siguientes, el cliente envía ese token en la cabecera Authorization. El servidor lo decodifica — si la firma es válida y el token no ha expirado, la solicitud continúa; si no, recibe un 401.
En FastAPI, este flujo se implementa como una dependencia. Escribes una función que extrae el token de la solicitud, lo valida y devuelve el objeto usuario. Cualquier ruta que declare esa función como dependencia requerirá autenticación automáticamente.

Estaremos trabajando este proyecto en la rama auth-api que ya está creada.

Instala los paquetes necesarios con uv (nunca uses pip install ni pipenv):
uv add "python-jose[cryptography]" "libpass[bcrypt]"

## Qué Debes Hacer

**Modelo de usuario y CRUD**

- Crea un modelo User en TinyDB con al menos: id, email, hashed_password, is_active, role, created_at. No almacenes nombre visible ni datos de contacto en User.
- El campo role debe aceptar únicamente admin, manager o user. Usa un Enum o validador de campo para rechazar cualquier otro valor. Los registros nuevos vía POST /users usan user por defecto.
- Implementa una capa de servicios con funciones para: crear usuario, obtener usuario por ID, obtener usuario por email, actualizar usuario, eliminar usuario.
- Expón esos servicios como endpoints REST bajo /users:
	POST /users — registrar un nuevo usuario (hashear la contraseña antes de guardar). Acepta campos opcionales de perfil inicial (name, phone, address) y crea el Profile vinculado en la misma operación.
	GET /users — listar todos los usuarios (protegida).
	GET /users/{id} — obtener un usuario por ID (protegida).
	PUT /users/{id} — actualizar campos de credenciales como email, y role cuando quien llama es admin (protegida; solo el propio usuario o un admin).
	DELETE /users/{id} — eliminar un usuario (protegida). También elimina el perfil vinculado.

**Modelo de perfil y endpoints**

- Crea un modelo Profile en TinyDB, vinculado uno a uno a User mediante user_id, con al menos: id, user_id, name, phone, address.
- Expón rutas de perfil bajo /profiles:
	GET /profiles/me (protegida) — devuelve el perfil del usuario autenticado.
	PUT /profiles/me (protegida) — actualiza name, phone y address. Solo el dueño del perfil puede modificarlo.

**Endpoints de autenticación**

- Implementa POST /auth/login — acepta email y password, valida credenciales y devuelve un token JWT de acceso.
- Implementa GET /auth/me (protegida) — devuelve el email y role del usuario autenticado más el Profile vinculado (nombre y datos de contacto).

**Token y dependencia**

- Crea una dependencia get_current_user que: extraiga la cabecera Authorization: Bearer <token>, decodifique y valide el JWT, recupere el usuario de la base de datos y lance HTTPException(401) si algo falla.
- Configura la expiración del token mediante una variable de entorno (ej. ACCESS_TOKEN_EXPIRE_MINUTES). Guarda la clave de firma en .env — nunca la hardcodees.

**Protección de rutas**

- Aplica get_current_user como dependencia a cada ruta que no deba ser pública. Como mínimo: todos los endpoints de /users excepto POST /users, /auth/me, y al menos otras 5 rutas existentes de la API de tu monorepo (fuera de /users y /auth) que expongan o modifiquen datos sensibles.
- Devuelve 401 Unauthorized para solicitudes no autenticadas y 403 Forbidden cuando un usuario intenta acceder a un recurso que no le pertenece.
Verificación
- Verifica el flujo completo manualmente usando los docs interactivos de FastAPI (/docs): registro con POST /users → login → copiar token → usar el token en una ruta protegida.
- Confirma que llamar a una ruta protegida sin token devuelve 401.
- Confirma que llamar a una ruta protegida con un token expirado o mal formado devuelve 401.

**IMPORTANTE:** Almacena User y Profile solo en TinyDB — ahora y después de añadir Supabase. No crees tablas de usuarios ni perfiles en Supabase/SQLModel. Las tablas PostgreSQL de inventario y otros módulos guardan solo el id de TinyDB como user_uuid.
**IMPORTANTE:** No uses autenticación basada en sesiones ni en cookies. Este proyecto implementa únicamente auth JWT stateless.
**IMPORTANTE:** Nunca almacenes contraseñas en texto plano. Usa libpass con el esquema bcrypt para todas las operaciones con contraseñas. Instala libpass[bcrypt] — no el passlib sin mantenimiento. El import de Python sigue siendo from passlib.hash import bcrypt (libpass es un fork drop-in).

## Qué Vamos a Evaluar
- El CRUD de usuarios está completamente implementado y accesible a través de la API.
- Cada User tiene un Profile vinculado; name, phone y address se almacenan en Profile, no en User.
- El campo role acepta únicamente admin, manager o user; los usuarios nuevos creados vía POST /users usan user por defecto.
- Las contraseñas se hashean al crear el usuario y se comparan correctamente en el login — el texto plano nunca toca la base de datos.
- El endpoint de login devuelve un token JWT válido y firmado.
- La dependencia get_current_user decodifica correctamente el token e identifica al usuario.
- Las rutas protegidas devuelven 401 al ser llamadas sin un token válido.
- Un usuario que accede o actualiza el perfil o las credenciales de otro usuario recibe 403 Forbidden (no solo 401 por token ausente o inválido).
- La expiración del token y la clave de firma se leen desde variables de entorno, no están hardcodeadas.
- Las rutas de auth están bajo /auth, las de usuarios bajo /users y las de perfil bajo /profiles — estructura limpia y coherente.
- Al menos 5 rutas existentes fuera de /users y /auth requieren un token válido (además de las rutas protegidas de usuario/auth).
- User y Profile permanecen en TinyDB tras introducir Supabase — sin tablas de usuario en PostgreSQL.
- Las rutas protegidas del monorepo siguen funcionando correctamente cuando se llaman con un token válido (sin regresiones).

Nota: Aplicar permisos distintos por rol en cada ruta no es requerido para esta entrega, aunque es una extensión válida si el tiempo lo permite.  
