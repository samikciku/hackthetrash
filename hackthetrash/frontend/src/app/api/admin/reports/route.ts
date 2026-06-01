import { NextRequest, NextResponse } from "next/server";
import {
  authenticateBearerFromHeader,
  authHasAnyRole
} from "../../../../../../backend/src/middleware/auth";
import { ReportRepo } from "../../../../../../backend/src/models/ReportRepo";
import { reportsDB } from "../../../../../../backend/src/models/Report";

const USE_DB = !!process.env.DATABASE_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
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

  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    if (USE_DB) {
      const statusParam = status?.trim() || undefined;
      const rows = await ReportRepo.listForAdmin({ status: statusParam });
      return NextResponse.json({ reports: rows });
    }
    const filtered = status ? reportsDB.filter((r) => r.status === status) : reportsDB;
    return NextResponse.json({ reports: filtered });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "list failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
