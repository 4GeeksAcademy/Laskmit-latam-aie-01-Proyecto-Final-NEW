# Carpeta `scripts`

Esta carpeta contiene **scripts auxiliares** del monorepo: automatizaciones de desarrollo, utilidades de mantenimiento, tareas repetitivas (setup, lint, migraciones, generación de datos, etc.) y tooling interno.

- **Propósito principal**: agrupar herramientas de soporte que no pertenecen a una app/agente/pipeline específico, pero facilitan el trabajo del equipo.
- **Recomendación**: documenta cada script (qué hace, parámetros, requisitos, ejemplos de uso) y procura que sean reproducibles (y seguros) en distintos entornos.

## SCRIPT para Analizador de Incidentes - Fase 1:

Para correrlo ejecutar los siguientes comandos:

```
cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/scripts
python analyze.py ../data/raw/incidents-nexova.csv
```

El archivo CSV fuente (`incidents-nexova.csv`) está en `data/raw/`.
Los resultados exportados se guardan en `data/process/results.csv`.
