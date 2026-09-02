"use client";

import { FormEvent, useRef, useState } from "react";
import { apiRequest, getErrorMessage } from "../../../lib/api-client";
import type { ChangePasswordRequest, PasswordActionResponse } from "../../../lib/auth-types";

export default function ChangePasswordPage() {
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Introduce tu contraseña actual.");
      currentPasswordRef.current?.focus();
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      newPasswordRef.current?.focus();
      return;
    }
    if (newPassword !== confirmation) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      newPasswordRef.current?.focus();
      return;
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente de la actual.");
      newPasswordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      const response = await apiRequest<PasswordActionResponse>("/auth/change-password", {
        method: "POST",
        body: payload,
      });
      formElement.reset();
      setSuccess(response.message);
      currentPasswordRef.current?.focus();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      currentPasswordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="profilePage">
      <section className="profilePanel" aria-labelledby="change-password-title">
        <p className="authEyebrow">Cuenta Nexova</p>
        <h1 id="change-password-title">Cambiar contraseña</h1>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="currentPassword">Contraseña actual</label>
          <input
            ref={currentPasswordRef}
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "change-password-error" : undefined}
          />

          <label htmlFor="newPassword">Nueva contraseña</label>
          <input
            ref={newPasswordRef}
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirmation">Confirmar nueva contraseña</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />

          <p id="change-password-error" className="authError" role="alert" aria-live="assertive">{error}</p>
          <p className="profileSuccess" role="status" aria-live="polite">{success}</p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}
