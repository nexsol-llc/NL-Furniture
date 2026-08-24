-- Links products to the furniture brand directory by id instead of by name.
--
-- Until now `products.brand_name` was the only connection to `furniture_brands`,
-- matched case-insensitively on every read. Renaming a brand silently detached
-- all of its products (the brand page went empty) because nothing updated the
-- string on the product rows.
--
-- `brand_id` becomes the relationship; `brand_name` stays on the row as a
-- denormalized display value so listings need no join, and as a fallback for
-- feed brands that were never added to the directory (those keep brand_id = '').
-- The backend keeps the two in sync: creating, renaming and merging a brand
-- rewrites the products that point at it.
--
-- Step 1 is not re-runnable (SQLite has no ADD COLUMN IF NOT EXISTS) — on a
-- second run it aborts with "duplicate column name: brand_id", which means the
-- migration already applied. Steps 2-3 are idempotent. Apply with:
--   wrangler d1 execute <db> --file=migrations/2026-08-25_add_product_brand_id.sql --remote

-- 1. The new link column. '' means "no directory brand" (free-text feed brand).
ALTER TABLE products ADD COLUMN brand_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- 2. Backfill from the existing names — the same case-insensitive match the
--    read paths used, done once here instead of on every request. Products
--    whose brand isn't in the directory keep brand_id = '' and their name.
UPDATE products
SET brand_id = COALESCE(
  (SELECT b.id FROM furniture_brands b WHERE b.title = products.brand_name COLLATE NOCASE LIMIT 1),
  ''
)
WHERE brand_name != '';

-- 3. Post-flight — how many products are linked vs. still free-text:
--   SELECT CASE WHEN brand_id = '' THEN 'unlinked' ELSE 'linked' END AS state,
--          COUNT(*) FROM products GROUP BY state;
