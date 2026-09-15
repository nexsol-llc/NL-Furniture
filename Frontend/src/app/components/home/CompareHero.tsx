"use client";

import { useEffect, useState } from "react";
import { ImageUp, Search, ShieldCheck } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import VisualSearchModal from "../VisualSearchModal";
import { HERO_ROTATE_SECONDS } from "@/lib/heroSlides";
import { useLanguage } from "@/providers/languageContext";

export interface HeroSlide {
  _id: string;
  image: string;
  link?: string;
  title?: string;
  subtitle?: string;
  /** Per-slide switches from Admin → Home Page Settings; absent means shown. */
  showGradient?: boolean;
  showText?: boolean;
}

/** Compact masthead matched to the FurniCompare reference composition. */
// A slot without an image is skipped by both the hero and its backdrop.
const withImage = (slides: HeroSlide[]) => slides.filter((s) => s.image?.trim());

export default function CompareHero({
  slides,
  onActiveChange,
}: {
  slides: HeroSlide[];
  /** Reports the showing slide's id, so the page backdrop can follow it. */
  onActiveChange?: (slideId: string | null) => void;
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  // Admin → Home Page Settings. A slot without an image is skipped; with none at
  // all the hero is just the brand colour behind its gradient.
  const images = withImage(slides);
  const count = images.length;
  const current = active < count ? active : 0;
  // A banner with its own artwork text can switch off the site's headline and
  // gradient. Both fade with the slide; the text stays in the DOM (it's the
  // page's h1), only visually hidden.
  const showGradient = images[current]?.showGradient !== false;
  const showText = images[current]?.showText !== false;

  const activeId = images[current]?._id ?? null;
  useEffect(() => {
    onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  useEffect(() => {
    if (count <= 1) return;
    const interval = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, HERO_ROTATE_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, [count]);
  const stats = [
    ["50K+", t("homeCompare.hero.statProducts")],
    ["200+", t("homeCompare.hero.statBrands")],
    ["10K+", t("homeCompare.hero.statReviews")],
    ["99%", t("homeCompare.hero.statHappy")],
  ];

  return (
    <>
      {/* Below sm the upload card sits in flow under the headline and the hero
          grows to fit; a fixed height let the two overlap on narrow phones. */}
      <section className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[20px] bg-primary-950 shadow-depth-3 sm:h-[400px] sm:min-h-0 xl:h-[390px]">
        {/* Slides are stacked and cross-faded, so each is loaded before its turn. */}
        {images.map((slide, i) => (
          <div
            key={slide._id}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <PlaceholderImage
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${showGradient ? "opacity-100" : "opacity-0"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/60 via-primary-900/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary-950/25 to-transparent" />
        </div>

        <div
          className={`relative z-10 px-6 pb-5 pt-7 transition-opacity duration-700 sm:px-8 sm:pb-0 sm:pt-8 xl:px-10 xl:pr-[360px] ${
            showText ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="max-w-[680px]">
            <h1 className="max-w-[640px] text-[2rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-[2.25rem] xl:text-[2.5rem]">
              {t("homeCompare.hero.titleLine1")}<br />{t("homeCompare.hero.titleLine2")}
            </h1>
            <p className="mt-3 max-w-[540px] text-[11px] leading-relaxed text-white/75 sm:text-xs">
              {t("homeCompare.hero.subtitle")}
            </p>
          </div>

          <dl className="mt-5 grid max-w-[500px] grid-cols-4 divide-x divide-white/20">
            {stats.map(([value, label]) => (
              <div key={label} className="px-3 first:pl-0 sm:px-4 sm:first:pl-0">
                <dt className="text-lg font-extrabold text-white">{value}</dt>
                <dd className="mt-0.5 text-[8px] leading-tight text-white/60 sm:text-[9px]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-20 mx-4 mb-4 mt-auto flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-soft-lg backdrop-blur-md sm:absolute sm:bottom-4 sm:left-5 sm:right-5 sm:m-0 sm:min-h-[88px] sm:flex-row sm:items-center sm:gap-4 sm:px-5 xl:right-[334px]">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100 sm:h-12 sm:w-12">
              <ImageUp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-gray-900">{t("homeCompare.hero.uploadTitle")}</p>
              <p className="mt-0.5 max-w-[480px] text-[10px] leading-relaxed text-gray-500">{t("homeCompare.hero.uploadText")}</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowVisualSearch(true)} className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-cta transition hover:-translate-y-0.5 hover:from-primary-700 hover:to-primary-600 sm:w-auto">
            <Search className="h-3.5 w-3.5" />
            {t("homeCompare.hero.uploadCta")}
          </button>
        </div>

        <div
          className={`absolute bottom-[116px] left-10 z-10 hidden items-center gap-1.5 text-[9px] font-medium text-white/55 transition-opacity duration-700 sm:flex ${
            showText ? "opacity-100" : "opacity-0"
          }`}
        >
          <ShieldCheck className="h-3 w-3 text-primary-300" />
          {t("homeCompare.hero.trustLine")}
        </div>
      </section>

      <VisualSearchModal open={showVisualSearch} onClose={() => setShowVisualSearch(false)} />
    </>
  );
}

/**
 * The band behind the top of the home page: a heavily blurred copy of the
 * showing hero slide, cross-faded in step with it. When that slide keeps its
 * gradient, the band carries the same left-to-right fade, which also backs the
 * sidebar's white text. A light tint keeps that text legible over bright
 * photos; with no slides it's the plain dark ground underneath.
 */
export function HeroBackdrop({
  slides,
  activeId,
  className = "",
}: {
  slides: HeroSlide[];
  activeId: string | null;
  className?: string;
}) {
  const images = withImage(slides);
  const showGradient = images.find((s) => s._id === activeId)?.showGradient !== false;

  return (
    <div aria-hidden="true" className={`overflow-hidden bg-gray-950 ${className}`}>
      {images.map((slide) => (
        <img
          key={slide._id}
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-2xl saturate-150 transition-opacity duration-1000 motion-reduce:transition-none ${
            slide._id === activeId ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-primary-950/60 via-primary-900/20 to-transparent transition-opacity duration-700 motion-reduce:transition-none ${
          showGradient ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 bg-gray-950/20" />
    </div>
  );
}
