"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import { getAccessToken, setAccessToken } from "../../lib/auth";
import type { CurrentUser } from "../../lib/auth-types";
import { AuthNavigation } from "./auth-navigation";
import { getCachedSession, setCachedSession, clearCachedSession } from "../../lib/session-cache";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const PASSWORD_RECOVERY_ROUTES = new Set(["/forgot-password", "/reset-password"]);

type GuardState = "checking" | "authenticated" | "public" | "error";

// Caché de sesión en memoria para evitar refetch en navegaciones SPA
// También se persiste en localStorage para sobrevivir a recargas de página
let cachedUser: CurrentUser | null = null;
let cachedPromise: Promise<CurrentUser> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>(() => {
    // Solo usar caché en memoria (seguro en SSR porque siempre es null al hidratar)
    if (cachedUser) return "authenticated";
    const isAuthRoute = AUTH_ROUTES.has(pathname);
    const isPasswordRecoveryRoute = PASSWORD_RECOVERY_ROUTES.has(pathname);
    if (isPasswordRecoveryRoute || (isAuthRoute && !getAccessToken())) return "public";
    return "checking";
  });
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const validateSession = useCallback(async (): Promise<void> => {
    const isAuthRoute = AUTH_ROUTES.has(pathname);
    const isPasswordRecoveryRoute = PASSWORD_RECOVERY_ROUTES.has(pathname);

    if (isPasswordRecoveryRoute) {
      setState("public");
      return;
    }

    if (!getAccessToken()) {
      if (isAuthRoute) {
        setState("public");
      } else {
        router.replace("/login");
      }
      return;
    }

    // Intentar recuperar sesión de localStorage (solo cliente, después de hidratación)
    if (!cachedUser) {
      const stored = getCachedSession();
      if (stored) {
        cachedUser = stored;
        setState("authenticated");
        // La validación continúa: el fetch `/auth/me` correrá en segundo plano
        // para confirmar que la sesión cacheada sigue siendo válida.
      }
    }

    // Si ya tenemos el usuario en caché, saltamos el fetch (solo si ya se había validado antes)
    if (cachedUser && cachedPromise) {
      setState("authenticated");
      return;
    }

    // Usar promesa cacheada para evitar fetch duplicado en StrictMode
    if (!cachedPromise) {
      cachedPromise = apiRequest<CurrentUser>("/auth/me").then((user) => {
        cachedUser = user;
        setCachedSession(user); // persistir en localStorage
        return user;
      });
    }

    try {
      await cachedPromise;
      if (mountedRef.current) {
        if (isAuthRoute) {
          router.replace("/");
        } else {
          setState("authenticated");
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getErrorMessage(err));
        setState("error");
      }
      // Limpiar caché y token inválido
      clearCachedSession();
      cachedUser = null;
      cachedPromise = null;
      if (getAccessToken()) {
        import("../../lib/auth").then(({ clearAccessToken }) => clearAccessToken());
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    mountedRef.current = true;
    validateSession();
    return () => {
      mountedRef.current = false;
    };
  }, [validateSession]);

  // Renderizado inmediato del children + navegación mientras se valida
  if (state === "authenticated") {
    return (
      <>
        <AuthNavigation />
        <main>{children}</main>
      </>
    );
  }

  if (state === "public") {
    return <>{children}</>;
  }

  if (state === "error") {
    return (
      <main className="authState" role="alert">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            cachedPromise = null;
            cachedUser = null;
            validateSession();
          }}
        >
          Reintentar
        </button>
      </main>
    );
  }

  // "checking" — mostrar skeleton inmediato sin esperar fetch
  return (
    <>
      <AuthNavigation />
      <main>
        <div className="dashboard-skeleton" role="status" aria-label="Verificando sesión…">
          <div className="skeleton-shimmer" style={{ height: 24, width: "40%" }} />
          <div className="skeleton-shimmer" style={{ height: 200, width: "100%", marginTop: 16 }} />
        </div>
      </main>
    </>
  );
}