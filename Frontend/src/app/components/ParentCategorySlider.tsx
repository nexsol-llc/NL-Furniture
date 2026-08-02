"use client";

// src/app/components/ParentCategorySlider.tsx
// Horizontal, drag-to-scroll row of Parent Category tiles on the Furniture
// page. The "Alle" tile clears the in-place filter (back to the full
// Furniture grid); every other tile navigates straight to that Parent
// Category's own page (e.g. /binnen/[slug]) — same interaction as
// CategoryLinkSlider/SubcategorySlider.

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, FolderTree } from "lucide-react";
import type { ParentCategoryDef } from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

type ParentCategorySliderProps = {
  parentCategories: ParentCategoryDef[];
  activeParentId: string | null;
  onSelect: (parentId: string | null) => void;
  // Base path each tile links to, e.g. "/binnen" so a tile for slug "wohnzimmer"
  // links to "/binnen/wohnzimmer".
  hrefBase: string;
};

export default function ParentCategorySlider({
  parentCategories,
  activeParentId,
  onSelect,
  hrefBase,
}: ParentCategorySliderProps) {
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

  const handleClick = (id: string | null) => {
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    onSelect(id);
  };

  if (parentCategories.length === 0) return null;

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
        {/* "Alle" tile clears the parent filter */}
        <button
          type="button"
          draggable={false}
          onClick={() => handleClick(null)}
          className={`group bg-[var(--section-bg-1)] flex-shrink-0 flex items-center gap-3.5 px-3 py-2 rounded-xl border shadow-soft hover:shadow-soft-md transition-all duration-200 min-w-[130px] max-w-[160px] text-left ${
            activeParentId === null
              ? "border-primary-500 ring-2 ring-primary-500/10 bg-[#FAF8F5]"
              : "border-gray-100 hover:border-gray-300"
          }`}
        >
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-gray-400">
            <LayoutGrid size={22} strokeWidth={2} />
          </div>
          <span
            className={`text-[12px] sm:text-[13px] font-bold tracking-tight leading-snug ${
              activeParentId === null ? "text-gray-950" : "text-gray-700 group-hover:text-black"
            }`}
          >
            {t('parentCategorySlider.allLabel')}
          </span>
        </button>

        {parentCategories.map((pc) => {
          const isActive = activeParentId === pc._id;
          return (
            <Link
              key={pc._id}
              href={`${hrefBase}/${encodeURIComponent(pc.slug)}`}
              draggable={false}
              onClick={(e) => {
                if (hasMoved.current) {
                  e.preventDefault();
                  hasMoved.current = false;
                }
              }}
              className={`group bg-[var(--section-bg-1)] flex-shrink-0 flex items-center gap-3.5 px-3 py-2 rounded-xl border shadow-soft hover:shadow-soft-md transition-all duration-200 min-w-[170px] sm:min-w-[190px] max-w-[220px] text-left ${
                isActive
                  ? "border-primary-500 ring-2 ring-primary-500/10 bg-[#FAF8F5]"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-gray-400">
                {pc.image ? (
                  <Image
                    src={pc.image}
                    alt={pc.name}
                    fill
                    sizes="(max-width: 640px) 48px, 56px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                  />
                ) : (
                  <FolderTree size={22} strokeWidth={2} />
                )}
              </div>
              <span
                className={`text-[12px] sm:text-[13px] font-bold tracking-tight leading-snug text-left line-clamp-2 ${
                  isActive ? "text-gray-950" : "text-gray-700 group-hover:text-black"
                }`}
              >
                {pc.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
