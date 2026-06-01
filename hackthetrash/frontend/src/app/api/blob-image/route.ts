import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy read for Vercel Blob URLs (especially **private** stores).
 * Private blob URLs are not readable from `<img src>` directly; the browser calls this route instead.
 * Requires `@vercel/blob` >= 2.3 (private storage + `get()`).
 */
export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get("u");
  if (!u) {
    return NextResponse.json({ error: "Missing query parameter u (blob URL)" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith(".blob.vercel-storage.com") && host !== "blob.vercel-storage.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN is not configured" }, { status: 503 });
  }

  const access = u.includes(".private.blob.vercel-storage.com") ? "private" : "public";

  try {
    const result = await get(u, { access, token });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ct = result.blob.contentType || "application/octet-stream";

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (e: unknown) {
    console.error("[api/blob-image]", e);
    const msg = e instanceof Error ? e.message : "blob read failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
