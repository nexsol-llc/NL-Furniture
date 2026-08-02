import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── /api/coupon-home-settings ─────────────────────────────────────────────────
// Singleton that holds everything on the /coupons page except the carousel
// products (those live in coupon_home_products, keyed by `section`).
export const couponHomeSettings = new Hono<{ Bindings: Env }>();

const DEFAULT_SETTINGS = {
  bannerSlides: [] as Array<{ image: string; link?: string }>,
  bestCouponsHeading:
    "De beste kortingscodes, actiecodes en cashbackaanbiedingen",
  bestCoupons: [] as Array<{
    title: string;
    description: string;
    image: string;
    link?: string;
    buttonText?: string;
    variant?: string;
  }>,
  cashbackHeading: "Cashback bij onze favoriete winkels",
  cashbackSubheading: "Onze vertrouwde merken",
  cashbackStores: [] as Array<{ name: string; logo: string; link?: string }>,
  sliderGroups: [] as Array<{
    key: string;
    heading: string;
    subtitle?: string;
    brandName?: string;
    brandLogo?: string;
    sortOrder?: number;
  }>,
  designerSection: {
    enabled: true,
    image: "/images/Sonder.png",
    bgColor: "#d97706",
    smallHeading: "5 door designers aanbevolen",
    title: "MEUBELS",
    subtitle: "Aanbiedingen",
    priceText: "Allemaal onder € 499",
    rightHeading: "5 door designers aanbevolen meubeldeals — allemaal onder € 499",
    rightDescription: "Ontgrendel exclusieve kortingen op premium meubels",
    buttonText: "BEKIJK DESIGNERTIPS",
    buttonLink: "",
  },
  dealsHeading: "Mega meubeldeals",
  longContent: "",
  faqs: [] as Array<{ question: string; answer: string }>,
  seoTitle: "Kortingscodes en actiecodes voor meubels | NL FURNITURE",
  seoDescription:
    "De beste kortingscodes, actiecodes en cashbackaanbiedingen voor meubels en woonaccessoires.",
  seoKeywords: "",
};

couponHomeSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM coupon_home_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? { ...DEFAULT_SETTINGS, ...fromRow(row) } : DEFAULT_SETTINGS);
});

couponHomeSettings.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO coupon_home_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  const row = await db
    .prepare("SELECT id, data FROM coupon_home_settings WHERE id = 'singleton'")
    .first<D1Row>();

  await logActivity(db, user.email, "Coupons home settings updated", "");
  return c.json(fromRow(row));
});

// ── /api/coupon-home-products ─────────────────────────────────────────────────
export const couponHomeProducts = new Hono<{ Bindings: Env }>();

couponHomeProducts.get("/", async (c) => {
  const section = c.req.query("section");
  const sql = section
    ? "SELECT id, data FROM coupon_home_products WHERE section = ? ORDER BY sort_order ASC, created_at DESC"
    : "SELECT id, data FROM coupon_home_products ORDER BY sort_order ASC, created_at DESC";
  const { results } = await c.env.DB.prepare(sql)
    .bind(...(section ? [section] : []))
    .all<D1Row>();
  // Consumed as a bare array by the admin panel and the public /coupons page.
  return c.json(fromRows(results));
});

couponHomeProducts.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM coupon_home_products WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

couponHomeProducts.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.section || !body.name) {
    return c.json({ error: "section and name are required" }, 400);
  }

  const id = newId();
  const now = nowIso();
  const sortOrder = body.sortOrder ?? 0;
  const doc = { ...body, sortOrder, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO coupon_home_products (id, section, sort_order, created_at, data) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, body.section, sortOrder, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Coupons home product created", `${body.section}: ${body.name}`);
  return c.json({ success: true, id }, 201);
});

couponHomeProducts.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM coupon_home_products WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE coupon_home_products SET section = ?, sort_order = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.section ?? "", updatedDoc.sortOrder ?? 0, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Coupons home product updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

couponHomeProducts.delete("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM coupon_home_products WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Coupons home product deleted", `ID: ${id}`);
  return c.json({ success: true });
});
