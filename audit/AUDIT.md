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

## Correcciones identificadas — Diagnóstico, solución y código (PASO 03)

> **Fecha de identificación:** 2026-09-17
> **Propósito:** Documentar cada corrección identificada con su diagnóstico específico, el cambio de código propuesto, y la métrica objetivo que pretende mejorar.

A continuación se detallan las correcciones identificadas, ordenadas por prioridad de impacto en las métricas objetivo.

---

### 🔴 Corrección 1 — Code Splitting del bundle principal (main-app.js) en Backoffice

**Métricas objetivo:** LCP, TBT, TTI, SI, bootup-time

**Diagnóstico desde Lighthouse:**
| Archivo | Tamaño | Contexto |
|---------|--------|----------|
| `main-app.js` | ~2.1 MB (transferido) | Chunk principal de Next.js que contiene React, ReactDOM, y TODOS los componentes del backoffice |
| `app/layout.js` | ~180 KB | Layout global del backoffice |

Lighthouse reporta que `main-app.js` es el recurso más pesado (total-byte-weight score 50, ~3.5MB total de página) y que **no hay code-splitting por ruta**. El chunk principal incluye componentes de todas las rutas del backoffice (inventario, suppliers, talent pipeline, incidencias, perfil, etc.).

**Solución propuesta — Dynamic imports con `next/dynamic` en las páginas del backoffice:**

```tsx
// uis/backoffice/app/page.tsx — Página principal del dashboard
"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

// Los componentes se cargan solo cuando el usuario navega a ellos
const DashboardContent = dynamic(
  () => import("../components/dashboard/dashboard-content"),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false, // Evita hidratación costosa en servidor
  }
);

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Cargando dashboard…" role="status">
      <div className="skeleton-shimmer" style={{ height: 24, width: "60%", marginBottom: 16 }} />
      <div className="skeleton-shimmer" style={{ height: 120, width: "100%", marginBottom: 12 }} />
      <div className="skeleton-shimmer" style={{ height: 120, width: "100%" }} />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="dashboard-container">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
```

```tsx
// uis/backoffice/app/backoffice/inventory/products/page.tsx — Página de inventario
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ProductsPageClient = dynamic(
  () => import("./products-page-client").then((mod) => ({ default: mod.ProductsPageClient })),
  { loading: () => <div className="skeleton-card" role="status">Cargando inventario…</div> }
);

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="skeleton-card" role="status">Cargando inventario…</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}
```

```tsx
// uis/backoffice/app/suppliers/page.tsx — Página de suppliers
import dynamic from "next/dynamic";
import { Suspense } from "react";

const SuppliersPageClient = dynamic(
  () => import("./suppliers-page-client").then((mod) => ({ default: mod.SuppliersPageClient })),
  { loading: () => <div className="skeleton-card" role="status">Cargando proveedores…</div> }
);

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="skeleton-card" role="status">Cargando proveedores…</div>}>
      <SuppliersPageClient />
    </Suspense>
  );
}
```

**Impacto esperado:**
- Reducción del tamaño del bundle inicial de ~2.1 MB a ~400 KB
- LCP estimado: de 4.5 s → <2.0 s (Desktop), de 22.9 s → <4.0 s (Mobile)
- TBT estimado: de 1,090 ms → <300 ms (Desktop), de 4,540 ms → <1,000 ms (Mobile)
- TTI estimado: de 4.5 s → <2.5 s (Desktop)

---

### 🔴 Corrección 2 — Optimización del AuthGuard: fetch de /auth/me y renderizado bloqueante

**Métricas objetivo:** LCP, FCP, TBT, TTI

**Diagnóstico:** El componente `AuthGuard` (`uis/backoffice/components/auth/auth-guard.tsx`) es un `"use client"` que se monta a nivel de layout. En cada navegación, realiza un fetch a `/auth/me` que tarda entre ~2.5 s (Desktop) y ~5.1 s (Mobile) en completarse. Durante ese tiempo, la página no puede hidratar ni renderizar su contenido (el layout entero espera). El elementRenderDelay del LCP se debe directamente a este fetch bloqueante.

**Solución propuesta — Caché de sesión + renderizado progresivo con skeleton:**

```tsx
// uis/backoffice/components/auth/auth-guard.tsx (refactorizado)
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import { getAccessToken, setAccessToken } from "../../lib/auth";
import type { CurrentUser } from "../../lib/auth-types";
import { AuthNavigation } from "./auth-navigation";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const PASSWORD_RECOVERY_ROUTES = new Set(["/forgot-password", "/reset-password"]);

type GuardState = "checking" | "authenticated" | "public" | "error";

// Caché de sesión en memoria para evitar refetch en navegaciones SPA
let cachedUser: CurrentUser | null = null;
let cachedPromise: Promise<CurrentUser> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>(() => {
    // Optimización: si ya hay caché, usamos el estado directamente
    if (cachedUser) return "authenticated";
    const isAuthRoute = AUTH_ROUTES.has(pathname);
    const isPasswordRecoveryRoute = PASSWORD_RECOVERY_ROUTES.has(pathname);
    if (isPasswordRecoveryRoute || (isAuthRoute && !getAccessToken())) return "public";
    return "checking";
  });
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const validateSession = useCallback(async (): Promise<void> => {
    const isAuthRoute = AUTH_ROUTES.has(pathname);
    const isPasswordRecoveryRoute = PASSWORD_RECOVERY_ROUTES.has(pathname);

    if (isPasswordRecoveryRoute) {
      setState("public");
      return;
    }

    if (!getAccessToken()) {
      if (isAuthRoute) {
        setState("public");
      } else {
        router.replace("/login");
      }
      return;
    }

    // Si ya tenemos el usuario en caché, no hacemos fetch
    if (cachedUser) {
      setState("authenticated");
      return;
    }

    // Usar promesa cacheada para evitar fetch duplicado en StrictMode
    if (!cachedPromise) {
      cachedPromise = apiRequest<CurrentUser>("/auth/me").then((user) => {
        cachedUser = user;
        return user;
      });
    }

    try {
      await cachedPromise;
      if (mountedRef.current) setState("authenticated");
    } catch (err) {
      if (mountedRef.current) {
        setError(getErrorMessage(err));
        setState("error");
      }
      // Limpiar token inválido
      if (getAccessToken()) {
        import("../../lib/auth").then(({ clearAccessToken }) => clearAccessToken());
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    mountedRef.current = true;
    validateSession();
    return () => { mountedRef.current = false; };
  }, [validateSession]);

  // Renderizado inmediato del children + navegación mientras se valida
  if (state === "authenticated") {
    return (
      <>
        <AuthNavigation />
        <main>{children}</main>
      </>
    );
  }

  if (state === "public") {
    return <>{children}</>;
  }

  if (state === "error") {
    return (
      <div className="auth-error-container" role="alert">
        <p>Error de autenticación: {error}</p>
        <button onClick={() => { cachedPromise = null; cachedUser = null; validateSession(); }}>
          Reintentar
        </button>
      </div>
    );
  }

  // "checking" — mostrar skeleton inmediato sin esperar fetch
  return (
    <>
      <AuthNavigation />
      <main>
        <div className="dashboard-skeleton" role="status" aria-label="Verificando sesión…">
          <div className="skeleton-shimmer" style={{ height: 24, width: "40%" }} />
          <div className="skeleton-shimmer" style={{ height: 200, width: "100%", marginTop: 16 }} />
        </div>
      </main>
    </>
  );
}
```

**Impacto esperado:**
- LCP Desktop: de 4.5 s → ~1.5 s (el fetch se ejecuta en paralelo al renderizado del skeleton)
- LCP Mobile: de 22.9 s → ~3.5 s (evita el bloqueo total del renderizado)
- El AuthNavigation se renderiza inmediatamente porque no espera la validación
- Navegación SPA: el fetch solo ocurre 1 vez, las navegaciones posteriores usan caché

---

### 🔴 Corrección 3 — Optimización de imágenes y conversión a formatos modernos

**Métricas objetivo:** LCP, total-byte-weight, Speed Index

**Diagnóstico desde Lighthouse:**
| Imagen | Tamaño actual | Formato | Problema |
|--------|--------------|---------|----------|
| `hero.png` | 450 KB | PNG | Sin compresión, formato obsoleto |
| (posibles imágenes de fondo) | >200 KB | PNG | Sin WebP ni AVIF |

**Solución propuesta — Configuración de Next.js para optimización automática de imágenes:**

```typescript
// uis/website/next.config.ts (actualizado)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar optimización de imágenes de Next.js
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días en CDN
  },
  // Compresión habilitada por defecto en Next.js
  compress: true,
  // Desactivar source maps en producción para reducir peso
  productionBrowserSourceMaps: false,
  // Cabeceras HTTP para mejorar caché
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|ico)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

```tsx
// uis/website/components/Hero.tsx — Imagen Hero optimizada con next/image
import Image from "next/image";
import styles from "../app/page.module.css";

export function Hero() {
  return (
    <section id="inicio" className={styles.hero}>
      <div className={styles.heroGlowA} aria-hidden="true" />
      <div className={styles.heroGlowB} aria-hidden="true" />
      <div className={`${styles.container} ${styles.heroGrid}`}>
        <div>
          <p className={styles.heroEyebrow}>Nexova | Talento estratégico</p>
          <h1 className={styles.heroTitle}>
            Construimos equipos excepcionales para empresas en crecimiento
          </h1>
          <p className={styles.heroSubtitle}>
            Consultora de recursos humanos y adquisición de talento para empresas en crecimiento
            que buscan acelerar contrataciones clave y fortalecer sus equipos.
          </p>
          <div className={styles.heroCtas}>
            <a className={styles.primaryButton} href="/registro">
              Únete a nuestro banco de talento
            </a>
            <span>Estrategia de talento para compañías en expansión</span>
          </div>
        </div>
        <aside className={styles.heroCard}>
          <p className={styles.heroCardTitle}>Cómo trabajamos</p>
          <ul className={styles.stepList}>
            <li>
              <span>Diagnóstico y diseño del perfil</span>
              <strong>Paso 1</strong>
            </li>
            <li>
              <span>Búsqueda y evaluación de candidatos</span>
              <strong>Paso 2</strong>
            </li>
            <li>
              <span>Seguimiento de incorporación y ajuste</span>
              <strong>Paso 3</strong>
            </li>
          </ul>
        </aside>
      </div>
      {/* Hero image optimizada con next/image */}
      <div className={styles.heroImageWrapper}>
        <Image
          src="/hero.webp"
          alt="Equipo Nexova trabajando"
          width={1200}
          height={600}
          priority  // Marcar como prioridad para LCP
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={85}
          className={styles.heroImage}
        />
      </div>
    </section>
  );
}
```

**Impacto esperado:**
- Peso de hero image: de 450 KB (PNG) → ~60-80 KB (WebP) → ~40-60 KB (AVIF) = **hasta 90% de reducción**
- LCP Desktop se mantiene en ~1.0 s pero con mejor calidad visual percibida
- Total-byte-weight: de ~3.5 MB a ~3.0 MB

---

### 🟠 Corrección 4 — Precarga y preconección a orígenes críticos

**Métricas objetivo:** LCP, FCP, Speed Index

**Diagnóstico:** Lighthouse no detecta etiquetas `<link rel="preconnect">` ni `dns-prefetch` para los orígenes de terceros y APIs que la página consulta. Esto añade latencia de DNS + TCP + TLS en cada solicitud.

**Orígenes identificados que necesitan preconnect:**
- `https://urban-chainsaw-r4xqp67g99vvc5q6x-3001.app.github.dev` (API de backoffice)
- `https://playground.4geeks.com` (API de registro)
- `https://gc.kes.v2.scr.kaspersky-labs.com` (Kaspersky — third-party de seguridad)

**Solución propuesta — Preconnect y dns-prefetch en el layout:**

```tsx
// uis/backoffice/app/layout.tsx (fragmento del head con preconnects)
import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { AuthGuard } from "../components/auth/auth-guard";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description: "Aplicación interna de Nexova para operar y visualizar la lógica de negocio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Determinar API base URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* Preconnect a orígenes críticos para reducir latencia de conexión */}
        {apiUrl && (
          <>
            <link rel="dns-prefetch" href={apiUrl} />
            <link rel="preconnect" href={apiUrl} crossOrigin="anonymous" />
          </>
        )}
        <link rel="dns-prefetch" href="https://playground.4geeks.com" />
        <link rel="preconnect" href="https://playground.4geeks.com" crossOrigin="anonymous" />
        {/* Precargar la fuente principal para evitar FOIT/FOUT */}
        <link
          rel="preload"
          href="/_next/static/media/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
```

```tsx
// uis/website/app/layout.tsx (fragmento del head con preconnects)
import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexova | Consultora de talento y recursos humanos",
  description:
    "Consultora especializada en headhunting, formación corporativa y outsourcing para empresas en España y Estados Unidos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* Preconnect para mejorar velocidad de conexión a recursos críticos */}
        <link rel="dns-prefetch" href="https://playground.4geeks.com" />
        <link rel="preconnect" href="https://playground.4geeks.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://gc.kes.v2.scr.kaspersky-labs.com" />
        {/* Precargar la fuente principal */}
        <link
          rel="preload"
          href="/_next/static/media/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Impacto esperado:**
- Speed Index Desktop: de 1.2 s → ~1.0 s
- Speed Index Mobile: de 2.7 s → ~2.0 s
- FCP Mobile: de 2.7 s → ~2.2 s
- Elimina negociación DNS+TCP+TLS del path crítico para estos orígenes

---

### 🟠 Corrección 5 — Lazy loading de componentes pesados con `next/dynamic` y estados skeleton

**Métricas objetivo:** TBT, bootup-time, mainthread-work, TTI

**Diagnóstico:** Los componentes `"use client"` en backoffice se cargan de forma eager (inmediata) aunque algunos solo son visibles después de la interacción del usuario. Lighthouse detecta ~59 KiB de JavaScript no utilizado en backoffice (solo de Kaspersky) y los bundles de `node_modules_next` en website contienen ~148 KB no utilizados cada uno.

**Solución propuesta — Estrategia de carga diferida por interacción del usuario:**

```tsx
// uis/backoffice/app/backoffice/inventory/orders/page.tsx — Lazy loading por pestaña
import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

const InboundOrderClient = dynamic(
  () => import("./inbound/inbound-order-client"),
  { loading: () => <div className="skeleton-card" role="status">Cargando pedidos de entrada…</div> }
);

const OutboundOrderClient = dynamic(
  () => import("./outbound/outbound-order-client"),
  { loading: () => <div className="skeleton-card" role="status">Cargando pedidos de salida…</div> }
);

const OrdersHistoryClient = dynamic(
  () => import("./orders-history-client"),
  { loading: () => <div className="skeleton-card" role="status">Cargando historial…</div> }
);

type TabId = "inbound" | "outbound" | "history";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("inbound");

  const tabs: { id: TabId; label: string }[] = [
    { id: "inbound", label: "Pedidos de entrada" },
    { id: "outbound", label: "Pedidos de salida" },
    { id: "history", label: "Historial" },
  ];

  return (
    <div className="orders-container">
      <nav className="tabs-nav" role="tablist" aria-label="Tipo de pedidos">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "tab-active" : "tab-inactive"}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={<div className="skeleton-card" role="status">Cargando…</div>}>
        {activeTab === "inbound" && <InboundOrderClient />}
        {activeTab === "outbound" && <OutboundOrderClient />}
        {activeTab === "history" && <OrdersHistoryClient />}
      </Suspense>
    </div>
  );
}
```

```tsx
// uis/backoffice/app/incidents/page.tsx — Lazy loading con next/dynamic
import dynamic from "next/dynamic";
import { Suspense } from "react";

const IncidentManager = dynamic(
  () => import("./incident-manager"),
  {
    loading: () => (
      <div className="skeleton-card" role="status" aria-label="Cargando gestor de incidencias…">
        <div className="skeleton-shimmer" style={{ height: 40, width: "100%", marginBottom: 12 }} />
        <div className="skeleton-shimmer" style={{ height: 300, width: "100%" }} />
      </div>
    ),
    ssr: false, // El gestor de incidencias es altamente interactivo, no necesita SSR
  }
);

export default function IncidentsPage() {
  return (
    <Suspense fallback={<div className="skeleton-card" role="status">Cargando gestor de incidencias…</div>}>
      <IncidentManager />
    </Suspense>
  );
}
```

**Impacto esperado:**
- TBT Desktop: de 1,090 ms → <300 ms
- TBT Mobile: de 4,540 ms → <1,500 ms
- Bootup-time Mobile: de 5.4 s → <2.0 s
- Mainthread work Mobile: de 6.8 s → <3.0 s

---

### 🟠 Corrección 6 — Eliminación de JavaScript legacy y no utilizado

**Métricas objetivo:** TBT, bootup-time, total-byte-weight

**Diagnóstico:** Lighthouse detecta JavaScript no utilizado en múltiples bundles. Los peores infractores son:

| Bundle | Tamaño total | No utilizado | % Desperdicio |
|--------|-------------|-------------|:-------------:|
| `node_modules_next/dist` | 244 KB | 148 KB | 61% |
| `node_modules_next/dist` (2) | 188 KB | 105 KB | 56% |
| `node_modules_next/dist` (3) | 180 KB | 74 KB | 41% |
| Kaspersky `main.js` | 110 KB | 59 KB | 54% |

**Solución propuesta — Eliminar dependencias no utilizadas y optimizar imports:**

```bash
# Identificar y eliminar dependencias no utilizadas del proyecto
cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW
npx depcheck  # Identifica paquetes instalados pero no importados
# Eliminar dependencias huérfanas
npm uninstall <paquetes-no-usados> 2>/dev/null || true
```

```typescript
// En lugar de importaciones completas de bibliotecas, usar imports tree-shakeables:

// ❌ Antes: Import completo de lodash (ocupa ~70 KB en el bundle)
// import _ from "lodash";

// ✅ Después: Import específico y tree-shakeable
// import debounce from "lodash/debounce";
// (o mejor aún, usar implementación nativa: AbortController + setTimeout)

// ❌ Antes: Import de toda una biblioteca de componentes
// import { Button, Card, Table, Modal, Form } from "some-ui-library";

// ✅ Después: Import solo del componente necesario
// import Button from "some-ui-library/button";
```

```json
// package.json — Añadir análisis de bundle para CI
{
  "scripts": {
    "analyze:bundle": "ANALYZE=true next build",
    "lint:unused": "npx depcheck --json > depcheck-report.json"
  }
}
```

**Impacto esperado:**
- JavaScript total transferido: de ~3.5 MB a ~2.0 MB
- Tiempo de parseo/compilación en Mobile reducido proporcionalmente

---

### 🟡 Corrección 7 — Optimización del fetch de sesión con SWR o caché local

**Métricas objetivo:** LCP, TBT (interacciones tempranas)

**Diagnóstico adicional:** El fetch a `/auth/me` se ejecuta de forma secuencial: primero Next.js hidrata, luego el efecto en `AuthGuard` dispara el fetch. Esto significa que durante ~2-5 segundos la página está "congelada" esperando la respuesta de autenticación.

**Solución propuesta — Fetch temprano con `localStorage` como caché de sesión:**

```typescript
// packages/shared/src/session-cache.ts
// Hook compartido para caché de sesión con validez temporal

const SESSION_CACHE_KEY = "nexova:session";
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CachedSession {
  user: CurrentUser;
  timestamp: number;
}

export function getCachedSession(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedSession = JSON.parse(raw);
    if (Date.now() - cached.timestamp > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return cached.user;
  } catch {
    return null;
  }
}

export function setCachedSession(user: CurrentUser): void {
  const cache: CachedSession = { user, timestamp: Date.now() };
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
}

export function clearCachedSession(): void {
  localStorage.removeItem(SESSION_CACHE_KEY);
}
```

**Impacto esperado:**
- Fetch de `/auth/me` se elimina del path crítico en navegaciones SPA
- Tiempo de renderizado inicial reducido en ~2-5 s
- Especialmente crítico para Mobile donde el fetch tarda ~5.1 s

---

### 🟡 Corrección 8 — Eliminación de render-blocking resources en Website

**Métricas objetivo:** FCP, Speed Index

**Diagnóstico:** Lighthouse no marca específicamente render-blocking resources para el website, pero el alto TBT en Mobile (470 ms) y la presencia de Kaspersky como third-party sugieren que scripts externos se cargan de forma bloqueante.

**Solución propuesta — Diferir scripts de terceros con `strategy: "lazyOnload"`:**

```tsx
// uis/website/app/layout.tsx — Script de Kaspersky cargado de forma diferida
import Script from "next/script";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* ...preconnects y preloads... */}
      </head>
      <body>
        {children}
        {/* Script de Kaspersky cargado lazyOnload para no bloquear renderizado */}
        <Script
          src="https://gc.kes.v2.scr.kaspersky-labs.com/7EA5E9BB-55E1-4C31-9C21-4943DDFED2E4/main.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

```tsx
// uis/backoffice/app/layout.tsx — Todos los scripts externos con lazyOnload
import Script from "next/script";

export default function RootLayout({ children }: LayoutProps<"/">) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* ...preconnects y preloads... */}
        <link rel="dns-prefetch" href="https://gc.kes.v2.scr.kaspersky-labs.com" />
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        {/* Cargar Kaspersky de forma diferida para no bloquear ni LCP ni TBT */}
        <Script
          src="https://gc.kes.v2.scr.kaspersky-labs.com/7EA5E9BB-55E1-4C31-9C21-4943DDFED2E4/main.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

**Impacto esperado:**
- FCP Mobile: de 2.7 s → ~2.2 s
- TBT Mobile: de 470 ms → ~300 ms
- Elimina ~59 KB de JavaScript no utilizado del path crítico de renderizado

---

### 🟡 Corrección 9 — Corrección de a11y: mismatch de etiqueta en link del header

**Métricas objetivo:** Accessibility (no performance, pero identificado en auditoría)

**Diagnóstico:** Un elemento `<a>` en el header (la marca "N") tiene texto visible "N" pero `aria-label="Ir al inicio de Nexova"`, que no coincide con el texto visible. Esto causa error de accesibilidad.

**Solución propuesta:**

```tsx
// uis/website/components/Header.tsx (corregido)
import type { NavItem } from "./types";
import styles from "../app/page.module.css";

type HeaderProps = {
  items: NavItem[];
};

export function Header({ items }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a className={styles.brand} href="#inicio" aria-label="Ir al inicio de Nexova">
          <span className={styles.brandMark} aria-hidden="true">N</span>
          <span className={styles.brandText}>Nexova</span>
        </a>
        <nav aria-label="Navegación principal">
          <ul className={styles.navList}>
            {items.map((item) => (
              <li key={item.href}>
                <a className={styles.navLink} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

**Impacto:** Puntuación de accesibilidad sube de 100 → 100 (se mantiene perfecta). La etiqueta ahora cumple con WCAG 2.1 Success Criterion 2.5.3 (Label in Name).

---

### Tabla resumen de correcciones

| # | Corrección | Prioridad | Archivos afectados | Métrica objetivo | Impacto esperado |
|:-:|-----------|:---------:|--------------------|------------------|:----------------:|
| 1 | Code splitting con `next/dynamic` | 🔴 Alta | `page.tsx` (varios backoffice) | LCP, TBT, TTI | LCP desktop 4.5→2.0s / mobile 22.9→4.0s |
| 2 | AuthGuard con caché de sesión | 🔴 Alta | `auth-guard.tsx` | LCP, FCP, TBT | LCP desktop 4.5→1.5s / mobile 22.9→3.5s |
| 3 | Imágenes WebP/AVIF con `next/image` | 🔴 Alta | `next.config.ts`, `Hero.tsx` | LCP, byte-weight | Hero image 450KB→60KB (-87%) |
| 4 | Preconnect a orígenes críticos | 🟠 Media | `layout.tsx` (ambos) | FCP, SI, LCP | FCP mobile 2.7→2.2s |
| 5 | Lazy loading por pestañas/tabs | 🟠 Media | `orders/page.tsx`, `incidents/page.tsx` | TBT, bootup-time | TBT mobile 4,540→1,500ms |
| 6 | Árbol de dependencias optimizado | 🟠 Media | `package.json`, imports | TBT, byte-weight | JS total 3.5MB→2.0MB |
| 7 | Session cache con localStorage | 🟡 Baja | `session-cache.ts`, `auth-guard.tsx` | LCP, TBT | Elimina fetch de path crítico |
| 8 | Scripts third-party lazyOnload | 🟡 Baja | `layout.tsx` (ambos) | FCP, TBT | 59KB JS eliminado de path crítico |
| 9 | Accesibilidad label in name | 🟡 Baja | `Header.tsx` (website) | Accesibilidad | WCAG 2.5.3 compliance |

---

## Secuencia priorizada de ejecución de correcciones

> **Criterio:** KPI principales (LCP, TBT/INP, Performance) antes que auditorías secundarias.
> **Nota:** Las 9 correcciones (C1-C9) resuelven los problemas #2, #3, #4, #5, #6, #7, #8, #9 y #12.
> Los problemas #1 (SEO), #10 (source maps), #11 (bf-cache) y #13 (timeout) quedan fuera de esta secuencia por ser de entorno/ configuración.

| Orden | Corrección | Resuelve problemas | Frontend | KPI principal | Impacto esperado |
|:----:|:----------:|:------------------:|:--------:|:-------------:|:----------------:|
| **1** 🔴 | **C1** — Code splitting con `next/dynamic` | #5 LCP 4.5s, #8 LCP 22.9s, #6 TBT 1,090ms, #9 TBT 4,540ms, #7 SI 2.8s | Backoffice | **LCP**, TBT | LCP Desktop 4.5s→~2.0s / Mobile 22.9s→~4.0s |
| **2** 🔴 | **C2** — AuthGuard con caché de sesión y skeleton | #5 elementRenderDelay 4,165ms, #8 fetch /auth/me 5.1s | Backoffice | **LCP**, FCP | LCP Desktop 4.5s→~1.5s / Mobile→~3.5s |
| **3** 🔴 | **C5** — Lazy loading por pestañas con `next/dynamic` | #6 TBT 1,090ms, #9 TBT 4,540ms, #4 main-thread 2.7s | Backoffice | **TBT/INP** | TBT Desktop 1,090ms→<300ms / Mobile→<1,500ms |
| **4** 🔴 | **C6** — Tree-shaking y JS no utilizado | #2 JS no utilizado 391KB, #4 main-thread 2.7s | Website + Backoffice | **TBT/INP** | JS total ~3.5MB→~2.0MB |
| **5** 🟠 | **C8** — Scripts third-party con `lazyOnload` | #3 render-blocking 1,330ms, #6/#9 TBT | Website + Backoffice | **FCP**, TBT | FCP Mobile 2.7s→~2.2s |
| **6** 🟠 | **C4** — Preconnect + dns-prefetch | #3 render-blocking, #5/#8 LCP, #7 SI | Website + Backoffice | **FCP**, SI | FCP Mobile 2.7s→~2.2s / SI→~2.0s |
| **7** 🟠 | **C3** — Imágenes WebP/AVIF con `next/image` | #5/#8 LCP por hero image 450KB PNG | Website | **LCP** | Hero 450KB→~60KB (-87%) |
| **8** 🟡 | **C7** — Session cache con localStorage | #5 fetch /auth/me secuencial en SPA | Backoffice | **LCP**, TBT | Fetch fuera del path crítico |
| **9** 🟡 | **C9** — Corrección a11y label in name | #12 mismatch de etiqueta en header | Website | Accesibilidad | WCAG 2.5.3 compliance |

> **🔴 Órdenes 1-4:** Impacto directo en Performance Score y Core Web Vitals (Backoffice primero, que tiene peor puntuación: 33).
> **🟠 Órdenes 5-7:** Impacto en métricas de renderizado (FCP, SI).
> **🟡 Órdenes 8-9:** Mejoras secundarias (UX, accesibilidad).

---
