/**
 * Production startup checks (JWT secret strength, CORS allowlist).
 * Skips in test and non-production environments.
 */

const WEAK_JWT_SECRETS = new Set([
  "",
  "dev_only_change_me",
  "changeme",
  "secret",
  "please_replace_with_a_long_random_value_in_production"
]);

export function isProductionLike(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function jwtSecretLooksWeak(secret: string | undefined): boolean {
  const t = (secret ?? "").trim();
  if (!t) return true;
  if (t.length < 32) return true;
  if (WEAK_JWT_SECRETS.has(t)) return true;
  return false;
}

function corsOriginsRaw(): string {
  return (process.env.CORS_ORIGINS ?? "").trim();
}

/** True if CORS is configured as wildcard or missing (unsafe with credentials). */
export function corsIsWildcardOrMissing(): boolean {
  const raw = corsOriginsRaw();
  if (!raw) return true;
  return raw.split(",").every((s) => s.trim() === "" || s.trim() === "*");
}

/**
 * Call from Express `createApp()` and from Next `instrumentation` so App Router
 * handlers cannot run in production with unsafe defaults.
 */
export function assertStartupSecurity(): void {
  if (!isProductionLike()) return;

  const jwt = process.env.JWT_SECRET;
  if (jwtSecretLooksWeak(jwt)) {
    throw new Error(
      "JWT_SECRET must be set to a random string of at least 32 characters in production " +
        "(not the dev default). Generate one with: openssl rand -hex 32"
    );
  }

  if (corsIsWildcardOrMissing()) {
    throw new Error(
      "CORS_ORIGINS must list explicit origins (comma-separated) in production; " +
        "wildcard * is not allowed with credentials."
    );
  }
}
