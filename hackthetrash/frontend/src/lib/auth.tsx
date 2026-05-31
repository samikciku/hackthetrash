"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiBase } from "./apiBase";
const TOKEN_KEY = "htt-admin-token";
const USER_KEY = "htt-admin-user";

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
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      try { setUser(JSON.parse(u)); setToken(t); } catch {}
    }
    setLoading(false);
  }, []);

  const persist = (t: string | null, u: AuthUser | null) => {
    setToken(t);
    setUser(u);
    if (typeof window === "undefined") return;
    if (t && u) {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const login: AuthCtx["login"] = async (email, password) => {
    const base = getApiBase();
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || `Login failed (${res.status})` };
      persist(data.token, data.user);
      return { ok: true };
    } catch (e: any) {
      // Network-level failure (server unreachable, CORS blocked,
      // mixed content, offline, etc). Be explicit so the user can act.
      const msg = e?.message || String(e);
      const friendly =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("load failed")
          ? `Cannot reach the backend at ${base || "this origin"}. Is it running? (npm run dev in /backend or integrated Next API)`
          : msg;
      return { ok: false, error: friendly };
    }
  };

  const logout = () => persist(null, null);

  const apiFetch: AuthCtx["apiFetch"] = (path, init = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string> | undefined) || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${getApiBase()}${path}`, { ...init, headers }).then(async (res) => {
      if (res.status === 401) {
        // Token expired/invalid -> drop
        persist(null, null);
      }
      return res;
    });
  };

  return <Ctx.Provider value={{ user, token, loading, login, logout, apiFetch }}>{children}</Ctx.Provider>;
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
