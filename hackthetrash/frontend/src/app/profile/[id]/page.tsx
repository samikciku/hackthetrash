"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getApiBase } from "@/lib/apiBase";
import Icon from "@/components/icons/Icon";

type Badge = { code: string; awarded_at: string; title?: string; icon?: string };

type Profile = {
  id: string;
  name: string | null;
  email?: string;
  role: string;
  region: string | null;
  badges: Badge[];
  stats: {
    totalReports: number;
    byStatus: Record<string, number>;
    hasVerified: boolean;
    hasCleaned: boolean;
  };
  recent?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    status: string;
    description?: string;
    created_at?: string;
    createdAt?: string;
  }>;
};

const STATUS_BADGE: Record<string, string> = {
  reported: "bg-red-100 text-red-700",
  verified: "bg-yellow-100 text-yellow-800",
  cleaning: "bg-blue-100 text-blue-700",
  cleaned: "bg-green-100 text-green-700",
  rejected: "bg-gray-200 text-gray-600"
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiBase()}/api/profile/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((p) => setProfile(p))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t("common.loading")}</div>;
  }
  if (error || !profile) {
    return (
      <div className="p-8 text-center text-gray-500">
        {error || t("profile.notFound")}
      </div>
    );
  }

  const displayName = profile.name || `User ${profile.id.slice(0, 8)}`;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header card */}
      <div className="bg-white border rounded-lg p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="text-sm text-gray-500 mt-1">
              {profile.region && (
                <span className="inline-flex items-center gap-1 mr-3">
                  <Icon name="home" size={14} />
                  {profile.region}
                </span>
              )}
              <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {t(`admin.roles.${profile.role}`)}
              </span>
            </div>
            {profile.email && (
              <div className="text-xs text-gray-400 mt-1 font-mono">{profile.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label={t("profile.totalReports")} value={profile.stats.totalReports} />
        <Stat label={t("status.verified")} value={profile.stats.byStatus.verified ?? 0} />
        <Stat label={t("status.cleaning")} value={profile.stats.byStatus.cleaning ?? 0} />
        <Stat label={t("status.cleaned")} value={profile.stats.byStatus.cleaned ?? 0} />
      </div>

      {/* Badges */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Icon name="sparkles" size={18} className="text-primary" />
          {t("profile.badges")}
        </h2>
        {profile.badges.length === 0 ? (
          <p className="text-sm text-gray-400">{t("profile.noBadges")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((b) => (
              <div
                key={b.code}
                className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5"
                title={new Date(b.awarded_at).toLocaleString()}
              >
                <span className="text-xl">{b.icon || "🏅"}</span>
                <span className="text-sm font-medium">{b.title || b.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent reports */}
      {profile.recent && profile.recent.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-3">{t("profile.recentReports")}</h2>
          <ul className="divide-y">
            {profile.recent.map((r) => {
              const created = r.created_at ?? r.createdAt;
              return (
                <li key={r.id} className="py-2 flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`status.${r.status}`)}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {r.description || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                  </span>
                  {created && (
                    <span className="text-xs text-gray-400">
                      {new Date(created).toLocaleDateString()}
                    </span>
                  )}
                  <Link
                    href={`/map?lat=${r.latitude}&lng=${r.longitude}&id=${r.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("admin.openOnMap")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
