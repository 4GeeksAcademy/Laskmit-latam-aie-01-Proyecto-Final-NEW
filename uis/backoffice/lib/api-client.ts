import { clearAccessToken, getAccessToken } from "./auth";
import type { FastApiValidationError } from "./auth-types";

type ResponseType = "json" | "blob" | "text" | "void";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  authenticated?: boolean;
  body?: BodyInit | Record<string, unknown> | null;
  responseType?: ResponseType;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: FastApiValidationError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function detectApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const match = window.location.hostname.match(/^(.*)-\d+\.(.*)$/);
    if (match) {
      return `https://${match[1]}-8000.${match[2]}`;
    }
  }

  return "http://localhost:8000";
}

async function parseError(response: Response): Promise<ApiError> {
  const fallback = response.status === 403
    ? "No tienes permisos suficientes para realizar esta acción."
    : `La solicitud falló con estado ${response.status}.`;

  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") {
      return new ApiError(payload.detail, response.status);
    }
    if (Array.isArray(payload.detail)) {
      const details = payload.detail.filter(
        (item): item is FastApiValidationError =>
          typeof item === "object" && item !== null && typeof (item as { msg?: unknown }).msg === "string",
      );
      return new ApiError(details.map((item) => item.msg).join(" ") || fallback, response.status, details);
    }
  } catch {
    return new ApiError(fallback, response.status);
  }

  return new ApiError(fallback, response.status);
}

function isJsonBody(body: ApiRequestOptions["body"]): body is Record<string, unknown> {
  return body !== null && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { authenticated = true, body, responseType = "json", headers: initialHeaders, ...init } = options;
  const headers = new Headers(initialHeaders);
  let requestBody: BodyInit | null | undefined = body as BodyInit | null | undefined;

  if (isJsonBody(body)) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (authenticated) {
    const token = getAccessToken();
    if (!token) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
      throw new ApiError("Debes iniciar sesión para continuar.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${detectApiBaseUrl()}${path}`, {
    ...init,
    body: requestBody,
    headers,
  });

  if (!response.ok) {
    const error = await parseError(response);
    if (authenticated && response.status === 401) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
    throw error;
  }

  if (responseType === "void") {
    return undefined as T;
  }
  if (responseType === "blob") {
    return (await response.blob()) as T;
  }
  if (responseType === "text") {
    return (await response.text()) as T;
  }
  return (await response.json()) as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}