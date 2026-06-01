// In-memory + Postgres-backed flag store.
// Citizens can flag reports as spam / duplicate / inaccurate.
// Admins/moderators see the queue and can resolve flags.
import { v4 as uuid } from "uuid";
import { query } from "../db/pool";

export const FLAG_REASONS = ["spam", "duplicate", "inaccurate", "offensive", "other"] as const;
export type FlagReason = typeof FLAG_REASONS[number];

export interface Flag {
  id: string;
  report_id: string;
  user_id: string | null;
  reason: FlagReason;
  note: string | null;
  resolved: boolean;
  created_at: string;
}

const USE_DB = !!process.env.DATABASE_URL;

export const memFlags: Flag[] = [];

export const Flags = {
  async listAll(opts?: { resolved?: boolean }): Promise<Flag[]> {
    if (USE_DB) {
      if (opts?.resolved === undefined) {
        const { rows } = await query<Flag>(
          `SELECT id, report_id, user_id, reason, note, resolved, created_at
           FROM flags
           ORDER BY created_at DESC`
        );
        return rows;
      }
      const { rows } = await query<Flag>(
        `SELECT id, report_id, user_id, reason, note, resolved, created_at
         FROM flags WHERE resolved = $1
         ORDER BY created_at DESC`,
        [opts.resolved]
      );
      return rows;
    }
    return memFlags
      .filter((f) => opts?.resolved === undefined || f.resolved === opts.resolved)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listForReport(reportId: string): Promise<Flag[]> {
    if (USE_DB) {
      const { rows } = await query<Flag>(
        `SELECT * FROM flags WHERE report_id = $1 ORDER BY created_at DESC`,
        [reportId]
      );
      return rows;
    }
    return memFlags.filter((f) => f.report_id === reportId);
  },

  async create(opts: {
    reportId: string;
    userId?: string | null;
    reason: FlagReason;
    note?: string;
  }): Promise<Flag> {
    if (USE_DB) {
      const { rows } = await query<Flag>(
        `INSERT INTO flags (report_id, user_id, reason, note)
         VALUES ($1, $2, $3, $4)
         RETURNING id, report_id, user_id, reason, note,
                   COALESCE(resolved, FALSE) AS resolved, created_at`,
        [opts.reportId, opts.userId ?? null, opts.reason, opts.note ?? null]
      );
      return rows[0];
    }
    const f: Flag = {
      id: uuid(),
      report_id: opts.reportId,
      user_id: opts.userId ?? null,
      reason: opts.reason,
      note: opts.note ?? null,
      resolved: false,
      created_at: new Date().toISOString()
    };
    memFlags.push(f);
    return f;
  },

  async resolve(id: string): Promise<boolean> {
    if (USE_DB) {
      const { rows } = await query(
        `UPDATE flags SET resolved = TRUE WHERE id = $1 RETURNING id`, [id]
      );
      return rows.length > 0;
    }
    const f = memFlags.find((x) => x.id === id);
    if (!f) return false;
    f.resolved = true;
    return true;
  }
};
