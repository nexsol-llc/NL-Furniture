"use client";

import Link from "next/link";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard, Rail, SectionHeader } from "./HomeUi";
import { useLanguage } from "@/providers/languageContext";

export interface CategoryTile {
  name: string;
  href: string;
  image?: string | null;
  /** Number of catalog entries under this parent — rendered as "N+ items". */
  count?: number;
}

/** "Shop by category" — the featured parent categories, in their admin order. */
export default function CategoryRail({ categories }: { categories: CategoryTile[] }) {
  const { t } = useLanguage();

  return (
    <HomeCard className="p-4">
      <SectionHeader
        title={t("homeCompare.categories.title")}
        href="/categorie"
        linkLabel={t("homeCompare.categories.viewAll")}
        className="mb-3.5"
      />

      <Rail prevLabel={t("homeCompare.brands.prev")} nextLabel={t("homeCompare.brands.next")} arrows={false}>
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group w-[88px] shrink-0 snap-start sm:w-[96px]"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200/80 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-primary-300">
              <PlaceholderImage
                src={category.image}
                alt={category.name}
                fill
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                iconClassName="w-1/3 h-1/3"
              />
            </div>
            <p className="mt-1.5 truncate text-center text-[11px] font-semibold text-gray-900">
              {category.name}
            </p>
            {typeof category.count === "number" && category.count > 0 && (
              <p className="truncate text-center text-[9px] text-gray-400">
                {t("homeCompare.categories.itemCount", { count: category.count })}
              </p>
            )}
          </Link>
        ))}
      </Rail>
    </HomeCard>
  );
}
