"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiBase } from "./apiBase";

/** Legacy key — token is no longer stored client-side (HttpOnly cookie from login). */
const LEGACY_TOKEN_KEY = "htt-admin-token";
const LEGACY_USER_KEY = "htt-admin-user";

export type Role = "citizen" | "moderator" | "authority" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  region: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  /** @deprecated Always null — session is HttpOnly cookie. Kept for gradual refactors. */
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const base = getApiBase();
        const r = await fetch(`${base}/api/auth/me`, { credentials: "include" });
        if (cancelled) return;
        if (r.ok) {
          const u = (await r.json()) as AuthUser;
          setUser(u);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const base = getApiBase();
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || `Login failed (${res.status})` };
      if (data.user) setUser(data.user as AuthUser);
      try {
        const me = await fetch(`${base}/api/auth/me`, { credentials: "include" });
        if (me.ok) setUser((await me.json()) as AuthUser);
      } catch {
        /* keep login body user */
      }
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const friendly =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("load failed")
          ? `Cannot reach the backend at ${base || "this origin"}. Is it running? (npm run dev in /backend or integrated Next API)`
          : msg;
      return { ok: false, error: friendly };
    }
  };

  const logout: AuthCtx["logout"] = async () => {
    setUser(null);
    try {
      await fetch(`${getApiBase()}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
  };

  const apiFetch: AuthCtx["apiFetch"] = (path, init = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string> | undefined) || {})
    };
    return fetch(`${getApiBase()}${path}`, {
      credentials: "include",
      ...init,
      headers
    }).then(async (res) => {
      if (res.status === 401) {
        setUser(null);
      }
      return res;
    });
  };

  return (
    <Ctx.Provider value={{ user, token, loading, login, logout, apiFetch }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within <AuthProvider>");
  return c;
}

/**
 * Wrap admin pages with this. Redirects to /admin/login if no session.
 */
export function RequireAuth({ children, role }: { children: ReactNode; role?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (role && !role.includes(user.role)) {
      router.replace("/admin/login?error=forbidden");
    }
  }, [user, loading, router, pathname, role]);

  if (loading || !user) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }
  return <>{children}</>;
}
