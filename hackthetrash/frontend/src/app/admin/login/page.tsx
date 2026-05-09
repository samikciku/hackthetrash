"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

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
          disabled={submitting}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90"
        >
          {submitting ? t("admin.signingIn") : t("admin.signIn")}
        </button>

        <p className="text-xs text-gray-400 text-center">
          {t("admin.lockoutNote")}
        </p>
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
