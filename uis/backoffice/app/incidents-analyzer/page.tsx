"use client";

import { useEffect } from "react";

export default function IncidentsAnalyzerPage() {
  useEffect(() => {
    // Re-inicializar la lógica cuando la página se monta
    const analyzeButton = document.getElementById("analyzeButton");
    const exportButton = document.getElementById("exportButton");
    const csvFileInput = document.getElementById("csvFile");
    const filePickerLabelEl = document.getElementById("filePickerLabel");
    const selectedFileEl = document.getElementById("selectedFile");
    const apiBaseUrlInput = document.getElementById("apiBaseUrl");
    const feedbackEl = document.getElementById("feedback");
    const resultsPanel = document.getElementById("resultsPanel");

    if (
      !analyzeButton ||
      !exportButton ||
      !csvFileInput ||
      !filePickerLabelEl ||
      !selectedFileEl ||
      !apiBaseUrlInput ||
      !feedbackEl ||
      !resultsPanel
    ) {
      return;
    }

    const totalRecordsEl = document.getElementById("totalRecords");
    const validRecordsEl = document.getElementById("validRecords");
    const invalidRecordsEl = document.getElementById("invalidRecords");
    const averageScoreEl = document.getElementById("averageScore");
    const invalidBreakdownEl = document.getElementById("invalidBreakdown");
    const categoryBreakdownEl = document.getElementById("categoryBreakdown");
    const statusBreakdownEl = document.getElementById("statusBreakdown");
    const satisfactionBreakdownEl = document.getElementById("satisfactionBreakdown");

    const invalidRuleLabels: Record<string, string> = {
      missing_client_company: "Falta client_company",
      invalid_category: "Categoría faltante o inválida",
      invalid_description: "Descripción vacía/corta",
      invalid_agent_id: "agent_id faltante o inválido",
      invalid_status: "status faltante o inválido",
      invalid_email: "Email faltante o inválido",
      closed_without_score: "Cerrado sin satisfacción",
      score_out_of_range: "Puntaje fuera de rango",
    };

    const satisfactionLabels: Record<number, string> = {
      1: "Muy insatisfecho",
      2: "Insatisfecho",
      3: "Neutral",
      4: "Satisfecho",
      5: "Muy satisfecho",
    };

    // ─── Auto‑detect API base URL en Codespaces ─────────────────────────────
    (function detectApiBaseUrl() {
      const match = window.location.hostname.match(/^(.*)-\d+\.(.*)$/);
      if (match) {
        apiBaseUrlInput.value = `https://${match[1]}-8000.${match[2]}`;
      }
    })();

    function clearFeedback() {
      feedbackEl.textContent = "";
      feedbackEl.classList.remove("error");
    }

    function showFeedback(message: string, isError = false) {
      feedbackEl.textContent = message;
      feedbackEl.classList.toggle("error", isError);
    }

    function buildApiUrl(path: string) {
      const base = (apiBaseUrlInput as HTMLInputElement).value.trim().replace(/\/$/, "");
      return `${base}${path}`;
    }

    function appendListItem(listEl: HTMLElement, label: string, value: string | number) {
      const li = document.createElement("li");
      const labelSpan = document.createElement("span");
      const valueSpan = document.createElement("span");
      labelSpan.textContent = label;
      valueSpan.textContent = String(value);
      li.appendChild(labelSpan);
      li.appendChild(valueSpan);
      listEl.appendChild(li);
    }

    function clearLists() {
      [invalidBreakdownEl, categoryBreakdownEl, statusBreakdownEl, satisfactionBreakdownEl].forEach((el) => {
        if (el) el.innerHTML = "";
      });
    }

    function renderSummary(summary: any) {
      if (totalRecordsEl) totalRecordsEl.textContent = summary.totals.records;
      if (validRecordsEl) validRecordsEl.textContent = summary.totals.valid;
      if (invalidRecordsEl) invalidRecordsEl.textContent = summary.totals.invalid;
      if (averageScoreEl)
        averageScoreEl.textContent = `${summary.satisfaction.average.toFixed(2)} / 5.00`;

      clearLists();

      Object.entries(summary.invalid_breakdown).forEach(([rule, count]: [string, any]) => {
        if (count > 0) {
          appendListItem(invalidBreakdownEl!, invalidRuleLabels[rule] || rule, count);
        }
      });

      Object.entries(summary.categories).forEach(([category, data]: [string, any]) => {
        appendListItem(categoryBreakdownEl!, `${category} (${data.percentage.toFixed(1)}%)`, data.count);
      });

      Object.entries(summary.statuses).forEach(([status, data]: [string, any]) => {
        appendListItem(statusBreakdownEl!, `${status} (${data.percentage.toFixed(1)}%)`, data.count);
      });

      Object.entries(summary.satisfaction.distribution).forEach(([score, count]: [string, any]) => {
        appendListItem(satisfactionBreakdownEl!, `${score} - ${satisfactionLabels[Number(score)]}`, count);
      });

      resultsPanel.classList.remove("hidden");
    }

    async function analyzeCsv() {
      clearFeedback();
      const file = (csvFileInput as HTMLInputElement).files?.[0];

      if (!file) {
        showFeedback("Selecciona un archivo CSV antes de analizar.", true);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      (analyzeButton as HTMLButtonElement).disabled = true;
      analyzeButton.textContent = "Analizando...";

      try {
        const response = await fetch(buildApiUrl("/api/incidents/analyze"), {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.detail || "No se pudo analizar el archivo.");
        }

        renderSummary(payload.summary);
        showFeedback(`Análisis completado para ${payload.source_file}`);
      } catch (error: any) {
        showFeedback(error.message || "Error inesperado al analizar el archivo.", true);
      } finally {
        (analyzeButton as HTMLButtonElement).disabled = false;
        analyzeButton.textContent = "Analizar archivo";
      }
    }

    function exportCsv() {
      const exportUrl = buildApiUrl("/api/incidents/results/export");
      window.open(exportUrl, "_blank");
    }

    analyzeButton.addEventListener("click", analyzeCsv);
    exportButton.addEventListener("click", exportCsv);
    csvFileInput.addEventListener("change", () => {
      const file = (csvFileInput as HTMLInputElement).files?.[0];
      if (file) {
        selectedFileEl.textContent = `Archivo seleccionado: ${file.name}`;
        filePickerLabelEl.textContent = `CSV: ${file.name}`;
      } else {
        selectedFileEl.textContent = "Ningun archivo seleccionado";
        filePickerLabelEl.textContent = "Seleccionar CSV";
      }
    });

    // Cleanup listeners on unmount
    return () => {
      analyzeButton.removeEventListener("click", analyzeCsv);
      exportButton.removeEventListener("click", exportCsv);
    };
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/incidents-analyzer/styles.css" />
      <div className="backdrop-shape"></div>
      <main className="layout">
        <header className="hero">
          <p className="eyebrow">Nexova Customer Support</p>
          <h1>Panel de análisis de incidencias</h1>
          <p className="subtitle">
            Carga el CSV del helpdesk, revisa métricas clave en pantalla y descarga el resumen para el
            informe.
          </p>
        </header>

        <section className="panel upload-panel">
          <h2>1) Cargar archivo</h2>
          <p>Sube un CSV UTF-8 con los campos definidos en el contexto.</p>

          <label className="file-picker" htmlFor="csvFile">
            <span id="filePickerLabel">Seleccionar CSV</span>
            <input id="csvFile" type="file" accept=".csv,text/csv" />
          </label>
          <p id="selectedFile" className="selected-file">
            Ningun archivo seleccionado
          </p>

          <div className="api-config">
            <label htmlFor="apiBaseUrl">API base URL</label>
            <input id="apiBaseUrl" type="text" defaultValue="http://localhost:8000" />
          </div>

          <button id="analyzeButton" className="btn-primary">
            Analizar archivo
          </button>
          <p id="feedback" className="feedback" aria-live="polite"></p>
        </section>

        <section className="panel hidden" id="resultsPanel">
          <div className="results-header">
            <h2>2) Resultado del análisis</h2>
            <button id="exportButton" className="btn-secondary">
              Descargar CSV
            </button>
          </div>

          <div className="grid metrics-overview">
            <article className="metric-card">
              <h3>Total registros</h3>
              <p id="totalRecords">-</p>
            </article>
            <article className="metric-card">
              <h3>Registros válidos</h3>
              <p id="validRecords">-</p>
            </article>
            <article className="metric-card">
              <h3>Registros inválidos</h3>
              <p id="invalidRecords">-</p>
            </article>
            <article className="metric-card">
              <h3>Satisfacción promedio</h3>
              <p id="averageScore">-</p>
            </article>
          </div>

          <div className="grid detail-grids">
            <article className="detail-card">
              <h3>Inválidos por regla</h3>
              <ul id="invalidBreakdown"></ul>
            </article>
            <article className="detail-card">
              <h3>Por categoría</h3>
              <ul id="categoryBreakdown"></ul>
            </article>
            <article className="detail-card">
              <h3>Por estado</h3>
              <ul id="statusBreakdown"></ul>
            </article>
            <article className="detail-card">
              <h3>Distribución de satisfacción</h3>
              <ul id="satisfactionBreakdown"></ul>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}