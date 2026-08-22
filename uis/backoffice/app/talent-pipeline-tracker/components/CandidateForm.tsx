"use client";

import { useState } from "react";
import type { CandidateRecordInput } from "../../../../services/api/clients/talentTrackerApi";
import type {
  CandidateFormValues,
  OperationFeedback,
} from "../types/talentTracker";

interface CandidateFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialValues: CandidateFormValues;
  onSubmit: (payload: CandidateRecordInput) => Promise<void>;
  isSubmitting: boolean;
  feedback: OperationFeedback | null;
}

type FormErrors = Partial<Record<keyof CandidateFormValues, string>>;

function sanitizeOptionalUrl(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function isValidOptionalUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(values: CandidateFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "El nombre completo es obligatorio.";
  }

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Introduce un email valido.";
  }

  if (!values.phone.trim()) {
    errors.phone = "El telefono es obligatorio.";
  }

  if (!values.position.trim()) {
    errors.position = "El puesto es obligatorio.";
  }

  if (!values.experience_years.trim()) {
    errors.experience_years = "La experiencia es obligatoria.";
  } else {
    const years = Number(values.experience_years);

    if (!Number.isFinite(years) || years < 0) {
      errors.experience_years = "Introduce un numero valido de anos de experiencia.";
    }
  }

  if (!isValidOptionalUrl(values.linkedin_url)) {
    errors.linkedin_url = "Introduce una URL valida para LinkedIn.";
  }

  if (!isValidOptionalUrl(values.cv_url)) {
    errors.cv_url = "Introduce una URL valida para el CV.";
  }

  return errors;
}

function toPayload(values: CandidateFormValues): CandidateRecordInput {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    position: values.position.trim(),
    linkedin_url: sanitizeOptionalUrl(values.linkedin_url),
    cv_url: sanitizeOptionalUrl(values.cv_url),
    experience_years: Number(values.experience_years),
  };
}

function feedbackClasses(tone: OperationFeedback["tone"]): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "info") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
}

export function CandidateForm({
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
  isSubmitting,
  feedback,
}: CandidateFormProps) {
  const [values, setValues] = useState<CandidateFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleFieldChange = (field: keyof CandidateFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit(toPayload(values));
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          Nexova Talent Desk
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </header>

      {feedback && (
        <p className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${feedbackClasses(feedback.tone)}`}>
          {feedback.message}
        </p>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nombre completo
          <input
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            value={values.full_name}
            onChange={(event) => handleFieldChange("full_name", event.target.value)}
            placeholder="Ej: Ana Garcia"
          />
          {errors.full_name && <span className="text-xs text-rose-700">{errors.full_name}</span>}
        </label>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              type="email"
              value={values.email}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              placeholder="nombre@correo.com"
            />
            {errors.email && <span className="text-xs text-rose-700">{errors.email}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Telefono
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              value={values.phone}
              onChange={(event) => handleFieldChange("phone", event.target.value)}
              placeholder="+34 600 000 000"
            />
            {errors.phone && <span className="text-xs text-rose-700">{errors.phone}</span>}
          </label>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Puesto
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              value={values.position}
              onChange={(event) => handleFieldChange("position", event.target.value)}
              placeholder="Asistente de Dirección"
            />
            {errors.position && <span className="text-xs text-rose-700">{errors.position}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Anos de experiencia
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              type="number"
              min="0"
              step="0.5"
              value={values.experience_years}
              onChange={(event) => handleFieldChange("experience_years", event.target.value)}
              placeholder="3"
            />
            {errors.experience_years && (
              <span className="text-xs text-rose-700">{errors.experience_years}</span>
            )}
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          LinkedIn
          <input
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            value={values.linkedin_url}
            onChange={(event) => handleFieldChange("linkedin_url", event.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
          {errors.linkedin_url && (
            <span className="text-xs text-rose-700">{errors.linkedin_url}</span>
          )}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Enlace al CV
          <input
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            value={values.cv_url}
            onChange={(event) => handleFieldChange("cv_url", event.target.value)}
            placeholder="https://.../cv.pdf"
          />
          {errors.cv_url && <span className="text-xs text-rose-700">{errors.cv_url}</span>}
        </label>

        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
      </form>
    </section>
  );
}