import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// Derive a URL-safe slug from a human name (categories are name-only in admin).
const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── /api/home-products ────────────────────────────────────────────────────────
export const homeProducts = new Hono<{ Bindings: Env }>();

homeProducts.get("/", async (c) => {
  const section = c.req.query("section");
  const categorySlug = c.req.query("categorySlug");

  const where: string[] = [];
  const binds: any[] = [];
  if (section) { where.push("section = ?"); binds.push(section); }
  if (categorySlug) { where.push("json_extract(data, '$.categorySlug') = ?"); binds.push(categorySlug); }

  const sql = `SELECT id, data FROM home_products ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all<D1Row>();
  return c.json({ success: true, products: fromRows(results) });
});

homeProducts.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM home_products WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

homeProducts.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const contentType = c.req.header("content-type") ?? "";

  let data: Record<string, any> = {};
  let imageUrl = "";
  let brandLogoUrl = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const key = `home-products/${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
      await c.env.IMAGES.put(key, imageFile.stream(), { httpMetadata: { contentType: imageFile.type } });
      imageUrl = `/uploads/${key}`;
    }
    const logoFile = formData.get("brandLogo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const key = `home-products/logo-${Date.now()}-${logoFile.name.replace(/\s+/g, "-")}`;
      await c.env.IMAGES.put(key, logoFile.stream(), { httpMetadata: { contentType: logoFile.type } });
      brandLogoUrl = `/uploads/${key}`;
    }
  } else {
    data = await c.req.json();
  }

  // Products are usually picked from the furniture catalog, where fields like
  // price/brand can be sparse — only require what the homepage truly needs.
  const required = ["title", "section", "categorySlug"];
  for (const field of required) {
    if (!data[field]) return c.json({ error: `${field} is required` }, 400);
  }

  const id = newId();
  const now = nowIso();
  const doc = {
    ...data,
    image: imageUrl || data.image || "",
    brandLogo: brandLogoUrl || data.brandLogo || "",
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare("INSERT INTO home_products (id, section, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(id, data.section, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Home product created", data.title);
  return c.json({ success: true, id, product: { _id: id, ...doc } }, 201);
});

homeProducts.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM home_products WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE home_products SET section = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.section ?? "", JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Home product updated", `ID: ${id}`);
  return c.json({ success: true, _id: id, ...updatedDoc });
});

homeProducts.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM home_products WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Home product deleted", `ID: ${id}`);
  return c.json({ success: true });
});

// ── /api/home-categories ──────────────────────────────────────────────────────
export const homeCategories = new Hono<{ Bindings: Env }>();

// Admin-defined display order (see the admin Indoor & Outdoor "Categories List").
// `position` lives in the JSON blob rather than a column, so no migration is
// needed on the deployed D1. Categories saved before ordering existed have no
// position — they sort last, keeping the previous newest-first order, until the
// admin drags once (which assigns a position to every row in the section).
const HOME_CATEGORY_ORDER =
  "ORDER BY COALESCE(json_extract(data, '$.position'), 999999) ASC, created_at DESC";

homeCategories.get("/", async (c) => {
  const section = c.req.query("section");
  const sql = section
    ? `SELECT id, data FROM home_categories WHERE section = ? ${HOME_CATEGORY_ORDER}`
    : `SELECT id, data FROM home_categories ${HOME_CATEGORY_ORDER}`;
  const { results } = await c.env.DB.prepare(sql).bind(...(section ? [section] : [])).all<D1Row>();
  return c.json({ success: true, categories: fromRows(results) });
});

homeCategories.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM home_categories WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

homeCategories.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.name || !body.section) {
    return c.json({ error: "name and section are required" }, 400);
  }

  // Admin only enters a name; the slug is derived automatically (falls back to
  // an explicit slug if one is ever provided).
  const slug = slugify(body.slug || body.name);
  if (!slug) return c.json({ error: "Could not derive a slug from the name" }, 400);

  const id = newId();
  const now = nowIso();
  const doc = { ...body, name: body.name, slug, section: body.section, createdAt: now, updatedAt: now };

  await db
    .prepare("INSERT INTO home_categories (id, section, created_at, data) VALUES (?, ?, ?, ?)")
    .bind(id, body.section, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Home category created", body.name);
  return c.json({ success: true, id, category: { _id: id, ...doc } }, 201);
});

homeCategories.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM home_categories WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const prev = JSON.parse(existing.data);
  const merged = { ...prev, ...body };
  // Re-derive the slug from the (possibly new) name unless an explicit slug is sent.
  if (body.slug) merged.slug = slugify(body.slug);
  else if (body.name) merged.slug = slugify(body.name);
  const updatedDoc = { ...merged, updatedAt: nowIso() };

  await db
    .prepare("UPDATE home_categories SET section = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.section ?? "", JSON.stringify(updatedDoc), id)
    .run();

  // Renaming a category changes its derived slug — keep already-linked products
  // attached by migrating their categorySlug to the new value.
  if (prev.slug && prev.slug !== updatedDoc.slug) {
    await db
      .prepare(
        "UPDATE home_products SET data = json_set(data, '$.categorySlug', ?) " +
          "WHERE section = ? AND json_extract(data, '$.categorySlug') = ?"
      )
      .bind(updatedDoc.slug, updatedDoc.section ?? "", prev.slug)
      .run();
  }

  await logActivity(db, user.email, "Home category updated", `ID: ${id}`);
  return c.json({ success: true, category: { _id: id, ...updatedDoc } });
});

homeCategories.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM home_categories WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Home category deleted", `ID: ${id}`);
  return c.json({ success: true });
});

// ── /api/home-influencer ──────────────────────────────────────────────────────
// Singleton "influencer look": one main featured photo + up to 6 shoppable products.
// The admin page uploads images as multipart/form-data; both the admin and the
// public homepage expect the shape { success, data: { mainImage, ..., products } }.
export const homeInfluencer = new Hono<{ Bindings: Env }>();

const HOME_INFLUENCER_ID = "singleton";

homeInfluencer.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM home_influencers WHERE id = ? LIMIT 1"
  ).bind(HOME_INFLUENCER_ID).first<D1Row>();
  if (!row) return c.json({ success: true, data: null });
  return c.json({ success: true, data: fromRow(row) });
});

homeInfluencer.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM home_influencers WHERE id = ? LIMIT 1")
    .bind(HOME_INFLUENCER_ID).first<D1Row>();
  const prev = existing ? JSON.parse(existing.data) : {};

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json({ error: "multipart/form-data required" }, 400);
  }

  const formData = await c.req.formData();

  const uploadImage = async (file: File, prefix: string): Promise<string> => {
    const key = `home-influencer/${prefix}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    await c.env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return `/uploads/${key}`;
  };

  // Resolve an image field that may be either a media-library URL (string) or an
  // uploaded File. Returns "" when nothing usable was provided.
  const resolveImage = async (key: string, prefix: string): Promise<string> => {
    const value = formData.get(key);
    if (value == null) return "";
    if (typeof value === "string") return value;
    const file = value as File;
    return file.size > 0 ? await uploadImage(file, prefix) : "";
  };

  // Main featured photo — keep the existing one when no new image is provided.
  let mainImage = await resolveImage("mainImage", "main");
  if (!mainImage) mainImage = prev.mainImage || "";
  if (!mainImage) return c.json({ error: "mainImage is required" }, 400);

  // Shoppable product slots.
  const productCount = Number(formData.get("productCount")) || 6;
  const products: Array<{ image: string; price: string; link: string }> = [];
  for (let i = 0; i < productCount; i++) {
    let image = await resolveImage(`image_${i}`, `product-${i}`);
    if (!image) image = (formData.get(`existing_image_${i}`) as string) || "";
    products.push({
      image,
      price: (formData.get(`price_${i}`) as string) || "",
      link: (formData.get(`link_${i}`) as string) || "",
    });
  }

  const now = nowIso();
  const doc = {
    mainImage,
    mainImageTitle: (formData.get("mainImageTitle") as string) || "",
    mainImageLink: (formData.get("mainImageLink") as string) || "",
    products,
    createdAt: prev.createdAt || now,
    updatedAt: now,
  };

  await db
    .prepare(
      "INSERT INTO home_influencers (id, created_at, data) VALUES (?, ?, ?) " +
        "ON CONFLICT(id) DO UPDATE SET data = excluded.data"
    )
    .bind(HOME_INFLUENCER_ID, doc.createdAt, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Home influencer updated", `Bild: ${mainImage}`);
  return c.json({ success: true, data: { _id: HOME_INFLUENCER_ID, ...doc } });
});
