"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard } from "./HomeUi";
import { LOCALE_TAG } from "@/lib/languageDefaults";
import { useLanguage } from "@/providers/languageContext";

export interface InspirationItem {
  _id: string;
  title: string;
  category?: string;
  thumbnail?: string;
  heroImage?: string;
  createdAt?: string;
}

/** Latest API-ordered magazine posts in a responsive, swipeable editorial rail. */
export default function InspirationRail({ items }: { items: InspirationItem[] }) {
  const { language, t } = useLanguage();
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
    const visibleCapacity = window.matchMedia("(min-width: 1280px)").matches
      ? 4
      : window.matchMedia("(min-width: 1024px)").matches
        ? 3
        : window.matchMedia("(min-width: 640px)").matches
          ? 2
          : 1;
    setScrollState({
      canScroll: items.length > visibleCapacity,
      atStart: element.scrollLeft <= 2,
      atEnd: element.scrollLeft >= maxScrollLeft - 2,
    });
  }, [items.length]);

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
  }, [items.length, updateScrollState]);

  const scrollArticles = (direction: -1 | 1) => {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.round(element.clientWidth * 0.88),
      behavior: "smooth",
    });
  };

  return (
    <HomeCard className="overflow-hidden rounded-[20px] border-gray-200/90 p-5 shadow-soft-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="min-w-0 text-[15px] font-bold text-gray-900 sm:text-base">
          {t("homeCompare.inspiration.title")}
        </h2>
        <Link
          href="/magazine"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md text-[10px] font-semibold text-primary-600 transition-colors duration-200 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:text-[11px]"
        >
          {t("homeCompare.inspiration.viewAll")}
          <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">
          {t("homeCompare.inspiration.empty")}
        </p>
      ) : (
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {scrollState.canScroll && (
            <ArticleControl
              direction="previous"
              label={t("homeCompare.inspiration.prev")}
              disabled={scrollState.atStart}
              onClick={() => scrollArticles(-1)}
            />
          )}

          <div
            ref={scroller}
            className="hide-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-1"
          >
            {items.map((item) => (
              <ArticleCard
                key={item._id}
                item={item}
                date={formatPublicationDate(item.createdAt, LOCALE_TAG[language])}
                imageFallbackAlt={t("homeCompare.inspiration.imageAlt")}
              />
            ))}
          </div>

          {scrollState.canScroll && (
            <ArticleControl
              direction="next"
              label={t("homeCompare.inspiration.next")}
              disabled={scrollState.atEnd}
              onClick={() => scrollArticles(1)}
            />
          )}
        </div>
      )}
    </HomeCard>
  );
}

function ArticleCard({
  item,
  date,
  imageFallbackAlt,
}: {
  item: InspirationItem;
  date: string;
  imageFallbackAlt: string;
}) {
  return (
    <Link
      href={`/blog/${item._id}`}
      className="group flex min-h-[226px] basis-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-[13px] border border-gray-200/90 bg-gray-50/70 shadow-[0_3px_12px_-10px_rgba(15,23,42,0.2)] transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-primary-200 hover:shadow-[0_10px_22px_-12px_rgba(15,23,42,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] xl:basis-[calc((100%-3rem)/4)]"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-t-[12px] bg-gray-100">
        <PlaceholderImage
          src={item.thumbnail || item.heroImage}
          alt={item.title || imageFallbackAlt}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
          className="h-full w-full object-cover transition-transform duration-[220ms] group-hover:scale-[1.03]"
          iconClassName="h-1/4 w-1/4"
        />
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {item.category && (
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.08em] text-primary-600">
            {item.category}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-8 text-[12px] font-semibold leading-4 text-gray-900 transition-colors duration-200 group-hover:text-primary-700">
          {item.title}
        </h3>
        {date && <time dateTime={item.createdAt} className="mt-auto pt-2 text-[9px] text-gray-400">{date}</time>}
      </div>
    </Link>
  );
}

function ArticleControl({
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-soft transition-all duration-200 hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-40"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function formatPublicationDate(value: string | undefined, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
