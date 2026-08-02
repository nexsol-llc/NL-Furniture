import { Hono } from "hono";
import { Env } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { productsFromRows, safeJsonParse, type UserRow, type ProductRow } from "../db.js";

const customer = new Hono<{ Bindings: Env }>();

// ── GET /api/customer/wishlist ────────────────────────────────────────────────
customer.get("/wishlist", authMiddleware, async (c) => {
  const db = c.env.DB;
  const jwtUser = c.get("user");

  const row = await db
    .prepare("SELECT liked_products FROM users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id)
    .first<{ liked_products: string }>();

  if (!row) return c.json({ error: "User not found" }, 404);

  const likedIds: string[] = safeJsonParse(row.liked_products, []);
  if (likedIds.length === 0) return c.json({ products: [] });

  const placeholders = likedIds.map(() => "?").join(", ");
  const { results } = await db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...likedIds)
    .all<ProductRow>();

  return c.json({ products: productsFromRows(results) });
});

// ── POST /api/customer/wishlist ───────────────────────────────────────────────
customer.post("/wishlist", authMiddleware, async (c) => {
  const db = c.env.DB;
  const jwtUser = c.get("user");
  const { productId } = await c.req.json();

  if (!productId) return c.json({ error: "productId is required" }, 400);

  const row = await db
    .prepare("SELECT id, liked_products FROM users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id)
    .first<UserRow>();

  if (!row) return c.json({ error: "User not found" }, 404);

  const current: string[] = safeJsonParse(row.liked_products, []);
  if (!current.includes(productId)) {
    current.push(productId);
    await db
      .prepare("UPDATE users SET liked_products = ?, updated_at = ? WHERE id = ?")
      .bind(JSON.stringify(current), new Date().toISOString(), row.id)
      .run();
  }

  return c.json({ success: true, likedProducts: current });
});

// ── DELETE /api/customer/wishlist?productId=... ───────────────────────────────
customer.delete("/wishlist", authMiddleware, async (c) => {
  const db = c.env.DB;
  const jwtUser = c.get("user");
  const productId = c.req.query("productId");

  if (!productId) return c.json({ error: "productId query parameter required" }, 400);

  const row = await db
    .prepare("SELECT id, liked_products FROM users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id)
    .first<UserRow>();

  if (!row) return c.json({ error: "User not found" }, 404);

  const current: string[] = safeJsonParse(row.liked_products, []);
  const updated = current.filter((id) => id !== productId);

  await db
    .prepare("UPDATE users SET liked_products = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(updated), new Date().toISOString(), row.id)
    .run();

  return c.json({ success: true, likedProducts: updated });
});

export default customer;
