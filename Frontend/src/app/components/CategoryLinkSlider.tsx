"use client";

// src/app/components/CategoryLinkSlider.tsx
// Horizontal, drag-to-scroll row of Category tiles that link straight to
// their own /categorie/[slug] page — same interaction as SubcategorySlider,
// but for a flat list of top-level categories (e.g. everything under one
// Parent Category) rather than one category's subcategories.

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers } from "lucide-react";
import type { CategoryDef } from "@/lib/categoryCatalog";

type CategoryLinkSliderProps = {
  categories: CategoryDef[];
  // Defaults to the flat category page; pass e.g. "/binnen/wohnzimmer" so
  // tiles link to the nested /binnen/[parentSlug]/[categorySlug] page instead.
  hrefBase?: string;
};

export default function CategoryLinkSlider({ categories, hrefBase = "/categorie" }: CategoryLinkSliderProps) {
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

  const handleMouseLeave = useCallback(() => setIsDown(false), []);
  const handleMouseUp = useCallback(() => setIsDown(false), []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDown) return;
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      if (Math.abs(walk) > 3) hasMoved.current = true;
      el.scrollLeft = scrollLeft.current - walk;
    },
    [isDown]
  );

  if (categories.length === 0) return null;

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
        {categories.map((cat) => {
          const imageUrl = cat.image || cat.logo || "";
          return (
            <Link
              key={cat.slug}
              href={`${hrefBase}/${encodeURIComponent(cat.slug)}`}
              draggable={false}
              onClick={(e) => {
                if (hasMoved.current) {
                  e.preventDefault();
                  hasMoved.current = false;
                }
              }}
              className="group bg-[var(--section-bg-1)] flex-shrink-0 flex items-center gap-3.5 px-3 py-2 rounded-xl border border-gray-100 shadow-soft transition-all duration-200 min-w-[170px] sm:min-w-[190px] max-w-[220px] hover:border-gray-300 hover:shadow-soft-md"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-gray-400">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 48px, 56px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                  />
                ) : (
                  <Layers size={22} strokeWidth={2} />
                )}
              </div>
              <span className="text-[12px] sm:text-[13px] font-bold tracking-tight leading-snug text-left line-clamp-2 text-gray-700 group-hover:text-black">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
