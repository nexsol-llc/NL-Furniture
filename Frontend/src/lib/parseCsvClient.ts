// Browser CSV parser — handles quoted fields (commas, embedded newlines, "" escapes).
// Returns an array of row objects keyed by the header row.
export function parseCsvText(text: string): Record<string, string>[] {
  // Strip a UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* handled by the following \n */ }
      else field += ch;
    }
  }
  // Flush any trailing field/row (file without a final newline).
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const src = rows[r];
    // Skip fully-empty trailing lines.
    if (src.length === 1 && src[0].trim() === "") continue;
    const rec: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) rec[headers[c]] = (src[c] ?? "").trim();
    out.push(rec);
  }
  return out;
}

export type FeedProduct = {
  aw_product_id: string;
  product_name: string;
  brand_name: string;
  category_name: string;
  merchant_category: string; // childCategory
  merchant_name: string;
  search_price: string;
  display_price: string;
  aw_deep_link: string;
  merchant_deep_link: string;
  merchant_image_url: string;
  aw_image_url: string;
  aw_thumb_url: string;
  description: string;
  product_short_description: string;
  colour: string;
  delivery_cost: string;
  merchant_product_id: string;
  merchant_id: string;
  data_feed_id: string;
  slug: string;
};

// Map one AWIN feed row to a product object matching the backend columns.
// aw_product_id is optional — not every merchant feed provides one, and the
// backend's unique index only dedupes non-empty values (SQLite treats every
// NULL as distinct), so rows without it just import as separate products.
export function rowToFeedProduct(row: Record<string, string>): FeedProduct | null {
  const product_name = (row.product_name || "").trim();
  if (!product_name) return null;
  const aw_product_id = (row.aw_product_id || "").trim();
  // Prefer the more specific merchant childCategory when available.
  const childCategory =
    row.merchant_product_second_category?.trim() ||
    row.merchant_category?.trim() ||
    "";
  return {
    aw_product_id,
    product_name,
    brand_name: row.brand_name || "",
    category_name: row.category_name || row.merchant_category || "",
    merchant_category: childCategory,
    merchant_name: row.merchant_name || "",
    search_price: row.search_price || row.store_price || "",
    display_price: row.display_price || "",
    aw_deep_link: row.aw_deep_link || "",
    merchant_deep_link: row.merchant_deep_link || "",
    merchant_image_url: row.merchant_image_url || "",
    aw_image_url: row.aw_image_url || "",
    aw_thumb_url: row.aw_thumb_url || "",
    description: row.description || "",
    product_short_description: row.product_short_description || "",
    colour: row.colour || "",
    delivery_cost: row.delivery_cost || "",
    merchant_product_id: row.merchant_product_id || "",
    merchant_id: row.merchant_id || "",
    data_feed_id: row.data_feed_id || "",
    // Optional CSV column; the backend auto-generates from product_name when empty.
    slug: row.slug || "",
  };
}

// Slug generation — lowercase ASCII letters, digits and "-" only. Accented
// letters (ë, é, ï, ö, …) are reduced to their base letter, which is what Dutch
// needs: "coördinatie" → "coordinatie". The German two-letter expansion (ö→oe)
// is deliberately not used. Must stay in sync with Backend/src/lib/slug.ts.
const SLUG_CHAR_MAP: Record<string, string> = {
  ß: "ss", æ: "ae", ø: "oe", œ: "oe", đ: "d", ð: "d", þ: "th", ł: "l",
};

export function slugify(value: string): string {
  let s = (value || "").toLowerCase();
  s = s.replace(/[ßæøœđðþł]/g, (ch) => SLUG_CHAR_MAP[ch] ?? ch);
  // Decompose remaining accents (è → e + combining mark) and drop the marks.
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s.length > 120) s = s.slice(0, 120).replace(/-+[^-]*$/, "");
  return s;
}
