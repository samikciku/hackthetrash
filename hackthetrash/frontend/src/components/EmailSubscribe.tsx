"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getApiBase } from "@/lib/apiBase";

export default function EmailSubscribe() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("Pristina");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${getApiBase()}/api/email-subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, region })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `API ${res.status}`);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Subscribe failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
        {t("subscribe.thanks")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-2">
      <div className="font-semibold text-sm">{t("subscribe.title")}</div>
      <p className="text-xs text-gray-500">{t("subscribe.subtitle")}</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder={t("subscribe.regionPlaceholder")}
          className="w-32 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded hover:opacity-90 disabled:opacity-40"
        >
          {busy ? t("common.loading") : t("subscribe.button")}
        </button>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </form>
  );
}
