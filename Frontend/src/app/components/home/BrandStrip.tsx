"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { AdChip, HomeCard } from "./HomeUi";
import { normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

export interface BrandTile {
  _id: string;
  title: string;
  slug: string;
  logo?: string;
  website?: string;
  /** Paid placements carry the translated "Ad" marker. */
  sponsored?: boolean;
}

/** Featured furniture brands in a responsive, swipeable logo rail. */
export default function BrandStrip({ brands }: { brands: BrandTile[] }) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    atStart: true,
    atEnd: false,
  });

  const updateScrollState = useCallback(() => {
    const element = scroller.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setScrollState({
      canScroll: maxScrollLeft > 2,
      atStart: element.scrollLeft <= 2,
      atEnd: element.scrollLeft >= maxScrollLeft - 2,
    });
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);
    element.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("scroll", updateScrollState);
    };
  }, [brands.length, updateScrollState]);

  const scrollBrands = (direction: -1 | 1) => {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.round(element.clientWidth * 0.82),
      behavior: "smooth",
    });
  };

  return (
    <HomeCard className="rounded-[20px] border-primary-400/30 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-4 shadow-[0_12px_30px_-18px_rgb(var(--primary-950-rgb)/0.45)] sm:p-5 lg:p-6">
      <div className="mb-3.5 flex items-center gap-3 sm:mb-4">
        <h2 className="min-w-0 text-[14px] font-bold text-white sm:text-[15px]">
          {t("homeCompare.brands.title")}
        </h2>
        <Link
          href="/merken"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md text-[10px] font-semibold text-white/85 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600 sm:text-[11px]"
        >
          {t("homeCompare.brands.viewAll")}
          <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {scrollState.canScroll && (
          <CarouselButton
            direction="previous"
            label={t("homeCompare.brands.prev")}
            disabled={scrollState.atStart}
            onClick={() => scrollBrands(-1)}
          />
        )}

        <div
          ref={scroller}
          className="hide-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1"
        >
          {brands.map((brand) => {
            const href = brand.website ? normalizeLink(brand.website) : `/merken/${brand.slug}`;
            const external = Boolean(brand.website);

            return (
              <a
                key={brand._id}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={t("homeCompare.brands.brandAriaLabel", { brand: brand.title })}
                className="home-logo-surface group relative flex h-[72px] basis-[62%] shrink-0 snap-start items-center justify-center overflow-hidden rounded-[13px] bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-black/5 transition-all duration-[220ms] hover:-translate-y-[3px] hover:shadow-[0_8px_18px_-8px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600 sm:basis-[calc((100%-1.5rem)/3)] md:basis-[calc((100%-2.25rem)/4)] lg:basis-[calc((100%-3rem)/5)]"
              >
                <div className="relative h-full w-full transition-transform duration-[220ms] group-hover:scale-[1.03]">
                  <PlaceholderImage
                    src={brand.logo}
                    alt={brand.title}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 768px) 23vw, (min-width: 640px) 30vw, 58vw"
                    className="h-full w-full object-contain"
                    iconClassName="h-1/3 w-1/3"
                  />
                </div>
                {brand.sponsored && (
                  <AdChip
                    label={t("homeCompare.adLabel")}
                    className="absolute bottom-1 left-1"
                  />
                )}
              </a>
            );
          })}
        </div>

        {scrollState.canScroll && (
          <CarouselButton
            direction="next"
            label={t("homeCompare.brands.next")}
            disabled={scrollState.atEnd}
            onClick={() => scrollBrands(1)}
          />
        )}
      </div>
    </HomeCard>
  );
}

function CarouselButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600 disabled:cursor-default disabled:opacity-40"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
