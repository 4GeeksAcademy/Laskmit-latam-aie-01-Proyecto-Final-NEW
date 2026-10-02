/**
 * TelemetryInit — Inicialización global del sistema de telemetría.
 *
 * Responsabilidades:
 * - Registrar handlers globales de errores no capturados (window.onerror,
 *   unhandledrejection) que emiten eventos `error_frontend_unhandled`.
 * - Registrar la métrica de rendimiento `performance_api_latency_recorded`
 *   (medición de carga de página).
 * - Proveer un hook para que las páginas emitan `navigation_section_entered`.
 *
 * Este módulo debe importarse UNA VEZ desde layout.tsx para que los
 * handlers queden registrados al arrancar la aplicación.
 *
 * @file uis/backoffice/lib/telemetry-init.ts
 */

import { track } from "./telemetry";

// ── Constantes ───────────────────────────────────────────────────────────────────────

/** Sample rate para eventos de rendimiento (10% de las cargas de página). */
const PERF_SAMPLE_RATE = 0.1;

// ── Helpers ──────────────────────────────────────────────────────────────────────────

/** Obtiene la ruta actual del pathname del backoffice. */
function getCurrentPath(): string {
  if (typeof window === "undefined") return "unknown";
  return window.location.pathname;
}

/** Obtiene el nombre del componente actual a partir del pathname. */
function getComponentFromPath(path: string): string {
  // Mapear rutas conocidas a nombres de componente
  if (path === "/" || path === "") return "home";
  if (path.startsWith("/login")) return "login";
  if (path.startsWith("/register")) return "register";
  if (path.startsWith("/forgot-password")) return "forgot-password";
  if (path.startsWith("/reset-password")) return "reset-password";
  if (path.startsWith("/suppliers")) return "suppliers";
  if (path.startsWith("/incidents-analyzer")) return "incidents-analyzer";
  if (path.startsWith("/incidents")) return "incidents";
  if (path.startsWith("/backoffice/inventory/products")) return "inventory-products";
  if (path.startsWith("/backoffice/inventory/orders/inbound")) return "inventory-orders-inbound";
  if (path.startsWith("/backoffice/inventory/orders/outbound")) return "inventory-orders-outbound";
  if (path.startsWith("/backoffice/inventory/orders")) return "inventory-orders";
  if (path.startsWith("/backoffice/inventory")) return "inventory";
  if (path.startsWith("/account/profile")) return "profile";
  if (path.startsWith("/account/change-password")) return "change-password";
  if (path.startsWith("/account")) return "account";
  if (path.startsWith("/talent-pipeline-tracker")) return "talent-pipeline";
  return path.replace(/^\//, "").split("/")[0] || "unknown";
}

// ── 1. Handler de errores globales ──────────────────────────────────────────────────

/**
 * Emite un evento `error_frontend_unhandled` con información del error.
 * Se usa como handler de window.onerror y window unhandledrejection.
 */
function handleUnhandledError(
  event: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof event === "string"
        ? event
        : "Unknown error";
  track("error_frontend_unhandled", {
    error_message: message,
    component: getComponentFromPath(getCurrentPath()),
    source: source || "unknown",
    lineno: lineno || 0,
    colno: colno || 0,
    path: getCurrentPath(),
    occurrence_count: 1,
  });
}

/**
 * Emite un evento `error_frontend_unhandled` desde una promesa rechazada
 * no capturada.
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "Promise rejection reason not available";
  track("error_frontend_unhandled", {
    error_message: message,
    component: getComponentFromPath(getCurrentPath()),
    source: "unhandledrejection",
    lineno: 0,
    colno: 0,
    path: getCurrentPath(),
    occurrence_count: 1,
  });
}

/**
 * Registra los handlers globales de error.
 * Es seguro llamar a esta función múltiples veces — solo registra una vez.
 */
let errorHandlersRegistered = false;
function registerGlobalErrorHandlers(): void {
  if (errorHandlersRegistered) return;
  if (typeof window === "undefined") return;

  window.onerror = handleUnhandledError;
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  errorHandlersRegistered = true;
}

// ── 2. Métrica de rendimiento (page load timing) ─────────────────────────────────────

/**
 * Mide el tiempo de carga de la página y emite un evento
 * `performance_api_latency_recorded` si entra en el sample rate.
 */
function recordPageLoadTiming(): void {
  if (typeof window === "undefined") return;
  if (Math.random() > PERF_SAMPLE_RATE) return; // sample al 10%

  // Usar la API de rendimiento del navegador si está disponible
  if (window.performance && window.performance.timing) {
    const perf = window.performance;
    const timing = perf.timing;
    const loadTime = timing.responseEnd - timing.fetchStart;

    track("performance_api_latency_recorded", {
      endpoint: getCurrentPath(),
      latency_ms: loadTime,
      sample_rate: PERF_SAMPLE_RATE,
    });
  } else {
    // Fallback: medir desde un punto fijo en el código
    // Nota: esta medición es aproximada; la medición real vendrá
    // de Web Vitals o del backend.
    const startTime = window.performance.now
      ? window.performance.now()
      : Date.now();
    // Diferir la medición hasta que la página haya cargado
    window.addEventListener("load", () => {
      const endTime = window.performance.now
        ? window.performance.now()
        : Date.now();
      const elapsed = Math.round(endTime - startTime);
      track("performance_api_latency_recorded", {
        endpoint: getCurrentPath(),
        latency_ms: elapsed,
        sample_rate: PERF_SAMPLE_RATE,
      });
    });
  }
}

// ── 3. Web Vitals (Actividad adicional) ──────────────────────────────────────────────

/**
 * Captura métricas Web Vitals usando la API del navegador y las envía
 * como eventos de telemetría.
 *
 * Se registra un callback de `window.performance.getEntriesByType('webvitals')`
 * o, si no está disponible, se usa la recomendación de Next.js para
 * reportWebVitals.
 */
let webVitalsRegistered = false;
function registerWebVitalsCapture(): void {
  if (webVitalsRegistered) return;
  if (typeof window === "undefined") return;
  if (typeof window.performance === "undefined") return;

  // Intentar con la API de PerformanceObservers (más moderna)
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const perfEntry = entry as PerformanceEntry & { metricName?: string; value?: number };
        const metricName = perfEntry.name || perfEntry.metricName || "unknown";
        const value = perfEntry.value !== undefined ? perfEntry.value : perfEntry.duration || 0;

        // Mapear a event_type según la métrica
        let vitalsEventType = "web_vital_recorded";
        if (metricName.includes("LCP") || metricName === "largestContentfulPaint") {
          vitalsEventType = "web_vital_lcp";
        } else if (metricName.includes("FCP") || metricName === "firstContentfulPaint") {
          vitalsEventType = "web_vital_fcp";
        } else if (metricName.includes("TTFB") || metricName === "timeToFirstByte") {
          vitalsEventType = "web_vital_ttfb";
        } else if (metricName.includes("FID") || metricName === "firstInputDelay") {
          vitalsEventType = "web_vital_fid";
        }

        track(vitalsEventType, {
          metric: metricName,
          value_ms: Math.round(value * 1000) / 1000,
          path: getCurrentPath(),
          component: getComponentFromPath(getCurrentPath()),
        });
      }
    });

    observer.observe({ type: "webvitals", buffered: true });
    webVitalsRegistered = true;
  } catch {
    // PerformanceObserver no disponible — ignorar silenciosamente
  }

  // Si no se pudo registrar el observer, intentar con getEntriesByType
  if (!webVitalsRegistered) {
    try {
      const entries = window.performance.getEntriesByType("webvitals");
      if (entries && entries.length > 0) {
        // Los web vitals ya están disponibles — procesarlos
        for (const entry of entries) {
          const metricName = (entry as { name?: string }).name || "unknown";
          const value = (entry as { value?: number }).value || (entry as { duration?: number }).duration || 0;
          track("web_vital_recorded", {
            metric: metricName,
            value_ms: Math.round(value * 1000) / 1000,
            path: getCurrentPath(),
            component: getComponentFromPath(getCurrentPath()),
          });
        }
      }
    } catch {
      // API no disponible — ignorar
    }
  }
}

// ── 4. Inicialización ────────────────────────────────────────────────────────────────

/**
 * Inicializa todos los handlers globales de telemetría.
 * Debe llamarse UNA VEZ al arrancar la aplicación, desde layout.tsx.
 */
export function initTelemetry(): void {
  registerGlobalErrorHandlers();
  registerWebVitalsCapture();

  // Medir rendimiento de carga de página (diferido al load event)
  recordPageLoadTiming();
}