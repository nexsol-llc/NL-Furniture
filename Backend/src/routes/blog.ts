import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const blog = new Hono<{ Bindings: Env }>();

// ── GET /api/blog ─────────────────────────────────────────────────────────────
blog.get("/", async (c) => {
  const db = c.env.DB;
  const summary = c.req.query("summary") === "true";
  const category = c.req.query("category");
  // ?featured=true → only posts flagged for the home page's inspiration rail.
  const featuredOnly = c.req.query("featured") === "true";

  const where: string[] = [];
  const params: string[] = [];
  if (category) {
    where.push("json_extract(data, '$.category') = ?");
    params.push(category);
  }
  // `featured` is stored as a JSON boolean, which json_extract returns as 1.
  if (featuredOnly) where.push("json_extract(data, '$.featured') = 1");

  const sql = `SELECT id, data FROM blogs${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
  const { results } = await db.prepare(sql).bind(...params).all<D1Row>();
  const items = fromRows(results);

  if (summary) {
    const summarized = items.map(({ _id, title, subHeading, category, author, heroImage, thumbnail, featured, createdAt }: any) => ({
      _id, title, subHeading, category, author, heroImage, thumbnail, featured: featured === true, createdAt,
    }));
    return c.json(summarized, 200, { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" });
  }

  return c.json(items);
});

// ── GET /api/blog/:id ─────────────────────────────────────────────────────────
blog.get("/:id", async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM blogs WHERE id = ? LIMIT 1"
  ).bind(id).first<D1Row>();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/blog ────────────────────────────────────────────────────────────
blog.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  if (!body.title || !body.category) {
    return c.json({ error: "title and category are required" }, 400);
  }

  const id = newId();
  const now = nowIso();
  const doc = {
    ...body,
    author: body.author || user.name || "Admin",
    sections: body.sections ?? [],
    faqs: body.faqs ?? [],
    seo: body.seo ?? {},
    featured: body.featured === true || body.featured === "true",
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare("INSERT INTO blogs (id, created_at, data) VALUES (?, ?, ?)")
    .bind(id, now, JSON.stringify(doc))
    .run();

  await logActivity(db, user.email, "Blog post created", `Title: "${body.title}"`);
  return c.json({ _id: id, ...doc }, 201);
});

// ── PUT /api/blog/:id ─────────────────────────────────────────────────────────
blog.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM blogs WHERE id = ? LIMIT 1")
    .bind(id).first<D1Row>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  // Keep `featured` a real boolean — the ?featured=true filter matches on it.
  if (body.featured !== undefined) body.featured = body.featured === true || body.featured === "true";

  const updatedDoc = { ...JSON.parse(existing.data), ...body, updatedAt: nowIso() };
  await db
    .prepare("UPDATE blogs SET data = ? WHERE id = ?")
    .bind(JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Blog post updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

// ── DELETE /api/blog/:id ──────────────────────────────────────────────────────
blog.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const res = await db.prepare("DELETE FROM blogs WHERE id = ?").bind(id).run();
  if (res.meta.changes === 0) return c.json({ error: "Not found" }, 404);

  await logActivity(db, user.email, "Blog post deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default blog;
