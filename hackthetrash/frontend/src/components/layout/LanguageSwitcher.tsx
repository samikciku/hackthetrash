"use client";

import { useI18n, SUPPORTED, Locale } from "@/lib/i18n";

const FLAG: Record<Locale, string> = { en: "EN", sq: "SQ", it: "IT" };

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="border rounded px-2 py-1 text-sm bg-white"
      aria-label="Language"
    >
      {SUPPORTED.map((l) => (
        <option key={l} value={l}>
          {FLAG[l]} {t(`lang.${l}`)}
        </option>
      ))}
    </select>
  );
}
