// In-memory + Postgres-backed comment store.
// Mirrors the Report module: when DATABASE_URL is set, persists to the
// `comments` table (created in migrations/001_init.sql); otherwise keeps
// an in-memory list so the quick demo still works without a database.
import { v4 as uuid } from "uuid";
import { query } from "../db/pool";

export interface Comment {
  id: string;
  report_id: string;
  user_id: string | null;
  author_name: string | null;
  text: string;
  created_at: string;
}

const USE_DB = !!process.env.DATABASE_URL;

export const memComments: Comment[] = [];

export const Comments = {
  async listForReport(reportId: string): Promise<Comment[]> {
    if (USE_DB) {
      const { rows } = await query<Comment>(
        `SELECT c.id, c.report_id, c.user_id, c.text, c.created_at,
                u.name AS author_name
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.report_id = $1
         ORDER BY c.created_at ASC`,
        [reportId]
      );
      return rows;
    }
    return memComments
      .filter((c) => c.report_id === reportId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async create(opts: {
    reportId: string;
    userId?: string | null;
    authorName?: string | null;
    text: string;
  }): Promise<Comment> {
    if (USE_DB) {
      const { rows } = await query<Comment>(
        `INSERT INTO comments (report_id, user_id, text)
         VALUES ($1, $2, $3)
         RETURNING id, report_id, user_id, text, created_at`,
        [opts.reportId, opts.userId ?? null, opts.text]
      );
      return { ...rows[0], author_name: opts.authorName ?? null };
    }
    const c: Comment = {
      id: uuid(),
      report_id: opts.reportId,
      user_id: opts.userId ?? null,
      author_name: opts.authorName ?? null,
      text: opts.text,
      created_at: new Date().toISOString()
    };
    memComments.push(c);
    return c;
  },

  async remove(id: string): Promise<boolean> {
    if (USE_DB) {
      const { rows } = await query(
        `DELETE FROM comments WHERE id = $1 RETURNING id`, [id]
      );
      return rows.length > 0;
    }
    const idx = memComments.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    memComments.splice(idx, 1);
    return true;
  }
};
