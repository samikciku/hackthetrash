"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STATUS_COLORS: Record<string, string> = {
  reported: "#DC2626",
  verified: "#F59E0B",
  cleaning: "#3B82F6",
  cleaned:  "#10B981",
  rejected: "#6B7280"
};

type Report = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  description?: string;
  photoUrls?: string[];
  photo_urls?: string[];
  createdAt?: string;
  created_at?: string;
};

type Card = {
  id: string;
  url: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
  createdAt?: string;
};

const fullPhotoUrl = (u: string) => (u.startsWith("http") ? u : `${API_URL}${u}`);

export default function LatestPictures({ limit = 8 }: { limit?: number }) {
  const { t } = useI18n();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/reports`);
        if (!res.ok) throw new Error("api");
        const data = await res.json();
        const reports: Report[] = data.reports ?? [];
        const expanded: Card[] = [];
        for (const r of reports) {
          const photos = r.photoUrls ?? r.photo_urls ?? [];
          for (const u of photos) {
            expanded.push({
              id: r.id,
              url: fullPhotoUrl(u),
              status: r.status,
              description: r.description ?? "",
              lat: r.latitude,
              lng: r.longitude,
              createdAt: r.createdAt ?? r.created_at
            });
            if (expanded.length >= limit) break;
          }
          if (expanded.length >= limit) break;
        }
        if (alive) setCards(expanded);
      } catch {
        if (alive) setCards([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 60000); // refresh once a minute
    return () => { alive = false; clearInterval(timer); };
  }, [limit]);

  return (
    <section className="bg-white border rounded-2xl shadow-sm p-5 my-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">📷 {t("latestPictures.title")}</h2>
          <p className="text-sm text-gray-500">{t("latestPictures.subtitle")}</p>
        </div>
        <Link href="/map" className="text-sm text-primary font-semibold hover:underline">
          {t("latestPictures.viewAll")} →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{t("latestPictures.noPhotos")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map((c, i) => (
            <Link
              key={`${c.id}-${i}`}
              href={`/map?lat=${c.lat}&lng=${c.lng}&id=${c.id}`}
              className="relative group aspect-square overflow-hidden rounded-lg block border"
              title={c.description || t("latestPictures.viewOnMap")}
            >
              <img
                src={c.url}
                alt={c.description || "trash"}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* status dot */}
              <span
                className="absolute top-2 left-2 inline-block w-3 h-3 rounded-full ring-2 ring-white"
                style={{ background: STATUS_COLORS[c.status] ?? "#999" }}
              />
              {/* gradient + caption on hover */}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                <span className="block text-[11px] text-white font-semibold capitalize">
                  {t(`status.${c.status}`)}
                </span>
                {c.description && (
                  <span className="block text-[11px] text-white/90 line-clamp-1">
                    {c.description}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
