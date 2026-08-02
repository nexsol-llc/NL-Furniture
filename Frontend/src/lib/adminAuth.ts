const STORAGE_KEY = "admin_token";

export const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "editor";
  permissions?: Record<string, boolean>;
  exp: number;
}

export function decodeAdminToken(token: string): AdminPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as AdminPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminUser(): AdminPayload | null {
  const token = getAdminToken();
  if (!token) return null;
  return decodeAdminToken(token);
}

export function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  // Relative path: proxied server-side by Next.js (see next.config.js rewrites),
  // same as the public pages. Avoids the browser making a direct cross-origin
  // request to the Workers API, which sidesteps CORS-origin fragility and any
  // client-side network path (AV/VPN/extension) that blocks *.workers.dev directly.
  return fetch(path, {
    ...init,
    headers: {
      ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
