// Category catalog is fully API-driven (see Backend `/api/category-catalog`).
// This module now only holds the shared types + small fetch helpers used by the
// public category pages. No category/childCategory data is hardcoded here anymore.

export type CategoryFAQ = {
  question: string;
  answer: string;
};

export type ChildCategoryDef = {
  slug: string;
  name: string;
  // Images come from the media library (imageUrl); iconName is an optional
  // Lucide icon name stored alongside for admin display.
  imageUrl?: string;
  iconName?: string;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  faqs?: CategoryFAQ[];
  searchTerms?: string[];
  // Display position among its siblings, ascending (unset counts as 0).
  // See `sortChildCategories` — the one place that order is applied.
  sortOrder?: number;
};

export type CategoryDef = {
  slug: string;
  aliases?: string[];
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  image?: string;
  logo?: string;
  priceUnder?: number;
  featured?: boolean;
  // Parent category this entry is grouped under (see /api/parent-categories) —
  // a category belongs to at most one parent at a time.
  parentCategoryId?: string;
  faqs?: CategoryFAQ[];
  childCategories?: ChildCategoryDef[];
};

// One flat list — parent categories have no indoor/outdoor type and no tie to
// the Furniture pages. They only group Category Catalog entries on /categorie,
// the home page and /kortingscodes. Their public page is the flat root URL
// `/<parentSlug>`, resolved by `app/[parentslug]/page.tsx`.
export type ParentCategoryDef = {
  _id: string;
  slug: string;
  name: string;
  image?: string;
  featured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  faqs?: CategoryFAQ[];
};

// Order a category's childCategories for display: `sortOrder` ascending, with
// the stored array order as the tiebreaker (sort is stable), so catalogs that
// never set one keep looking exactly as they were entered.
export const sortChildCategories = <T extends { sortOrder?: number }>(
  childCategories: T[]
): T[] =>
  [...childCategories].sort(
    (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
  );

const COMBINING_MARKS = /[̀-ͯ]/g;

export const normalizeSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Humanized fallback title from a slug (used before the DB config loads).
export const humanizeSlug = (slug: string): string =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Base URL for API calls. On the client we use a relative path (proxied by
// next.config rewrites, avoiding CORS); on the server we need the absolute
// backend URL from NEXT_PUBLIC_API_URL.
const apiBase = (): string =>
  typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL ?? "" : "";

// Fetch a single category catalog entry by slug or alias. Returns null when the
// category isn't configured. Safe to call on both server and client.
export async function fetchCatalogEntry(
  slug: string
): Promise<CategoryDef | null> {
  try {
    const res = await fetch(
      `${apiBase()}/api/category-catalog/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && data.category) return data.category as CategoryDef;
    return null;
  } catch {
    return null;
  }
}

// Fetch the full list of configured category catalogs (bare array).
export async function fetchCatalogList(): Promise<CategoryDef[]> {
  try {
    const res = await fetch(`${apiBase()}/api/category-catalog`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as CategoryDef[]) : [];
  } catch {
    return [];
  }
}

// Resolve a single parent category by slug. Parent categories have no
// by-slug endpoint, so this filters the full list. Safe on server and client.
export async function fetchParentCategory(
  slug: string
): Promise<ParentCategoryDef | null> {
  const target = slug.toLowerCase();
  const parents = await fetchParentCategories();
  return parents.find((p) => p.slug.toLowerCase() === target) ?? null;
}

// Fetch the full list of parent categories (bare array).
export async function fetchParentCategories(): Promise<ParentCategoryDef[]> {
  try {
    const res = await fetch(`${apiBase()}/api/parent-categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as ParentCategoryDef[]) : [];
  } catch {
    return [];
  }
}

// Resolve a childCategory match across a list of categories (used to redirect a
// bare `/<childslug>` URL to its parent category page).
export function findChildCategoryMatch(
  categories: CategoryDef[],
  searchSlug: string
): { categorySlug: string; childSlug: string } | null {
  const target = searchSlug.toLowerCase();
  const targetSpaced = target.replace(/-/g, " ");
  for (const cat of categories) {
    if (!cat.childCategories) continue;
    const sub = cat.childCategories.find(
      (s) =>
        s.slug === target ||
        s.name?.toLowerCase() === targetSpaced ||
        (Array.isArray(s.searchTerms) &&
          s.searchTerms.some(
            (term) => term.toLowerCase().replace(/[\s-]+/g, "-") === target
          ))
    );
    if (sub) return { categorySlug: cat.slug, childSlug: sub.slug };
  }
  return null;
}

// ── Public URL shape ─────────────────────────────────────────────────────────
// Category pages are nested under the Parent Category they are assigned to:
//   /<parentSlug>                              parent group page
//   /<parentSlug>/<categorySlug>               category listing
//   /<parentSlug>/<categorySlug>/<childSlug>   child category listing
// A category with no `parentCategoryId` therefore has NO public URL and its
// pages 404 until an admin assigns it a parent. Build links with the helpers
// below rather than by hand — they are the single definition of that shape.

export const categoryHref = (parentSlug: string, categorySlug: string): string =>
  `/${encodeURIComponent(parentSlug)}/${encodeURIComponent(categorySlug)}`;

export const childCategoryHref = (
  parentSlug: string,
  categorySlug: string,
  childSlug: string
): string =>
  `/${encodeURIComponent(parentSlug)}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(childSlug)}`;

export type CategoryLocation = {
  parent: ParentCategoryDef;
  category: CategoryDef;
};

// Resolve a category slug (or alias) to its full location in the hierarchy.
// Returns null when the slug matches no category, or when the category it
// matches has no parent assigned — both cases are 404s.
export function locateCategoryIn(
  parents: ParentCategoryDef[],
  categories: CategoryDef[],
  categorySlug: string
): CategoryLocation | null {
  const target = categorySlug.toLowerCase();
  const category = categories.find(
    (c) =>
      c.slug.toLowerCase() === target ||
      (c.aliases ?? []).some((a) => a.toLowerCase() === target)
  );
  if (!category?.parentCategoryId) return null;

  const parent = parents.find((p) => p._id === category.parentCategoryId);
  return parent ? { parent, category } : null;
}

// Fetching variant of `locateCategoryIn`, for callers that don't already hold
// the two lists.
export async function locateCategory(
  categorySlug: string
): Promise<CategoryLocation | null> {
  const [parents, categories] = await Promise.all([
    fetchParentCategories(),
    fetchCatalogList(),
  ]);
  return locateCategoryIn(parents, categories, categorySlug);
}
