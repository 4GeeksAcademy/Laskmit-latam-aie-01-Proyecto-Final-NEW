"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  addCandidateNote,
  deleteCandidateNote,
  getCandidateNotes,
  getCandidateRecord,
  patchCandidateRecord,
  replaceCandidateRecord,
  STAGE_LABELS,
  STATUS_LABELS,
  type CandidateRecord,
  type CandidateRecordInput,
  type CandidateStage,
  type CandidateStatus,
} from "../../../../../services/api/clients/talentTrackerApi";
import { CandidateForm } from "./CandidateForm";
import { formatDateTime, formatExperienceYears } from "../lib/formatters";
import {
  type AsyncState,
  type CandidateFormValues,
  type OperationFeedback,
} from "../types/talentTracker";
import styles from "../talent-pipeline.module.css";

const STATUS_VALUES = Object.keys(STATUS_LABELS) as CandidateStatus[];
const STAGE_VALUES = Object.keys(STAGE_LABELS) as CandidateStage[];

function toFormValues(record: CandidateRecord): CandidateFormValues {
  return {
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    position: record.position,
    linkedin_url: record.linkedin_url ?? "",
    cv_url: record.cv_url ?? "",
    experience_years: String(record.experience_years),
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function feedbackClass(tone: OperationFeedback["tone"]): string {
  if (tone === "success") return "success";
  if (tone === "info") return "info";
  return "error";
}

export function CandidateDetailClient() {
  const params = useParams<{ id: string }>();
  const recordId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [record, setRecord] = useState<CandidateRecord | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [recordState, setRecordState] = useState<AsyncState>("idle");
  const [notesState, setNotesState] = useState<AsyncState>("idle");
  const [recordError, setRecordError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [recordFeedback, setRecordFeedback] = useState<OperationFeedback | null>(null);
  const [editState, setEditState] = useState<AsyncState>("idle");
  const [noteState, setNoteState] = useState<AsyncState>("idle");
  const [noteFeedback, setNoteFeedback] = useState<OperationFeedback | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    if (!recordId) {
      return;
    }

    setRecordState("loading");
    setRecordError("");

    try {
      const nextRecord = await getCandidateRecord(recordId);
      setRecord(nextRecord);
      setRecordState("success");
    } catch (error) {
      setRecord(null);
      setRecordState("error");
      setRecordError(getErrorMessage(error, "No se pudo cargar la candidatura."));
    }
  }, [recordId]);

  const loadNotes = useCallback(async () => {
    if (!recordId) {
      return;
    }

    setNotesState("loading");
    setNotesError("");

    try {
      const response = await getCandidateNotes(recordId);
      setNotes(response.data);
      setNotesState("success");
    } catch (error) {
      setNotes([]);
      setNotesState("error");
      setNotesError(getErrorMessage(error, "No se pudieron cargar las notas internas."));
    }
  }, [recordId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRecord();
      void loadNotes();
    });
  }, [loadNotes, loadRecord]);

  const handlePatchField = async (
    field: "status" | "stage",
    value: CandidateStatus | CandidateStage,
  ) => {
    if (!recordId || !record) {
      return;
    }

    if (record[field] === value) {
      return;
    }

    setRecordFeedback({
      tone: "info",
      message: field === "status" ? "Actualizando estado..." : "Actualizando etapa...",
    });

    try {
      const updatedRecord = await patchCandidateRecord(recordId, { [field]: value });
      setRecord(updatedRecord);
      setRecordFeedback({
        tone: "success",
        message: field === "status" ? "Estado actualizado." : "Etapa actualizada.",
      });
    } catch (error) {
      setRecordFeedback({
        tone: "error",
        message: getErrorMessage(error, "No se pudo actualizar la candidatura."),
      });
    }
  };

  const handleReplaceRecord = async (payload: CandidateRecordInput) => {
    if (!recordId) {
      return;
    }

    setEditState("loading");
    setRecordFeedback(null);

    try {
      const updatedRecord = await replaceCandidateRecord(recordId, payload);
      setRecord(updatedRecord);
      setEditState("success");
      setRecordFeedback({
        tone: "success",
        message: "La candidatura se actualizo correctamente.",
      });
    } catch (error) {
      setEditState("error");
      setRecordFeedback({
        tone: "error",
        message: getErrorMessage(error, "No se pudo guardar la candidatura."),
      });
    }
  };

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!recordId) {
      return;
    }

    const trimmedNote = draftNote.trim();
    if (!trimmedNote) {
      setNoteFeedback({ tone: "error", message: "La nota no puede estar vacia." });
      return;
    }

    setNoteState("loading");
    setNoteFeedback({ tone: "info", message: "Guardando nota interna..." });

    try {
      await addCandidateNote(recordId, trimmedNote);
      setDraftNote("");
      await Promise.all([loadNotes(), loadRecord()]);
      setNoteState("success");
      setNoteFeedback({ tone: "success", message: "Nota interna anadida." });
    } catch (error) {
      setNoteState("error");
      setNoteFeedback({
        tone: "error",
        message: getErrorMessage(error, "No se pudo guardar la nota interna."),
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!recordId) {
      return;
    }

    setDeletingNoteId(noteId);
    setNoteFeedback({ tone: "info", message: "Eliminando nota interna..." });

    try {
      await deleteCandidateNote(recordId, noteId);
      await Promise.all([loadNotes(), loadRecord()]);
      setNoteFeedback({ tone: "success", message: "Nota interna eliminada." });
    } catch (error) {
      setNoteFeedback({
        tone: "error",
        message: getErrorMessage(error, "No se pudo eliminar la nota interna."),
      });
    } finally {
      setDeletingNoteId(null);
    }
  };

  const detailRows = useMemo(() => {
    if (!record) {
      return [];
    }

    return [
      { label: "Email", value: record.email },
      { label: "Telefono", value: record.phone },
      { label: "Puesto", value: record.position },
      {
        label: "LinkedIn",
        value: record.linkedin_url ? (
          <a href={record.linkedin_url} target="_blank" rel="noreferrer">
            Abrir perfil
          </a>
        ) : (
          "Sin enlace"
        ),
      },
      {
        label: "CV",
        value: record.cv_url ? (
          <a href={record.cv_url} target="_blank" rel="noreferrer">
            Abrir CV
          </a>
        ) : (
          "Sin enlace"
        ),
      },
      { label: "Experiencia", value: formatExperienceYears(record.experience_years) },
      { label: "Aplicada el", value: formatDateTime(record.applied_at) },
      { label: "Ultima actualizacion", value: formatDateTime(record.updated_at) },
    ];
  }, [record]);

  if (!recordId) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p className={styles.error}>
            No se recibio un identificador de candidatura valido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Cabecera de detalle */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderInner}>
            <p>Nexova · Asistente de Dirección</p>
            <h1>Ficha de candidatura</h1>
            <p>
              Revisa el detalle, actualiza el estado del pipeline y registra notas internas sin salir del flujo de selección.
            </p>
          </div>

          <Link href="/talent-pipeline-tracker" className={styles.backLink}>
            Volver al listado
          </Link>
        </div>

        {recordState === "loading" && (
          <p className={styles.loading}>Cargando candidatura...</p>
        )}

        {recordState === "error" && (
          <p className={styles.error}>
            Error al cargar la candidatura: {recordError}
          </p>
        )}

        {record && (
          <div className={styles.detailGrid}>
            <section className={styles.detailSection}>
              <div className={styles.detailNameRow}>
                <div>
                  <h2>{record.full_name}</h2>
                  <p>{record.position}</p>
                </div>

                <div className={styles.detailBadges}>
                  <span className={`${styles.badge} ${styles.badgeStatus}`}>
                    {STATUS_LABELS[record.status]}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeStage}`}>
                    {STAGE_LABELS[record.stage]}
                  </span>
                </div>
              </div>

              <div className={styles.detailFields}>
                {detailRows.map((row) => (
                  <div key={row.label} className={styles.detailField}>
                    <p>{row.label}</p>
                    <div>{row.value}</div>
                  </div>
                ))}
              </div>

              <div className={styles.detailSelectors}>
                <label>
                  Estado del proceso
                  <select
                    value={record.status}
                    onChange={(event) =>
                      void handlePatchField("status", event.target.value as CandidateStatus)
                    }
                  >
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Etapa del pipeline
                  <select
                    value={record.stage}
                    onChange={(event) =>
                      void handlePatchField("stage", event.target.value as CandidateStage)
                    }
                  >
                    {STAGE_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {STAGE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {recordFeedback && (
                <p className={styles[feedbackClass(recordFeedback.tone)]} style={{ marginTop: "0.75rem" }}>
                  {recordFeedback.message}
                </p>
              )}
            </section>

            <CandidateForm
              key={`${record.id}-${record.updated_at}`}
              title="Editar candidatura"
              description="Corrige la informacion cuando RR. HH. la reciba incompleta o con datos desactualizados."
              submitLabel="Guardar cambios"
              initialValues={toFormValues(record)}
              onSubmit={handleReplaceRecord}
              isSubmitting={editState === "loading"}
              feedback={recordFeedback}
            />
          </div>
        )}

        {/* Sección de notas */}
        <section className={styles.notesSection}>
          <div className={styles.notesHeader}>
            <div>
              <h2>Notas internas</h2>
              <p style={{ marginTop: "0.2rem", fontSize: "0.84rem", color: "#59758f" }}>
                Registra observaciones de llamadas, entrevistas y feedback del equipo de People.
              </p>
            </div>

            {record && (
              <span className={`${styles.badge} ${styles.badgeStatus}`}>
                {record.notes_count} nota{record.notes_count === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {noteFeedback && (
            <p className={styles[feedbackClass(noteFeedback.tone)]}>
              {noteFeedback.message}
            </p>
          )}

          <form className={styles.notesForm} onSubmit={handleAddNote}>
            <input
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="Anota hallazgos de screening, entrevista o referencias."
            />
            <button type="submit" disabled={noteState === "loading"}>
              {noteState === "loading" ? "Guardando nota..." : "Anadir nota"}
            </button>
          </form>

          <div>
            {notesState === "loading" && (
              <p className={styles.loading}>Cargando notas internas...</p>
            )}

            {notesState === "error" && (
              <p className={styles.error}>Error al cargar notas: {notesError}</p>
            )}

            {notesState === "success" && notes.length === 0 && (
              <p className={styles.info} style={{ fontStyle: "italic" }}>
                Esta candidatura todavia no tiene notas internas.
              </p>
            )}

            {notes.map((note) => (
              <div key={note.id} className={styles.noteItem}>
                <div>
                  <p className={styles.noteContent}>{note.content}</p>
                  <p className={styles.noteMeta}>{formatDateTime(note.created_at)}</p>
                </div>
                <button
                  className={styles.deleteNoteBtn}
                  type="button"
                  onClick={() => void handleDeleteNote(note.id)}
                  disabled={deletingNoteId === note.id}
                >
                  {deletingNoteId === note.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}