// Home category tiles are fully API-driven (see `/api/kategorie-settings`, which
// exposes a unified `categories[]`, each item carrying `type: "indoor" | "outdoor"`).
// This module now only holds the shared item type — no category data is
// hardcoded here anymore.

export type HomeCategoryItem = {
  name: string;
  slug: string;
  image: string;
  // Optional sub-label rendered under the tile name in the photo card variant
  // (e.g. "12 categorieën"). Callers pass it already translated.
  caption?: string;
  // Explicit destination, overriding the grid's `${hrefBase}/${slug}`. Lets one
  // flat grid mix tiles that live under different routes.
  href?: string;
};
