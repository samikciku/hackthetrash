import { Router } from "express";
import { Users } from "../services/users";
import {
  rateLimitLogin,
  requireAuth,
  AuthRequest,
  clientIpFromRequest,
  buildClearAuthCookieHeader
} from "../middleware/auth";
import { performJsonLogin } from "../services/loginService";
import { changePasswordForUser } from "../services/passwordChange";

const router = Router();

// POST /api/auth/login
router.post("/login", rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const out = await performJsonLogin(email, password, clientIpFromRequest(req));
    if (out.setCookie) res.setHeader("Set-Cookie", out.setCookie);
    return res.status(out.status).json(out.body);
  } catch (e: any) {
    console.error("[auth.login]", e);
    res.status(500).json({ error: e.message || "login failed" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    const u = await Users.findById(req.auth.sub);
    if (!u) return res.status(404).json({ error: "Not found" });
    res.json({ id: u.id, email: u.email, name: u.name, role: u.role, region: u.region });
  } catch (e: any) {
    console.error("[auth.me]", e);
    res.status(503).json({ error: e?.message || "Service unavailable" });
  }
});

// POST /api/auth/logout — clears HttpOnly session cookie
router.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", buildClearAuthCookieHeader());
  res.json({ ok: true });
});

// PATCH /api/auth/password - change current user's password
router.patch("/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    const { currentPassword, newPassword } = req.body || {};
    const out = await changePasswordForUser({
      userId: req.auth.sub,
      currentPassword: String(currentPassword ?? ""),
      newPassword: String(newPassword ?? "")
    });
    if (!out.ok) return res.status(out.status).json({ error: out.error });
    res.json({ ok: true });
  } catch (e: any) {
    console.error("[auth.password]", e);
    res.status(500).json({ error: e.message || "Password change failed" });
  }
});

export default router;
