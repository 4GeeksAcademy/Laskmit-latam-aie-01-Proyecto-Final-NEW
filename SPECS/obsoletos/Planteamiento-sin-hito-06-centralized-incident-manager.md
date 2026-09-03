# Proyecto - Gestor de Incidencias Centralizado

Este proyecto requiere del archivo: CONTEXT-sin-hito-06-centralized-incident-manager-nexova.es.md

Con esta información se definirán:
- La estructura de datos de incidencias, los nombres de campos, categorías válidas, sedes de la empresa y los valores semilla esperados para la implementación.
- Este proyecto extiende el trabajo del analizador de incidencias. Reutiliza la base de datos, la estructura de la API y la arquitectura del frontend existentes.
- Los nombres de campos, categorías, sedes y valores de la implementación deben coincidir exactamente con lo especificado en el archivo CONTEXT-sin-hito-06-centralized-incident-manager-nexova.es.md indicado antes. Una implementación genérica que ignore el contexto no será aceptada.

## Descripción del Proyecto

El analizador de incidencias (que lee el fichero CSV), que se construyó anteriormente,  demostró que la lógica de validación y métricas funciona. Pero el equipo de soporte ya no quiere seguir exportando ficheros para analizarlos: quiere registrar incidencias directamente desde el navegador, en tiempo real, desde cualquier punto de la empresa.

Se debe integrar un gestor de incidencias centralizado en la plataforma. Cualquier persona de la empresa —esté en una sede operativa, en central o gestionando una incidencia de cliente— podrá registrarla desde un formulario, consultarla y hacer seguimiento desde el mismo panel.

"Tenemos el histórico en el CSV del proyecto anterior. Vamos a cargarlo como seed de incidencias de cliente para tener datos reales desde el primer día. A partir de ahí, el formulario es la única vía de entrada — nada de ficheros manuales. Y esto tiene que funcionar bien aunque la API tarde, aunque el servidor devuelva un 500, aunque el usuario deje un campo en blanco. Se quiere ver mensajes de error que entiendan los usuarios, no stack traces."

**¿Qué es un gestor de incidencias profesional?**
Un gestor de incidencias no es solo un formulario conectado a una base de datos. En un entorno real, cada incidencia tiene un ciclo de vida (abierta → en progreso → resuelta → descartada) y un origen que determina su contexto: no es lo mismo una queja de cliente que un fallo interno detectado por una sede. El sistema debe registrar quién reportó qué, desde dónde, cuándo, y en qué estado se encuentra — y debe poder agregarlo en métricas útiles para la dirección.

**Conocimiento complementario: mejorar un gestor de incidencias con embeddings**
Una aplicación como esta — formularios estructurados, filtros y métricas agregadas — funciona muy bien con valores exactos en cada campo. Los embeddings añaden una capa semántica encima: convierten el title y la description de cada incidencia en un vector denso que captura el significado, no solo palabras clave.
Con esa representación almacenada en una base de datos vectorial (o en una extensión que soporte búsqueda por similitud), puedes evolucionar el mismo sistema en varias direcciones sin cambiar el modelo CRUD central:
	Encontrar incidencias similares — al registrar un nuevo reporte, mostrar casos pasados con descripciones parecidas para que soporte reutilice resoluciones o detecte problemas recurrentes.
	Búsqueda más inteligente — consultas como "fallo en el pago en la caja" pueden coincidir con incidencias redactadas de otra forma ("tarjeta rechazada en la compra"), algo que los filtros por palabra clave suelen pasar por alto.
	Detección de duplicados y agrupación — agrupar picos de reportes relacionados entre sedes u orígenes antes de que saturen el panel de resumen.
	Triaje asistido — sugerir categoría o prioridad a partir del texto de la descripción, comparándolo con embeddings de incidencias históricas ya etiquetadas por el equipo.
No hace falta implementar nada de esto en la entrega actual. La idea es ver que el gestor que construyes hoy es una base sólida: cuando las descripciones viven en la base de datos, los embeddings son el siguiente paso natural si el producto necesita búsqueda e inteligencia más allá de los filtros exactos.

## Detalle de lo que hay que hacer en el proyecto

### Modelo de datos

- Define el modelo Incident con los siguientes campos:
	id — identificador único generado automáticamente.
	title — título breve de la incidencia (obligatorio).
	description — descripción detallada (obligatorio).
	category — categoría según las definidas en tu CONTEXT.
	status — estado del ciclo de vida: open, in_progress, resolved, discarded.
	origin — origen del reporte: customer, branch, internal.
	branch — sede que gestiona o reporta la incidencia (obligatorio para todos los orígenes; usar central cuando no corresponda a una sede específica).
	created_at — fecha y hora de creación, generada automáticamente.
	updated_at — fecha y hora de última modificación, actualizada automáticamente.
- Aplica las restricciones de integridad necesarias: campos obligatorios, valores permitidos en status, origin y category.

### Seed de datos históricos (/scripts)
- Crea el script seed_incidents.py que lee el fichero CSV del proyecto anterior y carga todas sus filas en la base de datos asignando origin: "customer" a todos los registros.
- El script debe aplicar las transformaciones CSV → modelo especificadas en tu CONTEXT (mapa de estados, mapa de categorías, description → title, date → created_at, ubicación → branch) antes del insert — el esquema del CSV del analizador no es idéntico al de este gestor.
- El script debe reutilizar la lógica de validación ya existente — extrae las funciones comunes a packages/shared/ si aún no lo has hecho; los registros inválidos del CSV no se insertan y se reportan en consola al final de la ejecución.
- El script es idempotente: si se ejecuta dos veces no duplica registros (comprueba por un campo identificador del CSV antes de insertar).

### Backend (/services)

**Endpoints de gestión:**'

- POST /api/incidents — crea una nueva incidencia. Valida todos los campos obligatorios y devuelve 400 con un mensaje descriptivo si falta alguno o contiene un valor no permitido.
- GET /api/incidents — devuelve la lista de incidencias. Acepta parámetros de filtro opcionales: status, origin, branch, category.
- GET /api/incidents/{id} — devuelve el detalle de una incidencia. Devuelve 404 si no existe.
- PATCH /api/incidents/{id}/status — actualiza únicamente el estado de una incidencia. Valida que la transición sea coherente con el ciclo de vida: desde open se puede avanzar a in_progress o discarded; desde in_progress se puede avanzar a resolved o discarded; los estados resolved y discarded son finales.
- GET /api/incidents/summary — devuelve las métricas agregadas: total por estado, total por categoría, total por origen y total por sede.

**Manejo de errores en el backend:**

- Toda excepción no controlada devuelve 500 con un mensaje genérico — nunca el stack trace completo.
- Los errores de validación devuelven 400 con un objeto JSON que identifica el campo problemático y describe el error en lenguaje claro.
- Los endpoints de lectura no fallan si la base de datos está vacía: devuelven lista vacía o métricas en cero.

### Frontend (/uis)

**Formulario de registro:**

- Crea una página de registro de incidencias accesible desde el menú de la aplicación.
- El formulario incluye todos los campos del modelo. El campo branch es siempre visible y obligatorio, con todas las opciones de sede de tu CONTEXT (incluido central, mostrado como la etiqueta que indique tu CONTEXT).
- Cuando origin sea branch, el campo branch se destaca visualmente para recordar al usuario que está reportando desde una sede específica.
- Al enviar, el formulario muestra un indicador de carga mientras la petición está en curso — el botón de envío queda deshabilitado durante ese tiempo.
- Si la API devuelve un error, el formulario muestra un mensaje comprensible para el usuario, nunca el mensaje técnico del servidor. Si el error identifica un campo concreto, el mensaje aparece junto a ese campo.
- Tras un envío exitoso, el formulario se limpia y muestra una confirmación clara.

### Panel de incidencias:

- Crea una página de listado con todas las incidencias registradas, con filtros por status, origin y branch.
- Muestra un indicador de carga mientras se obtienen los datos.
- Si la petición falla, muestra un mensaje de error con opción de reintentar — la página no queda en blanco ni rota.
- Si no hay incidencias que mostrar (lista vacía o sin resultados para los filtros aplicados), muestra un mensaje informativo — nunca una tabla vacía sin contexto.
- Cada incidencia permite actualizar su estado directamente desde el listado. Si la actualización falla, el estado visual vuelve al valor anterior y se notifica al usuario.

### Panel de resumen:

- Muestra las métricas agregadas del endpoint /summary: totales por estado, por categoría, por origen y por sede.
- Si los datos tardan en cargarse o fallan, el panel muestra el estado correspondiente sin romper el resto de la página.


## Verificación del trabajo - Evaluación

**Modelo y seed**

- El modelo incluye todos los campos requeridos con sus restricciones de integridad.
- El script de seed carga correctamente las incidencias históricas asignando origin: "customer".
- El script de seed aplica las transformaciones CSV → modelo definidas en tu CONTEXT (estado, categoría, título, fechas y sede) antes del insert.
- Los registros inválidos del CSV no se insertan y se reportan en consola.
- El script es idempotente: ejecutarlo dos veces no duplica datos.
- Tras el seed, los totales por status y category del modelo en /api/incidents/summary coinciden con los valores transformados esperados en tu CONTEXT (mismo conjunto de registros válidos que en el proyecto analizador de incidencias).

**Backend**

- Todos los endpoints responden con los códigos HTTP correctos en los casos felices y en los de error.
- Los errores de validación identifican el campo problemático en la respuesta JSON.
- Ningún endpoint expone un stack trace al cliente.
- Las transiciones de estado inválidas son rechazadas con 400.
- El endpoint /summary devuelve métricas correctas aunque no haya incidencias.

**Frontend**

- El formulario valida campos obligatorios en el cliente antes de enviar.
- Cuando origin es branch, el campo branch se resalta visualmente y el desplegable muestra las etiquetas de CONTEXT.
- Los estados de carga son visibles y el botón de envío queda deshabilitado durante la petición.
- Los errores de la API se muestran en lenguaje comprensible para el usuario, nunca como texto técnico.
- El listado gestiona correctamente los tres estados posibles: cargando, vacío, con datos.
- La actualización de estado en el listado revierte visualmente si la petición falla.
- El panel de resumen no rompe la página si su petición falla.

**Transversal**

- La lógica de validación del proyecto anterior está extraída en packages/shared/ y es reutilizada tanto por el script como por la API, sin duplicación.
- El código está organizado según la estructura de carpetas del monorepo (/scripts/, /services/, /uis/, /packages/shared/).

## Estructura de Directorios del proyecto

El proyecto debe estar organizado en el monorepo de la siguiente manera:
scripts/
  seed_incidents.py             ← script de carga del histórico CSV

packages/
  shared/                       ← lógica de validación compartida entre script y API

services/
  <nombre-del-servicio-api>/    ← backend con endpoints de gestión y resumen

uis/
  <nombre-de-la-ui>/            ← interfaz de registro, listado y resumen


## Prueba de funcionamiento a considerar para las pruebas manuales

- Captura de pantalla del formulario con un error de validación visible.
- Captura de pantalla del panel de listado con datos cargados.
- Captura de pantalla del panel de resumen con métricas.
