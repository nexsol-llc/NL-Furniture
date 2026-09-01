"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Scale } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { SlideDots } from "./HomeUi";
import { useLanguage } from "@/providers/languageContext";

export interface HeroSlide {
  _id: string;
  image: string;
  link?: string;
  title?: string;
  subtitle?: string;
}

const ROTATE_MS = 6000;

/**
 * Headline panel. The admin-managed hero images (/api/hero) supply the photo and
 * an optional per-slide headline; the copy falls back to the localized default
 * so the panel is never empty on a fresh install.
 */
export default function CompareHero({ slides }: { slides: HeroSlide[] }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);

  const count = Math.max(slides.length, 1);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  // Keep the index valid when the slide list arrives or shrinks.
  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  const slide = slides[active];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 shadow-depth-2">
      {/* Photo occupies the right half and dissolves into the gradient. */}
      <div className="absolute inset-y-0 right-0 w-[62%] sm:w-[58%]">
        {slides.map((s, i) => (
          <div
            key={s._id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== active}
          >
            <PlaceholderImage src={s.image} alt="" fill className="h-full w-full object-cover" />
          </div>
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-700/70 to-transparent"
        />
      </div>

      {/* Soft light bloom, so the flat gradient reads as lit rather than printed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative z-10 flex min-h-[260px] flex-col justify-center gap-4 p-6 sm:min-h-[300px] sm:p-8 md:min-h-[330px] md:p-10 max-w-[68%] sm:max-w-[58%]">
        <div>
          <h1 className="font-display text-2xl leading-[1.12] text-white sm:text-3xl md:text-[2.35rem]">
            {slide?.title || (
              <>
                {t("homeCompare.hero.titleLine1")}
                <br />
                {t("homeCompare.hero.titleLine2")}
              </>
            )}
          </h1>
          <p className="mt-2.5 max-w-md text-xs leading-relaxed text-white/85 sm:text-sm">
            {slide?.subtitle || t("homeCompare.hero.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="#vergelijken"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-primary-700 shadow-soft-md transition-all hover:-translate-y-0.5 hover:shadow-depth-3 sm:text-sm"
          >
            <Scale className="h-4 w-4" />
            {t("homeCompare.hero.ctaPrimary")}
          </a>
          <Link
            href={slide?.link || "/categorie"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:text-sm"
          >
            {t("homeCompare.hero.ctaSecondary")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <SlideDots
          count={slides.length}
          active={active}
          onSelect={setActive}
          ariaLabel={(index) => t("homeCompare.hero.slideAria", { index })}
          className="mt-1"
        />
      </div>
    </section>
  );
}
