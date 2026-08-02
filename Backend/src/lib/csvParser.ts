// Zero-dependency CSV parser that works in Cloudflare Workers (no Node.js streams).

export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

// ── Category normalization (ported from the original upload-csv route) ──────

const CATEGORY_MAP: Record<string, string> = {
  tables: "Tables", table: "Tables",
  sofas: "Sofas", sofa: "Sofas",
  armchairs: "Sessel",
  chairs: "Chairs", chair: "Chairs",
  beds: "Beds", bed: "Beds",
  outdoor: "Outdoor Moebel",
  furniture: "Moebel",
  storage: "Storage",
  kitchen: "Kitchen",
  lighting: "Lighting",
  decoration: "Decoration",
  carpets: "Carpets",
  children: "Children",
};

const titleCase = (s: string) =>
  s.split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const normalize = (v: string) => v.toLowerCase().trim();

const normalizeCategoryLabel = (v: string) =>
  CATEGORY_MAP[normalize(v)] ?? titleCase(normalize(v));

export function buildCanonicalCategory(
  categoryNameValue: string | undefined,
  merchantCategoryValue: string | undefined
): string | null {
  const cn = (categoryNameValue ?? "").trim();
  if (cn) return normalizeCategoryLabel(cn);

  const parts = (merchantCategoryValue ?? "")
    .split(",")
    .map((p) => normalize(p))
    .filter(Boolean);

  if (!parts.length) return null;
  return parts.map(normalizeCategoryLabel).join(", ");
}

export function buildMerchantCategory(value: string | undefined): string | null {
  const parts = (value ?? "")
    .split(",")
    .map((p) => normalize(p))
    .filter(Boolean);

  if (!parts.length) return null;
  return parts.map(titleCase).join(", ");
}

export const str = (v: unknown): string | null => {
  if (v === undefined || v === null || v === "") return null;
  return String(v).trim() || null;
};

export const num = (v: unknown): number | null => {
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
};
