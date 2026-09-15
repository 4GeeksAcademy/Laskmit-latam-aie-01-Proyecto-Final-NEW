# Auditoría de Rendimiento Frontend — Informe inicial (PASO 01)

> **Fecha de medición:** 2026-09-11 / 2026-09-12
> **Herramienta:** Google Lighthouse 13.4.1 (DevTools)
> **Entorno:** Entorno de desarrollo (GitHub Codespaces)
> **Propósito:** Medición inicial antes de aplicar correcciones (PASO 01 del plan de auditoría)

---

## Resumen de puntuaciones

### Website (Sitio corporativo público)

| Modo | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| **Desktop** | **96** 🟢 | 100 | 100 | **60** 🟡 |
| **Móvil** | **80** 🟡 | 100 | 100 | **54** 🟡 |

### Backoffice (Panel inicial)

| Modo | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| **Desktop** | **42** 🔴 | 100 | 100 | **60** 🟡 |
| **Móvil** | **33** 🔴 | 100 | 100 | **60** 🟡 |

> **🟢 Excelente (90-100) | 🟡 Regular (50-89) | 🔴 Deficiente (0-49)**

---

## Métricas principales (Core Web Vitals)

### Website Desktop
| Métrica | Valor | Score | Evaluación |
|---------|-------|-------|------------|
| **FCP** | 1.0 s | 0.85 | 🟢 Bueno |
| **LCP** | 1.0 s | 0.94 | 🟢 Excelente |
| **TBT** | 10 ms | 1.00 | 🟢 Excelente |
| **CLS** | 0 | 1.00 | 🟢 Excelente |
| **SI** | 1.2 s | 0.92 | 🟢 Bueno |
| **TTI** | 1.7 s | 0.98 | 🟢 Excelente |

### Website Móvil
| Métrica | Valor | Score | Evaluación |
|---------|-------|-------|------------|
| **FCP** | 2.7 s | 0.58 | 🟡 Regular |
| **LCP** | 2.7 s | 0.84 | 🟡 Regular |
| **TBT** | 470 ms | 0.61 | 🟡 Regular |
| **CLS** | 0 | 1.00 | 🟢 Excelente |
| **SI** | 2.7 s | 0.96 | 🟢 Bueno |
| **TTI** | 6.9 s | 0.54 | 🔴 Lento |
| **Max FID** | 240 ms | 0.54 | 🔴 Alto (>200ms) |

### Backoffice Desktop
| Métrica | Valor | Score | Evaluación |
|---------|-------|-------|------------|
| **FCP** | 0.8 s | 0.94 | 🟢 Bueno |
| **LCP** | **4.5 s** | **0.12** | 🔴 **Crítico** |
| **TBT** | **1,090 ms** | **0.04** | 🔴 **Crítico** |
| **CLS** | 0 | 1.00 | 🟢 Excelente |
| **SI** | 2.8 s | 0.32 | 🔴 Deficiente |
| **TTI** | 4.5 s | 0.50 | 🔴 Lento |
| **Max FID** | **1,140 ms** | **0** | 🔴 **Crítico** |

### Backoffice Móvil
| Métrica | Valor | Score | Evaluación |
|---------|-------|-------|------------|
| **FCP** | 2.7 s | 0.58 | 🟡 Regular |
| **LCP** | **22.9 s** | **0** | 🔴 **Crítico** |
| **TBT** | **4,540 ms** | **0** | 🔴 **Crítico** |
| **CLS** | 0 | 1.00 | 🟢 Excelente |
| **SI** | 8.0 s | 0.21 | 🔴 Deficiente |
| **TTI** | **23.0 s** | **0.01** | 🔴 **Crítico** |
| **Max FID** | **4,570 ms** | **0** | 🔴 **Crítico** |

---

## Problemas identificados y análisis de causa raíz

### 1. Website — SEO bajo en Desktop (60) y Móvil (54)

**Problema:** La página está bloqueada para indexación mediante `x-robots-tag: noindex, nofollow`.

**Causa raíz:** El encabezado HTTP `X-Robots-Tag: noindex, nofollow` está siendo enviado por el servidor (posiblemente configurado en el entorno de desarrollo Codespaces). Además, en móvil `robots.txt` no es válido.

**Impacto:** Los motores de búsqueda no pueden indexar la página, lo que anula cualquier esfuerzo de SEO. Esto es esperable en un entorno de desarrollo, pero debe revisarse antes de producción.

---

### 2. Website Móvil — JavaScript no utilizado (score 0, 391 KiB ahorro potencial)

**Problema:** Lighthouse detecta 391 KiB de JavaScript que se envía al navegador pero nunca se ejecuta.

**Causa raíz:** Next.js genera bundles que incluyen código de toda la aplicación, incluso de rutas que no se visitan. Esto es común en aplicaciones Next.js donde `next/dynamic` y `React.lazy` no se han aplicado para dividir el código por ruta.

**Impacto:** Aumenta el tiempo de descarga y parseo, contribuyendo al alto TBT (470 ms) y TTI (6.9 s) en móvil.

---

### 3. Website Móvil — Render-blocking requests (score 0, 1,330 ms ahorro potencial)

**Problema:** Recursos externos (JavaScript y CSS) están bloqueando el renderizado inicial de la página.

**Causa raíz:** El HTML carga hojas de estilo y scripts de forma síncrona en el `<head>`. En un proyecto Next.js, esto suele deberse a imports globales de CSS sin optimizar o a la inclusión de scripts de terceros (Kaspersky) en el render path crítico.

**Impacto:** La página tarda 1.3 segundos adicionales antes de que el navegador pueda pintar el primer contenido.

---

### 4. Website Móvil — Ejecución de JavaScript elevada (bootup-time score 0, 1.4 s; main-thread work score 0, 2.7 s)

**Problema:** El hilo principal está ocupado durante 2.7 segundos procesando JavaScript.

**Causa raíz:** Los bundles generados por Next.js incluyen React, ReactDOM y otras dependencias pesadas. La carga combinada de evaluación y ejecución satura el hilo principal, especialmente en dispositivos móviles con menor capacidad de CPU.

**Impacto:** El alto TBT (470 ms) y TTI (6.9 s) en móvil afectan directamente la experiencia de usuario y la puntuación INP (Interaction to Next Paint).

---

### 5. Backoffice Desktop — LCP extremadamente lento (score 0.12, 4.5 s)

**Problema:** El Largest Contentful Paint tarda 4.5 segundos.

**Causa raíz:** El desglose del LCP muestra un TTFB de 326 ms pero un retardo de renderizado del elemento (elementRenderDelay) de 4,165 ms. El elemento LCP es un párrafo de texto (`<p>`) dentro del header, cuyo contenido depende de lógica de negocio importada (`src/utils/...`). La causa más probable es que la hidratación del componente es lenta porque hay JavaScript ejecutándose en el hilo principal que retrasa la renderización del contenido visible.

**Causas adicionales:**
- El LCP es texto dependiente de lógica asíncrona (fetch a `/auth/me` con 4.4 s)
- Recursos bloqueantes (render-blocking insight: 320 ms ahorrables)

**Impacto:** La página se ve vacía durante más de 4 segundos antes de que aparezca el contenido principal. Esto incumple el benchmark de LCP < 2.5 s.

---

### 6. Backoffice Desktop — TBT crítico (score 0.04, 1,090 ms)

**Problema:** El tiempo total de bloqueo es de más de 1 segundo.

**Causa raíz:** Ejecución excesiva de JavaScript en el hilo principal. El bundle `main-app.js` de Next.js se carga sin code-splitting adecuado y contiene bibliotecas grandes. Se detectan **59 KiB de JavaScript no utilizado**. El alto Max FID (1,140 ms) confirma que el hilo principal se bloquea durante más de un segundo, haciendo la página no respondida a interacciones tempranas.

**Impacto:** Cualquier clic o interacción dentro del primer segundo (o más) no tendrá respuesta inmediata.

---

### 7. Backoffice Desktop — Speed Index deficiente (score 0.32, 2.8 s)

**Problema:** La velocidad con la que se pinta el contenido visible es baja.

**Causa raíz:** Combinación de LCP lento (4.5 s), render-blocking resources, y ejecución de JS pesada. La página se pinta progresivamente demasiado lento.

---

### 8. Backoffice Móvil — LCP crítico (22.9 s, score 0)

**Problema:** El contenido principal tarda más de 22 segundos en aparecer.

**Causa raíz:** El desglose del LCP muestra TTFB de 458 ms (aceptable) pero un **elementRenderDelay de 4,761 ms**. La causa principal es:
- Fetching a `/auth/me` en el backoffice que tarda ~5.1 s en completarse (visible en la cadena de red)
- El renderizado del componente se bloquea hasta que la respuesta del endpoint de autenticación esté disponible
- Además, hay render-blocking resources que añaden ~1.3 s de retraso
- Múltiples conexiones a servicios de terceros (Kaspersky) con long-polling que alargan la cadena de carga

**Impacto:** Experiencia de usuario inaceptable en dispositivos móviles. La página no muestra el dashboard hasta después de 23 segundos.

---

### 9. Backoffice Móvil — TBT y ejecución de hilo principal críticos

**Problema:** TBT de 4,540 ms (score 0), main-thread work de 6.8 s (score 0), bootup-time de 5.4 s (score 0).

**Causa raíz:** El JavaScript de Next.js (bundles de react, react-dom, componentes) es demasiado pesado para un dispositivo móvil con CPU limitada. No hay lazy-loading ni code splitting aplicados a los componentes del dashboard.

**Impacto:** La página es completamente no interactiva durante más de 4 segundos (TBT) y hasta 23 segundos hasta ser completamente interactiva (TTI).

---

### 10. Ambos frontends — Source maps faltantes (score 0)

**Problema:** Faltan source maps para archivos JavaScript grandes de primera parte.

**Causa raíz:** La configuración de producción de Next.js no está generando source maps o estos no se están sirviendo correctamente (timeout al obtenerlos).

**Impacto:** Dificulta la depuración en producción y Lighthouse no puede realizar auditorías avanzadas que requieren source maps.

---

### 11. Backoffice — back/forward cache bloqueado

**Problema:** `cache-control: no-store` impide que la página entre en el bf-cache (restauración de navegación hacia atrás/adelante).

**Causa raíz:** Cabecera HTTP probablemente establecida para evitar caché de datos de sesión, pero bloquea la restauración instantánea desde bf-cache.

**Impacto:** Navegación más lenta al volver a esta página desde el historial.

---

### 12. Ambos frontends — Accesibilidad: mismatch de etiqueta

**Problema:** Un elemento `<a>` (link en el header) tiene texto visible diferente a su `aria-label` o `accessible name`.

**Causa raíz:** El componente link del encabezado usa un icono SVG o imagen sin un texto accesible que coincida con la etiqueta visible.

**Impacto:** Confusión para usuarios de lectores de pantalla.

---

### 13. Website Desktop — Error de protocolo Lighthouse

**Problema:** Se registró un `PROTOCOL_TIMEOUT` en la auditoría de captura de pantalla completa.

**Causa raíz:** El entorno de Codespaces puede haber tenido limitaciones de recursos o latencia que impidieron que Lighthouse completara la captura del FullPageScreenshot.

**Observación:** Esto no afecta las métricas ni las puntuaciones, solo la captura de pantalla final.

---

## Tabla comparativa general

| Dimensión | Website Desktop | Website Móvil | Backoffice Desktop | Backoffice Móvil |
|-----------|:--------------:|:-------------:|:------------------:|:----------------:|
| **Performance** | 96 🟢 | 80 🟡 | **42 🔴** | **33 🔴** |
| **FCP** | 1.0 s 🟢 | 2.7 s 🟡 | 0.8 s 🟢 | 2.7 s 🟡 |
| **LCP** | 1.0 s 🟢 | 2.7 s 🟡 | **4.5 s 🔴** | **22.9 s 🔴** |
| **TBT** | 10 ms 🟢 | 470 ms 🟡 | **1,090 ms 🔴** | **4,540 ms 🔴** |
| **CLS** | 0 🟢 | 0 🟢 | 0 🟢 | 0 🟢 |
| **SI** | 1.2 s 🟢 | 2.7 s 🟢 | 2.8 s 🔴 | 8.0 s 🔴 |
| **TTI** | 1.7 s 🟢 | 6.9 s 🔴 | 4.5 s 🔴 | 23.0 s 🔴 |

---

## Priorización de correcciones (PASO 04)

Basado en el análisis, el orden de prioridad recomendado es:

1. **🔴 Backoffice Móvil LCP (22.9 s)** — Reducir el tiempo de respuesta del endpoint `/auth/me`, aplicar code-splitting en componentes del dashboard, eliminar render-blocking resources.
2. **🔴 Backoffice Desktop LCP (4.5 s)** — Misma estrategia: optimizar fetch de autenticación, cargar componentes críticos primero.
3. **🔴 Backoffice TBT (1,090 ms / 4,540 ms)** — Reducir JavaScript no utilizado, lazy-loading de componentes secundarios.
4. **🟡 Website Móvil TBT/TTI (470 ms / 6.9 s)** — Eliminar JavaScript no utilizado (391 KiB), diferir scripts de terceros.
5. **🟡 Website Móvil render-blocking (1,330 ms)** — Optimizar carga de CSS y scripts.
6. **🟡 SEO (ambos frontends)** — Revisar directivas de indexación para producción.

> **Nota:** Las puntuaciones de Accessibility y Best Practices están en 100 en todos los casos, lo cual es excelente y no requiere intervención.

---

---

## Análisis de refactorización — Código duplicado identificado (PASO 02)

A continuación se documentan dos casos de código duplicado entre archivos que son candidatos a ser extraídos en componentes compartidos o Custom Hooks.

---

### Caso 1: Configuración de fuentes duplicada en ambos RootLayouts

**Archivos afectados:**
- `uis/website/app/layout.tsx`
- `uis/backoffice/app/layout.tsx`

**Código duplicado:**

Ambos archivos importan y configuran exactamente las mismas dos fuentes de Google Fonts con idéntica configuración:

```typescript
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});
```

Y ambas aplican las variables CSS de la misma forma en el `<html>` tag:

```tsx
<html lang="es" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
```

**Por qué es candidato a refactorización:**

Las dos aplicaciones (website público y backoffice) pertenecen al mismo ecosistema Nexova y comparten la misma identidad visual. Tener la configuración de fuentes duplicada significa que cualquier cambio en la tipografía de la marca (añadir una fuente, cambiar pesos, modificar subsets) requiere modificar **dos archivos en dos directorios distintos**. Esto es fuente de bugs por desincronización.

**Solución propuesta:**

Extraer la configuración de fuentes a un **módulo compartido** en `packages/shared/` que ambos frontends puedan importar:

```typescript
// packages/shared/src/fonts.ts
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "600"] as const,
  subsets: ["latin"],
});

export const fontClassNames = `${spaceGrotesk.variable} ${ibmPlexMono.variable}`;
```

Luego cada `layout.tsx` simplemente haría:

```typescript
import { fontClassNames } from "@nexova/shared/fonts";
```

---

### Caso 2: Patrón repetido de estados (loading / error / empty) en componentes del backoffice

**Archivos afectados (tres ocurrencias del mismo patrón):**

| Archivo | Ruta |
|---------|------|
| ProductsPageClient | `uis/backoffice/app/backoffice/inventory/products/products-page-client.tsx` |
| OrdersHistoryClient | `uis/backoffice/app/backoffice/inventory/orders/orders-history-client.tsx` |
| SuppliersPageClient | `uis/backoffice/app/suppliers/suppliers-page-client.tsx` |

**Código duplicado (patrón repetido en los 3 archivos):**

Cada uno implementa manualmente el ciclo de vida de una petición asíncrona con la misma estructura:

```typescript
// Patrón repetido exactamente igual en estructura
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchData = useCallback(async () => {
  setLoading(true);
  setError("");
  try {
    const result = await someApiCall();
    setData(result);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

Y las guardas de renderizado para los tres estados también son casi idénticas entre componentes:

```tsx
// Loading state
if (loading) {
  return (
    <div className={styles.card}>
      <div className={styles.loading} role="status" aria-live="polite">
        Cargando…
      </div>
    </div>
  );
}

// Error state
if (error) {
  return (
    <div className={styles.card}>
      <div className={styles.error} role="alert" aria-live="polite">
        {error}
      </div>
      <button onClick={fetchData} style={{ marginTop: "0.75rem" }}>
        Reintentar
      </button>
    </div>
  );
}

// Empty state
if (data.length === 0) {
  return (
    <div className={styles.card}>
      <div className={styles.loading}>No hay datos registrados.</div>
    </div>
  );
}
```

**Por qué es candidato a refactorización:**

1. **Violación de DRY**: El mismo patrón de 3 estados (loading → error → empty → success) se implementa manualmente en 3 componentes. Cualquier cambio en la UX de estos estados (añadir un spinner animado, cambiar el diseño del botón de reintento, internacionalizar los mensajes) requiere modificar los 3 archivos.
2. **Carga cognitiva innecesaria**: Cada vez que se lee uno de estos componentes, hay que procesar 30-40 líneas de infraestructura (estados, fetch, loading/error guards) antes de llegar a la lógica de negocio real.
3. **Oportunidad de abstracción**: Next.js 14+ App Router fomenta el uso de Server Components para datos, pero como estos componentes son `"use client"` por necesidad de interactividad, un Custom Hook que encapsule el ciclo asíncrono más un componente `AsyncDataHandler` para los estados visuales simplificaría significativamente cada página.

**Solución propuesta — Custom Hook `useAsyncData`:**

```typescript
// packages/shared/src/use-async-data.ts
import { useState, useEffect, useCallback } from "react";

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    setLoading(true);
    setError("");
    fetcher()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refetch(); }, [refetch]);

  return { data: data ?? ([] as T), loading, error, refetch };
}
```

**Solución propuesta — Componente `AsyncBoundary`:**

```tsx
// packages/shared/src/async-boundary.tsx
type AsyncBoundaryProps<T> = {
  data: T;
  loading: boolean;
  error: string;
  onRetry: () => void;
  loadingLabel?: string;
  emptyLabel?: string;
  children: (data: NonNullable<T>) => React.ReactNode;
};

export function AsyncBoundary<T>({
  data,
  loading,
  error,
  onRetry,
  loadingLabel = "Cargando…",
  emptyLabel = "No hay datos registrados.",
  children,
}: AsyncBoundaryProps<T>) {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loading} role="status" aria-live="polite">
          {loadingLabel}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.error} role="alert" aria-live="polite">
          {error}
        </div>
        <button className={styles.primaryButton} onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>{emptyLabel}</div>
      </div>
    );
  }

  return <>{children(data)}</>;
}
```

Con estas dos abstracciones, el componente `ProductsPageClient` se reduciría de ~150 líneas a ~50, manteniendo solo la lógica específica de negocio.

---

*Este documento se actualizará en el PASO 05 con las mediciones posteriores a las correcciones.*
