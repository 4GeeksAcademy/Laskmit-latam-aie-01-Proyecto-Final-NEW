# Directorio de Proveedores — API con Almacenamiento Ligero

Antes de comenzar: Lee el archivo CONTEXT-sin-hito-02-supplier-directory-nexova.es y antes de escribir una sola línea de código — define los campos exactos del proveedor, las categorías válidas, los estados permitidos y los datos iniciales que debe cargar el seeder.

## El Proyecto

La plataforma de la empresa sigue creciendo — y con ella, la necesidad de eliminar los puntos de fallo que frenan al equipo. Es el momento de utilizar una base de datos con una única fuente de verdad, accesible a todos desde la API — sin SQL todavía, pero con estructura real desde el primer día.

El área de compras gestiona actualmente su directorio de proveedores en una hoja de cálculo. La información clave —qué suministra cada proveedor, en qué país opera, cuál es su tarifa vigente y si está activo o suspendido— se actualiza de forma manual, inconsistente y sin trazabilidad. Cuando el precio de un ingrediente o componente sube, el equipo se entera tarde. Cuando hay que incorporar un proveedor nuevo, nadie sabe dónde registrarlo oficialmente.

Hay que construir una API de gestión de proveedores usando FastAPI + TinyDB + Pydantic. La decisión de usar TinyDB es deliberada: no siempre hace falta una base de datos de gran escala para resolver bien un problema. Una solución ligera, que no demanda recursos excesivos y puede desplegarse de inmediato, puede ser exactamente la herramienta correcta para el trabajo. La solución debe arrancar con datos reales desde el primer momento —no con una base de datos vacía— y tiene que rechazar cualquier entrada que no cumpla la estructura definida.

Trabaja dentro de las carpetas /services/api (backend) y /uis/backoffice (frontend) de este codespace.

**¿Qué es un seeder?**
Un seeder es un script que carga datos iniciales en la base de datos antes de que la aplicación empiece a usarse. Es una práctica estándar en desarrollo backend: permite que el sistema arranque con un estado conocido y realista, útil tanto para pruebas como para demostraciones. En este proyecto, el seeder importará el directorio de proveedores existente que hoy vive en una hoja de cálculo — exactamente lo que ocurre cuando una empresa migra de Excel a una herramienta propia.
Usa TinyDB.  El seeder tiene que cargar todos los proveedores del CONTEXT desde el arranque; no quiero ver una base de datos vacía en la demo. Pydantic valida todo lo que entra: si un proveedor no tiene país o su estado no es uno de los dos valores permitidos, la API lo rechaza con un 422 antes de que toque la base de datos. Dos endpoints de búsqueda imprescindibles: filtrar por país y filtrar por categoría de producto. Y cuando se actualice una tarifa, quiero que quede registrado el timestamp del cambio — ese dato lo va a necesitar el equipo para auditorías."

## Lo que se tiene que hacer

**Modelo de datos:**
[ ] Define el modelo Pydantic Supplier con los campos requeridos según el CONTEXT mencionado antes: nombre, país, categorías de producto, el campo de tarifa definido en el CONTEXT, updated_at y estado.
[ ] El campo status debe aceptar únicamente los valores definidos en el CONTEXT (activo / suspendido o sus equivalentes). Usa un Enum o un validador de campo para rechazar cualquier otro valor.
[ ] El campo de tarifa definido en el CONTEXT debe ser un número positivo. Pydantic debe rechazar valores cero o negativos antes de que el dato llegue a TinyDB.
[ ] Crea modelos de entrada y de respuesta separados cuando sea necesario (por ejemplo: el campo updated_at lo genera el sistema, no lo envía el cliente).

**Seeder**
[ ] Crea un script seed.py que cargue los proveedores iniciales definidos en el CONTEXT en TinyDB.
[ ] El seeder debe poder ejecutarse con uv run seed sin modificar el código.
[ ] Si la base de datos ya tiene datos, el seeder no debe duplicarlos — verifica antes de insertar.
[ ] Confirma en consola cuántos registros se han insertado al finalizar.

**Endpoints**
[ ] POST /suppliers — Registra un proveedor nuevo. Devuelve el proveedor creado con su ID asignado por TinyDB. Rechaza entradas inválidas con 422.
[ ] GET /suppliers — Lista todos los proveedores. Admite parámetros opcionales de query para filtrar por país y por categoría de producto. Si no se pasan parámetros, devuelve todos.
[ ] GET /suppliers/{id} — Devuelve el detalle de un proveedor por su ID. Devuelve 404 si no existe.
[ ] PATCH /suppliers/{id}/rate — Actualiza la tarifa de un proveedor. Registra automáticamente el updated_at con la fecha y hora del cambio. No acepta tarifas iguales o menores a cero.
[ ] PATCH /suppliers/{id}/status — Activa o suspende un proveedor. Solo acepta los dos valores de estado definidos en el CONTEXT.
[ ] DELETE /suppliers/{id} — Elimina un proveedor del directorio. Devuelve 404 si el ID no existe.

⚠️ IMPORTANTE: Los nombres de campos, categorías válidas y estados permitidos, deben coincidir exactamente con lo especificado en el CONTEXT. Una implementación genérica que ignore el contexto de la empresa no será aceptada.

**Frontend (/uis/backoffice)**

[ ] Crea una página de directorio de proveedores accesible desde el menú de la aplicación.
[ ] Muestra el listado completo de proveedores en una tabla o lista con sus campos principales: nombre, país, categorías, el campo de tarifa de tu CONTEXT y estado.
[ ] Incluye controles de filtrado por país y por categoría que actualicen el listado sin recargar la página.
[ ] Implementa un formulario para registrar un proveedor nuevo que consuma el endpoint POST /suppliers. Muestra un mensaje de error si la API rechaza la entrada.
[ ] Permite actualizar el campo de tarifa definido en tu CONTEXT desde la interfaz y refleja el cambio en el listado inmediatamente.
[ ] Permite cambiar el estado de un proveedor (activar / suspender) desde la interfaz con un control visible en cada fila o en la vista de detalle.
[ ] Diferencia visualmente los proveedores activos de los suspendidos (por ejemplo, con un badge de color o estilo diferenciado).

## Confirmación de lo que se va a evaluar

**Modelo y validación**
[ ] El modelo Pydantic refleja exactamente los campos definidos en el CONTEXT.
[ ] Valores de status fuera del conjunto permitido son rechazados con 422 antes de llegar a TinyDB.
[ ] El campo de tarifa definido en tu CONTEXT: valores cero o negativos son rechazados con 422.
[ ] El campo updated_at es generado por el sistema, no enviado por el cliente.

**Seeder**
[ ] uv run seed se ejecuta sin errores y carga los proveedores del CONTEXT en la base de datos.
[ ] La ejecución repetida del seeder no produce duplicados.
[ ] El número de registros insertados se confirma en consola al finalizar.

**Endpoints**
[ ] POST /suppliers crea un proveedor y devuelve el objeto completo con ID.
[ ] GET /suppliers sin parámetros devuelve todos los proveedores.
[ ] GET /suppliers?country=X devuelve únicamente los proveedores del país indicado.
[ ] GET /suppliers?category=Y devuelve únicamente los proveedores que suministran esa categoría.
[ ] GET /suppliers/{id} devuelve 404 para IDs inexistentes.
[ ] PATCH /suppliers/{id}/rate actualiza la tarifa y registra el timestamp del cambio.
[ ] PATCH /suppliers/{id}/status rechaza valores de estado no permitidos con 422.
[ ] DELETE /suppliers/{id} devuelve 404 para IDs inexistentes.

**Frontend**
[ ] El listado de proveedores se carga desde la API y muestra los campos definidos en el CONTEXT.
[ ] Los filtros por país y por categoría funcionan y actualizan el listado sin recargar la página.
[ ] El formulario de registro valida en cliente los campos requeridos y muestra el error de la API si el servidor rechaza la entrada.
[ ] La actualización de tarifa y el cambio de estado se reflejan en la interfaz tras la respuesta de la API.
[ ] Los proveedores activos y suspendidos se distinguen visualmente.

**Transversales**
[ ] La base de datos TinyDB persiste correctamente: los datos siguen ahí después de reiniciar el servidor.
[ ] Los errores HTTP son coherentes: 404 cuando no se encuentra, 422 cuando la entrada es inválida, 200 / 201 cuando la operación es exitosa.
[ ] El código está organizado según la estructura de carpetas del monorepo (services/ para el backend, uis/backoffice para el frontend).

El proyecto debe estar organizado de la siguiente forma:
services/
  api/
    main.py           ← aplicación FastAPI
    models.py         ← modelos Pydantic
    database.py       ← inicialización de TinyDB
    routes/
      suppliers.py    ← endpoints del directorio de proveedores
    seed.py           ← script de carga de datos iniciales
uis/
  application/
    app/
      suppliers/      ← página de directorio de proveedores

