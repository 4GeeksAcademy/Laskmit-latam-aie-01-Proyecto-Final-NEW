"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrders } from "../../../../lib/inventory";
import { getErrorMessage } from "../../../../lib/api-client";
import type { OrderItem } from "../../../../lib/inventory";
import styles from "../inventory.module.css";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function orderTypeLabel(item: OrderItem): string {
  if (item.order_type === "inbound") return "Entrada";
  return "Salida";
}

function detailText(item: OrderItem): string {
  if (item.order_type === "inbound") {
    return `Proveedor: ${item.supplier ?? "—"}`;
  }
  // outbound
  const typeLabel = item.exit_type === "allocation" ? "Asignación" : "Consumo";
  if (item.exit_type === "allocation" && item.assigned_to) {
    return `${typeLabel} — Asignado a: ${item.assigned_to}`;
  }
  return typeLabel;
}

export function OrdersHistoryClient() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrders();
      // Ordenar por fecha descendente (más reciente primero)
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setOrders(sorted);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loading} role="status" aria-live="polite">
          Cargando historial de órdenes…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.error} role="alert" aria-live="polite">
          {error}
        </div>
        <button className={styles.primaryButton} onClick={fetchOrders} style={{ marginTop: "0.75rem" }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>No hay órdenes registradas.</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Activo</th>
              <th>SKU</th>
              <th>Cantidad</th>
              <th>Detalle</th>
              <th>Oficina</th>
              <th>Fecha</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((item, idx) => (
              <tr key={`${item.order_type}-${item.id}-${idx}`}>
                <td>
                  <span
                    className={`${styles.badge} ${item.order_type === "inbound" ? styles.badgeInbound : styles.badgeOutbound}`}
                  >
                    {orderTypeLabel(item)}
                  </span>
                </td>
                <td>
                  <strong>{item.asset_name}</strong>
                </td>
                <td className={styles.meta}>{item.asset_sku}</td>
                <td>{item.quantity}</td>
                <td className={styles.meta}>{detailText(item)}</td>
                <td>{item.office}</td>
                <td className={styles.meta}>{formatDate(item.created_at)}</td>
                <td className={styles.meta} style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "0.76rem" }}>
                  {item.user_uuid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}