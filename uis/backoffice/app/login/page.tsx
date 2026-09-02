"use client";

import Link from "next/link";
import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiRequest, getErrorMessage } from "../../lib/api-client";
import { clearAccessToken, setAccessToken } from "../../lib/auth";
import type { AuthToken } from "../../lib/auth-types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passwordReset = searchParams.get("passwordReset") === "success";

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

    setSubmitting(true);
    try {
      const token = await apiRequest<AuthToken>("/auth/login", {
        method: "POST",
        authenticated: false,
        body: { email, password },
      });
      setAccessToken(token.access_token);
      router.replace("/");
    } catch (requestError) {
      clearAccessToken();
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