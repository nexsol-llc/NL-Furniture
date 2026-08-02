import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── /api/coupon-brand-products — per-brand product showcase ──────────────────
// Same shape as top_angebote_products (Backend/src/routes/topAngebote.ts) but
// keyed by brand_slug instead of a free-text category.
export const couponBrandProducts = new Hono<{ Bindings: Env }>();

couponBrandProducts.get("/", async (c) => {
  const brandSlug = c.req.query("brandSlug");
  const sql = brandSlug
    ? "SELECT id, data FROM coupon_brand_products WHERE brand_slug = ? ORDER BY sort_order ASC, created_at DESC"
    : "SELECT id, data FROM coupon_brand_products ORDER BY sort_order ASC, created_at DESC";
  const { results } = await c.env.DB.prepare(sql).bind(...(brandSlug ? [brandSlug] : [])).all<D1Row>();
  // Consumed as a bare array by the admin panel and the public brand page.
  return c.json(fromRows(results));
});

couponBrandProducts.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM coupon_brand_products WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

couponBrandProducts.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.brandSlug || !body.title) {
    return c.json({ error: "brandSlug and title are required" }, 400);
  }

  const id = newId();
  const now = nowIso();
  const sortOrder = body.sortOrder ?? 0;
  const doc = { ...body, sortOrder, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO coupon_brand_products (id, brand_slug, sort_order, created_at, data) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, body.brandSlug, sortOrder, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Coupon brand product created", `${body.brandSlug}: ${body.title}`);
  return c.json({ success: true, id }, 201);
});

couponBrandProducts.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM coupon_brand_products WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE coupon_brand_products SET brand_slug = ?, sort_order = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.brandSlug ?? "", updatedDoc.sortOrder ?? 0, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Coupon brand product updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

couponBrandProducts.delete("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM coupon_brand_products WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Coupon brand product deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default couponBrandProducts;
