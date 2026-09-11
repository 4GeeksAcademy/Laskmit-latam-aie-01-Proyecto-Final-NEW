import styles from "../../inventory.module.css";
import { InboundOrderClient } from "./inbound-order-client";

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

      <InboundOrderClient />
    </div>
  );
}