# SPECS — Hito 01 (Web Fundamentals)

## Estructura de carpetas/archivos
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/
├── index.html
├── application.html
├── styles.css
└── validation.js
```

## Paginas
- `index.html`
  - Landing publica de Nexova.
  - Incluye metadatos SEO y OpenGraph.
  - Incluye Schema.org (`Organization`, `WebSite`, `ProfessionalService`).
- `application.html`
  - Formulario de registro de talento.
  - Contiene mensaje para empresas: contacto por email.

## Funciones y logica clave
En `validation.js`:
- Inicializacion DOM y binding de eventos (`DOMContentLoaded`).
- `validateField(name)` para validacion por campo.
- `validateAll()` para validacion integral al enviar.
- `showAccumulatedErrors(errors)` para resumen de errores.
- `updateCommentsCounter()` para contador de 500 caracteres.
- Simulacion de envio correcto y redireccion al inicio.

## Reglas funcionales implementadas
- Validaciones especificas por cada campo obligatorio.
- Matching de formatos para email/telefono/linkedin.
- Control de comentarios maximo 500.
- Mensaje de exito al completar validaciones.

## APIs
- No aplica (hito frontend estatico sin backend).

## Criterios de reconocimiento rapido
- Existen dos HTML separados (landing + formulario).
- El formulario tiene validaciones en JS y mensajes de error por campo.
- Hay JSON-LD embebido en la landing.
