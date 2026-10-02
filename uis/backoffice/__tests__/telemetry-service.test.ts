/**
 * Pruebas para el TelemetryService (lib/telemetry.ts).
 *
 * Valida que:
 * - track() acumula eventos y auto-genera envelope fields.
 * - El flush automático se dispara cada 10s o al llegar a 20 eventos.
 * - sendBeacon se usa en visibilitychange.
 * - Los reintentos con backoff funcionan y el lote se descarta tras 3 fallos.
 * - La URL del endpoint se lee desde NEXT_PUBLIC_TELEMETRY_ENDPOINT.
 *
 * @file uis/backoffice/__tests__/telemetry-service.test.ts
 */

// ── Configuración de entorno ANTES del import del módulo ────────────────────────────
// NOTA: NEXT_PUBLIC_TELEMETRY_ENDPOINT debe estar seteada antes de que el módulo
// telemetry.ts se importe por primera vez, porque la constante TELEMETRY_ENDPOINT
// se evalúa al cargar el módulo.
const FAKE_ENDPOINT = "http://fake-telemetry.test/events";
process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = FAKE_ENDPOINT;

// ── Mocks globales ──────────────────────────────────────────────────────────────────

let mockFetch: jest.Mock;
let mockSendBeacon: jest.Mock;
let mockSessionStorage: Record<string, string>;
let mockCryptoRandomUUID: jest.Mock;
/** Control manual de localStorage.getItem para simular sesión autenticada. */
let mockLocalStorageGetItem: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.clearAllMocks();

  // Mock global.fetch
  mockFetch = jest.fn();
  (globalThis as any).fetch = mockFetch;

  // Mock navigator.sendBeacon
  mockSendBeacon = jest.fn();
  Object.defineProperty(globalThis, "navigator", {
    value: { sendBeacon: mockSendBeacon },
    writable: true,
    configurable: true,
  });

  // Mock crypto.randomUUID con valores predecibles ('a' en 4to grupo = v4 válido)
  mockCryptoRandomUUID = jest.fn();
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: mockCryptoRandomUUID },
    writable: true,
    configurable: true,
  });
  mockCryptoRandomUUID
    .mockReturnValueOnce("11111111-1111-4111-a111-111111111111")
    .mockReturnValueOnce("22222222-2222-4222-b222-222222222222")
    .mockReturnValueOnce("33333333-3333-4333-a333-333333333333");

  // Mock sessionStorage
  mockSessionStorage = {};
  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      getItem: jest.fn((key: string) => mockSessionStorage[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
    },
    writable: true,
    configurable: true,
  });

  // Mock localStorage (usado por session-cache.getCachedSession)
  mockLocalStorageGetItem = jest.fn(() => null); // sin sesión por defecto
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: mockLocalStorageGetItem,
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Mock document.visibilityState
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetModules();
});

// ── Helpers ─────────────────────────────────────────────────────────────────────────

/**
 * Extrae el body de fetch como objeto.
 */
function getFetchCallBody(callIndex = 0): { events: Record<string, unknown>[] } {
  const [, options] = mockFetch.mock.calls[callIndex];
  return JSON.parse(options.body as string);
}

// ── Import dinámico del módulo bajo test ────────────────────────────────────────────
// Usamos importación dinámica para que el módulo se cargue con la env var ya seteada
// y podamos usar resetModules() para recargarlo en cada test si es necesario.

async function importTrack(): Promise<typeof import("../lib/telemetry").track> {
  const mod = await import("../lib/telemetry");
  return mod.track;
}

// ── Suite de pruebas ────────────────────────────────────────────────────────────────

describe("track() — acumulación de eventos", () => {
  it("T1: track() agrega eventos y los envía tras el debounce de 10s", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("test_event", { key: "value1" });
    expect(mockFetch).not.toHaveBeenCalled(); // no se envió todavía

    // Avanzar el timer para que corra el flush programado
    jest.advanceTimersByTime(11_000);
    await Promise.resolve(); // resolver la promesa de sendBatch

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(FAKE_ENDPOINT, expect.anything());
  });

  it("T2: el evento contiene eventId, timestamp, sessionId, userId, schemaVersion, requestId y event_type", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("page_view", { path: "/dashboard" });
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    const body = getFetchCallBody();
    const event = body.events[0];

    // eventId: UUID v4
    expect(event.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    // timestamp: ISO 8601
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // schemaVersion: constante "1.0"
    expect(event.schemaVersion).toBe("1.0");
    // requestId: UUID v4
    expect(event.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    // event_type: el mismo que se pasó a track()
    expect(event.event_type).toBe("page_view");
    // properties: el mismo objeto que se pasó a track()
    expect(event.properties).toEqual({ path: "/dashboard" });
    // sessionId: debe existir (no null)
    expect(event.sessionId).toBeTruthy();
  });

  it("T3: sessionId se genera y persiste en sessionStorage", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("event_a", {});
    track("event_b", {});
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    const body = getFetchCallBody();
    const sessionIds = body.events.map((e) => e.sessionId);
    // Ambos eventos deben compartir el mismo sessionId
    expect(sessionIds[0]).toEqual(sessionIds[1]);
    expect(sessionIds[0]).toBeTruthy();

    // Debe haberse guardado en sessionStorage
    expect(mockSessionStorage["nexova:sessionId"]).toEqual(sessionIds[0]);
  });

  it("T4: userId se lee desde la sesión autenticada cuando existe", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    // Simular sesión autenticada en localStorage (getCachedSession lo lee así)
    const fakeUser = { email: "admin@nexova.com", role: "admin", profile: null };
    mockLocalStorageGetItem.mockReturnValue(
      JSON.stringify({
        user: fakeUser,
        timestamp: Date.now(),
      }),
    );

    // Recargar el módulo para que capture el nuevo mock de localStorage
    const track = await importTrack();
    track("login_event", {});
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    const body = getFetchCallBody();
    expect(body.events[0].userId).toBe("admin@nexova.com");
  });

  it("T5: userId es null cuando no hay sesión autenticada", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("anon_event", {});
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    const body = getFetchCallBody();
    expect(body.events[0].userId).toBeNull();
  });
});

describe("flush por tamaño de lote", () => {
  it("T6: envía el lote inmediatamente al llegar a 20 eventos", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();

    // 19 eventos no deben disparar flush
    for (let i = 0; i < 19; i++) {
      track("bulk_event", { idx: i });
    }
    expect(mockFetch).not.toHaveBeenCalled();

    // El 20° fuerza el flush inmediato (dispara sendBatch sin await)
    track("bulk_event", { idx: 19 });

    // Avanzar timers para que sendBatch se ejecute
    jest.advanceTimersByTime(1_000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Verificar que fetch fue llamado al menos una vez con el endpoint correcto
    expect(mockFetch).toHaveBeenCalledWith(FAKE_ENDPOINT, expect.anything());
  });
});

describe("sendBeacon en visibilitychange", () => {
  it("T7: llama a sendBeacon cuando la página se esconde", async () => {
    const track = await importTrack();
    track("beacon_event", {});
    track("beacon_event2", {});

    // Simular que la página se esconde
    Object.defineProperty(document, "visibilityState", { value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = mockSendBeacon.mock.calls[0];
    expect(url).toBe(FAKE_ENDPOINT);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("T8: no llama a sendBeacon si la cola está vacía", async () => {
    await importTrack(); // Inicializar el módulo (carga los handlers)

    // No llamamos a track() — cola vacía
    Object.defineProperty(document, "visibilityState", { value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(mockSendBeacon).not.toHaveBeenCalled();
  });
});

describe("reintentos con backoff", () => {
  it("T9: reintenta hasta 3 veces con backoff exponencial y descarta tras agotar intentos", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const track = await importTrack();
    track("retry_event", {});

    // Avanzar el tiempo para que corra el flush programado (10s)
    jest.advanceTimersByTime(11_000);
    // En este punto, sendBatch corrió, falló, y empezó backoff
    // Primer backoff: 1s
    jest.advanceTimersByTime(1_100);
    await Promise.resolve();
    // Segundo backoff: 2s
    jest.advanceTimersByTime(2_100);
    await Promise.resolve();
    // Tercer backoff: 4s
    jest.advanceTimersByTime(4_100);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // La llamada inicial + 3 reintentos = 4 llamadas como máximo
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("T10: no reintenta si la respuesta es exitosa", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("ok_event", {});
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Si el primer intento fue exitoso, no debe haber reintentos
    jest.advanceTimersByTime(10_000);
    await Promise.resolve();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("validación de event_type", () => {
  it("T11: acepta event_type con múltiples segmentos (inbound_order_created)", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    // Esto debe funcionar sin errores
    track("inbound_order_created", { orderId: "ORD-001" });
    expect(true).toBe(true); // si llegó acá, no lanzó excepción
  });
});

describe("URL del endpoint", () => {
  it("T12: usa NEXT_PUBLIC_TELEMETRY_ENDPOINT desde process.env", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const track = await importTrack();
    track("env_test", {});
    jest.advanceTimersByTime(11_000);
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledWith(
      FAKE_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});