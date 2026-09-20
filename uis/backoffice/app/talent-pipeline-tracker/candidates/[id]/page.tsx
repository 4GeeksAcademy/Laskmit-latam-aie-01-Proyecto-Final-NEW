import dynamic from "next/dynamic";
import { Suspense } from "react";

const CandidateDetailClient = dynamic(
  () => import("../../components/CandidateDetailClient"),
  {
    loading: () => (
      <div role="status" aria-label="Cargando detalle de candidato…"
        style={{ padding: "2rem" }}>
        <div style={{ height: 24, width: "30%", marginBottom: 16, background: "#e0e0e0", borderRadius: 4 }} />
        <div style={{ height: 400, width: "100%", background: "#e0e0e0", borderRadius: 4 }} />
      </div>
    ),
  }
);

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={<div role="status" aria-label="Cargando…"
      style={{ padding: "2rem" }}>Cargando detalle…</div>}>
      <CandidateDetailClient />
    </Suspense>
  );
}