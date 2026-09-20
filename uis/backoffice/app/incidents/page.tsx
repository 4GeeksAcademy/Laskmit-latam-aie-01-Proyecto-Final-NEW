"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./incidents.module.css";

const IncidentManager = dynamic(
  () => import("./incident-manager").then((mod) => ({ default: mod.IncidentManager })),
  {
    loading: () => (
      <div className="skeleton-card" role="status" aria-label="Cargando gestor de incidencias…">
        <div className="skeleton-shimmer" style={{ height: 40, width: "100%", marginBottom: 12 }} />
        <div className="skeleton-shimmer" style={{ height: 300, width: "100%" }} />
      </div>
    ),
    ssr: false,
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
        <Suspense fallback={<div className="skeleton-card" role="status">Cargando gestor de incidencias…</div>}>
          <IncidentManager />
        </Suspense>
      </div>
    </main>
  );
}