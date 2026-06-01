import { Users } from "./users";
import {
  signToken,
  rateLimitLoginByIp,
  noteFailedLoginByIp,
  clearLoginAttemptsByIp
} from "../middleware/auth";

/**
 * JSON login used by Express and by the Next.js App Router route (Vercel-safe body read).
 */
export async function performJsonLogin(
  email: unknown,
  password: unknown,
  clientIp: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  // When IP is missing (some proxies), rate-limit per email so all users don't share one "unknown" bucket.
  const rateKey =
    clientIp !== "unknown"
      ? clientIp
      : `email:${String(email ?? "")
          .toLowerCase()
          .slice(0, 256) || "anon"}`;

  const lim = rateLimitLoginByIp(rateKey);
  if (!lim.ok) {
    return {
      status: 429,
      body: { error: `Too many attempts. Try again in ${lim.waitSec}s.` }
    };
  }

  if (!email || !password) {
    noteFailedLoginByIp(rateKey);
    return { status: 400, body: { error: "Email and password are required" } };
  }

  let user;
  try {
    user = await Users.findByEmail(String(email));
  } catch (e: unknown) {
    console.error("[login] database error", e);
    return {
      status: 503,
      body: {
        error:
          "Cannot reach the database. On Vercel: set DATABASE_URL to your Postgres URL (include ?sslmode=require if the host requires SSL), run migrations, then redeploy."
      }
    };
  }

  if (!user) {
    noteFailedLoginByIp(rateKey);
    return { status: 401, body: { error: "Invalid credentials" } };
  }
  let ok: boolean;
  try {
    ok = await Users.verify(String(password), user.password_hash);
  } catch (e: unknown) {
    console.error("[login] verify error", e);
    return { status: 503, body: { error: "Login temporarily unavailable. Try again in a moment." } };
  }
  if (!ok) {
    noteFailedLoginByIp(rateKey);
    return { status: 401, body: { error: "Invalid credentials" } };
  }

  let token: string;
  try {
    token = signToken({ sub: user.id, role: user.role, email: user.email });
  } catch (e: unknown) {
    console.error("[login] jwt sign error", e);
    return {
      status: 503,
      body: {
        error:
          "JWT signing failed. Set a valid JWT_SECRET in the Vercel project environment (e.g. openssl rand -hex 64) and redeploy."
      }
    };
  }

  clearLoginAttemptsByIp(rateKey);
  return {
    status: 200,
    body: {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, region: user.region }
    }
  };
}
