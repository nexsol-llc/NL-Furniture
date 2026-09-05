-- Adds a sale/discount price alongside the existing regular price.
--
-- The product CSV format changed: it no longer carries a feed product id
-- (products get their own generated id, and re-imports are matched by the
-- product's deep link instead — see the products.bulk route) and it now ships
-- a separate "Product Discount Price" column next to "Product Price". This
-- column stores that discount price; 0 means "no discount, show the regular
-- price only", matching how search_price already treats 0 as "unset".
--
-- Not re-runnable (SQLite has no ADD COLUMN IF NOT EXISTS) — a second run
-- aborts with "duplicate column name: discount_price", meaning it already
-- applied. Apply with:
--   wrangler d1 execute <db> --file=migrations/2026-09-06_add_product_discount_price.sql --remote

ALTER TABLE products ADD COLUMN discount_price REAL NOT NULL DEFAULT 0;
