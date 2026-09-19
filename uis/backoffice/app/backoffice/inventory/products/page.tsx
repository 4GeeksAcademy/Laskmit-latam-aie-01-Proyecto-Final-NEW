import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "../inventory.module.css";

const ProductsPageClient = dynamic(
  () => import("./products-page-client").then((mod) => ({ default: mod.ProductsPageClient })),
  {
    loading: () => (
      <div role="status" aria-label="Cargando inventario…"
        style={{ padding: "1.5rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ height: 24, width: "40%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 300, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function InventoryProductsPage() {
  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <a href="/backoffice/inventory/products">Inventario</a> / Productos
        </p>
        <p className={styles.kicker}>Control de Stock</p>
        <h1>Inventario de Activos</h1>
        <p>
          Todos los activos de Nexova con su stock actual calculado. Usa los indicadores de color para
          identificar necesidades de reposición de un vistazo.
        </p>
      </header>

      <Suspense fallback={
        <div role="status" aria-label="Cargando…"
          style={{ padding: "1.5rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ height: 300, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
        </div>
      }>
        <ProductsPageClient />
      </Suspense>
    </div>
  );
}