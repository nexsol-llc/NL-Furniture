import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRow, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const hero = new Hono<{ Bindings: Env }>();

// ── GET /api/hero — all hero slots (3 slots with default fallbacks) ──────────
const SLOT_FALLBACKS: Record<number, { image: string; title: string; subtitle: string; link: string }> = {
  1: { image: "/hero/chair.jpg", title: "Premium Chairs", subtitle: "Comfort & Style", link: "/category/moebel" },
  2: { image: "/hero/sofa.jpg", title: "Modern Sofas", subtitle: "Chic designs", link: "/category/moebel" },
  3: { image: "/hero/table.jpg", title: "Elegant Tables", subtitle: "Wood & Metal", link: "/category/moebel" },
};

hero.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, data FROM heroes ORDER BY slot ASC"
  ).all<D1Row>();

  const heroes = fromRows(results);
  const slots = [1, 2, 3].map(
    (slot) =>
      heroes.find((h) => h.slot === slot) ?? {
        _id: `fallback-${slot}`,
        slot,
        ...SLOT_FALLBACKS[slot],
      }
  );
  return c.json(slots);
});

// ── GET /api/hero/:id ────────────────────────────────────────────────────────
hero.get("/:id", async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    "SELECT id, data FROM heroes WHERE id = ? LIMIT 1"
  ).bind(id).first<D1Row>();

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(fromRow(row));
});

// ── POST /api/hero — create / upsert a slot (multipart form with image file) ─
hero.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const formData = await c.req.formData();
  const title = (formData.get("title") as string | null) ?? "";
  const subtitle = (formData.get("subtitle") as string | null) ?? "";
  const link = (formData.get("link") as string | null) ?? "";
  const slotNum = Number(formData.get("slot") || 1);
  const file = formData.get("image") as unknown as File | string | null;

  const now = nowIso();

  // Upsert by slot
  const existing = await db
    .prepare("SELECT id, data FROM heroes WHERE slot = ? LIMIT 1")
    .bind(slotNum)
    .first<D1Row>();

  const existingDoc = existing ? JSON.parse(existing.data) : null;
  let imagePath: string = existingDoc?.image ?? "";

  if (file && typeof file !== "string" && file.size > 0) {
    const key = `hero/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    await c.env.IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    imagePath = `/uploads/${key}`;
  } else if (typeof file === "string" && file.trim()) {
    // URL selected from the media library
    imagePath = file.trim();
  } else if (!existing) {
    return c.json({ error: "Image required for new cards" }, 400);
  }

  let id: string;
  let doc: Record<string, any>;

  if (existing) {
    doc = { ...existingDoc, title, subtitle, image: imagePath, link, slot: slotNum, updatedAt: now };
    await db
      .prepare("UPDATE heroes SET data = ? WHERE id = ?")
      .bind(JSON.stringify(doc), existing.id)
      .run();
    id = existing.id;
  } else {
    id = newId();
    doc = { title, subtitle, image: imagePath, link, slot: slotNum, createdAt: now, updatedAt: now };
    await db
      .prepare("INSERT INTO heroes (id, slot, data) VALUES (?, ?, ?)")
      .bind(id, slotNum, JSON.stringify(doc))
      .run();
  }

  await logActivity(db, user.email, "Hero created/updated", `Slot ${slotNum}`);
  return c.json({ success: true, hero: { _id: id, ...doc } }, 201);
});

// ── PUT /api/hero/:id ────────────────────────────────────────────────────────
hero.put("/:id", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const user = c.get("user");

  const existing = await db
    .prepare("SELECT id, data FROM heroes WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1Row>();

  if (!existing) return c.json({ error: "Not found" }, 404);

  const existingDoc = JSON.parse(existing.data);
  const updatedDoc = { ...existingDoc, ...body, updatedAt: nowIso() };

  await db
    .prepare("UPDATE heroes SET slot = ?, data = ? WHERE id = ?")
    .bind(updatedDoc.slot ?? existingDoc.slot, JSON.stringify(updatedDoc), id)
    .run();

  await logActivity(db, user.email, "Hero updated", `ID: ${id}`);
  return c.json({ _id: id, ...updatedDoc });
});

// ── DELETE /api/hero/:id ─────────────────────────────────────────────────────
hero.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM heroes WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Hero deleted", `ID: ${id}`);

  return c.json({ success: true });
});

export default hero;
