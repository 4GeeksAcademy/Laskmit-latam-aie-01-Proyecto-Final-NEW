# Auditoría de Rendimiento Frontend

## Descripción general del proyecto:

El sitio corporativo y el backoffice de la empresa están casi listos.  El equipo está satisfecho con las funcionalidades, pero hacen falta mejoras de rendimiento, tanto para apoyar un mejor SEO en el sitio corporativo como para asegurar que el backoffice funcione bien para las personas que lo usan a diario. 
Se necesita auditar ambos frontends, identificar qué está arrastrando el rendimiento, aplicar las correcciones necesarias y documentar todo con el rigor que se espera en un codebase profesional.
Esto no se trata de hacer las cosas más bonitas. Se trata de hacerlas rápidas, medibles y mantenibles.
Una buena auditoría de rendimiento sigue un ciclo claro: medir → analizar → corregir → volver a medir. 
Ejecutaremos Lighthouse antes de tocar una sola línea de código, luego revisaremos el codebase para identificar qué puede mejorarse — incluyendo componentes o lógica que aparecen más de una vez y deberían extraerse en unidades reutilizables. Instalaremos un conjunto de skills de agente diseñadas específicamente para guiar la corrección de problemas de web vitals, aplicaremos las correcciones que recomienden, y cerraremos el ciclo con una segunda ejecución de Lighthouse para validar el trabajo realizado.

**Pasos a seguir para la Auditoría de rendimiento — ambos frontends:**
- Ejecutar Lighthouse en el sitio corporativo y en el backoffice. Registrar las puntuaciones iniciales (Performance, Accessibility, Best Practices, SEO).
- Revisar el codebase. Identificar componentes o bloques de lógica que estén duplicados entre archivos y puedan refactorizarse en un componente compartido o un Custom Hook.
- En caso de necesitarlo, instalar alguna de las siguientes skills de agente para guiar el proceso de corrección:
o	core-web-vitals
o	performance
o	web-perf (Cloudflare)
- Aplicar las correcciones que las skills identifiquen como necesarias.
- Entregables:
    1. Un archivo AUDIT.md con el análisis: puntuaciones iniciales, problemas identificados y causa raíz de cada uno.
    2. Un archivo REPORT.md con las mejoras aplicadas y su impacto medido sobre las puntuaciones originales.
    3. Capturas de pantalla de Lighthouse antes y después de los cambios, con commit en el repositorio.

El objetivo no es un 100 perfecto. El objetivo es un ciclo de mejora documentado y basado en evidencia, el cual se debe repetir cada vez que se ponga en producción un frontend.

**¿Qué hace útil una auditoría de Lighthouse?**
Lighthouse analiza una página a la vez — no recorre toda la aplicación. Una sola ejecución en la página de inicio no dice nada sobre el rendimiento de una vista de dashboard con carga intensiva de datos. Al auditar una aplicación con múltiples vistas, ejecuta Lighthouse en las páginas que más importan: aquellas con mayor complejidad visual, más componentes renderizados a la vez, o mayor tráfico de usuarios. En el sitio corporativo suelen ser la home y cualquier página con mucho contenido; en el backoffice, normalmente el dashboard principal o cualquier vista con tablas, gráficos o datos en tiempo real.
Lighthouse entrega cuatro puntuaciones: Performance, Accessibility, Best Practices y SEO. Para un frontend en producción, los benchmarks que más importan son:
    1. Performance ≥ 90 — Por debajo de 50 se considera deficiente y afecta a usuarios reales en redes móviles.
    2. LCP (Largest Contentful Paint) < 2.5s — Tiempo hasta que el contenido principal es visible.
    3. CLS (Cumulative Layout Shift) < 0.1 — Movimiento inesperado del layout durante la carga.
    4. FID / INP (Interaction to Next Paint) < 200ms — Capacidad de respuesta a la interacción del usuario.
    5. TTFB (Time to First Byte) — Tiempo hasta que el servidor empieza a enviar la respuesta HTML.
Un informe completo de Lighthouse puede resultar abrumador las primeras veces — decenas de auditorías, oportunidades y diagnósticos en una sola pantalla. No intentaremos corregir todo de golpe. Una forma práctica de recorrerlo:
    1.	Empezar por los indicadores principales — las cuatro puntuaciones Core Web Vitals más las señales de servidor como TTFB, LCP, CLS e INP. Estos indicadores dicen dónde duele (red, render, layout, interactividad) antes de entrar en cada sub-auditoría.
    2.	Apóyarse en el agente de IA como tutor — pegar o describir una métrica cada vez y preguntar qué mide, qué se considera “bueno” y qué correcciones suelen moverla. Paso a paso: Entender el indicador y luego las acciones recomendadas para nuestro stack (Next.js, imágenes, fuentes, hidratación, etc.).
    3.	Resolver un caso por commit.  Elegir el KPI de mayor impacto, aplicar un cambio dirigido, hacer commit con un mensaje claro, volver a ejecutar Lighthouse en la misma URL y anotar la diferencia. Repetir hasta que los KPI principales estén en rango saludable.
    4.	Después abordar lo complementario — avisos de accesibilidad, best practices, oportunidades de SEO y auditorías de menor prioridad importan, pero después de las métricas que afectan de verdad a usuarios en dispositivos lentos.
Las causas habituales que los estudiantes pasan por alto: imágenes sin optimizar, recursos que bloquean el render, layout shifts por atributos width/height ausentes en imágenes, fuentes cargadas sin display: swap, y problemas de hidratación en Next.js.

Lo primero que hay que hacer:
1.	Abrir Chrome o Brave — Lighthouse está disponible de forma nativa en las DevTools (pestaña Lighthouse).
2.	Tomar las primeras capturas de pantalla antes de modificar nada.

## PASOS QUE VAMOS A SEGUIR:

### PASO 01 - Medición inicial  (Esto lo voy a hacer yo, el humano)

- Ejecutar Lighthouse en el sitio corporativo en modo escritorio y móvil — como mínimo en la página de inicio, más cualquier otra vista que consideres suficientemente compleja para auditar. Registrar las cuatro puntuaciones por página y por modo.
- Ejecutar Lighthouse en el backoffice — como mínimo en el dashboard principal o la vista con más elementos. Registrar las cuatro puntuaciones por página.
- Tomar capturas de pantalla de ambos informes y realizar un commit en la carpeta /audit/before/ del repositorio.
- El agente va a revisar la medición y ver si está completa la información para indicarme en caso de que haya que hacer algo mas.

### PASO 02 - Análisis del código
- Revisar ambos frontends e identificar al menos dos casos en los que un componente o bloque de lógica se repita y pueda extraerse en un componente compartido o un Custom Hook.
- Documentar cada caso en AUDIT.md: dónde aparece, por qué es candidato a refactorización y cómo quedaría la abstracción compartida.
-- Humano revisa y te indica si está conforme para seguir con el proximo paso.

### PASO 03 - Instalación de skills de agente
- En caso de necesitarlo, instalar una o más de las skills de agente indicadas por el CTO:
    -	[https://www.skills.sh/addyosmani/web-quality-skills/core-web-vitals](https://www.skills.sh/addyosmani/web-quality-skills/core-web-vitals)
    -	[https://www.skills.sh/addyosmani/web-quality-skills/performance](https://www.skills.sh/addyosmani/web-quality-skills/performance)
    -	[https://www.skills.sh/cloudflare/skills/web-perf](https://www.skills.sh/cloudflare/skills/web-perf)
- Ejecutar el agente sobre ambos frontends y registrar las correcciones que identifica.

### PASO 04 - Correcciones
- Priorizar los KPI principales (TTFB, LCP, CLS, INP, puntuación de Performance) antes que auditorías secundarias de Lighthouse; usar el agente para interpretar un indicador cada vez.
- Aplicar correcciones de forma incremental — un problema por commit, y volver a ejecutar Lighthouse en la misma URL tras cada cambio para confirmar el impacto.
- Aplicar las correcciones que las skills de agente clasifiquen como correcciones requeridas (no sugerencias).
- Aplicar las refactorizaciones identificadas durante el análisis del código — extraer al menos un componente reutilizable o Custom Hook.

### PASO 05 - Medición final
[ ] Vuelve a ejecutar Lighthouse en ambos frontends tras las correcciones.
[ ] Toma nuevas capturas de pantalla y realiza un commit en /audit/after/.

## Resúmen de Entregables
- AUDIT.md con: puntuaciones iniciales de Lighthouse, problemas identificados con explicación de causa raíz para cada uno, y el análisis de refactorización.
- Escribe REPORT.md con: descripción de cada corrección aplicada, comparativa de puntuaciones antes/después, y tu valoración de qué tuvo mayor impacto.
- Realizar un commit de ambos archivos markdown y todas las capturas de pantalla en el repositorio.

**IMPORTANTE:** No reestructurar la arquitectura de ninguno de los frontends para pasar esta auditoría. Aplica correcciones dirigidas. El objetivo es la mejora, no una reescritura.

## Verificación del trabajo efectuado - lo que se evalúa

- Lighthouse se ejecutó en ambos frontends antes y después, con capturas de pantalla con commit en el repositorio.
- AUDIT.md identifica problemas concretos con razonamiento sobre causa raíz — no solo una lista de lo que Lighthouse marcó.
- Al menos un componente reutilizable o Custom Hook fue extraído e integrado en el codebase.
- REPORT.md muestra una mejora medible en al menos una puntuación de Lighthouse por frontend.
- Si se instalaron skills de agente, hay evidencia de su uso en el proceso de corrección.
- Las correcciones aplicadas atacan causas reales (optimización de imágenes, layout shift, problemas de hidratación) y no cambios superficiales que inflan las puntuaciones sin resolver el problema subyacente.
- La calidad del código se mantiene tras la refactorización — sin funcionalidades rotas ni regresiones.

**Nota importanto:** Obtener una puntuación de 100 no es un criterio de evaluación. La mejora basada en evidencia y la calidad del análisis sí lo son.
