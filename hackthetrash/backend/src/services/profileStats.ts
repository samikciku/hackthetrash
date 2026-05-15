// Aggregates per-user stats across the in-memory or Postgres stores so the
// /api/profile endpoint and the badge engine can share the same numbers.
import { reportsDB } from "../models/Report";
import { ReportRepo, ReportRow } from "../models/ReportRepo";

const USE_DB = !!process.env.DATABASE_URL;

export interface UserStats {
  totalReports: number;
  byStatus: Record<string, number>;
  hasVerified: boolean;
  hasCleaned: boolean;
  recent: Array<{
    id: string;
    latitude: number;
    longitude: number;
    status: string;
    created_at?: string;
    createdAt?: string;
    description?: string;
  }>;
}

export async function statsForUser(userId: string): Promise<UserStats> {
  if (USE_DB) {
    const all = await ReportRepo.list();
    const mine: ReportRow[] = all.filter((r) => r.user_id === userId);
    return summarise(mine);
  }
  const mine = reportsDB.filter((r) => r.userId === userId);
  return summarise(mine);
}

function summarise(rows: any[]): UserStats {
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  return {
    totalReports: rows.length,
    byStatus,
    hasVerified: rows.some((r) => r.status === "verified"),
    hasCleaned: rows.some((r) => r.status === "cleaned"),
    recent: rows.slice(0, 10).map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      status: r.status,
      description: r.description,
      created_at: r.created_at,
      createdAt: r.createdAt
    }))
  };
}
