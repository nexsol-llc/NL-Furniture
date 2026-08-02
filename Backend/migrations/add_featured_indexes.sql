-- Adds expression indexes on the `featured` flag (stored in the JSON `data`
-- blob) so the paginated /api/brands/featured and /api/coupons/featured
-- endpoints stay fast as the number of featured items grows.
--
-- Apply with:
--   wrangler d1 execute <db> --file=migrations/add_featured_indexes.sql --remote

CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(json_extract(data, '$.featured'));
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON coupons(json_extract(data, '$.featured'));
CREATE INDEX IF NOT EXISTS idx_category_catalogs_featured ON category_catalogs(json_extract(data, '$.featured'));
