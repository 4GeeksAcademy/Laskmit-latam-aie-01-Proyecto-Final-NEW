"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createCandidateRecord,
  type CandidateRecord,
  type CandidateRecordInput,
  type CandidateStage,
  type CandidateStatus,
  listCandidateRecords,
  STAGE_LABELS,
  STATUS_LABELS,
} from "../../../../services/api/clients/talentTrackerApi";
import { CandidateForm } from "./components/CandidateForm";
import { CandidateTable } from "./components/CandidateTable";
import {
  type AsyncState,
  EMPTY_CANDIDATE_FORM_VALUES,
  type OperationFeedback,
} from "./types/talentTracker";

const STATUS_VALUES = Object.keys(STATUS_LABELS) as CandidateStatus[];
const STAGE_VALUES = Object.keys(STAGE_LABELS) as CandidateStage[];

function parseStatusFilter(value: string | null): CandidateStatus | "all" {
  if (value && STATUS_VALUES.includes(value as CandidateStatus)) {
    return value as CandidateStatus;
  }

  return "all";
}

function parseStageFilter(value: string | null): CandidateStage | "all" {
  if (value && STAGE_VALUES.includes(value as CandidateStage)) {
    return value as CandidateStage;
  }

  return "all";
}

export default function CandidatesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRouting, startTransition] = useTransition();

  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [requestState, setRequestState] = useState<AsyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createState, setCreateState] = useState<AsyncState>("idle");
  const [createFeedback, setCreateFeedback] = useState<OperationFeedback | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [formResetSignal, setFormResetSignal] = useState(0);

  const statusFilter = parseStatusFilter(searchParams.get("status"));
  const stageFilter = parseStageFilter(searchParams.get("stage"));
  const searchQuery = searchParams.get("search") ?? "";

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (!value || value === "all") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      setRequestState("loading");
      setErrorMessage("");

      try {
        const response = await listCandidateRecords({
          status: statusFilter === "all" ? undefined : statusFilter,
          stage: stageFilter === "all" ? undefined : stageFilter,
          search: searchQuery,
          page: 1,
          limit: 100,
        });

        if (!cancelled) {
          setRecords(response.data);
          setRequestState("success");
        }
      } catch (error) {
        if (!cancelled) {
          setRecords([]);
          setRequestState("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las candidaturas.",
          );
        }
      }
    };

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, stageFilter, searchQuery, refreshToken]);

  const handleCreateCandidate = async (payload: CandidateRecordInput) => {
    setCreateState("loading");
    setCreateFeedback({ tone: "info", message: "Registrando candidatura..." });

    try {
      await createCandidateRecord(payload);
      setCreateState("success");
      setCreateFeedback({
        tone: "success",
        message: "Candidatura registrada correctamente.",
      });
      setFormResetSignal((currentValue) => currentValue + 1);
      setRefreshToken((currentValue) => currentValue + 1);
    } catch (error) {
      setCreateState("error");
      setCreateFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la candidatura.",
      });
    }
  };

  const statusOptions = useMemo(() => Object.entries(STATUS_LABELS), []);
  const stageOptions = useMemo(() => Object.entries(STAGE_LABELS), []);
  const summary = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((record) => record.status === "in_progress").length,
      interviews: records.filter((record) =>
        ["personal_interview", "technical_interview"].includes(record.stage),
      ).length,
    };
  }, [records]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_28%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_38%,_#eef2ff_100%)] text-slate-900">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Nexova · People & Talent
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Panel de candidaturas para Asistente de Dirección
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Consulta el pipeline completo, filtra por estado y etapa, registra nuevas candidaturas y entra al detalle sin recargar la pagina.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Visibles
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
                  Estado en Proceso
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.active}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Etapas en entrevista
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.interviews}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
            <div className="mb-6 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Buscar por nombre o email
                <input
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => updateQueryParam("search", event.target.value)}
                  placeholder="Ej: ana.garcia@correo.com"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Filtrar por estado
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  value={statusFilter}
                  onChange={(event) => updateQueryParam("status", event.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  {statusOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Filtrar por etapa
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  value={stageFilter}
                  onChange={(event) => updateQueryParam("stage", event.target.value)}
                >
                  <option value="all">Todas las etapas</option>
                  {stageOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isRouting && requestState !== "loading" && (
              <p className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Actualizando filtros...
              </p>
            )}

            {requestState === "loading" && (
              <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Cargando candidaturas...
              </p>
            )}

            {requestState === "error" && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Error al cargar candidaturas: {errorMessage}
              </p>
            )}

            {requestState === "success" && records.length === 0 && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No hay candidaturas que coincidan con los filtros seleccionados.
              </p>
            )}

            {records.length > 0 && (
              <>
                <p className="mb-4 text-sm text-slate-600">
                  Mostrando {records.length} candidatura{records.length === 1 ? "" : "s"} en el tablero visible.
                </p>
                <CandidateTable records={records} />
              </>
            )}
          </section>

          <CandidateForm
            key={`create-${formResetSignal}`}
            title="Registrar nueva candidatura"
            description="Da de alta candidaturas que llegan por referral, ferias o captacion directa del equipo de Nexova."
            submitLabel="Registrar candidatura"
            initialValues={EMPTY_CANDIDATE_FORM_VALUES}
            onSubmit={handleCreateCandidate}
            isSubmitting={createState === "loading"}
            feedback={createFeedback}
          />
        </div>
      </main>
    </div>
  );
}
