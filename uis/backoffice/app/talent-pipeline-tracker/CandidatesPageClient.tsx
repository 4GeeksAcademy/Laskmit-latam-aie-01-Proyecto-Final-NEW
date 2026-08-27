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
import styles from "./talent-pipeline.module.css";

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
    <div className={styles.grid}>
      <section className={styles.card}>
        {/* Filtros */}
        <div className={styles.filtersRow}>
          <label>
            Buscar por nombre o email
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => updateQueryParam("search", event.target.value)}
              placeholder="Ej: ana.garcia@correo.com"
            />
          </label>

          <label>
            Filtrar por estado
            <select
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

          <label>
            Filtrar por etapa
            <select
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

        {/* Mensajes de estado */}
        {isRouting && requestState !== "loading" && (
          <p className={styles.info}>Actualizando filtros...</p>
        )}

        {requestState === "loading" && (
          <p className={styles.loading}>Cargando candidaturas...</p>
        )}

        {requestState === "error" && (
          <p className={styles.error}>
            Error al cargar candidaturas: {errorMessage}
          </p>
        )}

        {requestState === "success" && records.length === 0 && (
          <p className={styles.info}>
            No hay candidaturas que coincidan con los filtros seleccionados.
          </p>
        )}

        {records.length > 0 && (
          <>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.88rem", color: "#59758f" }}>
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
  );
}
