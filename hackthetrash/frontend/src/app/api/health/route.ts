import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lightweight health endpoint on the App Router so `/api/health` works even if
 * the Pages `api/[[...slug]]` + Express bridge misbehaves for this path.
 * Keep checks in sync with `backend/src/app.ts` healthPayload.
 *
 * Optional: `GET /api/health?probe=db` runs `SELECT 1` (5s max) so you can tell
 * env-present vs actually reachable Postgres (login + reports need this).
 */
export async function GET(request: Request) {
  const checks = {
    databaseUrl: !!(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()),
    jwtSecret: !!process.env.JWT_SECRET,
    blobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    vercel: process.env.VERCEL === "1"
  };

  const probe = new URL(request.url).searchParams.get("probe");
  if (probe === "db" && checks.databaseUrl) {
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
        checks: { ...checks, databaseReachable: true as const }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({
        status: "degraded" as const,
        checks: {
          ...checks,
          databaseReachable: false as const,
          databaseError: msg.slice(0, 240)
        }
      });
    }
  }

  return NextResponse.json({
    status: "healthy" as const,
    checks
  });
}
