import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, productsFromRows, userFromRow, type D1Row, type UserRow, type ProductRow } from "../db.js";
import { adminAuthMiddleware, requireAdmin, requireSuperAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const admin = new Hono<{ Bindings: Env }>();

admin.use("/*", adminAuthMiddleware);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
admin.get("/stats", requireAdmin, async (c) => {
  const db = c.env.DB;

  const [
    brandsRes,
    couponsRes,
    usersRes,
    categoriesRes,
    influencersRes,
    productsRes,
    csvUploadsRes,
    cookieAcceptedRes,
    cookieRefusedRes,
    newsletterRes,
  ] = await db.batch([
    db.prepare("SELECT COUNT(*) as n FROM brands"),
    db.prepare("SELECT COUNT(*) as n FROM coupons"),
    db.prepare("SELECT COUNT(*) as n FROM users"),
    db.prepare("SELECT COUNT(*) as n FROM category_catalogs"),
    db.prepare("SELECT COUNT(*) as n FROM influencer_brands"),
    db.prepare("SELECT COUNT(*) as n FROM products"),
    db.prepare("SELECT COUNT(*) as n FROM csv_upload_logs"),
    db.prepare("SELECT COUNT(*) as n FROM cookie_consent_logs WHERE choice = 'accepted'"),
    db.prepare("SELECT COUNT(*) as n FROM cookie_consent_logs WHERE choice = 'refused'"),
    db.prepare("SELECT COUNT(*) as n FROM newsletters"),
  ]);

  const n = (r: any) => (r.results[0] as any).n as number;

  // Active coupon stores = brands that have at least one coupon
  const { results: brandSlugs } = await db
    .prepare("SELECT DISTINCT brand_slug FROM coupons")
    .all<{ brand_slug: string }>();

  let activeCouponStores = 0;
  if (brandSlugs.length > 0) {
    const placeholders = brandSlugs.map(() => "?").join(", ");
    const slugValues = brandSlugs.map((r) => r.brand_slug);
    const res = await db
      .prepare(`SELECT COUNT(*) as n FROM brands WHERE slug IN (${placeholders})`)
      .bind(...slugValues)
      .first<{ n: number }>();
    activeCouponStores = res?.n ?? 0;
  }

  return c.json({
    stats: {
      totalBrands: n(brandsRes),
      activeCouponStores,
      totalCoupons: n(couponsRes),
      totalUsers: n(usersRes),
      totalCategories: n(categoriesRes),
      totalInfluencers: n(influencersRes),
      totalProducts: n(productsRes),
      totalCsvUploads: n(csvUploadsRes),
      cookieAccepted: n(cookieAcceptedRes),
      cookieRefused: n(cookieRefusedRes),
      totalNewsletter: n(newsletterRes),
    },
  });
});

// ── GET /api/admin/activity-log ───────────────────────────────────────────────
admin.get("/activity-log", requireAdmin, async (c) => {
  const db = c.env.DB;
  const limit = Math.min(Number(c.req.query("limit") ?? "100"), 500);

  const { results } = await db
    .prepare("SELECT id, data FROM activity_logs ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<D1Row>();

  const logs = results.map((r) => ({ _id: r.id, ...JSON.parse(r.data) }));
  return c.json({ logs });
});

// ── GET /api/admin/search-products ───────────────────────────────────────────
admin.get("/search-products", requireAdmin, async (c) => {
  const db = c.env.DB;
  const q = c.req.query("q");
  const limit = Math.min(Number(c.req.query("limit") ?? "20"), 50);

  if (!q || q.trim().length < 2) return c.json({ products: [] });

  const term = `%${q.trim()}%`;
  const { results } = await db
    .prepare(`
      SELECT id, aw_product_id, product_name, brand_name, aw_image_url, merchant_image_url,
             search_price, display_price, aw_deep_link, merchant_name, merchant_category,
             category_name, colour, description, product_short_description, aw_thumb_url,
             delivery_cost, alternate_image, alternate_image_two, alternate_image_three,
             alternate_image_four, merchant_deep_link, merchant_product_id, merchant_id,
             data_feed_id, is_sponsored, created_at, updated_at
      FROM products
      WHERE LOWER(product_name) LIKE LOWER(?)
         OR LOWER(brand_name) LIKE LOWER(?)
         OR LOWER(merchant_name) LIKE LOWER(?)
      LIMIT ?
    `)
    .bind(term, term, term, limit)
    .all<ProductRow>();

  return c.json({ products: productsFromRows(results) });
});

// ── GET /api/admin/coupons — admin view: all coupons ─────────────────────────
admin.get("/coupons", requireAdmin, async (c) => {
  const db = c.env.DB;
  const brandSlug = c.req.query("brandSlug");

  const sql = brandSlug
    ? "SELECT id, data FROM coupons WHERE brand_slug = ? ORDER BY is_expired ASC, position ASC, created_at DESC"
    : "SELECT id, data FROM coupons ORDER BY is_expired ASC, position ASC, created_at DESC";

  const { results } = await db.prepare(sql).bind(...(brandSlug ? [brandSlug] : [])).all<D1Row>();
  const coupons = results.map((r) => ({ _id: r.id, ...JSON.parse(r.data) }));

  return c.json({ coupons });
});

// ── GET/PUT /api/admin/system-settings ───────────────────────────────────────
admin.get("/system-settings", requireAdmin, async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM system_settings WHERE id = 'singleton' LIMIT 1"
  ).first<D1Row>();
  return c.json(row ? fromRow(row) : { newsletterNotifyEmail: "" });
});

admin.put("/system-settings", requireAdmin, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const now = nowIso();
  const insertDoc = JSON.stringify({ ...body, createdAt: now, updatedAt: now });
  const patchDoc = JSON.stringify({ ...body, updatedAt: now });

  await db
    .prepare(
      `INSERT INTO system_settings (id, data) VALUES ('singleton', ?)
       ON CONFLICT(id) DO UPDATE SET data = json_patch(data, ?)`
    )
    .bind(insertDoc, patchDoc)
    .run();

  await logActivity(db, user.email, "System settings updated", "");
  const row = await db
    .prepare("SELECT id, data FROM system_settings WHERE id = 'singleton'")
    .first<D1Row>();
  return c.json(fromRow(row));
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
admin.get("/users", requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, username, email, role, avatar_url, liked_products, created_at, updated_at FROM users ORDER BY created_at DESC"
  ).all<UserRow>();

  const users = results.map((row) => userFromRow(row)).filter(Boolean);
  return c.json({ users });
});

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
admin.put("/users/:id", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (body.role === "admin" && id !== user.id) {
    return c.json({ error: "Cannot promote other users to admin" }, 403);
  }

  const existing = await db
    .prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .bind(id).first<UserRow>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const { password_hash, reset_token, reset_token_expiry, ..._ } = body;

  const now = nowIso();
  await db.prepare(`
    UPDATE users SET
      username = ?,
      email = ?,
      role = ?,
      avatar_url = ?,
      liked_products = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.username ?? existing.username,
    body.email ?? existing.email,
    body.role ?? existing.role,
    body.avatarUrl ?? existing.avatar_url,
    body.likedProducts ? JSON.stringify(body.likedProducts) : existing.liked_products,
    now,
    id
  ).run();

  await logActivity(db, user.email, "User updated", `ID: ${id}`);

  const updated = await db
    .prepare("SELECT id, username, email, role, avatar_url, liked_products, created_at, updated_at FROM users WHERE id = ? LIMIT 1")
    .bind(id).first<UserRow>();
  return c.json(userFromRow(updated));
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
admin.delete("/users/:id", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  if (id === user.id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  const target = await db
    .prepare("SELECT id, email FROM users WHERE id = ? LIMIT 1")
    .bind(id).first<{ id: string; email: string }>();
  if (!target) return c.json({ error: "Not found" }, 404);

  if (target.email === "admin@nl-furniture.nl") {
    return c.json({ error: "Cannot delete the main admin account" }, 403);
  }

  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "User deleted", `Email: ${target.email}`);

  return c.json({ success: true });
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
admin.post("/users", requireAdmin, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const { username, email, role, avatarUrl, password } = await c.req.json();

  if (!username || !email || !password) {
    return c.json({ error: "username, email, and password are required" }, 400);
  }

  const emailNorm = email.toLowerCase().trim();
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1")
    .bind(emailNorm, username).first();
  if (existing) return c.json({ error: "User with this email or username already exists" }, 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const id = newId();
  const now = nowIso();

  await db.prepare(
    "INSERT INTO users (id, username, email, role, avatar_url, liked_products, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, username.trim(), emailNorm, role || "user", avatarUrl || "", "[]", passwordHash, now, now).run();

  await logActivity(db, user.email, "User created", `Email: ${emailNorm}`);
  return c.json({ success: true, userId: id }, 201);
});

// ── PUT /api/admin/users/:id/password ────────────────────────────────────────
admin.put("/users/:id/password", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");
  const { password } = await c.req.json();

  if (!password || password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await db
    .prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
    .bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(passwordHash, nowIso(), id).run();

  await logActivity(db, user.email, "User password changed", `ID: ${id}`);
  return c.json({ success: true });
});

export default admin;
