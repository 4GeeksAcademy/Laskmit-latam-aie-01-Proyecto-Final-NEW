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
} from "../../../Services/talentTrackerApi";
import { CandidateForm } from "@/components/CandidateForm";
import { formatDateTime, formatExperienceYears } from "@/lib/formatters";
import {
  type AsyncState,
  type CandidateFormValues,
  type OperationFeedback,
} from "@/types/talentTracker";

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

function feedbackClasses(tone: OperationFeedback["tone"]): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "info") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
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
          <a className="text-amber-700 underline-offset-4 hover:underline" href={record.linkedin_url} target="_blank" rel="noreferrer">
            Abrir perfil
          </a>
        ) : (
          "Sin enlace"
        ),
      },
      {
        label: "CV",
        value: record.cv_url ? (
          <a className="text-amber-700 underline-offset-4 hover:underline" href={record.cv_url} target="_blank" rel="noreferrer">
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
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          No se recibio un identificador de candidatura valido.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Nexova · Asistente de Dirección
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Ficha de candidatura
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Revisa el detalle, actualiza el estado del pipeline y registra notas internas sin salir del flujo de selección.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-amber-500 hover:text-amber-700"
        >
          Volver al listado
        </Link>
      </div>

      {recordState === "loading" && (
        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Cargando candidatura...
        </p>
      )}

      {recordState === "error" && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Error al cargar la candidatura: {recordError}
        </p>
      )}

      {record && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{record.full_name}</h2>
                <p className="mt-2 text-sm text-slate-600">{record.position}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {STATUS_LABELS[record.status]}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {STAGE_LABELS[record.stage]}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {detailRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {row.label}
                  </p>
                  <div className="mt-2 text-sm text-slate-800">{row.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Estado del proceso
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
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

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Etapa del pipeline
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
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
              <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${feedbackClasses(recordFeedback.tone)}`}>
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

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Notas internas</h2>
            <p className="mt-2 text-sm text-slate-600">
              Registra observaciones de llamadas, entrevistas y feedback del equipo de People.
            </p>
          </div>

          {record && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {record.notes_count} nota{record.notes_count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {noteFeedback && (
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${feedbackClasses(noteFeedback.tone)}`}>
            {noteFeedback.message}
          </p>
        )}

        <form className="mt-5 grid gap-3" onSubmit={handleAddNote}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Nueva nota
            <textarea
              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="Anota hallazgos de screening, entrevista o referencias."
            />
          </label>
          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-fit"
            type="submit"
            disabled={noteState === "loading"}
          >
            {noteState === "loading" ? "Guardando nota..." : "Anadir nota"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {notesState === "loading" && (
            <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Cargando notas internas...
            </p>
          )}

          {notesState === "error" && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              Error al cargar notas: {notesError}
            </p>
          )}

          {notesState === "success" && notes.length === 0 && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta candidatura todavia no tiene notas internas.
            </p>
          )}

          {notes.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-3xl text-sm leading-6 text-slate-800">{note.content}</p>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => void handleDeleteNote(note.id)}
                  disabled={deletingNoteId === note.id}
                >
                  {deletingNoteId === note.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">{formatDateTime(note.created_at)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}