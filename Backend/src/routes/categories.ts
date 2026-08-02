import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, productFromRow, productsFromRows, type D1Row, type ProductRow } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const categories = new Hono<{ Bindings: Env }>();

// ── GET /api/category/:slug — products in category (with pagination) ──────────
categories.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;

  const limit = Math.min(Number(c.req.query("limit") ?? "24"), 100);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  // Resolve catalog entry (checks slug AND aliases via json_each)
  const catalogRow = await db
    .prepare(
      `SELECT id, data FROM category_catalogs
       WHERE slug = ?
       OR EXISTS (SELECT 1 FROM json_each(aliases) WHERE value = ?)
       LIMIT 1`
    )
    .bind(slug, slug)
    .first<D1Row>();

  const catalogEntry = fromRow(catalogRow);

  const searchTerms: string[] = catalogEntry
    ? [
        catalogEntry.name,
        catalogEntry.slug,
        ...(catalogEntry.aliases ?? []),
        ...(catalogEntry.subcategories ?? []).flatMap((s: any) => [
          s.slug,
          s.name,
          ...(s.searchTerms ?? []),
        ]),
      ]
    : [slug];

  // Build OR conditions for all search terms
  const orConds: string[] = [];
  const binds: any[] = [];
  for (const term of searchTerms) {
    orConds.push("LOWER(category_name) LIKE LOWER(?)");
    binds.push(`%${term}%`);
    orConds.push("LOWER(merchant_category) LIKE LOWER(?)");
    binds.push(`%${term}%`);
  }

  const where = orConds.length ? `WHERE (${orConds.join(" OR ")})` : "";

  const [countRes, itemsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM products ${where}`).bind(...binds),
    db.prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset),
  ]);

  const total = (countRes.results[0] as any).n;
  const products = productsFromRows(itemsRes.results as ProductRow[]);

  return c.json({ products, total, page, pages: Math.ceil(total / limit), catalogEntry: catalogEntry ?? null });
});

// ── CategoryCatalog CRUD (/api/category-catalog) ──────────────────────────────
export const categoryCatalog = new Hono<{ Bindings: Env }>();

// Admin + public read this as a bare array.
categoryCatalog.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM category_catalogs ORDER BY json_extract(data, '$.name') ASC"
  ).all<D1Row>();
  return c.json(fromRows(results));
});

// Admin + public read { success, category }.
categoryCatalog.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const row = await c.env.DB.prepare(
    `SELECT id, data FROM category_catalogs
     WHERE slug = ? OR EXISTS (SELECT 1 FROM json_each(aliases) WHERE value = ?)
     LIMIT 1`
  ).bind(slug, slug).first<D1Row>();
  if (!row) return c.json({ error: "Catalog not found" }, 404);
  return c.json({ success: true, category: fromRow(row) });
});

categoryCatalog.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.slug || !body.name) {
    return c.json({ error: "slug and name are required" }, 400);
  }

  body.slug = body.slug.toLowerCase();
  const id = newId();
  const now = nowIso();
  const aliases = body.aliases ?? [];
  const doc = { ...body, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO category_catalogs (id, slug, aliases, data) VALUES (?, ?, ?, ?)"
    )
    .bind(id, body.slug, JSON.stringify(aliases), JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Category catalog created", `Slug: ${body.slug}`);
  // Admin reads saved.category.slug after creating.
  return c.json({ success: true, category: { _id: id, ...doc } }, 201);
});

categoryCatalog.put("/:slug", authMiddleware, requireStaff, async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM category_catalogs WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  if (body.slug) body.slug = body.slug.toLowerCase();
  const updatedDoc = { ...existingDoc, ...body, updatedAt: nowIso() };

  await db
    .prepare("UPDATE category_catalogs SET slug = ?, aliases = ?, data = ? WHERE id = ?")
    .bind(
      updatedDoc.slug ?? slug,
      JSON.stringify(updatedDoc.aliases ?? []),
      JSON.stringify(updatedDoc),
      existing.id
    )
    .run();

  await logActivity(db, user.email, "Category catalog updated", `Slug: ${slug}`);
  return c.json({ _id: existing.id, ...updatedDoc });
});

categoryCatalog.delete("/:slug", authMiddleware, requireAdmin, async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db.prepare("DELETE FROM category_catalogs WHERE slug = ?").bind(slug).run();
  if (res.meta.changes === 0) return c.json({ error: "Not found" }, 404);

  await logActivity(db, user.email, "Category catalog deleted", `Slug: ${slug}`);
  return c.json({ success: true });
});

// ── GET /api/sponsored/:categoryId — sponsored products for a category ────────
export const sponsored = new Hono<{ Bindings: Env }>();

sponsored.get("/:categoryId", async (c) => {
  const { categoryId } = c.req.param();
  const db = c.env.DB;

  // Try by id, then by slug
  let categoryRow = await db
    .prepare("SELECT id, data FROM categories WHERE id = ? LIMIT 1")
    .bind(categoryId)
    .first<D1Row>();

  if (!categoryRow) {
    categoryRow = await db
      .prepare("SELECT id, data FROM categories WHERE slug = ? LIMIT 1")
      .bind(categoryId)
      .first<D1Row>();
  }

  if (!categoryRow) return c.json({ sponsored: [] });

  const { results: sponsoredDocs } = await db
    .prepare(
      "SELECT id, data FROM sponsoreds WHERE category_id = ? ORDER BY position ASC"
    )
    .bind(categoryRow.id)
    .all<D1Row>();

  const productIds = sponsoredDocs.map((s) => JSON.parse(s.data).productId).filter(Boolean);
  if (!productIds.length) return c.json({ sponsored: [] });

  const placeholders = productIds.map(() => "?").join(", ");
  const { results: productRows } = await db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...productIds)
    .all<ProductRow>();

  return c.json({ sponsored: productsFromRows(productRows) });
});

// ── GET /api/sponsored-products — all sponsored ───────────────────────────────
export const sponsoredProducts = new Hono<{ Bindings: Env }>();

sponsoredProducts.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products WHERE is_sponsored = 1"
  ).all<ProductRow>();
  return c.json({ products: productsFromRows(results) });
});

sponsoredProducts.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const { productIds } = await c.req.json();
  const user = c.get("user");

  if (!Array.isArray(productIds)) {
    return c.json({ error: "productIds must be an array" }, 400);
  }

  // Clear all sponsored flags
  await db.prepare("UPDATE products SET is_sponsored = 0").run();

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => "?").join(", ");
    await db
      .prepare(`UPDATE products SET is_sponsored = 1 WHERE id IN (${placeholders})`)
      .bind(...productIds)
      .run();
  }

  await logActivity(db, user.email, "Sponsored products updated", `${productIds.length} Produkte`);
  return c.json({ success: true });
});

export default categories;
