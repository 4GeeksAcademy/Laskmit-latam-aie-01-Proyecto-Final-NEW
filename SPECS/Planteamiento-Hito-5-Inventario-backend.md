# Hito 5 — Backend: Gestión de Inventario con ORM y Doble Base de Datos


Antes de empezar: Lee el archivo CONTEXT-Hito-5-Inventario-backend-nexova.md antes de escribir ningún código — define las entidades específicas, los nombres de campos y las restricciones de negocio para la implementación.

## Descripción del Proyecto:

Ya tenemos lista la API y la capa de autenticación bajo services/. 
La empresa necesita un sistema centralizado de gestión de inventario antes de la próxima revisión operativa.
La decisión arquitectónica que condiciona todo lo que construiremos aquí: 
    -la autenticación permanece en TinyDB (búsquedas rápidas, locales y basadas en documentos)
    - todos los datos de negocio — productos, órdenes de entrada y órdenes de salida — se mueven a Supabase (una base de datos PostgreSQL alojada en la nube). 
    - La aplicación FastAPI mantendrá dos conexiones de base de datos simultáneas y deberá usarlas de forma deliberada: cada petición llega al almacén correcto.
Esto no es solo un ejercicio de persistencia. El equipo de operaciones incluyó una restricción no negociable en el brief:
    "Los niveles de stock no se pueden modificar directamente. La única forma de cambiar el inventario es registrando una orden — ya sea una orden de entrada que añade stock, o una orden de salida que lo reduce. Cada orden debe ser trazable al usuario que la creó."
El trabajo es hacer cumplir esa regla a nivel de API y de modelos, usando un ORM para traducir clases Python en tablas relacionales en Supabase. Todos los endpoints de inventario deben agruparse bajo el prefijo de router /inventory.

## ¿Qué es un ORM y por qué importa aquí?
Un ORM (Object-Relational Mapper) es una capa de traducción: una clase Python se convierte en una tabla, una instancia en una fila y un atributo en una columna. No reemplaza conocer SQL — entender lo que el ORM genera por debajo es lo que permite usarlo correctamente y depurar errores cuando algo falla. En este hito usaremos SQLModel, que combina el motor ORM de SQLAlchemy con el sistema de tipos de Pydantic. No usaremos SQLAlchemy directamente.

## Problema a tomar en cuenta:
Antes de escribir cualquier consulta, debes conocer el problema N+1. Si cargas una lista de órdenes y después accedes a los datos del producto de cada una dentro de un bucle, generas una consulta adicional por elemento — degradando el rendimiento de forma silenciosa. Estructura tus consultas para cargar los datos relacionados desde el inicio, no en el momento del acceso.

## Arquitectura de doble base de datos + ORM de inventario:
El PRD está listo. Esto es lo que debe hacer el sistema:
1.	La aplicación FastAPI conecta a dos bases de datos simultáneamente: TinyDB (existente, para usuarios y autenticación) y Supabase (nueva, para inventario y órdenes).
2.	Los productos y el stock viven en Supabase. El stock no debe ser una columna editable directamente — siempre se deriva del historial de órdenes.
3.	Las órdenes de entrada incrementan el stock; las órdenes de salida lo reducen. Ambas se almacenan en Supabase y referencian el UUID del usuario de TinyDB — ninguna tabla de usuarios se replica en Supabase.
4.	Los modelos ORM usan SQLModel. Los schemas Pydantic para request y response están en un archivo separado de los modelos ORM — nunca devuelvas un objeto ORM directamente desde un endpoint.
5.	Todas las rutas de inventario deben registrarse bajo el prefijo /inventory usando un APIRouter dedicado.
6.	Revisa el CONTEXT-Hito-5-Inventario-backend-nexova.md — los nombres de entidades, las restricciones de campos y las reglas de negocio son específicas de la empresa Nexova.

Criterios de aceptación: todos los endpoints funcionales bajo /inventory, relaciones FK aplicadas a nivel de base de datos, sin mutación directa de stock, ambas conexiones activas y usadas correctamente.

## Los directorios a usar:
- Navega a services/ — tu aplicación FastAPI con auth TinyDB debería vivir ya aquí.
- Instala las nuevas dependencias:
    uv add sqlmodel psycopg2-binary
- Añade tu cadena de conexión de Supabase a .env. Deja intacta la configuración TinyDB de auth — no la modifiques.
- Lee el CONTEXT-company.md antes de definir cualquier modelo — los nombres de entidades y las restricciones de campos están especificados allí.

## Conexión con Supabase
En el panel de Supabase (Connect → Direct), elegiremos Transaction pooler como método de conexión y URI como tipo — luego copiaremos esa cadena en DATABASE_URL.
 
## Detalle de lo que vamos a hacer por área:

**Configuración de bases de datos**
[ ] Añade la cadena de conexión PostgreSQL de Supabase a .env. Nunca escribas credenciales directamente en el código.
[ ] En database.py (o equivalente), inicializa ambas conexiones de base de datos: el cliente TinyDB existente y el nuevo motor SQLModel apuntando a Supabase.
[ ] Crea una dependencia get_db que produzca una sesión SQLModel por petición mediante Depends(). No uses variables de sesión globales.

**Modelos ORM — models.py**
[ ] Define la entidad equivalente al producto del CONTEXT xxxxx.md (p. ej. Ingredient, SKU, Asset, MedicalSupply) con SQLModel, table=True, con al menos: id, name, sku y cualquier campo específico del CONTEXT xxxxx.md
[ ] Define el modelo equivalente a entrada (p. ej. IngredientEntry, StockEntry) con: id, una FK a la entidad equivalente a producto (ingredient_id / sku_id / ... según CONTEXT.md), quantity, created_at, user_uuid (cadena — referencia al usuario de TinyDB; sin FK, sin replicación de tabla de usuarios), y cualquier otro campo que CONTEXT.md exija.
[ ] Define el modelo equivalente a salida (p. ej. IngredientExit, StockExit) con el mismo patrón de FK, más quantity, created_at, user_uuid y los campos que CONTEXT.md exija.
[ ] Llama a SQLModel.metadata.create_all(engine) al inicio de la aplicación para inicializar el esquema en Supabase.

**Schemas Pydantic — schemas.py**
[ ] Define schemas de request y response para las entidades equivalentes a producto, entrada y salida como modelos Pydantic independientes — separados de los modelos ORM. Usa los nombres de CONTEXT.md.
[ ] El schema de respuesta de la entidad equivalente a producto debe incluir un campo current_stock (calculado, no almacenado).
[ ] Los modelos ORM y los schemas Pydantic deben estar en archivos separados. Son clases distintas, aunque algunos campos coincidan.

**Router de inventario — routers/inventory.py**
[ ] Crea un APIRouter dedicado con prefix="/inventory" y regístralo en la aplicación FastAPI principal.
[ ] Implementa los siguientes endpoints dentro de este router:

    **Método	Ruta	Descripción**
    GET	/inventory/products	Lista todos los productos con current_stock calculado
    POST	/inventory/products	Crea un producto (requiere autenticación)
    GET	/inventory/products/{id}	Obtiene un producto con su stock actual
    POST	/inventory/orders/inbound	Registra una orden de entrada (requiere autenticación)
    POST	/inventory/orders/outbound	Registra una orden de salida (requiere autenticación)
    GET	/inventory/orders	Lista todas las órdenes con datos del producto y user_uuid

**Reglas de negocio**
[ ] current_stock se calcula siempre como SUMA(cantidades de entradas) - SUMA(cantidades de salidas) para cada entidad equivalente a producto, acotado por cualquier clave de partición que defina tu CONTEXT.md (p. ej. warehouse). Nunca se almacena como una columna que pueda modificarse directamente.
[ ] Una entidad equivalente a producto comienza con stock cero al crearse y solo puede acumular stock a través de registros de entrada.
[ ] Cada endpoint de creación de órdenes requiere autenticación. El UUID del usuario autenticado (de TinyDB) debe almacenarse en el campo user_uuid de la orden.
[ ] Un registro de salida que resultaría en stock negativo (dentro del alcance que define CONTEXT.md) debe rechazarse antes de persistir el registro, devolviendo HTTP 400 con un mensaje de error descriptivo.

**IMPORTANTE:** Los nombres de entidades, nombres de campos y valores específicos del dominio en tu implementación deben coincidir con lo especificado en el CONTEXT.md. Una implementación genérica que ignore el contexto no será aceptada.

**Datos semilla**
[ ] Siembra las tablas de inventario con los registros mínimos listados en el CONTEXT.md (equivalentes a producto, entradas y salidas) antes de la demo. El stock sembrado debe coincidir con neto entradas – salidas.

## Verificación de lo elaborado - lo que se va a evaluar
[ ] Dos conexiones de base de datos están presentes y se usan correctamente: TinyDB para autenticación y consultas de usuario; Supabase (SQLModel) para todas las entidades de inventario.
[ ] Todos los endpoints de inventario están agrupados bajo /inventory mediante un APIRouter dedicado.
[ ] Los modelos ORM SQLModel declaran correctamente las relaciones FK: los modelos de entrada/salida referencian la entidad equivalente a producto nombrada en CONTEXT.md (no un Product genérico salvo que CONTEXT.md lo diga).
[ ] current_stock se calcula a partir de órdenes — ningún endpoint permite modificar directamente un campo de stock en la entidad equivalente a producto.
[ ] El cálculo de stock respeta el alcance de CONTEXT.md (global vs por partición / por warehouse cuando aplique).
[ ] Un registro de salida que supera el stock disponible (dentro de ese alcance) se rechaza con HTTP 400 antes de que ocurra cualquier escritura.
[ ] Cada orden almacena el user_uuid del creador autenticado (obtenido de TinyDB).
[ ] Los modelos ORM (models.py) y los schemas Pydantic (schemas.py) están en archivos separados y son estructuralmente distintos — ningún endpoint devuelve un objeto SQLModel directamente.
[ ] La sesión SQLModel se inyecta por petición mediante Depends() — no existe ninguna sesión global en el código.
[ ] Todos los parámetros de conexión están en .env; .env aparece en .gitignore.
[ ] Los nombres de entidades y campos coinciden con la especificación del CONTEXT.md del estudiante.
[ ] Los datos semilla de CONTEXT.md están presentes; GET /inventory/products refleja el stock neto de esas semillas.

