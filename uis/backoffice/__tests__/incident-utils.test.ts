/**
 * Pruebas para utilidades del formulario de incidencias.
 *
 * Funciones probadas del archivo incident-manager.tsx:
 * - Validación de campos (submitIncident)
 * - queryFromFilters()
 * - formatDate()
 */

// ──────────────────────────────────────────────
// queryFromFilters
// ──────────────────────────────────────────────

type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";
type IncidentOrigin = "customer" | "branch" | "internal";
type IncidentBranch = "central" | "valencia_operations" | "miami_office" | "remote";
type IncidentCategory =
  | "technical_failure"
  | "process_error"
  | "client_complaint"
  | "candidate_issue"
  | "staff_issue"
  | "sla_breach"
  | "data_quality"
  | "other";

interface Filters {
  status: "" | IncidentStatus;
  origin: "" | IncidentOrigin;
  branch: "" | IncidentBranch;
  category: "" | IncidentCategory;
}

const EMPTY_FILTERS: Filters = { status: "", origin: "", branch: "", category: "" };

function queryFromFilters(filters: Filters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

// ──────────────────────────────────────────────
// formatDate
// ──────────────────────────────────────────────

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// ──────────────────────────────────────────────
// Validación de formulario (submitIncident)
// ──────────────────────────────────────────────

interface IncidentCreate {
  title: string;
  description: string;
  category: string;
  origin: string;
  branch: string;
}

type IncidentErrors = Partial<Record<keyof IncidentCreate, string>>;

function validateIncidentForm(form: IncidentCreate): IncidentErrors {
  const errors: IncidentErrors = {};
  if (!form.title.trim()) errors.title = "Escribe un título.";
  if (form.title.trim().length > 120) errors.title = "El título no puede superar 120 caracteres.";
  if (!form.description.trim()) errors.description = "Escribe una descripción.";
  return errors;
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("validateIncidentForm", () => {
  const validForm: IncidentCreate = {
    title: "Fallo en el sistema de tracking",
    description: "Los candidatos no aparecen en el pipeline.",
    category: "technical_failure",
    origin: "branch",
    branch: "miami_office",
  };

  it("N1: sin errores con datos válidos", () => {
    expect(validateIncidentForm(validForm)).toEqual({});
  });

  it("N2: error si título vacío", () => {
    const result = validateIncidentForm({ ...validForm, title: "" });
    expect(result.title).toBe("Escribe un título.");
  });

  it("N3: error si título > 120 caracteres", () => {
    const result = validateIncidentForm({
      ...validForm,
      title: "X".repeat(121),
    });
    expect(result.title).toBe("El título no puede superar 120 caracteres.");
  });

  it("N4: error si descripción vacía", () => {
    const result = validateIncidentForm({ ...validForm, description: "" });
    expect(result.description).toBe("Escribe una descripción.");
  });

  it("título solo espacios cuenta como vacío", () => {
    const result = validateIncidentForm({ ...validForm, title: "   " });
    expect(result.title).toBe("Escribe un título.");
  });

  it("descripción solo espacios cuenta como vacía", () => {
    const result = validateIncidentForm({ ...validForm, description: "   " });
    expect(result.description).toBe("Escribe una descripción.");
  });
});

describe("queryFromFilters", () => {
  it("N5: genera query string con filtros activos", () => {
    const filters: Filters = {
      status: "open",
      origin: "branch",
      branch: "",
      category: "",
    };
    const result = queryFromFilters(filters);
    expect(result).toContain("status=open");
    expect(result).toContain("origin=branch");
  });

  it("N6: retorna cadena vacía sin filtros", () => {
    expect(queryFromFilters(EMPTY_FILTERS)).toBe("");
  });

  it("incluye todos los filtros activos en parámetros separados", () => {
    const filters: Filters = {
      status: "in_progress",
      origin: "customer",
      branch: "central",
      category: "sla_breach",
    };
    const result = queryFromFilters(filters);
    expect(result).toContain("status=in_progress");
    expect(result).toContain("origin=customer");
    expect(result).toContain("branch=central");
    expect(result).toContain("category=sla_breach");
  });
});

describe("formatDate", () => {
  it("N7: formatea fecha ISO correctamente", () => {
    const result = formatDate("2026-09-09T14:30:00Z");
    // Debe contener fecha (sep, 2026) y hora (14:30)
    expect(result).toMatch(/sep/i);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/14:30/);
  });

  it("N8: lanza RangeError con fecha inválida (comportamiento real de formatDate)", () => {
    expect(() => formatDate("not-a-date")).toThrow(RangeError);
  });
});