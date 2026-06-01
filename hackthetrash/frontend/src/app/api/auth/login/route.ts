import { NextResponse } from "next/server";
import { performJsonLogin } from "../../../../../../backend/src/services/loginService";
import { clientIpFromWebHeaders } from "../../../../../../backend/src/middleware/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * App Router handler — reads JSON with the Web Request API (reliable on Vercel).
 * Takes precedence over `pages/api/[[...slug]]` for this path.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const ip = clientIpFromWebHeaders(request.headers);
    const out = await performJsonLogin(body.email, body.password, ip);
    return NextResponse.json(out.body, { status: out.status });
  } catch (e: unknown) {
    console.error("[app/api/auth/login]", e);
    const msg = e instanceof Error ? e.message : "login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
