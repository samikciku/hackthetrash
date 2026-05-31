/**
 * Base URL for the HackTheTrash API.
 * - Leave NEXT_PUBLIC_API_URL unset (or empty) on Vercel so the browser uses same-origin `/api/*`
 *   (Express is mounted via Next.js Pages API).
 * - Server-side rendering uses VERCEL_URL when the public env is empty.
 * - Local dev defaults to the standalone Express server on port 4000.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw !== undefined && raw !== "") {
    return raw.replace(/\/$/, "");
  }
  if (typeof window === "undefined") {
    const v = process.env.VERCEL_URL;
    if (v) return `https://${v}`.replace(/\/$/, "");
    return "http://localhost:4000";
  }
  return "";
}

/** Absolute or same-origin path for a public photo URL. */
export function fullPhotoUrl(u: string): string {
  if (u.startsWith("http")) return u;
  const base = getApiBase();
  if (!base) return u.startsWith("/") ? u : `/${u}`;
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}
