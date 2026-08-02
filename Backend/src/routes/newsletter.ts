import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { sendEmail, newsletterWelcomeHtml } from "../lib/mail.js";
import { logActivity } from "../lib/logger.js";

const newsletter = new Hono<{ Bindings: Env }>();

// ── POST /api/newsletter/subscribe ───────────────────────────────────────────
newsletter.post("/subscribe", async (c) => {
  const db = c.env.DB;
  const { email } = await c.req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "Ongeldig e-mailadres." }, 400);
  }

  const emailNormalized = email.toLowerCase().trim();
  const existing = await db
    .prepare("SELECT id FROM newsletters WHERE email = ? LIMIT 1")
    .bind(emailNormalized).first<{ id: string }>();

  if (existing) {
    return c.json({ success: true, message: "Bereits angemeldet." });
  }

  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const userAgent = c.req.header("user-agent") || "";
  const now = nowIso();

  await db
    .prepare("INSERT INTO newsletters (id, email, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(
      newId(),
      emailNormalized,
      now,
      JSON.stringify({ email: emailNormalized, ip, userAgent, createdAt: now })
    )
    .run();

  sendEmail(
    {
      to: emailNormalized,
      subject: "Welkom bij de NL Furniture-nieuwsbrief!",
      html: newsletterWelcomeHtml(emailNormalized),
    },
    { apiKey: c.env.RESEND_API_KEY, from: c.env.RESEND_FROM }
  ).catch(console.error);

  // Notify admin email stored in system_settings (newsletterNotifyEmail)
  const settingsRow = await db
    .prepare("SELECT data FROM system_settings WHERE id = 'singleton' LIMIT 1")
    .first<{ data: string }>();
  const notifyEmail = settingsRow ? JSON.parse(settingsRow.data).newsletterNotifyEmail : null;
  if (notifyEmail) {
    sendEmail(
      {
        to: notifyEmail,
        subject: "Neuer Newsletter-Abonnent",
        html: `<p>Neuer Abonnent: <strong>${emailNormalized}</strong></p>`,
      },
      { apiKey: c.env.RESEND_API_KEY, from: c.env.RESEND_FROM }
    ).catch(console.error);
  }

  return c.json({ success: true, message: "Erfolgreich angemeldet!" });
});

// ── GET /api/newsletter — admin: list all subscribers ────────────────────────
newsletter.get("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const limit = Math.min(Number(c.req.query("limit") ?? "100"), 500);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const [countRes, itemsRes] = await db.batch([
    db.prepare("SELECT COUNT(*) as n FROM newsletters"),
    db.prepare("SELECT id, data FROM newsletters ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(limit, offset),
  ]);

  const total = (countRes.results[0] as any).n;
  const subscribers = (itemsRes.results as D1Row[]).map((r) => ({ _id: r.id, ...JSON.parse(r.data) }));

  return c.json({ subscribers, total, page, pages: Math.ceil(total / limit) });
});

// ── DELETE /api/newsletter — unsubscribe ─────────────────────────────────────
newsletter.delete("/", authMiddleware, requireAdmin, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const emailParam = c.req.query("email");
  let email = emailParam;
  if (!email) {
    const body = await c.req.json().catch(() => ({}));
    email = body.email;
  }
  if (!email) return c.json({ error: "e-mailadres is verplicht." }, 400);

  await db
    .prepare("DELETE FROM newsletters WHERE email = ?")
    .bind(email.toLowerCase().trim())
    .run();
  await logActivity(db, user.email, "Newsletter subscriber removed", email);

  return c.json({ success: true });
});

export default newsletter;
