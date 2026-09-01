"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, getErrorMessage } from "../../lib/api-client";
import { clearAccessToken, setAccessToken } from "../../lib/auth";
import type { AuthToken } from "../../lib/auth-types";

type FieldName = "email" | "password" | "confirmPassword" | "name" | "phone" | "address";
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_NAMES = new Set<FieldName>(["email", "password", "name", "phone", "address"]);

function validationErrors(error: ApiError): FieldErrors {
  const errors: FieldErrors = {};
  for (const detail of error.details) {
    const field = detail.loc?.at(-1);
    if (typeof field === "string" && FIELD_NAMES.has(field as FieldName)) {
      errors[field as FieldName] = detail.msg;
    }
  }
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function focusFirstInvalid(errors: FieldErrors): void {
    const field = Object.keys(errors)[0];
    if (field) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const optionalFields = {
      name: String(form.get("name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
    };
    const errors: FieldErrors = {};

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Introduce un email válido.";
    if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
    if (password !== confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstInvalid(errors);
      return;
    }

    setSubmitting(true);
    let accountCreated = registered;
    try {
      if (!registered) {
        const body: Record<string, unknown> = { email, password };
        for (const [key, value] of Object.entries(optionalFields)) {
          if (value) body[key] = value;
        }
        await apiRequest<unknown>("/users", { method: "POST", authenticated: false, body });
        accountCreated = true;
        setRegistered(true);
      }

      const token = await apiRequest<AuthToken>("/auth/login", {
        method: "POST",
        authenticated: false,
        body: { email, password },
      });
      setAccessToken(token.access_token);
      router.replace("/");
    } catch (requestError) {
      clearAccessToken();
      if (requestError instanceof ApiError && requestError.status === 422) {
        const mappedErrors = validationErrors(requestError);
        setFieldErrors(mappedErrors);
        setError(Object.keys(mappedErrors).length ? "Revisa los campos indicados." : requestError.message);
        focusFirstInvalid(mappedErrors);
      } else if (accountCreated) {
        setError("La cuenta se creó, pero no fue posible iniciar sesión. Puedes intentarlo desde el acceso.");
      } else {
        setError(getErrorMessage(requestError));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel authPanelWide" aria-labelledby="register-title">
        <p className="authEyebrow">Nexova Backoffice</p>
        <h1 id="register-title">Crear cuenta</h1>
        <p className="authIntro">Configura tu acceso y los datos básicos de contacto.</p>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="authFormGrid">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
              {fieldErrors.email && <p id="email-error" className="fieldError">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="name">Nombre <span>(opcional)</span></label>
              <input id="name" name="name" type="text" autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} />
              {fieldErrors.name && <p id="name-error" className="fieldError">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} />
              {fieldErrors.password && <p id="password-error" className="fieldError">{fieldErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? "confirm-error" : undefined} />
              {fieldErrors.confirmPassword && <p id="confirm-error" className="fieldError">{fieldErrors.confirmPassword}</p>}
            </div>
            <div>
              <label htmlFor="phone">Teléfono <span>(opcional)</span></label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} />
              {fieldErrors.phone && <p id="phone-error" className="fieldError">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label htmlFor="address">Dirección <span>(opcional)</span></label>
              <input id="address" name="address" type="text" autoComplete="street-address" aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? "address-error" : undefined} />
              {fieldErrors.address && <p id="address-error" className="fieldError">{fieldErrors.address}</p>}
            </div>
          </div>

          <p ref={errorRef} className="authError" role="alert" aria-live="assertive" tabIndex={-1}>{error}</p>
          {!registered && <button type="submit" disabled={submitting}>{submitting ? "Creando cuenta..." : "Crear cuenta"}</button>}
        </form>

        <p className="authAlternative">{registered ? "La cuenta ya está creada. " : "¿Ya tienes cuenta? "}<Link href="/login">Iniciar sesión</Link></p>
      </section>
    </main>
  );
}