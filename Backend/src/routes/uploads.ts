import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";
import { parseCsv, buildCanonicalCategory, buildMerchantCategory, str, num } from "../lib/csvParser.js";

const uploads = new Hono<{ Bindings: Env }>();

// ── POST /api/upload-image — upload to R2 ────────────────────────────────────
uploads.post("/upload-image", authMiddleware, requireStaff, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) ?? "general";

  if (!file || file.size === 0) {
    return c.json({ error: "No file provided" }, 400);
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  await c.env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || `image/${ext}` },
  });

  return c.json({ url: `/uploads/${key}` });
});

// ── GET /uploads/:key* — serve files from R2 ─────────────────────────────────
uploads.get("/uploads/*", async (c) => {
  const key = c.req.path.replace(/^\/uploads\//, "");
  const obj = await c.env.IMAGES.get(key);

  if (!obj) return c.json({ error: "Not found" }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
});

// ── POST /api/upload-csv — products CSV feed ─────────────────────────────────
uploads.post("/upload-csv", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file provided" }, 400);

  const text = await file.text();
  const rawRows = parseCsv(text);
  if (!rawRows.length) return c.json({ error: "CSV is empty or has no data rows" }, 400);

  const now = nowIso();

  type ProductRecord = {
    aw_product_id: number;
    aw_deep_link: string | null;
    product_name: string | null;
    merchant_product_id: string | null;
    merchant_image_url: string | null;
    description: string | null;
    merchant_category: string | null;
    search_price: number | null;
    merchant_name: string | null;
    merchant_id: number | null;
    category_name: string | null;
    aw_image_url: string | null;
    merchant_deep_link: string | null;
    display_price: string | null;
    data_feed_id: number | null;
    brand_name: string | null;
    colour: string | null;
    product_short_description: string | null;
    aw_thumb_url: string | null;
    delivery_cost: string | null;
    alternate_image: string | null;
    alternate_image_two: string | null;
    alternate_image_three: string | null;
    alternate_image_four: string | null;
  };

  const products: ProductRecord[] = rawRows
    .map((row) => {
      const aw_product_id = Number((row.aw_product_id ?? "").trim());
      if (!aw_product_id || Number.isNaN(aw_product_id)) return null;
      return {
        aw_product_id,
        aw_deep_link: str(row.aw_deep_link),
        product_name: str(row.product_name),
        merchant_product_id: str(row.merchant_product_id),
        merchant_image_url: str(row.merchant_image_url),
        description: str(row.description),
        merchant_category: buildMerchantCategory(row.merchant_category),
        search_price: num(row.search_price),
        merchant_name: str(row.merchant_name),
        merchant_id: num(row.merchant_id),
        category_name: buildCanonicalCategory(row.category_name, row.merchant_category),
        aw_image_url: str(row.aw_image_url),
        merchant_deep_link: str(row.merchant_deep_link),
        display_price: str(row.display_price),
        data_feed_id: num(row.data_feed_id),
        brand_name: str(row.brand_name),
        colour: str(row.colour),
        product_short_description: str(row.product_short_description),
        aw_thumb_url: str(row.aw_thumb_url),
        delivery_cost: str(row.delivery_cost),
        alternate_image: str(row.alternate_image),
        alternate_image_two: str(row.alternate_image_two),
        alternate_image_three: str(row.alternate_image_three),
        alternate_image_four: str(row.alternate_image_four),
      };
    })
    .filter((p): p is ProductRecord => p !== null);

  if (!products.length) return c.json({ error: "No valid products found in CSV" }, 400);

  let inserted = 0;
  let updated = 0;

  // Process in batches of 50 to stay within D1 batch limits
  const CHUNK = 50;
  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK);

    const stmts = chunk.map((p) => {
      const id = newId();
      return db.prepare(`
        INSERT INTO products (
          id, aw_product_id, product_name, merchant_name, brand_name, merchant_category,
          category_name, search_price, display_price, aw_deep_link, merchant_deep_link,
          aw_image_url, merchant_image_url, aw_thumb_url, alternate_image,
          alternate_image_two, alternate_image_three, alternate_image_four,
          description, product_short_description, colour, delivery_cost,
          merchant_product_id, merchant_id, data_feed_id,
          is_sponsored, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          0, ?, ?
        )
        ON CONFLICT(aw_product_id) DO UPDATE SET
          product_name = excluded.product_name,
          merchant_name = excluded.merchant_name,
          brand_name = excluded.brand_name,
          merchant_category = excluded.merchant_category,
          category_name = excluded.category_name,
          search_price = excluded.search_price,
          display_price = excluded.display_price,
          aw_deep_link = excluded.aw_deep_link,
          merchant_deep_link = excluded.merchant_deep_link,
          aw_image_url = excluded.aw_image_url,
          merchant_image_url = excluded.merchant_image_url,
          aw_thumb_url = excluded.aw_thumb_url,
          alternate_image = excluded.alternate_image,
          alternate_image_two = excluded.alternate_image_two,
          alternate_image_three = excluded.alternate_image_three,
          alternate_image_four = excluded.alternate_image_four,
          description = excluded.description,
          product_short_description = excluded.product_short_description,
          colour = excluded.colour,
          delivery_cost = excluded.delivery_cost,
          merchant_product_id = excluded.merchant_product_id,
          merchant_id = excluded.merchant_id,
          data_feed_id = excluded.data_feed_id,
          updated_at = excluded.updated_at
      `).bind(
        id, p.aw_product_id, p.product_name, p.merchant_name, p.brand_name, p.merchant_category,
        p.category_name, p.search_price, p.display_price, p.aw_deep_link, p.merchant_deep_link,
        p.aw_image_url, p.merchant_image_url, p.aw_thumb_url, p.alternate_image,
        p.alternate_image_two, p.alternate_image_three, p.alternate_image_four,
        p.description, p.product_short_description, p.colour, p.delivery_cost,
        p.merchant_product_id, p.merchant_id, p.data_feed_id,
        now, now
      );
    });

    const results = await db.batch(stmts);
    for (const r of results) {
      // D1 reports rows_written; check if it was an insert (changes=1, last_row_id set) vs update
      const meta = r.meta as any;
      if (meta.last_row_id && meta.changes === 1) inserted++;
      else if (meta.changes === 1) updated++;
    }
  }

  // ── Coverage analysis: which brands / categories / subcategories in this feed
  //    are NOT yet configured in the admin (furniture brands + category catalog)?
  const countBy = (keyFn: (p: ProductRecord) => string | null | undefined) => {
    const m = new Map<string, { name: string; count: number }>();
    for (const p of products) {
      const raw = (keyFn(p) ?? "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      const e = m.get(key) ?? { name: raw, count: 0 };
      e.count++;
      m.set(key, e);
    }
    return m;
  };

  const brandMap = countBy((p) => p.brand_name);
  const categoryMap = countBy((p) => p.category_name);
  const subcategoryMap = countBy((p) => p.merchant_category);

  const [brandRows, catRows] = await db.batch([
    db.prepare("SELECT title, slug FROM furniture_brands"),
    db.prepare("SELECT slug, data FROM category_catalogs"),
  ]);

  const existingBrands = new Set<string>();
  for (const r of brandRows.results as any[]) {
    if (r.title) existingBrands.add(String(r.title).toLowerCase());
    if (r.slug) existingBrands.add(String(r.slug).toLowerCase());
  }

  const existingCategories = new Set<string>();
  const existingSubcategories = new Set<string>();
  for (const r of catRows.results as any[]) {
    let doc: any = {};
    try { doc = JSON.parse(r.data); } catch { /* ignore */ }
    for (const v of [doc.name, doc.slug, ...(Array.isArray(doc.aliases) ? doc.aliases : [])]) {
      if (v) existingCategories.add(String(v).toLowerCase());
    }
    for (const s of Array.isArray(doc.subcategories) ? doc.subcategories : []) {
      if (s?.name) existingSubcategories.add(String(s.name).toLowerCase());
      if (s?.slug) existingSubcategories.add(String(s.slug).toLowerCase());
    }
  }

  const missingFrom = (map: Map<string, { name: string; count: number }>, existing: Set<string>) =>
    [...map.entries()]
      .filter(([key]) => !existing.has(key))
      .map(([, v]) => v)
      .sort((a, b) => b.count - a.count);

  const sum = (arr: { count: number }[]) => arr.reduce((n, x) => n + x.count, 0);

  const missingBrands = missingFrom(brandMap, existingBrands);
  const missingCategories = missingFrom(categoryMap, existingCategories);
  const missingSubcategories = missingFrom(subcategoryMap, existingSubcategories);

  const logNow = nowIso();
  await db
    .prepare("INSERT INTO csv_upload_logs (id, created_at, data) VALUES (?, ?, ?)")
    .bind(
      newId(),
      logNow,
      JSON.stringify({
        filename: file.name,
        parsedRows: rawRows.length,
        insertedRows: inserted,
        updatedRows: updated,
        uploadedBy: user.email,
        createdAt: logNow,
      })
    )
    .run();

  await logActivity(
    db,
    user.email,
    "CSV Feed hochgeladen",
    `Datei: "${file.name}", Zeilen: ${rawRows.length}, Hinzugefügt: ${inserted}, Aktualisiert: ${updated}`
  );

  return c.json({
    success: true,
    message: "Upload erfolgreich",
    totalParsed: rawRows.length,
    validProducts: products.length,
    inserted,
    updated,
    // Coverage: items in the feed whose brand/category/subcategory isn't configured yet.
    coverage: {
      missingBrands,
      missingCategories,
      missingSubcategories,
      productsFromMissingBrands: sum(missingBrands),
      productsFromMissingCategories: sum(missingCategories),
      productsFromMissingSubcategories: sum(missingSubcategories),
    },
  });
});

// ── POST /api/upload-brand-csv — brands CSV ───────────────────────────────────
uploads.post("/upload-brand-csv", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file provided" }, 400);

  const text = await file.text();
  const rows = parseCsv(text);
  if (!rows.length) return c.json({ error: "CSV is empty" }, 400);

  const validRows = rows.filter((row) => row.name && row.slug);
  if (!validRows.length) return c.json({ error: "No valid brand rows found" }, 400);

  const now = nowIso();
  let inserted = 0;
  let updated = 0;

  const CHUNK = 50;
  for (let i = 0; i < validRows.length; i += CHUNK) {
    const chunk = validRows.slice(i, i + CHUNK);

    const stmts = chunk.map((row) => {
      const slug = row.slug.toLowerCase().trim();
      const id = newId();
      const doc = {
        name: row.name,
        slug,
        url: row.url || "",
        description: row.description || "",
        logo: row.logo || "",
        createdAt: now,
        updatedAt: now,
      };
      const updateDoc = JSON.stringify({ name: row.name, url: row.url || "", description: row.description || "", logo: row.logo || "", updatedAt: now });

      return db.prepare(`
        INSERT INTO brands (id, slug, name, data) VALUES (?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          data = json_patch(data, ?)
      `).bind(id, slug, row.name, JSON.stringify(doc), updateDoc);
    });

    const results = await db.batch(stmts);
    for (const r of results) {
      const meta = r.meta as any;
      if (meta.last_row_id && meta.changes === 1) inserted++;
      else if (meta.changes === 1) updated++;
    }
  }

  await logActivity(
    db,
    user.email,
    "Brand-CSV hochgeladen",
    `Datei: "${file.name}", Hinzugefügt: ${inserted}, Aktualisiert: ${updated}`
  );

  return c.json({ success: true, inserted, updated });
});

export default uploads;
