"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, getErrorMessage } from "../../lib/api-client";
import { clearAccessToken, setAccessToken } from "../../lib/auth";
import type { AuthToken } from "../../lib/auth-types";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

          <p className="authError" role="alert" aria-live="assertive">{error}</p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="authAlternative">¿Aún no tienes cuenta? <Link href="/register">Crear cuenta</Link></p>
      </section>
    </main>
  );
}