"use client";

import type { ReactNode } from "react";
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
};

export default function CategoryGroupGrid({
  title,
  subtitle,
  categories,
  backgroundClassName = "section-bg-2",
  headerExtra,
  moreCategoriesHref,
  hrefBase,
  variant = "tile",
}: CategoryGroupGridProps) {
  const { t } = useLanguage();

  const arrowIcon = (
    <svg
      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  if (variant === "photo") {
    return (
      <section className={`${backgroundClassName} py-12 md:py-16`}>
        <div className="max-w-content mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 font-display text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>

            {moreCategoriesHref && (
              <Link
                href={moreCategoriesHref}
                className="group inline-flex items-center gap-2 rounded-full border border-primary-500 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
              >
                {t("categoryGroupGrid.viewMore")}
                {arrowIcon}
              </Link>
            )}
          </div>

          {headerExtra && <div className="mb-6 flex justify-center">{headerExtra}</div>}

          <CategoryPhotoCardsGrid categories={categories} hrefBase={hrefBase} />
        </div>
      </section>
    );
  }

  return (
    <section className={`${backgroundClassName} py-12 md:py-16`}>
      <div className="max-w-content mx-auto px-4">
        <div className="flex flex-col items-center mb-6 text-center">
          <h2 className="text-h2 font-display text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {headerExtra && <div className="mt-5 w-full flex justify-center">{headerExtra}</div>}
        </div>

        <CategoryCardsGrid categories={categories} hrefBase={hrefBase} />

        {moreCategoriesHref && (
          <div className="mt-8 mr-8 flex justify-end">
            <Link
              href={moreCategoriesHref}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              {t("categoryGroupGrid.viewMore")}
              {arrowIcon}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
