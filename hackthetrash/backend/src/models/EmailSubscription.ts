// Email subscriptions: people who want updates when a report near them
// changes status. In-memory or Postgres-backed.
import { v4 as uuid } from "uuid";
import { query } from "../db/pool";

export interface EmailSubscription {
  id: string;
  email: string;
  user_id: string | null;
  region: string | null;
  unsubscribe_token: string;
  created_at: string;
}

const USE_DB = !!process.env.DATABASE_URL;

export const memSubs: EmailSubscription[] = [];

export const EmailSubs = {
  async upsert(opts: {
    email: string;
    userId?: string | null;
    region?: string | null;
  }): Promise<EmailSubscription> {
    const lower = opts.email.toLowerCase().trim();
    if (USE_DB) {
      const { rows } = await query<EmailSubscription>(
        `INSERT INTO email_subscriptions (email, user_id, region)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET
           user_id = COALESCE(EXCLUDED.user_id, email_subscriptions.user_id),
           region  = COALESCE(EXCLUDED.region,  email_subscriptions.region)
         RETURNING id, email, user_id, region, unsubscribe_token, created_at`,
        [lower, opts.userId ?? null, opts.region ?? null]
      );
      return rows[0];
    }
    const existing = memSubs.find((s) => s.email === lower);
    if (existing) {
      if (opts.userId) existing.user_id = opts.userId;
      if (opts.region) existing.region = opts.region;
      return existing;
    }
    const sub: EmailSubscription = {
      id: uuid(),
      email: lower,
      user_id: opts.userId ?? null,
      region: opts.region ?? null,
      unsubscribe_token: uuid(),
      created_at: new Date().toISOString()
    };
    memSubs.push(sub);
    return sub;
  },

  async findByToken(token: string): Promise<EmailSubscription | null> {
    if (USE_DB) {
      const { rows } = await query<EmailSubscription>(
        `SELECT * FROM email_subscriptions WHERE unsubscribe_token = $1`, [token]
      );
      return rows[0] ?? null;
    }
    return memSubs.find((s) => s.unsubscribe_token === token) ?? null;
  },

  async remove(id: string): Promise<boolean> {
    if (USE_DB) {
      const { rows } = await query(
        `DELETE FROM email_subscriptions WHERE id = $1 RETURNING id`, [id]
      );
      return rows.length > 0;
    }
    const idx = memSubs.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    memSubs.splice(idx, 1);
    return true;
  },

  async listForRegion(region: string | null): Promise<EmailSubscription[]> {
    if (USE_DB) {
      if (!region) {
        const { rows } = await query<EmailSubscription>(
          `SELECT * FROM email_subscriptions`
        );
        return rows;
      }
      const { rows } = await query<EmailSubscription>(
        `SELECT * FROM email_subscriptions WHERE region IS NULL OR region = $1`,
        [region]
      );
      return rows;
    }
    return memSubs.filter((s) => !region || !s.region || s.region === region);
  }
};
