"use client";

import { BadgeCheck } from "lucide-react";
import { HomeCard, SectionHeader, StarRating } from "./HomeUi";
import { FeaturedBrandCard, type PromoSlide } from "./PromoCards";
import { useLanguage } from "@/providers/languageContext";

interface Testimonial {
  name: string;
  text: string;
  product: string;
}

/**
 * Customer quotes. The site has no review store, so these come from the
 * localized defaults (the same pattern as the home page's default FAQs) —
 * swap them for a feed once one exists. The fourth column is a paid slot.
 */
export default function TestimonialsSection({ ad }: { ad?: PromoSlide }) {
  const { t, tList } = useLanguage();
  const testimonials = tList<Testimonial>("homeCompare.testimonials.items");

  if (testimonials.length === 0) return null;

  return (
    <HomeCard className="p-4">
      <div id="beoordelingen" className="scroll-mt-[calc(var(--header-height)+1rem)]">
        <SectionHeader
          title={t("homeCompare.testimonials.title")}
          href="/magazine"
          linkLabel={t("homeCompare.testimonials.viewAll")}
          className="mb-3.5"
        />
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${ad ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {testimonials.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-xl bg-gray-50/80 p-3.5 ring-1 ring-gray-200/70"
          >
            <figcaption className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                {initials(item.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-gray-900">
                  {item.name}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                  <BadgeCheck className="h-2.5 w-2.5 text-primary-500" />
                  {t("homeCompare.testimonials.verifiedBuyer")}
                </span>
              </span>
            </figcaption>

            <StarRating rating={5} />

            <blockquote className="mt-1.5 line-clamp-4 text-[11px] leading-relaxed text-gray-600">
              {item.text}
            </blockquote>

            <span className="mt-auto flex items-center gap-1.5 pt-3">
              <span className="truncate rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-gray-500 ring-1 ring-gray-200">
                {item.product}
              </span>
            </span>
          </figure>
        ))}

        {ad && <FeaturedBrandCard slide={ad} />}
      </div>
    </HomeCard>
  );
}

/** First letter of the first two words — no avatar images exist for these quotes. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
