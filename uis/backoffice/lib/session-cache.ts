/**
 * Session cache con localStorage para evitar fetch a /auth/me en recargas.
 * 
 * TTL: 5 minutos desde la última escritura.
 * Uso: auth-guard.tsx lee al montar, escribe tras fetch exitoso, limpia en logout.
 */

import type { CurrentUser } from "./auth-types";

const SESSION_CACHE_KEY = "nexova:session";
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CachedSession {
  user: CurrentUser;
  timestamp: number;
}

export function getCachedSession(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedSession = JSON.parse(raw);
    if (Date.now() - cached.timestamp > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return cached.user;
  } catch {
    return null;
  }
}

export function setCachedSession(user: CurrentUser): void {
  if (typeof window === "undefined") return;

  const cache: CachedSession = { user, timestamp: Date.now() };
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage lleno o deshabilitado — ignorar silenciosamente
  }
}

export function clearCachedSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // ignorar
  }
}