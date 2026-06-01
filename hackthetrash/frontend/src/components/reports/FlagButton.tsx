"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getApiBase } from "@/lib/apiBase";

const REASONS = ["spam", "duplicate", "inaccurate", "offensive", "other"] as const;
type Reason = typeof REASONS[number];

export default function FlagButton({ reportId }: { reportId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("duplicate");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return <div className="mt-2 text-xs text-green-700">{t("flag.thanks")}</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`${getApiBase()}/api/reports/${reportId}/flags`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: note.trim() || undefined })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setDone(true);
    } catch (err: any) {
      alert(err?.message ?? "Flag failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-red-600 hover:underline"
      >
        ⚠ {t("flag.button")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-1 border-t pt-2">
      <div className="text-xs font-semibold">{t("flag.title")}</div>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as Reason)}
        className="w-full text-xs border rounded px-2 py-1"
      >
        {REASONS.map((r) => (
          <option key={r} value={r}>{t(`flag.reasons.${r}`)}</option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("flag.notePlaceholder")}
        rows={2}
        maxLength={500}
        className="w-full text-xs border rounded px-2 py-1 resize-none"
      />
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-red-600 text-white text-xs font-semibold py-1 rounded hover:opacity-90 disabled:opacity-40"
        >
          {busy ? t("common.loading") : t("flag.send")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 bg-gray-100 text-gray-700 text-xs py-1 rounded hover:bg-gray-200"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
