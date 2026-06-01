import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { Users, Role } from "../services/users";
import { isProductionLike, jwtSecretLooksWeak } from "../config/envSecurity";

const DEV_JWT_FALLBACK = "dev_only_change_me";
// `jsonwebtoken` v9 narrows expiresIn to `number | StringValue`, so we cast
// here once rather than scattering casts at every call site.
const JWT_EXPIRES = (process.env.JWT_EXPIRES || "12h") as SignOptions["expiresIn"];

function getJwtSecret(): string {
  if (!isProductionLike()) {
    return process.env.JWT_SECRET || DEV_JWT_FALLBACK;
  }
  const s = process.env.JWT_SECRET;
  if (jwtSecretLooksWeak(s)) {
    throw new Error("JWT_SECRET must be set to a strong value in production (see envSecurity.assertStartupSecurity).");
  }
  return s!;
}

/** HttpOnly session cookie name (browser); Bearer header still supported for API clients. */
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "htt_token";

export function resolveJwtCookieMaxAgeSec(): number {
  const raw = (process.env.JWT_EXPIRES || "12h").trim();
  const asNum = Number(raw);
  if (raw && Number.isFinite(asNum) && asNum > 0 && /^\d+$/.test(raw)) return Math.floor(asNum);
  const m = raw.match(/^(\d+)\s*([smhd])$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    const u = m[2].toLowerCase();
    if (u === "s") return n;
    if (u === "m") return n * 60;
    if (u === "h") return n * 3600;
    if (u === "d") return n * 86400;
  }
  return 12 * 3600;
}

function parseCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    if (k !== name) continue;
    const v = p.slice(idx + 1).trim();
    try {
      return decodeURIComponent(v);
    } catch {
      return v || null;
    }
  }
  return null;
}

export function extractSessionToken(
  authorizationHeader: string | undefined,
  cookieHeader: string | undefined
): string | null {
  const auth = authorizationHeader || "";
  if (auth.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const fromCookie = parseCookieValue(cookieHeader, AUTH_COOKIE_NAME);
  return fromCookie && fromCookie.length > 0 ? fromCookie : null;
}

export function buildAuthSetCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const bits = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${resolveJwtCookieMaxAgeSec()}`,
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

export function buildClearAuthCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const bits = [`${AUTH_COOKIE_NAME}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Lax"];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
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
  authorizationHeader: string | undefined,
  cookieHeader?: string | null
): Promise<BearerAuthResult> {
  try {
    const token = extractSessionToken(authorizationHeader, cookieHeader ?? undefined);
    if (!token) {
      return { ok: false, status: 401, error: "Missing session (Authorization Bearer or auth cookie)" };
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
  authorizationHeader: string | undefined,
  cookieHeader?: string | null
): Promise<AuthPayload | undefined> {
  try {
    const token = extractSessionToken(authorizationHeader, cookieHeader ?? undefined);
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

function cookieHeaderFromReq(req: Request): string | undefined {
  const raw = req.headers.cookie;
  return (Array.isArray(raw) ? raw[0] : raw) || undefined;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authenticateBearerFromHeader(
      authorizationHeaderFromReq(req),
      cookieHeaderFromReq(req)
    );
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
    const auth = await tryOptionalBearerFromHeader(
      authorizationHeaderFromReq(req),
      cookieHeaderFromReq(req)
    );
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
// Brute-force protection: in-memory per IP, or optional Upstash (set
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) for multi-instance / serverless.
// ----------------------------------------------------------------------------
const ATTEMPTS = new Map<string, { count: number; firstAt: number; lockedUntil?: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function loginRateLimitUsesRedis(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

type RatelimitType = import("@upstash/ratelimit").Ratelimit;
let upstashLoginLimiter: RatelimitType | null | undefined;

async function getUpstashLoginLimiter(): Promise<RatelimitType | null> {
  if (!loginRateLimitUsesRedis()) return null;
  if (upstashLoginLimiter !== undefined) return upstashLoginLimiter;
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });
    upstashLoginLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "htt_login"
    });
    return upstashLoginLimiter;
  } catch (e: unknown) {
    console.error("[auth] Upstash rate limit init failed; using in-memory only", e);
    upstashLoginLimiter = null;
    return null;
  }
}

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

export async function rateLimitLoginByIp(
  ip: string
): Promise<{ ok: true } | { ok: false; waitSec: number }> {
  const lim = await getUpstashLoginLimiter();
  if (lim) {
    const r = await lim.limit(ip);
    if (!r.success) {
      const waitSec = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
      return { ok: false, waitSec };
    }
  }

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
  void rateLimitLoginByIp(ip)
    .then((lim) => {
      if (!lim.ok) {
        res.status(429).json({ error: `Too many attempts. Try again in ${lim.waitSec}s.` });
        return;
      }
      next();
    })
    .catch((e: unknown) => {
      console.error("[rateLimitLogin]", e);
      next(e);
    });
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
