"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import styles from "./suppliers.module.css";

// Tipos de dominio usados en el frontend para reflejar el contrato de la API.
type SupplierStatus = "active" | "suspended";
type SupplierCountry = "Spain" | "USA";

type Supplier = {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: string[];
  monthly_rate: number;
  currency: "EUR" | "USD";
  updated_at: string;
  status: SupplierStatus;
  contract_renewal_date?: string | null;
  contact_email?: string | null;
  notes?: string | null;
};

type CreateSupplierInput = {
  name: string;
  country: SupplierCountry;
  categories: string;
  monthly_rate: string;
  currency: "EUR" | "USD";
  status: SupplierStatus;
  contract_renewal_date: string;
  contact_email: string;
  notes: string;
};

// Catálogo cerrado para validar categorías antes de enviar al backend.
const VALID_CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;

// Detecta renovaciones que vencen en los próximos 60 días para resaltarlas.
function isRenewalSoon(contractRenewalDate?: string | null): boolean {
  if (!contractRenewalDate) {
    return false;
  }

  const now = new Date();
  const renewalDate = new Date(`${contractRenewalDate}T00:00:00`);

  if (Number.isNaN(renewalDate.getTime())) {
    return false;
  }

  const diffMs = renewalDate.getTime() - now.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 60;
}

export function SuppliersPageClient() {
  // Estado principal del módulo (datos, carga, feedback y filtros).
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [countryFilter, setCountryFilter] = useState<"all" | SupplierCountry>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | (typeof VALID_CATEGORIES)[number]>("all");

  const [createInput, setCreateInput] = useState<CreateSupplierInput>({
    name: "",
    country: "Spain",
    categories: "",
    monthly_rate: "",
    currency: "EUR",
    status: "active",
    contract_renewal_date: "",
    contact_email: "",
    notes: "",
  });

  const [rateInputs, setRateInputs] = useState<Record<number, string>>({});

  // Construye query string de forma declarativa cuando cambian filtros.
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (countryFilter !== "all") {
      params.set("country", countryFilter);
    }
    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }
    const raw = params.toString();
    return raw ? `?${raw}` : "";
  }, [countryFilter, categoryFilter]);

  // Consulta base para recuperar proveedores con filtros opcionales.
  async function fetchSuppliers(query: string): Promise<Supplier[]> {
    return apiRequest<Supplier[]>(`/suppliers${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  }

  // Recarga completa para el botón manual de Refresh y post-acciones.
  async function loadSuppliers(): Promise<void> {
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = await fetchSuppliers(queryString);
      setSuppliers(payload);
      setRateInputs(
        payload.reduce<Record<number, string>>((acc, supplier) => {
          acc[supplier.id] = supplier.monthly_rate.toString();
          return acc;
        }, {})
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  // Sincroniza listado cuando cambian filtros, evitando actualizar estado al desmontar.
  useEffect(() => {
    let isMounted = true;

    async function refreshByFilter(): Promise<void> {
      try {
        const payload = await fetchSuppliers(queryString);
        if (!isMounted) {
          return;
        }

        setSuppliers(payload);
        setRateInputs(
          payload.reduce<Record<number, string>>((acc, supplier) => {
            acc[supplier.id] = supplier.monthly_rate.toString();
            return acc;
          }, {})
        );
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(getErrorMessage(error));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    refreshByFilter().catch(() => {
      // Error flow is already handled in refreshByFilter.
    });

    return () => {
      isMounted = false;
    };
  }, [queryString]);

  // Alta de proveedor con validación mínima en cliente + validación fuerte en backend.
  async function handleCreateSupplier(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const rawCategories = createInput.categories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!createInput.name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (rawCategories.length === 0) {
      setErrorMessage("At least one category is required.");
      return;
    }

    const invalidCategory = rawCategories.find((item) => !VALID_CATEGORIES.includes(item as (typeof VALID_CATEGORIES)[number]));
    if (invalidCategory) {
      setErrorMessage(`Invalid category: ${invalidCategory}`);
      return;
    }

    const monthlyRate = Number(createInput.monthly_rate);
    if (Number.isNaN(monthlyRate) || monthlyRate <= 0) {
      setErrorMessage("Monthly rate must be greater than 0.");
      return;
    }

    const payload = {
      name: createInput.name.trim(),
      country: createInput.country,
      categories: rawCategories,
      monthly_rate: monthlyRate,
      currency: createInput.currency,
      status: createInput.status,
      contract_renewal_date: createInput.contract_renewal_date || null,
      contact_email: createInput.contact_email || null,
      notes: createInput.notes || null,
    };

    try {
      await apiRequest<Supplier>("/suppliers", {
        method: "POST",
        body: payload,
      });

      setSuccessMessage("Supplier created successfully.");
      setCreateInput({
        name: "",
        country: "Spain",
        categories: "",
        monthly_rate: "",
        currency: "EUR",
        status: "active",
        contract_renewal_date: "",
        contact_email: "",
        notes: "",
      });
      await loadSuppliers();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  // Actualiza tarifa mensual desde la fila y refleja resultado en la tabla.
  async function handleRateUpdate(supplierId: number): Promise<void> {
    const value = Number(rateInputs[supplierId]);
    if (Number.isNaN(value) || value <= 0) {
      setErrorMessage("Rate must be greater than 0.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplierId}/rate`, {
        method: "PATCH",
        body: { monthly_rate: value },
      });
      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
      setSuccessMessage(`Monthly rate updated for ${updated.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  // Cambia estado active/suspended desde el selector de cada fila.
  async function handleStatusUpdate(supplierId: number, status: SupplierStatus): Promise<void> {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplierId}/status`, {
        method: "PATCH",
        body: { status },
      });
      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
      setSuccessMessage(`Status updated for ${updated.name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  // Elimina proveedor con confirmación explícita para evitar borrados accidentales.
  async function handleDeleteSupplier(supplierId: number, supplierName: string): Promise<void> {
    const confirmed = window.confirm(`Delete supplier "${supplierName}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest<{ message: string }>(`/suppliers/${supplierId}`, {
        method: "DELETE",
      });

      setSuppliers((previous) => previous.filter((supplier) => supplier.id !== supplierId));
      setRateInputs((previous) => {
        const next = { ...previous };
        delete next[supplierId];
        return next;
      });
      setSuccessMessage(`Supplier ${supplierName} deleted successfully.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  // Render compuesto: formulario de alta + controles de filtro + tabla con acciones.
  return (
    <section className={styles.panel}>
      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Register new supplier</h2>
          <form className={styles.form} onSubmit={handleCreateSupplier}>
            <label>
              Name
              <input
                value={createInput.name}
                onChange={(event) => setCreateInput((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>

            <label>
              Country
              <select
                value={createInput.country}
                onChange={(event) =>
                  setCreateInput((prev) => {
                    const country = event.target.value as SupplierCountry;
                    return {
                      ...prev,
                      country,
                      currency: country === "Spain" ? "EUR" : "USD",
                    };
                  })
                }
              >
                <option value="Spain">Spain</option>
                <option value="USA">USA</option>
              </select>
            </label>

            <label>
              Categories (comma separated)
              <input
                value={createInput.categories}
                onChange={(event) => setCreateInput((prev) => ({ ...prev, categories: event.target.value }))}
                placeholder="job_boards, ats_software"
                required
              />
            </label>

            <label>
              Monthly rate
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={createInput.monthly_rate}
                onChange={(event) => setCreateInput((prev) => ({ ...prev, monthly_rate: event.target.value }))}
                required
              />
            </label>

            <label>
              Currency
              <input value={createInput.currency} readOnly />
            </label>

            <label>
              Status
              <select
                value={createInput.status}
                onChange={(event) =>
                  setCreateInput((prev) => ({ ...prev, status: event.target.value as SupplierStatus }))
                }
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </label>

            <label>
              Contract renewal date
              <input
                type="date"
                value={createInput.contract_renewal_date}
                onChange={(event) =>
                  setCreateInput((prev) => ({ ...prev, contract_renewal_date: event.target.value }))
                }
              />
            </label>

            <label>
              Contact email
              <input
                type="email"
                value={createInput.contact_email}
                onChange={(event) => setCreateInput((prev) => ({ ...prev, contact_email: event.target.value }))}
              />
            </label>

            <label>
              Notes
              <textarea
                value={createInput.notes}
                onChange={(event) => setCreateInput((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
              />
            </label>

            <button type="submit">Create supplier</button>
          </form>
        </article>

        <article className={styles.card}>
          <div className={styles.filtersHeader}>
            <h2>Supplier directory</h2>
            <button type="button" onClick={() => loadSuppliers()}>
              Refresh
            </button>
          </div>

          <div className={styles.filters}>
            <label>
              Country
              <select
                value={countryFilter}
                onChange={(event) => {
                  setLoading(true);
                  setCountryFilter(event.target.value as "all" | SupplierCountry);
                }}
              >
                <option value="all">All</option>
                <option value="Spain">Spain</option>
                <option value="USA">USA</option>
              </select>
            </label>

            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setLoading(true);
                  setCategoryFilter(event.target.value as "all" | (typeof VALID_CATEGORIES)[number]);
                }}
              >
                <option value="all">All</option>
                {VALID_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

          {loading ? <p className={styles.loading}>Loading suppliers...</p> : null}

          {!loading ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Categories</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Renewal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className={isRenewalSoon(supplier.contract_renewal_date) ? styles.renewalSoon : ""}>
                      <td>
                        <strong>{supplier.name}</strong>
                        {supplier.contact_email ? <p className={styles.meta}>{supplier.contact_email}</p> : null}
                      </td>
                      <td colSpan={2}>
                        <div className={styles.countryCategoriesCell}>
                          <p className={styles.countryValue}>{supplier.country}</p>
                          <p className={styles.categoriesValue}>{supplier.categories.join(", ")}</p>
                          {supplier.notes ? <p className={styles.notesInline}>{supplier.notes}</p> : null}
                        </div>
                      </td>
                      <td>
                        <div className={styles.rateEditor}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={rateInputs[supplier.id] ?? ""}
                            onChange={(event) =>
                              setRateInputs((prev) => ({
                                ...prev,
                                [supplier.id]: event.target.value,
                              }))
                            }
                          />
                          <span>{supplier.currency}</span>
                        </div>
                        <p className={styles.meta}>Updated: {new Date(supplier.updated_at).toLocaleString()}</p>
                      </td>
                      <td>
                        <span
                          className={
                            supplier.status === "active" ? styles.statusActive : styles.statusSuspended
                          }
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td>{supplier.contract_renewal_date ?? "-"}</td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" onClick={() => handleRateUpdate(supplier.id)}>
                            Save rate
                          </button>

                          <button
                            type="button"
                            className={`${styles.dangerButton} ${styles.iconButton}`}
                            onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                            aria-label={`Delete ${supplier.name}`}
                            title="Delete supplier"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path
                                d="M9 3.75A.75.75 0 0 1 9.75 3h4.5a.75.75 0 0 1 .75.75V5h3a.75.75 0 0 1 0 1.5h-.72l-.73 11.01A2.25 2.25 0 0 1 14.3 19.5H9.7a2.25 2.25 0 0 1-2.25-1.99L6.72 6.5H6a.75.75 0 0 1 0-1.5h3V3.75Zm1.5 1.25h3V4.5h-3V5Zm-1.54 1.5.67 10.17a.75.75 0 0 0 .75.68h4.24a.75.75 0 0 0 .75-.68l.67-10.17H8.96Zm2.29 2.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V9.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V9.5a.75.75 0 0 1 .75-.75Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>

                          <select
                            value={supplier.status}
                            onChange={(event) =>
                              handleStatusUpdate(supplier.id, event.target.value as SupplierStatus)
                            }
                          >
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
