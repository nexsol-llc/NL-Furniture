-- Adds the URL slug column to products (auto-generated from product_name by
-- the API when not supplied). Backfill existing rows afterwards by calling
-- POST /api/products/backfill-slugs (repeat until it reports remaining = 0).
--
-- Apply: wrangler d1 execute <db> --file=migrations/add_product_slug.sql --remote

ALTER TABLE products ADD COLUMN slug TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
