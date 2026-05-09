import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import * as FileSystem from "expo-file-system";
import { submitReport, Report } from "./api";

const QUEUE_KEY = "@htt/queue";

export type PendingReport = {
  id: string;
  createdAt: number;
  attempts: number;
  payload: {
    latitude: number;
    longitude: number;
    photos: { uri: string; name: string; type: string }[];
    tags: string[];
    severity: string;
    description: string;
    anonymous: boolean;
  };
  lastError?: string;
};

async function readQueue(): Promise<PendingReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingReport[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingReport[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function listQueue(): Promise<PendingReport[]> {
  return readQueue();
}

export async function queueSize(): Promise<number> {
  return (await readQueue()).length;
}

/** Persist photos to the app's document dir so they survive a process restart. */
async function persistPhotos(photos: PendingReport["payload"]["photos"]): Promise<PendingReport["payload"]["photos"]> {
  const persisted: PendingReport["payload"]["photos"] = [];
  const baseDir = (FileSystem.documentDirectory ?? "") + "htt-queue/";
  try {
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  } catch {}
  for (const p of photos) {
    if (p.uri.startsWith(baseDir)) {
      persisted.push(p);
      continue;
    }
    const dest = baseDir + Date.now() + "_" + p.name;
    try {
      await FileSystem.copyAsync({ from: p.uri, to: dest });
      persisted.push({ ...p, uri: dest });
    } catch {
      persisted.push(p);
    }
  }
  return persisted;
}

export async function enqueue(payload: PendingReport["payload"]): Promise<PendingReport> {
  const items = await readQueue();
  const photos = await persistPhotos(payload.photos);
  const item: PendingReport = {
    id: `pending_${Date.now()}`,
    createdAt: Date.now(),
    attempts: 0,
    payload: { ...payload, photos }
  };
  items.unshift(item);
  await writeQueue(items);
  return item;
}

export async function removeFromQueue(id: string) {
  const items = await readQueue();
  await writeQueue(items.filter((i) => i.id !== id));
}

export async function isOnline(): Promise<boolean> {
  try {
    const s = await Network.getNetworkStateAsync();
    return Boolean(s.isConnected && s.isInternetReachable !== false);
  } catch {
    return true;
  }
}

/**
 * Try to submit every queued report. Returns counts.
 * Should be called on app foreground or after a successful network event.
 */
export async function flushQueue(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (!(await isOnline())) {
    const remaining = (await readQueue()).length;
    return { sent: 0, failed: 0, remaining };
  }

  const items = await readQueue();
  let sent = 0;
  let failed = 0;
  const stillPending: PendingReport[] = [];
  for (const item of items) {
    try {
      await submitReport(item.payload);
      sent++;
    } catch (e: any) {
      item.attempts += 1;
      item.lastError = e?.message ?? "unknown error";
      stillPending.push(item);
      failed++;
    }
  }
  await writeQueue(stillPending);
  return { sent, failed, remaining: stillPending.length };
}

/**
 * Try to send a fresh report immediately; if offline or failing, queue it.
 * Returns either the server response or a `queued: true` marker.
 */
export async function submitOrQueue(
  payload: PendingReport["payload"]
): Promise<{ ok: true; report?: Report; queued?: boolean }> {
  if (await isOnline()) {
    try {
      const report = await submitReport(payload);
      return { ok: true, report };
    } catch (e) {
      // fallthrough to queue
    }
  }
  await enqueue(payload);
  return { ok: true, queued: true };
}
