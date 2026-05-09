"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireAuth, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

function PasswordInner() {
  const { user, apiFetch } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError(t("admin.passwordTooShort"));
    if (newPassword !== confirm) return setError(t("admin.passwordMismatch"));
    if (newPassword === currentPassword) return setError(t("admin.passwordSame"));

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">{t("admin.passwordChanged")}</h2>
        <p className="text-gray-600 mb-6">{t("admin.passwordChangedNote")}</p>
        <Link href="/admin" className="bg-primary text-white px-4 py-2 rounded">
          {t("admin.backToPanel")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Link href="/admin" className="text-sm text-gray-500 hover:underline mb-4 inline-block">
        ← {t("admin.backToPanel")}
      </Link>
      <h1 className="text-2xl font-bold mb-1">🔑 {t("admin.changePassword")}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("admin.loggedAs")} <span className="font-mono">{user?.email}</span>
      </p>

      <form onSubmit={onSubmit} className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("admin.currentPassword")}
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("admin.newPassword")}
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">{t("admin.passwordHint")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("admin.confirmPassword")}
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90"
        >
          {submitting ? t("admin.saving") : t("admin.savePassword")}
        </button>
      </form>
    </div>
  );
}

export default function AdminPasswordPage() {
  return (
    <RequireAuth>
      <PasswordInner />
    </RequireAuth>
  );
}
