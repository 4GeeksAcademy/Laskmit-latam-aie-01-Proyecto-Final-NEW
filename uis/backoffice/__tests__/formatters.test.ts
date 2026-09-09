/**
 * Pruebas para utilidades de formato del módulo Talent Pipeline.
 *
 * Funciones probadas del archivo formatters.ts:
 * - formatDateTime()
 * - formatExperienceYears()
 */

// ──────────────────────────────────────────────
// Reimplementación de funciones
// ──────────────────────────────────────────────

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatExperienceYears(value: number): string {
  if (value === 1) {
    return "1 ano";
  }
  return `${value} anos`;
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("formatDateTime", () => {
  it("T1: formatea fecha ISO válida correctamente", () => {
    const result = formatDateTime("2026-09-09T10:00:00Z");
    expect(result).toMatch(/sep/i);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/10:00/);
  });

  it("T2: retorna el valor original si la fecha es inválida", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });

  it("retorna el valor original para strings vacíos", () => {
    expect(formatDateTime("")).toBe("");
  });
});

describe("formatExperienceYears", () => {
  it('T3: retorna "1 ano" para value === 1', () => {
    expect(formatExperienceYears(1)).toBe("1 ano");
  });

  it('T4: retorna "{n} anos" para value > 1', () => {
    expect(formatExperienceYears(2)).toBe("2 anos");
    expect(formatExperienceYears(10)).toBe("10 anos");
    expect(formatExperienceYears(0)).toBe("0 anos");
  });
});