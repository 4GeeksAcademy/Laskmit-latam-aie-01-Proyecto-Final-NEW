"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, getProduct, createOutboundOrder } from "../../../../../lib/inventory";
import { getErrorMessage } from "../../../../../lib/api-client";
import type { InventoryProduct } from "../../../../../lib/inventory";
import styles from "../../inventory.module.css";

export function OutboundOrderClient() {
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get("asset_id");

  // --- Product catalogue -------------------------------------------------------
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");

  // --- Form state -------------------------------------------------------------
  const [assetId, setAssetId] = useState("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [exitType, setExitType] = useState<"allocation" | "consumption">("allocation");
  const [assignedTo, setAssignedTo] = useState("");
  const [office, setOffice] = useState("Valencia");

  // --- Submission state --------------------------------------------------------
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // --- Client-side warning (quantity > available stock) -----------------------
  const quantityNum = Number(quantity);
  const exceedsStock = currentStock !== null && quantityNum > currentStock && quantityNum > 0;

  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setCatalogueError("");
    try {
      const data = await getProducts();
      setProducts(data);
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

  // --- Reactive stock: when product selection changes, fetch its current stock --
  useEffect(() => {
    if (!assetId) {
      setCurrentStock(null);
      setStockLoading(false);
      return;
    }

    // First check our catalogue list (we already have stock from the listing)
    const cached = products.find((p) => p.id === Number(assetId));
    if (cached) {
      setCurrentStock(cached.current_stock);
      return;
    }

    // Fallback: fetch individual product detail
    setStockLoading(true);
    getProduct(Number(assetId))
      .then((p) => setCurrentStock(p.current_stock))
      .catch(() => setCurrentStock(null))
      .finally(() => setStockLoading(false));
  }, [assetId, products]);

  function resetForm() {
    setQuantity("");
    setExitType("allocation");
    setAssignedTo("");
    setSubmitSuccess("");
    setSubmitError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const body: {
      asset_id: number;
      quantity: number;
      exit_type: "allocation" | "consumption";
      assigned_to?: string | null;
      office: string;
    } = {
      asset_id: Number(assetId),
      quantity: Number(quantity),
      exit_type: exitType,
      office,
    };

    // Según las reglas de negocio de la API:
    // - allocation: assigned_to es obligatorio
    // - consumption: assigned_to debe ser null (no se envía)
    if (exitType === "allocation") {
      body.assigned_to = assignedTo.trim();
    }

    try {
      const result = await createOutboundOrder(body);
      const productName = products.find((p) => p.id === result.asset_id)?.name ?? `ID ${result.asset_id}`;
      setSubmitSuccess(
        `Orden de salida registrada correctamente: ${result.quantity} unidades de "${productName}".`,
      );
      resetForm();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      // No limpiar el formulario en error — permitir ajustar cantidad y reintentar
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render -------------------------------------------------------------------

  return (
    <div className={styles.card}>
      <h2>Nueva orden de salida</h2>

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
          No hay activos disponibles. Debes crear al menos un activo antes de registrar una salida.
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

          {/* Stock disponible (reactivo) */}
          <div className={styles.stockDisplay}>
            {stockLoading
              ? "Consultando stock…"
              : currentStock !== null
                ? `Stock disponible: ${currentStock} unidades`
                : "—"}
          </div>

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
              placeholder="Ej: 2"
            />
          </label>

          {/* Advertencia cliente si cantidad supera stock */}
          {exceedsStock && (
            <div className={styles.warning} role="alert" aria-live="polite">
              La cantidad solicitada ({quantityNum}) supera el stock disponible ({currentStock}).
              La API rechazará esta orden si el stock es insuficiente.
            </div>
          )}

          {/* Tipo de salida */}
          <label>
            Tipo de salida *
            <select
              value={exitType}
              onChange={(e) => setExitType(e.target.value as "allocation" | "consumption")}
              required
              disabled={submitting}
            >
              <option value="allocation">Asignación (entrega a empleado)</option>
              <option value="consumption">Consumo (gasto interno)</option>
            </select>
          </label>

          {/* Asignado a — obligatorio solo si es asignación */}
          {exitType === "allocation" && (
            <label>
              Asignado a *
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                disabled={submitting}
                placeholder="Ej: María González"
              />
            </label>
          )}

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
            {submitting ? "Registrando…" : "Registrar salida"}
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
              Registrar otra salida
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