"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

interface Props {
  /** maximum number of photos to load into the carousel */
  limit?: number;
  /** auto-advance interval in ms (set to 0 to disable) */
  intervalMs?: number;
  /** only include reports submitted within the last N days (0 = no filter) */
  withinDays?: number;
}

export default function LatestPictures({
  limit = 16,
  intervalMs = 4000,
  withinDays = 30
}: Props) {
  const { t } = useI18n();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load latest reports + flatten into individual photo cards
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/reports`);
        if (!res.ok) throw new Error("api");
        const data = await res.json();
        const reports: Report[] = data.reports ?? [];

        // Optional time-window filter: only photos uploaded within the
        // last `withinDays` days. Reports without a createdAt timestamp
        // are excluded when the filter is active so the carousel stays
        // strictly time-bounded.
        const cutoff = withinDays > 0 ? Date.now() - withinDays * 86_400_000 : 0;
        const recent = withinDays > 0
          ? reports.filter((r) => {
              const ts = r.createdAt ?? r.created_at;
              if (!ts) return false;
              const t = Date.parse(ts);
              return Number.isFinite(t) && t >= cutoff;
            })
          : reports;

        // Already sorted newest-first by the backend, but be defensive
        // in case future code changes that.
        recent.sort((a, b) => {
          const at = Date.parse(a.createdAt ?? a.created_at ?? "") || 0;
          const bt = Date.parse(b.createdAt ?? b.created_at ?? "") || 0;
          return bt - at;
        });

        const expanded: Card[] = [];
        for (const r of recent) {
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
        if (alive) {
          setCards(expanded);
          setActive((a) => (expanded.length === 0 ? 0 : a % expanded.length));
        }
      } catch {
        if (alive) setCards([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const refresh = setInterval(load, 60000); // refresh every minute
    return () => { alive = false; clearInterval(refresh); };
  }, [limit, withinDays]);

  // Auto-rotate
  useEffect(() => {
    if (intervalMs <= 0 || cards.length <= 1 || paused) return;
    tickRef.current = setInterval(() => {
      setActive((a) => (a + 1) % cards.length);
    }, intervalMs);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [intervalMs, cards.length, paused]);

  const go = useCallback((delta: number) => {
    setCards((c) => c); // no-op to satisfy linter
    setActive((a) => {
      if (cards.length === 0) return 0;
      return (a + delta + cards.length) % cards.length;
    });
  }, [cards.length]);

  const goTo = (i: number) => setActive(i);

  // Keyboard arrows when section has focus
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  const current = cards[active];

  return (
    <section
      className="bg-white border rounded-2xl shadow-sm p-5 my-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={onKey}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={t("latestPictures.title")}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">📷 {t("latestPictures.title")}</h2>
          <p className="text-sm text-gray-500">
            {withinDays > 0
              ? t("latestPictures.subtitle", { days: withinDays })
              : t("latestPictures.subtitle")}
          </p>
        </div>
        <Link href="/map" className="text-sm text-primary font-semibold hover:underline">
          {t("latestPictures.viewAll")} →
        </Link>
      </div>

      {loading ? (
        <div className="aspect-[16/9] rounded-lg bg-gray-100 animate-pulse" />
      ) : cards.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {withinDays > 0
            ? t("latestPictures.noPhotosWindow", { days: withinDays })
            : t("latestPictures.noPhotos")}
        </p>
      ) : (
        <>
          {/* Stage */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[16/9] group">
            {/* slides */}
            {cards.map((c, i) => (
              <Link
                key={`${c.id}-${i}`}
                href={`/map?lat=${c.lat}&lng=${c.lng}&id=${c.id}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
                aria-hidden={i !== active}
                aria-label={c.description || t("latestPictures.viewOnMap")}
              >
                <img
                  src={c.url}
                  alt={c.description || "trash"}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={i === active ? "eager" : "lazy"}
                />
                {/* gradient + caption */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white"
                      style={{ background: STATUS_COLORS[c.status] ?? "#999" }}
                    />
                    <span className="text-white text-xs font-semibold capitalize">
                      {t(`status.${c.status}`)}
                    </span>
                    <span className="text-white/60 text-xs ml-2">
                      {i + 1} / {cards.length}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-white text-sm sm:text-base font-medium line-clamp-2 max-w-2xl">
                      {c.description}
                    </p>
                  )}
                  <p className="text-white/70 text-xs mt-1">
                    📍 {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                    {c.createdAt && <> · {new Date(c.createdAt).toLocaleDateString()}</>}
                  </p>
                </div>
              </Link>
            ))}

            {/* prev / next arrows */}
            {cards.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); go(-1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition opacity-0 group-hover:opacity-100"
                  aria-label={t("latestPictures.prev")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); go(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition opacity-0 group-hover:opacity-100"
                  aria-label={t("latestPictures.next")}
                >
                  ›
                </button>
              </>
            )}

            {/* play / pause indicator */}
            {intervalMs > 0 && cards.length > 1 && (
              <div className="absolute top-2 right-2 z-20 bg-black/40 text-white text-[10px] px-2 py-1 rounded-full">
                {paused ? `⏸ ${t("latestPictures.paused")}` : `▶ ${t("latestPictures.auto")}`}
              </div>
            )}

            {/* progress bar */}
            {intervalMs > 0 && cards.length > 1 && !paused && (
              <div className="absolute bottom-0 left-0 right-0 h-1 z-20 bg-white/20">
                <div
                  key={active}
                  className="h-full bg-primary"
                  style={{
                    width: "0%",
                    animation: `httProgress ${intervalMs}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>

          {/* dots */}
          {cards.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
              {cards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "bg-primary w-6" : "bg-gray-300 hover:bg-gray-400 w-2"
                  }`}
                />
              ))}
            </div>
          )}

          {/* small thumbnail strip below */}
          {cards.length > 1 && (
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {cards.slice(0, 8).map((c, i) => (
                <button
                  key={`thumb-${c.id}-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition ${
                    i === active ? "border-primary" : "border-transparent hover:border-gray-300"
                  }`}
                  aria-label={`View slide ${i + 1}`}
                >
                  <img src={c.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes httProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
