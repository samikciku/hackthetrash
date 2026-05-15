import { Request, Response } from "express";
import path from "path";
import { ReportRepo } from "../models/ReportRepo";
import { autoModerate } from "../ai/moderation";
import { notifyStatusChange } from "../services/push";
import { evaluateCountBadges } from "../models/Badge";
import { statsForUser } from "../services/profileStats";
import { sendStatusEmail } from "../services/email";
import { AuthRequest } from "../middleware/auth";

const USE_DB = !!process.env.DATABASE_URL;

// In-memory fallback (used when DATABASE_URL not set, e.g. quick local demo).
import { reportsDB, Report } from "../models/Report";
import { v4 as uuid } from "uuid";

export const listReports = async (_req: Request, res: Response) => {
  try {
    if (USE_DB) {
      const rows = await ReportRepo.list();
      return res.json({ reports: rows });
    }
    res.json({ reports: reportsDB });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    if (USE_DB) {
      const r = await ReportRepo.findById(req.params.id);
      if (!r) return res.status(404).json({ error: "Not found" });
      return res.json(r);
    }
    const r = reportsDB.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const { latitude, longitude, severity, description, anonymous, takenAt } = req.body;
    let tags: string[] = [];
    try { tags = JSON.parse(req.body.tags || "[]"); } catch {}

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "latitude & longitude required" });
    }

    const isAnonymous = anonymous === "true" || !req.auth;
    const userId = isAnonymous ? null : req.auth?.sub ?? null;

    // Run AI moderation on uploaded images
    const imagePaths = files.map((f) => path.join(__dirname, "../../uploads", f.filename));
    const ai = await autoModerate(imagePaths);
    console.log(`[AI] best=${ai.best.label} score=${ai.best.score} -> ${ai.recommendation}`);

    let createdId: string;
    let response: any;

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
      const photoUrls = files.map((f) => `/api/uploads/${f.filename}`);
      await ReportRepo.addPhotos(created.id, photoUrls);

      // Auto-status from AI
      if (ai.recommendation === "auto_verify") {
        await ReportRepo.updateStatus(created.id, "verified", "AI auto-verified");
      } else if (ai.recommendation === "auto_reject") {
        await ReportRepo.updateStatus(created.id, "rejected", "AI auto-rejected");
      }
      createdId = created.id;
      response = { ...created, photo_urls: photoUrls, ai };
    } else {
      const report: Report = {
        id: uuid(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        severity: severity || "medium",
        description: description || "",
        tags,
        status: ai.recommendation === "auto_verify" ? "verified"
              : ai.recommendation === "auto_reject" ? "rejected"
              : "reported",
        anonymous: isAnonymous,
        photoUrls: files.map((f) => `/api/uploads/${f.filename}`),
        createdAt: new Date().toISOString(),
        takenAt: typeof takenAt === "string" && !isNaN(Date.parse(takenAt)) ? takenAt : undefined,
        userId: userId ?? undefined
      };
      reportsDB.unshift(report);
      createdId = report.id;
      response = { ...report, ai };
    }

    // Phase 2: award count + state badges to attributed (non-anonymous) reports
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

    return res.status(201).json(response);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!["reported", "verified", "cleaning", "cleaned", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (USE_DB) {
      await ReportRepo.updateStatus(req.params.id, status);
      const r = await ReportRepo.findById(req.params.id);
      if (r) {
        notifyStatusChange({ id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude }).catch(() => {});
        sendStatusEmail({ id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude }).catch(() => {});
        if (r.user_id) {
          const stats = await statsForUser(r.user_id);
          evaluateCountBadges(r.user_id, stats.totalReports, {
            hasVerified: stats.hasVerified, hasCleaned: stats.hasCleaned
          }).catch(() => {});
        }
      }
      return res.json(r);
    }
    const r = reportsDB.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    r.status = status;
    notifyStatusChange({ id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude }).catch(() => {});
    sendStatusEmail({ id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude }).catch(() => {});
    if (r.userId) {
      const stats = await statsForUser(r.userId);
      evaluateCountBadges(r.userId, stats.totalReports, {
        hasVerified: stats.hasVerified, hasCleaned: stats.hasCleaned
      }).catch(() => {});
    }
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
