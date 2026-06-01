import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerFromHeader } from "../../../../../../../../backend/src/middleware/auth";
import { Users, Role } from "../../../../../../../../backend/src/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_ROLES: Role[] = ["citizen", "moderator", "authority", "admin"];

export async function PATCH(
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
  try {
    const body = (await request.json()) as { role?: Role };
    const { role } = body;
    if (!VALID_ROLES.includes(role!)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }
    if (id === auth.auth.sub && role !== "admin") {
      return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 });
    }
    const ok = await Users.setRole(id, role!);
    if (!ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
