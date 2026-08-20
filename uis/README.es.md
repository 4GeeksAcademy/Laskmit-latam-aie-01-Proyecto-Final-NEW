# Carpeta `uis`

Esta carpeta contiene **todas las interfaces de usuario** relacionadas con la compañía para el proyecto transversal de AI Engineering (por ejemplo: aplicaciones web, dashboards internos, portales de clientes, apps de Streamlit/Gradio, etc.).

Cada subcarpeta dentro de `uis/` debe corresponder a **una interfaz de usuario concreta** e incluir su propia documentación técnica y funcional.

---

## Proyectos actuales en `uis/`

| Proyecto | Carpeta | Tecnología | Hito | Descripción |
|---|---|---|---|---|
| **Web Corporativa** | `website/` | Next.js + TypeScript | Hito 1 + Hito 4 | Landing pública de Nexova con formulario de registro de talento |
| **Backoffice Interno** | `backoffice/` | Next.js + TypeScript | Hito 4 + Sin Hito 02 | Dashboard interno con lógica de negocio, directorio de proveedores |
| **Talent Pipeline Tracker** | `talent-pipeline-tracker/` | Next.js + TypeScript | Hito 3 | Gestión de candidaturas con filtros, detalle y notas internas |
| **Incidents Analyzer** | `incidents-analyzer/` | HTML + CSS + JS | Sin Hito 01 | UI para cargar CSV de incidencias y visualizar resultados |

---

## Recomendaciones

- Documenta en este archivo (o en sub-READMEs) las aplicaciones que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlas.
- Cada subcarpeta debe tener su propio `README.md` con instrucciones de ejecución y prueba.
