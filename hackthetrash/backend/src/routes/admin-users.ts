// Admin-only user management.
// Mounted at /api/admin/users by routes/admin.ts
import { Router } from "express";
import { requireRole, AuthRequest } from "../middleware/auth";
import { Users, Role } from "../services/users";

const router = Router();

// All routes here require role=admin (stricter than the rest of /api/admin)
router.use(requireRole("admin"));

const VALID_ROLES: Role[] = ["citizen", "moderator", "authority", "admin"];

// GET /api/admin/users - list every user (no password hashes)
router.get("/", async (_req, res) => {
  try {
    const all = await Users.list();
    res.json({
      users: all.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        region: u.region
      }))
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/users - invite a new moderator/authority/admin
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { email, password, name, role, region } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }
    const desiredRole: Role = VALID_ROLES.includes(role) ? role : "moderator";

    const existing = await Users.findByEmail(String(email));
    if (existing) return res.status(409).json({ error: "A user with this email already exists" });

    const u = await Users.create({
      email: String(email),
      password: String(password),
      name: name ? String(name) : undefined,
      role: desiredRole,
      region: region ? String(region) : undefined
    });
    res.status(201).json({ id: u.id, email: u.email, name: u.name, role: u.role, region: u.region });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/users/:id/role - change a user's role
router.patch("/:id/role", async (req: AuthRequest, res) => {
  try {
    const { role } = req.body || {};
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "invalid role" });
    }
    // Prevent demoting yourself accidentally
    if (req.params.id === req.auth?.sub && role !== "admin") {
      return res.status(400).json({ error: "Cannot remove your own admin role" });
    }
    const ok = await Users.setRole(req.params.id, role);
    if (!ok) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.auth?.sub) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    const ok = await Users.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
