import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── /api/influencer-brands ────────────────────────────────────────────────────
export const influencerBrands = new Hono<{ Bindings: Env }>();

influencerBrands.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM influencer_brands ORDER BY display_name ASC"
  ).all<D1Row>();
  return c.json({ brands: fromRows(results) });
});

influencerBrands.get("/:username", async (c) => {
  const { username } = c.req.param();
  const db = c.env.DB;

  const brandRow = await db
    .prepare("SELECT id, data FROM influencer_brands WHERE username = ? LIMIT 1")
    .bind(username).first<D1Row>();
  if (!brandRow) return c.json({ error: "Influencer not found" }, 404);

  const brand = fromRow(brandRow)!;

  const { results: lookRows } = await db
    .prepare(
      "SELECT id, data FROM influencer_looks WHERE username = ? AND is_published = 1 ORDER BY created_at DESC"
    )
    .bind(username).all<D1Row>();

  // The public brand page reads `looks` at the top level and shows look.productCount.
  const looks = fromRows(lookRows).map((l: any) => ({
    ...l,
    productCount: Array.isArray(l.products) ? l.products.length : 0,
  }));

  return c.json({ brand, looks });
});

influencerBrands.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.username || !body.displayName || !body.name) {
    return c.json({ error: "username, displayName, name are required" }, 400);
  }

  body.username = body.username.toLowerCase().trim();
  const id = newId();
  const now = nowIso();
  const doc = { ...body, logo: body.logo || "", bio: body.bio || "", createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO influencer_brands (id, username, display_name, data) VALUES (?, ?, ?, ?)"
    )
    .bind(id, body.username, body.displayName, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Influencer created", `@${body.username}`);
  return c.json({ success: true, id }, 201);
});

influencerBrands.put("/:username", authMiddleware, requireStaff, async (c) => {
  const { username } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM influencer_brands WHERE username = ? LIMIT 1")
    .bind(username).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE influencer_brands SET display_name = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.displayName || "", JSON.stringify(updatedDoc), existing.id)
    .run();

  await logActivity(db, user.email, "Influencer updated", `@${username}`);
  return c.json({ _id: existing.id, ...updatedDoc });
});

influencerBrands.delete("/:username", authMiddleware, requireAdmin, async (c) => {
  const { username } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.batch([
    db.prepare("DELETE FROM influencer_brands WHERE username = ?").bind(username),
    db.prepare("DELETE FROM influencer_looks WHERE username = ?").bind(username),
  ]);

  await logActivity(db, user.email, "Influencer deleted", `@${username}`);
  return c.json({ success: true });
});

// ── /api/influencer-looks ─────────────────────────────────────────────────────
export const influencerLooks = new Hono<{ Bindings: Env }>();

influencerLooks.get("/", async (c) => {
  const username = c.req.query("username");
  const sql = username
    ? "SELECT id, data FROM influencer_looks WHERE is_published = 1 AND username = ? ORDER BY created_at DESC"
    : "SELECT id, data FROM influencer_looks WHERE is_published = 1 ORDER BY created_at DESC";
  const { results } = await c.env.DB.prepare(sql).bind(...(username ? [username] : [])).all<D1Row>();
  return c.json({ looks: fromRows(results) });
});

influencerLooks.get("/:username/:lookId", async (c) => {
  const { username, lookId } = c.req.param();
  const db = c.env.DB;

  const lookRow = await db
    .prepare("SELECT id, data FROM influencer_looks WHERE look_id = ? AND username = ? LIMIT 1")
    .bind(lookId, username).first<D1Row>();
  if (!lookRow) return c.json({ error: "Look not found" }, 404);

  const brandRow = await db
    .prepare("SELECT id, data FROM influencer_brands WHERE username = ? LIMIT 1")
    .bind(username).first<D1Row>();

  const look = fromRow(lookRow)!;
  const brand = brandRow ? (() => {
    const b = fromRow(brandRow)!;
    return { displayName: b.displayName, name: b.name, logo: b.logo, bio: b.bio };
  })() : null;

  return c.json({ look, brand });
});

influencerLooks.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const contentType = c.req.header("content-type") ?? "";

  let data: Record<string, any> = {};
  let heroImageUrl = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    try { data.products = data.products ? JSON.parse(data.products) : []; } catch { data.products = []; }
    try { data.faqs = data.faqs ? JSON.parse(data.faqs) : []; } catch { data.faqs = []; }
    try { data.tags = data.tags ? JSON.parse(data.tags) : []; } catch { data.tags = []; }
    try { data.similarCategories = data.similarCategories ? JSON.parse(data.similarCategories) : []; } catch { data.similarCategories = []; }

    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      const key = `influencer-looks/${data.username ?? "look"}/${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
      await c.env.IMAGES.put(key, imageFile.stream(), { httpMetadata: { contentType: imageFile.type } });
      heroImageUrl = `/uploads/${key}`;
    }
  } else {
    data = await c.req.json();
  }

  if (!data.lookId || !data.username || !data.title) {
    return c.json({ error: "lookId, username, title are required" }, 400);
  }

  const existing = await db
    .prepare("SELECT id, data FROM influencer_looks WHERE look_id = ? LIMIT 1")
    .bind(data.lookId).first<D1Row>();

  const existingDoc = existing ? JSON.parse(existing.data) : null;
  const now = nowIso();

  const doc: Record<string, any> = {
    ...data,
    heroImage: heroImageUrl || data.heroImage || existingDoc?.heroImage || "",
    products: data.products ?? existingDoc?.products ?? [],
    faqs: data.faqs ?? existingDoc?.faqs ?? [],
    tags: data.tags ?? existingDoc?.tags ?? [],
    similarCategories: data.similarCategories ?? existingDoc?.similarCategories ?? [],
    isPublished: data.isPublished !== false,
    updatedAt: now,
  };

  if (!existing) {
    doc.createdAt = now;
    const id = newId();
    await db
      .prepare(
        "INSERT INTO influencer_looks (id, look_id, username, is_published, created_at, data) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(id, data.lookId, data.username, doc.isPublished ? 1 : 0, now, JSON.stringify(doc))
      .run();
  } else {
    await db
      .prepare("UPDATE influencer_looks SET is_published = ?, data = ? WHERE id = ?")
      .bind(doc.isPublished ? 1 : 0, JSON.stringify(doc), existing.id)
      .run();
  }

  await logActivity(
    db,
    user.email,
    existing ? "Look updated" : "Look erstellt",
    `@${data.username}/${data.lookId}`
  );
  return c.json({ success: true }, existing ? 200 : 201);
});

influencerLooks.put("/:username/:lookId", authMiddleware, requireStaff, async (c) => {
  const { username, lookId } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM influencer_looks WHERE look_id = ? AND username = ? LIMIT 1")
    .bind(lookId, username).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE influencer_looks SET is_published = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.isPublished !== false ? 1 : 0, JSON.stringify(updatedDoc), existing.id)
    .run();

  await logActivity(db, user.email, "Look updated", `@${username}/${lookId}`);
  return c.json({ _id: existing.id, ...updatedDoc });
});

influencerLooks.delete("/:username/:lookId", authMiddleware, requireAdmin, async (c) => {
  const { username, lookId } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db
    .prepare("DELETE FROM influencer_looks WHERE look_id = ? AND username = ?")
    .bind(lookId, username).run();
  if (res.meta.changes === 0) return c.json({ error: "Not found" }, 404);

  await logActivity(db, user.email, "Look deleted", `@${username}/${lookId}`);
  return c.json({ success: true });
});

// ── /api/influencer-settings ──────────────────────────────────────────────────
export const influencerSettings = new Hono<{ Bindings: Env }>();

const DEFAULT_INFLUENCER_SETTINGS = {
  pageTitle: "Alle Top-Influencer",
  pageSubtitle: "Entdecke kuratierte Looks, Interior-Inspiration und shopbare Einrichtungsstile von Top Creators.",
  longContent: "",
  faqs: [],
  seoTitle: "Influencer Looks und Produkte",
  seoDescription: "Entdecke shopbare Influencer Looks, Produkte und Interior Inspiration.",
  seoKeywords: "",
};

influencerSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM influencer_page_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? fromRow(row) : DEFAULT_INFLUENCER_SETTINGS);
});

influencerSettings.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO influencer_page_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Influencer settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM influencer_page_settings WHERE id = 'singleton'")
    .first<D1Row>();
  return c.json(fromRow(row));
});
