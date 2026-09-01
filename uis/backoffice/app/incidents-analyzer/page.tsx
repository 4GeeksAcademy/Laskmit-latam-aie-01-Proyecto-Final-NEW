"use client";

import { ChangeEvent, useState } from "react";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import "../../public/incidents-analyzer/styles.css";

interface BreakdownValue {
  count: number;
  percentage: number;
}

interface IncidentSummary {
  totals: { records: number; valid: number; invalid: number };
  invalid_breakdown: Record<string, number>;
  categories: Record<string, BreakdownValue>;
  statuses: Record<string, BreakdownValue>;
  satisfaction: {
    average: number;
    distribution: Record<string, number>;
  };
}

interface AnalysisResponse {
  source_file: string;
  summary: IncidentSummary;
}

const INVALID_RULE_LABELS: Record<string, string> = {
  missing_client_company: "Falta client_company",
  invalid_category: "Categoría faltante o inválida",
  invalid_description: "Descripción vacía/corta",
  invalid_agent_id: "agent_id faltante o inválido",
  invalid_status: "status faltante o inválido",
  invalid_email: "Email faltante o inválido",
  closed_without_score: "Cerrado sin satisfacción",
  score_out_of_range: "Puntaje fuera de rango",
};

const SATISFACTION_LABELS: Record<string, string> = {
  "1": "Muy insatisfecho",
  "2": "Insatisfecho",
  "3": "Neutral",
  "4": "Satisfecho",
  "5": "Muy satisfecho",
};

function DetailList({ values, labels }: { values: Record<string, number>; labels?: Record<string, string> }) {
  return (
    <ul>
      {Object.entries(values).map(([key, value]) => (
        <li key={key}><span>{labels?.[key] ?? key}</span><span>{value}</span></li>
      ))}
    </ul>
  );
}

function PercentageList({ values }: { values: Record<string, BreakdownValue> }) {
  return (
    <ul>
      {Object.entries(values).map(([key, value]) => (
        <li key={key}><span>{key} ({value.percentage.toFixed(1)}%)</span><span>{value.count}</span></li>
      ))}
    </ul>
  );
}

export default function IncidentsAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);

  function selectFile(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null);
    setFeedback("");
    setError(false);
  }

  async function analyzeCsv(): Promise<void> {
    if (!file) {
      setFeedback("Selecciona un archivo CSV antes de analizar.");
      setError(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setAnalyzing(true);
    setFeedback("");
    setError(false);

    try {
      const result = await apiRequest<AnalysisResponse>("/api/incidents/analyze", {
        method: "POST",
        body: formData,
      });
      setSummary(result.summary);
      setFeedback(`Análisis completado para ${result.source_file}`);
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError));
      setError(true);
    } finally {
      setAnalyzing(false);
    }
  }

  async function exportCsv(): Promise<void> {
    setExporting(true);
    setFeedback("");
    setError(false);

    try {
      const blob = await apiRequest<Blob>("/api/incidents/results/export", { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "incidents-results.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback("Descarga preparada correctamente.");
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError));
      setError(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="layout">
        <header className="hero">
          <p className="eyebrow">Nexova Customer Support</p>
          <h1>Panel de análisis de incidencias</h1>
          <p className="subtitle">Carga el CSV del helpdesk, revisa métricas clave y descarga el resumen.</p>
        </header>

        <section className="panel upload-panel">
          <h2>1) Cargar archivo</h2>
          <p>Sube un CSV UTF-8 con los campos definidos en el contexto.</p>
          <label className="file-picker" htmlFor="csvFile">
            <span>{file ? `CSV: ${file.name}` : "Seleccionar CSV"}</span>
            <input id="csvFile" type="file" accept=".csv,text/csv" onChange={selectFile} />
          </label>
          <p className="selected-file">{file ? `Archivo seleccionado: ${file.name}` : "Ningún archivo seleccionado"}</p>
          <button type="button" className="btn-primary" onClick={analyzeCsv} disabled={analyzing}>
            {analyzing ? "Analizando..." : "Analizar archivo"}
          </button>
          <p className={`feedback${error ? " error" : ""}`} role={error ? "alert" : "status"} aria-live="polite">{feedback}</p>
        </section>

        {summary && (
          <section className="panel">
            <div className="results-header">
              <h2>2) Resultado del análisis</h2>
              <button type="button" className="btn-secondary" onClick={exportCsv} disabled={exporting}>
                {exporting ? "Descargando..." : "Descargar CSV"}
              </button>
            </div>

            <div className="grid metrics-overview">
              <article className="metric-card"><h3>Total registros</h3><p>{summary.totals.records}</p></article>
              <article className="metric-card"><h3>Registros válidos</h3><p>{summary.totals.valid}</p></article>
              <article className="metric-card"><h3>Registros inválidos</h3><p>{summary.totals.invalid}</p></article>
              <article className="metric-card"><h3>Satisfacción promedio</h3><p>{summary.satisfaction.average.toFixed(2)} / 5.00</p></article>
            </div>

            <div className="grid detail-grids">
              <article className="detail-card"><h3>Inválidos por regla</h3><DetailList values={summary.invalid_breakdown} labels={INVALID_RULE_LABELS} /></article>
              <article className="detail-card"><h3>Por categoría</h3><PercentageList values={summary.categories} /></article>
              <article className="detail-card"><h3>Por estado</h3><PercentageList values={summary.statuses} /></article>
              <article className="detail-card"><h3>Distribución de satisfacción</h3><DetailList values={summary.satisfaction.distribution} labels={SATISFACTION_LABELS} /></article>
            </div>
          </section>
        )}
    </main>
  );
}
