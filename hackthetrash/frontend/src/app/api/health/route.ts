import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public health: no environment or dependency disclosure.
 * DB reachability: GET /api/health?probe=db&secret=<HEALTH_PROBE_SECRET>
 * (set HEALTH_PROBE_SECRET in the deployment environment).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const probe = url.searchParams.get("probe");
  const secret = url.searchParams.get("secret") || "";
  const expected = process.env.HEALTH_PROBE_SECRET?.trim();

  if (probe === "db") {
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { status: "degraded", databaseReachable: false, detail: "DATABASE_URL not set" },
        { status: 503 }
      );
    }
    try {
      const { query } = await import("../../../../../backend/src/db/pool");
      await Promise.race([
        query("SELECT 1 AS ok"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("database probe timeout (5s)")), 5000)
        )
      ]);
      return NextResponse.json({
        status: "healthy" as const,
        databaseReachable: true as const
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          status: "degraded" as const,
          databaseReachable: false as const,
          databaseError: msg.slice(0, 240)
        },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({ status: "healthy" as const });
}
