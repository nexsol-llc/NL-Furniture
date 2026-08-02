import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const offers = new Hono<{ Bindings: Env }>();

const VALID_SECTIONS = ["banner", "flash", "sale", "outdoor", "bedroom", "living", "lighting"] as const;

// ── GET /api/offers ──────────────────────────────────────────────────────────
offers.get("/", async (c) => {
  const section = c.req.query("section");
  const sql = section
    ? "SELECT id, data FROM offers WHERE section = ? ORDER BY created_at DESC"
    : "SELECT id, data FROM offers ORDER BY created_at DESC";
  const { results } = await c.env.DB.prepare(sql)
    .bind(...(section ? [section] : []))
    .all<D1Row>();
  return c.json({ offers: fromRows(results) });
});

// ── GET /api/offers/:id ──────────────────────────────────────────────────────
offers.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM offers WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/offers ─────────────────────────────────────────────────────────
offers.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.section || !VALID_SECTIONS.includes(body.section)) {
    return c.json({ error: `section must be one of: ${VALID_SECTIONS.join(", ")}` }, 400);
  }

  const id = newId();
  const now = nowIso();
  const doc = { ...body, createdAt: now, updatedAt: now };

  await db
    .prepare("INSERT INTO offers (id, section, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(id, body.section, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Offer created", `Section: ${body.section}, Titel: ${body.title}`);
  return c.json({ success: true, id }, 201);
});

// ── PUT /api/offers/:id ──────────────────────────────────────────────────────
offers.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM offers WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE offers SET section = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.section ?? "", JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Offer updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

// ── DELETE /api/offers/:id ───────────────────────────────────────────────────
offers.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM offers WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Offer deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default offers;
