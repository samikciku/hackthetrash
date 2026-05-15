"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import LanguageSwitcher from "./LanguageSwitcher";
import Icon from "@/components/icons/Icon";

export default function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
            <Icon name="trash" size={18} />
          </span>
          HackTheTrash
        </Link>
        <div className="flex gap-2 items-center text-sm">
          <Link
            href="/map"
            className="hover:text-primary inline-flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
          >
            <Icon name="map" size={16} />
            {t("nav.map")}
          </Link>
          <Link
            href="/report"
            className="bg-primary text-white px-3 py-1.5 rounded-md hover:opacity-90 inline-flex items-center gap-1.5 font-medium"
          >
            <Icon name="camera" size={16} />
            {t("nav.report")}
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-primary inline-flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
          >
            <Icon name="chart-bar" size={16} />
            {t("nav.dashboard")}
          </Link>
          {user ? (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="hover:text-primary inline-flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
                title={t("profile.title")}
              >
                <Icon name="user" size={16} />
                {t("profile.title")}
              </Link>
              <Link
                href="/admin"
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1.5 px-2 py-1"
              >
                <Icon name="shield-check" size={16} />
                Admin
              </Link>
              <button
                onClick={logout}
                className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 px-2 py-1"
                title={user.email}
              >
                <Icon name="log-out" size={14} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="hover:text-primary text-gray-600 inline-flex items-center gap-1.5 px-2 py-1"
            >
              <Icon name="log-in" size={16} />
              {t("nav.signIn")}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
