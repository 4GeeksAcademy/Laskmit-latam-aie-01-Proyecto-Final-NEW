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

interface ValidationErrorDetail {
  loc: Array<string | number>;
  msg: string;
  type: string;
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

function buildErrorFromBody(errorBody: unknown, statusCode: number): ApiError {
  if (
    errorBody &&
    typeof errorBody === "object" &&
    "detail" in errorBody
  ) {
    const detail = (errorBody as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return new ApiError(detail, statusCode);
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((entry) => {
          if (
            entry &&
            typeof entry === "object" &&
            "msg" in entry &&
            typeof (entry as ValidationErrorDetail).msg === "string"
          ) {
            return (entry as ValidationErrorDetail).msg;
          }

          return null;
        })
        .filter((entry): entry is string => Boolean(entry));

      if (messages.length > 0) {
        return new ApiError(messages.join(" "), statusCode, messages);
      }
    }
  }

  return new ApiError(`Error ${statusCode}`, statusCode);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let apiError = new ApiError(`Error ${response.status}`, response.status);

    try {
      const errorBody = (await response.json()) as unknown;
      apiError = buildErrorFromBody(errorBody, response.status);
    } catch {
      // Mantener error basado en status cuando no haya JSON.
    }

    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
