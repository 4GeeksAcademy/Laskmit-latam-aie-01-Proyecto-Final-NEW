"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, createInboundOrder } from "../../../../../lib/inventory";
import { getErrorMessage } from "../../../../../lib/api-client";
import type { InventoryProduct } from "../../../../../lib/inventory";
import styles from "../../inventory.module.css";

export function InboundOrderClient() {
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get("asset_id");

  // --- Product catalogue -------------------------------------------------------
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");

  // --- Form state -------------------------------------------------------------
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [office, setOffice] = useState("Valencia");

  // --- Submission state --------------------------------------------------------
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setCatalogueError("");
    try {
      const data = await getProducts();
      setProducts(data);
      // Precargar el asset_id si viene en la URL y el catálogo incluye ese ID
      if (preselectedAssetId && data.some((p) => p.id === Number(preselectedAssetId))) {
        setAssetId(preselectedAssetId);
      }
    } catch (err) {
      setCatalogueError(getErrorMessage(err));
    } finally {
      setCatalogueLoading(false);
    }
  }, [preselectedAssetId]);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  // Sincronizar la oficina automáticamente cuando se selecciona un activo
  useEffect(() => {
    if (assetId) {
      const product = products.find((p) => p.id === Number(assetId));
      if (product) {
        setOffice(product.office);
      }
    }
  }, [assetId, products]);

  function resetForm() {
    setQuantity("");
    setSupplier("");
    setSubmitSuccess("");
    setSubmitError("");
    // Mantener el producto seleccionado para facilitar órdenes consecutivas
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const result = await createInboundOrder({
        asset_id: Number(assetId),
        quantity: Number(quantity),
        supplier: supplier.trim(),
        office,
      });

      const productName = products.find((p) => p.id === result.asset_id)?.name ?? `ID ${result.asset_id}`;
      setSubmitSuccess(
        `Orden de entrada registrada correctamente: ${result.quantity} unidades de "${productName}".`,
      );
      resetForm();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render -------------------------------------------------------------------

  return (
    <div className={styles.card}>
      <h2>Nueva orden de entrada</h2>

      {catalogueLoading && (
        <div className={styles.loading} role="status" aria-live="polite">
          Cargando activos disponibles…
        </div>
      )}

      {catalogueError && (
        <div className={styles.error} role="alert" aria-live="polite">
          {catalogueError}
          <button className={styles.primaryButton} onClick={loadCatalogue} style={{ marginTop: "0.5rem" }}>
            Reintentar
          </button>
        </div>
      )}

      {!catalogueLoading && !catalogueError && products.length === 0 && (
        <div className={styles.loading}>
          No hay activos disponibles. Debes crear al menos un activo antes de registrar una entrada.
        </div>
      )}

      {!catalogueLoading && !catalogueError && products.length > 0 && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Activo */}
          <label>
            Activo *
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="">— Selecciona un activo —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.office}
                </option>
              ))}
            </select>
          </label>

          {/* Cantidad */}
          <label>
            Cantidad *
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={submitting}
              placeholder="Ej: 10"
            />
          </label>

          {/* Proveedor */}
          <label>
            Proveedor *
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              required
              disabled={submitting}
              placeholder="Ej: TechDistrib Valencia S.L."
            />
          </label>

          {/* Oficina — se sincroniza automáticamente con el activo seleccionado */}
          <label>
            Oficina *
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              required
              disabled={submitting || Boolean(assetId)}
            >
              <option value="Valencia">Valencia</option>
              <option value="Miami">Miami</option>
            </select>
            {assetId && (
              <small className={styles.hint}>
                Oficina determinada por el activo seleccionado. Selecciona otro activo para cambiar la oficina.
              </small>
            )}
          </label>

          <button className={styles.primaryButton} type="submit" disabled={submitting}>
            {submitting ? "Registrando…" : "Registrar entrada"}
          </button>
        </form>
      )}

      {/* Feedback de resultado */}
      {submitSuccess && (
        <div className={styles.success} role="status" aria-live="polite">
          {submitSuccess}
          <div className={styles.afterSubmitActions}>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setSubmitSuccess("");
                setSubmitError("");
              }}
            >
              Registrar otra entrada
            </button>
            <a className={styles.secondaryButton} href="/backoffice/inventory/orders">
              Ver historial de órdenes
            </a>
          </div>
        </div>
      )}

      {submitError && (
        <div className={styles.error} role="alert" aria-live="polite">
          {submitError}
        </div>
      )}
    </div>
  );
}