import styles from "../inventory.module.css";
import { OrdersHistoryClient } from "./orders-history-client";

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

      <OrdersHistoryClient />
    </div>
  );
}