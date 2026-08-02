import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

// ── /api/top-angebote-products ────────────────────────────────────────────────
export const topAngeboteProducts = new Hono<{ Bindings: Env }>();

topAngeboteProducts.get("/", async (c) => {
  const category = c.req.query("category");
  const sql = category
    ? "SELECT id, data FROM top_angebote_products WHERE category = ? ORDER BY sort_order ASC, created_at DESC"
    : "SELECT id, data FROM top_angebote_products ORDER BY sort_order ASC, created_at DESC";
  const { results } = await c.env.DB.prepare(sql).bind(...(category ? [category] : [])).all<D1Row>();
  // Consumed as a bare array by the admin panel and the public /topaanbiedingen page.
  return c.json(fromRows(results));
});

topAngeboteProducts.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM top_angebote_products WHERE id = ? LIMIT 1"
  ).bind(c.req.param("id")).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

topAngeboteProducts.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.category || !body.title) {
    return c.json({ error: "category and title are required" }, 400);
  }

  const id = newId();
  const now = nowIso();
  const sortOrder = body.sortOrder ?? 0;
  const doc = { ...body, sortOrder, createdAt: now, updatedAt: now };

  await db
    .prepare(
      "INSERT INTO top_angebote_products (id, category, sort_order, created_at, data) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, body.category, sortOrder, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Top offer product created", `${body.category}: ${body.title}`);
  return c.json({ success: true, id }, 201);
});

topAngeboteProducts.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM top_angebote_products WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE top_angebote_products SET category = ?, sort_order = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.category ?? "", updatedDoc.sortOrder ?? 0, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Top offer product updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

topAngeboteProducts.delete("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM top_angebote_products WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Top offer product deleted", `ID: ${id}`);
  return c.json({ success: true });
});

// ── /api/top-angebote-settings ────────────────────────────────────────────────
export const topAngeboteSettings = new Hono<{ Bindings: Env }>();

const DEFAULT_SETTINGS = {
  pageTitle: "Topaanbiedingen",
  pageSubtitle: "De beste deals voor jouw interieur",
  bannerTitle: "MEGA ZOMERSALE",
  bannerSubtitle: "Tot 70% KORTING op meubels en woonaccessoires",
  bannerImage: "",
  longContent: "",
  faqs: [],
  seoTitle: "Topaanbiedingen – de beste meubeldeals",
  seoDescription: "Ontdek de beste aanbiedingen voor meubels en woonaccessoires.",
  seoKeywords: "",
};

topAngeboteSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM top_angebote_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? fromRow(row) : DEFAULT_SETTINGS);
});

topAngeboteSettings.put("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO top_angebote_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  const row = await db
    .prepare("SELECT id, data FROM top_angebote_settings WHERE id = 'singleton'")
    .first<D1Row>();

  await logActivity(db, user.email, "Top offers settings updated", "");
  return c.json(fromRow(row));
});
