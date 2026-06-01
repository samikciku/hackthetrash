import { Request, Response } from "express";
import { ReportRepo } from "../models/ReportRepo";
import { notifyStatusChange } from "../services/push";
import { evaluateCountBadges } from "../models/Badge";
import { statsForUser } from "../services/profileStats";
import { sendStatusEmail } from "../services/email";
import { AuthRequest } from "../middleware/auth";
import { createReportSubmission } from "../services/reportSubmission";
import { reportsDB, Report } from "../models/Report";

const USE_DB = !!process.env.DATABASE_URL;

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
    const result = await createReportSubmission({
      files,
      latitude,
      longitude,
      severity,
      description,
      anonymous,
      tagsJson: req.body.tags,
      takenAt,
      auth: req.auth
    });
    return res.status(result.status).json(result.body);
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
