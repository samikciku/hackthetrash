"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import en from "../../../locales/en.json";
import sq from "../../../locales/sq.json";

export const SUPPORTED = ["en", "sq"] as const;
export type Locale = typeof SUPPORTED[number];

const RESOURCES: Record<Locale, any> = { en, sq };
const STORAGE_KEY = "htt-locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function lookup(table: any, dottedKey: string): string | undefined {
  return dottedKey.split(".").reduce((o, k) => (o == null ? undefined : o[k]), table);
}

function interpolate(value: string, vars?: Record<string, string | number>): string {
  if (!vars) return value;
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, k) => String(vars[k] ?? ""));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sq");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (stored && (SUPPORTED as readonly string[]).includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const raw = lookup(RESOURCES[locale], key) ?? lookup(RESOURCES.en, key) ?? key;
    return typeof raw === "string" ? interpolate(raw, vars) : key;
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
