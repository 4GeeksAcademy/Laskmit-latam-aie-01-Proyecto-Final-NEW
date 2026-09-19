import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./incidents.module.css";

const IncidentManager = dynamic(
  () => import("./incident-manager").then((mod) => ({ default: mod.IncidentManager })),
  {
    loading: () => (
      <div role="status" aria-label="Cargando gestor de incidencias…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8 }}>
        <div style={{ height: 20, width: "50%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 300, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function IncidentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p>Operaciones Nexova</p>
          <h1>Gestor de incidencias</h1>
          <span>Registro y seguimiento centralizado para Valencia, Miami y equipos remotos.</span>
        </header>
        <Suspense fallback={<div role="status" aria-label="Cargando…"
          style={{ padding: "1.5rem" }}>Cargando…</div>}>
          <IncidentManager />
        </Suspense>
      </div>
    </main>
  );
}