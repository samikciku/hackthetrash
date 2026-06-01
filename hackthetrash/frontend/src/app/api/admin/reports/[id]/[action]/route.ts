import { NextRequest, NextResponse } from "next/server";
import {
  authenticateBearerFromHeader,
  authHasAnyRole
} from "../../../../../../../../backend/src/middleware/auth";
import { applyAdminReportDecision } from "../../../../../../../../backend/src/services/adminReportDecision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ACTION_TO_STATUS: Record<string, "verified" | "rejected" | "cleaning" | "cleaned"> = {
  approve: "verified",
  reject: "rejected",
  cleaning: "cleaning",
  cleaned: "cleaned"
};

export async function PATCH(
  request: NextRequest,
  ctx: { params: { id: string; action: string } }
) {
  const auth = await authenticateBearerFromHeader(
    request.headers.get("authorization") ?? undefined,
    request.headers.get("cookie")
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!authHasAnyRole(auth.auth, "admin", "moderator", "authority")) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id, action } = ctx.params;
  const status = ACTION_TO_STATUS[action];
  if (!status) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let body: { note?: string } = {};
  try {
    body = (await request.json().catch(() => ({}))) as { note?: string };
  } catch {
    body = {};
  }

  const note = body.note || `Set to ${status} by ${auth.auth.email}`;
  const out = await applyAdminReportDecision({
    id,
    status,
    note,
    updatedBy: auth.auth.sub
  });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: out.status });
  }
  return NextResponse.json(out.report);
}
