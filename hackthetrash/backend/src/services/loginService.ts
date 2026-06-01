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
    const msg = e instanceof Error ? e.message : String(e);
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    // Postgres: 28P01 = invalid_password. Same generic "connection" failure for wrong URI user/pass.
    if (code === "28P01" || /password authentication failed/i.test(msg)) {
      return {
        status: 503,
        body: {
          error:
            "Database rejected the login (wrong DATABASE_URL user or password). Re-copy the URI from Supabase → Connect → Direct → Transaction pooler, replace only the password placeholder (no [brackets]), URL-encode special characters in the password, add ?sslmode=require, save in Vercel, then Redeploy."
        }
      };
    }
    if (/getaddrinfo ENOTFOUND|ENOTFOUND/i.test(msg)) {
      return {
        status: 503,
        body: {
          error:
            "Database host not found (DATABASE_URL hostname typo or wrong region). Re-copy the connection string from Supabase and redeploy."
        }
      };
    }
    if (/ECONNREFUSED|ETIMEDOUT|connect ETIMEDOUT/i.test(msg)) {
      return {
        status: 503,
        body: {
          error:
            "Could not open a TCP connection to the database (firewall, paused Supabase project, or wrong port). Use Supabase transaction pooler :6543 for Vercel; resume project in Supabase if paused; redeploy."
        }
      };
    }
    return {
      status: 503,
      body: {
        error:
          "Cannot reach the database. On Vercel: set DATABASE_URL to your Postgres URL (include ?sslmode=require if the host requires SSL), run migrations, then redeploy. Open /api/health?probe=db after deploy — databaseReachable should be true."
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
