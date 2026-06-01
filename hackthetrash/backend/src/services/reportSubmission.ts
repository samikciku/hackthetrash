/**
 * Shared "create trash report" logic for Express (multer) and Next.js App Router (FormData).
 */
import type { Express } from "express";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";
import { ReportRepo } from "../models/ReportRepo";
import { autoModerate } from "../ai/moderation";
import { evaluateCountBadges } from "../models/Badge";
import { statsForUser } from "./profileStats";
import { persistReportPhotoUrls, tempPathsForModeration } from "./reportPhotoUpload";
import { reportsDB, Report } from "../models/Report";

const USE_DB = !!process.env.DATABASE_URL;

export type SubmitReportAuth = { sub: string } | null | undefined;

export async function createReportSubmission(args: {
  files: Express.Multer.File[];
  latitude: string | undefined;
  longitude: string | undefined;
  severity?: string;
  description?: string;
  anonymous?: string;
  tagsJson?: string;
  takenAt?: string;
  auth: SubmitReportAuth;
}): Promise<{ status: number; body: unknown }> {
  const { files, latitude, longitude, severity, description, anonymous, tagsJson, takenAt, auth } = args;

  if (!files.length) {
    return {
      status: 400,
      body: {
        error:
          "No image files were received. Add at least one photo (JPG, PNG, HEIC, etc.) or check that the form field name is \"photos\"."
      }
    };
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(tagsJson || "[]");
  } catch {
    /* ignore */
  }

  if (!latitude || !longitude) {
    return { status: 400, body: { error: "latitude & longitude required" } };
  }

  const isAnonymous = anonymous === "true" || !auth;
  const userId = isAnonymous ? null : auth?.sub ?? null;

  const { paths: imagePaths, cleanup } = tempPathsForModeration(files);
  let ai;
  try {
    ai = await autoModerate(imagePaths);
    console.log(`[AI] best=${ai.best.label} score=${ai.best.score} -> ${ai.recommendation}`);
  } finally {
    cleanup();
  }

  const photoUrls = await persistReportPhotoUrls(files);

  let response: Record<string, unknown>;

  if (USE_DB) {
    const created = await ReportRepo.create({
      userId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description,
      severity,
      tags,
      anonymous: isAnonymous,
      aiScore: ai.best.score,
      aiLabel: ai.best.label
    });
    await ReportRepo.addPhotos(created.id, photoUrls);

    if (ai.recommendation === "auto_verify") {
      await ReportRepo.updateStatus(created.id, "verified", "AI auto-verified");
    } else if (ai.recommendation === "auto_reject") {
      await ReportRepo.updateStatus(created.id, "rejected", "AI auto-rejected");
    }
    response = { ...created, photo_urls: photoUrls, ai };
  } else {
    const report: Report = {
      id: uuid(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      severity: severity || "medium",
      description: description || "",
      tags,
      status:
        ai.recommendation === "auto_verify"
          ? "verified"
          : ai.recommendation === "auto_reject"
            ? "rejected"
            : "reported",
      anonymous: isAnonymous,
      photoUrls,
      createdAt: new Date().toISOString(),
      takenAt: typeof takenAt === "string" && !isNaN(Date.parse(takenAt)) ? takenAt : undefined,
      userId: userId ?? undefined
    };
    reportsDB.unshift(report);
    response = { ...report, ai };
  }

  let newlyAwarded: string[] = [];
  if (userId) {
    try {
      const stats = await statsForUser(userId);
      newlyAwarded = await evaluateCountBadges(userId, stats.totalReports, {
        hasVerified: stats.hasVerified,
        hasCleaned: stats.hasCleaned
      });
    } catch (e) {
      console.warn("[badges] failed to evaluate", e);
    }
  }
  response.badges_awarded = newlyAwarded;

  return { status: 201, body: response };
}

/** Build a Multer-shaped file from a browser File / Blob (App Router). */
export async function multerFileFromWebFile(file: File, fieldname: string): Promise<Express.Multer.File> {
  const buf = Buffer.from(await file.arrayBuffer());
  const originalname = file.name || "photo.jpg";
  const mimetype = file.type || "application/octet-stream";
  return {
    fieldname,
    originalname,
    encoding: "7bit",
    mimetype,
    size: buf.length,
    buffer: buf,
    destination: "",
    filename: "",
    path: "",
    stream: Readable.from(buf) as unknown as Express.Multer.File["stream"]
  };
}
