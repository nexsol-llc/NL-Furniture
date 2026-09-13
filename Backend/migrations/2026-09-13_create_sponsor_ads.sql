-- Sponsor ads: admin-uploaded creatives (an image plus a click-through link)
-- booked into fixed home-page placements, managed under Admin → Sponsor Ads.
--
--   placement  'hero_below' — many, shown under the hero in `position` order
--              'sidebar_1' / 'sidebar_2' — one each, in the right rail
--   data       { image, link, title, createdAt, updatedAt }
--
-- Separate from the older `sponsors` pool, which has no notion of placement.
-- Re-runnable. Apply with:
--   wrangler d1 execute <db> --file=migrations/2026-09-13_create_sponsor_ads.sql --remote

CREATE TABLE IF NOT EXISTS sponsor_ads (
  id TEXT NOT NULL PRIMARY KEY,
  placement TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sponsor_ads_placement ON sponsor_ads(placement, position);
