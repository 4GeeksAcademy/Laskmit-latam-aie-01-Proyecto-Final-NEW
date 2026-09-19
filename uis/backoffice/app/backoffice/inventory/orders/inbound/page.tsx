import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "../../inventory.module.css";

const InboundOrderClient = dynamic(
  () => import("./inbound-order-client").then((mod) => ({ default: mod.InboundOrderClient })),
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

export default function InboundOrderPage() {
  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <a href="/backoffice/inventory/products">Inventario</a> /{" "}
          <a href="/backoffice/inventory/orders/inbound">Órdenes de entrada</a> / Nueva
        </p>
        <p className={styles.kicker}>Recepción de activos</p>
        <h1>Registrar orden de entrada</h1>
        <p>
          Registra una nueva entrada de activos al inventario — compras o recepciones recibidas de
          proveedores.
        </p>
      </header>

      <Suspense fallback={<div role="status" aria-label="Cargando…"
        style={{ padding: "1.5rem" }}>Cargando…</div>}>
        <InboundOrderClient />
      </Suspense>
    </div>
  );
}