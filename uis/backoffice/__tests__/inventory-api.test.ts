/**
 * Pruebas para lib/inventory.ts — funciones de API del módulo de inventario.
 *
 * Se mockea apiRequest para simular respuestas HTTP sin depender del backend.
 */

import { apiRequest } from "../lib/api-client";

// Module-level mock: intercept every call to apiRequest
jest.mock("../lib/api-client", () => {
  const original = jest.requireActual("../lib/api-client");
  return {
    ...original,
    apiRequest: jest.fn(),
  };
});

import {
  getProducts,
  getProduct,
  createProduct,
  createInboundOrder,
  createOutboundOrder,
  getOrders,
  type InventoryProduct,
  type InboundOrderResponse,
  type OutboundOrderResponse,
  type OrderItem,
  type CreateProductData,
  type InboundOrderData,
  type OutboundOrderData,
} from "../lib/inventory";

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function mockProduct(overrides: Partial<InventoryProduct> = {}): InventoryProduct {
  return {
    id: 1,
    name: "Monitor Dell",
    sku: "MON-DELL-27",
    category: "hardware",
    office: "Valencia",
    current_stock: 8,
    ...overrides,
  };
}

function mockInboundResponse(overrides: Partial<InboundOrderResponse> = {}): InboundOrderResponse {
  return {
    id: 10,
    asset_id: 1,
    quantity: 5,
    supplier: "TechDistrib",
    office: "Valencia",
    created_at: "2026-09-10T10:00:00Z",
    user_uuid: "u-abc-123",
    ...overrides,
  };
}

function mockOutboundResponse(overrides: Partial<OutboundOrderResponse> = {}): OutboundOrderResponse {
  return {
    id: 20,
    asset_id: 1,
    quantity: 2,
    exit_type: "allocation",
    assigned_to: "Ana Martínez",
    office: "Valencia",
    created_at: "2026-09-10T12:00:00Z",
    user_uuid: "u-abc-123",
    ...overrides,
  };
}

function mockOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 1,
    order_type: "inbound",
    quantity: 5,
    supplier: "TechDistrib",
    asset_id: 1,
    asset_name: "Monitor Dell",
    asset_sku: "MON-DELL-27",
    office: "Valencia",
    created_at: "2026-09-10T10:00:00Z",
    user_uuid: "u-abc-123",
    ...overrides,
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// F1-F2: getProducts()
// ──────────────────────────────────────────────

describe("getProducts()", () => {
  it("F1: API responde con lista de productos — retorna InventoryProduct[]", async () => {
    const expected = [mockProduct({ id: 1 }), mockProduct({ id: 2, sku: "SKU-002" })];
    mockApiRequest.mockResolvedValue(expected);

    const result = await getProducts();
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/products", { authenticated: false });
  });

  it("F2: API responde 500 — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("El servicio no está disponible temporalmente. Inténtalo más tarde.", 500));

    await expect(getProducts()).rejects.toThrow(ApiError);
    await expect(getProducts()).rejects.toMatchObject({ status: 500 });
  });
});

// ──────────────────────────────────────────────
// F3-F4: getProduct(id)
// ──────────────────────────────────────────────

describe("getProduct(id)", () => {
  it("F3: API responde con producto — retorna InventoryProduct", async () => {
    const expected = mockProduct({ id: 42, name: "Teclado Mecánico", sku: "TEC-MEC-01" });
    mockApiRequest.mockResolvedValue(expected);

    const result = await getProduct(42);
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/products/42", { authenticated: false });
  });

  it("F4: API responde 404 — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("No se encontró el recurso solicitado.", 404));

    await expect(getProduct(999)).rejects.toThrow(ApiError);
    await expect(getProduct(999)).rejects.toMatchObject({ status: 404 });
  });
});

// ──────────────────────────────────────────────
// F5-F7: createProduct(data)
// ──────────────────────────────────────────────

describe("createProduct(data)", () => {
  const validData: CreateProductData = {
    name: "Monitor Dell",
    sku: "MON-DELL-27",
    category: "hardware",
    office: "Valencia",
  };

  it("F5: API responde 201 — retorna InventoryProduct con current_stock = 0", async () => {
    const expected = mockProduct({ current_stock: 0 });
    mockApiRequest.mockResolvedValue(expected);

    const result = await createProduct(validData);
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/products", {
      method: "POST",
      body: validData,
      authenticated: true,
    });
  });

  it("F6: SKU duplicado (409) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("La operación entra en conflicto con el estado actual.", 409));

    await expect(createProduct(validData)).rejects.toMatchObject({ status: 409 });
  });

  it("F7: Sin token (401) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("Tu sesión no es válida. Inicia sesión de nuevo.", 401));

    await expect(createProduct(validData)).rejects.toMatchObject({ status: 401 });
  });
});

// ──────────────────────────────────────────────
// F8-F10: createInboundOrder(data)
// ──────────────────────────────────────────────

describe("createInboundOrder(data)", () => {
  const validData: InboundOrderData = {
    asset_id: 1,
    quantity: 5,
    supplier: "TechDistrib",
    office: "Valencia",
  };

  it("F8: API responde 201 — retorna InboundOrderResponse", async () => {
    const expected = mockInboundResponse();
    mockApiRequest.mockResolvedValue(expected);

    const result = await createInboundOrder(validData);
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/orders/inbound", {
      method: "POST",
      body: validData,
      authenticated: true,
    });
  });

  it("F9: asset_id inexistente (404) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("No se encontró el recurso solicitado.", 404));

    await expect(createInboundOrder({ ...validData, asset_id: 999 })).rejects.toMatchObject({ status: 404 });
  });

  it("F10: Campos inválidos (422) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("Revisa los datos enviados e inténtalo de nuevo.", 422));

    await expect(createInboundOrder({ ...validData, quantity: 0 })).rejects.toMatchObject({ status: 422 });
  });
});

// ──────────────────────────────────────────────
// F11-F13: createOutboundOrder(data)
// ──────────────────────────────────────────────

describe("createOutboundOrder(data)", () => {
  const validData: OutboundOrderData = {
    asset_id: 1,
    quantity: 2,
    exit_type: "allocation",
    assigned_to: "Ana Martínez",
    office: "Valencia",
  };

  it("F11: API responde 201 — retorna OutboundOrderResponse", async () => {
    const expected = mockOutboundResponse();
    mockApiRequest.mockResolvedValue(expected);

    const result = await createOutboundOrder(validData);
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/orders/outbound", {
      method: "POST",
      body: validData,
      authenticated: true,
    });
  });

  it("F12: Stock insuficiente (400) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("Revisa los datos enviados e inténtalo de nuevo.", 400));

    await expect(createOutboundOrder(validData)).rejects.toMatchObject({ status: 400 });
  });

  it("F13: asset_id inexistente (404) — lanza ApiError", async () => {
    mockApiRequest.mockRejectedValue(new ApiError("No se encontró el recurso solicitado.", 404));

    await expect(createOutboundOrder({ ...validData, asset_id: 999 })).rejects.toMatchObject({ status: 404 });
  });
});

// ──────────────────────────────────────────────
// F14-F15: getOrders()
// ──────────────────────────────────────────────

describe("getOrders()", () => {
  it("F14: API responde con historial — retorna OrderItem[]", async () => {
    const expected: OrderItem[] = [
      mockOrderItem({ id: 1, order_type: "inbound" }),
      mockOrderItem({ id: 2, order_type: "outbound", exit_type: "allocation", assigned_to: "Ana Martínez", supplier: undefined }),
    ];
    mockApiRequest.mockResolvedValue(expected);

    const result = await getOrders();
    expect(result).toEqual(expected);
    expect(mockApiRequest).toHaveBeenCalledWith("/inventory/orders", { authenticated: false });
  });

  it("F15: Array vacío — retorna []", async () => {
    mockApiRequest.mockResolvedValue([]);

    const result = await getOrders();
    expect(result).toEqual([]);
  });
});