// Public sign-up + token-based unsubscribe endpoint.
import { Router } from "express";
import { EmailSubs } from "../models/EmailSubscription";
import { optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/email-subscriptions
// Body: { email, region? }
router.post("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { email, region } = req.body || {};
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    const sub = await EmailSubs.upsert({
      email,
      userId: req.auth?.sub ?? null,
      region: region ? String(region) : null
    });
    res.status(201).json({
      ok: true,
      email: sub.email,
      unsubscribe_url: `/api/email-subscriptions/unsubscribe/${sub.unsubscribe_token}`
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/email-subscriptions/unsubscribe/:token — link from emails
router.get("/unsubscribe/:token", async (req, res) => {
  try {
    const sub = await EmailSubs.findByToken(req.params.token);
    if (!sub) return res.status(404).type("text/plain").send("Subscription not found.");
    await EmailSubs.remove(sub.id);
    res.type("text/plain").send(`Unsubscribed ${sub.email}.`);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
