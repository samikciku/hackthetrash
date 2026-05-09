"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, API_URL } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type BackendStatus = "checking" | "ok" | "down";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const errorParam = params.get("error");

  const { login, user, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "forbidden" ? t("admin.errorForbidden") : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [backend, setBackend] = useState<BackendStatus>("checking");

  // Ping the backend so the user knows up-front whether it is reachable.
  // We retry every 5s while it is down so the banner clears as soon as
  // someone fires up `npm run dev` in /backend.
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 4000);
        const res = await fetch(`${API_URL}/health`, { signal: ctl.signal });
        clearTimeout(timer);
        if (alive) setBackend(res.ok ? "ok" : "down");
      } catch {
        if (alive) setBackend("down");
      }
    };
    ping();
    const id = setInterval(() => { if (backend !== "ok") ping(); }, 5000);
    return () => { alive = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If already logged in, bounce to next
  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const r = await login(email, password);
    setSubmitting(false);
    if (r.ok) router.replace(next);
    else setError(r.error);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-md border p-8 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold">{t("admin.login")}</h1>
          <p className="text-sm text-gray-500">{t("app.name")} - {t("admin.loginSubtitle")}</p>
        </div>

        {/* Backend reachability banner */}
        {backend === "checking" && (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs p-2 rounded flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
            {t("admin.backendChecking")}
          </div>
        )}
        {backend === "down" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              {t("admin.backendDown")}
            </div>
            <div className="text-red-700/80 mb-2">
              {t("admin.backendDownHint")}
            </div>
            <pre className="bg-red-100 text-red-900 p-2 rounded font-mono text-[11px] overflow-x-auto">
{`cd hackthetrash/backend
npm run dev`}
            </pre>
            <div className="mt-2 text-red-700/70 text-[11px]">
              {t("admin.backendUrl")}: <span className="font-mono">{API_URL}</span>
            </div>
          </div>
        )}
        {backend === "ok" && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] p-2 rounded flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            {t("admin.backendOk")}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.email")}</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="admin@hackthetrash.org"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.password")}</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || backend === "down"}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90"
        >
          {submitting ? t("admin.signingIn") : t("admin.signIn")}
        </button>

        <p className="text-xs text-gray-400 text-center">
          {t("admin.lockoutNote")}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 border-2 border-dashed border-yellow-300 bg-yellow-50 p-3 rounded-lg text-xs">
            <div className="font-semibold text-yellow-900 mb-1">
              🧪 {t("admin.demoCreds")}
            </div>
            <div className="font-mono text-yellow-900 select-all">
              admin@hackthetrash.org
              <br />
              ChangeMe!2026
            </div>
            <div className="mt-2 text-yellow-800/80">{t("admin.demoNote")}</div>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@hackthetrash.org");
                setPassword("ChangeMe!2026");
              }}
              className="mt-2 text-yellow-900 font-semibold hover:underline"
            >
              {t("admin.demoFill")} →
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}
