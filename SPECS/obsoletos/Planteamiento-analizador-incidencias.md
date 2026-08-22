## CONTEXTOS DE REFERENCIA:
Ver archivo: CONTEXT-sin-hito-analizador-incidencias-nexova.es
Los CAMPOS EN EL CSV (separados por comas) son:
ticket_id,date,client_company,category,description,agent_id,status,customer_email,satisfaction_score

## OBJETIVO:
El departamento de atención postventa de tu empresa gestiona las incidencias de sus clientes: quejas, solicitudes, fallos operativos. Acaban de preparar un fichero CSV con 100 registros extraídos de su sistema — la primera muestra de un volumen real de datos que podría alcanzar el millón de líneas.
Tu responsable técnico ha decidido proceder en dos fases. Primero, un script en Python para validar rápidamente que el proceso de análisis funciona sobre los 100 registros de prueba. Si el resultado es correcto, el script se ejecutará sobre el fichero de producción completo. Una vez confirmado que la lógica es sólida, la funcionalidad se integrará en la plataforma que tu empresa ya está construyendo: una API en el backend y una interfaz web desde la que el equipo pueda cargar el fichero, consultar el resumen y exportar los resultados.
Nota de tu responsable técnico: "Empieza por el script — necesitamos confirmar que la lógica de validación y el cálculo de métricas son correctos antes de construir nada encima. Cuando el script funcione y los números cuadren con los valores esperados del CONTEXT, pásalo a la API y monta la interfaz. El objetivo final es que cualquier persona del departamento pueda subir el fichero desde el navegador, ver el resumen en pantalla y descargarlo en CSV sin tocar la terminal."

**¿Qué es un registro incompleto o corrupto?**

Los datos reales siempre tienen problemas. Para este proyecto, un registro se considera inválido si le falta al menos uno de los campos obligatorios definidos en tu CONTEXT, o si contiene un valor en un campo que no está dentro del conjunto de valores permitidos (estados y categorías). La lógica debe detectarlos, contarlos y excluirlos del análisis principal — pero nunca ignorarlos en silencio.

## Fase 1 — Script de análisis (/scripts)

- Crea el script principal (analyze.py) que acepte como argumento la ruta al fichero CSV: python analyze.py incidents-COMPANY.csv. 
- El script debe cargar y leer el fichero (con lectura nativa o pandas, a tu elección). 
- Detecta y contabiliza los registros inválidos. Detalla cuántos hay y por qué tipo de problema (campo faltante, valor fuera de rango, etc.).
- Calcula las siguientes métricas sobre los registros válidos:
•	Cantidad total de elementos procesados (válidos e inválidos por separado).
•	Totalización por categoría de incidencia.
•	Totalización por estado (abierto, cerrado, descartado — o sus equivalentes en tu CONTEXT).
•	Índice de satisfacción medio en los casos con estado cerrado que tengan puntuación registrada.
- Imprime el resumen por consola en un formato legible: usa separadores, etiquetas claras y alineación.
- Al final de la ejecución, pregunta al usuario: ¿Deseas exportar los resultados a CSV? [s / n]. Si elige s, guarda los resultados en results.csv (una fila por métrica).
- Verifica que los resultados coinciden exactamente con los valores esperados de tu CONTEXT.

## Fase 2 — Integración en la plataforma (Esta fase no la hagas hasta que yo te pida que la desarrolles)

Una vez validada la lógica del script, extrae esa misma lógica a servicios reutilizables e intégrala en el sistema.

**Backend (/services/api)**
- Crea un endpoint POST /api/incidents/analyze que acepte un fichero CSV como multipart/form-data.
- El endpoint debe ejecutar la misma lógica de validación y análisis que el script y devolver el resumen en JSON.
- Crea un endpoint GET /api/incidents/results/export que devuelva el último análisis en formato CSV descargable.
- Los errores (fichero vacío, formato incorrecto) deben devolver respuestas HTTP apropiadas con mensaje descriptivo.

**Frontend (/uis/backoffice)**
- Crea una página de análisis de incidencias accesible desde el menú de la aplicación. 
- Incluye un componente de carga de fichero (drag & drop o selector) que envíe el CSV al endpoint de la API. 
- Muestra el resumen de resultados en pantalla: métricas generales, desglose por categoría, desglose por estado e índice de satisfacción. 
- Incluye un botón para descargar los resultados en CSV. 
- Informa al usuario si el fichero contiene registros inválidos y cuántos son de cada tipo. 

**IMPORTANTE**: Los nombres de campos, categorías, estados y valores esperados en tu implementación deben coincidir exactamente con lo especificado en tu CONTEXT.md. Una implementación genérica que ignore el contexto de tu empresa no será aceptada.
________________________________________
✅ Qué vamos a evaluar
Script
- Acepta la ruta al CSV como argumento y funciona sin modificar el código.
- Detecta, clasifica y muestra los registros inválidos con su tipo de problema.
- Las cinco métricas requeridas aparecen en la salida de consola con formato legible.
- La exportación a CSV funciona y produce un fichero bien estructurado.
- Los resultados coinciden exactamente con los valores esperados del CONTEXT.
Backend
- El endpoint de análisis acepta el CSV, lo procesa y devuelve el resumen en JSON.
- El endpoint de exportación devuelve un CSV descargable correctamente formateado.
- Los errores de entrada devuelven códigos HTTP apropiados.
Frontend
- El fichero puede cargarse desde la interfaz sin usar la terminal.
- El resumen se muestra en pantalla de forma clara e interpretable.
- El botón de exportación descarga el CSV de resultados.
- Los registros inválidos se comunican al usuario de forma comprensible.
Transversal
- La lógica de análisis y validación es la misma en el script y en la API — no está duplicada sino extraída a funciones o módulos compartidos. 
- El código está organizado según la estructura de carpetas del monorepo. 
________________________________________
## Cómo entregar este proyecto

El proyecto debe estar organizado en el monorepo de la siguiente forma:
scripts/
  analyze.py              ← script de análisis (Fase 1)
  incidents-COMPANY.csv   ← fichero de prueba (adjunto, ver CONTEXT)

services/
  api/                    ← backend con los endpoints de análisis y exportación

uis/
  incidents-analyzer/     ← interfaz web con carga de fichero y visualización

