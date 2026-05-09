"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Keeps <html lang="..."> in sync with the active locale,
 * and adjusts document.title so SEO/screen readers see the localized name.
 */
export default function HtmlLangSync() {
  const { locale, t } = useI18n();
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.title = `${t("app.name")} - ${t("app.tagline")}`;
    }
  }, [locale, t]);
  return null;
}
