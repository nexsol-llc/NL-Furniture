const STORAGE_KEY = "user_token";

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  type: "user";
  exp: number;
}

export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setUserToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearUserToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeUserToken(token: string): UserPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as UserPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUser(): UserPayload | null {
  const token = getUserToken();
  if (!token) return null;
  return decodeUserToken(token);
}

export function userFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getUserToken();
  return fetch(path, {
    ...init,
    headers: {
      ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
