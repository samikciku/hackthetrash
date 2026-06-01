import { ReportRepo } from "../models/ReportRepo";
import { reportsDB } from "../models/Report";
import { notifyStatusChange } from "./push";
import { sendStatusEmail } from "./email";
import { evaluateCountBadges } from "../models/Badge";
import { statsForUser } from "./profileStats";

const USE_DB = !!process.env.DATABASE_URL;

export type DecisionStatus = "verified" | "rejected" | "cleaning" | "cleaned";

export async function applyAdminReportDecision(opts: {
  id: string;
  status: DecisionStatus;
  note: string;
  updatedBy?: string;
}): Promise<{ ok: true; report: unknown } | { ok: false; status: number; error: string }> {
  const { id, status, note, updatedBy } = opts;
  try {
    if (USE_DB) {
      await ReportRepo.updateStatus(id, status, note, updatedBy);
      const r = await ReportRepo.findById(id);
      if (!r) return { ok: false, status: 404, error: "Not found" };
      notifyStatusChange({
        id: r.id,
        status: r.status,
        latitude: r.latitude,
        longitude: r.longitude
      }).catch(() => {});
      sendStatusEmail({
        id: r.id,
        status: r.status,
        latitude: r.latitude,
        longitude: r.longitude
      }).catch(() => {});
      if (r.user_id) {
        const stats = await statsForUser(r.user_id);
        evaluateCountBadges(r.user_id, stats.totalReports, {
          hasVerified: stats.hasVerified,
          hasCleaned: stats.hasCleaned
        }).catch(() => {});
      }
      return { ok: true, report: r };
    }

    const r = reportsDB.find((x) => x.id === id);
    if (!r) return { ok: false, status: 404, error: "Not found" };
    r.status = status;
    notifyStatusChange({
      id: r.id,
      status: r.status,
      latitude: r.latitude,
      longitude: r.longitude
    }).catch(() => {});
    sendStatusEmail({
      id: r.id,
      status: r.status,
      latitude: r.latitude,
      longitude: r.longitude
    }).catch(() => {});
    if (r.userId) {
      const stats = await statsForUser(r.userId);
      evaluateCountBadges(r.userId, stats.totalReports, {
        hasVerified: stats.hasVerified,
        hasCleaned: stats.hasCleaned
      }).catch(() => {});
    }
    return { ok: true, report: r };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "update failed";
    return { ok: false, status: 500, error: msg };
  }
}
