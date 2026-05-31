"use client";

import { useEffect, useState, useCallback } from "react";
import { RequireAuth, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import Icon from "@/components/icons/Icon";
import { getApiBase, fullPhotoUrl } from "@/lib/apiBase";

type Report = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  description?: string;
  severity?: string;
  tags?: string[];
  photoUrls?: string[];
  photo_urls?: string[];
  ai_score?: number | null;
  ai_label?: string | null;
  createdAt?: string;
  created_at?: string;
};

const STATUS_BADGE: Record<string, string> = {
  reported: "bg-red-100 text-red-700",
  verified: "bg-yellow-100 text-yellow-800",
  cleaning: "bg-blue-100 text-blue-700",
  cleaned:  "bg-green-100 text-green-700",
  rejected: "bg-gray-200 text-gray-600"
};

const STATUS_FILTERS = ["all", "reported", "verified", "cleaning", "cleaned", "rejected"];

function AdminInner() {
  const { user, logout, apiFetch } = useAuth();
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("reported");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter === "all" ? "" : `?status=${filter}`;
      const res = await apiFetch(`/api/admin/reports${q}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter, apiFetch]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, action: "approve" | "reject" | "cleaning" | "cleaned") => {
    if (!confirm(`Are you sure you want to ${action} this report?`)) return;
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/admin/reports/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const counts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="shield-check" size={24} className="text-primary" />
            {t("admin.title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("admin.loggedAs")} <span className="font-mono">{user?.email}</span>
            {" "}· {t("admin.role")}: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user?.role === "admin" && (
            <a
              href="/admin/users"
              className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <Icon name="users" size={16} />
              {t("admin.users")}
            </a>
          )}
          <a
            href="/admin/password"
            className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 inline-flex items-center gap-1.5"
          >
            <Icon name="key" size={16} />
            {t("admin.changePassword")}
          </a>
          <button
            onClick={logout}
            className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 inline-flex items-center gap-1.5"
          >
            <Icon name="log-out" size={16} />
            {t("admin.logout")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm border ${
              filter === s
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? t("admin.all") : t(`status.${s}`)}
            {filter === s && reports.length > 0 && (
              <span className="ml-2 bg-white/30 px-1.5 rounded-full text-xs">{reports.length}</span>
            )}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto text-sm bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-50"
        >
          <Icon name="refresh" size={14} className="inline mr-1" />
          {t("map.refresh")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t("dashboard.loading")}</div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border rounded-lg">
          {t("admin.noReports")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => {
            const photos = (r.photoUrls ?? r.photo_urls ?? []).map(fullPhotoUrl);
            const created = r.createdAt ?? r.created_at;
            const aiOk = r.ai_label === "trash" && (r.ai_score ?? 0) >= 0.7;
            const aiBad = r.ai_label === "not_trash" && (r.ai_score ?? 0) >= 0.7;
            return (
              <div key={r.id} className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
                {/* Photo strip */}
                <div className="bg-gray-100 h-44 flex items-center justify-center overflow-hidden">
                  {photos.length === 0 ? (
                    <span className="text-gray-400 text-xs">{t("admin.noPhotos")}</span>
                  ) : (
                    <div className="flex gap-1 overflow-x-auto h-full">
                      {photos.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={u} alt="trash" className="h-44 object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {t(`status.${r.status}`)}
                    </span>
                    {r.severity && (
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Icon name="info" size={12} />
                        {t(`report.${r.severity}`)}
                      </span>
                    )}
                    {r.ai_score != null && (
                      <span
                        className={`ml-auto text-xs font-mono ${
                          aiOk ? "text-green-700" : aiBad ? "text-red-600" : "text-gray-500"
                        }`}
                        title={`AI label: ${r.ai_label}`}
                      >
                        AI {r.ai_score.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-sm text-gray-800 mb-2">{r.description}</p>
                  )}

                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.tags.map((tg) => (
                        <span key={tg} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{t(`tags.${tg}`)}</span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-auto pt-2 border-t flex items-center gap-1">
                    <Icon name="home" size={12} />
                    <span className="font-mono">{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</span>
                    {created && <span>· {new Date(created).toLocaleString()}</span>}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      disabled={busyId === r.id || r.status === "verified"}
                      onClick={() => decide(r.id, "approve")}
                      className="bg-green-600 text-white text-sm py-2 rounded font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    >
                      <Icon name="check-circle" size={16} />
                      {t("admin.approve")}
                    </button>
                    <button
                      disabled={busyId === r.id || r.status === "rejected"}
                      onClick={() => decide(r.id, "reject")}
                      className="bg-red-600 text-white text-sm py-2 rounded font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    >
                      <Icon name="x-circle" size={16} />
                      {t("admin.reject")}
                    </button>
                    <button
                      disabled={busyId === r.id || r.status === "cleaning"}
                      onClick={() => decide(r.id, "cleaning")}
                      className="bg-blue-600 text-white text-sm py-2 rounded font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    >
                      <Icon name="broom" size={16} />
                      {t("status.cleaning")}
                    </button>
                    <button
                      disabled={busyId === r.id || r.status === "cleaned"}
                      onClick={() => decide(r.id, "cleaned")}
                      className="bg-emerald-600 text-white text-sm py-2 rounded font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                    >
                      <Icon name="sparkles" size={16} />
                      {t("status.cleaned")}
                    </button>
                  </div>

                  <a
                    href={`/map?lat=${r.latitude}&lng=${r.longitude}&id=${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-center text-xs text-primary hover:underline"
                  >
                    <Icon name="external-link" size={12} className="inline mr-1" />
                    {t("admin.openOnMap")}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role={["admin", "moderator", "authority"]}>
      <AdminInner />
    </RequireAuth>
  );
}
