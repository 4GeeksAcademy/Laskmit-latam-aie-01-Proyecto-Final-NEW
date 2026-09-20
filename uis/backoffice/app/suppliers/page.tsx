import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./suppliers.module.css";

const SuppliersPageClient = dynamic(
  () => import("./suppliers-page-client").then((mod) => ({ default: mod.SuppliersPageClient })),
  {
    loading: () => (
      <div role="status" aria-label="Cargando proveedores…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ height: 24, width: "40%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 200, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function SuppliersPage() {
  // Página contenedora: copy principal + componente cliente con toda la interacción.
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Compras y Operaciones</p>
          <h1>Directorio de Proveedores</h1>
          <p>
            Registro oficial de proveedores de Nexova con filtros por pais y categoria, alta de nuevos
            proveedores, actualizacion de tarifa mensual y control de estado activo/suspendido.
          </p>
        </header>

        <Suspense fallback={
          <div role="status" aria-label="Cargando…"
            style={{ padding: "1.5rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ height: 200, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
          </div>
        }>
          <SuppliersPageClient />
        </Suspense>
      </div>
    </div>
  );
}
