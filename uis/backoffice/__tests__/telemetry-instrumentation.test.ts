/**
 * Tests para la Fase 3 — Instrumentación de métricas obligatorias + piso técnico.
 *
 * Verifica que todos los componentes y hooks del backoffice llaman a track()
 * con los event_type y properties correctos, según el plan de telemetría.
 *
 * Se usan mocks de track() para interceptar las llamadas sin enviar datos reales.
 *
 * @file uis/backoffice/__tests__/telemetry-instrumentation.test.ts
 */

// ── Mock de track() global ─────────────────────────────────────────────────────────
const mockTrack = jest.fn();
jest.mock("../lib/telemetry", () => ({
  track: mockTrack,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────────

/** Limpia los mocks entre tests y resetea los módulos de cliente. */
beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  mockTrack.mockClear();
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 1. Eventos Obligatorios (CONTEXT)
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-OBL — Eventos obligatorios del CONTEXT", () => {
  // Test no puede ejecutar los componentes reales (requieren DOM/Render),
  // pero verifica que los módulos exportan las funciones correctas.

  it("F3-OBL-01: inbound_order_created — se emite desde inbound-order-client", async () => {
    // Verificar que el archivo existe y tiene la llamada a track
    const fs = await import("fs");
    const content = fs.readFileSync(
      "app/backoffice/inventory/orders/inbound/inbound-order-client.tsx",
      "utf-8",
    );
    expect(content).toContain('track("inbound_order_created"');
    expect(content).toContain("product_id");
    expect(content).toContain("programme_id");
    expect(content).toContain("unit_cost");
    expect(content).toContain("supplier");
    expect(content).toContain("order_id");
    expect(content).toContain("quantity");
    expect(content).toContain("office");
    expect(content).toContain("currency");
  });

  it("F3-OBL-02: outbound_order_created — se emite desde outbound-order-client", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "app/backoffice/inventory/orders/outbound/outbound-order-client.tsx",
      "utf-8",
    );
    expect(content).toContain('track("outbound_order_created"');
    expect(content).toContain("exit_type");
    expect(content).toContain("assigned_to");
    expect(content).toContain("order_id");
  });

  it("F3-OBL-03: stock_threshold_triggered — se emite desde outbound-order-client", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "app/backoffice/inventory/orders/outbound/outbound-order-client.tsx",
      "utf-8",
    );
    expect(content).toContain('track("stock_threshold_triggered"');
    expect(content).toContain("threshold_minimum");
    expect(content).toContain("current_stock");
  });

  it("F3-OBL-04: insufficient_stock_rejected — se emite desde outbound-order-client", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "app/backoffice/inventory/orders/outbound/outbound-order-client.tsx",
      "utf-8",
    );
    expect(content).toContain('track("insufficient_stock_rejected"');
    expect(content).toContain("quantity_requested");
    expect(content).toContain("quantity_available");
  });

  it("F3-OBL-05: direct_stock_edit_rejected — NO instrumentado (sin punto de captura)", () => {
    // Este evento requiere que el backend rechace una edición directa de stock.
    // El frontend actual no tiene UI de edición directa de stock (solo órdenes),
    // por lo que no hay punto de instrumentación. Se documenta como exclusión.
    expect(true).toBe(true);
    console.warn(
      "[SKIP] direct_stock_edit_rejected: no hay UI de edición directa de stock en el frontend.",
    );
  });

  it("F3-OBL-06: kit_cost_variance_detected — NO instrumentado (responsabilidad del backend)", () => {
    // La detección de variación de costos ocurre en el backend al recibir
    // una orden de entrada (inbound). Es responsabilidad del backend emitir
    // este evento, no del frontend.
    expect(true).toBe(true);
    console.warn(
      "[SKIP] kit_cost_variance_detected: ocurre en backend al validar costos de inbound_order.",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 2. Piso técnico transversal (global handlers)
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-PISO — Piso técnico transversal", () => {
  it("F3-PISO-01: telemetry-init.ts registra window.onerror para error_frontend_unhandled", async () => {
    // Verificar que telemetry-init.ts define el handler
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain('window.onerror = handleUnhandledError');
    expect(content).toContain('track("error_frontend_unhandled"');
    expect(content).toContain("error_message");
    expect(content).toContain("component");
  });

  it("F3-PISO-02: telemetry-init.ts registra listener para unhandledrejection", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain('"unhandledrejection"');
    expect(content).toContain("handleUnhandledRejection");
  });

  it("F3-PISO-03: performance_api_latency_recorded — medido en api-client.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/api-client.ts", "utf-8");
    expect(content).toContain('track("performance_api_latency_recorded"');
    expect(content).toContain("latency_ms");
    expect(content).toContain("endpoint");
  });

  it("F3-PISO-04: navigation_section_entered — instrumentado en páginas principales", async () => {
    const fs = await import("fs");
    // Verificar en las páginas principales del backoffice
    const pages = [
      "app/backoffice/inventory/products/page.tsx",
      "app/backoffice/inventory/orders/page.tsx",
      "app/backoffice/inventory/orders/inbound/page.tsx",
      "app/backoffice/inventory/orders/outbound/page.tsx",
      "app/suppliers/page.tsx",
      "app/incidents/page.tsx",
      "app/incidents-analyzer/page.tsx",
      "app/login/page.tsx",
      "app/account/profile/page.tsx",
      "app/account/change-password/page.tsx",
      "app/forgot-password/page.tsx",
      "app/talent-pipeline-tracker/page.tsx",
    ];
    for (const page of pages) {
      const content = fs.readFileSync(page, "utf-8");
      expect(content).toContain('track("navigation_section_entered"');
    }
  });

  it("F3-PISO-05: navigation_section_entered también en auth-navigation.tsx", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("components/auth/auth-navigation.tsx", "utf-8");
    expect(content).toContain('track("navigation_section_entered"');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 3. Eventos de autenticación
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-AUTH — Eventos de autenticación", () => {
  // Tras centralizar auth events en hooks/use-auth-telemetry.ts, verificamos
  // el archivo del hook en lugar de las páginas individuales.

  it("F3-AUTH-01: auth_login_attempted en hooks/use-auth-telemetry.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_login_attempted"');
    expect(content).toContain("email_domain");
    expect(content).toContain("ip_address");
    expect(content).toContain("user_agent");
  });

  it("F3-AUTH-02: auth_login_succeeded en hooks/use-auth-telemetry.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_login_succeeded"');
    expect(content).toContain("email_domain");
    expect(content).toContain("user_role");
  });

  it("F3-AUTH-03: auth_login_failed en hooks/use-auth-telemetry.ts (sin password)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_login_failed"');
    expect(content).toContain("failure_reason");
    // No debe pasarse la contraseña en el evento
    const trackLoginFailed = content.match(/track\("auth_login_failed",\s*\{[^}]+\}\)/);
    expect(trackLoginFailed).not.toBeNull();
    if (trackLoginFailed) {
      expect(trackLoginFailed[0]).not.toContain("password");
    }
  });

  it("F3-AUTH-04: auth_password_changed en hooks/use-auth-telemetry.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_password_changed"');
  });

  it("F3-AUTH-05: auth_password_reset_requested en hooks/use-auth-telemetry.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_password_reset_requested"');
    expect(content).toContain("email_domain");
    expect(content).toContain("ip_address");
  });

  it("F3-AUTH-06: auth_session_expired en api-client.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/api-client.ts", "utf-8");
    expect(content).toContain('track("auth_session_expired"');
    expect(content).toContain("session_duration_minutes");
    expect(content).toContain("expired_action");
  });

  it("F3-AUTH-07: auth_login_succeeded también en hooks/use-auth-telemetry.ts (trackLoginSucceeded)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-auth-telemetry.ts", "utf-8");
    expect(content).toContain('track("auth_login_succeeded"');
    expect(content).toContain("trackLoginSucceeded");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 4. Eventos de error
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-ERR — Eventos de error", () => {
  it("F3-ERR-01: error_api_exception en api-client.ts (network error)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/api-client.ts", "utf-8");
    // Dos ocurrencias: una en catch de network error, otra en status >= 500
    const matches = content.match(/track\("error_api_exception"/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it("F3-ERR-02: error_api_validation_failure en api-client.ts (status 422)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/api-client.ts", "utf-8");
    expect(content).toContain('track("error_api_validation_failure"');
    expect(content).toContain("status_code: 422");
  });

  it("F3-ERR-03: error_frontend_unhandled en telemetry-init.ts (window.onerror)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    // El handler emite error_frontend_unhandled con error_message, component, source, lineno, colno, path
    expect(content).toContain('track("error_frontend_unhandled"');
    expect(content).toContain("error_message");
    expect(content).toContain("occurrence_count");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 5. Eventos de rendimiento y Web Vitals (Actividad adicional)
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-PERF — Eventos de rendimiento", () => {
  it("F3-PERF-01: performance_api_latency_recorded — sampleado al 10% en api-client.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/api-client.ts", "utf-8");
    expect(content).toContain('track("performance_api_latency_recorded"');
    expect(content).toContain("sample_rate");
    expect(content).toContain("0.1");
  });

  it("F3-PERF-02: performance_api_latency_recorded — page load timing en telemetry-init.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain('track("performance_api_latency_recorded"');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 6. Web Vitals (Actividad adicional)
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-WEBVITALS — Web Vitals (Actividad adicional)", () => {
  it("F3-WEB-01: web_vital_recorded se emite desde telemetry-init.ts", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain('track("web_vital_recorded"');
    expect(content).toContain("value_ms");
    expect(content).toContain("metric");
    expect(content).toContain("PerformanceObserver");
  });

  it("F3-WEB-02: web_vital_lcp, web_vital_fcp, web_vital_ttfb, web_vital_fid se asignan dinámicamente", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain("web_vital_lcp");
    expect(content).toContain("web_vital_fcp");
    expect(content).toContain("web_vital_ttfb");
    expect(content).toContain("web_vital_fid");
  });

  it("F3-WEB-03: Web Vitals incluyen path y component en properties", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain("web_vital_recorded");
    expect(content).toContain("path");
    expect(content).toContain("component");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 6b. Hook de autenticación (Actividad adicional — centralización)
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-HOOK — useAuthTelemetry (Actividad adicional)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("F3-HOOK-01: trackLoginAttempted llama a track('auth_login_attempted')", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackLoginAttempted("user@example.com");
    expect(mockTrack).toHaveBeenCalledWith("auth_login_attempted", expect.objectContaining({
      email_domain: "example.com",
      ip_address: "0.0.0.0",
    }));
  });

  it("F3-HOOK-02: trackLoginSucceeded llama a track('auth_login_succeeded')", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackLoginSucceeded("user@example.com", "operator");
    expect(mockTrack).toHaveBeenCalledWith("auth_login_succeeded", expect.objectContaining({
      email_domain: "example.com",
      user_role: "operator",
    }));
  });

  it("F3-HOOK-03: trackLoginFailed llama a track('auth_login_failed') con failure_reason", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackLoginFailed("user@example.com", "invalid_credentials");
    expect(mockTrack).toHaveBeenCalledWith("auth_login_failed", expect.objectContaining({
      email_domain: "example.com",
      failure_reason: "invalid_credentials",
    }));
  });

  it("F3-HOOK-04: trackPasswordChanged llama a track('auth_password_changed')", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackPasswordChanged();
    expect(mockTrack).toHaveBeenCalledWith("auth_password_changed", expect.objectContaining({}));
  });

  it("F3-HOOK-05: trackPasswordResetRequested llama a track('auth_password_reset_requested')", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackPasswordResetRequested("user@example.com");
    expect(mockTrack).toHaveBeenCalledWith("auth_password_reset_requested", expect.objectContaining({
      email_domain: "example.com",
      ip_address: "0.0.0.0",
    }));
  });

  it("F3-HOOK-06: trackSessionExpired llama a track('auth_session_expired')", async () => {
    const { useAuthTelemetry } = await import("../hooks/use-auth-telemetry");
    const hook = useAuthTelemetry();
    hook.trackSessionExpired(30, "api_request");
    expect(mockTrack).toHaveBeenCalledWith("auth_session_expired", expect.objectContaining({
      session_duration_minutes: 30,
      expired_action: "api_request",
    }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 7. Inicialización global
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-INIT — Inicialización global", () => {
  it("F3-INIT-01: TelemetryInit componente existe y llama a initTelemetry()", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("components/telemetry-init.tsx", "utf-8");
    expect(content).toContain("initTelemetry()");
  });

  it("F3-INIT-02: initTelemetry() registra handlers de error, web vitals y page load timing", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/telemetry-init.ts", "utf-8");
    expect(content).toContain("registerGlobalErrorHandlers");
    expect(content).toContain("registerWebVitalsCapture");
    expect(content).toContain("recordPageLoadTiming");
  });

  it("F3-INIT-03: initTelemetry se importa y llama desde auth-navigation.tsx (página inicial)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("components/auth/auth-navigation.tsx", "utf-8");
    expect(content).toContain("initTelemetry()");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 8. No-PII: Verificar que ningún evento contiene datos personales
// ═══════════════════════════════════════════════════════════════════════════════════

describe("F3-PII — Sin datos personales en eventos", () => {
  // Verifica que las llamadas a track() NO contengan datos personales reales.
  // Datos anonimizados (email_domain, ip_address como "0.0.0.0") son aceptables.
  // Solo se marcan como PII si se pasa el valor RAW de email, contraseña, etc.
  const FILES_WITH_TRACK = [
    "hooks/use-auth-telemetry.ts",
    "app/backoffice/inventory/orders/inbound/inbound-order-client.tsx",
    "app/backoffice/inventory/orders/outbound/outbound-order-client.tsx",
    "lib/api-client.ts",
    "lib/telemetry-init.ts",
  ];

  for (const file of FILES_WITH_TRACK) {
    it(`No contiene PII en properties en ${file}`, async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(file, "utf-8");
      // Extraer solo las llamadas a track() con su objeto de properties
      // Usamos regex más preciso que captura track("event_type", {...}) para evitar JSDoc
      const trackCalls = content.match(/track\(["'][a-z_]+["'],\s*\{[^}]+\}\)/g) || [];
      for (const call of trackCalls) {
        // 1. No debe pasarse la variable "password" como valor de property
        //    (nombres de sección como "forgot-password" NO son PII)
        expect(call).not.toMatch(/:\s*password(?:\s*[,})]|$)/g);

        // 2. No debe pasarse un email RAW (ej: "user@example.com"), solo email_domain
        //    La función getEmailDomain(email) es aceptable porque devuelve solo el dominio
        if (call.includes("email_domain")) {
          // OK — solo el dominio
        } else if (call.includes("email")) {
          // Si tiene "email" sin "_domain", podría ser PII — verificarlo
          expect(call).toMatch(/email_domain/);
        }

        // 3. No debe pasarse el nombre completo del usuario
        expect(call).not.toMatch(/['"`]full_name['"`]/);
        expect(call).not.toMatch(/['"`]complete_name['"`]/);

        // 4. No debe pasarse el teléfono del usuario
        expect(call).not.toMatch(/['"`]phone['"`]\s*:/);
        expect(call).not.toMatch(/customer_phone/);
        expect(call).not.toMatch(/contact_phone/);
      }
    });
  }
});