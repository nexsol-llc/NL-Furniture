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

// Case-insensitive header lookup — tolerates a hand-edited CSV whose header
// casing drifts a little ("brand name" / "Brand Name" / "BRAND NAME").
function col(row: Record<string, string>, name: string): string {
  if (row[name] !== undefined) return (row[name] || "").trim();
  const lower = name.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return (row[key] || "").trim();
  }
  return "";
}

// Read a price out of whatever convention the feed uses: "89.99", "89,99",
// "1.299,00", "1,299.00", "€ 89,99", "89,99 EUR". Returns 0 when the cell holds
// no usable number, which the import dialog reports as "no price".
// Must stay in sync with toPrice() in Backend/src/routes/products.ts — that is
// the one that decides what actually gets stored.
export function parsePrice(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  let s = String(value ?? "").replace(/[^\d.,]/g, "");
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = s.length - lastComma - 1;
    s = decimals >= 1 && decimals <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot > -1) {
    const decimals = s.length - lastDot - 1;
    if (!(decimals >= 1 && decimals <= 2)) s = s.replace(/\./g, "");
    else s = s.slice(0, lastDot).replace(/\./g, "") + "." + s.slice(lastDot + 1);
  }

  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type FeedProduct = {
  product_name: string;
  brand_name: string;
  // Only used to seed a brand the import creates — not stored on the product.
  brand_website: string;
  brand_logo: string;
  merchant_name: string;
  // Category tiers, already resolved through the fallback below. Any of them
  // can end up empty when the CSV gives no category at all.
  parent_category: string;
  category_name: string; // "sub category" tier
  merchant_category: string; // "child category" tier
  search_price: string;
  discount_price: string;
  description: string;
  merchant_deep_link: string;
  merchant_image_url: string;
};

// Map one CSV row (see the "Website Link, Brand Name, Merchant Name, Brand Logo Url,
// Product Name, Product Description, Product Image Url, Product Price,
// Product Discount Price, Product Deep Link, Parent Category, Sub Category,
// Child Category" format) to a product object matching the backend columns.
//
// Category fallback: every tier is optional, and each empty one borrows the
// nearest name the row does carry. Sub Category falls back to Child Category,
// then to Parent Category; Parent Category falls back to the Sub Category that
// fallback produced. So a row with only Child Category resolves all three tiers
// to that name, a row with only Parent Category fills Parent + Sub and leaves
// Child empty, and a row with no category at all imports uncategorized.
// Product Name is the only column a row is actually dropped for.
export function rowToFeedProduct(row: Record<string, string>): FeedProduct | null {
  const product_name = col(row, "Product Name");
  if (!product_name) return null;

  const rawChild = col(row, "Child Category");
  const rawSub = col(row, "Sub Category");
  const rawParent = col(row, "Parent Category");

  const resolvedSub = rawSub || rawChild || rawParent;
  const resolvedParent = rawParent || resolvedSub;

  return {
    product_name,
    brand_name: col(row, "Brand Name"),
    brand_website: col(row, "Website Link"),
    brand_logo: col(row, "Brand Logo Url"),
    merchant_name: col(row, "Merchant Name"),
    parent_category: resolvedParent,
    category_name: resolvedSub,
    merchant_category: rawChild,
    search_price: col(row, "Product Price"),
    discount_price: col(row, "Product Discount Price"),
    description: col(row, "Product Description"),
    merchant_deep_link: col(row, "Product Deep Link"),
    merchant_image_url: col(row, "Product Image Url"),
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
