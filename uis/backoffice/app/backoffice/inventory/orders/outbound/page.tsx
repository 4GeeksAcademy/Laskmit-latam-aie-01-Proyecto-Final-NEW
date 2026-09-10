import styles from "../../inventory.module.css";
import { OutboundOrderClient } from "./outbound-order-client";

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

      <OutboundOrderClient />
    </div>
  );
}