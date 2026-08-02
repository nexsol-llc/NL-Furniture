import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";
import { mergeAuthorBox, loadAuthorsById } from "../lib/authorBox.js";

const coupons = new Hono<{ Bindings: Env }>();

// ── GET /api/coupons ─────────────────────────────────────────────────────────
coupons.get("/", async (c) => {
  const db = c.env.DB;
  const brandSlug = c.req.query("brandSlug");
  const brand = c.req.query("brand");

  let sql = "SELECT id, data FROM coupons";
  const binds: any[] = [];
  const conditions: string[] = [];

  if (brandSlug) { conditions.push("brand_slug = ?"); binds.push(brandSlug); }
  if (brand) { conditions.push("json_extract(data, '$.brand') = ?"); binds.push(brand); }
  if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
  sql += " ORDER BY is_expired ASC, position ASC, created_at DESC";

  const { results } = await db.prepare(sql).bind(...binds).all<D1Row>();
  return c.json({ coupons: fromRows(results) });
});

// ── GET /api/coupons/featured — paginated + searchable featured coupons ──────
// Joins the brand row so the client gets a logo/name without an extra request.
// Registered before /:id so the static path wins.
coupons.get("/featured", async (c) => {
  const db = c.env.DB;
  const search = (c.req.query("search") || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "12"), 1), 100);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const includeExpired = c.req.query("includeExpired") === "1";

  const filterAll = c.req.query("filter") === "all";
  const where: string[] = [];
  const binds: any[] = [];
  if (!filterAll) where.push("json_extract(cp.data, '$.featured') = 1");
  if (!includeExpired) where.push("cp.is_expired = 0");
  if (search) {
    const term = `%${search}%`;
    where.push(
      "(LOWER(cp.code) LIKE ? OR LOWER(json_extract(cp.data, '$.title')) LIKE ? OR LOWER(cp.brand_slug) LIKE ? OR LOWER(json_extract(cp.data, '$.brand')) LIKE ?)"
    );
    binds.push(term, term, term, term);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRes, rowsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM coupons cp ${whereSql}`).bind(...binds),
    db
      .prepare(
        `SELECT cp.id as id, cp.data as data, b.data as brand_data
         FROM coupons cp
         LEFT JOIN brands b ON b.slug = cp.brand_slug
         ${whereSql}
         ORDER BY cp.is_expired ASC, cp.position ASC, cp.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...binds, limit, offset),
  ]);

  const total = Number((countRes.results[0] as any).n) || 0;
  const items = (rowsRes.results as any[]).map((row) => {
    const coupon = { _id: row.id, ...JSON.parse(row.data) };
    const brand = row.brand_data ? JSON.parse(row.brand_data) : null;
    return { ...coupon, brandLogo: brand?.logo || "", brandName: brand?.name || coupon.brand || "" };
  });

  return c.json({
    coupons: items,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    limit,
  });
});

// ── GET /api/coupons/:id ─────────────────────────────────────────────────────
coupons.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM coupons WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/coupons ────────────────────────────────────────────────────────
coupons.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const {
    title, description, shortDescription, discount, discountText,
    brand, brandSlug, url, type, couponType,
    verified, savedAmount, avgSaving,
    badge, isTopOffer, position, isExpired,
    expiresAt, category, likesBase, dislikesBase,
  } = body;

  const code = body.code || title;
  const isSale = couponType === "sale" || type === "sale";
  const isFreeShipping = type === "free-shipping";

  if (!code || !brand || !title || !brandSlug || !url) {
    return c.json({ error: "code, brand, title, brandSlug en url zijn verplicht." }, 400);
  }
  if (!isFreeShipping && !isSale && !discount && !discountText) {
    return c.json({ error: "discount of discountText is verplicht." }, 400);
  }

  const id = newId();
  const now = nowIso();
  const positionNum = position !== undefined ? Number(position) : 999;
  const expiredBool = !!isExpired;

  const doc = {
    code,
    discount: discount ? Number(discount) : undefined,
    discountText: discountText || undefined,
    brand,
    title,
    description,
    shortDescription: shortDescription || "",
    brandSlug,
    url,
    type: type || "deal",
    couponType: couponType || (isSale ? "sale" : "code"),
    verified: verified || "Today",
    savedAmount: savedAmount || "€0",
    avgSaving: avgSaving || "€0",
    badge: badge || "",
    isTopOffer: !!isTopOffer,
    featured: !!body.featured,
    position: positionNum,
    isExpired: expiredBool,
    expiresAt: expiresAt || null,
    category: category || "",
    likesBase: likesBase ? Number(likesBase) : 0,
    dislikesBase: dislikesBase ? Number(dislikesBase) : 0,
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare(
      "INSERT INTO coupons (id, code, brand_slug, is_expired, position, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, code, brandSlug, expiredBool ? 1 : 0, positionNum, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Coupon created", `Code: ${code}, Marke: ${brand}`);
  return c.json({ _id: id, ...doc }, 201);
});

// ── PUT /api/coupons — update by code (backward-compat) ─────────────────────
coupons.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const { code } = body;
  if (!code) return c.json({ error: "code is verplicht." }, 400);

  const existing = await db
    .prepare("SELECT id, data FROM coupons WHERE code = ? LIMIT 1")
    .bind(code)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Coupon not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const update: Record<string, any> = { ...body, updatedAt: nowIso() };
  if (update.discount) update.discount = Number(update.discount);
  if (update.position !== undefined) update.position = Number(update.position);

  const updatedDoc = { ...existingDoc, ...update };

  await db
    .prepare(
      "UPDATE coupons SET is_expired = ?, position = ?, data = ? WHERE id = ?"
    )
    .bind(
      updatedDoc.isExpired ? 1 : 0,
      updatedDoc.position ?? existingDoc.position,
      JSON.stringify(updatedDoc),
      existing.id
    )
    .run();

  await logActivity(db, user.email, "Coupon updated", `Code: ${code}`);
  return c.json({ success: true, coupon: { _id: existing.id, ...updatedDoc } });
});

// ── PUT /api/coupons/:id — update by id ─────────────────────────────────────
coupons.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM coupons WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const update: Record<string, any> = { ...body, updatedAt: nowIso() };
  if (update.discount !== undefined) update.discount = Number(update.discount);
  if (update.position !== undefined) update.position = Number(update.position);

  const updatedDoc = { ...existingDoc, ...update };

  await db
    .prepare("UPDATE coupons SET is_expired = ?, position = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.isExpired ? 1 : 0, updatedDoc.position ?? existingDoc.position, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Coupon updated", `ID: ${id}`);
  return c.json({ success: true, coupon: { _id: id, ...updatedDoc } });
});

// ── PATCH /api/coupons/:id — partial update ──────────────────────────────────
coupons.patch("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();

  const existing = await db
    .prepare("SELECT id, data FROM coupons WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const allowed = ["isExpired", "position", "isTopOffer", "badge", "featured"];
  const patch: Record<string, any> = { updatedAt: nowIso() };
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updatedDoc = { ...existingDoc, ...patch };

  await db
    .prepare("UPDATE coupons SET is_expired = ?, position = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.isExpired ? 1 : 0, updatedDoc.position ?? existingDoc.position, JSON.stringify(updatedDoc), id)
    .run();

  return c.json({ success: true, coupon: { _id: id, ...updatedDoc } });
});

// ── DELETE /api/coupons — delete by ?code= ───────────────────────────────────
coupons.delete("/", authMiddleware, requireAdmin, async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ error: "code query param is required" }, 400);

  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM coupons WHERE code = ?").bind(code).run();
  await logActivity(db, user.email, "Coupon deleted", `Code: ${code}`);
  return c.json({ success: true });
});

// ── DELETE /api/coupons/:id ──────────────────────────────────────────────────
coupons.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM coupons WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Coupon deleted", `ID: ${id}`);
  return c.json({ success: true });
});

// ── GET /api/coupon-stores — brands with at least one coupon ──────────────────
export const couponStores = new Hono<{ Bindings: Env }>();

couponStores.get("/", async (c) => {
  const db = c.env.DB;

  // Every brand is a store (with or without coupons). Fetch all brands + active
  // coupon counts in two queries, then join in memory.
  const [[brandsRes, countsRes], authorsById] = await Promise.all([
    db.batch([
      db.prepare("SELECT id, data FROM brands ORDER BY name ASC"),
      db.prepare("SELECT brand_slug, COUNT(*) as n FROM coupons WHERE is_expired = 0 GROUP BY brand_slug"),
    ]),
    loadAuthorsById(db),
  ]);

  const countMap = new Map<string, number>();
  for (const r of countsRes.results as any[]) countMap.set(r.brand_slug, r.n);

  const result = (brandsRes.results as D1Row[]).map((row) => {
    const brand = fromRow(row)!;
    return {
      ...brand,
      authorBox: mergeAuthorBox((brand as any).authorBox, authorsById),
      couponCount: countMap.get(brand.slug) ?? 0,
    };
  });

  // The admin page reads `brands`; keep `stores` too for any other consumer.
  return c.json({ brands: result, stores: result });
});

// ── /api/coupon-special-offers ────────────────────────────────────────────────
export const couponSpecialOffers = new Hono<{ Bindings: Env }>();

couponSpecialOffers.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM coupon_special_offers WHERE is_active = 1 ORDER BY position ASC, created_at DESC"
  ).all<D1Row>();
  return c.json({ offers: fromRows(results) });
});

couponSpecialOffers.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM coupon_special_offers WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

couponSpecialOffers.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.logo || !body.title || !body.sale || !body.link) {
    return c.json({ error: "logo, title, sale en link zijn verplicht." }, 400);
  }

  const id = newId();
  const now = nowIso();
  const positionNum = body.position ?? 999;
  const isActive = body.isActive !== false ? 1 : 0;
  const doc = { ...body, position: positionNum, isActive: isActive === 1, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO coupon_special_offers (id, position, is_active, created_at, data) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, positionNum, isActive, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Special offer created", body.title);
  return c.json({ success: true, id }, 201);
});

couponSpecialOffers.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM coupon_special_offers WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE coupon_special_offers SET position = ?, is_active = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.position ?? 999, updatedDoc.isActive !== false ? 1 : 0, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Special offer updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

couponSpecialOffers.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM coupon_special_offers WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Special offer deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default coupons;
