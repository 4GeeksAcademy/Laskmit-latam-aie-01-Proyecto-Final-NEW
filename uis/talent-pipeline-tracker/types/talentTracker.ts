import type { CandidateStage, CandidateStatus } from "../../../services/api/clients/talentTrackerApi";

export type AsyncState = "idle" | "loading" | "success" | "error";

export interface CandidateFilters {
  status: CandidateStatus | "all";
  stage: CandidateStage | "all";
  search: string;
}

export interface CandidateFormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
}

export interface OperationFeedback {
  tone: "success" | "error" | "info";
  message: string;
}

export const EMPTY_CANDIDATE_FORM_VALUES: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "Asistente de Dirección",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};