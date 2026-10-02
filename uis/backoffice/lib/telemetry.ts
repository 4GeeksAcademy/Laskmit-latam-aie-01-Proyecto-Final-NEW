/**
 * TelemetryService — Sistema de captura de telemetría del frontend.
 *
 * Acumula eventos en una cola local y los envía al backend en lotes,
 * con debounce, flush confiable mediante sendBeacon, y reintentos con backoff.
 *
 * Única función pública: track(eventType, properties)
 *
 * Los campos eventId, sessionId, userId, timestamp, schemaVersion y requestId
 * se generan automáticamente — los componentes que llaman a track() no los
 * pasan manualmente.
 *
 * Variables de entorno requeridas:
 *   NEXT_PUBLIC_TELEMETRY_ENDPOINT  (ej: http://localhost:8000/telemetry/events)
 *
 * @file uis/backoffice/lib/telemetry.ts
 */

import { getCachedSession } from "./session-cache";

// ── Constantes ───────────────────────────────────────────────────────────────────────

/** Versión del schema del envelope. Se mantiene como constante compartida. */
const SCHEMA_VERSION = "1.0";

/** Intervalo fijo para flush periódico (10 segundos). */
const FLUSH_INTERVAL_MS = 10_000;

/** Tamaño máximo del lote: al llegar a 20 eventos se fuerza el flush. */
const BATCH_MAX_SIZE = 20;

/** Reintentos máximos ante fallo de red antes de descartar el lote. */
const MAX_RETRIES = 3;

/** Espera base para backoff exponencial (1 s, 2 s, 4 s). */
const RETRY_BASE_DELAY_MS = 1_000;

// ── Tipos ────────────────────────────────────────────────────────────────────────────

export interface TelemetryEventPayload {
  eventId: string;
  timestamp: string;
  sessionId: string | null;
  userId: string | null;
  event_type: string;
  schemaVersion: string;
  requestId: string;
  properties: Record<string, unknown>;
}

interface TelemetryBatchPayload {
  events: TelemetryEventPayload[];
}

// ── Estado interno del servicio ──────────────────────────────────────────────────────

/** Cola local de eventos pendientes de envío. */
let queue: TelemetryEventPayload[] = [];

/** Timer del debounce para flush periódico. */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Cache de sessionId en memoria. */
let cachedSessionId: string | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────────────

/** Genera un UUID v4. Usa crypto.randomUUID cuando está disponible. */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback para entornos sin crypto.randomUUID (ej. HTTP no seguro)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Recupera o crea un identificador único de sesión, persistido en
 * sessionStorage para que sobreviva navegaciones SPA dentro de la
 * misma pestaña, pero se renueve al abrir una nueva pestaña.
 */
function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") return null;
  if (cachedSessionId) return cachedSessionId;
  try {
    cachedSessionId = sessionStorage.getItem("nexova:sessionId");
    if (!cachedSessionId) {
      cachedSessionId = generateUUID();
      sessionStorage.setItem("nexova:sessionId", cachedSessionId);
    }
  } catch {
    // sessionStorage no disponible — generar uno volátil
    cachedSessionId = generateUUID();
  }
  return cachedSessionId;
}

/**
 * Obtiene el email del usuario autenticado desde la caché de sesión.
 * Retorna null si no hay sesión activa.
 */
function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = getCachedSession();
    if (cached?.email) return cached.email;
  } catch {
    // ignorar silenciosamente
  }
  return null;
}

/**
 * URL del endpoint de telemetría.
 * En Next.js las variables NEXT_PUBLIC_ se reemplazan en tiempo de
 * compilación, por lo que process.env funciona tanto en SSR como en
 * el navegador.
 */
const TELEMETRY_ENDPOINT =
  process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ||
  "http://localhost:8000/telemetry/events";

// ── Envío con reintentos (backoff exponencial) ──────────────────────────────────────

/**
 * Envía un lote de eventos al endpoint de telemetría.
 * Reintenta hasta MAX_RETRIES veces con backoff exponencial.
 * Si se agotan los reintentos, descarta el lote silenciosamente.
 */
async function sendBatch(events: TelemetryEventPayload[], attempt = 0): Promise<void> {
  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events } as TelemetryBatchPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    // Éxito — lote enviado
    return;
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.error(
        `[Telemetry] Flush failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`,
        err instanceof Error ? err.message : String(err),
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendBatch(events, attempt + 1);
    }

    // Se agotaron los reintentos — descartar el lote
    console.error(
      `[Telemetry] Flush failed after ${MAX_RETRIES} attempts — discarding batch of ${events.length} event(s)`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ── Flush con sendBeacon (para page hide / visibilitychange) ─────────────────────────

/**
 * Envía la cola pendiente usando navigator.sendBeacon.
 * Este método es la única forma confiable de enviar datos cuando la
 * página se está cerrando o escondiendo, ya que el navegador no
 * cancela estos requests como sí hace con fetch.
 */
function flushWithBeacon(): void {
  if (queue.length === 0) return;

  const events = queue.splice(0);
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    const blob = new Blob([JSON.stringify({ events } as TelemetryBatchPayload)], {
      type: "application/json",
    });
    navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
  } catch (err) {
    console.error(
      "[Telemetry] sendBeacon failed",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ── Flush vía fetch ─────────────────────────────────────────────────────────────────

/**
 * Vacía la cola actual y la envía al backend mediante fetch con
 * reintentos. El envío corre en segundo plano sin bloquear al
 * llamante (no se hace await).
 */
function flush(): void {
  if (queue.length === 0) return;

  const events = queue.splice(0);
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Enviar en segundo plano — no bloquear
  sendBatch(events);
}

// ── Programación del flush periódico ────────────────────────────────────────────────

/** Programa un flush automático dentro de FLUSH_INTERVAL_MS. */
function scheduleFlush(): void {
  if (flushTimer !== null) return; // ya hay un timer activo
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

// ── Inicialización al cargar el módulo ──────────────────────────────────────────────

/**
 * Registra el listener de visibilitychange para enviar la cola pendiente
 * cuando el usuario cierra la pestaña, cambia de pestaña o minimiza.
 */
function initVisibilityChangeHandler(): void {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushWithBeacon();
    }
  });
}

// Inicializar al cargar el módulo
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVisibilityChangeHandler);
  } else {
    initVisibilityChangeHandler();
  }
}

// ── API pública ─────────────────────────────────────────────────────────────────────

/**
 * Única función pública del TelemetryService.
 *
 * Registra un evento en la cola local. El evento se enriquece automáticamente
 * con eventId, sessionId, userId, timestamp, schemaVersion y requestId.
 * El envío al backend ocurre por lotes cada 10 segundos, al llegar a 20
 * eventos acumulados, o al ocultarse la página (sendBeacon).
 *
 * @param eventType - Tipo de evento en formato `entidad_accion` (ej: `page_view`,
 *                    `login_failed`, `inbound_order_created`). Se convierte en
 *                    el campo `event_type` del envelope.
 * @param properties - Payload específico del evento. Solo deben incluirse claves
 *                     definidas en el allowlist del event-schemas.json. Nunca
 *                     incluir PII (email, nombre, password).
 *
 * @example
 *   track("page_view", { path: "/dashboard", section: "inventory" });
 *   track("login_failed", { reason: "invalid_credentials" });
 */
export function track(eventType: string, properties: Record<string, unknown>): void {
  const event: TelemetryEventPayload = {
    eventId: generateUUID(),
    timestamp: new Date().toISOString(),
    sessionId: getOrCreateSessionId(),
    userId: getCurrentUserId(),
    event_type: eventType,
    schemaVersion: SCHEMA_VERSION,
    requestId: generateUUID(),
    properties,
  };

  queue.push(event);
  scheduleFlush();

  // Si la cola alcanzó el tamaño máximo, forzar envío inmediato
  if (queue.length >= BATCH_MAX_SIZE) {
    flush();
  }
}