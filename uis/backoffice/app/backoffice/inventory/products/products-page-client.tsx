"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProducts } from "../../../../lib/inventory";
import { getErrorMessage } from "../../../../lib/api-client";
import type { InventoryProduct } from "../../../../lib/inventory";
import styles from "../inventory.module.css";

/*
 * Umbrales de nivel de stock:
 *   0       → agotado  (clase stockEmpty   — rojo)
 *   1 – 5   → bajo     (clase stockLow     — ámbar)
 *   > 5     → saludable (clase stockHealthy — verde)
 */
function stockLevelClass(stock: number): string {
  if (stock === 0) return `${styles.stockCell} ${styles.stockEmpty}`;
  if (stock <= 5) return `${styles.stockCell} ${styles.stockLow}`;
  return `${styles.stockCell} ${styles.stockHealthy}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  hardware: "Hardware",
  peripherals: "Periféricos",
  office_supplies: "Material de oficina",
  training_materials: "Material de formación",
};

export function ProductsPageClient() {
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loading} role="status" aria-live="polite">
          Cargando inventario…
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
        <button className={styles.primaryButton} onClick={fetchProducts} style={{ marginTop: "0.75rem" }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>No hay activos registrados.</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.navRow} style={{ marginBottom: "0.75rem" }}>
        <a className={styles.secondaryButton} href="/backoffice/inventory/orders/inbound">
          + Registrar entrada
        </a>
        <a className={styles.secondaryButton} href="/backoffice/inventory/orders/outbound">
          + Registrar salida
        </a>
        <a className={styles.secondaryButton} href="/backoffice/inventory/orders">
          Historial de órdenes
        </a>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Activo</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Oficina</th>
              <th style={{ textAlign: "center" }}>Stock actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                </td>
                <td className={styles.meta}>{product.sku}</td>
                <td>{CATEGORY_LABELS[product.category] ?? product.category}</td>
                <td>{product.office}</td>
                <td className={stockLevelClass(product.current_stock)}>
                  {product.current_stock}
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() =>
                        router.push(`/backoffice/inventory/orders/inbound?asset_id=${product.id}`)
                      }
                    >
                      Registrar entrada
                    </button>
                    <button
                      className={styles.secondaryButton}
                      onClick={() =>
                        router.push(`/backoffice/inventory/orders/outbound?asset_id=${product.id}`)
                      }
                    >
                      Registrar salida
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}