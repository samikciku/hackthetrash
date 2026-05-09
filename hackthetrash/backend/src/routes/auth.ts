import { Router } from "express";
import { Users } from "../services/users";
import {
  signToken,
  rateLimitLogin,
  noteFailedLogin,
  clearLoginAttempts,
  requireAuth,
  AuthRequest
} from "../middleware/auth";

const router = Router();

// POST /api/auth/login
router.post("/login", rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      noteFailedLogin(req);
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await Users.findByEmail(String(email));
    if (!user) {
      noteFailedLogin(req);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = await Users.verify(String(password), user.password_hash);
    if (!ok) {
      noteFailedLogin(req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    clearLoginAttempts(req);
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, region: user.region }
    });
  } catch (e: any) {
    console.error("[auth.login]", e);
    res.status(500).json({ error: e.message || "login failed" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
  const u = await Users.findById(req.auth.sub);
  if (!u) return res.status(404).json({ error: "Not found" });
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role, region: u.region });
});

// POST /api/auth/logout (no-op for stateless JWT, kept for symmetry)
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

// PATCH /api/auth/password - change current user's password
router.patch("/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "newPassword must be at least 8 characters" });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "newPassword must differ from currentPassword" });
    }
    const u = await Users.findById(req.auth.sub);
    if (!u) return res.status(404).json({ error: "Account not found" });

    const ok = await Users.verify(String(currentPassword), u.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const updated = await Users.updatePassword(u.id, String(newPassword));
    if (!updated) return res.status(500).json({ error: "Could not update password" });

    res.json({ ok: true });
  } catch (e: any) {
    console.error("[auth.password]", e);
    res.status(500).json({ error: e.message || "Password change failed" });
  }
});

export default router;
