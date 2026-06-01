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

export type BearerAuthResult =
  | { ok: true; auth: AuthPayload }
  | { ok: false; status: number; error: string };

/**
 * JWT + DB user check for App Router and Express. Never throws; DB errors
 * become 503 so callers don't hang (unhandled async middleware → gateway 504).
 */
export async function authenticateBearerFromHeader(
  authorizationHeader: string | undefined
): Promise<BearerAuthResult> {
  try {
    const header = authorizationHeader || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return { ok: false, status: 401, error: "Missing Authorization header" };
    }
    const payload = verifyToken(token);
    if (!payload) {
      return { ok: false, status: 401, error: "Invalid or expired token" };
    }
    const user = await Users.findById(payload.sub);
    if (!user) {
      return { ok: false, status: 401, error: "Account no longer exists" };
    }
    if (user.role !== payload.role) {
      return { ok: false, status: 401, error: "Role changed, please re-login" };
    }
    return { ok: true, auth: payload };
  } catch (e: unknown) {
    console.error("[authenticateBearerFromHeader]", e);
    return {
      ok: false,
      status: 503,
      error: e instanceof Error ? e.message : "Database temporarily unavailable"
    };
  }
}

export function authHasAnyRole(auth: AuthPayload, ...allowed: Role[]): boolean {
  return allowed.includes(auth.role);
}

/** Soft bearer parse for optional auth; never throws. */
export async function tryOptionalBearerFromHeader(
  authorizationHeader: string | undefined
): Promise<AuthPayload | undefined> {
  try {
    const header = authorizationHeader || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return undefined;
    const payload = verifyToken(token);
    if (!payload) return undefined;
    const user = await Users.findById(payload.sub);
    if (user && user.role === payload.role) return payload;
    return undefined;
  } catch (e: unknown) {
    console.error("[tryOptionalBearerFromHeader]", e);
    return undefined;
  }
}

function authorizationHeaderFromReq(req: Request): string {
  const raw = req.headers.authorization;
  return (Array.isArray(raw) ? raw[0] : raw) || "";
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authenticateBearerFromHeader(authorizationHeaderFromReq(req));
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    req.auth = result.auth;
    next();
  } catch (e: unknown) {
    console.error("[requireAuth]", e);
    return res.status(503).json({
      error: e instanceof Error ? e.message : "Authentication failed"
    });
  }
};

/**
 * Soft auth: populates req.auth if a valid token is present, but does not
 * reject anonymous requests. Used by public endpoints (comments, flags,
 * reports) where signed-in users get attribution but anonymous reads/writes
 * are still allowed.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const auth = await tryOptionalBearerFromHeader(authorizationHeaderFromReq(req));
    if (auth) req.auth = auth;
  } catch (e: unknown) {
    console.error("[optionalAuth]", e);
  }
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
