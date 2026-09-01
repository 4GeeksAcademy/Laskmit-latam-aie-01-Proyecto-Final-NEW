"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "../../lib/auth";

export function AuthNavigation() {
  const router = useRouter();

  function logout(): void {
    clearAccessToken();
    router.replace("/login");
  }

  return (
    <header className="appNav">
      <div className="appNavInner">
        <p>Nexova Backoffice</p>
        <nav aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <Link href="/suppliers">Suppliers</Link>
          <Link href="/talent-pipeline-tracker">Talent Pipeline</Link>
          <Link href="/incidents-analyzer">Incidencias</Link>
          <Link href="/account/profile">Perfil</Link>
          <button type="button" onClick={logout}>Cerrar sesión</button>
        </nav>
      </div>
    </header>
  );
}