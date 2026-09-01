"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PlaceholderImage from "../PlaceholderImage";
import { FilterChip, HomeCard, Rail, SectionHeader } from "./HomeUi";
import { useLanguage } from "@/providers/languageContext";

export interface InspirationItem {
  _id: string;
  title: string;
  category?: string;
  thumbnail?: string;
  heroImage?: string;
}

const ALL = "__all__";

/**
 * Magazine articles as room inspiration. The filter chips are the categories
 * actually present in the feed, so the row never offers an empty filter.
 */
export default function InspirationRail({ items }: { items: InspirationItem[] }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>(ALL);

  // How many articles each category holds — doubles as the card caption, the
  // way the design captions each tile with an idea count.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = item.category?.trim();
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const categories = useMemo(() => Array.from(counts.keys()), [counts]);

  const visible = filter === ALL ? items : items.filter((i) => i.category === filter);

  return (
    <HomeCard className="p-4">
      <SectionHeader
        title={t("homeCompare.inspiration.title")}
        href="/magazine"
        linkLabel={t("homeCompare.inspiration.viewAll")}
        className="mb-3.5"
      >
        {categories.length > 0 && (
          <div className="flex w-full items-center gap-1.5 overflow-x-auto hide-scrollbar md:justify-center">
            <FilterChip
              label={t("homeCompare.inspiration.allFilter")}
              active={filter === ALL}
              onClick={() => setFilter(ALL)}
            />
            {categories.map((category) => (
              <FilterChip
                key={category}
                label={category}
                active={filter === category}
                onClick={() => setFilter(category)}
              />
            ))}
          </div>
        )}
      </SectionHeader>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">{t("homeCompare.inspiration.empty")}</p>
      ) : (
        <Rail
          prevLabel={t("homeCompare.inspiration.prev")}
          nextLabel={t("homeCompare.inspiration.next")}
        >
          {visible.map((item) => (
            <Link
              key={item._id}
              href={`/blog/${item._id}`}
              className="group w-[170px] shrink-0 snap-start sm:w-[190px]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200/80 transition-all duration-300 group-hover:ring-primary-300">
                <PlaceholderImage
                  src={item.thumbnail || item.heroImage}
                  alt={item.title}
                  fill
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-gray-900">
                {item.title}
              </p>
              {item.category && (
                <p className="text-[9px] text-gray-400">
                  {t("homeCompare.inspiration.ideasCount", { count: counts.get(item.category) ?? 1 })}
                </p>
              )}
            </Link>
          ))}
        </Rail>
      )}
    </HomeCard>
  );
}
