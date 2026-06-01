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
  const lim = rateLimitLoginByIp(clientIp);
  if (!lim.ok) {
    return {
      status: 429,
      body: { error: `Too many attempts. Try again in ${lim.waitSec}s.` }
    };
  }

  if (!email || !password) {
    noteFailedLoginByIp(clientIp);
    return { status: 400, body: { error: "Email and password are required" } };
  }

  const user = await Users.findByEmail(String(email));
  if (!user) {
    noteFailedLoginByIp(clientIp);
    return { status: 401, body: { error: "Invalid credentials" } };
  }
  const ok = await Users.verify(String(password), user.password_hash);
  if (!ok) {
    noteFailedLoginByIp(clientIp);
    return { status: 401, body: { error: "Invalid credentials" } };
  }

  clearLoginAttemptsByIp(clientIp);
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return {
    status: 200,
    body: {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, region: user.region }
    }
  };
}
