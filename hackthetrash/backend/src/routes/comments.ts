// Public read + signed-in OR anonymous write of comments on a report.
// Mounted at /api/reports — handlers operate on /:id/comments.
import { Router } from "express";
import { Comments } from "../models/Comment";
import { Users } from "../services/users";
import { optionalAuth, requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/reports/:id/comments — public
router.get("/:id/comments", async (req, res) => {
  try {
    const list = await Comments.listForReport(req.params.id);
    res.json({ comments: list });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reports/:id/comments
// Body: { text, anonymous?, authorName? }
// Logged-in users get attribution; anonymous = no user_id link.
router.post("/:id/comments", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { text, anonymous, authorName } = req.body || {};
    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }
    if (text.length > 1000) {
      return res.status(400).json({ error: "text must be 1000 characters or less" });
    }
    const userId = anonymous || !req.auth ? null : req.auth.sub;
    let displayName: string | null = null;
    if (userId) {
      const u = await Users.findById(userId);
      displayName = u?.name || u?.email.split("@")[0] || null;
    } else if (authorName && typeof authorName === "string") {
      displayName = authorName.trim().slice(0, 60) || null;
    }
    const c = await Comments.create({
      reportId: req.params.id,
      userId,
      authorName: displayName,
      text: text.trim()
    });
    res.status(201).json(c);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/reports/:id/comments/:commentId — moderator+
router.delete("/:id/comments/:commentId",
  requireAuth,
  requireRole("admin", "moderator"),
  async (req, res) => {
    try {
      const ok = await Comments.remove(req.params.commentId);
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
