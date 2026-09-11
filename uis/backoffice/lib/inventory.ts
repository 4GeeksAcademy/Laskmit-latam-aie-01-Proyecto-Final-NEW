import { apiRequest } from "./api-client";

// ---------------------------------------------------------------------------
// Inventory API integration module
//
// Centralises all calls to /inventory endpoints. No component should use fetch
// directly — always go through these functions.
// ---------------------------------------------------------------------------

// ---- Domain types mirroring the API contracts -------------------------------

export interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  office: string;
  current_stock: number;
}

export interface InboundOrderData {
  asset_id: number;
  quantity: number;
  supplier: string;
  office: string;
}

export interface InboundOrderResponse {
  id: number;
  asset_id: number;
  quantity: number;
  supplier: string;
  office: string;
  created_at: string;
  user_uuid: string;
}

export interface OutboundOrderData {
  asset_id: number;
  quantity: number;
  exit_type: "allocation" | "consumption";
  assigned_to?: string | null;
  office: string;
}

export interface OutboundOrderResponse {
  id: number;
  asset_id: number;
  quantity: number;
  exit_type: string;
  assigned_to: string | null;
  office: string;
  created_at: string;
  user_uuid: string;
}

export interface OrderItem {
  id: number;
  order_type: "inbound" | "outbound";
  quantity: number;
  /** Only present when order_type === "inbound" */
  supplier?: string;
  /** Only present when order_type === "outbound" */
  exit_type?: string;
  /** Only present when order_type === "outbound" && exit_type === "allocation" */
  assigned_to?: string | null;
  asset_id: number;
  asset_name: string;
  asset_sku: string;
  office: string;
  created_at: string;
  user_uuid: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  office: string;
}

// ---- API functions ----------------------------------------------------------

export function getProducts(): Promise<InventoryProduct[]> {
  return apiRequest<InventoryProduct[]>("/inventory/products", {
    authenticated: false,
  });
}

export function getProduct(id: number): Promise<InventoryProduct> {
  return apiRequest<InventoryProduct>(`/inventory/products/${id}`, {
    authenticated: false,
  });
}

export function createProduct(data: CreateProductData): Promise<InventoryProduct> {
  return apiRequest<InventoryProduct>("/inventory/products", {
    method: "POST",
    body: data,
    authenticated: true,
  });
}

export function createInboundOrder(data: InboundOrderData): Promise<InboundOrderResponse> {
  return apiRequest<InboundOrderResponse>("/inventory/orders/inbound", {
    method: "POST",
    body: data,
    authenticated: true,
  });
}

export function createOutboundOrder(data: OutboundOrderData): Promise<OutboundOrderResponse> {
  return apiRequest<OutboundOrderResponse>("/inventory/orders/outbound", {
    method: "POST",
    body: data,
    authenticated: true,
  });
}

export function getOrders(): Promise<OrderItem[]> {
  return apiRequest<OrderItem[]>("/inventory/orders", {
    authenticated: false,
  });
}