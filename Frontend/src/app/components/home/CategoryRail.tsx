"use client";

import Link from "next/link";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard, Rail, SectionHeader } from "./HomeUi";
import { useLanguage } from "@/providers/languageContext";
import { categoryCircleBg } from "@/lib/colorPresets";

export interface CategoryTile {
  name: string;
  href: string;
  image?: string | null;
  /** Admin-picked circle color behind the image; empty = theme default. */
  imageBgColor?: string | null;
  /** Number of catalog entries under this parent — rendered as "N+ items". */
  count?: number;
}

/** "Shop by category" — the featured parent categories, in their admin order. */
export default function CategoryRail({ categories }: { categories: CategoryTile[] }) {
  const { t } = useLanguage();

  return (
    <HomeCard className="w-full min-w-0 rounded-[20px] p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.22)] md:p-6">
      <SectionHeader
        title={t("homeCompare.categories.title")}
        href="/categorie"
        linkLabel={t("homeCompare.categories.viewAll")}
        className="mb-4"
      />

      <Rail
        prevLabel={t("homeCompare.brands.prev")}
        nextLabel={t("homeCompare.brands.next")}
        arrows={false}
        contentClassName="-my-2 gap-4 pt-2 pb-3 lg:justify-between lg:gap-5"
      >
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group w-[92px] shrink-0 snap-start text-center lg:flex-1 lg:basis-0"
          >
            <div
              className="relative mx-auto h-[80px] w-[80px] overflow-hidden rounded-full ring-1 ring-black/[0.03] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_10px_22px_-12px_rgb(var(--primary-500-rgb)/0.45)] sm:h-[84px] sm:w-[84px]"
              style={{ backgroundColor: categoryCircleBg(category.imageBgColor) }}
            >
              <PlaceholderImage
                src={category.image}
                alt={category.name}
                fill
                sizes="84px"
                className="h-full w-full object-contain p-4 transition-transform duration-200 group-hover:scale-[1.04]"
                iconClassName="w-1/3 h-1/3"
              />
            </div>
            <p className="mt-2 truncate text-center text-[11px] font-semibold text-gray-900">
              {category.name}
            </p>
          </Link>
        ))}
      </Rail>
    </HomeCard>
  );
}
