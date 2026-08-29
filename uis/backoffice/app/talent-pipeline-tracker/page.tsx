import { Suspense } from "react";
import styles from "./talent-pipeline.module.css";
import CandidatesPageClient from "./CandidatesPageClient";

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
