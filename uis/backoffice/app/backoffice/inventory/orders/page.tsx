import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "../inventory.module.css";

const OrdersHistoryClient = dynamic(
  () => import("./orders-history-client").then((mod) => ({ default: mod.OrdersHistoryClient })),
  {
    loading: () => (
      <div role="status" aria-label="Cargando historial…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8 }}>
        <div style={{ height: 20, width: "60%", marginBottom: 12, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 300, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function OrdersHistoryPage() {
  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <a href="/backoffice/inventory/products">Inventario</a> / Órdenes
        </p>
        <p className={styles.kicker}>Historial de movimientos</p>
        <h1>Órdenes de inventario</h1>
        <p>
          Historial completo de todas las entradas y salidas de activos, con detalle del producto,
          cantidad, fecha y usuario que registró cada operación.
        </p>
      </header>

      <Suspense fallback={<div role="status" aria-label="Cargando…"
        style={{ padding: "1.5rem" }}>Cargando…</div>}>
        <OrdersHistoryClient />
      </Suspense>
    </div>
  );
}