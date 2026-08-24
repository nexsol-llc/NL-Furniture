"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";
import CategoryCardsGrid from "./CategoryCardsGrid";
import CategoryPhotoCardsGrid from "./CategoryPhotoCardsGrid";
import { useLanguage } from "@/providers/languageContext";

type CategoryGroupGridProps = {
  title: string;
  subtitle?: string;
  categories: HomeCategoryItem[];
  backgroundClassName?: string;
  headerExtra?: ReactNode;
  moreCategoriesHref?: string;
  hrefBase?: string;
  // "tile" — centered heading over the compact icon tiles (default).
  // "photo" — left-aligned heading with a top-right "view more" pill over the
  // 6-up photo cards.
  variant?: "tile" | "photo";
  // When set, only this many rows of cards are shown up front and the
  // "view more" control expands the rest in place instead of linking away.
  collapsibleRows?: number;
};

// Columns per breakpoint, mirroring the two card grids: tiles run 7-up from lg
// and 6-up below, photo cards 6-up from lg and 4-up below. The mobile scrollers
// have no rows of their own, so they reuse the smaller count.
const COLUMNS = {
  tile: { lg: 7, base: 6 },
  photo: { lg: 6, base: 4 },
} as const;

function useGridColumns(variant: "tile" | "photo") {
  const [columns, setColumns] = useState<number>(COLUMNS[variant].lg);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setColumns(query.matches ? COLUMNS[variant].lg : COLUMNS[variant].base);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [variant]);

  return columns;
}

export default function CategoryGroupGrid({
  title,
  subtitle,
  categories,
  backgroundClassName = "section-bg-2",
  headerExtra,
  moreCategoriesHref,
  hrefBase,
  variant = "tile",
  collapsibleRows,
}: CategoryGroupGridProps) {
  const { t } = useLanguage();
  const columns = useGridColumns(variant);
  const [expanded, setExpanded] = useState(false);

  const visibleCount = collapsibleRows ? columns * collapsibleRows : categories.length;
  // Only worth a toggle when something is actually hidden — otherwise fall back
  // to the plain "view more" link.
  const collapsible = collapsibleRows != null && categories.length > visibleCount;
  const visibleCategories =
    collapsible && !expanded ? categories.slice(0, visibleCount) : categories;

  const arrowIcon = (extraClassName = "group-hover:translate-x-0.5") => (
    <svg
      className={`w-4 h-4 transition-transform ${extraClassName}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  const toggleLabel = expanded
    ? t("categoryGroupGrid.viewLess")
    : t("categoryGroupGrid.viewMore");
  const toggleIcon = arrowIcon(
    expanded ? "-rotate-90" : "rotate-90 group-hover:translate-y-0.5",
  );
  const toggleExpanded = () => setExpanded((value) => !value);

  if (variant === "photo") {
    const pillClassName =
      "group inline-flex items-center gap-2 rounded-full border border-primary-500 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50";

    return (
      <section className={`${backgroundClassName} py-12 md:py-16`}>
        <div className="max-w-content mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 font-display text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>

            {collapsible ? (
              <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={expanded}
                className={pillClassName}
              >
                {toggleLabel}
                {toggleIcon}
              </button>
            ) : (
              moreCategoriesHref && (
                <Link href={moreCategoriesHref} className={pillClassName}>
                  {t("categoryGroupGrid.viewMore")}
                  {arrowIcon()}
                </Link>
              )
            )}
          </div>

          {headerExtra && <div className="mb-6 flex justify-center">{headerExtra}</div>}

          <CategoryPhotoCardsGrid categories={visibleCategories} hrefBase={hrefBase} />
        </div>
      </section>
    );
  }

  const linkClassName =
    "group inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800";

  return (
    <section className={`${backgroundClassName} py-12 md:py-16`}>
      <div className="max-w-content mx-auto px-4">
        <div className="flex flex-col items-center mb-6 text-center">
          <h2 className="text-h2 font-display text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {headerExtra && <div className="mt-5 w-full flex justify-center">{headerExtra}</div>}
        </div>

        <CategoryCardsGrid categories={visibleCategories} hrefBase={hrefBase} />

        {collapsible ? (
          <div className="mt-8 mr-8 flex justify-end">
            <button
              type="button"
              onClick={toggleExpanded}
              aria-expanded={expanded}
              className={linkClassName}
            >
              {toggleLabel}
              {toggleIcon}
            </button>
          </div>
        ) : (
          moreCategoriesHref && (
            <div className="mt-8 mr-8 flex justify-end">
              <Link href={moreCategoriesHref} className={linkClassName}>
                {t("categoryGroupGrid.viewMore")}
                {arrowIcon()}
              </Link>
            </div>
          )
        )}
      </div>
    </section>
  );
}
