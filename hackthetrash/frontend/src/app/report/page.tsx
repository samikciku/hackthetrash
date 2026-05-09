"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded" /> }
);

const TRASH_TYPES = ["Plastic", "E-waste", "Hazardous", "Construction", "Organic", "Other"];

export default function ReportPage() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<"small" | "medium" | "large">("medium");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — pick on the map or tap to retry"
            : "Could not get location — pick on the map or tap to retry"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files).slice(0, 5));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return alert("Please add a location");
    if (photos.length === 0) return alert("Please add at least one photo");

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
      // Capture the new report id so we can highlight it on the OpenStreetMap layer
      setSubmittedId(created?.id ?? null);
      setSuccess(true);
    } catch (err) {
      alert("Error submitting report. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    // Build a deep link that pans the OpenStreetMap layer to the new report and highlights it
    const mapHref = coords
      ? `/map?lat=${coords.lat}&lng=${coords.lng}${submittedId ? `&id=${submittedId}` : ""}`
      : "/map";
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
        <p className="text-gray-600">
          Your report has been added to the public map. It will appear as a new pin on the
          OpenStreetMap layer.
        </p>
        <a href={mapHref} className="mt-6 inline-block bg-primary text-white px-4 py-2 rounded">
          🗺️ See it on the map
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">📸 Report Illegal Trash</h1>

      {/* Photos */}
      <div>
        <label className="block font-semibold mb-2">Photos (max 5)</label>
        <input type="file" accept="image/*" multiple capture="environment" onChange={handleFiles}
          className="block w-full text-sm" />
        <div className="flex gap-2 mt-2 flex-wrap">
          {photos.map((p, i) => (
            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{p.name}</span>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block font-semibold mb-2">📍 Location</label>
        <button type="button" onClick={useMyLocation} disabled={locating}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm mb-2 disabled:opacity-50">
          {locating ? "Locating…" : coords ? "Update my location" : "Use my location"}
        </button>
        {locationError && (
          <p className="text-xs text-red-600 mt-1 mb-1">{locationError}</p>
        )}
        <LocationPicker coords={coords} onChange={setCoords} />
        {coords && (
          <p className="text-xs text-gray-500 mt-1">
            Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block font-semibold mb-2">🏷️ Trash type</label>
        <div className="flex flex-wrap gap-2">
          {TRASH_TYPES.map((t) => (
            <button type="button" key={t} onClick={() => toggleTag(t)}
              className={`px-3 py-1 rounded-full text-sm border ${
                tags.includes(t) ? "bg-primary text-white border-primary" : "bg-white"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block font-semibold mb-2">📏 Size</label>
        <div className="flex gap-2">
          {(["small", "medium", "large"] as const).map((s) => (
            <button type="button" key={s} onClick={() => setSeverity(s)}
              className={`flex-1 px-3 py-2 rounded border capitalize ${
                severity === s ? "bg-primary text-white border-primary" : "bg-white"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-2">📝 Description (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Pile of construction debris near park entrance" />
      </div>

      {/* Anonymous */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Submit anonymously
      </label>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-white py-3 rounded-lg font-bold disabled:opacity-50">
        {submitting ? "Submitting..." : "SUBMIT REPORT"}
      </button>
    </form>
  );
}
