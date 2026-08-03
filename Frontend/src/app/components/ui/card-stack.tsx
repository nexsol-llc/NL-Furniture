"use client";

// CardStack — a draggable deck of editorial cards. The deck peeks upward behind
// the front card and each card carries its title in the bottom-left corner over
// a gradient scrim. Used for the home-page Magazine section.
//
// NL FURNITURE changes on top of the upstream 21st.dev component:
//  - imports from `motion/react` (this repo ships `motion` v12, not framer-motion),
//  - one light theme only — the site has no dark mode, so the original dark/light
//    toggle, grid backdrop and hint bar are gone and the controls follow the
//    admin primary-* theme instead,
//  - the deck is driven by a rotation counter instead of a mutated array, so DOM
//    order stays stable and an async `items` fetch can't desync the dot indicator,
//  - drag is horizontal with `touch-action: pan-y`, so a vertical swipe on a phone
//    still scrolls the page (same rule as CardFanCarousel),
//  - `prefers-reduced-motion` drops the drag and the spring in favour of the arrows,
//  - cards link to their article and fall back to PlaceholderImage when a
//    thumbnail is missing.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { useLanguage } from "@/providers/languageContext";

export interface CardStackItem {
  id: string | number;
  title: string;
  image?: string | null;
  /** Small line under the title (e.g. an article teaser). */
  subtitle?: string;
  /** Uppercase eyebrow above the title. */
  category?: string;
  /** Internal href; omit to render a non-clickable card. */
  href?: string;
}

interface CardStackProps {
  items: CardStackItem[];
  /** Shown in place of the deck when `items` is empty. Renders nothing if unset. */
  emptyLabel?: string;
  className?: string;
}

/** Cards deeper than this collapse onto the last visible slot and fade out, so
 *  the deck looks the same whether it holds 4 articles or 40. */
const VISIBLE_DEPTH = 3;
const OFFSET = 4;        // % of card height each card peeks above the one in front
const SCALE_STEP = 0.045;
const DIM_STEP = 0.1;
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;
const EXIT_MS = 160;

const SPRING = { type: "spring" as const, stiffness: 170, damping: 26 };

const ARROW_CLASSES =
  "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 bg-white/90 backdrop-blur text-gray-600 shadow-soft-md shrink-0 outline-none hover:bg-white hover:text-gray-900 hover:border-gray-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40 disabled:pointer-events-none transition";

export default function CardStack({ items, emptyLabel, className = "" }: CardStackProps) {
  const { t } = useLanguage();
  const reduced = useReducedMotion();

  // Which item sits at the front: `rotation mod items.length`. Kept as a plain
  // counter so it survives `items` changing length between renders.
  const [rotation, setRotation] = useState(0);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set once a drag actually starts, so releasing a swipe doesn't also follow
  // the card's link.
  const dragged = useRef(false);

  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-240, 0, 240], [-7, 0, 7]);

  const total = items.length;

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  // Forward: fade the front card out, then deal it to the bottom of the deck.
  const next = useCallback(() => {
    if (total < 2 || exitTimer.current) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setRotation((r) => r + 1);
      setExiting(false);
      exitTimer.current = null;
    }, reduced ? 0 : EXIT_MS);
  }, [total, reduced]);

  // Backward: no fade — the card behind travels forward onto the top of the deck.
  const prev = useCallback(() => {
    if (total < 2 || exitTimer.current) return;
    setRotation((r) => r - 1);
  }, [total]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    dragX.set(0);
    const far = Math.abs(info.offset.x) >= SWIPE_DISTANCE;
    const fast = Math.abs(info.velocity.x) >= SWIPE_VELOCITY;
    if (!far && !fast) return;
    if ((far ? info.offset.x : info.velocity.x) < 0) next();
    else prev();
  };

  if (!total) {
    if (!emptyLabel) return null;
    return (
      <div className={`flex items-center justify-center h-40 text-sm text-gray-400 ${className}`}>
        {emptyLabel}
      </div>
    );
  }

  const frontIndex = ((rotation % total) + total) % total;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full max-w-[38rem] aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/11] select-none">
        <ul className="relative w-full h-full m-0 p-0 list-none">
          {items.map((item, i) => {
            const slot = ((i - rotation) % total + total) % total; // 0 = front
            const isFront = slot === 0;
            const depth = Math.min(slot, VISIBLE_DEPTH);
            const buried = slot > VISIBLE_DEPTH;
            const canDrag = isFront && !reduced && total > 1;

            const body = (
              <>
                <PlaceholderImage
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover pointer-events-none select-none"
                  sizes="(max-width: 640px) 90vw, 38rem"
                />

                {/* Scrim — keeps the bottom-left title readable on any photo. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Title block, bottom-left. */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-left">
                  {item.category && (
                    <p className="mb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300">
                      {item.category}
                    </p>
                  )}
                  <h3 className="font-display text-lg sm:text-2xl leading-snug text-white line-clamp-2">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/75 line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}
                  {isFront && item.href && (
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                      {t("common.readMore")}
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  )}
                </div>
              </>
            );

            return (
              <motion.li
                key={item.id}
                aria-hidden={!isFront}
                className="group absolute inset-x-0 top-0 h-full overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5"
                style={{
                  touchAction: "pan-y",
                  cursor: canDrag ? "grab" : "default",
                  rotate: canDrag ? rotate : 0,
                  transformPerspective: 1000,
                }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{
                  top: `${-depth * OFFSET}%`,
                  scale: 1 - depth * SCALE_STEP,
                  filter: `brightness(${1 - depth * DIM_STEP})`,
                  opacity: buried || (isFront && exiting) ? 0 : 1,
                  zIndex: total - slot,
                  boxShadow: isFront
                    ? "0 24px 60px -12px rgba(15,23,42,0.28)"
                    : "0 12px 32px -6px rgba(15,23,42,0.16)",
                }}
                transition={reduced ? { duration: 0.2 } : SPRING}
                drag={canDrag ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onPointerDown={() => { dragged.current = false; }}
                onDragStart={() => { dragged.current = true; }}
                onDrag={(_, info) => dragX.set(info.offset.x)}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: "grabbing", scale: 1.02 }}
              >
                {isFront && item.href ? (
                  <Link
                    href={item.href}
                    draggable={false}
                    className="block h-full w-full"
                    onClick={(e) => { if (dragged.current) e.preventDefault(); }}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full w-full" tabIndex={-1}>{body}</div>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>

      {total > 1 && (
        <div className="mt-6 md:mt-8 flex items-center justify-center gap-4">
          <button type="button" className={ARROW_CLASSES} onClick={prev} aria-label={t("infiniteSlider.prevAriaLabel")}>
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          </button>

          <div className="flex max-w-[50vw] flex-wrap items-center justify-center gap-2">
            {items.map((item, i) => (
              <span
                key={item.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === frontIndex ? "w-6 bg-primary-600" : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button type="button" className={ARROW_CLASSES} onClick={next} aria-label={t("infiniteSlider.nextAriaLabel")}>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
