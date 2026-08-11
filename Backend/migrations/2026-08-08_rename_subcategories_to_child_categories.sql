-- Renames the stored JSON key `subcategories` -> `childCategories` on every
-- Category Catalog entry. The nested objects are untouched — only the key
-- holding the array changes.
--
-- This is a BREAKING contract change: /api/category-catalog now reads and
-- writes `childCategories`. Backend and Frontend must deploy together, and
-- this migration must run in the same window — an old Frontend against the
-- migrated data (or a new Frontend against un-migrated data) shows every
-- category as having no child categories.
--
-- Run order for this batch of work:
--   1. 2026-08-08_drop_parent_category_type.sql
--   2. 2026-08-08_drop_indoor_outdoor_split.sql
--   3. this file
--
-- Pre-flight — how many rows will change:
--   SELECT COUNT(*) FROM category_catalogs
--   WHERE json_extract(data, '$.subcategories') IS NOT NULL;

-- json() re-parses the extracted array so it is stored as JSON, not as a
-- quoted string (json_extract on an array yields its text representation).
UPDATE category_catalogs
SET data = json_remove(
             json_set(data, '$.childCategories', json(json_extract(data, '$.subcategories'))),
             '$.subcategories'
           )
WHERE json_extract(data, '$.subcategories') IS NOT NULL;

-- Verify: both counts should be 0 afterwards.
--   SELECT COUNT(*) FROM category_catalogs WHERE json_extract(data,'$.subcategories') IS NOT NULL;
--   SELECT COUNT(*) FROM category_catalogs
--     WHERE json_extract(data,'$.childCategories') IS NOT NULL
--       AND json_type(json_extract(data,'$.childCategories')) != 'array';
