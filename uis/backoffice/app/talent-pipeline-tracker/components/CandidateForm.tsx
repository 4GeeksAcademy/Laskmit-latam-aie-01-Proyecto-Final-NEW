"use client";

import { useState } from "react";
import type { CandidateRecordInput } from "../../../../../services/api/clients/talentTrackerApi";
import type {
  CandidateFormValues,
  OperationFeedback,
} from "../types/talentTracker";
import styles from "../talent-pipeline.module.css";

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

function feedbackClass(tone: OperationFeedback["tone"]): string {
  if (tone === "success") return "success";
  if (tone === "info") return "info";
  return "error";
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
    <section className={styles.card}>
      <header style={{ marginBottom: "0.8rem" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.72rem", fontWeight: 700, color: "#4b6b86" }}>
          Nexova Talent Desk
        </p>
        <h2 style={{ marginTop: "0.3rem", fontSize: "1rem", color: "#15354f" }}>{title}</h2>
        <p style={{ marginTop: "0.3rem", fontSize: "0.84rem", color: "#59758f", lineHeight: 1.5 }}>{description}</p>
      </header>

      {feedback && (
        <p className={styles[feedbackClass(feedback.tone)]}>
          {feedback.message}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input
            value={values.full_name}
            onChange={(event) => handleFieldChange("full_name", event.target.value)}
            placeholder="Ej: Ana Garcia"
          />
          {errors.full_name && <span className={styles.formError}>{errors.full_name}</span>}
        </label>

        <label>
          Email
          <input
            type="email"
            value={values.email}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            placeholder="nombre@correo.com"
          />
          {errors.email && <span className={styles.formError}>{errors.email}</span>}
        </label>

        <label>
          Telefono
          <input
            value={values.phone}
            onChange={(event) => handleFieldChange("phone", event.target.value)}
            placeholder="+34 600 000 000"
          />
          {errors.phone && <span className={styles.formError}>{errors.phone}</span>}
        </label>

        <label>
          Puesto
          <input
            value={values.position}
            onChange={(event) => handleFieldChange("position", event.target.value)}
            placeholder="Asistente de Dirección"
          />
          {errors.position && <span className={styles.formError}>{errors.position}</span>}
        </label>

        <label>
          Anos de experiencia
          <input
            type="number"
            min="0"
            step="0.5"
            value={values.experience_years}
            onChange={(event) => handleFieldChange("experience_years", event.target.value)}
            placeholder="3"
          />
          {errors.experience_years && (
            <span className={styles.formError}>{errors.experience_years}</span>
          )}
        </label>

        <label>
          LinkedIn
          <input
            value={values.linkedin_url}
            onChange={(event) => handleFieldChange("linkedin_url", event.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
          {errors.linkedin_url && (
            <span className={styles.formError}>{errors.linkedin_url}</span>
          )}
        </label>

        <label>
          Enlace al CV
          <input
            value={values.cv_url}
            onChange={(event) => handleFieldChange("cv_url", event.target.value)}
            placeholder="https://.../cv.pdf"
          />
          {errors.cv_url && <span className={styles.formError}>{errors.cv_url}</span>}
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
      </form>
    </section>
  );
}