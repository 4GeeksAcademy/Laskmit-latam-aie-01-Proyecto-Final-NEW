"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import { getAccessToken, setAccessToken } from "../../lib/auth";
import type { CurrentUser } from "../../lib/auth-types";
import { AuthNavigation } from "./auth-navigation";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const PASSWORD_RECOVERY_ROUTES = new Set(["/forgot-password", "/reset-password"]);

type GuardState = "checking" | "authenticated" | "public" | "error";

// Caché de sesión en memoria para evitar refetch en navegaciones SPA
let cachedUser: CurrentUser | null = null;
let cachedPromise: Promise<CurrentUser> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>(() => {
    // Optimización: si ya hay caché, usamos el estado directamente
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

    // Si ya tenemos el usuario en caché, no hacemos fetch
    if (cachedUser) {
      setState("authenticated");
      return;
    }

    // Usar promesa cacheada para evitar fetch duplicado en StrictMode
    if (!cachedPromise) {
      cachedPromise = apiRequest<CurrentUser>("/auth/me").then((user) => {
        cachedUser = user;
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
      // Limpiar token inválido
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