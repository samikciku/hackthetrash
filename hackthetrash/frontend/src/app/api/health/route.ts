import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lightweight health endpoint on the App Router so `/api/health` works even if
 * the Pages `api/[[...slug]]` + Express bridge misbehaves for this path.
 * Keep checks in sync with `backend/src/app.ts` healthPayload.
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy" as const,
    checks: {
      databaseUrl: !!(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()),
      jwtSecret: !!process.env.JWT_SECRET,
      blobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      vercel: process.env.VERCEL === "1"
    }
  });
}
