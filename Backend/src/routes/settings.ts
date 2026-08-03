import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

export const settings = new Hono<{ Bindings: Env }>();

// ── /api/section-settings ─────────────────────────────────────────────────────
// Consumers (public homepage + section admin pages) read this as a map keyed by
// section id: { success, settings: { sponsors: { title, slug }, gadgets: {...} } }.
async function sectionSettingsMap(db: D1Database): Promise<Record<string, any>> {
  const { results } = await db
    .prepare("SELECT section_id, data FROM section_settings ORDER BY section_id ASC")
    .all<{ section_id: string; data: string }>();
  const map: Record<string, any> = {};
  for (const r of results) {
    map[r.section_id] = { _id: r.section_id, ...JSON.parse(r.data) };
  }
  return map;
}

async function upsertSectionSettings(
  db: D1Database,
  items: Array<Record<string, any>>
): Promise<void> {
  const now = nowIso();
  for (const item of items) {
    if (!item.sectionId) continue;
    const doc = { ...item, updatedAt: now };
    const insertDoc = JSON.stringify({ ...doc, createdAt: now });
    await db
      .prepare(
        `INSERT INTO section_settings (id, section_id, data) VALUES (?, ?, ?)
         ON CONFLICT(section_id) DO UPDATE SET data = json_patch(data, ?)`
      )
      .bind(newId(), item.sectionId, insertDoc, JSON.stringify(doc))
      .run();
  }
}

settings.get("/section-settings", async (c) => {
  return c.json({ success: true, settings: await sectionSettingsMap(c.env.DB) });
});

// Save a single section header (used by the per-section admin pages).
settings.post("/section-settings", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();

  if (!body || !body.sectionId) {
    return c.json({ success: false, error: "sectionId is required" }, 400);
  }

  await upsertSectionSettings(db, [body]);
  await logActivity(db, user.email, "Section settings updated", body.sectionId);
  return c.json({ success: true, settings: await sectionSettingsMap(db) });
});

// Bulk update (accepts a single object or an array) — kept for compatibility.
settings.put("/section-settings", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();

  const items = Array.isArray(body) ? body : [body];
  await upsertSectionSettings(db, items);

  await logActivity(db, user.email, "Section settings updated", `${items.length} Sektionen`);
  return c.json({ success: true, settings: await sectionSettingsMap(db) });
});

// ── /api/site-settings (singleton — theme color, global options) ─────────────
const DEFAULT_SITE_SETTINGS = {
  theme_color: "teal",
  custom_color: "#0d9488",
  // Coupons site primary color — independent from the furniture theme above.
  coupons_theme_color: "orange",
  coupons_custom_color: "#ea580c",
  // Two alternating background colors for the furniture homepage content sections.
  section_bg_1: "#e9ecef",
  section_bg_2: "#F5E6D7",
  // Two background colors for the coupons (/kortingscodes) page content sections.
  coupon_section_bg_1: "#f3f4f6",
  coupon_section_bg_2: "#f5f5f5",
  // Optional pattern drawn over each section color above — one per color, so the
  // alternating A/B sections can differ. Pattern is one of:
  // none | dots | grid | diagonal-stripes | horizontal-lines | vertical-lines | checkerboard.
  section_pattern_1: "none",
  section_pattern_1_color: "#000000",
  section_pattern_1_opacity: 8,
  section_pattern_1_size: 24,
  section_pattern_2: "none",
  section_pattern_2_color: "#000000",
  section_pattern_2_opacity: 8,
  section_pattern_2_size: 24,
  coupon_section_pattern_1: "none",
  coupon_section_pattern_1_color: "#000000",
  coupon_section_pattern_1_opacity: 8,
  coupon_section_pattern_1_size: 24,
  coupon_section_pattern_2: "none",
  coupon_section_pattern_2_color: "#000000",
  coupon_section_pattern_2_opacity: 8,
  coupon_section_pattern_2_size: 24,
  // Social media profile URLs shown in the footer. Empty = icon hidden.
  social_links: {
    facebook: "",
    tiktok: "",
    pinterest: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    x: "",
  },
};

settings.get("/site-settings", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM site_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(row.data) } : DEFAULT_SITE_SETTINGS);
});

settings.put("/site-settings", authMiddleware, requireAdmin, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO site_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Site settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM site_settings WHERE id = 'singleton'")
    .first<D1Row>();
  return c.json({ ...DEFAULT_SITE_SETTINGS, ...(row ? JSON.parse(row.data) : {}) });
});

// ── /api/kategorie-settings ───────────────────────────────────────────────────
// `categories` is a single unified list — each item carries its own
// `type: "indoor" | "outdoor"` instead of living in two separate arrays
// (legacy `indoorCategories`/`outdoorCategories`, now retired).
const DEFAULT_KATEGORIE = {
  seoTitle: "Categorieën | NL FURNITURE",
  seoDescription: "Ontdek ons brede aanbod aan meubelcategorieën bij NL FURNITURE.",
  longContent: "",
  faqs: [],
  sections: [],
  categories: [],
};

// Consumers (admin + public /categorie page) read { success, settings }.
settings.get("/kategorie-settings", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM kategorie_page_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json({ success: true, settings: row ? fromRow(row) : DEFAULT_KATEGORIE });
});

async function saveKategorieSettings(c: any) {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO kategorie_page_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Category page settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM kategorie_page_settings WHERE id = 'singleton'")
    .first();
  return c.json({ success: true, settings: fromRow(row as D1Row) });
}

// The admin page saves via POST; PUT kept for compatibility.
settings.post("/kategorie-settings", authMiddleware, requireStaff, saveKategorieSettings);
settings.put("/kategorie-settings", authMiddleware, requireStaff, saveKategorieSettings);

// ── /api/furniture-page-settings & /api/furniture-aussen-page-settings ───────
// Two special category pages — "Innen Furniture" (served at /binnen/[slug])
// and "Außen Furniture" (/buiten/[slug]) — each with its own admin-
// configurable slug plus SEO/long content/FAQs. They live under different
// fixed prefixes, so the two slugs are independent and may be the same value
// (e.g. both "moebel" → /binnen/moebel and /buiten/moebel).
const DEFAULT_FURNITURE_PAGE = {
  slug: "",
  pageTitle: "Meubels binnen",
  seoTitle: "Meubels binnen | NL FURNITURE",
  seoDescription: "Ontdek ons meubelaanbod voor binnen bij NL FURNITURE.",
  longContent: "",
  faqs: [],
  // Tile image for the "Möbel" card prepended to the home page's Innenbereich
  // Parent Category grid (see /api/parent-categories consumers on the Frontend).
  image: "",
};

const DEFAULT_FURNITURE_AUSSEN_PAGE = {
  slug: "",
  pageTitle: "Meubels buiten",
  seoTitle: "Meubels buiten | NL FURNITURE",
  seoDescription: "Ontdek ons meubelaanbod voor buiten bij NL FURNITURE.",
  longContent: "",
  faqs: [],
  // Tile image for the "Möbel" card prepended to the home page's Außenbereich
  // Parent Category grid.
  image: "",
};

settings.get("/furniture-page-settings", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM furniture_page_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  const result = row ? { ...DEFAULT_FURNITURE_PAGE, ...fromRow(row) } : DEFAULT_FURNITURE_PAGE;
  return c.json({ success: true, settings: result });
});

async function saveFurniturePageSettings(c: any) {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (body.slug !== undefined) {
    body.slug = String(body.slug).trim().toLowerCase();
  }

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...DEFAULT_FURNITURE_PAGE, ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO furniture_page_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Indoor furniture page settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM furniture_page_settings WHERE id = 'singleton'")
    .first();
  const result = { ...DEFAULT_FURNITURE_PAGE, ...fromRow(row as D1Row) };
  return c.json({ success: true, settings: result });
}

settings.post("/furniture-page-settings", authMiddleware, requireStaff, saveFurniturePageSettings);
settings.put("/furniture-page-settings", authMiddleware, requireStaff, saveFurniturePageSettings);

settings.get("/furniture-aussen-page-settings", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM furniture_aussen_page_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  const result = row ? { ...DEFAULT_FURNITURE_AUSSEN_PAGE, ...fromRow(row) } : DEFAULT_FURNITURE_AUSSEN_PAGE;
  return c.json({ success: true, settings: result });
});

async function saveFurnitureAussenPageSettings(c: any) {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (body.slug !== undefined) {
    body.slug = String(body.slug).trim().toLowerCase();
  }

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...DEFAULT_FURNITURE_AUSSEN_PAGE, ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO furniture_aussen_page_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "Outdoor furniture page settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM furniture_aussen_page_settings WHERE id = 'singleton'")
    .first();
  const result = { ...DEFAULT_FURNITURE_AUSSEN_PAGE, ...fromRow(row as D1Row) };
  return c.json({ success: true, settings: result });
}

settings.post("/furniture-aussen-page-settings", authMiddleware, requireStaff, saveFurnitureAussenPageSettings);
settings.put("/furniture-aussen-page-settings", authMiddleware, requireStaff, saveFurnitureAussenPageSettings);

// ── /api/page-seo-settings/:pageKey ──────────────────────────────────────────
settings.get("/page-seo-settings/:pageKey", async (c) => {
  const { pageKey } = c.req.param();
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM page_seo_settings WHERE page_key = ? LIMIT 1"
  ).bind(pageKey).first<D1Row>();
  return c.json(
    row
      ? fromRow(row)
      : { pageKey, pageTitle: "", pageSubtitle: "", longContent: "", faqs: [], seoTitle: "", seoDescription: "", seoKeywords: "" }
  );
});

settings.put("/page-seo-settings/:pageKey", authMiddleware, requireStaff, async (c) => {
  const { pageKey } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const id = newId();
  const insertDoc = JSON.stringify({ ...body, pageKey, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, pageKey, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO page_seo_settings (id, page_key, data) VALUES (?, ?, ?)
       ON CONFLICT(page_key) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(id, pageKey, insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "SEO settings updated", `Seite: ${pageKey}`);
  const row = await db
    .prepare("SELECT id, data FROM page_seo_settings WHERE page_key = ? LIMIT 1")
    .bind(pageKey)
    .first<D1Row>();
  return c.json(fromRow(row));
});
