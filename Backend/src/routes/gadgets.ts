import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const gadgets = new Hono<{ Bindings: Env }>();

gadgets.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM gadgets ORDER BY created_at DESC"
  ).all<D1Row>();
  // Both the admin panel and the public homepage consume this as a bare array.
  return c.json(fromRows(results));
});

gadgets.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM gadgets WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

gadgets.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const id = newId();
  const now = nowIso();
  const doc = { ...body, createdAt: now, updatedAt: now };

  await db
    .prepare("INSERT INTO gadgets (id, created_at, data) VALUES (?, ?, ?)")
    .bind(id, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Gadget created", body.title);
  return c.json({ success: true, id }, 201);
});

gadgets.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM gadgets WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE gadgets SET data = ? WHERE id = ?")
    .bind(JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Gadget updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

gadgets.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM gadgets WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Gadget deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default gadgets;
