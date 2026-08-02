import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, type D1Row } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const DEFAULT_CONSENT = {
  heading: "Toestemming voor het gebruik van cookies 🍪",
  bodyText: 'We gebruiken cookies om je te herkennen, het gebruik van onze dienst te meten en je gepersonaliseerde advertenties te tonen. Door op "Accepteren" te klikken, geef je toestemming voor het gebruik van cookies.',
  detailsLinkText: "Details en juridische grondslag",
  detailsLinkUrl: "/privacybeleid",
  link1Text: "Privacybeleid",
  link1Url: "/privacybeleid",
  link2Text: "Colofon",
  link2Url: "/colofon",
  link3Text: "Algemene voorwaarden",
  link3Url: "/algemene-voorwaarden",
  refuseButtonText: "Weigeren",
  acceptButtonText: "Accepteren",
  delaySeconds: 2,
  isActive: true,
};

const cookieConsent = new Hono<{ Bindings: Env }>();

// ── GET /api/cookie-consent ───────────────────────────────────────────────────
cookieConsent.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM cookie_consents WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? fromRow(row) : DEFAULT_CONSENT);
});

// ── PUT /api/cookie-consent ───────────────────────────────────────────────────
cookieConsent.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO cookie_consents (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Cookie consent updated", "");
  const row = await db
    .prepare("SELECT id, data FROM cookie_consents WHERE id = 'singleton'")
    .first<D1Row>();
  return c.json(fromRow(row));
});

// ── POST /api/cookie-consent/log — log visitor choice ────────────────────────
cookieConsent.post("/log", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!["accepted", "refused"].includes(body.choice)) {
    return c.json({ error: 'choice must be "accepted" or "refused"' }, 400);
  }

  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const userAgent = c.req.header("user-agent") || "";
  const now = nowIso();

  const doc = {
    ip,
    userAgent,
    choice: body.choice,
    referrer: body.referrer || "",
    utmSource: body.utmSource || "",
    utmMedium: body.utmMedium || "",
    utmCampaign: body.utmCampaign || "",
    gclid: body.gclid || "",
    fbclid: body.fbclid || "",
    createdAt: now,
  };

  await db
    .prepare("INSERT INTO cookie_consent_logs (id, choice, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(newId(), body.choice, now, JSON.stringify(doc))
    .run();

  return c.json({ success: true });
});

// ── GET /api/cookie-consent/log/list — admin: list logs ──────────────────────
cookieConsent.get("/log/list", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const limit = Math.min(Number(c.req.query("limit") ?? "100"), 1000);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const choice = c.req.query("choice");

  const whereClause = choice ? "WHERE choice = ?" : "";
  const choiceBinds = choice ? [choice] : [];

  const [logsRes, totalRes, acceptedRes, refusedRes] = await db.batch([
    db.prepare(`SELECT id, data FROM cookie_consent_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...choiceBinds, limit, offset),
    db.prepare(`SELECT COUNT(*) as n FROM cookie_consent_logs ${whereClause}`).bind(...choiceBinds),
    db.prepare("SELECT COUNT(*) as n FROM cookie_consent_logs WHERE choice = 'accepted'"),
    db.prepare("SELECT COUNT(*) as n FROM cookie_consent_logs WHERE choice = 'refused'"),
  ]);

  const logs = (logsRes.results as D1Row[]).map((r) => ({ _id: r.id, ...JSON.parse(r.data) }));
  const total = (totalRes.results[0] as any).n;
  const accepted = (acceptedRes.results[0] as any).n;
  const refused = (refusedRes.results[0] as any).n;

  return c.json({ logs, total, accepted, refused, page, pages: Math.ceil(total / limit) });
});

// ── GET /api/cookie-consent/log/export — admin: CSV export ───────────────────
cookieConsent.get("/log/export", authMiddleware, requireStaff, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM cookie_consent_logs ORDER BY created_at DESC LIMIT 10000"
  ).all<D1Row>();

  const headers = ["id", "ip", "choice", "userAgent", "referrer", "utmSource", "utmMedium", "utmCampaign", "gclid", "fbclid", "createdAt"];
  const csvLines = [
    headers.join(","),
    ...results.map((r) => {
      const row = { id: r.id, ...JSON.parse(r.data) };
      return headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",");
    }),
  ];

  return new Response(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cookie-consent-logs-${Date.now()}.csv"`,
    },
  });
});

export default cookieConsent;
