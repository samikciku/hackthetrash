// Lightweight email service. Two transports:
//   - "console" (default in dev/test): logs the email to stdout
//   - "smtp"   (production):           sends via nodemailer + SMTP_*
//
// We keep nodemailer as an optional require so the dev/test setup does not
// need the dependency just to print to the console.
import { EmailSubs } from "../models/EmailSubscription";

type Mail = { to: string; subject: string; text: string; html?: string };

let _transport: any = null;
async function getSmtp() {
  if (_transport) return _transport;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require("nodemailer");
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
  return _transport;
}

export async function sendMail(m: Mail): Promise<void> {
  const transport = (process.env.SMTP_TRANSPORT || "console").toLowerCase();
  if (transport === "console") {
    console.log("\n[email]", m.to, "—", m.subject);
    console.log(m.text);
    console.log("[/email]\n");
    return;
  }
  try {
    const smtp = await getSmtp();
    await smtp.sendMail({
      from: process.env.SMTP_FROM || "HackTheTrash <no-reply@hackthetrash.org>",
      ...m
    });
  } catch (e) {
    console.warn("[email] SMTP send failed, falling back to console:", e);
    console.log(m.to, "—", m.subject, "\n", m.text);
  }
}

const STATUS_LABEL: Record<string, string> = {
  reported: "Reported",
  verified: "Verified by moderator",
  cleaning: "Cleanup in progress",
  cleaned:  "Cleaned up",
  rejected: "Rejected"
};

const baseUrl = () => process.env.PUBLIC_URL || "http://localhost:3000";

/**
 * Notify everyone subscribed to the report's region (or globally) that the
 * report changed status. Falls back to the console transport in dev.
 */
export async function sendStatusEmail(report: {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
  region?: string | null;
}): Promise<void> {
  const subs = await EmailSubs.listForRegion(report.region ?? null);
  if (subs.length === 0) return;

  const label = STATUS_LABEL[report.status] || report.status;
  const link = `${baseUrl()}/map?lat=${report.latitude}&lng=${report.longitude}&id=${report.id}`;

  await Promise.all(subs.map((s) => sendMail({
    to: s.email,
    subject: `[HackTheTrash] Report status: ${label}`,
    text: `A report you subscribed to was updated.\n\nNew status: ${label}\nLocation: ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}\nView: ${link}\n\nUnsubscribe: ${baseUrl()}/api/email-subscriptions/unsubscribe/${s.unsubscribe_token}`,
    html: `<p>A report you subscribed to was updated.</p>
<p><strong>New status:</strong> ${label}<br/>
<strong>Location:</strong> ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</p>
<p><a href="${link}">View on the map</a></p>
<p style="color:#888;font-size:12px;">
<a href="${baseUrl()}/api/email-subscriptions/unsubscribe/${s.unsubscribe_token}">Unsubscribe</a>
</p>`
  })));
}
