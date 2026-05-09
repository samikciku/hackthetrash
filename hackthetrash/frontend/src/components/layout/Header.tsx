"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useI18n();
  return (
    <header className="bg-white border-b shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">🗑️ HackTheTrash</Link>
        <div className="flex gap-3 items-center text-sm">
          <Link href="/map" className="hover:text-primary">🗺️ {t("nav.map")}</Link>
          <Link href="/report" className="bg-primary text-white px-3 py-1 rounded hover:opacity-90">
            📸 {t("nav.report")}
          </Link>
          <Link href="/dashboard" className="hover:text-primary">📊 {t("nav.dashboard")}</Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
