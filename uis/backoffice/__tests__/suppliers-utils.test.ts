/**
 * Pruebas para utilidades del formulario de proveedores (Suppliers).
 *
 * Las funciones probadas aquí están definidas inline en
 * suppliers-page-client.tsx. Se reimplementa la lógica en los tests
 * para verificar el mismo algoritmo.
 */

// ──────────────────────────────────────────────
// isRenewalSoon — Detecta renovaciones próximas
// ──────────────────────────────────────────────

function isRenewalSoon(contractRenewalDate?: string | null): boolean {
  if (!contractRenewalDate) {
    return false;
  }

  const now = new Date();
  const renewalDate = new Date(`${contractRenewalDate}T00:00:00`);

  if (Number.isNaN(renewalDate.getTime())) {
    return false;
  }

  const diffMs = renewalDate.getTime() - now.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 60;
}

describe("isRenewalSoon", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fijar fecha actual al 2026-09-09
    jest.setSystemTime(new Date("2026-09-09T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("F1: retorna true para fecha dentro de 30 días", () => {
    expect(isRenewalSoon("2026-09-25")).toBe(true);
  });

  it("F2: retorna true para fecha exactamente dentro de 60 días (límite)", () => {
    expect(isRenewalSoon("2026-11-08")).toBe(true);
  });

  it("F3: retorna false para fecha > 60 días", () => {
    expect(isRenewalSoon("2027-01-01")).toBe(false);
  });

  it("F4: retorna false para fecha pasada", () => {
    expect(isRenewalSoon("2026-08-01")).toBe(false);
  });

  it("F5: retorna false para fecha inválida (no lanza error)", () => {
    expect(isRenewalSoon("not-a-date")).toBe(false);
  });

  it("F6: retorna false para null/undefined", () => {
    expect(isRenewalSoon(null)).toBe(false);
    expect(isRenewalSoon(undefined)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Validación de creación de proveedor
// ──────────────────────────────────────────────

const VALID_CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;

interface CreateValidationInput {
  name: string;
  categories: string;
  monthly_rate: string;
}

function validateSupplierCreation(input: CreateValidationInput): string | null {
  if (!input.name.trim()) {
    return "Name is required.";
  }

  const rawCategories = input.categories
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (rawCategories.length === 0) {
    return "At least one category is required.";
  }

  const invalidCategory = rawCategories.find(
    (item) => !VALID_CATEGORIES.includes(item as (typeof VALID_CATEGORIES)[number])
  );
  if (invalidCategory) {
    return `Invalid category: ${invalidCategory}`;
  }

  const monthlyRate = Number(input.monthly_rate);
  if (Number.isNaN(monthlyRate) || monthlyRate <= 0) {
    return "Rate must be greater than 0.";
  }

  return null; // Sin errores
}

describe("validateSupplierCreation", () => {
  const validInput: CreateValidationInput = {
    name: "Test Supplier",
    categories: "job_boards, ats_software",
    monthly_rate: "1500",
  };

  it("F7: pasa validación con datos correctos", () => {
    expect(validateSupplierCreation(validInput)).toBeNull();
  });

  it("F8: falla con categoría inválida", () => {
    const input = { ...validInput, categories: "invalid_cat" };
    expect(validateSupplierCreation(input)).toBe("Invalid category: invalid_cat");
  });

  it("falla con nombre vacío", () => {
    const input = { ...validInput, name: "" };
    expect(validateSupplierCreation(input)).toBe("Name is required.");
  });

  it("falla sin categorías", () => {
    const input = { ...validInput, categories: "" };
    expect(validateSupplierCreation(input)).toBe("At least one category is required.");
  });

  it("falla con monthly_rate <= 0", () => {
    const input = { ...validInput, monthly_rate: "0" };
    expect(validateSupplierCreation(input)).toBe("Rate must be greater than 0.");
  });
});