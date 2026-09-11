import styles from "../inventory.module.css";
import { ProductsPageClient } from "./products-page-client";

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

      <ProductsPageClient />
    </div>
  );
}