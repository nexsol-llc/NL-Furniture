import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const blogCategories = new Hono<{ Bindings: Env }>();

// Build a URL-safe slug. Strips Dutch diacritics so "Coördinatie" → "coordinatie"
// and "Meubelen à la carte" → "meubelen-a-la-carte". Note this deliberately does
// not use the German ö→oe expansion, which mangles Dutch diaeresis vowels.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── GET /api/blog-categories ──────────────────────────────────────────────────
// Public list (used by the admin blog dropdown and the public site).
blogCategories.get("/", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT id, data FROM blog_categories ORDER BY name ASC")
    .all<D1Row>();
  return c.json(fromRows(results));
});

// ── POST /api/blog-categories ─────────────────────────────────────────────────
blogCategories.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const name = String(body.name ?? "").trim();

  if (!name) return c.json({ error: "name is required" }, 400);
  const slug = slugify(name);
  if (!slug) return c.json({ error: "name must contain at least one letter or number" }, 400);

  const existing = await db
    .prepare("SELECT id FROM blog_categories WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first();
  if (existing) return c.json({ error: "Category already exists" }, 409);

  const id = newId();
  const now = nowIso();
  const doc = { name, slug, createdAt: now };

  await db
    .prepare("INSERT INTO blog_categories (id, slug, name, created_at, data) VALUES (?, ?, ?, ?, ?)")
    .bind(id, slug, name, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Blog category created", `Name: ${name}`);
  return c.json({ _id: id, ...doc }, 201);
});

// ── PUT /api/blog-categories/:id ──────────────────────────────────────────────
blogCategories.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const name = String(body.name ?? "").trim();

  if (!name) return c.json({ error: "name is required" }, 400);
  const slug = slugify(name);
  if (!slug) return c.json({ error: "name must contain at least one letter or number" }, 400);

  const existing = await db
    .prepare("SELECT id, data FROM blog_categories WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const dup = await db
    .prepare("SELECT id FROM blog_categories WHERE slug = ? AND id != ? LIMIT 1")
    .bind(slug, id)
    .first();
  if (dup) return c.json({ error: "Category already exists" }, 409);

  const updatedDoc = { ...JSON.parse(existing.data), name, slug, updatedAt: nowIso() };
  await db
    .prepare("UPDATE blog_categories SET slug = ?, name = ?, data = ? WHERE id = ?")
    .bind(slug, name, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Blog category updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

// ── DELETE /api/blog-categories/:id ───────────────────────────────────────────
blogCategories.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db.prepare("DELETE FROM blog_categories WHERE id = ?").bind(id).run();
  if (res.meta.changes === 0) return c.json({ error: "Not found" }, 404);

  await logActivity(db, user.email, "Blog category deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default blogCategories;
