"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import styles from "../inventory.module.css";

const InboundOrderClient = dynamic(
  () => import("./inbound/inbound-order-client").then((mod) => ({ default: mod.InboundOrderClient })),
  {
    loading: () => <div className="skeleton-card" role="status">Cargando pedidos de entrada…</div>,
  }
);

const OutboundOrderClient = dynamic(
  () => import("./outbound/outbound-order-client").then((mod) => ({ default: mod.OutboundOrderClient })),
  {
    loading: () => <div className="skeleton-card" role="status">Cargando pedidos de salida…</div>,
  }
);

const OrdersHistoryClient = dynamic(
  () => import("./orders-history-client").then((mod) => ({ default: mod.OrdersHistoryClient })),
  {
    loading: () => <div className="skeleton-card" role="status">Cargando historial…</div>,
  }
);

type TabId = "inbound" | "outbound" | "history";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("inbound");

  const tabs: { id: TabId; label: string }[] = [
    { id: "inbound", label: "📥 Pedidos de entrada" },
    { id: "outbound", label: "📤 Pedidos de salida" },
    { id: "history", label: "📋 Historial" },
  ];

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <a href="/backoffice/inventory/products">Inventario</a> / Órdenes
        </p>
        <p className={styles.kicker}>Gestión de inventario</p>
        <h1>Órdenes de inventario</h1>
        <p>
          Consulta y gestiona todas las entradas y salidas de activos, con detalle del producto,
          cantidad, fecha y usuario que registró cada operación.
        </p>
      </header>

      <nav className={styles.tabsNav} role="tablist" aria-label="Tipo de pedidos">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? styles.tabActive : styles.tabInactive}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={activeTab}>
        <Suspense fallback={<div className="skeleton-card" role="status">Cargando…</div>}>
          {activeTab === "inbound" && <InboundOrderClient />}
          {activeTab === "outbound" && <OutboundOrderClient />}
          {activeTab === "history" && <OrdersHistoryClient />}
        </Suspense>
      </div>
    </div>
  );
}