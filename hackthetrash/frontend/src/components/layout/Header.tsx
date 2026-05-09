"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();

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
          {user ? (
            <>
              <Link href="/admin" className="text-primary font-semibold hover:underline">
                🔐 Admin
              </Link>
              <button
                onClick={logout}
                className="text-xs text-red-600 hover:underline"
                title={user.email}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/admin/login" className="hover:text-primary text-gray-600">
              🔐 {t("nav.signIn")}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
