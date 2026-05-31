import { getApiBase } from "./apiBase";

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
