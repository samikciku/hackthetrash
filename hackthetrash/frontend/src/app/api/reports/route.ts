import { NextResponse } from "next/server";
import type { Express } from "express";
import { verifyToken } from "../../../../../backend/src/middleware/auth";
import {
  createReportSubmission,
  multerFileFromWebFile
} from "../../../../../backend/src/services/reportSubmission";
import { isAllowedReportImage } from "../../../../../backend/src/utils/imageUpload";
import { ReportRepo } from "../../../../../backend/src/models/ReportRepo";
import { reportsDB } from "../../../../../backend/src/models/Report";

const USE_DB = !!process.env.DATABASE_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FILE = 10 * 1024 * 1024;
const MAX_FILES = 5;

export async function GET() {
  try {
    if (USE_DB) {
      const rows = await ReportRepo.list();
      return NextResponse.json({ reports: rows });
    }
    return NextResponse.json({ reports: reportsDB });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "list failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * App Router POST /api/reports — multipart via `request.formData()` (reliable on Vercel).
 * Other `/api/reports/*` routes still go through Express on the Pages catch-all.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const payload = token ? verifyToken(token) : null;

    const form = await request.formData();

    const files: Express.Multer.File[] = [];
    const entries = form.getAll("photos");
    for (const entry of entries) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      if (entry.size > MAX_FILE) {
        return NextResponse.json(
          { error: `Each photo must be at most ${MAX_FILE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }
      if (!isAllowedReportImage({ mimetype: entry.type, originalname: entry.name })) continue;
      files.push(await multerFileFromWebFile(entry, "photos"));
      if (files.length >= MAX_FILES) break;
    }

    const result = await createReportSubmission({
      files,
      latitude: String(form.get("latitude") ?? ""),
      longitude: String(form.get("longitude") ?? ""),
      severity: String(form.get("severity") ?? ""),
      description: String(form.get("description") ?? ""),
      anonymous: String(form.get("anonymous") ?? "true"),
      tagsJson: String(form.get("tags") ?? "[]"),
      takenAt: form.get("takenAt") ? String(form.get("takenAt")) : undefined,
      auth: payload ? { sub: payload.sub } : null
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (e: unknown) {
    console.error("[app/api/reports]", e);
    const msg = e instanceof Error ? e.message : "report failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
