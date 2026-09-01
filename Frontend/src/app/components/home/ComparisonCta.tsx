"use client";

import { Scale, ShieldCheck, Sliders, Star, Tag } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { useCompare, COMPARE_MAX } from "@/providers/compareContext";
import { useLanguage } from "@/providers/languageContext";

/**
 * Full-width call to action for the comparison feature. The two preview tiles
 * mirror the visitor's own tray once they have picked something, and fall back
 * to the supplied showcase images while it is empty.
 */
export default function ComparisonCta({ showcase = [] }: { showcase?: (string | undefined)[] }) {
  const { t } = useLanguage();
  const { items } = useCompare();

  const left = items[0]?.image ?? showcase[0];
  const right = items[1]?.image ?? showcase[1];

  const features = [
    { icon: Tag, title: t("homeCompare.compareCta.priceTitle"), text: t("homeCompare.compareCta.priceText") },
    {
      icon: Sliders,
      title: t("homeCompare.compareCta.featuresTitle"),
      text: t("homeCompare.compareCta.featuresText"),
    },
    {
      icon: Star,
      title: t("homeCompare.compareCta.reviewsTitle"),
      text: t("homeCompare.compareCta.reviewsText"),
    },
    {
      icon: ShieldCheck,
      title: t("homeCompare.compareCta.warrantyTitle"),
      text: t("homeCompare.compareCta.warrantyText"),
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-primary-950 p-5 shadow-depth-2 md:p-7">
      {/* Brand-tinted glow behind the copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-600/25 blur-3xl"
      />

      <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <h2 className="font-display text-lg leading-tight text-white md:text-2xl">
            {t("homeCompare.compareCta.title")}
          </h2>
          <p className="mt-1.5 max-w-lg text-[11px] text-white/65 md:text-xs">
            {t("homeCompare.compareCta.subtitle", { max: COMPARE_MAX })}
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="h-4 w-4 text-primary-400" strokeWidth={1.9} />
                <p className="mt-1.5 text-[11px] font-bold text-white">{title}</p>
                <p className="text-[10px] leading-snug text-white/55">{text}</p>
              </li>
            ))}
          </ul>

          <a
            href="#vergelijken"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-cta transition-all hover:-translate-y-0.5 hover:bg-primary-700"
          >
            <Scale className="h-3.5 w-3.5" />
            {t("homeCompare.compareCta.cta")}
          </a>
        </div>

        {/* Two products with the "vs" medallion between them. */}
        <div className="relative hidden items-center justify-center gap-3 lg:flex">
          <ShowcaseTile src={left} />
          <span className="z-10 -mx-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black uppercase text-white shadow-depth-3 ring-4 ring-gray-900">
            {t("homeCompare.compareTray.vs")}
          </span>
          <ShowcaseTile src={right} />
        </div>
      </div>
    </section>
  );
}

function ShowcaseTile({ src }: { src?: string }) {
  return (
    <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
      <PlaceholderImage
        src={src}
        alt=""
        fill
        className="h-full w-full object-contain p-2"
        iconClassName="w-1/3 h-1/3"
      />
    </div>
  );
}
