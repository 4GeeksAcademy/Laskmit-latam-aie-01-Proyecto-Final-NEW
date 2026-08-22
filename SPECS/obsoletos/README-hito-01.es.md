# README — Hito 01 (Web Fundamentals)

## Estado del hito
Implementado como sitio web estatico de Nexova con:
- Landing corporativa.
- Formulario de talento en pagina separada.
- Validaciones del formulario en JavaScript.
- SEO basico y marcado Schema.org.
- Estilos responsive con Tailwind CDN + CSS propio.

## Que se hizo en el proyecto
- Se construyo la landing principal en `index.html` con las secciones pedidas (header, hero, servicios, por que Nexova, contacto, footer).
- Se agrego pagina de formulario en `application.html`.
- Se implementaron validaciones en cliente en `validation.js`:
  - nombre con al menos dos palabras
  - email valido
  - telefono con codigo de pais
  - experiencia entre 0 y 50
  - linkedin opcional con URL valida
  - comentarios maximo 500
  - checkbox de politica obligatorio
- Se incluyo el JSON-LD de organizacion en `index.html`.

## Como correrlo
Opcion 1 (recomendada):
1. `cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final`
2. `python -m http.server 5500`
3. Abrir `http://localhost:5500`
4. Navegar a `http://localhost:5500/application.html` para probar el formulario.

Opcion 2:
- Abrir directamente `index.html` y `application.html` en navegador.

## Como probar que funciona
- Verificar que la landing carga correctamente y es responsive.
- Probar envio del formulario vacio: deben mostrarse errores por campo.
- Probar datos validos: debe mostrarse mensaje de exito y redireccion.
- Probar comentarios >500 caracteres: debe aparecer el error correspondiente.
- Verificar en el HTML principal que existe el bloque `application/ld+json`.

## Archivos principales del hito
- `index.html`
- `application.html`
- `styles.css`
- `validation.js`
