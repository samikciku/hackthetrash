"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded" /> }
);

const TRASH_TYPES = ["Plastic", "E-waste", "Hazardous", "Construction", "Organic", "Other"];

export default function ReportPage() {
  const { t } = useI18n();

  const [photos, setPhotos] = useState<File[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<"small" | "medium" | "large">("medium");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Could not get location")
    );
  };

  const toggleTag = (tg: string) =>
    setTags((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files).slice(0, 5));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return alert(t("report.errorMissingLocation"));
    if (photos.length === 0) return alert(t("report.errorMissingPhoto"));

    setSubmitting(true);
    try {
      const fd = new FormData();
      photos.forEach((p) => fd.append("photos", p));
      fd.append("latitude", String(coords.lat));
      fd.append("longitude", String(coords.lng));
      fd.append("tags", JSON.stringify(tags));
      fd.append("severity", severity);
      fd.append("description", description);
      fd.append("anonymous", String(anonymous));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/reports`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error("Submission failed");
      const created = await res.json();
      setSubmittedId(created?.id ?? null);
      setSuccess(true);
    } catch (err) {
      alert(t("report.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const mapHref = coords
      ? `/map?lat=${coords.lat}&lng=${coords.lng}${submittedId ? `&id=${submittedId}` : ""}`
      : "/map";
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">{t("success.title")}</h2>
        <p className="text-gray-600">{t("success.body")}</p>
        <a href={mapHref} className="mt-6 inline-block bg-primary text-white px-4 py-2 rounded">
          🗺️ {t("success.seeOnMap")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">📸 {t("report.title")}</h1>

      <div>
        <label className="block font-semibold mb-2">{t("report.photos")}</label>
        <input type="file" accept="image/*" multiple capture="environment" onChange={handleFiles}
          className="block w-full text-sm" />
        <div className="flex gap-2 mt-2 flex-wrap">
          {photos.map((p, i) => (
            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{p.name}</span>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2">📍 {t("report.location")}</label>
        <button type="button" onClick={useMyLocation}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm mb-2">
          {coords ? t("report.updateLocation") : t("report.useMyLocation")}
        </button>
        <LocationPicker coords={coords} onChange={setCoords} />
        {coords && (
          <p className="text-xs text-gray-500 mt-1">
            Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-2">🏷️ {t("report.trashType")}</label>
        <div className="flex flex-wrap gap-2">
          {TRASH_TYPES.map((tg) => (
            <button type="button" key={tg} onClick={() => toggleTag(tg)}
              className={`px-3 py-1 rounded-full text-sm border ${
                tags.includes(tg) ? "bg-primary text-white border-primary" : "bg-white"
              }`}>
              {t(`tags.${tg}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2">📏 {t("report.size")}</label>
        <div className="flex gap-2">
          {(["small", "medium", "large"] as const).map((s) => (
            <button type="button" key={s} onClick={() => setSeverity(s)}
              className={`flex-1 px-3 py-2 rounded border capitalize ${
                severity === s ? "bg-primary text-white border-primary" : "bg-white"
              }`}>
              {t(`report.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2">📝 {t("report.description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className="w-full border rounded p-2 text-sm"
          placeholder={t("report.descriptionPlaceholder")} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        {t("report.anonymous")}
      </label>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-white py-3 rounded-lg font-bold disabled:opacity-50">
        {submitting ? t("report.submitting") : t("report.submit")}
      </button>
    </form>
  );
}
