"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest, getErrorMessage } from "../../lib/api-client";
import type {
  Incident,
  IncidentBranch,
  IncidentCategory,
  IncidentCreate,
  IncidentOrigin,
  IncidentStatus,
  IncidentSummary,
} from "../../lib/incident-types";
import styles from "./incidents.module.css";

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  technical_failure: "Fallo técnico",
  process_error: "Error de proceso",
  client_complaint: "Queja de cliente",
  candidate_issue: "Incidencia de candidato",
  staff_issue: "Incidencia de personal",
  sla_breach: "Incumplimiento de SLA",
  data_quality: "Calidad de datos",
  other: "Otra",
};

const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Cliente",
  branch: "Sede",
  internal: "Interna",
};

const BRANCH_LABELS: Record<IncidentBranch, string> = {
  central: "Central — Sede Valencia",
  valencia_operations: "Valencia — Operaciones",
  miami_office: "Miami Office",
  remote: "Remoto (empleado sin sede fija)",
};

const NEXT_STATUSES: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

const EMPTY_FORM: IncidentCreate = {
  title: "",
  description: "",
  category: "technical_failure",
  origin: "internal",
  branch: "central",
};

interface Filters {
  status: "" | IncidentStatus;
  origin: "" | IncidentOrigin;
  branch: "" | IncidentBranch;
  category: "" | IncidentCategory;
}

const EMPTY_FILTERS: Filters = { status: "", origin: "", branch: "", category: "" };

function queryFromFilters(filters: Filters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function IncidentManager() {
  const [form, setForm] = useState<IncidentCreate>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof IncidentCreate, string>>>({});
  const [formFeedback, setFormFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listAttempt, setListAttempt] = useState(0);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  const [mutationVersion, setMutationVersion] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadIncidents(): Promise<void> {
      setListLoading(true);
      setListError("");
      try {
        const result = await apiRequest<Incident[]>(`/api/incidents${queryFromFilters(filters)}`);
        if (active) setIncidents(result);
      } catch (error) {
        if (active) setListError(getErrorMessage(error));
      } finally {
        if (active) setListLoading(false);
      }
    }
    void loadIncidents();
    return () => { active = false; };
  }, [filters, listAttempt, mutationVersion]);

  useEffect(() => {
    let active = true;
    async function loadSummary(): Promise<void> {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const result = await apiRequest<IncidentSummary>("/api/incidents/summary");
        if (active) setSummary(result);
      } catch (error) {
        if (active) setSummaryError(getErrorMessage(error));
      } finally {
        if (active) setSummaryLoading(false);
      }
    }
    void loadSummary();
    return () => { active = false; };
  }, [summaryAttempt, mutationVersion]);

  function updateForm<Key extends keyof IncidentCreate>(key: Key, value: IncidentCreate[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormFeedback("");
  }

  async function submitIncident(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const errors: Partial<Record<keyof IncidentCreate, string>> = {};
    if (!form.title.trim()) errors.title = "Escribe un título.";
    if (form.title.trim().length > 120) errors.title = "El título no puede superar 120 caracteres.";
    if (!form.description.trim()) errors.description = "Escribe una descripción.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }

    setSubmitting(true);
    setFormFeedback("");
    try {
      await apiRequest<Incident>("/api/incidents", { method: "POST", body: form });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setFormFeedback("Incidencia registrada correctamente.");
      setMutationVersion((value) => value + 1);
    } catch (error) {
      if (error instanceof ApiError && error.field && error.field in form) {
        setFieldErrors({ [error.field]: error.message });
        document.getElementById(error.field)?.focus();
      } else {
        setFormFeedback("No pudimos registrar la incidencia. Revisa los datos e inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(incident: Incident, status: IncidentStatus): Promise<void> {
    setUpdatingId(incident.id);
    setRowError("");
    try {
      await apiRequest<Incident>(`/api/incidents/${incident.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setMutationVersion((value) => value + 1);
    } catch {
      setRowError(`No se pudo actualizar “${incident.title}”. El estado anterior se conserva.`);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.summaryBand} aria-labelledby="summary-heading">
        <div className={styles.sectionHeading}>
          <div><p>Vista ejecutiva</p><h2 id="summary-heading">Resumen actual</h2></div>
          {summaryError && <button type="button" onClick={() => setSummaryAttempt((value) => value + 1)}>Reintentar</button>}
        </div>
        {summaryLoading && <p className={styles.loading} role="status">Cargando métricas...</p>}
        {summaryError && <p className={styles.error} role="alert">No fue posible cargar las métricas.</p>}
        {!summaryLoading && !summaryError && summary && (
          <div className={styles.metrics}>
            <article className={styles.totalMetric}><span>Total</span><strong>{summary.total}</strong></article>
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((status) => (
              <article key={status}><span>{STATUS_LABELS[status]}</span><strong>{summary.by_status[status]}</strong></article>
            ))}
            <article className={styles.slaMetric}><span>Incumplimientos SLA</span><strong>{summary.by_category.sla_breach}</strong></article>
          </div>
        )}
        {!summaryLoading && !summaryError && summary && (
          <div className={styles.breakdowns}>
            <p><strong>Por origen:</strong> {Object.entries(summary.by_origin).map(([key, value]) => `${ORIGIN_LABELS[key as IncidentOrigin]} ${value}`).join(" · ")}</p>
            <p><strong>Por sede:</strong> {Object.entries(summary.by_branch).map(([key, value]) => `${BRANCH_LABELS[key as IncidentBranch]} ${value}`).join(" · ")}</p>
          </div>
        )}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.formPanel} aria-labelledby="new-incident-heading">
          <div className={styles.sectionHeading}><div><p>Nueva entrada</p><h2 id="new-incident-heading">Registrar incidencia</h2></div><span>Estado inicial: Abierta</span></div>
          <form onSubmit={submitIncident} noValidate>
            <label htmlFor="title">Título</label>
            <input id="title" value={form.title} maxLength={120} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} onChange={(event) => updateForm("title", event.target.value)} />
            {fieldErrors.title && <p id="title-error" className={styles.fieldError}>{fieldErrors.title}</p>}

            <label htmlFor="description">Descripción</label>
            <textarea id="description" rows={5} value={form.description} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "description-error" : undefined} onChange={(event) => updateForm("description", event.target.value)} />
            {fieldErrors.description && <p id="description-error" className={styles.fieldError}>{fieldErrors.description}</p>}

            <label htmlFor="category">Categoría</label>
            <select id="category" value={form.category} onChange={(event) => updateForm("category", event.target.value as IncidentCategory)}>
              {(Object.keys(CATEGORY_LABELS) as IncidentCategory[]).map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
            </select>

            <label htmlFor="origin">Origen</label>
            <select id="origin" value={form.origin} onChange={(event) => updateForm("origin", event.target.value as IncidentOrigin)}>
              {(Object.keys(ORIGIN_LABELS) as IncidentOrigin[]).map((origin) => <option key={origin} value={origin}>{ORIGIN_LABELS[origin]}</option>)}
            </select>

            <div className={form.origin === "branch" ? styles.branchEmphasis : undefined}>
              <label htmlFor="branch">Sede {form.origin === "branch" && <span>Confirma la sede que reporta</span>}</label>
              <select id="branch" value={form.branch} onChange={(event) => updateForm("branch", event.target.value as IncidentBranch)}>
                {(Object.keys(BRANCH_LABELS) as IncidentBranch[]).map((branch) => <option key={branch} value={branch}>{BRANCH_LABELS[branch]}</option>)}
              </select>
            </div>

            <button type="submit" disabled={submitting}>{submitting ? "Registrando..." : "Registrar incidencia"}</button>
            <p className={formFeedback.startsWith("Incidencia") ? styles.success : styles.formMessage} role={formFeedback.startsWith("Incidencia") ? "status" : "alert"} aria-live="polite">{formFeedback}</p>
          </form>
        </section>

        <section className={styles.listPanel} aria-labelledby="incident-list-heading">
          <div className={styles.sectionHeading}>
            <div><p>Cola operativa</p><h2 id="incident-list-heading">Incidencias</h2></div>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</button>
          </div>
          <div className={styles.filters}>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as Filters["status"] }))}><option value="">Todos</option>{(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label>
            <label>Origen<select value={filters.origin} onChange={(event) => setFilters((current) => ({ ...current, origin: event.target.value as Filters["origin"] }))}><option value="">Todos</option>{(Object.keys(ORIGIN_LABELS) as IncidentOrigin[]).map((value) => <option key={value} value={value}>{ORIGIN_LABELS[value]}</option>)}</select></label>
            <label>Sede<select value={filters.branch} onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value as Filters["branch"] }))}><option value="">Todas</option>{(Object.keys(BRANCH_LABELS) as IncidentBranch[]).map((value) => <option key={value} value={value}>{BRANCH_LABELS[value]}</option>)}</select></label>
            <label>Categoría<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as Filters["category"] }))}><option value="">Todas</option>{(Object.keys(CATEGORY_LABELS) as IncidentCategory[]).map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
          </div>

          {listLoading && <p className={styles.loading} role="status">Cargando incidencias...</p>}
          {listError && <div className={styles.error} role="alert"><p>No fue posible cargar las incidencias.</p><button type="button" onClick={() => setListAttempt((value) => value + 1)}>Reintentar</button></div>}
          {rowError && <p className={styles.error} role="alert">{rowError}</p>}
          {!listLoading && !listError && incidents.length === 0 && <p className={styles.empty}>No hay incidencias que coincidan con los filtros seleccionados.</p>}
          {!listLoading && !listError && incidents.length > 0 && (
            <div className={styles.incidentList}>
              {incidents.map((incident) => (
                <article key={incident.id} className={incident.category === "sla_breach" ? styles.slaIncident : undefined}>
                  <div className={styles.incidentTop}>
                    <div><span className={`${styles.status} ${styles[incident.status]}`}>{STATUS_LABELS[incident.status]}</span><h3>{incident.title}</h3></div>
                    <time dateTime={incident.created_at}>{formatDate(incident.created_at)}</time>
                  </div>
                  <p className={styles.description}>{incident.description}</p>
                  <dl><div><dt>Categoría</dt><dd>{CATEGORY_LABELS[incident.category]}</dd></div><div><dt>Origen</dt><dd>{ORIGIN_LABELS[incident.origin]}</dd></div><div><dt>Sede</dt><dd>{BRANCH_LABELS[incident.branch]}</dd></div></dl>
                  {NEXT_STATUSES[incident.status].length > 0 && (
                    <div className={styles.actions} aria-label={`Cambiar estado de ${incident.title}`}>
                      <span>Siguiente estado</span>
                      {NEXT_STATUSES[incident.status].map((status) => <button key={status} type="button" disabled={updatingId === incident.id} onClick={() => void changeStatus(incident, status)}>{updatingId === incident.id ? "Actualizando..." : STATUS_LABELS[status]}</button>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}