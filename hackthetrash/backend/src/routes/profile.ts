// Public-ish profile endpoint: returns the public bits of a user, plus their
// badges and a small slice of recent reports.
//
// GET  /api/profile/me            (auth required)
// GET  /api/profile/:id           (public — only public fields)
// PATCH /api/profile/me           (auth — update display_name / bio)
import { Router } from "express";
import { Users } from "../services/users";
import { Badges, BADGE_CATALOG } from "../models/Badge";
import { statsForUser } from "../services/profileStats";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const publicView = async (id: string) => {
  const u = await Users.findById(id);
  if (!u) return null;
  const stats = await statsForUser(id);
  const badges = await Badges.listForUser(id);
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    region: u.region,
    badges: badges.map((b) => {
      const def = BADGE_CATALOG.find((d) => d.code === b.code);
      return { code: b.code, awarded_at: b.awarded_at, title: def?.title, icon: def?.icon };
    }),
    stats: {
      totalReports: stats.totalReports,
      byStatus: stats.byStatus,
      hasVerified: stats.hasVerified,
      hasCleaned: stats.hasCleaned
    }
  };
};

// GET /api/profile/badges — catalog of all known badges (for UI rendering)
router.get("/badges", (_req, res) => {
  res.json({ badges: BADGE_CATALOG });
});

// GET /api/profile/me — full profile of the signed-in user (incl. recent reports)
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
  const profile = await publicView(req.auth.sub);
  if (!profile) return res.status(404).json({ error: "Account not found" });
  const stats = await statsForUser(req.auth.sub);
  const u = await Users.findById(req.auth.sub);
  res.json({ ...profile, email: u?.email, recent: stats.recent });
});

// GET /api/profile/:id — public view of any user
router.get("/:id", async (req, res) => {
  try {
    const profile = await publicView(req.params.id);
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
