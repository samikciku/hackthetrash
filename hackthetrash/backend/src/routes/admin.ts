import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { ReportRepo } from "../models/ReportRepo";
import { reportsDB } from "../models/Report";
import { notifyStatusChange } from "../services/push";
import { Flags } from "../models/Flag";
import { sendStatusEmail } from "../services/email";
import { evaluateCountBadges } from "../models/Badge";
import { statsForUser } from "../services/profileStats";
import adminUsersRouter from "./admin-users";

const router = Router();
const USE_DB = !!process.env.DATABASE_URL;

// All admin endpoints require auth + admin/moderator role
router.use(requireAuth, requireRole("admin", "moderator", "authority"));

// Sub-router: user management is admin-only (stricter check is inside)
router.use("/users", adminUsersRouter);

// GET /api/admin/reports?status=reported (full data, including AI score, photos)
router.get("/reports", async (req, res) => {
  try {
    const status = (req.query.status as string | undefined) || undefined;
    if (USE_DB) {
      const statusParam = status?.trim() || undefined;
      const rows = await ReportRepo.listForAdmin({ status: statusParam });
      return res.json({ reports: rows });
    }
    const filtered = status ? reportsDB.filter((r) => r.status === status) : reportsDB;
    res.json({ reports: filtered });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/reports/:id/approve   (sets status = verified)
// PATCH /api/admin/reports/:id/reject    (sets status = rejected)
// PATCH /api/admin/reports/:id/cleaning  (sets status = cleaning)
// PATCH /api/admin/reports/:id/cleaned   (sets status = cleaned)
const applyDecision = async (
  req: AuthRequest,
  res: any,
  status: "verified" | "rejected" | "cleaning" | "cleaned"
) => {
  try {
    const id = req.params.id;
    const note = (req.body && req.body.note) || `Set to ${status} by ${req.auth?.email}`;

    if (USE_DB) {
      await ReportRepo.updateStatus(id, status, note, req.auth?.sub);
      const r = await ReportRepo.findById(id);
      if (!r) return res.status(404).json({ error: "Not found" });
      notifyStatusChange({
        id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude
      }).catch(() => {});
      sendStatusEmail({
        id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude
      }).catch(() => {});
      if (r.user_id) {
        const stats = await statsForUser(r.user_id);
        evaluateCountBadges(r.user_id, stats.totalReports, {
          hasVerified: stats.hasVerified, hasCleaned: stats.hasCleaned
        }).catch(() => {});
      }
      return res.json(r);
    }

    const r = reportsDB.find((x) => x.id === id);
    if (!r) return res.status(404).json({ error: "Not found" });
    r.status = status;
    notifyStatusChange({
      id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude
    }).catch(() => {});
    sendStatusEmail({
      id: r.id, status: r.status, latitude: r.latitude, longitude: r.longitude
    }).catch(() => {});
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

router.patch("/reports/:id/approve",  (req, res) => applyDecision(req, res, "verified"));
router.patch("/reports/:id/reject",   (req, res) => applyDecision(req, res, "rejected"));
router.patch("/reports/:id/cleaning", (req, res) => applyDecision(req, res, "cleaning"));
router.patch("/reports/:id/cleaned",  (req, res) => applyDecision(req, res, "cleaned"));

// GET /api/admin/stats - quick counts for the dashboard cards
router.get("/stats", async (_req, res) => {
  try {
    const all = USE_DB ? await ReportRepo.list() : reportsDB;
    const counts = all.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    const openFlags = (await Flags.listAll({ resolved: false })).length;
    res.json({ total: all.length, byStatus: counts, openFlags });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/flags?resolved=false (default: open flags)
router.get("/flags", async (req, res) => {
  try {
    const param = req.query.resolved as string | undefined;
    const resolved = param === "true" ? true : param === "false" ? false : undefined;
    const list = await Flags.listAll({ resolved });
    res.json({ flags: list });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/flags/:id/resolve
router.patch("/flags/:id/resolve", async (req, res) => {
  try {
    const ok = await Flags.resolve(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
