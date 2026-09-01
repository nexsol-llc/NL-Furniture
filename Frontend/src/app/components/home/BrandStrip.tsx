"use client";

import PlaceholderImage from "../PlaceholderImage";
import { AdChip, HomeCard, Rail, SectionHeader } from "./HomeUi";
import { normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

export interface BrandTile {
  _id: string;
  title: string;
  slug: string;
  logo?: string;
  website?: string;
  /** Paid placements carry the "Ad" marker, matching how the feed marks them. */
  sponsored?: boolean;
}

/** "Top brands you can trust" — the featured furniture brands, as logo cards. */
export default function BrandStrip({ brands }: { brands: BrandTile[] }) {
  const { t } = useLanguage();

  return (
    <HomeCard className="p-4">
      <SectionHeader
        title={t("homeCompare.brands.title")}
        href="/merken"
        linkLabel={t("homeCompare.brands.viewAll")}
        className="mb-3.5"
      />

      <Rail prevLabel={t("homeCompare.brands.prev")} nextLabel={t("homeCompare.brands.next")}>
        {brands.map((brand) => {
          const href = brand.website ? normalizeLink(brand.website) : `/merken/${brand.slug}`;
          const external = Boolean(brand.website);
          return (
            <a
              key={brand._id}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group relative flex h-[62px] w-[110px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-xl bg-white p-3 ring-1 ring-gray-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-depth-2 hover:ring-primary-300 sm:w-[124px]"
            >
              <div className="relative h-full w-full">
                <PlaceholderImage
                  src={brand.logo}
                  alt={brand.title}
                  fill
                  className="h-full w-full object-contain"
                  iconClassName="w-1/3 h-1/3"
                />
              </div>
              {brand.sponsored && <AdChip label={t("homeCompare.adLabel")} className="absolute bottom-1 left-1" />}
            </a>
          );
        })}
      </Rail>
    </HomeCard>
  );
}
