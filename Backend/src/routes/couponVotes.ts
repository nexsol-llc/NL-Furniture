import { Hono } from "hono";
import { Env } from "../types.js";
import { newId, nowIso } from "../db.js";

// ── /api/coupons/:id/vote, /api/coupons/:id/votes ─────────────────────────────
// Mounted on the same "/api/coupons" prefix as the main `coupons` router
// (Backend/src/index.ts already stacks multiple routers on that prefix via
// couponStores / couponSpecialOffers). Both routes here are 2-segment paths
// ("/:id/vote", "/:id/votes"), so they never collide with `coupons`'s 1-segment
// routes (`/:id`, `/featured`). The batch endpoint below is a single segment
// though, and Hono matches routes in registration order across stacked
// routers — `coupons.get("/:id")` was mounted first, so a single-segment path
// here would be swallowed by it. It's exported as its own router
// (`couponVotesBatch`) mounted at a separate "/api/coupon-votes-batch" prefix
// instead, to sidestep that collision entirely rather than depend on mount order.
//
// Voting is anonymous (no login) — the frontend keeps a random "visitor id" in
// localStorage and sends it as the X-Visitor-Id header. One vote per
// coupon+visitor is enforced by a unique index, and every vote must carry a
// valid Cloudflare Turnstile token to keep it bot-resistant.
export const couponVotes = new Hono<{ Bindings: Env }>();
export const couponVotesBatch = new Hono<{ Bindings: Env }>();

type RawCounts = { likes: number; dislikes: number };

async function countRealVotes(db: D1Database, couponId: string): Promise<RawCounts> {
  const { results } = await db
    .prepare("SELECT vote_type, COUNT(*) as n FROM coupon_votes WHERE coupon_id = ? GROUP BY vote_type")
    .bind(couponId)
    .all<{ vote_type: string; n: number }>();

  const counts: RawCounts = { likes: 0, dislikes: 0 };
  for (const row of results) {
    if (row.vote_type === "like") counts.likes = Number(row.n) || 0;
    else if (row.vote_type === "dislike") counts.dislikes = Number(row.n) || 0;
  }
  return counts;
}

// Admin-set "base" numbers live as JSON keys on the coupon's own data blob
// (likesBase/dislikesBase) — the displayed total is base + real votes.
function baseCounts(couponData: string | null | undefined): RawCounts {
  if (!couponData) return { likes: 0, dislikes: 0 };
  try {
    const doc = JSON.parse(couponData);
    return { likes: Number(doc.likesBase) || 0, dislikes: Number(doc.dislikesBase) || 0 };
  } catch {
    return { likes: 0, dislikes: 0 };
  }
}

async function verifyTurnstile(c: any, token: string | undefined): Promise<boolean> {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Not configured (e.g. local dev without the secret set) — don't block voting,
    // just skip the bot check rather than hard-failing every request.
    console.warn("TURNSTILE_SECRET_KEY not set — skipping bot verification");
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const ip = c.req.header("CF-Connecting-IP");
    if (ip) body.set("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json<{ success: boolean }>();
    return !!data.success;
  } catch {
    return false;
  }
}

// ── POST /api/coupons/:id/vote ────────────────────────────────────────────────
couponVotes.post("/:id/vote", async (c) => {
  const { id: couponId } = c.req.param();
  const db = c.env.DB;

  const voterId = c.req.header("X-Visitor-Id");
  if (!voterId) return c.json({ error: "Missing visitor id" }, 400);

  const body = await c.req.json().catch(() => ({}));
  const voteType = body.type;
  if (voteType !== "like" && voteType !== "dislike") {
    return c.json({ error: "type must be 'like' or 'dislike'." }, 400);
  }

  const verified = await verifyTurnstile(c, body.turnstileToken);
  if (!verified) return c.json({ error: "Bot verification failed. Please try again." }, 403);

  const coupon = await db.prepare("SELECT id, data FROM coupons WHERE id = ? LIMIT 1").bind(couponId).first<{ id: string; data: string }>();
  if (!coupon) return c.json({ error: "Coupon not found" }, 404);

  const existing = await db
    .prepare("SELECT vote_type FROM coupon_votes WHERE coupon_id = ? AND voter_id = ? LIMIT 1")
    .bind(couponId, voterId)
    .first<{ vote_type: string }>();

  const now = nowIso();
  let myVote: string | null = voteType;

  if (existing?.vote_type === voteType) {
    // Clicking the same vote again retracts it.
    await db
      .prepare("DELETE FROM coupon_votes WHERE coupon_id = ? AND voter_id = ?")
      .bind(couponId, voterId)
      .run();
    myVote = null;
  } else if (existing) {
    await db
      .prepare("UPDATE coupon_votes SET vote_type = ?, updated_at = ? WHERE coupon_id = ? AND voter_id = ?")
      .bind(voteType, now, couponId, voterId)
      .run();
  } else {
    await db
      .prepare(
        "INSERT INTO coupon_votes (id, coupon_id, voter_id, vote_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(newId(), couponId, voterId, voteType, now, now)
      .run();
  }

  const [real, base] = [await countRealVotes(db, couponId), baseCounts(coupon.data)];
  return c.json({ likes: real.likes + base.likes, dislikes: real.dislikes + base.dislikes, myVote });
});

// ── GET /api/coupons/:id/votes ────────────────────────────────────────────────
couponVotes.get("/:id/votes", async (c) => {
  const { id: couponId } = c.req.param();
  const db = c.env.DB;
  const voterId = c.req.header("X-Visitor-Id");

  const coupon = await db.prepare("SELECT data FROM coupons WHERE id = ? LIMIT 1").bind(couponId).first<{ data: string }>();
  const [real, base] = [await countRealVotes(db, couponId), baseCounts(coupon?.data)];

  let myVote: string | null = null;
  if (voterId) {
    const row = await db
      .prepare("SELECT vote_type FROM coupon_votes WHERE coupon_id = ? AND voter_id = ? LIMIT 1")
      .bind(couponId, voterId)
      .first<{ vote_type: string }>();
    myVote = row?.vote_type ?? null;
  }

  return c.json({ likes: real.likes + base.likes, dislikes: real.dislikes + base.dislikes, myVote });
});

// ── GET /api/coupon-votes-batch?ids=a,b,c ─────────────────────────────────────
couponVotesBatch.get("/", async (c) => {
  const ids = (c.req.query("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return c.json({ votes: {} });

  const db = c.env.DB;
  const voterId = c.req.header("X-Visitor-Id");
  const placeholders = ids.map(() => "?").join(", ");

  const [voteRowsRes, couponRowsRes] = await Promise.all([
    db
      .prepare(
        `SELECT coupon_id, vote_type, COUNT(*) as n FROM coupon_votes WHERE coupon_id IN (${placeholders}) GROUP BY coupon_id, vote_type`
      )
      .bind(...ids)
      .all<{ coupon_id: string; vote_type: string; n: number }>(),
    db.prepare(`SELECT id, data FROM coupons WHERE id IN (${placeholders})`).bind(...ids).all<{ id: string; data: string }>(),
  ]);

  const votes: Record<string, RawCounts & { myVote: string | null }> = {};
  for (const row of couponRowsRes.results) {
    const base = baseCounts(row.data);
    votes[row.id] = { likes: base.likes, dislikes: base.dislikes, myVote: null };
  }
  for (const id of ids) if (!votes[id]) votes[id] = { likes: 0, dislikes: 0, myVote: null };

  for (const row of voteRowsRes.results) {
    const entry = votes[row.coupon_id];
    if (!entry) continue;
    if (row.vote_type === "like") entry.likes += Number(row.n) || 0;
    else if (row.vote_type === "dislike") entry.dislikes += Number(row.n) || 0;
  }

  if (voterId) {
    const { results: myVotes } = await db
      .prepare(
        `SELECT coupon_id, vote_type FROM coupon_votes WHERE voter_id = ? AND coupon_id IN (${placeholders})`
      )
      .bind(voterId, ...ids)
      .all<{ coupon_id: string; vote_type: string }>();
    for (const row of myVotes) {
      if (votes[row.coupon_id]) votes[row.coupon_id].myVote = row.vote_type;
    }
  }

  return c.json({ votes });
});

export default couponVotes;
