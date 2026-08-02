import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const sponsors = new Hono<{ Bindings: Env }>();

// ── GET /api/sponsors ────────────────────────────────────────────────────────
sponsors.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM sponsors ORDER BY created_at DESC"
  ).all<D1Row>();
  // Both the admin panel and the public homepage consume this as a bare array.
  return c.json(fromRows(results));
});

// ── GET /api/sponsors/:id ────────────────────────────────────────────────────
sponsors.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM sponsors WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/sponsors ───────────────────────────────────────────────────────
sponsors.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const id = newId();
  const now = nowIso();
  const doc = { ...body, createdAt: now, updatedAt: now };

  await db
    .prepare("INSERT INTO sponsors (id, created_at, data) VALUES (?, ?, ?)")
    .bind(id, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Sponsor created", `Titel: ${body.title}`);
  return c.json({ success: true, id }, 201);
});

// ── PUT /api/sponsors/:id ────────────────────────────────────────────────────
sponsors.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM sponsors WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE sponsors SET data = ? WHERE id = ?")
    .bind(JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Sponsor updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

// ── DELETE /api/sponsors/:id ─────────────────────────────────────────────────
sponsors.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM sponsors WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Sponsor deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default sponsors;
