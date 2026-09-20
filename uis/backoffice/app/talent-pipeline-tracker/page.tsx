import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./talent-pipeline.module.css";

const CandidatesPageClient = dynamic(
  () => import("./CandidatesPageClient"),
  {
    loading: () => (
      <div role="status" aria-label="Cargando candidaturas…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8 }}>
        <div style={{ height: 20, width: "60%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 300, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Nexova · People & Talent</p>
          <h1>Panel de candidaturas para Asistente de Dirección</h1>
          <p>
            Consulta el pipeline completo, filtra por estado y etapa, registra nuevas candidaturas y entra al detalle sin recargar la pagina.
          </p>
        </header>

        <Suspense fallback={<div className={styles.info}>Cargando vista...</div>}>
          <CandidatesPageClient />
        </Suspense>
      </div>
    </div>
  );
}
