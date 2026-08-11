-- Retires the indoor/outdoor `type` and the `showOnFurniture` flag from
-- parent_categories. Parent categories become one flat list, used only for
-- grouping Category Catalog entries on /categorie, the home page and
-- /kortingscodes — they no longer appear on the Innen/Außen Furniture pages.
--
-- Run BEFORE deploying, and check for slug collisions first (see below): the
-- old unique index was (slug, type), so "wohnzimmer" could legitimately exist
-- once as indoor and once as outdoor. Making slug unique again forces a rename.
--
-- Pre-flight — lists any slug that exists more than once:
--   SELECT slug, COUNT(*) c FROM parent_categories GROUP BY slug HAVING c > 1;

-- 1. Drop the retired fields from the JSON blob.
UPDATE parent_categories
SET data = json_remove(data, '$.type', '$.showOnFurniture')
WHERE json_extract(data, '$.type') IS NOT NULL
   OR json_extract(data, '$.showOnFurniture') IS NOT NULL;

-- 2. Release the (slug, type) index before slugs are deduplicated.
DROP INDEX IF EXISTS idx_parent_categories_slug_type;

-- 3. Deduplicate slugs. The oldest row of each group keeps the bare slug;
--    later ones get a -2, -3, … suffix. Rename these in the admin panel
--    afterwards — the suffixed slugs are live URLs.
UPDATE parent_categories
SET slug = ranked.new_slug,
    data = json_set(parent_categories.data, '$.slug', ranked.new_slug)
FROM (
  SELECT
    id,
    slug || '-' || CAST(ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS TEXT) AS new_slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM parent_categories
) AS ranked
WHERE parent_categories.id = ranked.id
  AND ranked.rn > 1;

-- 4. Restore the plain unique-slug index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_categories_slug ON parent_categories(slug);
