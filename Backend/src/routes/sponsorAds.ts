import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso, safeJsonParse } from "../db.js";
import { authMiddleware, requireAdmin, requirePermission } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const sponsorAds = new Hono<{ Bindings: Env }>();

/**
 * Where an ad can be booked. A `multiple` placement holds an ordered list; a
 * single one holds at most one ad, so saving into an occupied single slot
 * replaces the ad already there. Keys mirror Frontend `lib/sponsorAds.ts` —
 * keep the two in sync.
 */
const PLACEMENTS = {
  hero_below: { multiple: true },
  compare_below: { multiple: true },
  sidebar_1: { multiple: false },
  sidebar_2: { multiple: false },
  sidebar_3: { multiple: false },
  sidebar_4: { multiple: false },
  sidebar_5: { multiple: false },
} as const;

type Placement = keyof typeof PLACEMENTS;

const isPlacement = (value: unknown): value is Placement =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(PLACEMENTS, value);

type AdRow = { id: string; placement: string; position: number; active: number; data: string };

const COLUMNS = "id, placement, position, active, data";

function toAd(row: AdRow) {
  return {
    _id: row.id,
    ...safeJsonParse<Record<string, unknown>>(row.data, {}),
    placement: row.placement,
    position: row.position,
    active: row.active === 1,
  };
}

// The link is rendered straight into an href on the public site.
const UNSAFE_LINK = /^\s*(javascript|data|vbscript):/i;

type AdFields = { image?: string; link?: string; title?: string; active?: boolean };

/** The editable fields present on a request body — absent keys stay absent. */
function readFields(body: any): { fields: AdFields; error?: string } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const fields: AdFields = {};
  if (body?.image !== undefined) fields.image = str(body.image);
  if (body?.link !== undefined) fields.link = str(body.link);
  if (body?.title !== undefined) fields.title = str(body.title);
  if (body?.active !== undefined) fields.active = body.active === true || body.active === "true";

  if (fields.image === "") return { fields, error: "Image required" };
  if (fields.link && UNSAFE_LINK.test(fields.link)) {
    return { fields, error: "Link must be a web address or a site path" };
  }
  return { fields };
}

// ── GET /api/sponsor-ads — public feed: active ads grouped by placement ──────
sponsorAds.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLUMNS} FROM sponsor_ads WHERE active = 1 ORDER BY position ASC, created_at ASC`
  ).all<AdRow>();

  const ads = results.map(toAd);
  const many = (placement: Placement) => ads.filter((a) => a.placement === placement);
  const single = (placement: Placement) => ads.find((a) => a.placement === placement) ?? null;

  // Every placement key is present: a list for multiple ones, an ad or null for
  // single ones — so a new entry in PLACEMENTS reaches the feed on its own.
  const placements = Object.keys(PLACEMENTS) as Placement[];
  return c.json(
    Object.fromEntries(
      placements.map((p) => [p, PLACEMENTS[p].multiple ? many(p) : single(p)])
    )
  );
});

// ── GET /api/sponsor-ads/admin — every ad, inactive included ─────────────────
sponsorAds.get("/admin", authMiddleware, requirePermission("sponsor-ads"), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLUMNS} FROM sponsor_ads ORDER BY placement ASC, position ASC, created_at ASC`
  ).all<AdRow>();
  return c.json(results.map(toAd));
});

// ── POST /api/sponsor-ads — book an ad (replaces the ad in a single slot) ────
sponsorAds.post("/", authMiddleware, requirePermission("sponsor-ads"), async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);

  const placement = body?.placement;
  if (!isPlacement(placement)) return c.json({ error: "Unknown placement" }, 400);

  const { fields, error } = readFields(body);
  if (error) return c.json({ error }, 400);
  if (!fields.image) return c.json({ error: "Image required" }, 400);

  const now = nowIso();
  const active = fields.active ?? true ? 1 : 0;
  const doc = { image: fields.image, link: fields.link ?? "", title: fields.title ?? "" };

  if (!PLACEMENTS[placement].multiple) {
    const existing = await db
      .prepare(`SELECT ${COLUMNS} FROM sponsor_ads WHERE placement = ? LIMIT 1`)
      .bind(placement)
      .first<AdRow>();

    if (existing) {
      const data = JSON.stringify({ ...safeJsonParse(existing.data, {}), ...doc, updatedAt: now });
      await db
        .prepare("UPDATE sponsor_ads SET active = ?, data = ? WHERE id = ?")
        .bind(active, data, existing.id)
        .run();
      await logActivity(db, user.email, "Sponsor ad replaced", `Placement: ${placement}`);
      return c.json({ success: true, ad: toAd({ ...existing, active, data }) });
    }
  }

  const last = await db
    .prepare("SELECT MAX(position) AS max FROM sponsor_ads WHERE placement = ?")
    .bind(placement)
    .first<{ max: number | null }>();
  const position = (last?.max ?? -1) + 1;

  const id = newId();
  const data = JSON.stringify({ ...doc, createdAt: now, updatedAt: now });
  await db
    .prepare(
      "INSERT INTO sponsor_ads (id, placement, position, active, created_at, data) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(id, placement, position, active, now, data)
    .run();

  await logActivity(db, user.email, "Sponsor ad created", `Placement: ${placement}`);
  return c.json({ success: true, ad: toAd({ id, placement, position, active, data }) }, 201);
});

// ── POST /api/sponsor-ads/reorder — { placement, ids } in display order ──────
sponsorAds.post("/reorder", authMiddleware, requirePermission("sponsor-ads"), async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);

  const placement = body?.placement;
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];
  if (!isPlacement(placement) || ids.length === 0) {
    return c.json({ error: "placement and ids required" }, 400);
  }

  await db.batch(
    ids.map((id, index) =>
      db
        .prepare("UPDATE sponsor_ads SET position = ? WHERE id = ? AND placement = ?")
        .bind(index, id, placement)
    )
  );

  await logActivity(db, user.email, "Sponsor ads reordered", `Placement: ${placement}`);
  return c.json({ success: true });
});

// ── PUT /api/sponsor-ads/:id — update image / link / title / active ─────────
sponsorAds.put("/:id", authMiddleware, requirePermission("sponsor-ads"), async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);

  const { fields, error } = readFields(body);
  if (error) return c.json({ error }, 400);

  const existing = await db
    .prepare(`SELECT ${COLUMNS} FROM sponsor_ads WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<AdRow>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const { active: activeField, ...docFields } = fields;
  const active = activeField === undefined ? existing.active : activeField ? 1 : 0;
  const data = JSON.stringify({
    ...safeJsonParse(existing.data, {}),
    ...docFields,
    updatedAt: nowIso(),
  });

  await db
    .prepare("UPDATE sponsor_ads SET active = ?, data = ? WHERE id = ?")
    .bind(active, data, id)
    .run();

  await logActivity(db, user.email, "Sponsor ad updated", `ID: ${id}`);
  return c.json({ success: true, ad: toAd({ ...existing, active, data }) });
});

// ── DELETE /api/sponsor-ads/:id ──────────────────────────────────────────────
sponsorAds.delete("/:id", authMiddleware, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const user = c.get("user");

  await db.prepare("DELETE FROM sponsor_ads WHERE id = ?").bind(id).run();
  await logActivity(db, user.email, "Sponsor ad deleted", `ID: ${id}`);
  return c.json({ success: true });
});

export default sponsorAds;
