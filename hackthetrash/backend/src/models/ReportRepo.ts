// PostgreSQL-backed Report repository (PostGIS).
import { query } from "../db/pool";

export interface ReportRow {
  id: string;
  user_id: string | null;
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
  tags: string[];
  status: string;
  anonymous: boolean;
  ai_score: number | null;
  ai_label: string | null;
  created_at: string;
  updated_at: string;
  photo_urls?: string[];
}

export const ReportRepo = {
  async list(): Promise<ReportRow[]> {
    // Aggregate photo URLs per report so the public map can show them in popups.
    const { rows } = await query<ReportRow>(
      `SELECT r.id, r.user_id, r.latitude, r.longitude, r.description, r.severity, r.tags,
              r.status, r.anonymous, r.ai_score, r.ai_label, r.created_at, r.updated_at,
              COALESCE(
                (SELECT array_agg(p.url ORDER BY p.uploaded_at)
                 FROM photos p WHERE p.report_id = r.id),
                ARRAY[]::text[]
              ) AS photo_urls
       FROM reports r
       ORDER BY r.created_at DESC
       LIMIT 500`
    );
    return rows;
  },

  async findById(id: string): Promise<ReportRow | null> {
    const { rows } = await query<ReportRow>(
      `SELECT * FROM reports WHERE id = $1`, [id]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    userId?: string | null;
    latitude: number;
    longitude: number;
    description?: string;
    severity?: string;
    tags?: string[];
    anonymous?: boolean;
    aiScore?: number | null;
    aiLabel?: string | null;
  }): Promise<ReportRow> {
    const { rows } = await query<ReportRow>(
      `INSERT INTO reports
        (user_id, geom, latitude, longitude, description, severity, tags, anonymous, ai_score, ai_label)
       VALUES
        ($1,
         ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
         $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.userId ?? null,
        data.latitude,
        data.longitude,
        data.description ?? "",
        data.severity ?? "medium",
        data.tags ?? [],
        data.anonymous ?? true,
        data.aiScore ?? null,
        data.aiLabel ?? null
      ]
    );
    return rows[0];
  },

  async updateStatus(id: string, status: string, note?: string, updatedBy?: string) {
    await query(`UPDATE reports SET status = $2 WHERE id = $1`, [id, status]);
    await query(
      `INSERT INTO status_updates (report_id, status, updated_by, note) VALUES ($1, $2, $3, $4)`,
      [id, status, updatedBy ?? null, note ?? null]
    );
  },

  async addPhotos(reportId: string, urls: string[]) {
    for (const url of urls) {
      await query(`INSERT INTO photos (report_id, url) VALUES ($1, $2)`, [reportId, url]);
    }
  },

  async findNearby(lat: number, lng: number, meters = 100): Promise<ReportRow[]> {
    const { rows } = await query<ReportRow>(
      `SELECT * FROM reports_within($1, $2, $3)`, [lat, lng, meters]
    );
    return rows;
  }
};
