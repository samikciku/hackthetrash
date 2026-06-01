import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerFromHeader } from "../../../../../../../backend/src/middleware/auth";
import { Users } from "../../../../../../../backend/src/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function DELETE(
  request: NextRequest,
  ctx: { params: { id: string } }
) {
  const auth = await authenticateBearerFromHeader(request.headers.get("authorization") ?? undefined);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = ctx.params;
  if (id === auth.auth.sub) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    const ok = await Users.remove(id);
    if (!ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
