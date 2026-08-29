import Link from "next/link";
import {
  STAGE_LABELS,
  STATUS_LABELS,
  type CandidateRecord,
} from "../../../../../services/api/clients/talentTrackerApi";
import styles from "../talent-pipeline.module.css";

interface CandidateTableProps {
  records: CandidateRecord[];
}

export function CandidateTable({ records }: CandidateTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Candidatura</th>
            <th>Puesto</th>
            <th>Estado</th>
            <th>Etapa</th>
            <th>Notas</th>
            <th style={{ textAlign: "right" }}>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <p style={{ fontWeight: 600, color: "#15354f" }}>{record.full_name}</p>
                <p style={{ marginTop: "0.2rem", fontSize: "0.78rem", color: "#59758f" }}>{record.email}</p>
              </td>
              <td>{record.position}</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeStatus}`}>
                  {STATUS_LABELS[record.status]}
                </span>
              </td>
              <td>
                <span className={`${styles.badge} ${styles.badgeStage}`}>
                  {STAGE_LABELS[record.stage]}
                </span>
              </td>
              <td style={{ color: "#59758f" }}>{record.notes_count}</td>
              <td>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Link
                    href={`/talent-pipeline-tracker/candidates/${record.id}`}
                    title={`Ver detalle de ${record.full_name}`}
                    className={styles.detailLink}
                  >
                    &gt;
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