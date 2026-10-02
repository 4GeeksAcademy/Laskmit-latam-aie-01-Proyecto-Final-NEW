"use client";

import Link from "next/link";
import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiRequest, getErrorMessage } from "../../lib/api-client";
import { clearAccessToken, setAccessToken } from "../../lib/auth";
import { clearCachedSession } from "../../lib/session-cache";
import type { AuthToken } from "../../lib/auth-types";
import { track } from "../../lib/telemetry";
import { initTelemetry } from "../../lib/telemetry-init";

function getClientIP(): string {
  // En entorno real, el IP se obtendría del servidor.
  // En el frontend, anonimizamos con un marcador.
  return "0.0.0.0";
}

function getEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "unknown";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passwordReset = searchParams.get("passwordReset") === "success";

  // Inicializar handlers globales de telemetría
  initTelemetry();

  // Emitir page view para login
  setTimeout(() => {
    track("navigation_section_entered", {
      section: "login",
      referrer_section: typeof document !== "undefined" && document.referrer
        ? new URL(document.referrer).pathname.replace(/^\//, "").split("/")[0] || "external"
        : null,
      user_role: null,
    });
  }, 100);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Completa el email y la contraseña.");
      emailRef.current?.focus();
      return;
    }

    // Emitir auth_login_attempted antes del envío
    track("auth_login_attempted", {
      email_domain: getEmailDomain(email),
      ip_address: getClientIP(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    setSubmitting(true);
    try {
      const token = await apiRequest<AuthToken>("/auth/login", {
        method: "POST",
        authenticated: false,
        body: { email, password },
      });
      // Éxito
      track("auth_login_succeeded", {
        email_domain: getEmailDomain(email),
        ip_address: getClientIP(),
        user_role: "operator", // se actualizará cuando /auth/me devuelva el rol
      });
      setAccessToken(token.access_token);
      clearCachedSession(); // limpiar caché antigua antes de navegar
      router.replace("/");
    } catch (requestError) {
      clearAccessToken();
      const failureReason =
        requestError instanceof ApiError && requestError.status === 401
          ? "invalid_credentials"
          : "network_error";
      track("auth_login_failed", {
        email_domain: getEmailDomain(email),
        ip_address: getClientIP(),
        failure_reason: failureReason,
      });
      setError(
        requestError instanceof ApiError && requestError.status === 401
          ? "El email o la contraseña no son correctos."
          : getErrorMessage(requestError),
      );
      emailRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="login-title">
        <p className="authEyebrow">Nexova Backoffice</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="authIntro">Accede a las herramientas internas de operaciones.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />

          <p className="authFieldLink"><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></p>

          <p className="authError" role="alert" aria-live="assertive">{error}</p>
          <p className="profileSuccess" role="status" aria-live="polite">
            {passwordReset ? "Tu contraseña fue actualizada. Ya puedes iniciar sesión." : ""}
          </p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="authAlternative">¿Aún no tienes cuenta? <Link href="/register">Crear cuenta</Link></p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="authState" role="status">Cargando...</main>}>
      <LoginForm />
    </Suspense>
  );
}