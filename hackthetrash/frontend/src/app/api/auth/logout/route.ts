import { NextResponse } from "next/server";
import { buildClearAuthCookieHeader } from "../../../../../../backend/src/middleware/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clears HttpOnly auth cookie (mirrors Express POST /api/auth/logout). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildClearAuthCookieHeader());
  return res;
}
