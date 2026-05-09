"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const colorIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [18, 18]
  });

const STATUS_COLORS: Record<string, string> = {
  reported: "#DC2626",
  verified: "#F59E0B",
  cleaning: "#3B82F6",
  cleaned: "#10B981",
  rejected: "#6B7280"
};

type Report = {
  id: string;
  latitude: number;
  longitude: number;
  status: keyof typeof STATUS_COLORS | string;
  description?: string;
  tags?: string[];
  severity?: string;
  // Backend may return either of these depending on storage backend
  photoUrls?: string[];
  photo_urls?: string[];
  createdAt?: string;
  created_at?: string;
};

// Helper: prepend API base to relative photo URLs
const fullPhotoUrl = (u: string) => (u.startsWith("http") ? u : `${API_URL}${u}`);

// Helper: pick photo URLs from either field name
const getPhotos = (r: Report): string[] => r.photoUrls ?? r.photo_urls ?? [];

// Helper: pick createdAt from either field name
const getCreated = (r: Report): string | undefined => r.createdAt ?? r.created_at;

// Component to programmatically center the map (e.g. on a freshly submitted report)
function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1.5 });
  }, [coords, map]);
  return null;
}

export default function PublicMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();
  const { t } = useI18n();

  // /map?lat=...&lng=...&id=... will fly to that point (used after submission)
  const flyLat = params.get("lat");
  const flyLng = params.get("lng");
  const flyTarget: [number, number] | null =
    flyLat && flyLng ? [Number(flyLat), Number(flyLng)] : null;
  const highlightId = params.get("id");

  const load = () => {
    fetch(`${API_URL}/api/reports`)
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {
        // Fallback demo data if backend unavailable
        setReports([
          { id: "demo1", latitude: 42.6629, longitude: 21.1655, status: "reported",
            description: "Demo: plastic bottles near Skanderbeg Square", severity: "medium", tags: ["Plastic"] },
          { id: "demo2", latitude: 42.6699, longitude: 21.1782, status: "cleaned",
            description: "Demo: cleaned construction debris in Sunny Hill", severity: "large", tags: ["Construction"] }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Poll every 30s so newly submitted reports appear on the OSM layer automatically
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const center: [number, number] = flyTarget ?? [42.6629, 21.1655]; // Pristina city centre

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={flyTarget ? 16 : 12} className="h-full w-full">
        {/* OpenStreetMap raster tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyTo coords={flyTarget} />

        {reports.map((r) => {
          const photos = getPhotos(r);
          const created = getCreated(r);
          const isHighlight = r.id === highlightId;

          return (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={colorIcon(STATUS_COLORS[r.status] ?? "#999")}
            >
              <Popup>
                <div style={{ minWidth: 220, maxWidth: 280 }}>
                  {/* Photo gallery */}
                  {photos.length > 0 && (
                    <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 6 }}>
                      {photos.map((url, i) => (
                        <a key={i} href={fullPhotoUrl(url)} target="_blank" rel="noreferrer">
                          <img
                            src={fullPhotoUrl(url)}
                            alt="trash"
                            style={{ height: 90, borderRadius: 6, objectFit: "cover" }}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ fontWeight: 700, color: STATUS_COLORS[r.status] ?? "#999" }}>
                    ● {t(`status.${r.status}`)}{" "}
                    {isHighlight && <span style={{ fontSize: 11, color: "#16A34A" }}>{t("map.yourReport")}</span>}
                  </div>

                  {r.description && <div style={{ marginTop: 4 }}>{r.description}</div>}

                  {r.tags && r.tags.length > 0 && (
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                      🏷️ {r.tags.join(", ")}
                    </div>
                  )}

                  {r.severity && (
                    <div style={{ fontSize: 12, color: "#6B7280" }}>📏 {t(`report.${r.severity}`)}</div>
                  )}

                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                    📍 {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                    {created && <> · {new Date(created).toLocaleString()}</>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating refresh button */}
      <button
        onClick={load}
        className="absolute top-3 right-3 z-[1000] bg-white shadow rounded-full px-3 py-2 text-sm font-medium border hover:bg-gray-50"
        title={t("map.refresh")}
      >
        {loading ? t("common.loading") : `🔄 ${t("map.refresh")}`}
      </button>

      {/* Floating legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur shadow rounded-lg p-3 text-xs space-y-1 border">
        <div className="font-semibold mb-1">{t("map.legend")}</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#DC2626" }} /> {t("status.reported")}</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} /> {t("status.verified")}</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#3B82F6" }} /> {t("status.cleaning")}</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#10B981" }} /> {t("status.cleaned")}</div>
      </div>
    </div>
  );
}
