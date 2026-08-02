"use client";

// src/app/components/SubcategorySlider.tsx

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, Layers } from "lucide-react";
import type { SubcategoryDef } from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

type SubcategorySliderProps = {
  categorySlug: string;
  subcategories: SubcategoryDef[];
  activeSubSlug?: string;
  // Optional "budget" quick-filter tile shown first (not a real subcategory).
  priceUnder?: number;
  priceLabel?: string;
  priceActive?: boolean;
  priceImage?: string;
  onPriceClick?: () => void;
};

export default function SubcategorySlider({
  categorySlug,
  subcategories,
  activeSubSlug,
  priceUnder = 0,
  priceLabel,
  priceActive = false,
  priceImage,
  onPriceClick,
}: SubcategorySliderProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDown(true);
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    hasMoved.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDown(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDown(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDown) return;
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      if (Math.abs(walk) > 3) {
        hasMoved.current = true;
      }
      el.scrollLeft = scrollLeft.current - walk;
    },
    [isDown]
  );

  const showPriceTile = priceUnder > 0 && !!onPriceClick;

  if (subcategories.length === 0 && !showPriceTile) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden my-4">
      <div
        ref={scrollRef}
        className={`flex items-stretch gap-3 overflow-x-auto select-none touch-pan-x py-2 px-1 hide-scrollbar ${
          isDown ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Budget quick-filter tile (first, not a real subcategory) */}
        {showPriceTile && (
          <button
            type="button"
            draggable={false}
            onClick={() => {
              if (hasMoved.current) { hasMoved.current = false; return; }
              onPriceClick?.();
            }}
            className={`group flex-shrink-0 flex items-center gap-3.5 px-3 py-2 rounded-xl border shadow-soft hover:shadow-soft-md transition-all duration-200 min-w-[170px] sm:min-w-[190px] max-w-[220px] text-left ${
              priceActive
                ? "border-primary-600 ring-2 ring-primary-600/10 bg-[var(--section-bg-1)]"
                : "border-gray-100 bg-[var(--section-bg-1)] hover:border-gray-300"
            }`}
          >
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border ${
                priceActive ? "border-primary-600" : "border-primary-200"
              } ${priceImage ? "bg-gray-50" : priceActive ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600"}`}
            >
              {priceImage ? (
                <Image
                  src={priceImage}
                  alt={priceLabel || t('subcategorySlider.priceTileFallbackAlt')}
                  fill
                  sizes="(max-width: 640px) 48px, 56px"
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <Tag size={22} strokeWidth={2.2} />
              )}
            </div>
            <span
              className={`text-[12px] sm:text-[13px] font-bold tracking-tight leading-snug line-clamp-2 ${
                priceActive ? "text-primary-600" : "text-gray-700 group-hover:text-black"
              }`}
            >
              {priceLabel}
            </span>
          </button>
        )}

        {subcategories.map((sub) => {
          const isActive = activeSubSlug === sub.slug;
          const href = `/categorie/${encodeURIComponent(categorySlug)}/${encodeURIComponent(sub.slug)}`;
          const imageUrl = sub.imageUrl || "";

          return (
            <Link
              key={sub.slug}
              href={href}
              draggable={false}
              onClick={(e) => {
                if (hasMoved.current) {
                  e.preventDefault();
                  hasMoved.current = false;
                }
              }}
              className={`group bg-[var(--section-bg-1)] flex-shrink-0 flex items-center gap-3.5 px-3 py-2 rounded-xl border shadow-soft hover:shadow-soft-md transition-all duration-200 min-w-[170px] sm:min-w-[190px] max-w-[220px] ${
                isActive
                  ? "border-primary-500 ring-2 ring-primary-500/10 bg-[#FAF8F5]"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              {/* Subcategory image on the left (icon fallback when none set) */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-gray-400">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={sub.name}
                    fill
                    sizes="(max-width: 640px) 48px, 56px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                  />
                ) : (
                  <Layers size={22} strokeWidth={2} />
                )}
              </div>

              {/* Title on the Right */}
              <span
                className={`text-[12px] sm:text-[13px] font-bold tracking-tight leading-snug line-clamp-2 text-left ${
                  isActive ? "text-gray-950" : "text-gray-700 group-hover:text-black"
                }`}
              >
                {sub.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
