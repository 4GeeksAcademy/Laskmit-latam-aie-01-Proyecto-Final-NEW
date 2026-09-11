import { clearAccessToken, getAccessToken } from "./auth";
import type { FastApiValidationError } from "./auth-types";

type ResponseType = "json" | "blob" | "text" | "void";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  authenticated?: boolean;
  body?: BodyInit | object | null;
  errorMessages?: Partial<Record<number, string>>;
  responseType?: ResponseType;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: FastApiValidationError[] = [],
    public readonly field: string | null = null,
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

function getPublicErrorMessage(status: number): string {
  if (status === 400 || status === 422) {
    return "Revisa los datos enviados e inténtalo de nuevo.";
  }
  if (status === 401) {
    return "Tu sesión no es válida. Inicia sesión de nuevo.";
  }
  if (status === 403) {
    return "No tienes permisos suficientes para realizar esta acción.";
  }
  if (status === 404) {
    return "No se encontró el recurso solicitado.";
  }
  if (status === 409) {
    return "La operación entra en conflicto con el estado actual.";
  }
  return status >= 500
    ? "El servicio no está disponible temporalmente. Inténtalo más tarde."
    : "No se pudo completar la solicitud.";
}

async function parseError(
  response: Response,
  errorMessages: ApiRequestOptions["errorMessages"],
): Promise<ApiError> {
  const fallback = errorMessages?.[response.status] ?? getPublicErrorMessage(response.status);

  try {
    const payload = (await response.json()) as {
      detail?: unknown;
      error?: { field?: unknown; message?: unknown };
    };

    // Si el backend devolvió un mensaje de error como string, usarlo directamente
    if (typeof payload.detail === "string") {
      return new ApiError(payload.detail, response.status, []);
    }

    if (payload.error && typeof payload.error.message === "string") {
      const field = typeof payload.error.field === "string" ? payload.error.field : null;
      return new ApiError(fallback, response.status, [], field);
    }
    if (Array.isArray(payload.detail)) {
      const details = payload.detail.filter(
        (item): item is FastApiValidationError =>
          typeof item === "object" && item !== null && typeof (item as { msg?: unknown }).msg === "string",
      );
      return new ApiError(fallback, response.status, details);
    }
  } catch {
    return new ApiError(fallback, response.status);
  }

  return new ApiError(fallback, response.status);
}

function isJsonBody(body: ApiRequestOptions["body"]): body is object {
  return body !== null && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    authenticated = true,
    body,
    errorMessages,
    responseType = "json",
    headers: initialHeaders,
    ...init
  } = options;
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

  let response: Response;
  try {
    response = await fetch(`${detectApiBaseUrl()}${path}`, {
      ...init,
      body: requestBody,
      headers,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.", 0);
  }

  if (!response.ok) {
    const error = await parseError(response, errorMessages);
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
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("El servicio devolvió una respuesta no válida. Inténtalo más tarde.", response.status);
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
}