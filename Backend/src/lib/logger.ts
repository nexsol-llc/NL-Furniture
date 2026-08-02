import { newId, nowIso } from "../db.js";

export async function logActivity(
  db: D1Database,
  userEmail: string,
  action: string,
  details: string = ""
): Promise<void> {
  try {
    const now = nowIso();
    await db
      .prepare("INSERT INTO activity_logs (id, created_at, data) VALUES (?, ?, ?)")
      .bind(
        newId(),
        now,
        JSON.stringify({ userEmail, action, details, createdAt: now })
      )
      .run();
  } catch (err) {
    // Activity logging must never break the main request
    console.error("logActivity failed:", err);
  }
}
