"use client";

// CardFanCarousel — a GSAP-driven "hand of cards" fan.
//
// Cards are absolutely stacked inside `.fan-layout` and placed purely by GSAP
// transforms (see FAN_POSITIONS); the sizing/height of `.fan-layout`/`.fan-card`
// lives in globals.css and the two must stay in sync — `getHeightMultiplier()`
// below assumes the same breakpoint heights the CSS declares.
//
// NL FURNITURE additions on top of the upstream 21st.dev component:
//  - the arrows always cycle which card is the front/main one, not just when
//    there are more cards than fan slots,
//  - the fan uses an odd number of slots so exactly one card is dead center,
//  - the spread is measured against the container instead of hardcoded per
//    breakpoint, so the outer cards never get clipped at any width,
//  - light-theme arrows/dots that follow the admin primary-* theme (the site has
//    no dark mode, so the original dark: variants would have made the controls
//    invisible for visitors whose OS prefers dark),
//  - touch swipe + localized aria-labels,
//  - `prefers-reduced-motion` collapses the elastic entry and disables the
//    hover fan-out,
//  - the visible-slot map no longer depends on the `cards` array identity, so a
//    parent re-render can't replay the entry animation.

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useLanguage } from "@/providers/languageContext";

export interface CardItem {
  imgUrl: string;
  alt?: string;
  linkUrl?: string;
}

interface CardFanCarouselProps {
  cards: CardItem[];
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7,  scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
  { rot: 7,   scale: 0.9346, x: 11,  y: 1.3, zIndex: 3 },
  { rot: 14,  scale: 0.8498, x: 22,  y: 4.0, zIndex: 2 },
  { rot: 21,  scale: 0.7756, x: 30,  y: 7.3, zIndex: 1 },
];

/** |x| of the outermost slot, and its scale, at full spread. */
const OUTER_X_REM = 30;
const OUTER_SCALE = 0.7756;
/** Vertical arc damping — keeps the outer cards inside the (short) container. */
const ARC = 0.7;

/**
 * How far the fan spreads sideways, measured so the outermost card always fits
 * inside the container: 1.0 on a wide desktop, ~0.22 on a phone. Measuring
 * beats fixed per-breakpoint values, which clipped the outer cards at the
 * widths between the breakpoints.
 */
function getSpread(container: HTMLElement, card: HTMLElement) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const room = container.clientWidth / 2 - (card.offsetWidth * OUTER_SCALE) / 2 - 4;
  return Math.max(0.2, Math.min(1, room / (OUTER_X_REM * rem)));
}

/**
 * Returns a multiplier (0..1] that scales y-offsets and entry animation
 * distances when the viewport is too short for the ideal layout height.
 */
function getHeightMultiplier(width: number) {
  // Ideal layout heights (in px at 16px root) matching the .fan-layout
  // breakpoints in globals.css.
  let idealPx: number;
  if (width < 480) idealPx = 16 * 16;       // 256px
  else if (width < 640) idealPx = 18 * 16;  // 288px
  else if (width < 768) idealPx = 20 * 16;  // 320px
  else if (width < 1024) idealPx = 24 * 16; // 384px
  else idealPx = 28 * 16;                    // 448px

  const available = window.innerHeight * 0.7; // 70vh budget
  if (available >= idealPx) return 1;
  return available / idealPx;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Fewer cards than slots: sample the same fan curve symmetrically around its
 * middle. Slot counts are always odd (see `slotCount` below), so this lands on
 * exact table entries — the interpolation is just a safety net.
 */
function getSlotConfig(slotCount: number, slot: number) {
  if (slotCount >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const pos = HALF + (slot - (slotCount - 1) / 2);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, MAX_VISIBLE - 1);
  const t = pos - lo;
  const a = FAN_POSITIONS[lo];
  const b = FAN_POSITIONS[hi];
  return {
    rot: lerp(a.rot, b.rot, t),
    scale: lerp(a.scale, b.scale, t),
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    zIndex: Math.round(lerp(a.zIndex, b.zIndex, t)),
  };
}

const ARROW_CLASSES =
  "relative flex items-center justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur text-gray-600 shadow-soft-md cursor-pointer shrink-0 z-30 outline-none hover:bg-white hover:text-gray-900 hover:border-gray-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500 transition";

export default function CardFanCarousel({ cards }: CardFanCarouselProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevSlots = useRef<Map<number, number>>(new Map());
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const totalCards = cards.length;
  // Always an odd number of slots so exactly one card sits front-and-center as
  // "the main image". An even card count parks one card off-fan; the arrows
  // rotate it in, same as the 8th+ card does.
  const slotCount = totalCards >= MAX_VISIBLE ? MAX_VISIBLE : totalCards % 2 ? totalCards : totalCards - 1;
  const centerSlot = (slotCount - 1) / 2;
  const canCycle = totalCards > 1;

  // Index of the card currently in the middle slot. Starts at the first gadget.
  const [centerIndex, setCenterIndex] = useState(0);

  // card index -> slot. Keyed off the count only, so a new `cards` array with
  // the same length doesn't restart the animation.
  const getVisibleMap = useCallback((center: number) => {
    const map = new Map<number, number>();
    for (let slot = 0; slot < slotCount; slot++) {
      map.set(((center + slot - centerSlot) % totalCards + totalCards) % totalCards, slot);
    }
    return map;
  }, [totalCards, slotCount, centerSlot]);

  // Jump straight to a card (dots). Bailing on the current index matters: React
  // skips the re-render when the state doesn't change, so the effect that clears
  // `isAnimating` would never run and the carousel would lock up.
  const goTo = useCallback((next: number) => {
    const target = ((next % totalCards) + totalCards) % totalCards;
    if (isAnimating.current || !canCycle || target === centerIndex) return;
    isAnimating.current = true;
    directionRef.current = target > centerIndex ? "right" : "left";
    setCenterIndex(target);
  }, [totalCards, canCycle, centerIndex]);

  const cycle = useCallback((direction: "left" | "right") => {
    if (isAnimating.current || !canCycle) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex(prev =>
      direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
    );
  }, [totalCards, canCycle]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(container.querySelectorAll<HTMLElement>(".fan-card"));
    if (!cardElements.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visibleMap = getVisibleMap(centerIndex);
    const previousSlots = prevSlots.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const spread = getSpread(container, cardElements[0]);
    const hMult = getHeightMultiplier(window.innerWidth);
    // The arc follows the horizontal spread: on phones the fan is squeezed to
    // roughly a quarter of its width, so undamped y-offsets would drop the
    // outer cards straight out of the (much shorter) container.
    const arc = spread * hMult * ARC;
    const config = (slot: number) => getSlotConfig(slotCount, slot);
    // Off-fan cards fly in/out proportionally to the fan's own width.
    const travel = Math.max(12, OUTER_X_REM * spread);

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const prevSlot = previousSlots.get(cardIndex);
      const wasVisible = prevSlot !== undefined;
      // Every card visible at once (odd count <= 7): the edge card wraps to the
      // far side. Sweeping it across the whole fan reads as a glitch, so treat a
      // wrap like an exit + re-entry instead.
      const wrapped = slot !== undefined && prevSlot !== undefined && Math.abs(slot - prevSlot) > 1;

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * spread}rem`,
          y: `${y * arc}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, {
            x: 0,
            y: reduced ? 0 : `${6 * hMult}rem`,
            rotation: 0,
            scale: reduced ? scale : 0.5,
            opacity: 0,
          });
          gsap.to(card, {
            ...target,
            duration: reduced ? 0.25 : 1.2,
            ease: reduced ? "power1.out" : "elastic.out(1.05,.78)",
            delay: reduced ? 0 : 0.2 + slot * 0.06,
            onComplete: onCardDone,
          });
        } else if (!wasVisible || wrapped) {
          const entry = {
            x: reduced ? target.x : `${direction === "right" ? travel : -travel}rem`,
            y: `${y * arc}rem`,
            rotation: reduced ? rot : direction === "right" ? 30 : -30,
            scale: reduced ? scale : 0.5,
            opacity: 0,
          };
          if (wrapped && !reduced) {
            // Dissolve where it stands, then sweep back in from the other side.
            gsap.timeline({ onComplete: onCardDone })
              .set(card, { zIndex: 0 })
              .to(card, { opacity: 0, scale: 0.6, duration: 0.18, ease: "power2.in" })
              .set(card, entry)
              .to(card, { ...target, duration: 0.5, ease: "power2.out" });
          } else {
            gsap.set(card, entry);
            gsap.to(card, { ...target, duration: reduced ? 0.25 : 0.6, ease: "power2.out", onComplete: onCardDone });
          }
        } else {
          gsap.to(card, { ...target, duration: reduced ? 0.25 : 0.5, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        gsap.to(card, {
          x: reduced ? 0 : `${direction === "right" ? -travel : travel}rem`,
          opacity: 0,
          scale: 0.5,
          rotation: reduced ? 0 : direction === "right" ? -30 : 30,
          duration: reduced ? 0.2 : 0.4,
          ease: "power2.in",
          zIndex: 0,
        });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevSlots.current = new Map(visibleMap);

    // ── Hover interactions (pointer devices only) ────────────────────────────
    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      const s = getSpread(container, cardElements[0]);
      const hM = getHeightMultiplier(window.innerWidth);
      const arcM = s * hM * ARC;

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * s;
        let targetY = base.y * arcM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 2 * hM;
            targetScale *= 1.08;
          } else {
            const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength = 8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));

            if (slot < hoveredSlot) {
              targetX -= pushStrength * s;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * s;
              targetRot += 3 / (distance + 1);
            }

            if (slot === visibleEntries.length - 1 && hoveredSlot < centerSlot) targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot) targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`, y: `${targetY}rem`, rotation: targetRot, scale: targetScale,
          duration: 0.5, delay, ease: "elastic.out(1,.75)", overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    };

    // Skip the hover fan-out on touch screens (a tap would otherwise leave the
    // pushed-apart layout stuck until the next cycle) and under reduced motion.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const enterHandlers =
      canHover && !reduced
        ? visibleEntries.map(({ el, slot }) => {
            const handler = () => {
              if (isAnimating.current) return;
              if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
              if (activeSlot !== slot) { activeSlot = slot; updateHoverLayout(slot); }
            };
            el.addEventListener("mouseenter", handler);
            return { el, handler };
          })
        : [];

    const onMouseLeave = () => {
      if (isAnimating.current || activeSlot === null) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { activeSlot = null; updateHoverLayout(null); }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    // Re-place the cards when the container resizes (breakpoint change, rotate).
    const onResize = () => { if (!isAnimating.current) updateHoverLayout(activeSlot); };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, slotCount, centerSlot, getVisibleMap]);

  // ── Swipe (mobile) — vertical drags stay page scrolls ──────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !canCycle) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    cycle(dx < 0 ? "right" : "left");
  };

  if (!totalCards) return null;

  const chevron = (direction: "left" | "right") => (
    <svg className="relative z-[2] w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  return (
    <section className="flex flex-col items-center w-full py-2 md:py-4 px-4 md:px-8 relative z-20">
      <div className="flex items-center justify-center w-full max-w-[90rem]">
        <div
          ref={containerRef}
          className="fan-layout flex relative justify-center items-center w-full max-w-[80rem]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {cards.map((card, index) => {
            const image = (
              <div className="relative w-full h-full overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imgUrl}
                  loading="lazy"
                  alt={card.alt || t("infiniteSlider.imageAlt")}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />
              </div>
            );
            return card.linkUrl ? (
              <a
                key={index}
                href={card.linkUrl}
                target={card.linkUrl.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="fan-card block cursor-pointer"
              >
                {image}
              </a>
            ) : (
              <div key={index} className="fan-card">{image}</div>
            );
          })}
        </div>
      </div>

      {canCycle && (
        <div className="flex items-center justify-center gap-4 mt-3 md:mt-4 z-30">
          <button className={`${ARROW_CLASSES} w-10 h-10 md:w-11 md:h-11`} onClick={() => cycle("left")} aria-label={t("infiniteSlider.prevAriaLabel")}>
            {chevron("left")}
          </button>
          <div className="flex items-center flex-wrap justify-center max-w-[50vw]">
            {cards.map((_, i) => (
              // p-1.5 keeps a ~20px tap target around the 8px dot on mobile.
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${t("infiniteSlider.imageAlt")} ${i + 1}`}
                aria-current={i === centerIndex}
                className="p-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <span
                  className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    i === centerIndex ? "bg-primary-600 scale-[1.3]" : "bg-gray-400/60 hover:bg-gray-500"
                  }`}
                />
              </button>
            ))}
          </div>
          <button className={`${ARROW_CLASSES} w-10 h-10 md:w-11 md:h-11`} onClick={() => cycle("right")} aria-label={t("infiniteSlider.nextAriaLabel")}>
            {chevron("right")}
          </button>
        </div>
      )}
    </section>
  );
}
