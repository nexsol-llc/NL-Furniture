const STORAGE_KEY = "visitor_id";

// Anonymous per-device identifier used only to cap coupon votes at one per
// coupon (no account/login involved) — persisted in localStorage so it
// survives reloads but not a cleared browser profile.
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
