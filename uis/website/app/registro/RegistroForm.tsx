"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./registro.module.css";

interface FormValues {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  experience_years: string;
  sector: string;
  english_level: string;
  availability: string;
  linkedin_url: string;
  comments: string;
  privacy: boolean;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  full_name: "",
  email: "",
  phone: "",
  country: "",
  experience_years: "",
  sector: "",
  english_level: "",
  availability: "",
  linkedin_url: "",
  comments: "",
  privacy: false,
};

const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")) ||
  "https://playground.4geeks.com/tracker/api/v1";

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const nameParts = values.full_name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    errors.full_name = "El nombre debe contener al menos nombre y apellido";
  }

  if (!values.email.trim()) {
    errors.email = "Ingresa un email válido (ejemplo: nombre@empresa.com)";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Ingresa un email válido (ejemplo: nombre@empresa.com)";
  }

  if (!values.phone.trim()) {
    errors.phone = "El teléfono debe incluir código de país (ejemplo: +34 612 345 678)";
  } else if (!/^\+\d{1,3}\s?\d{6,12}$/.test(values.phone.trim())) {
    errors.phone = "El teléfono debe incluir código de país (ejemplo: +34 612 345 678)";
  }

  if (!values.country) {
    errors.country = "Selecciona tu país de residencia";
  }

  if (!values.experience_years.trim()) {
    errors.experience_years = "Los años de experiencia deben estar entre 0 y 50";
  } else {
    const years = Number(values.experience_years);
    if (!Number.isFinite(years) || years < 0 || years > 50) {
      errors.experience_years = "Los años de experiencia deben estar entre 0 y 50";
    }
  }

  if (!values.sector) {
    errors.sector = "Selecciona el sector de tu interés";
  }

  if (!values.english_level) {
    errors.english_level = "Indica tu nivel de inglés";
  }

  if (!values.availability) {
    errors.availability = "Selecciona tu disponibilidad";
  }

  if (values.linkedin_url.trim()) {
    try {
      const url = new URL(values.linkedin_url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.linkedin_url = "Si incluyes LinkedIn, debe ser una URL válida";
      }
    } catch {
      errors.linkedin_url = "Si incluyes LinkedIn, debe ser una URL válida";
    }
  }

  if (values.comments.length > 500) {
    errors.comments = `Los comentarios no pueden exceder 500 caracteres (quedan ${500 - values.comments.length})`;
  }

  if (!values.privacy) {
    errors.privacy = "Debes aceptar la política de tratamiento de datos para continuar";
  }

  return errors;
}

export function RegistroForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback(
    (field: keyof FormValues, value: string | boolean) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        position: values.sector
          ? `Talento - ${values.sector}`
          : "Talento",
        linkedin_url: values.linkedin_url.trim() || null,
        cv_url: null,
        experience_years: Number(values.experience_years),
      };

      const response = await fetch(`${API_BASE_URL}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      setSubmitted(true);
      setFeedback({ tone: "success", message: "Registro completado con éxito." });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo completar el registro. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setFeedback(null);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.registroHero}>
          <div className={styles.registroHeroGlow} aria-hidden="true" />
          <div className={styles.container}>
            <h1>¡Gracias por tu interés en Nexova!</h1>
            <p>Tu registro se ha completado correctamente</p>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formCardInner}>
            <div className={styles.successBox}>
              <h2>¡Gracias por tu interés en Nexova!</h2>
              <p>
                Hemos recibido tu información. Nuestro equipo de selección la revisará y te contactaremos en caso de que tu perfil encaje con alguna de nuestras oportunidades actuales o futuras.
              </p>
              <p>
                Mientras tanto, síguenos en LinkedIn para estar al día de nuestras vacantes y contenido sobre desarrollo profesional.
              </p>
              <p style={{ fontSize: "0.84rem", fontWeight: 600, marginTop: "1rem" }}>
                Te redirigiremos al inicio automáticamente.
              </p>
              <Link href="/" className={styles.backBtn}>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.registroHero}>
        <div className={styles.registroHeroGlow} aria-hidden="true" />
        <div className={styles.container}>
          <h1>Únete al banco de talento de Nexova</h1>
          <p>
            Completa el formulario para compartir tu perfil profesional con nuestro equipo de selección.
          </p>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formCardInner}>
          <div className={styles.formCardHeader}>
            <p className={styles.kicker}>Formulario de aplicación / registro</p>
            <h2>Registro de talento</h2>
            <p>Comparte tus datos y te avisaremos cuando tengamos una oportunidad que encaje contigo.</p>
          </div>

          <div className={styles.empresaAviso}>
            ¿Eres una empresa buscando talento? Escríbenos a{" "}
            <a href="mailto:contacto@nexova.com">contacto@nexova.com</a>
          </div>

          {feedback && (
            <p className={feedback.tone === "success" ? styles.success : styles.error}>
              {feedback.message}
            </p>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Nombre completo *</label>
                <input
                  id="fullName"
                  type="text"
                  value={values.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="Ej: Ana García López"
                  autoComplete="name"
                />
                {errors.full_name && <span className={styles.fieldError}>{errors.full_name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                />
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Teléfono *</label>
                <input
                  id="phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+34 612 345 678"
                  autoComplete="tel"
                />
                {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="country">País de residencia *</label>
                <select
                  id="country"
                  value={values.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="es">España</option>
                  <option value="us">Estados Unidos</option>
                  <option value="other">Otro</option>
                </select>
                {errors.country && <span className={styles.fieldError}>{errors.country}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="experience">Años de experiencia *</label>
                <input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  value={values.experience_years}
                  onChange={(e) => handleChange("experience_years", e.target.value)}
                  placeholder="0"
                />
                {errors.experience_years && <span className={styles.fieldError}>{errors.experience_years}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="sector">Sector de interés *</label>
                <select
                  id="sector"
                  value={values.sector}
                  onChange={(e) => handleChange("sector", e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="tech">Tecnología</option>
                  <option value="retail">Retail</option>
                  <option value="finance">Servicios Financieros</option>
                  <option value="consulting">Consultoría</option>
                  <option value="other">Otro</option>
                </select>
                {errors.sector && <span className={styles.fieldError}>{errors.sector}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="englishLevel">Nivel de inglés *</label>
                <select
                  id="englishLevel"
                  value={values.english_level}
                  onChange={(e) => handleChange("english_level", e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="native">Nativo</option>
                </select>
                {errors.english_level && <span className={styles.fieldError}>{errors.english_level}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="linkedin">LinkedIn (URL del perfil)</label>
                <input
                  id="linkedin"
                  type="url"
                  value={values.linkedin_url}
                  onChange={(e) => handleChange("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/tu-perfil"
                />
                {errors.linkedin_url && <span className={styles.fieldError}>{errors.linkedin_url}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Disponibilidad *</label>
              <div className={styles.radioGroup}>
                {[
                  { value: "immediate", label: "Inmediata" },
                  { value: "1m", label: "1 mes" },
                  { value: "2-3m", label: "2-3 meses" },
                  { value: "exploring", label: "Solo explorando" },
                ].map((option) => (
                  <label key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={values.availability === option.value}
                      onChange={(e) => handleChange("availability", e.target.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.availability && <span className={styles.fieldError}>{errors.availability}</span>}
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="comments">Comentarios adicionales</label>
                <span className={styles.charCounter}>{values.comments.length}/500</span>
              </div>
              <textarea
                id="comments"
                rows={4}
                maxLength={500}
                value={values.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia y expectativas..."
              />
              {errors.comments && <span className={styles.fieldError}>{errors.comments}</span>}
            </div>

            <div className={styles.checkboxGroup}>
              <input
                id="privacy"
                type="checkbox"
                checked={values.privacy}
                onChange={(e) => handleChange("privacy", e.target.checked)}
              />
              <label htmlFor="privacy">
                Acepto la política de tratamiento de datos *
              </label>
            </div>
            {errors.privacy && <span className={styles.fieldError}>{errors.privacy}</span>}

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "Enviando registro..." : "Enviar registro"}
              </button>
              <button type="button" className={styles.resetBtn} onClick={handleReset}>
                Limpiar formulario
              </button>
              <Link href="/" className={styles.resetBtn}>
                Cancelar y volver
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}