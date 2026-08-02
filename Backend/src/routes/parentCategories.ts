import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── Parent Categories CRUD (/api/parent-categories) ────────────────────────
// Groups Category Catalog entries under a higher-level "parent" (e.g. a
// Category Catalog entry "Sofas" belongs to parent "Wohnzimmer"). Membership
// lives on the category itself (category_catalogs.data.parentCategoryId) —
// a single field, not a list — so a category can only ever belong to one
// parent at a time. Assign/unassign via the existing
// PUT /api/category-catalog/:slug endpoint with { parentCategoryId }.
const parentCategories = new Hono<{ Bindings: Env }>();

// Admin + public read this as a bare array, ordered for display.
parentCategories.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM parent_categories ORDER BY sort_order ASC, json_extract(data, '$.name') ASC"
  ).all<D1Row>();
  return c.json(fromRows(results));
});

parentCategories.get("/:id", async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM parent_categories WHERE id = ? OR slug = ? LIMIT 1"
  ).bind(id, id).first<D1Row>();
  if (!row) return c.json({ error: "Parent category not found" }, 404);
  return c.json({ success: true, parentCategory: fromRow(row) });
});

parentCategories.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.slug || !body.name) {
    return c.json({ error: "slug and name are required" }, 400);
  }

  const slug = String(body.slug).toLowerCase();
  const type = body.type === "outdoor" ? "outdoor" : "indoor";
  // A slug only needs to be unique within its own type — the same slug can
  // exist once as indoor and once as outdoor.
  const existing = await db
    .prepare("SELECT id FROM parent_categories WHERE slug = ? AND json_extract(data, '$.type') = ? LIMIT 1")
    .bind(slug, type)
    .first<{ id: string }>();
  if (existing) return c.json({ error: "A parent category with this slug and type already exists" }, 409);

  const id = newId();
  const now = nowIso();
  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0;
  const doc = { ...body, slug, type, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO parent_categories (id, slug, sort_order, created_at, data) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, slug, sortOrder, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Parent category created", `Slug: ${slug}`);
  return c.json({ success: true, parentCategory: { _id: id, ...doc } }, 201);
});

parentCategories.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM parent_categories WHERE id = ? OR slug = ? LIMIT 1")
    .bind(id, id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const nextSlug = body.slug ? String(body.slug).toLowerCase() : existingDoc.slug;
  const nextType = body.type === "outdoor" ? "outdoor" : body.type === "indoor" ? "indoor" : (existingDoc.type ?? "indoor");

  // A slug only needs to be unique within its own type — the same slug can
  // exist once as indoor and once as outdoor.
  if (body.slug !== undefined || body.type !== undefined) {
    const clash = await db
      .prepare("SELECT id FROM parent_categories WHERE slug = ? AND json_extract(data, '$.type') = ? AND id != ? LIMIT 1")
      .bind(nextSlug, nextType, existing.id)
      .first<{ id: string }>();
    if (clash) return c.json({ error: "A parent category with this slug and type already exists" }, 409);
  }

  const updatedDoc = { ...existingDoc, ...body, slug: nextSlug, type: nextType, updatedAt: nowIso() };
  const sortOrder = Number.isFinite(updatedDoc.sortOrder) ? Number(updatedDoc.sortOrder) : 0;

  await db
    .prepare("UPDATE parent_categories SET slug = ?, sort_order = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.slug, sortOrder, JSON.stringify(updatedDoc), existing.id)
    .run();

  await logActivity(db, user.email, "Parent category updated", `Slug: ${updatedDoc.slug}`);
  return c.json({ success: true, parentCategory: { _id: existing.id, ...updatedDoc } });
});

parentCategories.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM parent_categories WHERE id = ? OR slug = ? LIMIT 1")
    .bind(id, id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  // Unassign any categories pointing at this parent before deleting it, so
  // no category_catalogs entry is left referencing a dangling parent id.
  await db
    .prepare(
      "UPDATE category_catalogs SET data = json_set(data, '$.parentCategoryId', NULL) WHERE json_extract(data, '$.parentCategoryId') = ?"
    )
    .bind(existing.id)
    .run();

  await db.prepare("DELETE FROM parent_categories WHERE id = ?").bind(existing.id).run();

  const { slug } = JSON.parse(existing.data);
  await logActivity(db, user.email, "Parent category deleted", `Slug: ${slug}`);
  return c.json({ success: true });
});

export default parentCategories;
