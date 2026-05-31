"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getApiBase } from "@/lib/apiBase";

type Report = {
  id: string;
  status: string;
  description?: string;
  severity?: string;
  createdAt?: string;
  created_at?: string;
  latitude: number;
  longitude: number;
};

export default function DashboardPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/reports`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = reports.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📊 {t("dashboard.title")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("dashboard.total"), value: reports.length, color: "bg-gray-100" },
          { label: t("status.reported"), value: counts.reported || 0, color: "bg-red-100" },
          { label: t("status.verified"), value: counts.verified || 0, color: "bg-yellow-100" },
          { label: t("status.cleaned"), value: counts.cleaned || 0, color: "bg-green-100" }
        ].map((c) => (
          <div key={c.label} className={`${c.color} p-4 rounded-lg`}>
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b font-semibold">{t("dashboard.header")}</div>
        {loading ? (
          <div className="p-4 text-gray-500">{t("dashboard.loading")}</div>
        ) : reports.length === 0 ? (
          <div className="p-4 text-gray-500">{t("dashboard.noReports")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">{t("dashboard.columns.id")}</th>
                <th className="p-3">{t("dashboard.columns.status")}</th>
                <th className="p-3">{t("dashboard.columns.severity")}</th>
                <th className="p-3">{t("dashboard.columns.description")}</th>
                <th className="p-3">{t("dashboard.columns.coords")}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-xs">{r.id.slice(0, 8)}</td>
                  <td className="p-3">{t(`status.${r.status}`)}</td>
                  <td className="p-3">{r.severity ? t(`report.${r.severity}`) : ""}</td>
                  <td className="p-3">{r.description}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
