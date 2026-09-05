-- Cloudflare D1 schema for nl-furniture-api
-- Run: wrangler d1 execute nl-furniture-db --file=schema.sql [--remote]

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT NOT NULL PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  liked_products TEXT NOT NULL DEFAULT '[]',
  reset_token TEXT,
  reset_token_expiry TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ── Admin users (staff: super_admin / admin / editor) ────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'editor',
  permissions TEXT NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ── Products (large — CSV-imported) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id TEXT NOT NULL PRIMARY KEY,
  aw_product_id INTEGER,
  product_name TEXT NOT NULL DEFAULT '',
  aw_deep_link TEXT NOT NULL DEFAULT '',
  merchant_deep_link TEXT NOT NULL DEFAULT '',
  merchant_product_id TEXT NOT NULL DEFAULT '',
  merchant_image_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  merchant_category TEXT NOT NULL DEFAULT '',
  search_price REAL NOT NULL DEFAULT 0,
  discount_price REAL NOT NULL DEFAULT 0,
  merchant_name TEXT NOT NULL DEFAULT '',
  merchant_id INTEGER,
  category_name TEXT NOT NULL DEFAULT '',
  aw_image_url TEXT NOT NULL DEFAULT '',
  display_price TEXT NOT NULL DEFAULT '',
  data_feed_id INTEGER,
  brand_name TEXT NOT NULL DEFAULT '',
  brand_id TEXT NOT NULL DEFAULT '',
  colour TEXT NOT NULL DEFAULT '',
  product_short_description TEXT NOT NULL DEFAULT '',
  aw_thumb_url TEXT NOT NULL DEFAULT '',
  delivery_cost TEXT NOT NULL DEFAULT '',
  alternate_image TEXT NOT NULL DEFAULT '',
  alternate_image_two TEXT NOT NULL DEFAULT '',
  alternate_image_three TEXT NOT NULL DEFAULT '',
  alternate_image_four TEXT NOT NULL DEFAULT '',
  is_sponsored INTEGER NOT NULL DEFAULT 0,
  slug TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_aw_product_id ON products(aw_product_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products(brand_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_name ON products(category_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_merchant_category ON products(merchant_category COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_search_price ON products(search_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- ── Brands ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name COLLATE NOCASE);
-- Speeds up the paginated featured-stores endpoint.
CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(json_extract(data, '$.featured'));

-- ── Coupons ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT NOT NULL PRIMARY KEY,
  code TEXT,
  brand_slug TEXT NOT NULL DEFAULT '',
  is_expired INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 999,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_slug ON coupons(brand_slug);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at);
-- Speeds up the paginated featured-coupons endpoint.
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON coupons(json_extract(data, '$.featured'));

-- ── Coupon Special Offers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_special_offers (
  id TEXT NOT NULL PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 999,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

-- ── Heroes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heroes (
  id TEXT NOT NULL PRIMARY KEY,
  slot INTEGER NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_heroes_slot ON heroes(slot);

-- ── Site settings (singleton — theme color, global options) ─────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Media library (index of R2 objects) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id TEXT NOT NULL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);

-- ── Sponsors ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

-- ── Offers ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offers_section ON offers(section);

-- ── Category Catalogs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_catalogs (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_catalogs_slug ON category_catalogs(slug);
-- Speeds up "categories in this parent" lookups (data.parentCategoryId).
CREATE INDEX IF NOT EXISTS idx_category_catalogs_parent_id ON category_catalogs(json_extract(data, '$.parentCategoryId'));

-- ── Parent Categories (group Category Catalog entries; a category can only
--    belong to a single parent — enforced by category_catalogs.data.parentCategoryId
--    being a single field rather than a membership list) ──────────────────────
CREATE TABLE IF NOT EXISTS parent_categories (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
-- Parent categories are a single flat list — no indoor/outdoor type — so a
-- slug is globally unique again. Replaces the old (slug, type) unique index.
DROP INDEX IF EXISTS idx_parent_categories_slug_type;
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_categories_slug ON parent_categories(slug);
CREATE INDEX IF NOT EXISTS idx_parent_categories_sort_order ON parent_categories(sort_order);

-- ── Categories (for sponsored product lookups) ───────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ── Sponsoreds (category → product associations) ─────────────────────────────
CREATE TABLE IF NOT EXISTS sponsoreds (
  id TEXT NOT NULL PRIMARY KEY,
  category_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sponsoreds_category_id ON sponsoreds(category_id);

-- ── Gadgets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gadgets (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

-- ── Blogs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id TEXT NOT NULL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- ── Blog Categories (managed catalog for the blog category dropdown) ──────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- ── Furniture Brands ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS furniture_brands (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_furniture_brands_slug ON furniture_brands(slug);

-- ── Influencer Brands ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencer_brands (
  id TEXT NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_brands_username ON influencer_brands(username);

-- ── Influencer Looks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencer_looks (
  id TEXT NOT NULL PRIMARY KEY,
  look_id TEXT NOT NULL,
  username TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_looks_look_id ON influencer_looks(look_id);
CREATE INDEX IF NOT EXISTS idx_influencer_looks_username ON influencer_looks(username);

-- ── Newsletters ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletters_email ON newsletters(email);

-- ── Cookie Consent Settings (singleton) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consents (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Cookie Consent Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id TEXT NOT NULL PRIMARY KEY,
  choice TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_choice ON cookie_consent_logs(choice);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_created_at ON cookie_consent_logs(created_at);

-- ── Activity Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ── CSV Upload Logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS csv_upload_logs (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

-- ── Section Settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS section_settings (
  id TEXT NOT NULL PRIMARY KEY,
  section_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_section_settings_section_id ON section_settings(section_id);

-- ── Page SEO Settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_seo_settings (
  id TEXT NOT NULL PRIMARY KEY,
  page_key TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_seo_settings_page_key ON page_seo_settings(page_key);

-- ── Kategorie Page Settings (singleton) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS kategorie_page_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Influencer Page Settings (singleton) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencer_page_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── System Settings (singleton) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Top Angebote Settings (singleton) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS top_angebote_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Top Angebote Products ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS top_angebote_products (
  id TEXT NOT NULL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_top_angebote_products_category ON top_angebote_products(category);

-- ── Coupon Home Settings (singleton) ─────────────────────────────────────────
-- Drives the /coupons landing page: banner slides, slider-group metadata,
-- curated best-coupon cards / cashback stores, long content, FAQs and SEO.
CREATE TABLE IF NOT EXISTS coupon_home_settings (
  id TEXT NOT NULL PRIMARY KEY,
  data TEXT NOT NULL
);

-- ── Coupon Home Products ─────────────────────────────────────────────────────
-- `section` = a slider group key (dynamic "Top Angebote" carousels) or 'deals'
-- (the "Möbel Mega Angebote" grid).
CREATE TABLE IF NOT EXISTS coupon_home_products (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coupon_home_products_section ON coupon_home_products(section);

-- ── Home Products ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_products (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_home_products_section ON home_products(section);

-- ── Home Categories ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_categories (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_home_categories_section ON home_categories(section);

-- ── Home Influencers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_influencers (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

-- ── Coupon Brand Products (per-brand product showcase, same shape as
--    top_angebote_products but keyed by brand_slug instead of free-text category) ──
CREATE TABLE IF NOT EXISTS coupon_brand_products (
  id TEXT NOT NULL PRIMARY KEY,
  brand_slug TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coupon_brand_products_brand_slug ON coupon_brand_products(brand_slug);

-- ── Authors (reusable author profiles — name/avatar/role/socials — selected
--    by coupon stores etc.; each store only adds its own bio via authorBox.bio) ──
CREATE TABLE IF NOT EXISTS authors (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name COLLATE NOCASE);

-- ── Coupon Votes (one active vote per coupon+visitor; anonymous, no login
--    required — "visitor" is a random ID the frontend keeps in localStorage,
--    and each vote is verified as human via Cloudflare Turnstile) ────────────
CREATE TABLE IF NOT EXISTS coupon_votes (
  id TEXT NOT NULL PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote_type TEXT NOT NULL, -- 'like' | 'dislike'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_votes_coupon_voter ON coupon_votes(coupon_id, voter_id);
CREATE INDEX IF NOT EXISTS idx_coupon_votes_coupon_id ON coupon_votes(coupon_id);
