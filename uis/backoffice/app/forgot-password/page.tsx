"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import type { ForgotPasswordRequest, PasswordActionResponse } from "../../lib/auth-types";

export default function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    if (!email || !emailRef.current?.validity.valid) {
      setError("Introduce una dirección de email válida.");
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload: ForgotPasswordRequest = { email };
      const response = await apiRequest<PasswordActionResponse>("/auth/forgot-password", {
        method: "POST",
        authenticated: false,
        body: payload,
      });
      setMessage(response.message);
      setSent(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      emailRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="forgot-password-title">
        <p className="authEyebrow">Cuenta Nexova</p>
        <h1 id="forgot-password-title">Recuperar contraseña</h1>
        <p className="authIntro">Te enviaremos un enlace de restablecimiento si la dirección está registrada.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "forgot-password-error" : undefined}
          />

          <p id="forgot-password-error" className="authError" role="alert" aria-live="assertive">{error}</p>
          <p className="profileSuccess" role="status" aria-live="polite">{message}</p>
          <button type="submit" disabled={submitting || sent}>
            {submitting ? "Enviando..." : sent ? "Solicitud enviada" : "Enviar enlace"}
          </button>
        </form>

        <p className="authAlternative"><Link href="/login">Volver a iniciar sesión</Link></p>
      </section>
    </main>
  );
}
