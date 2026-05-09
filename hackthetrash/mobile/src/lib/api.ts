import Constants from "expo-constants";
import { Platform } from "react-native";

// Default backend URL:
// - Android emulator: 10.0.2.2 maps to host loopback
// - iOS simulator: localhost works
// - Real device: set via app.json -> extra.apiUrl or EAS env
function defaultApiUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra;
  if (Platform.OS === "android") return "http://10.0.2.2:4000";
  return "http://localhost:4000";
}

export const API_URL = defaultApiUrl();

export type Report = {
  id: string;
  latitude: number;
  longitude: number;
  status: "reported" | "verified" | "cleaning" | "cleaned" | "rejected" | string;
  description?: string;
  severity?: string;
  tags?: string[];
  photoUrls?: string[];
  photo_urls?: string[];
  createdAt?: string;
  created_at?: string;
};

export const fullPhotoUrl = (u: string) => (u.startsWith("http") ? u : `${API_URL}${u}`);

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch(`${API_URL}/api/reports`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.reports ?? [];
}

export async function submitReport(payload: {
  latitude: number;
  longitude: number;
  photos: { uri: string; name: string; type: string }[];
  tags: string[];
  severity: string;
  description: string;
  anonymous: boolean;
}): Promise<Report> {
  const fd = new FormData();
  for (const p of payload.photos) {
    // React Native FormData expects { uri, name, type }
    // @ts-ignore – RN FormData accepts this shape
    fd.append("photos", { uri: p.uri, name: p.name, type: p.type });
  }
  fd.append("latitude", String(payload.latitude));
  fd.append("longitude", String(payload.longitude));
  fd.append("tags", JSON.stringify(payload.tags));
  fd.append("severity", payload.severity);
  fd.append("description", payload.description);
  fd.append("anonymous", String(payload.anonymous));

  const res = await fetch(`${API_URL}/api/reports`, { method: "POST", body: fd as any });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit failed (${res.status}): ${text}`);
  }
  return res.json();
}
