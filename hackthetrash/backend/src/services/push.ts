import { devices } from "../routes/devices";

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
};

/**
 * Send a notification via Expo's push service.
 * Free, no API key required for the demo. For production, batch in groups of 100
 * and handle DeliveryReceipts.
 */
export async function sendExpoPush(messages: PushPayload[]) {
  if (messages.length === 0) return;
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messages)
    });
    const data = await res.json();
    console.log(`[push] sent ${messages.length} message(s)`, JSON.stringify(data).slice(0, 300));
  } catch (e) {
    console.warn("[push] failed", e);
  }
}

/**
 * Notify all known devices that a report changed status.
 * In production, target only nearby reporters or city authorities.
 */
export async function notifyStatusChange(report: {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
}) {
  if (devices.length === 0) return;
  const msgs = devices.map((d) => ({
    to: d.token,
    title: "HackTheTrash",
    body: `A report near you was marked: ${report.status}`,
    channelId: "cleanups",
    data: { id: report.id, lat: report.latitude, lng: report.longitude, status: report.status }
  }));
  await sendExpoPush(msgs);
}
