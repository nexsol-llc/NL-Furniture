// Category catalog is fully API-driven (see Backend `/api/category-catalog`).
// This module now only holds the shared types + small fetch helpers used by the
// public category pages. No category/subcategory data is hardcoded here anymore.

export type CategoryFAQ = {
  question: string;
  answer: string;
};

export type SubcategoryDef = {
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
  // Indoor/Outdoor — decides which type of Parent Category this can be assigned to.
  type?: "indoor" | "outdoor";
  // Parent category this entry is grouped under (see /api/parent-categories) —
  // a category belongs to at most one parent at a time.
  parentCategoryId?: string;
  // Whether this category's products should appear on the special Innen/Außen Furniture pages.
  showOnFurniture?: boolean;
  showOnFurnitureAussen?: boolean;
  faqs?: CategoryFAQ[];
  subcategories?: SubcategoryDef[];
};

export type ParentCategoryDef = {
  _id: string;
  slug: string;
  name: string;
  type?: "indoor" | "outdoor";
  image?: string;
  featured?: boolean;
  // Whether this parent category shows up in the Innen/Außen Furniture pages'
  // parent filter row. Missing (older rows) is treated as visible.
  showOnFurniture?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  faqs?: CategoryFAQ[];
};

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

export type FurniturePageSettings = {
  slug: string;
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  longContent: string;
  faqs: CategoryFAQ[];
  // Tile image for the "Möbel" card prepended to the home page's Parent
  // Category grid — set the same way as a Parent Category's image.
  image?: string;
};

async function fetchFurnitureSettingsFrom(endpoint: string): Promise<FurniturePageSettings | null> {
  try {
    const res = await fetch(`${apiBase()}/api/${endpoint}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success && data.settings ? data.settings : null;
  } catch {
    return null;
  }
}

// Fetch the Innen Furniture page's settings (slug, SEO, long content, FAQs).
export function fetchFurniturePageSettings(): Promise<FurniturePageSettings | null> {
  return fetchFurnitureSettingsFrom("furniture-page-settings");
}

// Fetch the Außen Furniture page's settings.
export function fetchFurnitureAussenPageSettings(): Promise<FurniturePageSettings | null> {
  return fetchFurnitureSettingsFrom("furniture-aussen-page-settings");
}

// Resolve a subcategory match across a list of categories (used to redirect a
// bare `/categorie/<subslug>` URL to its parent category page).
export function findSubcategoryMatch(
  categories: CategoryDef[],
  searchSlug: string
): { categorySlug: string; subSlug: string } | null {
  const target = searchSlug.toLowerCase();
  const targetSpaced = target.replace(/-/g, " ");
  for (const cat of categories) {
    if (!cat.subcategories) continue;
    const sub = cat.subcategories.find(
      (s) =>
        s.slug === target ||
        s.name?.toLowerCase() === targetSpaced ||
        (Array.isArray(s.searchTerms) &&
          s.searchTerms.some(
            (term) => term.toLowerCase().replace(/[\s-]+/g, "-") === target
          ))
    );
    if (sub) return { categorySlug: cat.slug, subSlug: sub.slug };
  }
  return null;
}
