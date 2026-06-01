import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerFromHeader } from "../../../../../../backend/src/middleware/auth";
import { changePasswordForUser } from "../../../../../../backend/src/services/passwordChange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function PATCH(request: NextRequest) {
  const auth = await authenticateBearerFromHeader(
    request.headers.get("authorization") ?? undefined,
    request.headers.get("cookie")
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const out = await changePasswordForUser({
      userId: auth.auth.sub,
      currentPassword: String(body.currentPassword ?? ""),
      newPassword: String(body.newPassword ?? "")
    });
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[app/api/auth/password]", e);
    const msg = e instanceof Error ? e.message : "Password change failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
