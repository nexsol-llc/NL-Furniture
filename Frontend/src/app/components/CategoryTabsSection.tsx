"use client";

import { useState } from "react";
import CategoryCardsGrid from "./CategoryCardsGrid";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";
import { useLanguage } from "@/providers/languageContext";

type CategoryTabsSectionProps = {
  indoor: HomeCategoryItem[];
  outdoor: HomeCategoryItem[];
};

// Single section that switches between the Innenbereich (indoor) and
// Außenbereich (outdoor) category grids via a tab toggle. Tiles link to
// /binnen/[slug] or /buiten/[slug] to match whichever tab is active.
export default function CategoryTabsSection({
  indoor,
  outdoor,
}: CategoryTabsSectionProps) {
  const { t } = useLanguage();
  const tabs = [
    {
      key: "innen",
      label: t('categoryTabsSection.indoorLabel'),
      subtitle: t('categoryTabsSection.indoorSubtitle'),
      items: indoor,
    },
    {
      key: "aussen",
      label: t('categoryTabsSection.outdoorLabel'),
      subtitle: t('categoryTabsSection.outdoorSubtitle'),
      items: outdoor,
    },
  ].filter((tab) => tab.items.length > 0);

  const [active, setActive] = useState(tabs[0]?.key ?? "innen");

  if (tabs.length === 0) return null;

  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];

  return (
    <section className="py-8">
      <div className="max-w-content mx-auto px-4">
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Tab switcher */}
          <div className="inline-flex bg-white rounded-full p-1 shadow-soft border border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`px-5 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === tab.key
                    ? "bg-primary-600 text-white shadow-soft-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">{current.subtitle}</p>
        </div>

        <CategoryCardsGrid categories={current.items} hrefBase={`/${current.key}`} />
      </div>
    </section>
  );
}
