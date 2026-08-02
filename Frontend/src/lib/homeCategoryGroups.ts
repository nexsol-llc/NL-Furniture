// Home category tiles are fully API-driven (see `/api/kategorie-settings`, which
// exposes a unified `categories[]`, each item carrying `type: "indoor" | "outdoor"`).
// This module now only holds the shared item type — no category data is
// hardcoded here anymore.

export type HomeCategoryItem = {
  name: string;
  slug: string;
  image: string;
};
