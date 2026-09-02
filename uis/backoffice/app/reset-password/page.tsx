"use client";

import Link from "next/link";
import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import type { PasswordActionResponse, ResetPasswordRequest } from "../../lib/auth-types";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordRef = useRef<HTMLInputElement>(null);
  const token = searchParams.get("token")?.trim() ?? "";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (!token) {
      setError("El enlace de restablecimiento no es válido o ha expirado.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      passwordRef.current?.focus();
      return;
    }
    if (newPassword !== confirmation) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload: ResetPasswordRequest = { token, new_password: newPassword };
      await apiRequest<PasswordActionResponse>("/auth/reset-password", {
        method: "POST",
        authenticated: false,
        body: payload,
      });
      router.replace("/login?passwordReset=success");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="reset-password-title">
        <p className="authEyebrow">Cuenta Nexova</p>
        <h1 id="reset-password-title">Nueva contraseña</h1>
        <p className="authIntro">Define una contraseña de al menos 8 caracteres.</p>

        {!token && (
          <p className="authError" role="alert">
            El enlace no contiene un token válido. <Link href="/forgot-password">Solicita uno nuevo</Link>.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="newPassword">Nueva contraseña</label>
          <input
            ref={passwordRef}
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "reset-password-error" : undefined}
          />

          <label htmlFor="confirmation">Confirmar contraseña</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />

          <p id="reset-password-error" className="authError" role="alert" aria-live="assertive">{error}</p>
          <button type="submit" disabled={submitting || !token}>
            {submitting ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        <p className="authAlternative"><Link href="/forgot-password">Solicitar otro enlace</Link></p>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="authState" role="status">Cargando...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
