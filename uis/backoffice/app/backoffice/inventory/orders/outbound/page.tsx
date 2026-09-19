import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "../../inventory.module.css";

const OutboundOrderClient = dynamic(
  () => import("./outbound-order-client").then((mod) => ({ default: mod.OutboundOrderClient })),
  {
    loading: () => (
      <div role="status" aria-label="Cargando formulario…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8 }}>
        <div style={{ height: 24, width: "50%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 200, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function OutboundOrderPage() {
  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <a href="/backoffice/inventory/products">Inventario</a> /{" "}
          <a href="/backoffice/inventory/orders/outbound">Órdenes de salida</a> / Nueva
        </p>
        <p className={styles.kicker}>Asignación o consumo</p>
        <h1>Registrar orden de salida</h1>
        <p>
          Registra una salida de activos del inventario — ya sea una asignación a un empleado o un consumo
          interno de materiales.
        </p>
      </header>

      <Suspense fallback={<div role="status" aria-label="Cargando…"
        style={{ padding: "1.5rem" }}>Cargando…</div>}>
        <OutboundOrderClient />
      </Suspense>
    </div>
  );
}