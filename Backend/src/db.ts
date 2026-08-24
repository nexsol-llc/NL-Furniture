// D1 helper utilities — replaces MongoDB client

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ── Generic "data-blob" rows ─────────────────────────────────────────────────
// Most tables store full document JSON in a `data TEXT` column plus a few
// indexed columns for WHERE / ORDER BY.  These helpers convert D1 rows to the
// MongoDB-compatible shape (with _id instead of id) that the routes return.

export type D1Row = { id: string; data: string };

export function fromRow<T = Record<string, any>>(
  row: D1Row | null
): (T & { _id: string }) | null {
  if (!row) return null;
  return { _id: row.id, ...JSON.parse(row.data) } as T & { _id: string };
}

export function fromRows<T = Record<string, any>>(
  rows: D1Row[]
): (T & { _id: string })[] {
  return rows.map((r) => fromRow<T>(r)!);
}

// ── Users (individual columns — needed for indexed queries) ──────────────────
export type UserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url: string;
  password_hash: string | null;
  liked_products: string;
  reset_token: string | null;
  reset_token_expiry: string | null;
  created_at: string;
  updated_at: string;
};

export function userFromRow(row: UserRow | null): Record<string, any> | null {
  if (!row) return null;
  return {
    _id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    passwordHash: row.password_hash ?? undefined,
    likedProducts: safeJsonParse(row.liked_products, []),
    resetToken: row.reset_token ?? undefined,
    resetTokenExpiry: row.reset_token_expiry ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Products (individual columns — needed for LIKE / range / ORDER BY) ───────
export type ProductRow = {
  id: string;
  aw_product_id: number | null;
  product_name: string;
  aw_deep_link: string;
  merchant_deep_link: string;
  merchant_product_id: string;
  merchant_image_url: string;
  description: string;
  merchant_category: string;
  search_price: number;
  merchant_name: string;
  merchant_id: number | null;
  category_name: string;
  aw_image_url: string;
  display_price: string;
  data_feed_id: number | null;
  brand_name: string;
  /** furniture_brands.id, or '' for a feed brand that isn't in the directory. */
  brand_id: string;
  colour: string;
  product_short_description: string;
  aw_thumb_url: string;
  delivery_cost: string;
  alternate_image: string;
  alternate_image_two: string;
  alternate_image_three: string;
  alternate_image_four: string;
  is_sponsored: number;
  slug: string;
  created_at: string;
  updated_at: string;
};

export function productFromRow(
  row: ProductRow | null
): Record<string, any> | null {
  if (!row) return null;
  const { id, is_sponsored, created_at, updated_at, ...rest } = row;
  return {
    _id: id,
    ...rest,
    is_sponsored: is_sponsored === 1,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

export function productsFromRows(rows: ProductRow[]): Record<string, any>[] {
  return rows.map((r) => productFromRow(r)!);
}

// ── Admin users (individual columns) ─────────────────────────────────────────
export type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  permissions: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function adminUserFromRow(row: AdminUserRow | null): Record<string, any> | null {
  if (!row) return null;
  return {
    _id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    permissions: safeJsonParse(row.permissions, {}),
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Utility ──────────────────────────────────────────────────────────────────
export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}
