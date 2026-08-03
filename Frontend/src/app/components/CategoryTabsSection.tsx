"use client";

import { useState } from "react";
import CategoryPhotoCardsGrid from "./CategoryPhotoCardsGrid";
import IndoorOutdoorToggle, { type IndoorOutdoorValue } from "./IndoorOutdoorToggle";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";
import { useLanguage } from "@/providers/languageContext";

type CategoryTabsSectionProps = {
  indoor: HomeCategoryItem[];
  outdoor: HomeCategoryItem[];
};

// Single section that switches between the indoor and outdoor category grids
// via the pill toggle. Tiles link to /binnen/[slug] or /buiten/[slug] to match
// whichever tab is active.
export default function CategoryTabsSection({
  indoor,
  outdoor,
}: CategoryTabsSectionProps) {
  const { t } = useLanguage();
  const [active, setActive] = useState<IndoorOutdoorValue>(
    indoor.length > 0 ? "indoor" : "outdoor"
  );

  if (indoor.length === 0 && outdoor.length === 0) return null;

  // Guard against a tab that lost its categories after the fetch resolved.
  const current: IndoorOutdoorValue =
    (active === "indoor" ? indoor : outdoor).length > 0
      ? active
      : active === "indoor"
        ? "outdoor"
        : "indoor";

  return (
    <section className="section-pattern-1 py-8">
      <div className="max-w-content mx-auto px-4">
        <div className="mb-6 text-center">
          <h2 className="text-h2 font-display text-gray-900">
            {t("categoryGroupGrid.heading")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {current === "indoor"
              ? t("categoryTabsSection.indoorSubtitle")
              : t("categoryTabsSection.outdoorSubtitle")}
          </p>

          <div className="mt-5 flex justify-center">
            <IndoorOutdoorToggle
              value={current}
              onChange={setActive}
              indoorLabel={t("categoryTabsSection.indoorLabel")}
              outdoorLabel={t("categoryTabsSection.outdoorLabel")}
              indoorDisabled={indoor.length === 0}
              outdoorDisabled={outdoor.length === 0}
            />
          </div>
        </div>

        <CategoryPhotoCardsGrid
          categories={current === "indoor" ? indoor : outdoor}
          hrefBase={current === "indoor" ? "/binnen" : "/buiten"}
        />
      </div>
    </section>
  );
}
