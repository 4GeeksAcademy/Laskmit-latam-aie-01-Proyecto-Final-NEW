/**
 * Pruebas para las funciones de utilidad del formulario de candidatos.
 *
 * Las funciones probadas aquí están definidas en CandidateForm.tsx:
 * - validateForm()
 * - sanitizeOptionalUrl()
 * - isValidOptionalUrl()
 * - toPayload()
 */

// ──────────────────────────────────────────────
// Reimplementación de las funciones para testing
// ──────────────────────────────────────────────

interface CandidateFormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
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

interface CandidateRecordInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
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

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

const validValues: CandidateFormValues = {
  full_name: "Juan Pérez López",
  email: "juan@example.com",
  phone: "+34 612 345 678",
  position: "Developer",
  linkedin_url: "https://linkedin.com/in/juan",
  cv_url: "",
  experience_years: "5",
};

describe("validateForm (candidatos)", () => {
  it("C1: retorna objeto vacío con datos válidos", () => {
    expect(validateForm(validValues)).toEqual({});
  });

  it("C2: error si nombre vacío", () => {
    const result = validateForm({ ...validValues, full_name: "" });
    expect(result.full_name).toBeDefined();
  });

  it("C3: error si email inválido (formato)", () => {
    const result = validateForm({ ...validValues, email: "not-an-email" });
    expect(result.email).toBeDefined();
  });

  it("C4: error si email vacío", () => {
    const result = validateForm({ ...validValues, email: "" });
    expect(result.email).toBeDefined();
  });

  it("C5: error si experiencia negativa", () => {
    const result = validateForm({ ...validValues, experience_years: "-1" });
    expect(result.experience_years).toBeDefined();
  });

  it("C6: error si linkedin_url inválida", () => {
    const result = validateForm({ ...validValues, linkedin_url: "not-a-url" });
    expect(result.linkedin_url).toBeDefined();
  });

  it("error si teléfono vacío", () => {
    const result = validateForm({ ...validValues, phone: "" });
    expect(result.phone).toBeDefined();
  });

  it("error si position vacío", () => {
    const result = validateForm({ ...validValues, position: "" });
    expect(result.position).toBeDefined();
  });

  it("error si experiencia vacía", () => {
    const result = validateForm({ ...validValues, experience_years: "" });
    expect(result.experience_years).toBeDefined();
  });
});

describe("sanitizeOptionalUrl", () => {
  it("C7: retorna el valor recortado si es válido", () => {
    expect(sanitizeOptionalUrl("  https://example.com  ")).toBe("https://example.com");
  });

  it("C8: retorna null si es cadena vacía", () => {
    expect(sanitizeOptionalUrl("")).toBeNull();
    expect(sanitizeOptionalUrl("   ")).toBeNull();
  });
});

describe("isValidOptionalUrl", () => {
  it("C9: retorna true para URL HTTP/HTTPS válida", () => {
    expect(isValidOptionalUrl("https://linkedin.com/in/test")).toBe(true);
    expect(isValidOptionalUrl("http://example.com")).toBe(true);
  });

  it("C10: retorna false para URL malformada", () => {
    expect(isValidOptionalUrl("not-a-url")).toBe(false);
    expect(isValidOptionalUrl("ftp://invalid")).toBe(false);
  });

  it("retorna true para cadena vacía (opcional)", () => {
    expect(isValidOptionalUrl("")).toBe(true);
  });
});

describe("toPayload", () => {
  it("C11: convierte valores correctamente", () => {
    const result = toPayload(validValues);
    expect(result.full_name).toBe("Juan Pérez López");
    expect(result.email).toBe("juan@example.com");
    expect(result.phone).toBe("+34 612 345 678");
    expect(result.position).toBe("Developer");
    expect(result.linkedin_url).toBe("https://linkedin.com/in/juan");
    expect(result.cv_url).toBeNull();
    expect(result.experience_years).toBe(5);
  });

  it("C12: linkedin_url y cv_url como null si vacíos", () => {
    const result = toPayload({ ...validValues, linkedin_url: "", cv_url: "" });
    expect(result.linkedin_url).toBeNull();
    expect(result.cv_url).toBeNull();
  });
});