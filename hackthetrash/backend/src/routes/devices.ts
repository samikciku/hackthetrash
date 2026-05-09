import { Router, Request, Response } from "express";

// Simple in-memory device registry. In production, persist in DB and
// associate to userId or to a region radius.
type Device = {
  token: string;
  platform: string;
  region?: string;
  registeredAt: string;
};

export const devices: Device[] = [];

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { token, platform, region } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });
  const existing = devices.find((d) => d.token === token);
  if (existing) {
    existing.platform = platform || existing.platform;
    existing.region = region || existing.region;
    return res.json({ ok: true, updated: true });
  }
  devices.push({ token, platform: platform || "unknown", region, registeredAt: new Date().toISOString() });
  console.log(`[push] registered device, total=${devices.length}`);
  res.status(201).json({ ok: true });
});

router.get("/", (_req, res) => {
  res.json({ count: devices.length });
});

export default router;
