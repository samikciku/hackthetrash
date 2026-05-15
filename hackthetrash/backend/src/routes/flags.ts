// Citizens flag reports as spam / duplicate / inaccurate / offensive.
// Admins/moderators see and resolve flags.
// Mounted at /api/reports — handlers operate on /:id/flags.
import { Router } from "express";
import { Flags, FLAG_REASONS, FlagReason } from "../models/Flag";
import { optionalAuth, requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/reports/:id/flags — public (anonymous flagging is allowed)
router.post("/:id/flags", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { reason, note } = req.body || {};
    if (!FLAG_REASONS.includes(reason)) {
      return res.status(400).json({ error: `reason must be one of ${FLAG_REASONS.join(", ")}` });
    }
    if (note && typeof note === "string" && note.length > 500) {
      return res.status(400).json({ error: "note must be 500 characters or less" });
    }
    const f = await Flags.create({
      reportId: req.params.id,
      userId: req.auth?.sub ?? null,
      reason: reason as FlagReason,
      note: note ? String(note).trim() : undefined
    });
    res.status(201).json(f);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/:id/flags — admin/moderator only
router.get("/:id/flags",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    try {
      const list = await Flags.listForReport(req.params.id);
      res.json({ flags: list });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
