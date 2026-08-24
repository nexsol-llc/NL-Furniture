import { Hono } from "hono";
import { Env } from "../types.js";
import { fromRow, fromRows, productFromRow, productsFromRows, newId, nowIso, type D1Row, type ProductRow } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";
import { slugify, ensureUniqueSlug } from "../lib/slug.js";
import { loadBrandIndex, resolveBrand, type BrandIndex } from "../lib/brandIndex.js";

const products = new Hono<{ Bindings: Env }>();

// ── GET /api/product/:id ─────────────────────────────────────────────────────
products.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;

  let row: ProductRow | null = null;

  // Try UUID id first
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    row = await db.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").bind(id).first<ProductRow>();
  }

  // Try numeric aw_product_id
  if (!row) {
    const numId = Number(id);
    if (!Number.isNaN(numId)) {
      row = await db
        .prepare("SELECT * FROM products WHERE aw_product_id = ? LIMIT 1")
        .bind(numId)
        .first<ProductRow>();
    }
  }

  // Try slug
  if (!row) {
    row = await db
      .prepare("SELECT * FROM products WHERE slug = ? ORDER BY created_at ASC LIMIT 1")
      .bind(id.toLowerCase())
      .first<ProductRow>();
  }

  if (!row) return c.json({ error: "Product not found" }, 404);

  let product = productFromRow(row)!;

  // Resolve brand logo from brands
  if (product.brand_name) {
    const brandRow = await db
      .prepare("SELECT id, data FROM brands WHERE LOWER(name) = LOWER(?) LIMIT 1")
      .bind(product.brand_name)
      .first<D1Row>();
    if (brandRow) {
      const brand = fromRow(brandRow)!;
      product = { ...product, brandLogo: brand.logo, brandSlug: brand.slug };
    }
  }

  return c.json(product);
});

// ── GET /api/products-by-category ────────────────────────────────────────────
products.get("/", async (c) => {
  const db = c.env.DB;
  const q = c.req.query();

  const category = q.category;
  const searchTermsParam = q.searchTerms;
  const page = Math.max(Number(q.page ?? "1"), 1);
  const limit = Math.min(Number(q.limit ?? "24"), 100);
  const sort = q.sort ?? "popular";
  const brandsParam = q.brands;
  const minPrice = q.minPrice ? Number(q.minPrice) : undefined;
  const maxPrice = q.maxPrice ? Number(q.maxPrice) : undefined;
  const onSale = q.onSale === "true";
  // "Featured" products reuse the sponsored flag (curated via the admin product editor).
  const featuredOnly = q.featured === "true";

  const whereParts: string[] = [];
  const binds: any[] = [];

  // Category / search terms — combined with OR
  const orConds: string[] = [];

  if (category) {
    // Resolve the slug/alias to its catalog entry so we match the human-readable
    // category_name/merchant_category (e.g. slug "aussenbeleuchtung-zubehoer" →
    // "Außenbeleuchtung & Zubehör") rather than the literal slug, which fails for
    // names with umlauts, "&" or spaces. Falls back to a literal match if the
    // slug isn't a configured catalog.
    const catalogRow = await db
      .prepare(
        `SELECT id, data FROM category_catalogs
         WHERE slug = ? OR EXISTS (SELECT 1 FROM json_each(aliases) WHERE value = ?)
         LIMIT 1`
      )
      .bind(category, category)
      .first<D1Row>();

    const catTerms: string[] = [];
    if (catalogRow) {
      const doc = JSON.parse(catalogRow.data);
      for (const t of [doc.name, doc.slug, ...(Array.isArray(doc.aliases) ? doc.aliases : [])]) {
        if (t) catTerms.push(String(t));
      }
      for (const s of Array.isArray(doc.childCategories) ? doc.childCategories : []) {
        for (const t of [s?.name, s?.slug, ...(Array.isArray(s?.searchTerms) ? s.searchTerms : [])]) {
          if (t) catTerms.push(String(t));
        }
      }
    }
    if (catTerms.length === 0) catTerms.push(category);

    for (const term of catTerms) {
      orConds.push("LOWER(category_name) LIKE LOWER(?)");
      binds.push(`%${term}%`);
      orConds.push("LOWER(merchant_category) LIKE LOWER(?)");
      binds.push(`%${term}%`);
    }
  }

  if (searchTermsParam) {
    for (const term of searchTermsParam.split(",").filter(Boolean)) {
      orConds.push("LOWER(category_name) LIKE LOWER(?)");
      binds.push(`%${term}%`);
      orConds.push("LOWER(merchant_category) LIKE LOWER(?)");
      binds.push(`%${term}%`);
      orConds.push("LOWER(product_name) LIKE LOWER(?)");
      binds.push(`%${term}%`);
    }
  }

  if (orConds.length) whereParts.push(`(${orConds.join(" OR ")})`);

  // Brand filter
  if (brandsParam) {
    const brandList = brandsParam.split(",").filter(Boolean);
    const brandConds = brandList.map(() => "LOWER(brand_name) = LOWER(?)").join(" OR ");
    whereParts.push(`(${brandConds})`);
    binds.push(...brandList);
  }

  // Price filters
  if (minPrice !== undefined) { whereParts.push("search_price >= ?"); binds.push(minPrice); }
  if (maxPrice !== undefined) { whereParts.push("search_price <= ?"); binds.push(maxPrice); }
  if (onSale) whereParts.push("search_price > 0");
  if (featuredOnly) whereParts.push("is_sponsored = 1");

  const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  let orderBy = "created_at DESC";
  if (sort === "price-asc") orderBy = "search_price ASC";
  else if (sort === "price-desc") orderBy = "search_price DESC";

  // Sponsored products always come first (1st row), regardless of the sort.
  orderBy = `is_sponsored DESC, ${orderBy}`;

  const offset = (page - 1) * limit;

  const [countRes, itemsRes, brandsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM products ${where}`).bind(...binds),
    db.prepare(`SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, limit, offset),
    db.prepare(`SELECT DISTINCT brand_name FROM products ${where} ORDER BY brand_name ASC`).bind(...binds),
  ]);

  const total = (countRes.results[0] as any).n;
  const items = productsFromRows(itemsRes.results as ProductRow[]);
  const availableBrands = (brandsRes.results as any[]).map((r) => r.brand_name).filter(Boolean);

  return c.json({ products: items, total, page, pages: Math.ceil(total / limit), availableBrands });
});

// ── /api/products — admin CRUD + rich filtering ───────────────────────────────
export const productsAdmin = new Hono<{ Bindings: Env }>();

const toStr = (v: any): string => (v == null ? "" : String(v).trim());
const toNumOrNull = (v: any): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// Full ordered column list (excluding id/created_at/updated_at).
const PRODUCT_COLUMNS = [
  "aw_product_id", "product_name", "aw_deep_link", "merchant_deep_link", "merchant_product_id",
  "merchant_image_url", "description", "merchant_category", "search_price", "merchant_name",
  "merchant_id", "category_name", "aw_image_url", "display_price", "data_feed_id", "brand_name", "brand_id",
  "colour", "product_short_description", "aw_thumb_url", "delivery_cost", "alternate_image",
  "alternate_image_two", "alternate_image_three", "alternate_image_four", "is_sponsored", "slug",
] as const;

// Normalize a request body (optionally merged over an existing row) into column values.
// `brands` is the directory used to settle brand_id/brand_name; without it the
// row keeps whatever brand name it was given and stays unlinked.
function buildProductValues(
  body: Record<string, any>,
  existing?: ProductRow,
  brands?: BrandIndex
): Record<string, any> {
  const pick = (k: string) => (body[k] !== undefined ? body[k] : existing ? (existing as any)[k] : undefined);
  const textFields = [
    "product_name", "aw_deep_link", "merchant_deep_link", "merchant_product_id", "merchant_image_url",
    "description", "merchant_category", "merchant_name", "category_name", "aw_image_url", "display_price",
    "brand_name", "brand_id", "colour", "product_short_description", "aw_thumb_url", "delivery_cost",
    "alternate_image", "alternate_image_two", "alternate_image_three", "alternate_image_four",
  ];
  const v: Record<string, any> = {};
  for (const f of textFields) v[f] = toStr(pick(f));
  // brand_id is the link to the furniture brand directory; brand_name is the
  // denormalized label kept in step with it. Only what the request actually sent
  // is resolved — reading brand_id back off `existing` would pin the product to
  // its old brand and make "change the brand by name" impossible. When the body
  // mentions neither, the pair carried over by pick() stands.
  const sentBrandId = body.brand_id !== undefined;
  const sentBrandName = body.brand_name !== undefined;
  if (brands && (sentBrandId || sentBrandName)) {
    const brand = resolveBrand(
      brands,
      sentBrandId ? toStr(body.brand_id) : "",
      sentBrandName ? toStr(body.brand_name) : toStr(existing?.brand_name)
    );
    v.brand_id = brand.brand_id;
    v.brand_name = brand.brand_name;
  }
  v.aw_product_id = toNumOrNull(pick("aw_product_id"));
  v.merchant_id = toNumOrNull(pick("merchant_id"));
  v.data_feed_id = toNumOrNull(pick("data_feed_id"));
  v.search_price = Number(pick("search_price")) || 0;
  v.is_sponsored = pick("is_sponsored") ? 1 : 0;
  // Auto-fill a display price from the numeric price when none is given.
  if (!v.display_price && v.search_price > 0) v.display_price = `EUR${v.search_price}`;
  // Slug: sanitize a provided one, keep the existing one on update, otherwise
  // derive it from the product name.
  v.slug = slugify(toStr(body.slug) || toStr(existing?.slug) || v.product_name);
  return v;
}

// GET /api/products — filter by category, childCategory, brand and price range.
productsAdmin.get("/", async (c) => {
  const db = c.env.DB;
  const q = c.req.query();
  const page = Math.max(Number(q.page ?? "1"), 1);
  const limit = Math.min(Number(q.limit ?? "24"), 100);
  const sort = q.sort ?? "recent";

  const whereParts: string[] = [];
  const binds: any[] = [];

  if (q.category) { whereParts.push("(LOWER(category_name) LIKE LOWER(?) OR LOWER(merchant_category) LIKE LOWER(?))"); binds.push(`%${q.category}%`, `%${q.category}%`); }
  if (q.childCategory) { whereParts.push("(LOWER(merchant_category) LIKE LOWER(?) OR LOWER(product_name) LIKE LOWER(?))"); binds.push(`%${q.childCategory}%`, `%${q.childCategory}%`); }
  if (q.brand) { whereParts.push("LOWER(brand_name) = LOWER(?)"); binds.push(q.brand); }
  if (q.merchant) { whereParts.push("LOWER(merchant_name) = LOWER(?)"); binds.push(q.merchant); }
  if (q.search) { whereParts.push("(LOWER(product_name) LIKE LOWER(?) OR LOWER(brand_name) LIKE LOWER(?))"); binds.push(`%${q.search}%`, `%${q.search}%`); }
  if (q.minPrice) { whereParts.push("search_price >= ?"); binds.push(Number(q.minPrice)); }
  if (q.maxPrice) { whereParts.push("search_price <= ?"); binds.push(Number(q.maxPrice)); }

  const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  let orderBy = "created_at DESC";
  if (sort === "price-asc") orderBy = "search_price ASC";
  else if (sort === "price-desc") orderBy = "search_price DESC";
  else if (sort === "name") orderBy = "product_name COLLATE NOCASE ASC";

  const offset = (page - 1) * limit;
  const [countRes, itemsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM products ${where}`).bind(...binds),
    db.prepare(`SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, limit, offset),
  ]);

  const total = (countRes.results[0] as any).n;
  return c.json({
    products: productsFromRows(itemsRes.results as ProductRow[]),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /api/products/filters — distinct brands + categories for filter dropdowns.
productsAdmin.get("/filters", async (c) => {
  const db = c.env.DB;
  const [brandsRes, catsRes] = await db.batch([
    db.prepare("SELECT DISTINCT brand_name FROM products WHERE brand_name != '' ORDER BY brand_name ASC"),
    db.prepare("SELECT DISTINCT category_name FROM products WHERE category_name != '' ORDER BY category_name ASC"),
  ]);
  return c.json({
    brands: (brandsRes.results as any[]).map((r) => r.brand_name).filter(Boolean),
    categories: (catsRes.results as any[]).map((r) => r.category_name).filter(Boolean),
  });
});

// GET /api/products/search — full-text-ish product search.
// Multi-word (all terms must match), searches across name/brand/description/category/merchant,
// relevance-ranked (name > brand > other), paginated, with optional brand/category/price filters.
productsAdmin.get("/search", async (c) => {
  const db = c.env.DB;
  const q = c.req.query();
  const query = (q.q ?? q.query ?? "").trim();
  const page = Math.max(Number(q.page ?? "1"), 1);
  const limit = Math.min(Number(q.limit ?? "24"), 100);

  if (!query) {
    return c.json({ products: [], total: 0, page, pages: 0, query: "" });
  }

  const SEARCH_FIELDS = [
    "product_name", "brand_name", "description", "product_short_description",
    "category_name", "merchant_category", "merchant_name", "colour",
  ];

  const whereParts: string[] = [];
  const binds: any[] = [];

  // Each whitespace-separated term must appear in at least one field (AND across terms).
  const tokens = query.split(/\s+/).filter(Boolean).slice(0, 8);
  for (const token of tokens) {
    const like = `%${token}%`;
    whereParts.push(`(${SEARCH_FIELDS.map((f) => `${f} LIKE ? COLLATE NOCASE`).join(" OR ")})`);
    binds.push(...SEARCH_FIELDS.map(() => like));
  }

  // Optional filters
  if (q.brand) { whereParts.push("brand_name = ? COLLATE NOCASE"); binds.push(q.brand); }
  if (q.category) { whereParts.push("(category_name LIKE ? COLLATE NOCASE OR merchant_category LIKE ? COLLATE NOCASE)"); binds.push(`%${q.category}%`, `%${q.category}%`); }
  if (q.minPrice) { whereParts.push("search_price >= ?"); binds.push(Number(q.minPrice)); }
  if (q.maxPrice) { whereParts.push("search_price <= ?"); binds.push(Number(q.maxPrice)); }

  const where = `WHERE ${whereParts.join(" AND ")}`;

  // Ordering: explicit price sort, otherwise relevance (whole-query name match first).
  const sort = q.sort;
  let orderBy: string;
  let orderBinds: any[] = [];
  if (sort === "price-asc") orderBy = "search_price ASC";
  else if (sort === "price-desc") orderBy = "search_price DESC";
  else if (sort === "name") orderBy = "product_name COLLATE NOCASE ASC";
  else {
    orderBy = `(CASE WHEN product_name LIKE ? COLLATE NOCASE THEN 0 WHEN brand_name LIKE ? COLLATE NOCASE THEN 1 ELSE 2 END), search_price ASC`;
    orderBinds = [`%${query}%`, `%${query}%`];
  }

  const offset = (page - 1) * limit;
  const [countRes, itemsRes] = await db.batch([
    db.prepare(`SELECT COUNT(*) as n FROM products ${where}`).bind(...binds),
    db.prepare(`SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, ...orderBinds, limit, offset),
  ]);

  const total = (countRes.results[0] as any).n;
  return c.json({
    products: productsFromRows(itemsRes.results as ProductRow[]),
    total,
    page,
    pages: Math.ceil(total / limit),
    query,
  });
});

// GET /api/products/:id — single product (admin edit).
productsAdmin.get("/:id", async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM products WHERE id = ? LIMIT 1")
    .bind(c.req.param("id")).first<ProductRow>();
  if (!row) return c.json({ error: "Product not found" }, 404);
  return c.json({ success: true, product: productFromRow(row) });
});

// POST /api/products — create a manual product.
productsAdmin.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();

  if (!toStr(body.product_name)) return c.json({ error: "product_name is required" }, 400);

  const v = buildProductValues(body, undefined, await loadBrandIndex(db));
  v.slug = await ensureUniqueSlug(db, v.slug);
  const id = newId();
  const now = nowIso();
  const placeholders = PRODUCT_COLUMNS.map(() => "?").join(", ");

  try {
    await db
      .prepare(
        `INSERT INTO products (id, ${PRODUCT_COLUMNS.join(", ")}, created_at, updated_at)
         VALUES (?, ${placeholders}, ?, ?)`
      )
      .bind(id, ...PRODUCT_COLUMNS.map((k) => v[k]), now, now)
      .run();
  } catch (err: any) {
    if (String(err?.message || "").includes("UNIQUE")) {
      return c.json({ error: "A product with this aw_product_id already exists" }, 409);
    }
    throw err;
  }

  await logActivity(db, user.email, "Product created", v.product_name);
  const row = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first<ProductRow>();
  return c.json({ success: true, product: productFromRow(row) }, 201);
});

// POST /api/products/bulk — upsert a chunk of products (client parses the CSV and
// sends manageable JSON batches, so we never parse a 10MB body in one request).
productsAdmin.post("/bulk", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const rows: any[] = Array.isArray(body?.products) ? body.products : [];
  if (!rows.length) return c.json({ error: "No products provided" }, 400);
  if (rows.length > 1000) return c.json({ error: "Chunk too large (max 1000 per request)" }, 400);

  const now = nowIso();
  // Loaded once for the whole chunk — brand resolution is a map lookup per row.
  const brands = await loadBrandIndex(db);
  const insertCols = ["id", ...PRODUCT_COLUMNS, "created_at", "updated_at"];
  const placeholders = insertCols.map(() => "?").join(", ");
  const updateSet =
    PRODUCT_COLUMNS.filter((col) => col !== "aw_product_id" && col !== "slug")
      .map((col) => `${col} = excluded.${col}`)
      // Keep an already-assigned slug stable across re-imports (stable URLs).
      .join(", ") + ", slug = CASE WHEN products.slug != '' THEN products.slug ELSE excluded.slug END" +
    ", updated_at = excluded.updated_at";

  let inserted = 0;
  let updated = 0;
  const usedSlugs = new Set<string>();
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const values = chunk.map((r) => buildProductValues(r, undefined, brands));

    // De-duplicate the chunk's slugs against the DB and this request. Rows that
    // update an existing product keep their old slug anyway (see updateSet), so
    // a suffix added for those is never written.
    const bases = Array.from(new Set(values.map((v) => v.slug).filter(Boolean)));
    if (bases.length) {
      const { results } = await db
        .prepare(`SELECT slug FROM products WHERE slug IN (${bases.map(() => "?").join(", ")})`)
        .bind(...bases)
        .all<{ slug: string }>();
      for (const r of results) usedSlugs.add(r.slug);
    }
    for (const v of values) {
      if (!v.slug) continue;
      if (usedSlugs.has(v.slug)) {
        let n = 2;
        while (usedSlugs.has(`${v.slug}-${n}`)) n++;
        v.slug = `${v.slug}-${n}`;
      }
      usedSlugs.add(v.slug);
    }

    const stmts = values.map((v) => {
      return db
        .prepare(
          `INSERT INTO products (${insertCols.join(", ")}) VALUES (${placeholders})
           ON CONFLICT(aw_product_id) DO UPDATE SET ${updateSet}`
        )
        .bind(newId(), ...PRODUCT_COLUMNS.map((k) => v[k]), now, now);
    });
    const results = await db.batch(stmts);
    for (const res of results) {
      const meta = res.meta as any;
      if (meta.last_row_id && meta.changes === 1) inserted++;
      else if (meta.changes === 1) updated++;
    }
  }

  await logActivity(db, user.email, "Products imported (bulk)", `${rows.length} Zeilen`);
  return c.json({ success: true, inserted, updated, total: rows.length });
});

// POST /api/products/backfill-slugs — generate slugs for products that have
// none (rows imported before the slug column existed). Processes a bounded
// number per call; invoke repeatedly until `remaining` is 0.
productsAdmin.post("/backfill-slugs", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const BATCH = 80; // keeps the IN() check under D1's bound-parameter limit
  const MAX_BATCHES = 15;

  let updated = 0;
  const usedSlugs = new Set<string>();

  for (let iter = 0; iter < MAX_BATCHES; iter++) {
    const { results } = await db
      .prepare("SELECT id, product_name FROM products WHERE slug = '' LIMIT ?")
      .bind(BATCH)
      .all<{ id: string; product_name: string }>();
    if (!results.length) break;

    const items = results.map((r) => ({ id: r.id, slug: slugify(r.product_name) }));

    const bases = Array.from(new Set(items.map((x) => x.slug).filter(Boolean)));
    if (bases.length) {
      const { results: taken } = await db
        .prepare(`SELECT slug FROM products WHERE slug IN (${bases.map(() => "?").join(", ")})`)
        .bind(...bases)
        .all<{ slug: string }>();
      for (const t of taken) usedSlugs.add(t.slug);
    }

    const stmts = [];
    for (const item of items) {
      let slug = item.slug || item.id; // nameless products fall back to their id
      if (usedSlugs.has(slug)) {
        let n = 2;
        while (usedSlugs.has(`${slug}-${n}`)) n++;
        slug = `${slug}-${n}`;
      }
      usedSlugs.add(slug);
      stmts.push(db.prepare("UPDATE products SET slug = ? WHERE id = ?").bind(slug, item.id));
    }
    await db.batch(stmts);
    updated += stmts.length;
  }

  const remainingRow = await db
    .prepare("SELECT COUNT(*) as n FROM products WHERE slug = ''")
    .first<{ n: number }>();

  return c.json({ success: true, updated, remaining: remainingRow?.n ?? 0 });
});

// PUT /api/products/:id — update a product.
productsAdmin.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const existing = await db.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").bind(id).first<ProductRow>();
  if (!existing) return c.json({ error: "Product not found" }, 404);

  const body = await c.req.json();
  const v = buildProductValues(body, existing, await loadBrandIndex(db));
  if (v.slug !== existing.slug) v.slug = await ensureUniqueSlug(db, v.slug, id);
  const now = nowIso();
  const setClause = PRODUCT_COLUMNS.map((k) => `${k} = ?`).join(", ");

  try {
    await db
      .prepare(`UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`)
      .bind(...PRODUCT_COLUMNS.map((k) => v[k]), now, id)
      .run();
  } catch (err: any) {
    if (String(err?.message || "").includes("UNIQUE")) {
      return c.json({ error: "A product with this aw_product_id already exists" }, 409);
    }
    throw err;
  }

  await logActivity(db, user.email, "Product updated", `ID: ${id}`);
  const row = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first<ProductRow>();
  return c.json({ success: true, product: productFromRow(row) });
});

// DELETE /api/products/:id
productsAdmin.delete("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  if (res.meta.changes === 0) return c.json({ error: "Product not found" }, 404);

  await logActivity(db, user.email, "Product deleted", `ID: ${id}`);
  return c.json({ success: true });
});

// POST /api/products/bulk-delete — delete a batch of products by id (admin multi-select).
productsAdmin.post("/bulk-delete", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const ids: string[] = Array.isArray(body?.ids)
    ? Array.from(new Set(body.ids.filter((x: any): x is string => typeof x === "string" && x)))
    : [];
  if (!ids.length) return c.json({ error: "No product ids provided" }, 400);
  if (ids.length > 500) return c.json({ error: "Too many ids (max 500 per request)" }, 400);

  let deleted = 0;
  const CHUNK = 80; // keeps the IN() check under D1's bound-parameter limit
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const res = await db
      .prepare(`DELETE FROM products WHERE id IN (${chunk.map(() => "?").join(", ")})`)
      .bind(...chunk)
      .run();
    deleted += res.meta.changes;
  }

  await logActivity(db, user.email, "Products deleted (bulk)", `${deleted} products`);
  return c.json({ success: true, deleted });
});

// ── GET /api/merchants — unique merchant names ────────────────────────────────
export const merchants = new Hono<{ Bindings: Env }>();

merchants.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT DISTINCT merchant_name FROM products WHERE merchant_name != '' ORDER BY merchant_name ASC"
  ).all<{ merchant_name: string }>();
  return c.json({ merchants: results.map((r) => r.merchant_name) });
});

export default products;
