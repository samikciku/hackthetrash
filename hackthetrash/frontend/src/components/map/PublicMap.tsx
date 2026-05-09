"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

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
  cleaned: "#10B981"
};

type Report = {
  id: string;
  latitude: number;
  longitude: number;
  status: keyof typeof STATUS_COLORS;
  description?: string;
  tags?: string[];
  severity?: string;
  photoUrls?: string[];
  createdAt?: string;
};

export default function PublicMap() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/reports`)
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {
        // Fallback demo data if backend unavailable
        setReports([
          { id: "demo1", latitude: 45.4642, longitude: 9.19, status: "reported",
            description: "Demo: pile of plastic", severity: "medium", tags: ["Plastic"] },
          { id: "demo2", latitude: 45.47, longitude: 9.2, status: "cleaned",
            description: "Demo: cleaned construction debris", severity: "large", tags: ["Construction"] }
        ]);
      });
  }, []);

  return (
    <MapContainer center={[45.4642, 9.19]} zoom={12} className="h-full w-full">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={colorIcon(STATUS_COLORS[r.status] ?? "#999")}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold capitalize" style={{ color: STATUS_COLORS[r.status] }}>
                ● {r.status}
              </div>
              {r.description && <div className="mt-1">{r.description}</div>}
              {r.tags && <div className="text-xs text-gray-500 mt-1">🏷️ {r.tags.join(", ")}</div>}
              {r.severity && <div className="text-xs">📏 {r.severity}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
