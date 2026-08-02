import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const authors = new Hono<{ Bindings: Env }>();

// ── GET /api/authors — reusable author profiles (name/avatar/role/socials) ───
authors.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM authors ORDER BY name COLLATE NOCASE ASC"
  ).all<D1Row>();
  return c.json({ authors: fromRows(results) });
});

// ── GET /api/authors/:id ──────────────────────────────────────────────────────
authors.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM authors WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/authors ─────────────────────────────────────────────────────────
authors.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.name) return c.json({ error: "name is required" }, 400);

  const id = newId();
  const now = nowIso();
  const doc = {
    name: body.name,
    avatarUrl: body.avatarUrl || "",
    role: body.role || "",
    socialLinks: body.socialLinks && typeof body.socialLinks === "object" ? body.socialLinks : {},
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare("INSERT INTO authors (id, name, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(id, doc.name, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Author created", `Name: ${doc.name}`);
  return c.json({ success: true, author: { _id: id, ...doc } }, 201);
});

// ── PUT /api/authors/:id ───────────────────────────────────────────────────────
authors.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM authors WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE authors SET name = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.name || "", JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Author updated", `ID: ${id}`);
  return c.json({ success: true, author: { _id: id, ...updatedDoc } });
});

// ── DELETE /api/authors/:id ────────────────────────────────────────────────────
authors.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const result = await db.prepare("DELETE FROM authors WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) return c.json({ error: "Not found" }, 404);

  await logActivity(db, user.email, "Author deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default authors;
