// Resolving a product's brand to the furniture brand directory.
//
// `products.brand_id` is the real link; `products.brand_name` rides along as a
// denormalized display value so listing queries never need a join, and so feed
// brands that were never added to the directory still render (brand_id = '').
//
// The directory is small (tens of rows), so every write path loads it once per
// request and matches in JS instead of issuing a lookup per product — that keeps
// a 300-row CSV chunk at one extra query rather than 300.

export type BrandIndex = {
  /** Lowercased brand title → its row. Duplicate titles: lowest sort_order wins. */
  byName: Map<string, { id: string; title: string }>;
  /** Brand id → its row. */
  byId: Map<string, { id: string; title: string }>;
};

export async function loadBrandIndex(db: D1Database): Promise<BrandIndex> {
  const { results } = await db
    .prepare("SELECT id, title FROM furniture_brands ORDER BY sort_order ASC, title ASC")
    .all<{ id: string; title: string }>();

  const byName = new Map<string, { id: string; title: string }>();
  const byId = new Map<string, { id: string; title: string }>();
  for (const row of results) {
    const entry = { id: row.id, title: row.title };
    byId.set(row.id, entry);
    // Titles aren't unique (only slugs are) — first one wins, matching the
    // "ORDER BY sort_order" the admin sees.
    const key = row.title.trim().toLowerCase();
    if (key && !byName.has(key)) byName.set(key, entry);
  }
  return { byName, byId };
}

/**
 * Settle a product's brand columns.
 *
 * An explicit, existing `brand_id` wins and dictates the name, so a rename can
 * never be undone by a stale name in the request body. Otherwise the name is
 * looked up in the directory; an unknown name is kept as free text with no id.
 */
export function resolveBrand(
  index: BrandIndex,
  brandId: string,
  brandName: string
): { brand_id: string; brand_name: string } {
  const byId = brandId ? index.byId.get(brandId) : undefined;
  if (byId) return { brand_id: byId.id, brand_name: byId.title };

  const name = (brandName ?? "").trim();
  if (!name) return { brand_id: "", brand_name: "" };

  const byName = index.byName.get(name.toLowerCase());
  return byName
    ? { brand_id: byName.id, brand_name: byName.title }
    : { brand_id: "", brand_name: name };
}
