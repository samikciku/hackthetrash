"use client";

import { useI18n, SUPPORTED, Locale } from "@/lib/i18n";

const FLAG: Record<Locale, string> = { en: "🇬🇧", sq: "🇦🇱", it: "🇮🇹" };

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="flex items-center gap-1">
      {SUPPORTED.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-label={t(`lang.${l}`)}
            title={t(`lang.${l}`)}
            className={`px-2 py-1 rounded text-sm border transition ${
              active
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="mr-1">{FLAG[l]}</span>
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
