import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { Users, Role } from "../services/users";

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me";
// `jsonwebtoken` v9 narrows expiresIn to `number | StringValue`, so we cast
// here once rather than scattering casts at every call site.
const JWT_EXPIRES = (process.env.JWT_EXPIRES || "12h") as SignOptions["expiresIn"];

export interface AuthPayload {
  sub: string;       // user id
  role: Role;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export function signToken(payload: Omit<AuthPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization header" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  // Verify user still exists and role hasn't been revoked
  const user = await Users.findById(payload.sub);
  if (!user) return res.status(401).json({ error: "Account no longer exists" });
  if (user.role !== payload.role) return res.status(401).json({ error: "Role changed, please re-login" });

  req.auth = payload;
  next();
};

/**
 * Soft auth: populates req.auth if a valid token is present, but does not
 * reject anonymous requests. Used by public endpoints (comments, flags,
 * reports) where signed-in users get attribution but anonymous reads/writes
 * are still allowed.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  const payload = verifyToken(token);
  if (!payload) return next();
  const user = await Users.findById(payload.sub);
  if (user && user.role === payload.role) req.auth = payload;
  next();
};

export const requireRole = (...allowed: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    if (!allowed.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};

// ----------------------------------------------------------------------------
// Brute-force protection: simple in-memory rate limiter for /auth/login
// Sliding window per IP. For prod use redis or express-rate-limit.
// ----------------------------------------------------------------------------
const ATTEMPTS = new Map<string, { count: number; firstAt: number; lockedUntil?: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function clientIpFromRequest(req: Request): string {
  const v0 = req.headers["x-vercel-forwarded-for"];
  const v0raw = Array.isArray(v0) ? v0[0] : v0;
  const v0first = typeof v0raw === "string" ? v0raw.split(",")[0]?.trim() : "";
  if (v0first) return v0first;
  const xf = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xf) ? xf[0] : xf;
  const first = typeof raw === "string" ? raw.split(",")[0]?.trim() : "";
  return (first || (req.ip as string | undefined) || "unknown").toString();
}

/** First client IP from Fetch / Web `Headers` (App Router). */
export function clientIpFromWebHeaders(h: Headers): string {
  const v0 = h.get("x-vercel-forwarded-for") || h.get("X-Vercel-Forwarded-For");
  const v0first = v0?.split(",")[0]?.trim();
  if (v0first) return v0first;
  const xf = h.get("x-forwarded-for") || h.get("X-Forwarded-For");
  const first = xf?.split(",")[0]?.trim();
  if (first) return first;
  const realIp = h.get("x-real-ip") || h.get("X-Real-IP");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function rateLimitLoginByIp(ip: string): { ok: true } | { ok: false; waitSec: number } {
  const now = Date.now();
  const rec = ATTEMPTS.get(ip);

  if (rec?.lockedUntil && rec.lockedUntil > now) {
    return { ok: false, waitSec: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    ATTEMPTS.set(ip, { count: 0, firstAt: now });
  }
  return { ok: true };
}

export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const ip = clientIpFromRequest(req);
  const lim = rateLimitLoginByIp(ip);
  if (!lim.ok) {
    return res.status(429).json({ error: `Too many attempts. Try again in ${lim.waitSec}s.` });
  }
  next();
}

export function noteFailedLoginByIp(ip: string) {
  const now = Date.now();
  const rec = ATTEMPTS.get(ip) ?? { count: 0, firstAt: now };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_MS;
    rec.count = 0;
    rec.firstAt = now;
  }
  ATTEMPTS.set(ip, rec);
}

export function noteFailedLogin(req: Request) {
  noteFailedLoginByIp(clientIpFromRequest(req));
}

export function clearLoginAttemptsByIp(ip: string) {
  ATTEMPTS.delete(ip);
}

export function clearLoginAttempts(req: Request) {
  clearLoginAttemptsByIp(clientIpFromRequest(req));
}
