"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, getErrorMessage } from "../../lib/api-client";
import { getAccessToken } from "../../lib/auth";
import type { CurrentUser } from "../../lib/auth-types";
import { AuthNavigation } from "./auth-navigation";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

type GuardState = "checking" | "authenticated" | "public" | "error";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const isPublic = PUBLIC_ROUTES.has(pathname);

    async function validateSession(): Promise<void> {
      setState("checking");
      setError("");

      if (!getAccessToken()) {
        if (isPublic) {
          setState("public");
        } else {
          router.replace("/login");
        }
        return;
      }

      try {
        await apiRequest<CurrentUser>("/auth/me");
        if (!active) return;
        if (isPublic) {
          router.replace("/");
        } else {
          setState("authenticated");
        }
      } catch (requestError) {
        if (!active) return;
        if (isPublic && !getAccessToken()) {
          setState("public");
          return;
        }
        if (getAccessToken()) {
          setError(getErrorMessage(requestError));
          setState("error");
        }
      }
    }

    void validateSession();
    return () => {
      active = false;
    };
  }, [attempt, pathname, router]);

  if (state === "checking") {
    return <main className="authState" role="status" aria-live="polite">Comprobando sesión...</main>;
  }

  if (state === "error") {
    return (
      <main className="authState" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button>
      </main>
    );
  }

  if (state === "public") {
    return children;
  }

  return (
    <>
      <AuthNavigation />
      {children}
    </>
  );
}