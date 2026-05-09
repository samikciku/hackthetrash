"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import en from "../../../locales/en.json";
import sq from "../../../locales/sq.json";
import it from "../../../locales/it.json";

export const SUPPORTED = ["en", "sq", "it"] as const;
export type Locale = typeof SUPPORTED[number];

const RESOURCES: Record<Locale, any> = { en, sq, it };
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
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (stored && (SUPPORTED as readonly string[]).includes(stored)) {
      setLocaleState(stored);
      return;
    }
    if (typeof navigator !== "undefined") {
      const nav = navigator.language.slice(0, 2).toLowerCase();
      if ((SUPPORTED as readonly string[]).includes(nav)) setLocaleState(nav as Locale);
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
