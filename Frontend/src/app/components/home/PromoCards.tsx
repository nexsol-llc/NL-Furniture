"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Tag } from "lucide-react";
import NewsletterForm from "../NewsletterForm";
import PlaceholderImage from "../PlaceholderImage";
import { AdChip, HomeCard, SlideDots } from "./HomeUi";
import { normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

/* The sponsored placements and editorial cards that sit between the data
   modules. All of them are driven by admin content (sponsors, gadgets,
   influencer look) and simply don't render when that content is absent. */

export interface PromoSlide {
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

const ROTATE_MS = 7000;

/**
 * Wide sponsored banner. `tone="dark"` is the full-bleed mega banner; `"light"`
 * is the slimmer brand-spotlight strip.
 */
export function PromoBanner({
  slides,
  tone = "light",
  label,
  className = "",
}: {
  slides: PromoSlide[];
  tone?: "light" | "dark";
  label: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  if (count === 0) return null;
  const slide = slides[active];
  const href = normalizeLink(slide.link);
  const dark = tone === "dark";

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ${
        dark
          ? "bg-gradient-to-r from-gray-900 via-gray-900 to-primary-950 shadow-depth-2"
          : "border border-gray-200/80 bg-gradient-to-r from-primary-50 via-white to-primary-50/60 shadow-soft-sm"
      } ${className}`}
    >
      {/* Photo bleeds in from the right and fades into the panel. */}
      <div className={`absolute inset-y-0 right-0 ${dark ? "w-[52%]" : "w-[38%]"}`}>
        {slides.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
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
          className={`absolute inset-0 bg-gradient-to-r ${
            dark ? "from-gray-900 via-gray-900/70" : "from-white via-white/80"
          } to-transparent`}
        />
      </div>

      <div
        className={`relative z-10 flex flex-col justify-center gap-2.5 ${
          dark ? "min-h-[170px] p-6 md:min-h-[210px] md:p-8" : "min-h-[112px] p-5 md:min-h-[128px] md:px-7"
        } max-w-[64%] sm:max-w-[56%]`}
      >
        <AdChip label={label} className="w-fit" />

        <div>
          {slide.title && (
            <h2
              className={`font-display leading-tight ${
                dark ? "text-lg text-white md:text-2xl" : "text-base text-gray-900 md:text-xl"
              }`}
            >
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p
              className={`mt-1 line-clamp-2 text-[11px] md:text-xs ${
                dark ? "text-white/75" : "text-gray-500"
              }`}
            >
              {slide.subtitle}
            </p>
          )}
        </div>

        {href !== "#" && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold transition-all hover:-translate-y-0.5 md:text-xs ${
              dark
                ? "bg-primary-600 text-white shadow-cta hover:bg-primary-700"
                : "bg-white text-primary-700 shadow-soft-sm ring-1 ring-primary-200 hover:bg-primary-50"
            }`}
          >
            {slide.buttonText || t("homeCompare.featuredBrand.cta")}
            <ArrowRight className="h-3 w-3" />
          </a>
        )}

        {dark && (
          <SlideDots
            count={count}
            active={active}
            onSelect={setActive}
            ariaLabel={(index) => t("homeCompare.hero.slideAria", { index })}
          />
        )}
      </div>
    </section>
  );
}

/** Dark editorial card pointing at the room/category inspiration. */
export function RoomsCard({ image, href = "/categorie" }: { image?: string | null; href?: string }) {
  const { t } = useLanguage();

  return (
    <Link
      href={href}
      className="group relative flex min-h-[150px] flex-col justify-center overflow-hidden rounded-2xl bg-gray-900 p-5 shadow-depth-2 md:min-h-[168px]"
    >
      <div className="absolute inset-y-0 right-0 w-[52%]">
        <PlaceholderImage
          src={image}
          alt=""
          fill
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"
        />
      </div>

      <div className="relative z-10 max-w-[62%]">
        <h2 className="font-display text-base leading-tight text-white md:text-lg">
          {t("homeCompare.rooms.title")}
        </h2>
        <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-white/70">
          {t("homeCompare.rooms.subtitle")}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-bold text-gray-900 transition-colors group-hover:bg-white">
          {t("homeCompare.rooms.cta")}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

/** The three-reason value proposition next to the rooms card. */
export function WhyCompareCard() {
  const { t } = useLanguage();

  const reasons = [
    { icon: Tag, title: t("homeCompare.why.priceTitle"), text: t("homeCompare.why.priceText") },
    {
      icon: BadgeCheck,
      title: t("homeCompare.why.reviewsTitle"),
      text: t("homeCompare.why.reviewsText"),
    },
    {
      icon: Sparkles,
      title: t("homeCompare.why.choiceTitle"),
      text: t("homeCompare.why.choiceText"),
    },
  ];

  return (
    <div className="flex min-h-[150px] flex-col justify-center rounded-2xl bg-primary-50/70 p-5 ring-1 ring-primary-100 md:min-h-[168px]">
      <h2 className="text-[15px] font-bold text-gray-900">{t("homeCompare.why.title")}</h2>

      <ul className="mt-3 space-y-2.5">
        {reasons.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
              <Icon className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-900">{title}</span>
              <span className="block text-[10px] leading-snug text-gray-500">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Right-rail brand placement. */
export function FeaturedBrandCard({ slide }: { slide: PromoSlide }) {
  const { t } = useLanguage();
  const href = normalizeLink(slide.link);
  const Wrapper = href === "#" ? "div" : "a";

  return (
    <Wrapper
      {...(href === "#" ? {} : { href, target: "_blank", rel: "noopener noreferrer" })}
      className="group relative flex min-h-[190px] flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 p-4 shadow-depth-2"
    >
      <PlaceholderImage
        src={slide.image}
        alt=""
        fill
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/55 to-gray-900/10"
      />

      <AdChip label={t("homeCompare.featuredBrand.label")} className="absolute left-3 top-3" />

      <div className="relative z-10">
        {slide.title && (
          <h2 className="font-display text-base leading-tight text-white">{slide.title}</h2>
        )}
        {slide.subtitle && (
          <p className="mt-1 line-clamp-2 text-[10px] text-white/70">{slide.subtitle}</p>
        )}
        <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-gray-900 transition-colors group-hover:bg-white">
          {slide.buttonText || t("homeCompare.featuredBrand.cta")}
          <ArrowRight className="h-2.5 w-2.5" />
        </span>
      </div>
    </Wrapper>
  );
}

/** Compact newsletter sign-up for the right rail. */
export function RailNewsletterCard() {
  const { t } = useLanguage();

  return (
    <HomeCard className="bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
        <h2 className="text-[13px] font-bold text-gray-900">
          {t("homeCompare.railNewsletter.title")}
        </h2>
      </div>
      <p className="mt-1 text-[10px] text-gray-500">{t("homeCompare.railNewsletter.subtitle")}</p>

      <NewsletterForm
        formClassName="mt-3 flex gap-1.5"
        inputClassName="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        buttonClassName="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-primary-700"
      />
    </HomeCard>
  );
}
