-- ─────────────────────────────────────────────────────────────────────────────
-- Blog Categories — one-time migration
--
-- Creates the managed blog_categories table and seeds it with the distinct
-- category values already used by existing blog posts (read from the blogs
-- `data` JSON blob).  Safe to re-run: table creation is IF NOT EXISTS and the
-- seed uses INSERT OR IGNORE against the UNIQUE slug.
--
-- Apply:
--   wrangler d1 execute <db> --file=migrations/2026-07-05_blog_categories.sql --remote
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_categories (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Seed from existing blog posts' categories.
-- slug = lowercase, umlauts transliterated (ä→ae …), spaces → hyphens.
INSERT OR IGNORE INTO blog_categories (id, slug, name, created_at, data)
SELECT
  lower(hex(randomblob(16))) AS id,
  replace(replace(replace(replace(replace(lower(trim(cat)), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '-') AS slug,
  cat AS name,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS created_at,
  json_object(
    'name', cat,
    'slug', replace(replace(replace(replace(replace(lower(trim(cat)), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '-'),
    'createdAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ) AS data
FROM (
  SELECT DISTINCT json_extract(data, '$.category') AS cat
  FROM blogs
  WHERE json_extract(data, '$.category') IS NOT NULL
    AND trim(json_extract(data, '$.category')) != ''
);
