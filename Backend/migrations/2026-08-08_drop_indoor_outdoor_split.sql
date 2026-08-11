-- Retires the indoor/outdoor split everywhere except the Indoor & Outdoor
-- Library (home_categories), which keeps its own `section` column and is
-- deliberately untouched by this migration.
--
-- Removes:
--   * category_catalogs.data.type            (Indoor/Outdoor catalog tabs)
--   * category_catalogs.data.showOnFurnitureAussen
--   * kategorie_page_settings categories[].type (Category Lists split)
--   * furniture_aussen_page_settings         (the whole Außen Furniture page)
--
-- Run AFTER 2026-08-08_drop_parent_category_type.sql and BEFORE deploying.
-- The Außen Furniture page and its SEO/FAQ content are deleted for good —
-- back the row up first if you may want it again:
--   SELECT data FROM furniture_aussen_page_settings WHERE id = 'singleton';

-- 1. Drop the retired fields from every Category Catalog entry.
UPDATE category_catalogs
SET data = json_remove(data, '$.type', '$.showOnFurnitureAussen')
WHERE json_extract(data, '$.type') IS NOT NULL
   OR json_extract(data, '$.showOnFurnitureAussen') IS NOT NULL;

-- 2. Drop `type` off each item in the Kategorie page's categories[] list.
--    json_remove can't reach into an array element by predicate, so rebuild the
--    array with json_group_array over json_each.
UPDATE kategorie_page_settings
SET data = json_set(
  data,
  '$.categories',
  (
    SELECT json_group_array(json_remove(je.value, '$.type'))
    FROM json_each(json_extract(kategorie_page_settings.data, '$.categories')) AS je
  )
)
WHERE id = 'singleton'
  AND json_type(json_extract(data, '$.categories')) = 'array'
  AND json_array_length(json_extract(data, '$.categories')) > 0;

-- 3. The Außen Furniture page is gone.
DROP INDEX IF EXISTS idx_category_catalogs_furniture_aussen;
DROP TABLE IF EXISTS furniture_aussen_page_settings;
