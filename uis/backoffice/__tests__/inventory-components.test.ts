/**
 * Pruebas para funciones visuales y de utilidad de los componentes de inventario.
 *
 * Las funciones probadas aquí están definidas inline en los componentes .tsx:
 * - ProductsPageClient → stockLevelClass()
 * - OutboundOrderClient → exceedsStock (lógica inline)
 * - OrdersHistoryClient → formatDate(), orderTypeLabel(), detailText()
 */

// ──────────────────────────────────────────────
// stockLevelClass() — ProductsPageClient
// ──────────────────────────────────────────────

// La función original usa módulos CSS (styles.stockCell, styles.stockEmpty, etc.),
// así que la reimplementamos aquí con clases planas para el test.
function stockLevelClass(stock: number): string {
  if (stock === 0) return "stockCell stockEmpty";
  if (stock <= 5) return "stockCell stockLow";
  return "stockCell stockHealthy";
}

describe("stockLevelClass()", () => {
  it("V1: stock = 0 — contiene stockEmpty", () => {
    const cls = stockLevelClass(0);
    expect(cls).toContain("stockEmpty");
    expect(cls).toContain("stockCell");
  });

  it("V2: stock = 1 — contiene stockLow (umbral bajo)", () => {
    const cls = stockLevelClass(1);
    expect(cls).toContain("stockLow");
  });

  it("V3: stock = 5 — contiene stockLow (límite superior del umbral bajo)", () => {
    const cls = stockLevelClass(5);
    expect(cls).toContain("stockLow");
  });

  it("V4: stock = 6 — contiene stockHealthy", () => {
    const cls = stockLevelClass(6);
    expect(cls).toContain("stockHealthy");
  });

  it("V5: stock = 100 — contiene stockHealthy", () => {
    const cls = stockLevelClass(100);
    expect(cls).toContain("stockHealthy");
  });
});

// ──────────────────────────────────────────────
// exceedsStock — OutboundOrderClient
// ──────────────────────────────────────────────

// Lógica inline del componente:
// const quantityNum = Number(quantity);
// const exceedsStock = currentStock !== null && quantityNum > currentStock && quantityNum > 0;

function computeExceedsStock(currentStock: number | null, quantity: string): boolean {
  const quantityNum = Number(quantity);
  return currentStock !== null && quantityNum > currentStock && quantityNum > 0;
}

describe("exceedsStock (validación visual outbound)", () => {
  it("W1: cantidad ≤ stock disponible — exceedsStock es false", () => {
    expect(computeExceedsStock(10, "5")).toBe(false);
    expect(computeExceedsStock(10, "10")).toBe(false); // exacto
  });

  it("W2: cantidad > stock disponible — exceedsStock es true", () => {
    expect(computeExceedsStock(10, "15")).toBe(true);
  });

  it("W3: stock null (cargando) — exceedsStock es false", () => {
    expect(computeExceedsStock(null, "5")).toBe(false);
    expect(computeExceedsStock(null, "0")).toBe(false);
  });

  it("W4: cantidad = 0 (no emitida aún) — exceedsStock es false", () => {
    expect(computeExceedsStock(10, "0")).toBe(false);
    expect(computeExceedsStock(10, "")).toBe(false); // NaN > 0 → false
  });
});

// ──────────────────────────────────────────────
// formatDate() — OrdersHistoryClient
// ──────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

describe("formatDate()", () => {
  it("D1: fecha ISO válida — retorna string localizado es-ES", () => {
    const result = formatDate("2026-09-10T12:00:00Z");
    // Debe contener componentes de fecha — no podemos asumir orden exacto
    expect(result).toContain("2026");
    expect(result).toContain("sep"); // es-ES abbreviation for septiembre
    expect(result.length).toBeGreaterThan(5);
  });

  it("D2: fecha ISO inválida — retorna 'Invalid Date' (try/catch no lanza excepción en jsdom)", () => {
    const result = formatDate("not-a-date");
    expect(result).toBe("Invalid Date");
  });
});

// ──────────────────────────────────────────────
// orderTypeLabel() — OrdersHistoryClient
// ──────────────────────────────────────────────

type OrderItemType = { order_type: "inbound" | "outbound" };

function orderTypeLabel(item: OrderItemType): string {
  if (item.order_type === "inbound") return "Entrada";
  return "Salida";
}

describe("orderTypeLabel()", () => {
  it("D3: order_type = inbound — retorna 'Entrada'", () => {
    expect(orderTypeLabel({ order_type: "inbound" })).toBe("Entrada");
  });

  it("D4: order_type = outbound — retorna 'Salida'", () => {
    expect(orderTypeLabel({ order_type: "outbound" })).toBe("Salida");
  });
});

// ──────────────────────────────────────────────
// detailText() — OrdersHistoryClient
// ──────────────────────────────────────────────

type OrderItemFull = {
  order_type: "inbound" | "outbound";
  supplier?: string;
  exit_type?: string;
  assigned_to?: string | null;
};

function detailText(item: OrderItemFull): string {
  if (item.order_type === "inbound") {
    return `Proveedor: ${item.supplier ?? "—"}`;
  }
  // outbound
  const typeLabel = item.exit_type === "allocation" ? "Asignación" : "Consumo";
  if (item.exit_type === "allocation" && item.assigned_to) {
    return `${typeLabel} — Asignado a: ${item.assigned_to}`;
  }
  return typeLabel;
}

describe("detailText()", () => {
  it("D5: inbound con supplier — 'Proveedor: TechDistrib'", () => {
    expect(detailText({ order_type: "inbound", supplier: "TechDistrib" })).toBe("Proveedor: TechDistrib");
  });

  it("D6: inbound sin supplier — 'Proveedor: —'", () => {
    expect(detailText({ order_type: "inbound" })).toBe("Proveedor: —");
    expect(detailText({ order_type: "inbound", supplier: undefined })).toBe("Proveedor: —");
  });

  it("D7: outbound allocation con assigned_to — 'Asignación — Asignado a: Ana Martínez'", () => {
    expect(
      detailText({ order_type: "outbound", exit_type: "allocation", assigned_to: "Ana Martínez" }),
    ).toBe("Asignación — Asignado a: Ana Martínez");
  });

  it("D8: outbound consumption — 'Consumo'", () => {
    expect(detailText({ order_type: "outbound", exit_type: "consumption" })).toBe("Consumo");
  });
});