# Evidencia pruebas efectuadas - centralized-incident-manager

## Indicadores en panel de resumen luego de la ejecución del seed
Se nota que está de acuerdo a lo indicado en el contexto de la empresa
![alt indicadores correctos luego de la carga del histórico](image.png)

## Segunda corrida del seed para demostrar que no se registran las incidencias duplicadas:
**Comando para correr el seed nuevamente:**
   PYTHONPATH=. uv --project services/api run python scripts/seed_incidents.py
**Resultado de la corrida:**
Installed 1 package in 17ms
Filas leidas: 100
Filas validas: 96
Filas insertadas: 0
Filas omitidas: 96
Filas descartadas: 4
Motivos de descarte:
- closed_without_score: 1
- invalid_category: 1
- invalid_email: 1
- missing_client_company: 1

## Muestra de los estados permitidos para cambiar
Abierta: notar los botones para cambiar a estados en progreso, descartada.
Resuelta o Descartada: no se muestran botones para cambio
![alt Botones que aparecen en cada caso de estado](image-1.png)

## Prueba de Filtros
Se filtra por estado abiertas y solo categoria error de Proceso
![alt filtrado selecciona correctamente](image-2.png)

## Creación de una nueva incidencia
Datos introducidos:
![alt registro de una nueva incidencia - datos](image-3.png)

En el listado se aprecia la incidencia que acaba de crearse.  Queda automáticamente en Abierta
![alt Incidencia Abierta](image-4.png)

## Cambio de Estado a la incidencia
Se hizo cambio de estado desde Abierta, a En Progreso
![alt incidencia ahora está en Progreso](image-5.png)
Nótese que ahora puede ser cambiada a Resuelta o a Descartada porque está en Progreso

## Filtrando por Sede, ahora sale la incidencia que acabamos de crear en Miami
![alt es la única incidencia en la sede de Miami](image-6.png)

## Botón LIMPIAR FILTROS, vuelve a mostrar todas las incidencias
![alt se limpiaron los filtros](image-7.png)

## Actividad en NETWORK al solicitar filtros - notese que se buscan las abiertas
![alt busqueda de abiertas en Network](image-8.png)

## Actividad en NETWORK al llamar a la API sin filtros - se buscan todas
![alt lista todas las incidencias](image-9.png)

## Formulario de registro de incidencia mostrando error de validación
![alt se trata de registrar sin el título](image-10.png)

## Puerto se coloca con visibilidad privada para que falle la llamada a la API
![alt no puede mostrar las incidencias y emite el error](image-11.png)

## Talent Pipeline sigue funcionando correctamente como antes
![alt sin alteraciones de funcionamiento](image-13.png)

## Panel interno de Talent Pipeline sigue funcionando igual
![alt sin alteraciones de funcionamieto](image-15.png)

## Suppliers sigue funcionando correctamente como antes
![alt sin alteraciones de funcionamiento](image-14.png)

## Sitio web público funcionando correctamente
![alt funcionando libre de autenticación](image-16.png)

