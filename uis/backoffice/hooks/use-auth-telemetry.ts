/**
 * useAuthTelemetry — Hook de telemetría para eventos de autenticación.
 *
 * Centraliza la emisión de eventos de autenticación en un solo lugar,
 * en lugar de tener track() disperso en cada página individual.
 *
 * Eventos que captura:
 * - auth_login_attempted
 * - auth_login_succeeded
 * - auth_login_failed (con failure_reason: invalid_credentials | network_error | session_expired)
 * - auth_session_expired
 * - auth_password_changed
 * - auth_password_reset_requested
 *
 * Ningún evento contiene PII (email, password, nombre completo, teléfono).
 *
 * @file uis/backoffice/hooks/use-auth-telemetry.ts
 */

import { track } from "../lib/telemetry";

// ── Helpers ──────────────────────────────────────────────────────────────────────

/** Obtiene una IP anonimizada del cliente (no es la IP real). */
function getClientIP(): string {
  return "0.0.0.0";
}

/** Extrae el dominio del email, sin el usuario (anonimización). */
function getEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "unknown";
}

/** Obtiene el user-agent del navegador. */
function getUserAgent(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent;
}

// ── Hook ─────────────────────────────────────────────────────────────────────────

/**
 * Hook que expone funciones para emitir eventos de telemetría de autenticación.
 *
 * Uso:
 * ```ts
 * const authTelemetry = useAuthTelemetry();
 * authTelemetry.trackLoginAttempted("user@dominio.com");
 * authTelemetry.trackLoginSucceeded("user@dominio.com", "operator");
 * authTelemetry.trackLoginFailed("user@dominio.com", "invalid_credentials");
 * ```
 */
export function useAuthTelemetry() {
  /**
   * Emite auth_login_attempted — antes de enviar credenciales al servidor.
   * @param email Email del usuario (solo se extrae el dominio)
   */
  function trackLoginAttempted(email: string): void {
    track("auth_login_attempted", {
      email_domain: getEmailDomain(email),
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
    });
  }

  /**
   * Emite auth_login_succeeded — después de recibir token válido.
   * @param email Email del usuario (solo se extrae el dominio)
   * @param userRole Rol del usuario autenticado
   */
  function trackLoginSucceeded(email: string, userRole?: string): void {
    track("auth_login_succeeded", {
      email_domain: getEmailDomain(email),
      ip_address: getClientIP(),
      user_role: userRole ?? "operator",
    });
  }

  /**
   * Emite auth_login_failed — cuando el servidor rechaza credenciales.
   * @param email Email del usuario (solo se extrae el dominio)
   * @param failureReason Razón del fallo: invalid_credentials | network_error | session_expired
   */
  function trackLoginFailed(email: string, failureReason: string): void {
    track("auth_login_failed", {
      email_domain: getEmailDomain(email),
      ip_address: getClientIP(),
      failure_reason: failureReason,
    });
  }

  /**
   * Emite auth_session_expired — cuando el token expira.
   * @param sessionDurationMinutes Minutos desde inicio de sesión hasta expiración
   * @param expiredAction Acción que desencadenó la detección de expiración
   */
  function trackSessionExpired(sessionDurationMinutes: number, expiredAction: string): void {
    track("auth_session_expired", {
      session_duration_minutes: sessionDurationMinutes,
      expired_action: expiredAction,
    });
  }

  /**
   * Emite auth_password_changed — después de cambiar contraseña exitosamente.
   */
  function trackPasswordChanged(): void {
    track("auth_password_changed", {});
  }

  /**
   * Emite auth_password_reset_requested — cuando el usuario solicita reseteo.
   * @param email Email del usuario (solo se extrae el dominio)
   */
  function trackPasswordResetRequested(email: string): void {
    track("auth_password_reset_requested", {
      email_domain: getEmailDomain(email),
      ip_address: getClientIP(),
    });
  }

  return {
    trackLoginAttempted,
    trackLoginSucceeded,
    trackLoginFailed,
    trackSessionExpired,
    trackPasswordChanged,
    trackPasswordResetRequested,
  };
}