import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";
import { mergeAuthorBox, loadAuthorsById } from "../lib/authorBox.js";

const brands = new Hono<{ Bindings: Env }>();

// ── GET /api/brands — all brands with their coupons ──────────────────────────
brands.get("/", async (c) => {
  const db = c.env.DB;
  const [{ results: brandRows }, authorsById] = await Promise.all([
    db.prepare("SELECT id, data FROM brands ORDER BY name ASC").all<D1Row>(),
    loadAuthorsById(db),
  ]);

  const brandsWithCoupons = await Promise.all(
    brandRows.map(async (brandRow) => {
      const brand = fromRow(brandRow)!;
      const { results: couponRows } = await db
        .prepare(
          "SELECT id, data FROM coupons WHERE brand_slug = ? ORDER BY is_expired ASC, position ASC, created_at DESC"
        )
        .bind(brand.slug)
        .all<D1Row>();
      return {
        ...brand,
        authorBox: mergeAuthorBox((brand as any).authorBox, authorsById),
        coupons: fromRows(couponRows),
      };
    })
  );

  return c.json({ brands: brandsWithCoupons });
});

// ── GET /api/brands/featured — paginated + searchable featured stores ────────
// Registered before /:slug so the static path wins.
brands.get("/featured", async (c) => {
  const db = c.env.DB;
  const search = (c.req.query("search") || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "12"), 1), 100);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const filterAll = c.req.query("filter") === "all";
  const where: string[] = [];
  const binds: any[] = [];
  if (!filterAll) where.push("json_extract(data, '$.featured') = 1");
  if (search) {
    where.push("(LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)");
    const term = `%${search}%`;
    binds.push(term, term);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[countRes, rowsRes], authorsById] = await Promise.all([
    db.batch([
      db.prepare(`SELECT COUNT(*) as n FROM brands ${whereSql}`).bind(...binds),
      db
        .prepare(`SELECT id, data FROM brands ${whereSql} ORDER BY name COLLATE NOCASE ASC LIMIT ? OFFSET ?`)
        .bind(...binds, limit, offset),
    ]),
    loadAuthorsById(db),
  ]);

  const total = Number((countRes.results[0] as any).n) || 0;
  const brands = fromRows(rowsRes.results as D1Row[]).map((brand: any) => ({
    ...brand,
    authorBox: mergeAuthorBox(brand.authorBox, authorsById),
  }));
  return c.json({
    brands,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    limit,
  });
});

// ── GET /api/brands/:slug — single brand ─────────────────────────────────────
brands.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;

  const [brandRow, authorsById] = await Promise.all([
    db.prepare("SELECT id, data FROM brands WHERE slug = ? LIMIT 1").bind(slug).first<D1Row>(),
    loadAuthorsById(db),
  ]);
  if (!brandRow) return c.json({ error: "Brand not found" }, 404);

  const brand = fromRow(brandRow)!;
  const { results: couponRows } = await db
    .prepare(
      "SELECT id, data FROM coupons WHERE brand_slug = ? ORDER BY is_expired ASC, position ASC, created_at DESC"
    )
    .bind(slug)
    .all<D1Row>();

  return c.json({
    brand: {
      ...brand,
      authorBox: mergeAuthorBox((brand as any).authorBox, authorsById),
      coupons: fromRows(couponRows),
    },
  });
});

// ── GET /api/brands/:slug/products ───────────────────────────────────────────
brands.get("/:slug/products", async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;

  // This endpoint backs the /merken/<slug> page, which is furniture-brand based,
  // so resolve the furniture brand directory first. Fall back to the coupon
  // brands table for slugs that only exist there.
  const furnitureRow = await db
    .prepare("SELECT id, data FROM furniture_brands WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<D1Row>();

  let brand: Record<string, any> | null = null;
  // Set for a furniture brand: products are matched by this id, not by name.
  let brandId = "";
  if (furnitureRow) {
    const doc = fromRow(furnitureRow)!;
    brand = { ...doc, name: doc.title };
    brandId = furnitureRow.id;
  } else {
    const brandRow = await db
      .prepare("SELECT id, data FROM brands WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first<D1Row>();
    brand = fromRow(brandRow);
    if (!brand) return c.json({ error: "Brand not found" }, 404);
  }

  const q = c.req.query();
  const limit = Math.min(Number(q.limit ?? "24"), 100);
  const page = Math.max(Number(q.page ?? "1"), 1);
  const offset = (page - 1) * limit;

  const sort = q.sort ?? "popular";
  const minPrice = q.minPrice ? Number(q.minPrice) : undefined;
  const maxPrice = q.maxPrice ? Number(q.maxPrice) : undefined;
  const onSale = q.onSale === "true";
  const categoriesParam = q.categories;

  // Base filter: products belonging to this brand. Prefer the brand_id link
  // (survives renames, uses idx_products_brand_id) and keep the name match for
  // rows that were never linked — feed brands not in the directory, and coupon
  // brands, which have no furniture_brands row at all.
  const brandFilter = brandId
    ? "(brand_id = ? OR (brand_id = '' AND brand_name = ? COLLATE NOCASE))"
    : "brand_name = ? COLLATE NOCASE";
  const brandBinds = brandId ? [brandId, brand.name] : [brand.name];
  const whereParts: string[] = [brandFilter];
  const binds: any[] = [...brandBinds];

  // Category filter — comma-separated, matched against category_name/merchant_category, OR-combined.
  if (categoriesParam) {
    const catList = categoriesParam.split(",").filter(Boolean);
    if (catList.length) {
      const catConds: string[] = [];
      for (const cat of catList) {
        catConds.push("(LOWER(category_name) LIKE LOWER(?) OR LOWER(merchant_category) LIKE LOWER(?))");
        binds.push(`%${cat}%`, `%${cat}%`);
      }
      whereParts.push(`(${catConds.join(" OR ")})`);
    }
  }

  // Price filters
  if (minPrice !== undefined) { whereParts.push("search_price >= ?"); binds.push(minPrice); }
  if (maxPrice !== undefined) { whereParts.push("search_price <= ?"); binds.push(maxPrice); }
  if (onSale) whereParts.push("search_price > 0");

  const where = `WHERE ${whereParts.join(" AND ")}`;

  let orderBy = "created_at DESC";
  if (sort === "price-asc") orderBy = "search_price ASC";
  else if (sort === "price-desc") orderBy = "search_price DESC";
  // Sponsored products always come first, regardless of the sort.
  orderBy = `is_sponsored DESC, ${orderBy}`;

  const [countRes, itemsRes, catsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM products ${where}`).bind(...binds),
    db.prepare(`SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, limit, offset),
    // Distinct categories for this brand (brand-scoped only, so the list stays stable).
    db
      .prepare(`SELECT DISTINCT category_name FROM products WHERE ${brandFilter} AND category_name != '' ORDER BY category_name ASC`)
      .bind(...brandBinds),
  ]);

  const total = (countRes.results[0] as any).n;
  const { productsFromRows } = await import("../db.js");
  const products = productsFromRows(itemsRes.results as any[]);
  const availableCategories = (catsRes.results as any[]).map((r) => r.category_name).filter(Boolean);

  const totalPages = Math.ceil(total / limit);
  return c.json({ brand, products, total, page, pages: totalPages, totalPages, availableCategories });
});

// ── POST /api/brands — create brand ──────────────────────────────────────────
brands.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const contentType = c.req.header("content-type") ?? "";

  let data: Record<string, any> = {};
  let logoUrl = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    try {
      data.faqs = data.faqs ? JSON.parse(data.faqs) : [];
    } catch {
      data.faqs = [];
    }
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const key = `brands/${Date.now()}-${logoFile.name.replace(/\s+/g, "-")}`;
      await c.env.IMAGES.put(key, logoFile.stream(), { httpMetadata: { contentType: logoFile.type } });
      logoUrl = `/uploads/${key}`;
    }
  } else {
    data = await c.req.json();
  }

  if (!data.name || !data.slug) {
    return c.json({ error: "name and slug are required" }, 400);
  }

  const id = newId();
  const now = nowIso();
  const doc = {
    name: data.name,
    slug: data.slug,
    logo: logoUrl || data.logo || "",
    url: data.url || "",
    description: data.description || "",
    shortDescription: data.shortDescription || "",
    longContent: data.longContent || "",
    contentImage: data.contentImage || "",
    verifiedCoupons: data.verifiedCoupons || "",
    avgSavings: data.avgSavings || "",
    totalOffers: data.totalOffers || "",
    lastUpdated: data.lastUpdated || new Date().toLocaleDateString("de-DE"),
    publishDate: data.publishDate || new Date().toLocaleDateString("de-DE"),
    featured: data.featured === true || data.featured === "true",
    faqs: data.faqs ?? [],
    tips: Array.isArray(data.tips) ? data.tips : [],
    authorBox: data.authorBox && typeof data.authorBox === "object" ? data.authorBox : {},
    seoTitle: data.seoTitle || "",
    seoDescription: data.seoDescription || "",
    seoKeywords: data.seoKeywords || "",
    canonicalUrl: data.canonicalUrl || "",
    ogImage: data.ogImage || "",
    sidebarText: data.sidebarText || "",
    createdAt: now,
    updatedAt: now,
  };

  // Upsert by slug — if a store/brand with this slug already exists, update it
  // instead of failing on the UNIQUE(slug) constraint.
  const existing = await db
    .prepare("SELECT id, data FROM brands WHERE slug = ? LIMIT 1")
    .bind(doc.slug)
    .first<D1Row>();

  if (existing) {
    const existingDoc = JSON.parse(existing.data);
    const merged = { ...existingDoc, ...doc, createdAt: existingDoc.createdAt ?? now, updatedAt: now };
    await db
      .prepare("UPDATE brands SET name = ?, data = ? WHERE id = ?")
      .bind(merged.name || existingDoc.name, JSON.stringify(merged), existing.id)
      .run();
    await logActivity(db, user.email, "Brand updated", `Marke: ${doc.name} (${doc.slug})`);
    return c.json({ success: true, brand: { _id: existing.id, ...merged } });
  }

  await db
    .prepare("INSERT INTO brands (id, slug, name, data) VALUES (?, ?, ?, ?)")
    .bind(id, doc.slug, doc.name, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Brand created", `Marke: ${data.name} (${data.slug})`);
  return c.json({ success: true, brand: { _id: id, ...doc } }, 201);
});

// ── PUT /api/brands/:slug — update brand ─────────────────────────────────────
brands.put("/:slug", authMiddleware, requireStaff, async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");
  const contentType = c.req.header("content-type") ?? "";

  let data: Record<string, any> = {};
  let logoUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    try {
      data.faqs = data.faqs ? JSON.parse(data.faqs) : undefined;
    } catch { /* ignore */ }

    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const key = `brands/${Date.now()}-${logoFile.name.replace(/\s+/g, "-")}`;
      await c.env.IMAGES.put(key, logoFile.stream(), { httpMetadata: { contentType: logoFile.type } });
      logoUrl = `/uploads/${key}`;
    }
  } else {
    data = await c.req.json();
  }

  const existing = await db
    .prepare("SELECT id, data FROM brands WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Brand not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const update: Record<string, any> = { ...data, updatedAt: nowIso() };
  if (logoUrl) update.logo = logoUrl;
  delete update.slug;

  const updatedDoc = { ...existingDoc, ...update };

  await db
    .prepare("UPDATE brands SET name = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.name || existingDoc.name, JSON.stringify(updatedDoc), existing.id)
    .run();

  await logActivity(db, user.email, "Brand updated", `Slug: ${slug}`);
  return c.json({ success: true, brand: { _id: existing.id, ...updatedDoc } });
});

// ── DELETE /api/brands/:slug ─────────────────────────────────────────────────
brands.delete("/:slug", authMiddleware, requireAdmin, async (c) => {
  const { slug } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const result = await db.prepare("DELETE FROM brands WHERE slug = ?").bind(slug).run();
  if (result.meta.changes === 0) return c.json({ error: "Brand not found" }, 404);

  await logActivity(db, user.email, "Brand deleted", `Slug: ${slug}`);
  return c.json({ success: true });
});

export default brands;
