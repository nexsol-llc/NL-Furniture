import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, fromRows, type D1Row } from "../db.js";
import { authMiddleware, requireStaff, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const media = new Hono<{ Bindings: Env }>();

// ── GET /api/media?page=1&limit=24&search= — paginated library ───────────────
media.get("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 24)));
  const search = (c.req.query("search") || "").trim();
  const offset = (page - 1) * limit;

  let total: number;
  let rows: D1Row[];

  if (search) {
    const like = `%${search}%`;
    const countRow = await db
      .prepare("SELECT COUNT(*) AS n FROM media WHERE filename LIKE ?")
      .bind(like)
      .first<{ n: number }>();
    total = countRow?.n ?? 0;

    const { results } = await db
      .prepare(
        "SELECT id, data FROM media WHERE filename LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
      )
      .bind(like, limit, offset)
      .all<D1Row>();
    rows = results;
  } else {
    const countRow = await db
      .prepare("SELECT COUNT(*) AS n FROM media")
      .first<{ n: number }>();
    total = countRow?.n ?? 0;

    const { results } = await db
      .prepare("SELECT id, data FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .bind(limit, offset)
      .all<D1Row>();
    rows = results;
  }

  return c.json({
    items: fromRows(rows),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// ── POST /api/media — upload one or more files into the library ──────────────
media.post("/", authMiddleware, requireStaff, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const formData = await c.req.formData();
  // Accept both repeated "files" entries and a single "file"
  const entries = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ] as unknown as (File | string)[];
  const files = entries.filter(
    (e): e is File => typeof e !== "string" && e.size > 0
  );

  if (!files.length) return c.json({ error: "No files provided" }, 400);

  const uploaded: Record<string, any>[] = [];
  const now = nowIso();

  for (const file of files) {
    const safeName = file.name.replace(/\s+/g, "-");
    const key = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    await c.env.IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const id = newId();
    const doc = {
      key,
      url: `/uploads/${key}`,
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      uploadedBy: user.email,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .prepare(
        "INSERT INTO media (id, key, filename, created_at, data) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(id, key, file.name, now, JSON.stringify(doc))
      .run();

    uploaded.push({ _id: id, ...doc });
  }

  await logActivity(
    db,
    user.email,
    "Medien hochgeladen",
    `${uploaded.length} Datei(en): ${files.map((f) => f.name).join(", ").slice(0, 200)}`
  );

  return c.json({ success: true, items: uploaded }, 201);
});

// ── POST /api/media/sync — backfill index from existing R2 objects ───────────
media.post("/sync", authMiddleware, requireAdmin, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const now = nowIso();

  let cursor: string | undefined = undefined;
  let added = 0;
  let scanned = 0;

  do {
    const listing: R2Objects = await c.env.IMAGES.list({ cursor, limit: 500 });

    for (const obj of listing.objects) {
      scanned++;
      const existing = await db
        .prepare("SELECT id FROM media WHERE key = ? LIMIT 1")
        .bind(obj.key)
        .first<{ id: string }>();
      if (existing) continue;

      const filename = obj.key.split("/").pop() ?? obj.key;
      const uploadedAt = obj.uploaded ? new Date(obj.uploaded).toISOString() : now;
      const doc = {
        key: obj.key,
        url: `/uploads/${obj.key}`,
        filename,
        size: obj.size,
        contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
        uploadedBy: "sync",
        createdAt: uploadedAt,
        updatedAt: uploadedAt,
      };

      await db
        .prepare(
          "INSERT INTO media (id, key, filename, created_at, data) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(newId(), obj.key, filename, uploadedAt, JSON.stringify(doc))
        .run();
      added++;
    }

    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  await logActivity(
    db,
    user.email,
    "Medienbibliothek synchronisiert",
    `${scanned} objects scanned, ${added} added`
  );

  return c.json({ success: true, scanned, added });
});

// ── PUT /api/media/:id/file — overwrite the R2 object in place ───────────────
// Used by the image optimizer: the key (and therefore the URL) stays the same,
// so pages referencing the image keep working.
media.put("/:id/file", authMiddleware, requireStaff, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const row = await db
    .prepare("SELECT id, key, data FROM media WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string; key: string; data: string }>();

  if (!row) return c.json({ error: "Not found" }, 404);

  const formData = await c.req.formData();
  const file = formData.get("file") as unknown as File | string | null;
  if (!file || typeof file === "string" || file.size === 0) {
    return c.json({ error: "No file provided" }, 400);
  }

  await c.env.IMAGES.put(row.key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const now = nowIso();
  const doc = {
    ...JSON.parse(row.data),
    size: file.size,
    contentType: file.type || "application/octet-stream",
    optimizedAt: now,
    updatedAt: now,
  };

  await db
    .prepare("UPDATE media SET data = ? WHERE id = ?")
    .bind(JSON.stringify(doc), id)
    .run();

  await logActivity(db, user.email, "Media item optimized", row.key);
  return c.json({ success: true, item: { _id: id, ...doc } });
});

// ── DELETE /api/media/:id — remove from R2 and the index ─────────────────────
media.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  const row = await db
    .prepare("SELECT id, key, data FROM media WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string; key: string; data: string }>();

  if (!row) return c.json({ error: "Not found" }, 404);

  await c.env.IMAGES.delete(row.key);
  await db.prepare("DELETE FROM media WHERE id = ?").bind(id).run();

  await logActivity(db, user.email, "Media item deleted", row.key);
  return c.json({ success: true });
});

export default media;
