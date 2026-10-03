"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken } from "../../lib/auth";
import { clearCachedSession } from "../../lib/session-cache";
import { track } from "../../lib/telemetry";
import { initTelemetry } from "../../lib/telemetry-init";

export function AuthNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Inicializar handlers globales de telemetría (errores, rendimiento, web vitals)
  initTelemetry();

  // Emitir page view al montar la navegación
  // Se usa un breve retardo para evitar duplicados con navegaciones SPA
  setTimeout(() => {
    const section = pathname.replace(/^\//, "").split("/")[0] || "home";
    track("navigation_section_entered", {
      section,
      referrer_section: document.referrer ? new URL(document.referrer).pathname.replace(/^\//, "").split("/")[0] || "external" : null,
      user_role: "authenticated",
    });
  }, 100);

  function logout(): void {
    clearAccessToken();
    clearCachedSession();
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
          <Link href="/incidents">Gestor de incidencias</Link>
          <Link href="/incidents-analyzer">Analizador CSV</Link>
          <Link href="/backoffice/inventory/products">Inventario</Link>
          <Link href="/account/profile">Perfil</Link>
          <Link href="/account/change-password">Contraseña</Link>
          <button type="button" onClick={logout}>Cerrar sesión</button>
        </nav>
      </div>
    </header>
  );
}