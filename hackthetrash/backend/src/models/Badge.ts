// Badge engine and store. Pure-data definitions of all badges live here so
// the same catalog can be served to the UI.
import { v4 as uuid } from "uuid";
import { query } from "../db/pool";

export interface BadgeDef {
  code: string;
  title: string;
  description: string;
  icon: string;        // emoji used by the web/mobile clients
  threshold?: number;  // for count-based badges
}

export const BADGE_CATALOG: BadgeDef[] = [
  { code: "first_report",   title: "First Report",     description: "Submitted your first report.", icon: "🌱", threshold: 1 },
  { code: "five_reports",   title: "Active Reporter",  description: "Submitted 5 reports.",         icon: "📸", threshold: 5 },
  { code: "twentyfive",     title: "Local Hero",       description: "Submitted 25 reports.",        icon: "🏅", threshold: 25 },
  { code: "hundred",        title: "Cleanup Champion", description: "Submitted 100 reports.",       icon: "🏆", threshold: 100 },
  { code: "verified",       title: "Verified Reporter", description: "Had a report verified.",      icon: "✅" },
  { code: "cleaned",        title: "Made a Difference", description: "Had a report marked cleaned.", icon: "🌿" }
];

export const BADGE_BY_CODE: Record<string, BadgeDef> =
  Object.fromEntries(BADGE_CATALOG.map((b) => [b.code, b]));

export interface UserBadge {
  id: string;
  user_id: string;
  code: string;
  awarded_at: string;
}

const USE_DB = !!process.env.DATABASE_URL;

export const memBadges: UserBadge[] = [];

export const Badges = {
  async listForUser(userId: string): Promise<UserBadge[]> {
    if (USE_DB) {
      const { rows } = await query<UserBadge>(
        `SELECT id, user_id, code, awarded_at FROM badges
         WHERE user_id = $1 ORDER BY awarded_at ASC`,
        [userId]
      );
      return rows;
    }
    return memBadges
      .filter((b) => b.user_id === userId)
      .sort((a, b) => a.awarded_at.localeCompare(b.awarded_at));
  },

  async award(userId: string, code: string): Promise<UserBadge | null> {
    if (!BADGE_BY_CODE[code]) return null;
    if (USE_DB) {
      const { rows } = await query<UserBadge>(
        `INSERT INTO badges (user_id, code) VALUES ($1, $2)
         ON CONFLICT (user_id, code) DO NOTHING
         RETURNING id, user_id, code, awarded_at`,
        [userId, code]
      );
      return rows[0] ?? null;
    }
    const existing = memBadges.find((b) => b.user_id === userId && b.code === code);
    if (existing) return null;
    const b: UserBadge = {
      id: uuid(),
      user_id: userId,
      code,
      awarded_at: new Date().toISOString()
    };
    memBadges.push(b);
    return b;
  }
};

/**
 * Re-evaluate which count-based badges a user should hold.
 * Awards any newly earned badges and returns the list of *newly* awarded codes.
 * Must be called after a user submits a report or has one verified/cleaned.
 */
export async function evaluateCountBadges(
  userId: string,
  reportCount: number,
  flags: { hasVerified: boolean; hasCleaned: boolean }
): Promise<string[]> {
  const newly: string[] = [];
  const tryAward = async (code: string) => {
    const awarded = await Badges.award(userId, code);
    if (awarded) newly.push(code);
  };

  for (const def of BADGE_CATALOG) {
    if (def.threshold && reportCount >= def.threshold) {
      await tryAward(def.code);
    }
  }
  if (flags.hasVerified) await tryAward("verified");
  if (flags.hasCleaned) await tryAward("cleaned");
  return newly;
}
