-- Retires the last special top-level category page — "Innen"/"Binnen"
-- Furniture, served at /binnen/[slug] — following the same removal already
-- done for the "Außen" Furniture page (2026-08-08_drop_indoor_outdoor_split.sql).
--
-- Removes:
--   * category_catalogs.data.showOnFurniture
--   * furniture_page_settings                (the whole Furniture page)
--
-- Run BEFORE deploying. The Furniture page and its SEO/FAQ content are
-- deleted for good — back the row up first if you may want it again:
--   SELECT data FROM furniture_page_settings WHERE id = 'singleton';

-- 1. Drop the retired field from every Category Catalog entry.
UPDATE category_catalogs
SET data = json_remove(data, '$.showOnFurniture')
WHERE json_extract(data, '$.showOnFurniture') IS NOT NULL;

-- 2. The Furniture page is gone.
DROP INDEX IF EXISTS idx_category_catalogs_furniture;
DROP TABLE IF EXISTS furniture_page_settings;
