-- Adds the Coupon Home tables that drive the (now fully admin-managed) /coupons
-- landing page. Safe to run repeatedly (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS coupon_home_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_home_products (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coupon_home_products_section ON coupon_home_products(section);
