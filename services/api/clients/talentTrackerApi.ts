const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://playground.4geeks.com/tracker/api/v1";

export type CandidateStatus = "received" | "in_progress" | "selected" | "discarded";
export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface CandidateRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface CandidateNote {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface CandidateRecordInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
}

export interface CandidateRecordPatch {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

export interface ListRecordsResponse {
  total: number;
  page: number;
  limit: number;
  data: CandidateRecord[];
}

export interface RecordNotesResponse {
  data: CandidateNote[];
  meta: {
    total: number;
  };
}

export interface ListRecordsParams {
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
  page?: number;
  limit?: number;
}

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Pendiente de revisión",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details: string[];

  constructor(message: string, statusCode: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function buildQueryParams(params: ListRecordsParams): string {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.stage) {
    searchParams.set("stage", params.stage);
  }

  if (params.search && params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }

  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 100));

  return searchParams.toString();
}

function getPublicErrorMessage(statusCode: number): string {
  if (statusCode === 400 || statusCode === 422) {
    return "Revisa los datos de la candidatura e inténtalo de nuevo.";
  }
  if (statusCode === 404) {
    return "No se encontró la candidatura solicitada.";
  }
  if (statusCode === 409) {
    return "La candidatura cambió y no se pudo completar la operación.";
  }
  if (statusCode >= 500) {
    return "El servicio de candidaturas no está disponible temporalmente.";
  }
  return "No se pudo completar la operación con la candidatura.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servicio de candidaturas.", 0);
  }

  if (!response.ok) {
    throw new ApiError(getPublicErrorMessage(response.status), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("El servicio de candidaturas devolvió una respuesta no válida.", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("El servicio de candidaturas devolvió una respuesta no válida.", response.status);
  }
}

export async function listCandidateRecords(
  params: ListRecordsParams = {},
): Promise<ListRecordsResponse> {
  const query = buildQueryParams(params);
  const path = query ? `/records?${query}` : "/records";

  return request<ListRecordsResponse>(path);
}

export async function getCandidateRecord(id: string): Promise<CandidateRecord> {
  return request<CandidateRecord>(`/records/${id}`);
}

export async function createCandidateRecord(
  payload: CandidateRecordInput,
): Promise<CandidateRecord> {
  return request<CandidateRecord>("/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function replaceCandidateRecord(
  id: string,
  payload: CandidateRecordInput,
): Promise<CandidateRecord> {
  return request<CandidateRecord>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function patchCandidateRecord(
  id: string,
  payload: CandidateRecordPatch,
): Promise<CandidateRecord> {
  return request<CandidateRecord>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCandidateNotes(id: string): Promise<RecordNotesResponse> {
  return request<RecordNotesResponse>(`/records/${id}/notes`);
}

export async function addCandidateNote(id: string, content: string): Promise<void> {
  await request<unknown>(`/records/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteCandidateNote(id: string, noteId: string): Promise<void> {
  await request<void>(`/records/${id}/notes/${noteId}`, {
    method: "DELETE",
  });
}
