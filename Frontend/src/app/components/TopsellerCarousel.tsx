"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { Reveal } from "./motion/Reveal";
import { useLanguage } from "@/providers/languageContext";

type FeaturedProduct = {
  id: string;
  slug?: string;
  name: string;
  price: string;
  image: string;
  brand: string;
  is_sponsored?: boolean;
  deliveryCost?: string;
};

// Highlighted "Topseller" row shown at the top of the category page — a
// horizontal, scrollable strip of the sponsored/featured products.
export default function TopsellerCarousel({
  products,
  title,
}: {
  products: FeaturedProduct[];
  title?: string;
}) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <Reveal className="mb-8 rounded-2xl section-bg-2 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-wide text-gray-900 sm:text-xl">
          {title ?? t('topsellerCarousel.defaultTitle')}
        </h2>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={t('topsellerCarousel.prevAriaLabel')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-gray-700 shadow-soft-sm transition hover:bg-gray-50 hover:shadow-soft"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={t('topsellerCarousel.nextAriaLabel')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-gray-700 shadow-soft-sm transition hover:bg-gray-50 hover:shadow-soft"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth hide-scrollbar"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[200px] flex-shrink-0 snap-start sm:w-[230px]">
            <ProductCard
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              image={p.image}
              brand={p.brand}
              is_sponsored={p.is_sponsored}
              deliveryCost={p.deliveryCost}
            />
          </div>
        ))}
      </div>
    </Reveal>
  );
}
