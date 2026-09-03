# SPECS - Sin Hito 06 (Centralized Incident Manager)

## Identificacion

- **Funcionalidad:** Gestor de incidencias centralizado de Nexova.
- **Aplicacion frontend objetivo:** `uis/backoffice`.
- **Backend objetivo:** FastAPI en `services/api`.
- **Persistencia vigente:** TinyDB.
- **Fuente historica:** `data/raw/incidents-nexova.csv`.
- **Logica reutilizable:** `shared/incidents_analysis.py`.
- **Stack vigente:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, FastAPI y Python 3.11 o superior.
- **Dependencias funcionales:** el analizador de incidencias y AUTH-02 deben continuar operando sin regresiones.

## Objetivo

Integrar en el backoffice de Nexova un gestor persistente para registrar, consultar, filtrar y actualizar incidencias tecnicas y operativas desde el navegador. La solucion debe ofrecer visibilidad agregada por estado, categoria, origen y sede, cargar como datos iniciales el historico valido del analizador y manejar de forma recuperable los estados de carga, vacio y error.

El gestor extiende el modulo actual de analisis de CSV. No lo reemplaza: debe reutilizar su validacion desde el origen y conservar los contratos existentes de analisis y exportacion.

## Alcance funcional

### Incluido

1. Modelo persistente `Incident` con dominio cerrado para categoria, estado, origen y sede.
2. Script idempotente `scripts/seed_incidents.py` para transformar e importar `data/raw/incidents-nexova.csv`.
3. Endpoints para crear, listar, consultar detalle y actualizar el estado de una incidencia.
4. Filtros opcionales por `status`, `origin`, `branch` y `category`.
5. Endpoint de resumen con totales por estado, categoria, origen y sede.
6. Formulario protegido de registro de incidencias en `uis/backoffice`.
7. Panel protegido de listado, filtros y cambio de estado.
8. Panel protegido de metricas agregadas.
9. Estados explicitos de carga, vacio, exito y error recuperable en la interfaz.
10. Pruebas de modelo, transformacion, seed, API, ciclo de vida y controles de no regresion.

### Fuera de alcance

- Embeddings, busqueda semantica, deteccion automatica de duplicados o agrupacion inteligente.
- Triaje asistido, sugerencias automaticas de categoria o prioridad y alertas de SLA.
- Comentarios, adjuntos, historial de cambios, asignacion a agentes o equipos y notificaciones.
- Edicion general o eliminacion de incidencias mediante API.
- Prioridades adicionales; `sla_breach` se representa como categoria.
- Paginacion, ordenamiento configurable o busqueda de texto libre.
- Importacion manual de nuevos CSV desde la UI del gestor.
- Cambiar el proveedor de persistencia o migrar TinyDB.
- Modificar `uis/website`, que debe permanecer publica.
- Implementar una capa bilingue nueva. Si el backoffice ya dispone de internacionalizacion, los textos nuevos deben integrarse en ella.

## Compatibilidad obligatoria y no regresion

La implementacion es aditiva. Debe reutilizar `services/api/routes/incidents.py`, la infraestructura TinyDB de `services/api/database.py`, el cliente HTTP autenticado del backoffice y la logica de `shared/incidents_analysis.py` desde sus ubicaciones vigentes.

Deben conservarse sin cambios de contrato ni comportamiento:

- `GET /api/incidents/health` como endpoint publico de salud.
- `POST /api/incidents/analyze` y su autenticacion existente.
- `GET /api/incidents/results/export` y la descarga autenticada existente.
- La validacion y las metricas actuales del analizador de CSV.
- Los flujos de login, registro, perfil, recuperacion y cambio de contrasena.
- Todas las operaciones de Suppliers.
- Las vistas y el cliente externo de Talent Pipeline Tracker.
- La accesibilidad publica y el comportamiento de `uis/website`.

Las rutas estaticas `/summary`, `/health`, `/analyze` y `/results/export` deben declararse de forma que no colisionen con `/{id}`. La incorporacion del gestor no puede convertir `summary` en un identificador ni alterar las rutas existentes.

## Dominio de incidencias

### Sedes validas

El valor persistido y la etiqueta visible deben coincidir con esta tabla:

| Valor | Etiqueta visible |
|---|---|
| `central` | Central — Sede Valencia |
| `valencia_operations` | Valencia — Operaciones |
| `miami_office` | Miami Office |
| `remote` | Remoto (empleado sin sede fija) |

`central` se usa cuando el reporte no corresponde a una oficina concreta, incluidas las quejas de cliente sin sede y los reportes internos de direccion. No se debe crear otro valor para headquarters. `remote` y `valencia_operations` deben permanecer como opciones distintas y no presentarse como sinonimos de `central`.

### Categorias validas

| Valor | Significado |
|---|---|
| `technical_failure` | Fallo de sistema o herramienta tecnologica |
| `process_error` | Error en un proceso operativo |
| `client_complaint` | Queja de un cliente corporativo |
| `candidate_issue` | Problema relacionado con un candidato |
| `staff_issue` | Incidencia interna de recursos humanos |
| `sla_breach` | Incumplimiento de un SLA comprometido |
| `data_quality` | Error o inconsistencia de datos |
| `other` | Incidencia que no encaja en las categorias anteriores |

La categoria `sla_breach` debe poder filtrarse mediante el parametro `category` y agregarse en el resumen sin logica especial ni cambios de esquema posteriores.

### Estados y transiciones

| Valor | Significado |
|---|---|
| `open` | Registrada y todavia sin responsable |
| `in_progress` | Asignada y en gestion activa |
| `resolved` | Resuelta y confirmada |
| `discarded` | Duplicada, erronea o fuera de alcance |

Transiciones permitidas:

| Estado actual | Estado siguiente permitido |
|---|---|
| `open` | `in_progress`, `discarded` |
| `in_progress` | `resolved`, `discarded` |
| `resolved` | Ninguno |
| `discarded` | Ninguno |

Una incidencia creada mediante la API nace siempre en `open`. El seed historico puede insertar directamente `open`, `resolved` o `discarded`, porque reconstruye un estado previo y no representa una transicion interactiva. Repetir el mismo estado en `PATCH` no se considera una transicion valida y debe responder `400`.

### Origenes validos

| Valor | Significado |
|---|---|
| `customer` | Reportada por un cliente corporativo |
| `branch` | Reportada por personal de una sede |
| `internal` | Detectada por tecnologia, operaciones o direccion |

`branch` es obligatorio para todos los origenes. El origen `branch` no cambia el contrato, pero la interfaz debe destacar visualmente el selector de sede para evitar que quede `central` por descuido.

## Modelo de datos

### Registro persistido

El modelo publico `Incident` debe contener:

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | entero | Unico, positivo y generado por el servidor |
| `title` | texto | Obligatorio, recortado, entre 1 y 120 caracteres |
| `description` | texto | Obligatorio y no vacio despues de recortar para validar |
| `category` | enum | Uno de los ocho valores definidos |
| `status` | enum | Uno de los cuatro estados definidos |
| `origin` | enum | `customer`, `branch` o `internal` |
| `branch` | enum | Una de las cuatro sedes definidas |
| `created_at` | datetime | UTC, generado por el servidor salvo durante el seed |
| `updated_at` | datetime | UTC, igual a `created_at` al crear y actualizado al cambiar el estado |

El texto de `description` se conserva literalmente despues de comprobar que no sea vacio. Los espacios exteriores de `title` se eliminan antes de persistir. Los valores de enums se almacenan exactamente en minusculas como aparecen en esta especificacion.

### Modelos de entrada y respuesta

Definir modelos Pydantic equivalentes a:

```python
class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: IncidentBranch

class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus

class IncidentResponse(IncidentCreate):
    id: int
    status: IncidentStatus
    created_at: datetime
    updated_at: datetime
```

El cliente no envia `id`, `created_at` ni `updated_at`. Tampoco selecciona un estado inicial distinto de `open`. Los nombres definitivos pueden seguir la convencion local, pero el contrato JSON debe conservar estos campos.

## Seed de datos historicos

### Fuente y reutilizacion

Crear `scripts/seed_incidents.py` y usar por defecto `data/raw/incidents-nexova.csv`. Se puede aceptar una ruta por argumento para facilitar pruebas, pero no se debe depender del directorio obsoleto `content/contexts/`.

El script debe importar y reutilizar las funciones de validacion del analizador desde `shared/incidents_analysis.py`. Si hace falta exponer una funcion para validar filas o cabeceras, debe extraerse o ampliarse en ese modulo; no se permite copiar sus reglas dentro del seed ni dentro de la API.

### Transformacion CSV a modelo

Solo se transforman filas que superen la validacion compartida completa.

| Campo CSV | Campo destino | Transformacion |
|---|---|---|
| `ticket_id` | Ninguno | Solo clave de idempotencia; no forma parte del modelo publico |
| `description` | `title` | Primeros 120 caracteres, recortados; descartar si queda vacio |
| `description` | `description` | Copia literal |
| `date` | `created_at` | Parsear `YYYY-MM-DD` a medianoche UTC |
| Ninguno | `updated_at` | Igual a `created_at` al insertar |
| Ninguno | `origin` | Siempre `customer` |
| Ninguno | `branch` | Siempre `central` |

Mapeo de estados:

| CSV | Modelo |
|---|---|
| `OPEN` | `open` |
| `CLOSED` | `resolved` |
| `DISCARDED` | `discarded` |

Mapeo de categorias:

| CSV | Modelo |
|---|---|
| `TECHNICAL` | `technical_failure` |
| `BILLING` | `process_error` |
| `ACCESS` | `technical_failure` |
| `HR_QUERY` | `process_error` |
| `COMPLAINT` | `client_complaint` |

Una fila con fecha invalida, transformacion imposible, estado o categoria sin mapeo, o fallo de validacion no se inserta.

### Idempotencia y reporte

La clave de idempotencia se deriva de `ticket_id` cuando existe. Si falta, se deriva de `title + created_at`. `ticket_id` no se agrega al modelo ni se devuelve por API.

Se permite persistir un hash determinista de la clave en metadatos internos o en una tabla TinyDB dedicada al seed. Ese valor debe quedar excluido de las respuestas publicas. Una segunda ejecucion con la misma fuente debe omitir las 96 filas ya importadas y no crear incidencias nuevas.

Al finalizar, el script debe informar en consola como minimo:

- Filas leidas.
- Filas validas.
- Filas insertadas.
- Filas omitidas por existir previamente.
- Filas descartadas.
- Motivos de descarte agrupados.

El comando debe terminar con codigo distinto de cero si el archivo no existe, no es UTF-8, no contiene las cabeceras requeridas o la base no puede abrirse. Los errores por fila no detienen el resto de la importacion.

### Totales obligatorios despues del seed

Con una base vacia y la fuente versionada, deben existir exactamente 96 incidencias importadas.

Por estado:

| Estado | Total |
|---|---:|
| `open` | 27 |
| `in_progress` | 0 |
| `resolved` | 56 |
| `discarded` | 13 |

Por categoria:

| Categoria | Total |
|---|---:|
| `technical_failure` | 49 |
| `process_error` | 35 |
| `client_complaint` | 12 |
| `candidate_issue` | 0 |
| `staff_issue` | 0 |
| `sla_breach` | 0 |
| `data_quality` | 0 |
| `other` | 0 |

Ademas, `origin.customer` y `branch.central` deben valer 96. Estos conteos corresponden exclusivamente a una base vacia recien sembrada; las incidencias creadas despues por usuarios se agregan normalmente al resumen.

## Contratos de API

Todos los endpoints nuevos del gestor son protegidos y deben usar la dependencia Bearer existente. `GET /api/incidents/health` conserva su acceso publico. No se deben introducir reglas de rol nuevas en este alcance.

### `POST /api/incidents`

Request:

```json
{
  "title": "Zendesk no asigna tickets al equipo de Miami",
  "description": "Los tickets nuevos permanecen sin agente desde las 09:00 UTC.",
  "category": "technical_failure",
  "origin": "branch",
  "branch": "miami_office"
}
```

Respuesta exitosa `201`: incidencia completa con `status: "open"`, identificador y timestamps UTC.

Reglas:

1. Validar todos los campos del request y rechazar texto vacio despues del recorte.
2. El servidor asigna siempre `open`; no acepta `status` como forma de saltar el ciclo de vida.
3. `created_at` y `updated_at` se generan a partir del mismo instante UTC.
4. Los campos desconocidos no deben modificar valores internos.
5. Un error de campo responde `400` con el formato comun de validacion.

### `GET /api/incidents`

Parametros opcionales:

- `status`
- `origin`
- `branch`
- `category`

Respuesta exitosa `200`: arreglo de incidencias. Sin coincidencias o con una base vacia devuelve `[]`.

Los filtros se combinan con semantica AND, usan coincidencia exacta y solo aceptan valores del dominio. Un valor de filtro invalido responde `400`, no se interpreta como una lista vacia. El orden por defecto es `created_at` descendente y, en caso de empate, `id` descendente.

### `GET /api/incidents/{id}`

Respuesta exitosa `200`: incidencia completa. Un identificador positivo inexistente devuelve `404`. Un identificador con formato invalido devuelve `400` o la respuesta de validacion equivalente, sin traza interna.

### `PATCH /api/incidents/{id}/status`

Request:

```json
{
  "status": "in_progress"
}
```

Respuesta exitosa `200`: incidencia completa con estado nuevo, `created_at` intacto y `updated_at` renovado en UTC.

Reglas:

1. Solo se acepta el campo `status`.
2. Comprobar la existencia antes de aplicar la transicion.
3. Aplicar exclusivamente las transiciones de la tabla de ciclo de vida.
4. Una transicion invalida, repetida o desde un estado final devuelve `400` e identifica `status` como campo problematico.
5. Un identificador inexistente devuelve `404`.
6. Si la escritura falla, no devolver una incidencia que aparente haber cambiado.

### `GET /api/incidents/summary`

Respuesta exitosa `200`:

```json
{
  "total": 96,
  "by_status": {
    "open": 27,
    "in_progress": 0,
    "resolved": 56,
    "discarded": 13
  },
  "by_category": {
    "technical_failure": 49,
    "process_error": 35,
    "client_complaint": 12,
    "candidate_issue": 0,
    "staff_issue": 0,
    "sla_breach": 0,
    "data_quality": 0,
    "other": 0
  },
  "by_origin": {
    "customer": 96,
    "branch": 0,
    "internal": 0
  },
  "by_branch": {
    "central": 96,
    "valencia_operations": 0,
    "miami_office": 0,
    "remote": 0
  }
}
```

El objeto debe incluir todas las claves del dominio aunque su valor sea cero. Con la base vacia devuelve `total: 0` y todos los contadores en cero.

### Formato de errores

Los errores de validacion controlados devuelven `400` con una forma estable:

```json
{
  "error": {
    "field": "category",
    "message": "Selecciona una categoria valida."
  }
}
```

Cuando el error no pertenece a un unico campo, `field` puede ser `null`. Los recursos inexistentes devuelven `404`. Una excepcion no controlada devuelve `500` con un mensaje generico y se registra del lado servidor sin secretos, contrasenas, JWT ni contenido sensible completo de la incidencia. Nunca se devuelve un stack trace al cliente.

La validacion automatica de FastAPI/Pydantic de los endpoints nuevos debe traducirse al contrato `400` anterior en lugar de exponer el formato tecnico por defecto. Los endpoints existentes conservan sus contratos actuales.

## Arquitectura backend requerida

La ubicacion exacta puede adaptarse a las convenciones vigentes, manteniendo responsabilidades equivalentes:

```text
services/api/
├── database.py
├── models.py
├── incidents/
│   └── service.py
└── routes/
    └── incidents.py

scripts/
└── seed_incidents.py

shared/
└── incidents_analysis.py
```

Responsabilidades:

1. `models.py`: enums y modelos Pydantic de request y response.
2. Capa de servicio: persistencia, filtros, resumen y validacion de transiciones.
3. `routes/incidents.py`: contratos HTTP, autenticacion y traduccion uniforme de errores.
4. `database.py`: acceso centralizado a la tabla de incidencias y metadatos del seed.
5. `shared/incidents_analysis.py`: validacion comun del CSV, importable por analizador y seed.
6. `scripts/seed_incidents.py`: lectura, transformacion, deduplicacion y reporte de la importacion.

No se debe crear otra instancia de FastAPI, otra base JSON exclusiva sin necesidad, ni una copia de la validacion del CSV. La tabla de incidencias debe convivir con las tablas actuales sin renombrarlas ni borrar datos existentes.

## Arquitectura frontend requerida

Extender `uis/backoffice` con rutas equivalentes a:

```text
uis/backoffice/
├── app/
│   └── incidents/
│       ├── page.tsx
│       └── new/
│           └── page.tsx
├── components/
│   └── incidents/
└── lib/
    ├── api-client.ts
    └── incident-types.ts
```

Se permite integrar registro, listado y resumen en una sola ruta si la navegacion y los estados siguen siendo claros. En ambos casos debe existir un acceso visible desde la navegacion autenticada.

Las vistas usan el cliente compartido autenticado. No deben repetir la URL base, el acceso a `localStorage`, la construccion del header `Authorization` ni el parseo general de errores. El cliente externo de Talent Pipeline no se usa para estas solicitudes.

## Requisitos del formulario

- Mostrar campos editables para `title`, `description`, `category`, `origin` y `branch`.
- Mostrar que el estado inicial sera `open`, sin ofrecer otro estado durante el alta.
- Usar las etiquetas de sede exactas definidas en esta especificacion, incluida la opcion `remote`.
- Mantener `branch` siempre visible y obligatorio, cualquiera que sea el origen.
- Cuando `origin` sea `branch`, destacar el campo de sede de forma accesible sin depender solo del color.
- Validar obligatorios y longitud maxima del titulo antes de llamar a la API.
- Asociar cada control con su `label` y cada error con `aria-describedby`.
- Deshabilitar el boton de envio y evitar solicitudes duplicadas mientras la peticion esta en curso.
- Mostrar un indicador de carga estable y accesible.
- Mapear los errores con `field` junto al control correspondiente.
- Sustituir mensajes tecnicos o respuestas `500` por texto comprensible para el usuario.
- Tras `201`, limpiar el formulario y mostrar una confirmacion con `role="status"` o `aria-live="polite"`.
- No limpiar los valores utiles si la peticion falla, para que el usuario pueda corregir o reintentar.

Si existe soporte bilingue activo, las etiquetas, validaciones y mensajes deben respetar el idioma seleccionado. Los valores enviados a la API permanecen siempre en ingles y no se traducen.

## Requisitos del listado

- Cargar las incidencias mediante `GET /api/incidents`.
- Ofrecer filtros por estado, origen y sede; se recomienda exponer tambien categoria porque el backend la soporta y `sla_breach` debe ser trivial de localizar.
- Reflejar los filtros en la solicitud sin filtrar una segunda copia incompatible solo en cliente.
- Mostrar al menos titulo, categoria, estado, origen, sede, fecha de creacion y accion de cambio de estado.
- Usar las etiquetas legibles del dominio sin alterar los valores enviados.
- Mostrar un estado de carga mientras se obtiene la lista.
- Mostrar un mensaje informativo cuando la base este vacia o los filtros no tengan resultados.
- Ante error, conservar la pagina, mostrar un mensaje comprensible y ofrecer una accion de reintento.
- Ofrecer unicamente los siguientes estados validos desde el estado actual; los estados finales no muestran acciones de avance.
- Al cambiar el estado, mostrar progreso en la fila y bloquear nuevos cambios para esa incidencia.
- Se permite actualizacion optimista, pero ante un fallo la UI debe restaurar el valor anterior y notificarlo. Una actualizacion no optimista tambien es valida si nunca muestra un estado no confirmado.
- Actualizar el listado y las metricas con la respuesta confirmada, sin recargar toda la pagina obligatoriamente.

El contenido debe funcionar en movil y escritorio sin superposiciones. En pantallas estrechas puede usarse una lista estructurada en lugar de forzar una tabla horizontal ilegible.

## Requisitos del panel de resumen

- Consumir `GET /api/incidents/summary` como fuente de verdad.
- Mostrar total general y desgloses por estado, categoria, origen y sede.
- Mostrar explicitamente los valores cero relevantes; no confundir ausencia de datos con error.
- Mantener dimensiones estables durante la carga para evitar saltos de layout.
- Si la peticion falla, mostrar el error y una accion de reintento sin romper el formulario ni el listado.
- No recalcular el resumen exclusivamente desde la pagina visible del listado.
- Diferenciar visualmente `sla_breach` para facilitar su lectura, sin inventar alertas automaticas ni prioridades.

## Tipos TypeScript minimos

Definir y reutilizar tipos equivalentes a:

```ts
type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";
type IncidentOrigin = "customer" | "branch" | "internal";
type IncidentBranch = "central" | "valencia_operations" | "miami_office" | "remote";
type IncidentCategory =
  | "technical_failure"
  | "process_error"
  | "client_complaint"
  | "candidate_issue"
  | "staff_issue"
  | "sla_breach"
  | "data_quality"
  | "other";

interface Incident {
  id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

interface IncidentSummary {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_category: Record<IncidentCategory, number>;
  by_origin: Record<IncidentOrigin, number>;
  by_branch: Record<IncidentBranch, number>;
}
```

No usar `any` para payloads, respuestas, filtros ni errores del gestor.

## Seguridad, privacidad y robustez

- Todos los endpoints nuevos requieren el JWT Nexova y confian en la API como fuente de autorizacion.
- No enviar el JWT al servicio externo de Talent Pipeline.
- No renderizar `title` o `description` como HTML ni usar `dangerouslySetInnerHTML`.
- No registrar JWT, cabeceras `Authorization`, stack traces enviados al cliente ni descripciones completas en logs de error.
- Validar nuevamente en servidor aunque el frontend ya haya validado.
- Generar y comparar timestamps en UTC.
- No aceptar valores de enums fuera de las listas cerradas.
- No permitir actualizaciones parciales arbitrarias mediante el endpoint de estado.
- Los fallos de lectura de una coleccion vacia no son excepciones.
- Una falla del resumen no debe impedir usar el formulario o el listado si sus solicitudes funcionan.
- Una falla del listado no debe borrar los datos ya confirmados sin informar al usuario.

## Experiencia de usuario y accesibilidad

- Mantener el lenguaje visual y los componentes vigentes del backoffice.
- Usar controles nativos adecuados: selectores para enums y botones claros para comandos.
- Garantizar navegacion completa por teclado y foco visible.
- Llevar el foco al primer campo invalido o al resumen de error despues de una validacion fallida.
- Exponer cargas y confirmaciones mediante regiones de estado accesibles y errores mediante `role="alert"`.
- No depender exclusivamente del color para estado, error, sede destacada o categoria critica.
- Conservar un orden de foco logico y evitar cambios abruptos de layout.
- Asegurar que etiquetas largas, incluida `Remoto (empleado sin sede fija)`, no desborden sus controles.

## Estrategia de pruebas

### Pruebas automatizadas backend minimas

1. Crear una incidencia valida devuelve `201`, estado `open` y timestamps UTC iguales inicialmente.
2. Cada campo obligatorio ausente o vacio devuelve `400` e identifica el campo.
3. Cada enum invalido en alta o filtros devuelve `400`.
4. El listado vacio devuelve `200` y `[]`.
5. Los cuatro filtros funcionan individualmente y combinados con semantica AND.
6. El detalle existente devuelve `200` y el inexistente `404`.
7. Se aceptan exactamente `open -> in_progress`, `open -> discarded`, `in_progress -> resolved` e `in_progress -> discarded`.
8. Se rechazan transiciones repetidas, retrocesos, saltos y cambios desde estados finales.
9. Una transicion valida conserva `created_at` y modifica `updated_at`.
10. El resumen vacio incluye todas las claves en cero.
11. El resumen calcula correctamente todos los desgloses despues de crear y actualizar datos.
12. Los endpoints nuevos sin JWT o con JWT invalido responden `401` mediante la dependencia existente.
13. Una excepcion simulada responde `500` generico sin stack trace.
14. `/health`, `/analyze` y `/results/export` conservan sus contratos previos.

### Pruebas automatizadas del seed minimas

1. La validacion de cada fila usa la funcion compartida del analizador.
2. Los cinco codigos de categoria se transforman al enum correcto.
3. Los tres estados se transforman al enum correcto.
4. El titulo se recorta y limita a 120 caracteres; uno vacio se descarta.
5. La fecha se convierte a medianoche UTC y se copia a ambos timestamps.
6. Todas las filas insertadas usan `origin: customer` y `branch: central`.
7. Las filas invalidas o no mapeables se omiten y sus motivos se reportan.
8. Una fuente sin cabeceras requeridas falla sin insertar datos parciales de esa ejecucion.
9. La primera ejecucion sobre una base vacia inserta 96 incidencias.
10. La segunda ejecucion inserta cero y mantiene el total en 96.
11. Los conteos por estado y categoria coinciden exactamente con los valores obligatorios.

Las pruebas deben usar una base TinyDB temporal y no modificar los datos locales de desarrollo.

### Pruebas frontend minimas

Si el repositorio dispone de runner frontend, cubrir:

1. Renderizado de todas las opciones exactas de categoria, origen y sede.
2. Estado inicial `open` no editable durante el alta.
3. Validacion local y asociacion de errores a campos.
4. Bloqueo de envios duplicados y limpieza tras exito.
5. Estados de listado cargando, vacio, con datos y error reintentable.
6. Construccion correcta de filtros combinados.
7. Opciones de transicion segun el estado actual.
8. Restauracion del estado visual cuando falla un cambio optimista.
9. Resumen completo, carga y error aislado.
10. Uso del cliente autenticado compartido.

No agregar una libreria de pruebas unicamente para cumplir este apartado si el frontend aun no dispone de runner; en ese caso, ejecutar y documentar la matriz manual completa.

### Matriz manual de extremo a extremo

Con FastAPI y `uis/backoffice` en ejecucion y una base de prueba controlada:

| Caso | Resultado esperado |
|---|---|
| Abrir el gestor sin sesion | Redireccion a `/login`, sin contenido protegido visible |
| Ejecutar el seed por primera vez | Inserta 96 registros validos y reporta descartes |
| Ejecutar el seed por segunda vez | Inserta 0, omite duplicados y conserva 96 registros |
| Consultar resumen tras el seed | Estados y categorias coinciden con los conteos obligatorios |
| Abrir el listado | Muestra los datos y etiquetas legibles |
| Filtrar por `resolved` y `customer` | Solo aparecen incidencias que cumplen ambos filtros |
| Filtrar sin coincidencias | Mensaje informativo, no tabla vacia sin contexto |
| Crear una incidencia valida de Miami | `201`, formulario limpio y nueva incidencia `open` visible |
| Crear con titulo vacio | No envia o recibe `400`; error visible junto al titulo |
| Seleccionar origen `branch` | Sede permanece obligatoria y se destaca de forma accesible |
| Crear una incidencia `remote` | La etiqueta no se confunde con Central ni Valencia Operaciones |
| Cambiar `open` a `in_progress` | Estado y resumen se actualizan tras confirmacion |
| Intentar `open` a `resolved` | `400`; la UI conserva `open` y muestra error claro |
| Resolver una incidencia `in_progress` | Cambia a `resolved` y ya no ofrece nuevas transiciones |
| Simular fallo al cambiar estado | La UI revierte o conserva el estado confirmado y notifica el fallo |
| Simular `500` al cargar listado | Mensaje comprensible y accion de reintento |
| Simular fallo solo en resumen | Formulario y listado siguen utilizables |
| Probar `/api/incidents/analyze` | El analizador previo sigue funcionando autenticado |
| Exportar el ultimo analisis | La descarga CSV previa sigue funcionando |
| Operar Suppliers y autenticacion | Sin regresiones observables |
| Abrir `uis/website` | Continua publica y sin guardas de autenticacion |

## Criterios de aceptacion

- [ ] El modelo contiene exactamente los campos publicos requeridos y usa enums cerrados del dominio Nexova.
- [ ] Las cuatro sedes aparecen con sus valores y etiquetas exactos, incluida `remote`.
- [ ] Una incidencia creada por API nace en `open` y sus timestamps se generan en UTC.
- [ ] El seed reutiliza la validacion del analizador por importacion, sin copiar sus reglas.
- [ ] El seed transforma estados, categorias, titulo, fechas, origen y sede antes de insertar.
- [ ] Los registros invalidos se descartan y se reportan con motivos agrupados.
- [ ] Ejecutar dos veces el seed no duplica registros ni expone `ticket_id` en el modelo o la API.
- [ ] Una base vacia queda con 96 incidencias y los conteos esperados despues del primer seed.
- [ ] `POST /api/incidents` devuelve `201` o errores `400` asociados al campo correcto.
- [ ] `GET /api/incidents` combina filtros exactos por estado, origen, sede y categoria.
- [ ] `GET /api/incidents/{id}` devuelve `404` cuando el registro no existe.
- [ ] `PATCH /api/incidents/{id}/status` acepta solo las cuatro transiciones definidas.
- [ ] Los estados `resolved` y `discarded` son finales.
- [ ] `/api/incidents/summary` incluye total y todos los valores de cada dimension, tambien cuando son cero.
- [ ] Los endpoints nuevos estan protegidos por el Bearer token existente.
- [ ] Ningun error `500` expone trazas o detalles internos al cliente.
- [ ] El formulario valida, bloquea duplicados, muestra errores por campo y se limpia tras el exito.
- [ ] El listado diferencia carga, vacio, datos y error reintentable.
- [ ] Un cambio de estado fallido nunca deja en pantalla un estado no confirmado.
- [ ] El resumen maneja carga y error sin romper el resto del gestor.
- [ ] `/health`, `/analyze` y `/results/export` conservan su comportamiento.
- [ ] Suppliers, autenticacion, Talent Pipeline Tracker y `uis/website` no presentan regresiones.
- [ ] Las validaciones automatizadas y la matriz manual quedan documentadas con resultados observados.

## Restricciones de implementacion

- Mantener FastAPI, TinyDB, Next.js 16, React 19, TypeScript 5 y Tailwind CSS 4.
- No crear APIs fuera de `services/` ni una aplicacion frontend fuera de `uis/`.
- No duplicar la validacion del analizador, el acceso a TinyDB ni el cliente HTTP autenticado.
- No modificar el contrato publico del analizador existente para acomodar el gestor.
- No usar el cliente externo de Talent Pipeline para la API Nexova.
- No agregar campos, enums o sedes genericos que contradigan el contexto de Nexova.
- No modificar `memory-bank/`, `.agents/`, `docs/` o `README.md` sin autorizacion explicita.
- Antes de completar una implementacion futura, solicitar autorizacion para actualizar `memory-bank/progress.md`, ya que el flujo del repositorio lo exige y esa ruta esta protegida.

## Evidencia requerida para el Pull Request

La descripcion del PR de implementacion debe incluir:

1. Resumen del modelo y de las transiciones de estado implementadas.
2. Comando del seed y salida de primera y segunda ejecucion.
3. Evidencia de los 96 registros y de los conteos obligatorios por estado y categoria.
4. Ejemplos de `201`, `400`, `401`, `404` y `500` generico de los endpoints nuevos.
5. Resultado de las pruebas automatizadas de API y seed.
6. Resultado de `npm run lint` y `npm run build` en `uis/backoffice`.
7. Captura del formulario con un error de validacion visible.
8. Captura del listado con datos y filtros aplicados.
9. Captura del resumen con metricas posteriores al seed.
10. Evidencia de reversion o conservacion del estado ante un `PATCH` fallido.
11. Confirmacion de no regresion de analizador, autenticacion, Suppliers, Talent Pipeline Tracker y `uis/website`.