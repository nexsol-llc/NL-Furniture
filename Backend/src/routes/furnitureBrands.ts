import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── /api/furniture-brands ─────────────────────────────────────────────────────
// Furniture brand directory (title, slug, logo, description, …). Distinct from the
// coupon-oriented /api/brands entity.
const furnitureBrands = new Hono<{ Bindings: Env }>();

// Build a URL-safe slug. Strips Dutch diacritics so "Coördinatie" → "coordinatie"
// and "Meubelen à la carte" → "meubelen-a-la-carte". Note this deliberately does
// not use the German ö→oe expansion, which mangles Dutch diaeresis vowels.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize the incoming body into the stored document shape.
function buildDoc(data: Record<string, any>, slug: string) {
  const seo = data.seo ?? {};
  return {
    title: String(data.title ?? "").trim(),
    slug,
    logo: data.logo || "",
    description: data.description || "",
    website: data.website || "",
    featured: data.featured === true || data.featured === "true",
    sortOrder: Number(data.sortOrder) || 0,
    seo: {
      metaTitle: seo.metaTitle || "",
      metaDescription: seo.metaDescription || "",
      keywords: seo.keywords || "",
      focusKeyword: seo.focusKeyword || "",
      canonicalUrl: seo.canonicalUrl || "",
      ogTitle: seo.ogTitle || "",
      ogDescription: seo.ogDescription || "",
    },
  };
}

// ── GET /api/furniture-brands ─────────────────────────────────────────────────
// Bare array, ordered by sort order then title (admin + public read it this way).
furnitureBrands.get("/", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT id, data FROM furniture_brands ORDER BY sort_order ASC, title ASC")
    .all<D1Row>();
  return c.json(fromRows(results));
});

// ── GET /api/furniture-brands/featured ────────────────────────────────────────
// Registered before /:slug so the static path wins. Bare array like the base GET.
furnitureBrands.get("/featured", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "30"), 1), 100);
  const { results } = await c.env.DB
    .prepare(
      "SELECT id, data FROM furniture_brands WHERE json_extract(data, '$.featured') = 1 ORDER BY sort_order ASC, title ASC LIMIT ?"
    )
    .bind(limit)
    .all<D1Row>();
  return c.json(fromRows(results));
});

// ── GET /api/furniture-brands/:slug ───────────────────────────────────────────
furnitureBrands.get("/:slug", async (c) => {
  const row = await c.env.DB
    .prepare("SELECT id, data FROM furniture_brands WHERE slug = ? LIMIT 1")
    .bind(c.req.param("slug"))
    .first<D1Row>();
  if (!row) return c.json({ error: "Brand not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/furniture-brands ────────────────────────────────────────────────
furnitureBrands.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const data = await c.req.json();

  const title = String(data.title ?? "").trim();
  if (!title) return c.json({ error: "title is required" }, 400);

  const slug = slugify(data.slug || title);
  if (!slug) return c.json({ error: "slug must contain at least one letter or number" }, 400);

  const dup = await db
    .prepare("SELECT id FROM furniture_brands WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first();
  if (dup) return c.json({ error: "A brand with this slug already exists" }, 409);

  const id = newId();
  const now = nowIso();
  const doc = { ...buildDoc(data, slug), createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO furniture_brands (id, slug, title, sort_order, created_at, data) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(id, slug, doc.title, doc.sortOrder, now, JSON.stringify(doc))
    .run();

  // Adopt products that already carry this name as free text — the CSV importer
  // creates brands for feed names it has seen, and earlier imports may have
  // landed before the brand existed.
  const adopted = await db
    .prepare("UPDATE products SET brand_id = ?, brand_name = ?, updated_at = ? WHERE brand_id = '' AND brand_name = ? COLLATE NOCASE")
    .bind(id, doc.title, now, doc.title)
    .run();
  const adoptedProducts = adopted.meta.changes ?? 0;

  await logActivity(
    db,
    user.email,
    "Furniture brand created",
    `${doc.title} (${slug})${adoptedProducts ? ` — ${adoptedProducts} products linked` : ""}`
  );
  return c.json({ _id: id, ...doc, adoptedProducts }, 201);
});

// ── POST /api/furniture-brands/merge ──────────────────────────────────────────
// Merge one furniture brand into another: reassign every product from the source
// brand's name to the target brand's name, then delete the source brand.
// Registered before the "/:id" routes; POST has no :id route so there's no clash,
// but keeping it here documents intent.
furnitureBrands.post("/merge", authMiddleware, requireAdmin, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const { sourceId, targetId } = await c.req.json();

  if (!sourceId || !targetId) {
    return c.json({ error: "sourceId and targetId are required" }, 400);
  }
  if (sourceId === targetId) {
    return c.json({ error: "Cannot merge a brand into itself" }, 400);
  }

  const [sourceRow, targetRow] = await db.batch([
    db.prepare("SELECT id, data FROM furniture_brands WHERE id = ? LIMIT 1").bind(sourceId),
    db.prepare("SELECT id, data FROM furniture_brands WHERE id = ? LIMIT 1").bind(targetId),
  ]);

  const source = fromRow(sourceRow.results[0] as D1Row | undefined ?? null);
  const target = fromRow(targetRow.results[0] as D1Row | undefined ?? null);
  if (!source) return c.json({ error: "Source brand not found" }, 404);
  if (!target) return c.json({ error: "Target brand not found" }, 404);

  const now = nowIso();
  // Reassign products to the target brand. Matching on brand_id catches everything
  // linked to the source; the name clause also sweeps up rows still unlinked
  // (imported before the brand existed, or before the brand_id migration).
  const updateRes = await db
    .prepare(
      `UPDATE products SET brand_id = ?, brand_name = ?, updated_at = ?
       WHERE brand_id = ? OR (brand_id = '' AND brand_name = ? COLLATE NOCASE)`
    )
    .bind(targetId, target.title, now, sourceId, source.title)
    .run();
  const movedProducts = updateRes.meta.changes ?? 0;

  // Remove the now-empty source brand.
  await db.prepare("DELETE FROM furniture_brands WHERE id = ?").bind(sourceId).run();

  await logActivity(
    db,
    user.email,
    "Furniture brands merged",
    `"${source.title}" → "${target.title}" (${movedProducts} Produkte)`
  );

  return c.json({ success: true, movedProducts, source: source.title, target: target.title });
});

// ── PUT /api/furniture-brands/:id ─────────────────────────────────────────────
furnitureBrands.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");
  const data = await c.req.json();

  const existing = await db
    .prepare("SELECT id, data FROM furniture_brands WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();
  if (!existing) return c.json({ error: "Brand not found" }, 404);
  const existingDoc = JSON.parse(existing.data);

  const title = String(data.title ?? existingDoc.title ?? "").trim();
  if (!title) return c.json({ error: "title is required" }, 400);

  const slug = slugify(data.slug || existingDoc.slug || title);
  if (!slug) return c.json({ error: "slug must contain at least one letter or number" }, 400);

  const dup = await db
    .prepare("SELECT id FROM furniture_brands WHERE slug = ? AND id != ? LIMIT 1")
    .bind(slug, id)
    .first();
  if (dup) return c.json({ error: "A brand with this slug already exists" }, 409);

  const doc = {
    ...existingDoc,
    ...buildDoc({ ...existingDoc, ...data }, slug),
    updatedAt: nowIso(),
  };

  await db
    .prepare("UPDATE furniture_brands SET slug = ?, title = ?, sort_order = ?, data = ? WHERE id = ?")
    .bind(slug, doc.title, doc.sortOrder, JSON.stringify(doc), id)
    .run();

  // A rename has to reach the products: brand_name is denormalized onto every
  // product row so listings need no join. Without this the brand page would go
  // empty and the old name would linger in the product list and filters.
  const previousTitle = String(existingDoc.title ?? "").trim();
  let renamedProducts = 0;
  if (previousTitle && previousTitle.toLowerCase() !== doc.title.toLowerCase()) {
    const now = nowIso();
    // Rows still unlinked under the old name join the brand at the same time.
    await db
      .prepare("UPDATE products SET brand_id = ? WHERE brand_id = '' AND brand_name = ? COLLATE NOCASE")
      .bind(id, previousTitle)
      .run();
    const res = await db
      .prepare("UPDATE products SET brand_name = ?, updated_at = ? WHERE brand_id = ? AND brand_name != ?")
      .bind(doc.title, now, id, doc.title)
      .run();
    renamedProducts = res.meta.changes ?? 0;
  }

  await logActivity(
    db,
    user.email,
    "Furniture brand updated",
    `ID: ${id}${renamedProducts ? ` — ${renamedProducts} products renamed` : ""}`
  );
  return c.json({ _id: id, ...doc, renamedProducts });
});

// ── DELETE /api/furniture-brands/:id ──────────────────────────────────────────
furnitureBrands.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db.prepare("DELETE FROM furniture_brands WHERE id = ?").bind(id).run();
  if (res.meta.changes === 0) return c.json({ error: "Brand not found" }, 404);

  // Products outlive the directory entry: drop the dangling link but keep the
  // name as free text so nothing vanishes from listings or search.
  const unlinked = await db
    .prepare("UPDATE products SET brand_id = '' WHERE brand_id = ?")
    .bind(id)
    .run();
  const unlinkedProducts = unlinked.meta.changes ?? 0;

  await logActivity(
    db,
    user.email,
    "Furniture brand deleted",
    `ID: ${id}${unlinkedProducts ? ` — ${unlinkedProducts} products unlinked` : ""}`
  );
  return c.json({ success: true, unlinkedProducts });
});

export default furnitureBrands;
