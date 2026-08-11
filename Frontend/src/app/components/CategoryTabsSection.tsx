"use client";

import CategoryPhotoCardsGrid from "./CategoryPhotoCardsGrid";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";
import { useLanguage } from "@/providers/languageContext";

type CategoryTabsSectionProps = {
  categories: HomeCategoryItem[];
};

// Parent Category grid. Parent categories are one flat, untyped list, so there
// is no Indoor/Outdoor split here — each tile carries its own href
// (the flat /[slug] page).
export default function CategoryTabsSection({ categories }: CategoryTabsSectionProps) {
  const { t } = useLanguage();

  if (categories.length === 0) return null;

  return (
    <section className="section-pattern-1 py-8">
      <div className="max-w-content mx-auto px-4">
        <div className="mb-6 text-center">
          <h2 className="text-h2 font-display text-gray-900">
            {t("categoryGroupGrid.heading")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("categoryGroupGrid.subheading")}
          </p>
        </div>

        <CategoryPhotoCardsGrid categories={categories} />
      </div>
    </section>
  );
}
