// Slug generation — output contains only lowercase ASCII letters, digits and "-".
// Accented letters (ë, é, ï, ö, …) are reduced to their base letter via NFD
// decomposition, which is what Dutch needs: "coördinatie" → "coordinatie". The
// German two-letter expansion (ö→oe) is deliberately not used here, as it mangles
// Dutch diaeresis vowels. Only letters NFD cannot decompose are mapped below.
// Must stay in sync with `slugify` in Frontend/src/lib/parseCsvClient.ts.

const CHAR_MAP: Record<string, string> = {
  ß: "ss", æ: "ae", ø: "oe", œ: "oe", đ: "d", ð: "d", þ: "th", ł: "l",
};

const MAX_SLUG_LENGTH = 120;

export function slugify(value: string): string {
  let s = String(value ?? "").toLowerCase();
  s = s.replace(/[ßæøœđðþł]/g, (ch) => CHAR_MAP[ch] ?? ch);
  // Decompose remaining accents (è → e + combining mark) and drop the marks.
  s = s.normalize("NFD").replace(/\p{M}/gu, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s.length > MAX_SLUG_LENGTH) {
    s = s.slice(0, MAX_SLUG_LENGTH).replace(/-+[^-]*$/, "");
  }
  return s;
}

// Return `base` if no other product uses it, otherwise `base-2`, `base-3`, …
// `excludeId` lets updates keep their own slug.
export async function ensureUniqueSlug(
  db: D1Database,
  base: string,
  excludeId?: string
): Promise<string> {
  if (!base) return "";
  const stmt = excludeId
    ? db.prepare("SELECT slug FROM products WHERE slug LIKE ? AND id != ?").bind(`${base}%`, excludeId)
    : db.prepare("SELECT slug FROM products WHERE slug LIKE ?").bind(`${base}%`);
  const { results } = await stmt.all<{ slug: string }>();
  const taken = new Set(results.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
