import { Suspense } from "react";
import CandidatesPageClient from "./CandidatesPageClient";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Cargando vista...</div>}>
      <CandidatesPageClient />
    </Suspense>
  );
}
