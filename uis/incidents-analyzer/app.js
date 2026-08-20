const analyzeButton = document.getElementById('analyzeButton');
const exportButton = document.getElementById('exportButton');
const csvFileInput = document.getElementById('csvFile');
const filePickerLabelEl = document.getElementById('filePickerLabel');
const selectedFileEl = document.getElementById('selectedFile');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const feedbackEl = document.getElementById('feedback');
const resultsPanel = document.getElementById('resultsPanel');

// ─── Auto‑detect API base URL en Codespaces ─────────────────────────────
(function detectApiBaseUrl() {
  // Si estamos en Codespaces, la URL del frontend es algo como:
  //   https://<name>-5500.preview.app.github.dev
  // y la API estaría en:
  //   https://<name>-8000.preview.app.github.dev
  const match = window.location.hostname.match(/^(.*)-5500\.(.*)$/);
  if (match) {
    // Construimos la URL pública reemplazando 5500 por 8000
    apiBaseUrlInput.value = `https://${match[1]}-8000.${match[2]}`;
  }
  // Si no es Codespaces, se queda el valor por defecto http://localhost:8000
})();

const totalRecordsEl = document.getElementById('totalRecords');
const validRecordsEl = document.getElementById('validRecords');
const invalidRecordsEl = document.getElementById('invalidRecords');
const averageScoreEl = document.getElementById('averageScore');

const invalidBreakdownEl = document.getElementById('invalidBreakdown');
const categoryBreakdownEl = document.getElementById('categoryBreakdown');
const statusBreakdownEl = document.getElementById('statusBreakdown');
const satisfactionBreakdownEl = document.getElementById('satisfactionBreakdown');

const invalidRuleLabels = {
  missing_client_company: 'Falta client_company',
  invalid_category: 'Categoría faltante o inválida',
  invalid_description: 'Descripción vacía/corta',
  invalid_agent_id: 'agent_id faltante o inválido',
  invalid_status: 'status faltante o inválido',
  invalid_email: 'Email faltante o inválido',
  closed_without_score: 'Cerrado sin satisfacción',
  score_out_of_range: 'Puntaje fuera de rango',
};

const satisfactionLabels = {
  1: 'Muy insatisfecho',
  2: 'Insatisfecho',
  3: 'Neutral',
  4: 'Satisfecho',
  5: 'Muy satisfecho',
};

function clearFeedback() {
  feedbackEl.textContent = '';
  feedbackEl.classList.remove('error');
}

function showFeedback(message, isError = false) {
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle('error', isError);
}

function buildApiUrl(path) {
  const base = apiBaseUrlInput.value.trim().replace(/\/$/, '');
  return `${base}${path}`;
}

function appendListItem(listEl, label, value) {
  const li = document.createElement('li');
  const labelSpan = document.createElement('span');
  const valueSpan = document.createElement('span');

  labelSpan.textContent = label;
  valueSpan.textContent = String(value);
  li.appendChild(labelSpan);
  li.appendChild(valueSpan);
  listEl.appendChild(li);
}

function clearLists() {
  [invalidBreakdownEl, categoryBreakdownEl, statusBreakdownEl, satisfactionBreakdownEl].forEach((el) => {
    el.innerHTML = '';
  });
}

function renderSummary(summary) {
  totalRecordsEl.textContent = summary.totals.records;
  validRecordsEl.textContent = summary.totals.valid;
  invalidRecordsEl.textContent = summary.totals.invalid;
  averageScoreEl.textContent = `${summary.satisfaction.average.toFixed(2)} / 5.00`;

  clearLists();

  Object.entries(summary.invalid_breakdown).forEach(([rule, count]) => {
    if (count > 0) {
      appendListItem(invalidBreakdownEl, invalidRuleLabels[rule] || rule, count);
    }
  });

  Object.entries(summary.categories).forEach(([category, data]) => {
    appendListItem(categoryBreakdownEl, `${category} (${data.percentage.toFixed(1)}%)`, data.count);
  });

  Object.entries(summary.statuses).forEach(([status, data]) => {
    appendListItem(statusBreakdownEl, `${status} (${data.percentage.toFixed(1)}%)`, data.count);
  });

  Object.entries(summary.satisfaction.distribution).forEach(([score, count]) => {
    appendListItem(satisfactionBreakdownEl, `${score} - ${satisfactionLabels[score]}`, count);
  });

  resultsPanel.classList.remove('hidden');
}

async function analyzeCsv() {
  clearFeedback();
  updateSelectedFileLabel();
  const file = csvFileInput.files[0];

  if (!file) {
    showFeedback('Selecciona un archivo CSV antes de analizar.', true);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  analyzeButton.disabled = true;
  analyzeButton.textContent = 'Analizando...';

  try {
    const response = await fetch(buildApiUrl('/api/incidents/analyze'), {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.detail || 'No se pudo analizar el archivo.');
    }

    renderSummary(payload.summary);
    showFeedback(`Análisis completado para ${payload.source_file}`);
  } catch (error) {
    showFeedback(error.message || 'Error inesperado al analizar el archivo.', true);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = 'Analizar archivo';
  }
}

function exportCsv() {
  const exportUrl = buildApiUrl('/api/incidents/results/export');
  window.open(exportUrl, '_blank');
}

function updateSelectedFileLabel() {
  const file = csvFileInput.files[0];
  if (file) {
    selectedFileEl.textContent = `Archivo seleccionado: ${file.name}`;
    filePickerLabelEl.textContent = `CSV: ${file.name}`;
  } else {
    selectedFileEl.textContent = 'Ningun archivo seleccionado';
    filePickerLabelEl.textContent = 'Seleccionar CSV';
  }
}

analyzeButton.addEventListener('click', analyzeCsv);
exportButton.addEventListener('click', exportCsv);
csvFileInput.addEventListener('change', updateSelectedFileLabel);
csvFileInput.addEventListener('input', updateSelectedFileLabel);
