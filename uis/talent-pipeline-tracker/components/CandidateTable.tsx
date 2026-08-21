import Link from "next/link";
import {
  STAGE_LABELS,
  STATUS_LABELS,
  type CandidateRecord,
} from "../../../services/api/clients/talentTrackerApi";

interface CandidateTableProps {
  records: CandidateRecord[];
}

export function CandidateTable({ records }: CandidateTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <th className="px-4 py-3">Candidatura</th>
            <th className="px-4 py-3">Puesto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Etapa</th>
            <th className="px-4 py-3">Notas</th>
            <th className="px-4 py-3 text-right">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {records.map((record) => (
            <tr key={record.id} className="transition hover:bg-amber-50/50">
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-900">{record.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{record.email}</p>
              </td>
              <td className="px-4 py-4">{record.position}</td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {STATUS_LABELS[record.status]}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                  {STAGE_LABELS[record.stage]}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-600">{record.notes_count}</td>
              <td className="px-4 py-4">
                <div className="flex justify-end">
                  <Link
                    href={`/candidates/${record.id}`}
                    title={`Ver detalle de ${record.full_name}`}
                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500 hover:text-amber-700"
                  >
                    <span aria-hidden="true">&gt;</span>
                    <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium whitespace-nowrap text-white group-hover:block">
                      Ver detalle
                    </span>
                    <span className="sr-only">Ver detalle de {record.full_name}</span>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}